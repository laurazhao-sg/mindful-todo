import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { icon: 'home_max', path: '/' },
  { icon: 'add_circle', path: '/new' },
  { icon: 'inventory_2', path: '/archive' },
  { icon: 'receipt_long', path: '/expenses' },
  { icon: 'settings', path: '/profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed bottom-0 left-0 w-full glass-nav z-50 rounded-t-[2rem] shadow-[0_-12px_32px_rgba(45,52,53,0.04)]">
      <div className="max-w-md mx-auto flex justify-around items-end px-6 pb-8 pt-4">
        {tabs.map((tab, i) => (
          <button
            key={tab.icon}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center p-3 transition-all duration-300 active:scale-90 ${
              isActive(tab.path)
                ? 'bg-primary text-white rounded-full scale-110 shadow-lg mb-2'
                : 'text-on-surface/40 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
