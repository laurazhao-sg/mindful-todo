const express = require('express')
const cors = require('cors')
const path = require('path')
const taskRoutes = require('./routes/tasks')
const userRoutes = require('./routes/user')
const expenseRoutes = require('./routes/expenses')

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
app.use(express.static(distPath))

app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Mindful Todo] Running on http://0.0.0.0:${PORT}`)
})
