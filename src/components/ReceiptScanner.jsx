import { useState, useRef } from 'react'
import Tesseract from 'tesseract.js'

const EXPENSE_CATEGORIES = ['餐饮', '购物', '交通', '娱乐', '医疗', '居住', '其他']

const CATEGORY_KEYWORDS = {
  餐饮: ['餐', '饭', '食', '奶茶', '咖啡', '外卖', '早餐', '午餐', '晚餐', '面包', '饮', '酒', '超市', '果', '菜', '肉'],
  购物: ['商城', '淘宝', '京东', '拼多多', '服装', '衣', '鞋', '包', '化妆', '日用', '洗'],
  交通: ['出租', '滴滴', '地铁', '公交', '打车', '加油', '停车', '高铁', '火车', '机票', '航空'],
  娱乐: ['电影', '游戏', '会员', 'VIP', '音乐', '视频', '健身', 'KTV'],
  医疗: ['药', '医院', '诊所', '体检', '挂号', '医疗'],
}

function guessCategory(text) {
  const lower = text.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat
  }
  return '其他'
}

function parseExpenses(ocrText) {
  const lines = ocrText.split('\n').filter((l) => l.trim())
  const results = []

  // Match patterns: item name followed by amount (¥12.50, 12.50元, or just numbers like 12.50)
  const amountRegex = /[¥￥]?\s*(\d+[.,]\d{1,2})\s*元?/g
  const lineAmountRegex = /^(.+?)\s+[¥￥]?\s*(\d+[.,]\d{1,2})\s*元?\s*$/
  const standaloneAmountRegex = /[¥￥]\s*(\d+[.,]\d{1,2})/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length < 2) continue

    // Try structured line: "item  ¥amount" or "item  amount"
    const lineMatch = trimmed.match(lineAmountRegex)
    if (lineMatch) {
      const item = lineMatch[1].trim()
      const amount = parseFloat(lineMatch[2].replace(',', '.'))
      if (amount > 0 && amount < 100000 && item.length > 0) {
        results.push({
          item: item.slice(0, 30),
          amount,
          category: guessCategory(item),
        })
        continue
      }
    }

    // Try to find any amount in the line
    const amounts = []
    let match
    const regex = new RegExp(amountRegex.source, 'g')
    while ((match = regex.exec(trimmed)) !== null) {
      const val = parseFloat(match[1].replace(',', '.'))
      if (val > 0 && val < 100000) amounts.push(val)
    }

    if (amounts.length > 0) {
      const itemText = trimmed
        .replace(/[¥￥]?\s*\d+[.,]\d{1,2}\s*元?/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      const name = itemText.length >= 1 ? itemText.slice(0, 30) : `消费项目`
      for (const amt of amounts) {
        results.push({
          item: name,
          amount: amt,
          category: guessCategory(name),
        })
      }
    }
  }

  // Also try to find a "total" / "合计" line
  const totalMatch = ocrText.match(/合计[^\d]*[¥￥]?\s*(\d+[.,]\d{1,2})/)
  if (totalMatch && results.length === 0) {
    results.push({
      item: '消费合计',
      amount: parseFloat(totalMatch[1].replace(',', '.')),
      category: '其他',
    })
  }

  // Deduplicate by removing near-identical entries
  const unique = results.filter(
    (r, i, arr) => arr.findIndex((x) => x.item === r.item && x.amount === r.amount) === i
  )

  return unique.length > 0 ? unique : null
}

