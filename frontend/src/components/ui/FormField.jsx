export default function FormField({ label, id, error, className = '', ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-900 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors bg-white
          ${error ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-mint-100 focus:ring-2 focus:ring-mint-300 focus:border-mint-400'}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-500 mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
