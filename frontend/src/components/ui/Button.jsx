export default function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  children,
  disabled,
  loading,
  ...props
}) {
  const base = 'rounded-full font-medium px-6 py-3 text-sm transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-mint-400 focus:ring-offset-2 focus:ring-offset-cream disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-mint-500 hover:bg-mint-600 text-white disabled:bg-ink-500/30',
    outline: 'border border-mint-500 text-mint-600 hover:bg-mint-50 disabled:border-ink-500/30 disabled:text-ink-500/40',
    ghost: 'text-ink-500 hover:text-ink-900 disabled:text-ink-500/40',
  };

  return (
    <Component className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
      )}
      {children}
    </Component>
  );
}
