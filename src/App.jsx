import { Routes, Route, useLocation } from 'react-router-dom'
import { TaskProvider } from './context/TaskContext'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import NewTaskPage from './pages/NewTaskPage'
import TaskDetailPage from './pages/TaskDetailPage'
import ArchivePage from './pages/ArchivePage'
import ExpensePage from './pages/ExpensePage'
import ProfilePage from './pages/ProfilePage'

const HIDE_NAV_ROUTES = ['/new']

function AppLayout() {
  const location = useLocation()
  const isTaskDetail = location.pathname.startsWith('/task/')
  const hideNav =
    HIDE_NAV_ROUTES.includes(location.pathname) || isTaskDetail

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewTaskPage />} />
        <Route path="/task/:id" element={<TaskDetailPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/expenses" element={<ExpensePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <TaskProvider>
      <AppLayout />
    </TaskProvider>
  )
}
