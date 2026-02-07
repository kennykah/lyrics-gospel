'use client';

import { useState } from 'react';

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ defaultValue = '', onSearch }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div
        className={`relative flex items-center h-11 rounded-[12px] transition-all duration-300 ${
          focused
            ? 'bg-white shadow-lg ring-1 ring-black/[0.08]'
            : 'bg-black/[0.04] hover:bg-black/[0.06]'
        }`}
      >
        {/* Magnifying glass icon */}
        <div className="absolute left-3.5 flex items-center pointer-events-none">
          <svg
            className={`w-4 h-4 transition-colors duration-200 ${focused ? 'text-[--text-secondary]' : 'text-[--text-tertiary]'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Rechercher par titre ou artiste..."
          className={`w-full h-full bg-transparent pl-10 pr-4 text-[15px] text-[--text-primary] placeholder:text-[--text-tertiary] focus:outline-none ${
            !focused && !value ? 'text-center pl-0' : ''
          }`}
        />

        {value && (
          <button
            type="button"
            onClick={() => { setValue(''); onSearch(''); }}
            className="absolute right-3 w-5 h-5 rounded-full bg-black/[0.08] flex items-center justify-center hover:bg-black/[0.12] transition-colors"
          >
            <svg className="w-3 h-3 text-[--text-secondary]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
