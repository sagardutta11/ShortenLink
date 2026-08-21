import { useRef, useState } from 'react';

export default function OtpInput({ length = 5, value, onChange, error }) {
  const [digits, setDigits] = useState(() => {
    const arr = new Array(length).fill('');
    (value || '').split('').forEach((d, i) => (arr[i] = d));
    return arr;
  });
  const inputsRef = useRef([]);

  const emit = (next) => onChange(next.join(''));

  const handleChange = (i, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    emit(next);
    if (digit && i < length - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    const next = new Array(length).fill('');
    pasted.split('').forEach((d, i) => (next[i] = d));
    setDigits(next);
    emit(next);
    const lastIndex = Math.min(pasted.length, length) - 1;
    inputsRef.current[lastIndex >= 0 ? lastIndex : 0]?.focus();
  };

  return (
    <div>
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={!!error}
            className={`w-12 h-14 text-center text-xl font-display font-semibold rounded-xl border outline-none transition-colors bg-white
              ${error ? 'border-red-300 focus:ring-2 focus:ring-red-200' : 'border-mint-100 focus:ring-2 focus:ring-mint-300 focus:border-mint-400'}`}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-500 mt-3 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
