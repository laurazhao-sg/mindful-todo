const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

console.log('[Boot] Starting Mindful Todo server...')
console.log('[Boot] Node version:', process.version)
console.log('[Boot] PORT:', process.env.PORT || 3001)

let taskRoutes, userRoutes, expenseRoutes
try {
  taskRoutes = require('./routes/tasks')
  userRoutes = require('./routes/user')
  expenseRoutes = require('./routes/expenses')
  console.log('[Boot] Routes loaded OK')
} catch (err) {
  console.error('[Boot] FATAL - Failed to load routes:', err.message)
  console.error(err.stack)
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/tasks', taskRoutes)
app.use('/api/user', userRoutes)
app.use('/api/expenses', expenseRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const distPath = path.resolve(__dirname, '..', 'dist')
console.log('[Boot] Static files from:', distPath, '| exists:', fs.existsSync(distPath))

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Mindful Todo] Running on http://0.0.0.0:${PORT}`)
})
