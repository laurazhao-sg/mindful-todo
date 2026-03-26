import { useEffect, useState } from 'react'
import { useTasks } from '../context/TaskContext'
import { userApi } from '../api'

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export default function StatsPage() {
  const { tasks } = useTasks()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    userApi.getStats().then(setStats).catch(console.error)
  }, [])

  const completedCount = stats?.totalCompleted ?? tasks.filter((t) => t.completed).length
  const pendingCount = stats?.totalPending ?? tasks.filter((t) => !t.completed).length
  const totalCount = completedCount + pendingCount
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const streak = stats?.streak ?? 0
  const weeklyHours = stats?.weeklyFocusHours ?? 0
  const focusLogs = stats?.focusLogs ?? []
  const maxMinutes = Math.max(...focusLogs.map((l) => l.minutes), 1)

  const categoryStats = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {})

  const CATEGORY_LABELS = {
    work: '工作项目',
    life: '个人生活',
    health: '健康习惯',
    personal: '个人项目',
    shopping: '购物清单',
  }

  const CATEGORY_COLORS = {
    work: 'bg-primary',
    life: 'bg-tertiary',
    health: 'bg-primary-container',
    personal: 'bg-tertiary-container',
    shopping: 'bg-secondary-container',
  }

  return (
    <>
      <header className="bg-surface sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-8 py-4">
          <div className="w-10" />
          <h1 className="font-headline font-medium text-lg tracking-tight text-primary">
            数据统计
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 pt-8 pb-32">
        {/* Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: '已完成', value: completedCount, accent: 'text-primary' },
            { label: '待处理', value: pendingCount, accent: 'text-on-surface' },
            { label: '完成率', value: `${completionRate}%`, accent: 'text-primary' },
            { label: '连续专注', value: `${streak}天`, accent: 'text-tertiary' },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-surface-container-low rounded-2xl p-6 flex flex-col items-center justify-center"
            >
              <span className={`font-headline text-3xl font-bold ${card.accent}`}>
                {card.value}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">
                {card.label}
              </span>
            </div>
          ))}
        </section>

        {/* Weekly Focus Chart */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-xl font-bold">本周专注时长</h3>
            <span className="text-primary font-headline text-2xl font-bold">{weeklyHours}h</span>
          </div>
          <div className="bg-surface-container-low rounded-[2rem] p-8">
            <div className="flex items-end justify-between h-48 gap-3 px-2">
              {focusLogs.map((log, i) => {
                const pct = (log.minutes / maxMinutes) * 100
                const isToday = i === focusLogs.length - 1
                const dayOfWeek = new Date(log.date).getDay()
                return (
                  <div key={log.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
                      <div
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 ${
                          isToday
                            ? 'bg-primary shadow-lg shadow-primary/20'
                            : 'bg-surface-container-highest hover:bg-primary-container'
                        }`}
                        style={{ height: `${Math.max(pct, 8)}%` }}
                        title={`${Math.round(log.minutes / 60 * 10) / 10}h`}
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant">
                      {DAY_LABELS[dayOfWeek]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="mb-12">
          <h3 className="font-headline text-xl font-bold mb-6">分类分布</h3>
          <div className="space-y-4">
            {Object.entries(categoryStats)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
                return (
                  <div key={cat} className="flex items-center gap-4">
                    <span className="text-sm text-on-surface w-20 shrink-0 font-medium">
                      {CATEGORY_LABELS[cat] || cat}
                    </span>
                    <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${CATEGORY_COLORS[cat] || 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant w-12 text-right">
                      {count} 项
                    </span>
                  </div>
                )
              })}
          </div>
        </section>

        {/* Recent Completed */}
        <section>
          <h3 className="font-headline text-xl font-bold mb-6">近期完成</h3>
          <div className="bg-surface-container-low/50 rounded-3xl p-6 border border-outline-variant/10">
            {tasks.filter((t) => t.completed).length > 0 ? (
              <div className="space-y-4">
                {tasks
                  .filter((t) => t.completed)
                  .slice(0, 8)
                  .map((t) => (
                    <div key={t.id} className="flex items-center gap-3">
                      <span className="material-symbols-filled text-primary">check_circle</span>
                      <p className="text-sm text-on-surface/60 line-through">{t.title}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-on-surface-variant/40 py-8">暂无已完成的任务</p>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
