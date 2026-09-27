export default function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  rightElement,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-600 tracking-wide uppercase px-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`glass-input w-full rounded-[24px] py-3.5 px-4 text-slate-800 placeholder-slate-400 text-sm font-medium transition-all duration-200 outline-none ${
            Icon ? 'pl-11' : ''
          } ${rightElement ? 'pr-12' : ''} ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : ''
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-4 flex items-center text-slate-400">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 px-1.5 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
