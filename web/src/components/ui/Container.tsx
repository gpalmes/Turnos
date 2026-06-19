import { ReactNode } from 'react';

export default function Container({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {title && <h1 className="mb-6 text-2xl font-semibold text-gray-900">{title}</h1>}
      {children}
    </main>
  );
}
