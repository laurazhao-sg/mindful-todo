import { useNavigate } from 'react-router-dom'
import { useTasks } from '../context/TaskContext'
import ZenCheckbox from '../components/ZenCheckbox'
import PriorityBadge from '../components/PriorityBadge'

const CATEGORIES = [
  { id: 'work', label: '工作项目', icon: 'work' },
  { id: 'life', label: '个人生活', icon: 'person' },
  { id: 'shopping', label: '购物清单', icon: 'shopping_cart' },
  { id: 'health', label: '健康习惯', icon: 'favorite' },
  { id: 'personal', label: '个人项目', icon: 'palette' },
]

export default function ArchivePage() {
  const { tasks, toggleTask } = useTasks()
  const navigate = useNavigate()

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    tasks: tasks.filter((t) => t.category === cat.id),
  })).filter((g) => g.tasks.length > 0)

  const totalCount = tasks.length
  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <>
      <header className="bg-surface sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-8 py-4">
          <div className="w-10" />
          <h1 className="font-headline font-medium text-lg tracking-tight text-primary">
            归档任务
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 pt-8 pb-32">
        {/* Summary */}
        <section className="mb-10">
          <p className="text-on-surface-variant text-sm">
            共 {totalCount} 项任务，已完成 {completedCount} 项
          </p>
        </section>

        {/* Category Groups */}
        {grouped.map((group) => {
          const done = group.tasks.filter((t) => t.completed).length
          return (
            <section key={group.id} className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-headline text-xl font-bold flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">{group.icon}</span>
                  {group.label}
                </h3>
                <span className="text-xs font-label text-on-surface-variant/50">
                  {done}/{group.tasks.length} 已完成
                </span>
              </div>
              <div className="space-y-3">
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/task/${task.id}`)}
                    className={`group p-5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 ${
                      task.completed
                        ? 'bg-surface-container-low/50 opacity-60'
                        : 'bg-surface-container-lowest editorial-shadow hover:border-primary-container/30 border border-transparent'
                    }`}
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
                        <p
                          className={`font-medium ${
                            task.completed
                              ? 'line-through text-on-surface/40'
                              : 'text-on-surface group-hover:text-primary transition-colors'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.time && (
                          <p className="text-[10px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {task.time}
                          </p>
                        )}
                      </div>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {grouped.length === 0 && (
          <div className="text-center py-24">
            <p className="text-surface-dim font-headline text-2xl mb-2">暂无任务</p>
            <p className="text-on-surface-variant/40">创建你的第一个任务吧</p>
          </div>
        )}
      </main>
    </>
  )
}
