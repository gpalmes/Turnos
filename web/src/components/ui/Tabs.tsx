'use client';

import { ReactNode, useState } from 'react';

interface Tab {
  label: string;
  content: ReactNode;
}

export default function Tabs({ tabs, initial = 0 }: { tabs: Tab[]; initial?: number }) {
  const [active, setActive] = useState(initial);

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              i === active
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6">{tabs[active]?.content}</div>
    </div>
  );
}
