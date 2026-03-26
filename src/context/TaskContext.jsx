import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { taskApi } from '../api'

const TaskContext = createContext()

function taskReducer(state, action) {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.tasks, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: true }
    case 'UPDATE_TASK': {
      const updated = action.task
      const exists = state.tasks.some((t) => t.id === updated.id)
      return {
        ...state,
        tasks: exists
          ? state.tasks.map((t) => (t.id === updated.id ? updated : t))
          : [...state.tasks, updated],
      }
    }
    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'TOGGLE_LOCAL': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, completed: !t.completed } : t
        ),
      }
    }
    case 'TOGGLE_SUBTASK_LOCAL': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((s) =>
                  s.id === action.subtaskId ? { ...s, completed: !s.completed } : s
                ),
              }
            : t
        ),
      }
    }
    case 'ADD_SUBTASK_LOCAL': {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, subtasks: [...t.subtasks, action.subtask] }
            : t
        ),
      }
    }
    default:
      return state
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, { tasks: [], loading: true })

  const fetchTasks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING' })
    try {
      const tasks = await taskApi.list()
      dispatch({ type: 'SET_TASKS', tasks })
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      dispatch({ type: 'SET_TASKS', tasks: [] })
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const actions = {
    toggleTask: async (id) => {
      dispatch({ type: 'TOGGLE_LOCAL', id })
      try {
        await taskApi.toggle(id)
      } catch {
        dispatch({ type: 'TOGGLE_LOCAL', id })
      }
    },

    toggleSubtask: async (taskId, subtaskId) => {
      dispatch({ type: 'TOGGLE_SUBTASK_LOCAL', taskId, subtaskId })
      try {
        await taskApi.toggleSubtask(taskId, subtaskId)
      } catch {
        dispatch({ type: 'TOGGLE_SUBTASK_LOCAL', taskId, subtaskId })
      }
    },

    addTask: async (data) => {
      const task = await taskApi.create(data)
      dispatch({ type: 'UPDATE_TASK', task })
      return task
    },

    deleteTask: async (id) => {
      dispatch({ type: 'REMOVE_TASK', id })
      try {
        await taskApi.delete(id)
      } catch {
        fetchTasks()
      }
    },

    addSubtask: async (taskId, title) => {
      const subtask = await taskApi.addSubtask(taskId, title)
      dispatch({ type: 'ADD_SUBTASK_LOCAL', taskId, subtask })
      return subtask
    },

    refetch: fetchTasks,
  }

  return (
    <TaskContext.Provider value={{ tasks: state.tasks, loading: state.loading, ...actions }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
