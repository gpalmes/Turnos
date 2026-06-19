import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Input({ label, id, name, className = '', ...rest }: InputProps) {
  const inputId = id || name;
  return (
    <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
      {label}
      <input
        id={inputId}
        name={name}
        className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${className}`}
        {...rest}
      />
    </label>
  );
}