export default function ReceiptScanner({ onResults, onClose }) {
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [ocrText, setOcrText] = useState('')
  const [parsedItems, setParsedItems] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }
    setError('')
    setImage(file)
    setImageUrl(URL.createObjectURL(file))
    setParsedItems(null)
    setOcrText('')
  }

  const handleScan = async () => {
    if (!image) return
    setScanning(true)
    setProgress(0)
    setError('')

    try {
      const result = await Tesseract.recognize(image, 'chi_sim+eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            setProgress(Math.round(info.progress * 100))
          }
        },
      })

      const text = result.data.text
      setOcrText(text)

      const items = parseExpenses(text)
      if (items && items.length > 0) {
        setParsedItems(items)
      } else {
        setError('未能识别出消费金额，请手动输入或尝试更清晰的图片')
      }
    } catch (err) {
      console.error('OCR failed:', err)
      setError('识别失败，请重试')
    } finally {
      setScanning(false)
    }
  }

  const updateItem = (index, field, value) => {
    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: field === 'amount' ? Number(value) || 0 : value }
          : item
      )
    )
  }

  const removeItem = (index) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    if (parsedItems && parsedItems.length > 0) {
      onResults(parsedItems)
    }
  }

  return (
    <div className="bg-surface-container-lowest editorial-shadow rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">document_scanner</span>
          拍照识别小票
        </h3>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Upload Area */}
      {!imageUrl && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-outline-variant/30 rounded-2xl py-12 flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-surface-container-low/50 transition-all"
        >
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
            add_a_photo
          </span>
          <span className="text-sm text-on-surface-variant/60">点击上传小票或消费截图</span>
          <span className="text-[10px] text-on-surface-variant/40">支持 JPG / PNG 格式</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image Preview */}
      {imageUrl && (
        <div className="mb-4">
          <div className="relative rounded-xl overflow-hidden bg-surface-container-low">
            <img src={imageUrl} alt="Receipt" className="w-full max-h-64 object-contain" />
            <button
              onClick={() => {
                setImage(null)
                setImageUrl(null)
                setParsedItems(null)
                setOcrText('')
                setError('')
              }}
              className="absolute top-2 right-2 bg-on-surface/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-on-surface/80"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Scan Button */}
          {!parsedItems && !scanning && (
            <button
              onClick={handleScan}
              className="mt-4 w-full primary-gradient text-on-primary py-3 rounded-xl font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">search</span>
              开始识别
            </button>
          )}
        </div>
      )}

      {/* Scanning Progress */}
      {scanning && (
        <div className="py-6 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-on-surface-variant">正在识别中... {progress}%</p>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-error-container/10 rounded-xl">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Parsed Results — editable */}
      {parsedItems && parsedItems.length > 0 && (
        <div className="mt-4 space-y-4">
          <p className="text-xs uppercase tracking-widest text-on-surface-variant/60 font-bold">
            识别结果（可编辑）
          </p>
          <div className="space-y-3">
            {parsedItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <select
                  value={item.category}
                  onChange={(e) => updateItem(i, 'category', e.target.value)}
                  className="bg-transparent text-xs text-primary font-medium focus:outline-none w-14 shrink-0"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={item.item}
                  onChange={(e) => updateItem(i, 'item', e.target.value)}
                  className="flex-1 bg-transparent text-on-surface text-sm focus:outline-none min-w-0"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-on-surface-variant text-sm">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateItem(i, 'amount', e.target.value)}
                    className="w-20 bg-transparent text-on-surface font-headline font-bold text-right text-sm focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="text-on-surface-variant/40 hover:text-error shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-on-surface-variant">
              共 {parsedItems.length} 项，合计{' '}
              <span className="text-primary font-bold font-headline">
                ¥{parsedItems.reduce((s, i) => s + i.amount, 0).toFixed(2)}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-sm font-medium"
              >
                重新上传
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 rounded-xl primary-gradient text-on-primary text-sm font-medium active:scale-95 transition-all"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR raw text (collapsible debug) */}
      {ocrText && (
        <details className="mt-4">
          <summary className="text-[10px] text-on-surface-variant/40 cursor-pointer hover:text-on-surface-variant">
            查看原始识别文本
          </summary>
          <pre className="mt-2 p-3 bg-surface-container-low rounded-xl text-[11px] text-on-surface-variant whitespace-pre-wrap max-h-32 overflow-auto">
            {ocrText}
          </pre>
        </details>
      )}
    </div>
  )
}
