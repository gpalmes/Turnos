import { ReactNode } from 'react';

export default function Container({
  title,
  children,
  wide = false,
}: {
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={`mx-auto px-6 py-10 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
      {title && <h1 className="mb-6 text-2xl font-semibold text-gray-900">{title}</h1>}
      {children}
    </main>
  );
}
