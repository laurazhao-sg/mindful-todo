import { useState, useEffect } from 'react'
import { useTasks } from '../context/TaskContext'
import { userApi } from '../api'

export default function ProfilePage() {
  const { tasks } = useTasks()
  const [darkMode, setDarkMode] = useState(false)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    userApi.getProfile().then(setProfile).catch(console.error)
    userApi.getStats().then(setStats).catch(console.error)
  }, [])

  const completedCount = stats?.totalCompleted ?? tasks.filter((t) => t.completed).length
  const streak = stats?.streak ?? 0
  const weeklyHours = stats?.weeklyFocusHours ?? 0
  const focusLogs = stats?.focusLogs ?? []

  const maxMinutes = Math.max(...focusLogs.map((l) => l.minutes), 1)

  return (
    <>
      <header className="bg-surface sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-8 py-4">
          <div className="flex items-center gap-4">
            <button className="text-primary hover:bg-surface-container-low transition-colors duration-300 p-2 rounded-full">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline font-medium text-lg tracking-tight text-primary">
              今日列表
            </h1>
          </div>
          <div className="h-10 w-10 rounded-full overflow-hidden bg-surface-container border-2 border-white shadow-sm">
            <div className="w-full h-full bg-gradient-to-br from-primary-container to-tertiary-container flex items-center justify-center">
              <span className="text-on-primary-container text-sm font-bold">
                {profile?.name?.[0] || '晨'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-12 pb-32">
        {/* Profile Hero */}
        <section className="mb-16 flex flex-col md:flex-row items-start md:items-end gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 bg-gradient-to-br from-primary to-tertiary flex items-center justify-center">
              <span className="text-white font-headline text-5xl font-bold">
                {profile?.name?.[0] || '晨'}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg">
              <span className="material-symbols-outlined text-sm">edit</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-on-surface">
              {profile?.name || '加载中...'}
            </h2>
            <p className="text-on-surface-variant font-label tracking-wide text-sm opacity-70">
              {profile?.membership || '会员'} · 加入于{' '}
              {profile?.joined_at
                ? new Date(profile.joined_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                  })
                : '...'}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8">
          {/* Statistics */}
          <div className="space-y-12">
            <div>
              <h3 className="font-headline text-2xl font-bold mb-8 text-on-surface">数据概览</h3>
              <div className="bg-surface-container-low rounded-[2rem] p-8 space-y-8">
                <div className="flex justify-between items-baseline">
                  <span className="text-on-surface-variant text-sm font-label uppercase tracking-widest">
                    专注时长 (本周)
                  </span>
                  <span className="text-primary font-headline text-3xl font-bold">
                    {weeklyHours}h
                  </span>
                </div>

                {/* Chart */}
                <div className="flex items-end justify-between h-40 gap-3 px-2">
                  {focusLogs.map((log, i) => {
                    const pct = (log.minutes / maxMinutes) * 100
                    const isToday = i === focusLogs.length - 1
                    return (
                      <div
                        key={log.date}
                        className={`flex-1 rounded-t-full transition-all duration-300 ${
                          isToday
                            ? 'bg-primary shadow-lg shadow-primary/20'
                            : 'bg-surface-container-highest hover:bg-primary-container'
                        }`}
                        style={{ height: `${Math.max(pct, 5)}%` }}
                        title={`${log.date}: ${log.minutes}分钟`}
                      />
                    )
                  })}
                  {focusLogs.length === 0 &&
                    Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-full bg-surface-container-highest"
                        style={{ height: '10%' }}
                      />
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-lowest p-5 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                      已完成任务
                    </p>
                    <p className="text-xl font-bold font-headline">{completedCount}</p>
                  </div>
                  <div className="bg-surface-container-lowest p-5 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                      连续专注
                    </p>
                    <p className="text-xl font-bold font-headline">{streak} 天</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-12">
            <div>
              <h3 className="font-headline text-2xl font-bold mb-8 text-on-surface">系统设置</h3>
              <div className="space-y-4">
                <div className="group flex items-center justify-between p-6 bg-surface-container-low rounded-3xl hover:bg-surface-container-high transition-colors duration-300">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">dark_mode</span>
                    </div>
                    <div>
                      <p className="font-medium text-on-surface">深色模式</p>
                      <p className="text-xs text-on-surface-variant opacity-60">
                        自动切换视觉外观
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-300 ${
                      darkMode ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        darkMode ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {[
                  { icon: 'notifications', title: '消息通知', desc: '管理任务提醒与系统通知' },
                  { icon: 'cloud_sync', title: '备份与同步', desc: '多端同步与数据导出' },
                  { icon: 'info', title: '关于我们', desc: '版本 2.4.0 (Build 108)' },
                ].map((item) => (
                  <div
                    key={item.icon}
                    className="group flex items-center justify-between p-6 bg-surface-container-low rounded-3xl hover:bg-surface-container-high transition-colors duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">{item.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium text-on-surface">{item.title}</p>
                        <p className="text-xs text-on-surface-variant opacity-60">{item.desc}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full p-6 text-center text-error font-medium hover:bg-error-container/10 rounded-3xl transition-colors">
              退出登录
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
