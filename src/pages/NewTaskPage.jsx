import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '../context/TaskContext'

const categories = [
  { id: 'work', label: '工作项目', icon: 'work' },
  { id: 'life', label: '个人生活', icon: 'person' },
  { id: 'shopping', label: '购物清单', icon: 'shopping_cart' },
]

const priorities = [
  { id: 'low', label: '低' },
  { id: 'medium', label: '中' },
  { id: 'high', label: '紧急' },
]

export default function NewTaskPage() {
  const navigate = useNavigate()
  const { addTask } = useTasks()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('work')
  const [priority, setPriority] = useState('medium')
  const [time, setTime] = useState('14:30')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await addTask({
        title: title.trim(),
        category,
        priority,
        time,
        date: '今天',
        important: priority === 'high',
        description: '',
        tags: [],
      })
      navigate('/')
    } catch (err) {
      console.error('Failed to create task:', err)
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors duration-300"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-on-surface">
            新建任务
          </h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="primary-gradient text-on-primary px-6 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <main className="min-h-screen pt-32 pb-12 px-8 max-w-2xl mx-auto" onKeyDown={handleKeyDown}>
        <section className="mb-16">
          <textarea
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-none resize-none text-4xl md:text-5xl font-headline font-medium placeholder:text-on-surface-variant/30 text-on-surface min-h-[160px] focus:outline-none focus:ring-0"
            placeholder="准备做什么？"
          />
        </section>

        <div className="space-y-12">
          <div>
            <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-4 ml-1">
              执行时间
            </label>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
                <span className="text-on-surface font-medium">今天</span>
              </button>
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-container-low">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">schedule</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="text-on-surface font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                />
              </div>
              <button className="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all">
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-4 ml-1">
              清单分类
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    category === cat.id
                      ? 'bg-primary-container text-on-primary-container ring-2 ring-primary/10'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${category === cat.id ? 'material-symbols-filled' : ''}`}
                  >
                    {cat.icon}
                  </span>
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-4 ml-1">
              优先级
            </label>
            <div className="flex items-center bg-surface-container-low p-1.5 rounded-2xl w-fit">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    priority === p.id
                      ? p.id === 'high'
                        ? 'bg-error-container/20 text-error-dim shadow-sm'
                        : 'bg-surface-container-lowest shadow-sm text-on-surface'
                      : p.id === 'high'
                        ? 'text-error-dim hover:bg-error-container/20'
                        : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 flex flex-col gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer group">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">notes</span>
              <span className="text-sm border-b border-transparent group-hover:border-primary/20 pb-0.5">
                添加详细备注或子任务...
              </span>
            </div>
            <div className="flex items-center gap-4 text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer group">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">sell</span>
              <span className="text-sm border-b border-transparent group-hover:border-primary/20 pb-0.5">
                添加标签 (#)
              </span>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed top-0 right-0 -z-10 w-1/3 h-screen bg-gradient-to-l from-surface-container-low/30 to-transparent pointer-events-none" />
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <footer className="fixed bottom-8 left-0 right-0 pointer-events-none flex justify-center">
        <div className="bg-on-surface/5 backdrop-blur-md px-4 py-2 rounded-full border border-on-surface/5 opacity-40">
          <p className="text-[11px] font-label text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">keyboard_command_key</span>
            <span>ENTER 快速保存</span>
          </p>
        </div>
      </footer>
    </>
  )
}
