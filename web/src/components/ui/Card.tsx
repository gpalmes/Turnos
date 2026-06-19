import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export default function Card({ interactive, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${interactive ? 'cursor-pointer transition-shadow hover:border-brand-300 hover:shadow-md' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
