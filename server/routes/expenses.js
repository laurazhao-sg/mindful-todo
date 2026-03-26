const express = require('express')
const { getDb } = require('../db')

const router = express.Router()

// GET /api/expenses  — list expenses, optional ?date=YYYY-MM-DD filter
router.get('/', (req, res) => {
  const db = getDb()
  const { date } = req.query

  let sql = 'SELECT * FROM expenses'
  const params = []

  if (date) {
    sql += ' WHERE date = ?'
    params.push(date)
  }

  sql += ' ORDER BY date DESC, id DESC'
  const rows = db.prepare(sql).all(...params)
  res.json(rows)
})

// GET /api/expenses/summary  — daily totals, optional ?days=7
router.get('/summary', (req, res) => {
  const db = getDb()
  const days = Math.min(Number(req.query.days) || 30, 365)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const dailyTotals = db
    .prepare(
      `SELECT date, SUM(amount) AS total, COUNT(*) AS count
       FROM expenses
       WHERE date >= ?
       GROUP BY date
       ORDER BY date DESC`
    )
    .all(cutoffStr)

  const categoryTotals = db
    .prepare(
      `SELECT category, SUM(amount) AS total, COUNT(*) AS count
       FROM expenses
       WHERE date >= ?
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(cutoffStr)

  const grandTotal = dailyTotals.reduce((s, d) => s + d.total, 0)

  res.json({
    days,
    grandTotal: +grandTotal.toFixed(2),
    dailyTotals,
    categoryTotals,
  })
})

// POST /api/expenses  — add one expense
router.post('/', (req, res) => {
  const db = getDb()
  const { date, category = '其他', item, amount } = req.body

  if (!item || !item.trim()) return res.status(400).json({ error: 'item is required' })
  if (amount === undefined || isNaN(amount)) return res.status(400).json({ error: 'amount is required' })

  const dateVal = date || new Date().toISOString().split('T')[0]

  const info = db
    .prepare('INSERT INTO expenses (date, category, item, amount) VALUES (?, ?, ?, ?)')
    .run(dateVal, category, item.trim(), Number(amount))

  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json(row)
})

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT id FROM expenses WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Expense not found' })

  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id)
  res.json({ deleted: true, id: Number(req.params.id) })
})

module.exports = router
