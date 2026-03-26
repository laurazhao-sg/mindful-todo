import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTasks } from '../context/TaskContext'
import { taskApi } from '../api'
import ZenCheckbox from '../components/ZenCheckbox'

const CATEGORY_LABELS = {
  work: '工作项目',
  life: '个人生活',
  health: '健康习惯',
  personal: '个人项目',
  shopping: '购物清单',
}

const PRIORITY_LABELS = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, toggleTask, toggleSubtask, addSubtask, deleteTask } = useTasks()
  const [newSubtask, setNewSubtask] = useState('')
  const [showSubtaskInput, setShowSubtaskInput] = useState(false)
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)

  // First try from context, then fetch from API
  useEffect(() => {
    const found = tasks.find((t) => String(t.id) === String(id))
    if (found) {
      setTask(found)
      setLoading(false)
    } else {
      taskApi
        .get(id)
        .then((t) => {
          setTask(t)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [id, tasks])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-headline text-2xl text-surface-dim mb-4">任务不存在</p>
          <button onClick={() => navigate('/')} className="text-primary font-medium">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length
  const totalSubtasks = task.subtasks.length
  const subtaskPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return
    try {
      await addSubtask(task.id, newSubtask.trim())
      setNewSubtask('')
      setShowSubtaskInput(false)
    } catch (err) {
      console.error('Failed to add subtask:', err)
    }
  }

  const handleDelete = async () => {
    await deleteTask(task.id)
    navigate('/')
  }

  const handleComplete = async () => {
    await toggleTask(task.id)
    navigate('/')
  }

  return (
    <>
      <header className="bg-surface sticky top-0 z-40 transition-colors duration-300">
        <div className="flex justify-between items-center w-full px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-all duration-200 active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline font-medium text-lg tracking-tight text-on-surface">
            任务详情
          </h1>
          <button className="text-on-surface/50 hover:bg-surface-container-low p-2 rounded-full transition-all duration-200">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 pt-4 pb-32">
        {/* Header */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-xs font-label tracking-widest uppercase rounded-full">
              {CATEGORY_LABELS[task.category] || task.category}
            </span>
            <span className="text-on-surface-variant/40 text-xs font-label">·</span>
            <span className="text-on-surface-variant text-xs font-label tracking-wide">
              创建于 {task.created_at?.split('T')[0] || task.created_at}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface leading-tight mb-8">
            {task.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.time && (
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-primary">alarm</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-0.5">
                    提醒时间
                  </p>
                  <p className="font-medium">
                    {task.date}, {task.time}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-primary">category</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-0.5">
                  优先级别
                </p>
                <p className="font-medium">{PRIORITY_LABELS[task.priority] || task.priority}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        {task.description && (
          <section className="mb-12">
            <h3 className="text-xs uppercase tracking-[0.2em] text-on-surface-variant/60 font-bold mb-4">
              备注详情
            </h3>
            <div className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 leading-relaxed text-on-surface/80 text-lg italic border-l-4 border-primary/20 whitespace-pre-line">
              {task.description}
            </div>
          </section>
        )}

        {/* Subtasks */}
        {(task.subtasks.length > 0 || showSubtaskInput) && (
          <section className="mb-16">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xs uppercase tracking-[0.2em] text-on-surface-variant/60 font-bold">
                子任务清单
              </h3>
              {totalSubtasks > 0 && (
                <span className="text-xs text-primary font-medium">完成度 {subtaskPercent}%</span>
              )}
            </div>
            <div className="space-y-1">
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => toggleSubtask(task.id, sub.id)}
                  className="flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors rounded-xl cursor-pointer"
                >
                  <ZenCheckbox checked={sub.completed} onChange={() => {}} size="sm" />
                  <span
                    className={
                      sub.completed ? 'text-on-surface/50 line-through' : 'text-on-surface'
                    }
                  >
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>

            {showSubtaskInput && (
              <div className="mt-2 flex items-center gap-3 px-4">
                <input
                  autoFocus
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="输入子任务名称..."
                  className="flex-1 bg-transparent border-b-2 border-surface-container focus:border-primary py-2 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-colors"
                />
                <button onClick={handleAddSubtask} className="text-primary font-medium text-sm">
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowSubtaskInput(false)
                    setNewSubtask('')
                  }}
                  className="text-on-surface-variant text-sm"
                >
                  取消
                </button>
              </div>
            )}

            <button
              onClick={() => setShowSubtaskInput(true)}
              className="mt-4 flex items-center gap-2 text-primary font-medium text-sm px-4 py-2 hover:bg-primary-container/20 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              添加新的子任务
            </button>
          </section>
        )}

        {task.subtasks.length === 0 && !showSubtaskInput && (
          <section className="mb-16">
            <button
              onClick={() => setShowSubtaskInput(true)}
              className="flex items-center gap-2 text-primary font-medium text-sm px-4 py-2 hover:bg-primary-container/20 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              添加子任务
            </button>
          </section>
        )}

        {/* Footer Actions */}
        <footer className="flex items-center justify-between pt-12 border-t-2 border-surface-container/30">
          <button
            onClick={handleDelete}
            className="text-error font-medium text-sm flex items-center gap-2 px-4 py-2 hover:bg-error-container/10 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">delete</span>
            永久删除任务
          </button>
          <div className="flex gap-4">
            <button className="px-8 py-3 rounded-xl bg-surface-container-high text-on-surface font-semibold text-sm hover:bg-surface-container-highest transition-colors">
              设为归档
            </button>
            <button
              onClick={handleComplete}
              className="px-10 py-3 rounded-xl primary-gradient text-on-primary font-semibold text-sm shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
            >
              完成任务
            </button>
          </div>
        </footer>
      </main>

      <div className="fixed bottom-8 right-8">
        <button className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-90 transition-all duration-300">
          <span className="material-symbols-outlined text-2xl">edit</span>
        </button>
      </div>
    </>
  )
}
