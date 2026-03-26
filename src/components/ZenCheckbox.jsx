export default function ZenCheckbox({ checked, onChange, size = 'md' }) {
  const sizeMap = {
    sm: 'w-[22px] h-[22px]',
    md: 'w-7 h-7',
  }

  return (
    <button
      onClick={onChange}
      className={`relative ${sizeMap[size]} rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
        checked
          ? 'bg-primary'
          : 'border-2 border-outline-variant hover:border-primary'
      }`}
    >
      {checked && (
        <span className="material-symbols-outlined text-white text-sm">
          check
        </span>
      )}
    </button>
  )
}
