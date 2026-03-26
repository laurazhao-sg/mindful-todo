const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, 'mindful_todo.db')

let db

function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
    seedIfEmpty()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL DEFAULT 'Laura',
      avatar     TEXT    DEFAULT '',
      membership TEXT    DEFAULT '高级订阅会员',
      joined_at  TEXT    DEFAULT '2023-03-01',
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      category    TEXT    NOT NULL DEFAULT 'work',
      priority    TEXT    NOT NULL DEFAULT 'medium',
      time        TEXT    DEFAULT '',
      date        TEXT    DEFAULT '今天',
      completed   INTEGER DEFAULT 0,
      important   INTEGER DEFAULT 0,
      description TEXT    DEFAULT '',
      tags        TEXT    DEFAULT '[]',
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id    INTEGER NOT NULL,
      title      TEXT    NOT NULL,
      completed  INTEGER DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS focus_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL DEFAULT 1,
      date       TEXT    NOT NULL,
      minutes    INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT    NOT NULL,
      category   TEXT    NOT NULL DEFAULT '其他',
      item       TEXT    NOT NULL,
      amount     REAL    NOT NULL DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `)
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM tasks').get().cnt
  if (count > 0) return

  // Seed user
  db.prepare(`
    INSERT INTO users (name, membership, joined_at) VALUES (?, ?, ?)
  `).run('Laura', '高级订阅会员', '2023-03-01')

  // Seed tasks
  const insertTask = db.prepare(`
    INSERT INTO tasks (title, category, priority, time, date, completed, important, description, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSubtask = db.prepare(`
    INSERT INTO subtasks (task_id, title, completed) VALUES (?, ?, ?)
  `)

  const seedData = db.transaction(() => {
    insertTask.run('准备下周的项目提案报告', 'work', 'high', '14:30', '今天', 0, 1, '', '[]', '2024-05-24')
    insertTask.run('回复投资人的确认邮件', 'work', 'high', '10:00', '今天', 0, 1, '', '[]', '2024-05-20')
    insertTask.run('晚间冥想 15 分钟', 'health', 'low', '21:00', '今天', 0, 0, '', '[]', '2024-05-22')
    insertTask.run('预约周末的牙科检查', 'life', 'medium', '16:00', '今天', 0, 0, '', '[]', '2024-05-23')
    insertTask.run('更新作品集案例', 'work', 'medium', '18:30', '今天', 0, 0, '', '[]', '2024-05-21')

    const desc = '目前的品牌视觉过于零碎，需要通过这套指南来统一所有渠道的视觉输出。\n\n特别关注配色系统在暗色模式下的可读性，以及书法字体与现代无衬线字体的平衡。参考 1970 年代的日本海报设计。'
    const info = insertTask.run('重新设计品牌视觉指南系统', 'personal', 'high', '18:30', '今天', 0, 0, desc, '["design","brand"]', '2024-05-24')
    const taskId = info.lastInsertRowid

    insertSubtask.run(taskId, '收集目前的视觉资产库', 1)
    insertSubtask.run(taskId, '定义核心调色板与中性色比例', 1)
    insertSubtask.run(taskId, '选择配套的中文字体（衬线与黑体）', 0)
    insertSubtask.run(taskId, '设计移动端与网页端的网格系统', 0)
    insertSubtask.run(taskId, '准备最终演示文档', 1)

    insertTask.run('购买新鲜水果', 'life', 'low', '', '今天', 1, 0, '', '[]', '2024-05-24')
    insertTask.run('晨间运动 30 分钟', 'health', 'medium', '', '今天', 1, 0, '', '[]', '2024-05-24')
    insertTask.run('洗车', 'life', 'low', '', '今天', 1, 0, '', '[]', '2024-05-24')

    // Seed focus logs for the week
    const today = new Date()
    const durations = [95, 160, 210, 135, 240, 70, 180]
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      db.prepare('INSERT INTO focus_logs (user_id, date, minutes) VALUES (1, ?, ?)').run(dateStr, durations[6 - i])
    }

    // Seed expenses
    const insertExpense = db.prepare(
      'INSERT INTO expenses (date, category, item, amount) VALUES (?, ?, ?, ?)'
    )
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    insertExpense.run(todayStr, '餐饮', '早餐 - 豆浆油条', 12)
    insertExpense.run(todayStr, '餐饮', '午餐 - 外卖沙拉', 35)
    insertExpense.run(todayStr, '交通', '地铁通勤', 6)
    insertExpense.run(todayStr, '购物', '超市水果蔬菜', 68.5)
    insertExpense.run(todayStr, '购物', '洗衣液', 29.9)
    insertExpense.run(todayStr, '娱乐', '视频会员月卡', 25)

    insertExpense.run(yesterdayStr, '餐饮', '早餐 - 面包咖啡', 28)
    insertExpense.run(yesterdayStr, '餐饮', '午餐 - 公司食堂', 18)
    insertExpense.run(yesterdayStr, '餐饮', '晚餐 - 火锅', 156)
    insertExpense.run(yesterdayStr, '交通', '打车回家', 32)
    insertExpense.run(yesterdayStr, '购物', '日用品 - 纸巾牙膏', 45.8)
    insertExpense.run(yesterdayStr, '医疗', '感冒药', 36)
  })

  seedData()
}

module.exports = { getDb }
