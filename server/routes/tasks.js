const express = require('express')
const { getDb } = require('../db')

const router = express.Router()

// GET /api/tasks  — list all tasks with subtask counts
router.get('/', (req, res) => {
  const db = getDb()
  const { completed, important, date, category } = req.query

  let sql = 'SELECT * FROM tasks WHERE 1=1'
  const params = []

  if (completed !== undefined) {
    sql += ' AND completed = ?'
    params.push(Number(completed))
  }
  if (important !== undefined) {
    sql += ' AND important = ?'
    params.push(Number(important))
  }
  if (date) {
    sql += ' AND date = ?'
    params.push(date)
  }
  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }

  sql += ' ORDER BY important DESC, created_at DESC'

  const tasks = db.prepare(sql).all(...params)

  const subtaskStmt = db.prepare(
    'SELECT id, title, completed FROM subtasks WHERE task_id = ? ORDER BY id'
  )

  const result = tasks.map((task) => ({
    ...task,
    completed: Boolean(task.completed),
    important: Boolean(task.important),
    tags: JSON.parse(task.tags || '[]'),
    subtasks: subtaskStmt.all(task.id).map((s) => ({
      ...s,
      completed: Boolean(s.completed),
    })),
  }))

  res.json(result)
})

// GET /api/tasks/:id  — single task with subtasks
router.get('/:id', (req, res) => {
  const db = getDb()
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) return res.status(404).json({ error: 'Task not found' })

  const subtasks = db
    .prepare('SELECT id, title, completed FROM subtasks WHERE task_id = ? ORDER BY id')
    .all(task.id)
    .map((s) => ({ ...s, completed: Boolean(s.completed) }))

  res.json({
    ...task,
    completed: Boolean(task.completed),
    important: Boolean(task.important),
    tags: JSON.parse(task.tags || '[]'),
    subtasks,
  })
})

// POST /api/tasks  — create a new task
router.post('/', (req, res) => {
  const db = getDb()
  const {
    title,
    category = 'work',
    priority = 'medium',
    time = '',
    date = '今天',
    important = false,
    description = '',
    tags = [],
  } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' })
  }

  const info = db
    .prepare(
      `INSERT INTO tasks (title, category, priority, time, date, completed, important, description, tags)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`
    )
    .run(
      title.trim(),
      category,
      priority,
      time,
      date,
      important ? 1 : 0,
      description,
      JSON.stringify(tags)
    )

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({
    ...task,
    completed: false,
    important: Boolean(task.important),
    tags: JSON.parse(task.tags || '[]'),
    subtasks: [],
  })
})

// PUT /api/tasks/:id  — update a task
router.put('/:id', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Task not found' })

  const {
    title = existing.title,
    category = existing.category,
    priority = existing.priority,
    time = existing.time,
    date = existing.date,
    important = Boolean(existing.important),
    description = existing.description,
    tags,
  } = req.body

  const tagsJson = tags !== undefined ? JSON.stringify(tags) : existing.tags

  db.prepare(
    `UPDATE tasks
     SET title=?, category=?, priority=?, time=?, date=?, important=?, description=?, tags=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(title, category, priority, time, date, important ? 1 : 0, description, tagsJson, req.params.id)

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  const subtasks = db
    .prepare('SELECT id, title, completed FROM subtasks WHERE task_id = ? ORDER BY id')
    .all(task.id)
    .map((s) => ({ ...s, completed: Boolean(s.completed) }))

  res.json({
    ...task,
    completed: Boolean(task.completed),
    important: Boolean(task.important),
    tags: JSON.parse(task.tags || '[]'),
    subtasks,
  })
})

// PATCH /api/tasks/:id/toggle  — toggle completion
router.patch('/:id/toggle', (req, res) => {
  const db = getDb()
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) return res.status(404).json({ error: 'Task not found' })

  const newVal = task.completed ? 0 : 1
  db.prepare("UPDATE tasks SET completed=?, updated_at=datetime('now') WHERE id=?").run(
    newVal,
    req.params.id
  )

  res.json({ id: task.id, completed: Boolean(newVal) })
})

// DELETE /api/tasks/:id  — delete a task (cascades subtasks)
router.delete('/:id', (req, res) => {
  const db = getDb()
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) return res.status(404).json({ error: 'Task not found' })

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  res.json({ deleted: true, id: Number(req.params.id) })
})

// --- Subtask routes (nested under /api/tasks/:id/subtasks) ---

// POST /api/tasks/:id/subtasks  — add subtask
router.post('/:id/subtasks', (req, res) => {
  const db = getDb()
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) return res.status(404).json({ error: 'Task not found' })

  const { title } = req.body
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Subtask title is required' })
  }

  const info = db
    .prepare('INSERT INTO subtasks (task_id, title, completed) VALUES (?, ?, 0)')
    .run(req.params.id, title.trim())

  res.status(201).json({
    id: Number(info.lastInsertRowid),
    task_id: Number(req.params.id),
    title: title.trim(),
    completed: false,
  })
})

// PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle
router.patch('/:taskId/subtasks/:subtaskId/toggle', (req, res) => {
  const db = getDb()
  const sub = db
    .prepare('SELECT * FROM subtasks WHERE id = ? AND task_id = ?')
    .get(req.params.subtaskId, req.params.taskId)
  if (!sub) return res.status(404).json({ error: 'Subtask not found' })

  const newVal = sub.completed ? 0 : 1
  db.prepare('UPDATE subtasks SET completed = ? WHERE id = ?').run(newVal, sub.id)

  res.json({ id: sub.id, completed: Boolean(newVal) })
})

// DELETE /api/tasks/:taskId/subtasks/:subtaskId
router.delete('/:taskId/subtasks/:subtaskId', (req, res) => {
  const db = getDb()
  const sub = db
    .prepare('SELECT id FROM subtasks WHERE id = ? AND task_id = ?')
    .get(req.params.subtaskId, req.params.taskId)
  if (!sub) return res.status(404).json({ error: 'Subtask not found' })

  db.prepare('DELETE FROM subtasks WHERE id = ?').run(sub.id)
  res.json({ deleted: true, id: sub.id })
})

module.exports = router
