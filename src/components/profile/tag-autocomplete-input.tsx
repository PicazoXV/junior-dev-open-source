"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

type TagAutocompleteInputProps = {
  label: string;
  placeholder: string;
  selected: string[];
  options: string[];
  maxSelected: number;
  limitText: string;
  emptyText: string;
  onChange: (next: string[]) => void;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function TagAutocompleteInput({
  label,
  placeholder,
  selected,
  options,
  maxSelected,
  limitText,
  emptyText,
  onChange,
}: TagAutocompleteInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(selected.map(normalize)), [selected]);
  const reachedLimit = selected.length >= maxSelected;

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query);

    return options
      .filter((option) => !selectedSet.has(normalize(option)))
      .filter((option) =>
        normalizedQuery ? normalize(option).includes(normalizedQuery) : true
      )
      .slice(0, 8);
  }, [options, query, selectedSet]);

  const addTag = (tag: string) => {
    if (reachedLimit) {
      return;
    }

    if (selectedSet.has(normalize(tag))) {
      return;
    }

    onChange([...selected, tag]);
    setQuery("");
    setIsOpen(true);
  };

  const removeTag = (tag: string) => {
    onChange(selected.filter((item) => normalize(item) !== normalize(tag)));
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        <span className="text-xs text-gray-500">
          {selected.length}/{maxSelected}
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (filtered[0]) {
                addTag(filtered[0]);
              }
            }
          }}
          disabled={reachedLimit}
          className="w-full rounded-xl border border-white/20 bg-neutral-900 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-65"
          placeholder={reachedLimit ? limitText : placeholder}
        />

        {isOpen && filtered.length > 0 && !reachedLimit ? (
          <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/15 bg-neutral-900/95 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_18px_rgba(0,0,0,0.35)]">
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addTag(option);
                }}
                className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/5 hover:text-orange-300"
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-gray-500">{limitText}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <span className="text-xs text-gray-500">{emptyText}</span>
        ) : (
          selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-gray-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="cursor-pointer rounded-full p-0.5 text-gray-400 transition hover:bg-white/10 hover:text-orange-300"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

