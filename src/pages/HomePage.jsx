import { useNavigate } from 'react-router-dom'
import { useTasks } from '../context/TaskContext'
import ZenCheckbox from '../components/ZenCheckbox'
import PriorityBadge from '../components/PriorityBadge'

const CATEGORY_LABELS = {
  work: 'WORK',
  life: 'LIFE',
  health: 'HEALTH',
  personal: 'PERSONAL',
  shopping: 'SHOPPING',
}

export default function HomePage() {
  const { tasks, loading, toggleTask } = useTasks()
  const navigate = useNavigate()

  const importantTasks = tasks.filter((t) => t.important && !t.completed)
  const todayTasks = tasks.filter(
    (t) => !t.important && !t.completed && t.date === '今天'
  )
  const completedTasks = tasks.filter((t) => t.completed)
  const totalPending = importantTasks.length + todayTasks.length
  const completionPercent =
    tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-on-surface-variant text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="bg-surface sticky top-0 z-40 transition-colors duration-300">
        <div className="flex justify-between items-center w-full px-8 py-4">
          <button className="text-primary hover:bg-surface-container-low transition-colors duration-300 p-2 rounded-full">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline font-medium text-lg tracking-tight text-primary">
            今日列表
          </h1>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container bg-surface-container">
            <div className="w-full h-full bg-gradient-to-br from-primary-container to-tertiary-container flex items-center justify-center">
              <span className="text-on-primary-container text-[8px] font-bold">
                Laura
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 pt-12 md:pt-20 pb-32">
        {/* Hero */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="font-label text-on-surface-variant/60 tracking-widest uppercase text-xs mb-2">
                {new Date().toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                ·{' '}
                {new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}
              </p>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
                早安，<span className="text-primary">Laura</span>
              </h2>
              <p className="text-on-surface-variant font-body text-lg max-w-md leading-relaxed">
                今天有 {totalPending} 项任务需要处理。保持专注，享受当下的宁静。
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 rounded-3xl bg-surface-container-low flex flex-col items-center justify-center editorial-shadow">
                <span className="text-3xl font-bold text-primary">
                  {completionPercent}%
                </span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                  今日完成度
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {importantTasks.length > 0 && (
            <section className="md:col-span-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-filled text-error">stars</span>
                  重要事项
                </h3>
                <span className="text-xs font-label text-on-surface-variant/50">
                  {importantTasks.length} ITEMS
                </span>
              </div>
              <div className="space-y-4">
                {importantTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/task/${task.id}`)}
                    className="group bg-surface-container-lowest p-6 rounded-2xl editorial-shadow border border-transparent hover:border-primary-container/30 transition-all duration-500 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div onClick={(e) => e.stopPropagation()}>
                        <ZenCheckbox
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg text-on-surface group-hover:text-primary transition-colors">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <PriorityBadge priority={task.priority} />
                          {task.time && (
                            <span className="text-xs text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              {task.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-surface-container rounded-full"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="md:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold">今日任务</h3>
              <span className="text-xs font-label text-on-surface-variant/50">
                {todayTasks.length} ITEMS
              </span>
            </div>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/task/${task.id}`)}
                  className="group bg-surface-container-low p-5 rounded-2xl hover:bg-surface-container transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div onClick={(e) => e.stopPropagation()}>
                      <ZenCheckbox
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        size="sm"
                      />
                    </div>
                    <div>
                      <p className="text-on-surface">{task.title}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        {CATEGORY_LABELS[task.category] || task.category} · {task.time}
                      </p>
                    </div>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
              {todayTasks.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-surface-dim font-headline text-2xl">所有任务已完成</p>
                  <p className="text-on-surface-variant/40 mt-2">享受当下的宁静</p>
                </div>
              )}
            </div>
          </section>

          <section className="md:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold">已完成</h3>
            </div>
            <div className="bg-surface-container-low/50 rounded-3xl p-6 border border-outline-variant/10">
              <div className="space-y-4 opacity-50">
                {completedTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <span className="material-symbols-filled text-primary">check_circle</span>
                    <p className="text-sm line-through">{task.title}</p>
                  </div>
                ))}
              </div>
              {completedTasks.length > 0 && (
                <button className="mt-8 w-full py-3 rounded-xl border border-dashed border-outline-variant text-on-surface-variant text-xs font-medium hover:bg-surface-container transition-colors">
                  查看所有已完成任务
                </button>
              )}
            </div>
            <div className="mt-8 rounded-3xl overflow-hidden relative aspect-square bg-surface-container-low">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <p className="font-headline text-6xl font-bold text-on-surface leading-none tracking-tighter text-center px-4">
                  mindful
                  <br />
                  serenity
                </p>
              </div>
              <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-surface-container-low to-transparent">
                <p className="text-xs italic text-on-surface-variant">
                  "专注是通往宁静的唯一路径。"
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <button
        onClick={() => navigate('/new')}
        className="fixed bottom-32 right-8 w-16 h-16 rounded-full primary-gradient text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </>
  )
}
