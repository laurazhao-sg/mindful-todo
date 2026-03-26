const express = require('express')
const { getDb } = require('../db')

const router = express.Router()

// GET /api/user/profile
router.get('/profile', (req, res) => {
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = 1').get()
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// PUT /api/user/profile
router.put('/profile', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM users WHERE id = 1').get()
  if (!existing) return res.status(404).json({ error: 'User not found' })

  const { name = existing.name, avatar = existing.avatar, membership = existing.membership } =
    req.body

  db.prepare(
    "UPDATE users SET name=?, avatar=?, membership=?, updated_at=datetime('now') WHERE id=1"
  ).run(name, avatar, membership)

  const user = db.prepare('SELECT * FROM users WHERE id = 1').get()
  res.json(user)
})

// GET /api/user/stats
router.get('/stats', (req, res) => {
  const db = getDb()

  const totalCompleted = db
    .prepare('SELECT COUNT(*) AS cnt FROM tasks WHERE completed = 1')
    .get().cnt

  const totalPending = db
    .prepare('SELECT COUNT(*) AS cnt FROM tasks WHERE completed = 0')
    .get().cnt

  // Focus logs for the last 7 days
  const focusLogs = db
    .prepare(
      `SELECT date, minutes FROM focus_logs
       WHERE user_id = 1
       ORDER BY date DESC
       LIMIT 7`
    )
    .all()
    .reverse()

  const weeklyMinutes = focusLogs.reduce((sum, l) => sum + l.minutes, 0)

  // Calculate streak: consecutive days with completed tasks or focus time
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const log = db
      .prepare('SELECT minutes FROM focus_logs WHERE user_id = 1 AND date = ?')
      .get(dateStr)
    if (log && log.minutes > 0) {
      streak++
    } else {
      break
    }
  }

  res.json({
    totalCompleted,
    totalPending,
    weeklyFocusHours: +(weeklyMinutes / 60).toFixed(1),
    focusLogs,
    streak,
  })
})

// POST /api/user/focus  — log focus time
router.post('/focus', (req, res) => {
  const db = getDb()
  const { date, minutes } = req.body
  if (!date || minutes === undefined) {
    return res.status(400).json({ error: 'date and minutes are required' })
  }

  const existing = db
    .prepare('SELECT * FROM focus_logs WHERE user_id = 1 AND date = ?')
    .get(date)

  if (existing) {
    db.prepare('UPDATE focus_logs SET minutes = minutes + ? WHERE id = ?').run(
      minutes,
      existing.id
    )
  } else {
    db.prepare('INSERT INTO focus_logs (user_id, date, minutes) VALUES (1, ?, ?)').run(
      date,
      minutes
    )
  }

  res.json({ success: true })
})

module.exports = router
