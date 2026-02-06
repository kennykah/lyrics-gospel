'use client';

import { useState } from 'react';

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ defaultValue = '', onSearch }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Rechercher par titre ou artiste..."
          className="w-full rounded-full border border-gray-300 bg-white px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
        >
          Rechercher
        </button>
      </div>
    </form>
  );
}
