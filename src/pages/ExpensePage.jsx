import { useState, useEffect, useCallback } from 'react'
import { expenseApi } from '../api'
import ReceiptScanner from '../components/ReceiptScanner'

const EXPENSE_CATEGORIES = ['餐饮', '购物', '交通', '娱乐', '医疗', '居住', '其他']

const CATEGORY_ICONS = {
  餐饮: 'restaurant',
  购物: 'shopping_bag',
  交通: 'directions_car',
  娱乐: 'movie',
  医疗: 'medical_services',
  居住: 'home',
  其他: 'more_horiz',
}

const CATEGORY_COLORS = {
  餐饮: 'bg-error-container/20 text-error',
  购物: 'bg-primary-container/30 text-primary',
  交通: 'bg-tertiary-container text-tertiary-dim',
  娱乐: 'bg-inverse-primary/30 text-on-primary-fixed',
  医疗: 'bg-secondary-container text-secondary-dim',
  居住: 'bg-surface-container-high text-on-surface',
  其他: 'bg-surface-container text-on-surface-variant',
}

function formatMoney(n) {
  return `¥${Number(n).toFixed(2)}`
}

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    item: '',
    amount: '',
    category: '餐饮',
    date: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const handleScanResults = async (items) => {
    const todayStr = new Date().toISOString().split('T')[0]
    try {
      for (const item of items) {
        await expenseApi.create({
          item: item.item,
          amount: item.amount,
          category: item.category,
          date: todayStr,
        })
      }
      setShowScanner(false)
      await fetchData()
    } catch (err) {
      console.error('Failed to save scanned items:', err)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [expList, sum] = await Promise.all([expenseApi.list(), expenseApi.summary(30)])
      setExpenses(expList)
      setSummary(sum)
    } catch (err) {
      console.error('Failed to load expenses:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async () => {
    if (!form.item.trim() || !form.amount || saving) return
    setSaving(true)
    try {
      await expenseApi.create({
        item: form.item.trim(),
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
      })
      setForm({ item: '', amount: '', category: '餐饮', date: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      await fetchData()
    } catch (err) {
      console.error('Failed to add expense:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await expenseApi.delete(id)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // Group expenses by date
  const grouped = expenses.reduce((acc, exp) => {
    if (!acc[exp.date]) acc[exp.date] = []
    acc[exp.date].push(exp)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const todayStr = new Date().toISOString().split('T')[0]

  function formatDateLabel(dateStr) {
    if (dateStr === todayStr) return '今天'
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天'
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <header className="bg-surface sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-8 py-4">
          <div className="w-10" />
          <h1 className="font-headline font-medium text-lg tracking-tight text-primary">
            消费记录
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowScanner(!showScanner); if (!showScanner) setShowForm(false) }}
              className={`p-2 rounded-full transition-colors ${showScanner ? 'text-primary bg-primary-container/30' : 'text-primary hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined">photo_camera</span>
            </button>
            <button
              onClick={() => { setShowForm(!showForm); if (!showForm) setShowScanner(false) }}
              className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 pt-6 pb-32">
        {/* Summary Cards */}
        {summary && (
          <section className="mb-8">
            <div className="bg-surface-container-low rounded-[2rem] p-6">
              <div className="flex items-baseline justify-between mb-6">
                <span className="text-on-surface-variant text-sm font-label uppercase tracking-widest">
                  近30天总支出
                </span>
                <span className="text-primary font-headline text-3xl font-bold">
                  {formatMoney(summary.grandTotal)}
                </span>
              </div>

              {/* Category breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {summary.categoryTotals.map((c) => (
                  <div
                    key={c.category}
                    className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-3"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${CATEGORY_COLORS[c.category] || CATEGORY_COLORS['其他']}`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {CATEGORY_ICONS[c.category] || 'more_horiz'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant">{c.category}</p>
                      <p className="text-sm font-bold font-headline">{formatMoney(c.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Receipt Scanner */}
        {showScanner && (
          <ReceiptScanner
            onResults={handleScanResults}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* Add Form */}
        {showForm && (
          <section className="mb-8 bg-surface-container-lowest editorial-shadow rounded-2xl p-6">
            <h3 className="font-headline font-bold text-lg mb-4">添加消费</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  消费项目
                </label>
                <input
                  autoFocus
                  value={form.item}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="买了什么？"
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-2">
                    金额 (¥)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="0.00"
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-2">
                    日期
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  分类
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        form.category === cat
                          ? 'bg-primary-container text-on-primary-container ring-2 ring-primary/10'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full primary-gradient text-on-primary py-3 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? '保存中...' : '添加'}
              </button>
            </div>
          </section>
        )}

        {/* Daily Expense Lists */}
        {sortedDates.map((date) => {
          const items = grouped[date]
          const dayTotal = items.reduce((s, e) => s + e.amount, 0)
          return (
            <section key={date} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-lg font-bold flex items-center gap-2">
                  {formatDateLabel(date)}
                  <span className="text-xs font-label font-normal text-on-surface-variant/50">
                    {date}
                  </span>
                </h3>
                <span className="text-primary font-headline font-bold">
                  {formatMoney(dayTotal)}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((exp) => (
                  <div
                    key={exp.id}
                    className="group flex items-center justify-between p-4 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS['其他']}`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {CATEGORY_ICONS[exp.category] || 'more_horiz'}
                        </span>
                      </div>
                      <div>
                        <p className="text-on-surface font-medium">{exp.item}</p>
                        <p className="text-[10px] text-on-surface-variant">{exp.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-on-surface font-headline font-bold">
                        {formatMoney(exp.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-on-surface-variant/40 hover:text-error transition-all p-1 rounded-full"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {sortedDates.length === 0 && (
          <div className="text-center py-24">
            <p className="text-surface-dim font-headline text-2xl mb-2">暂无消费记录</p>
            <p className="text-on-surface-variant/40">点击右上角 + 添加消费</p>
          </div>
        )}
      </main>
    </>
  )
}
