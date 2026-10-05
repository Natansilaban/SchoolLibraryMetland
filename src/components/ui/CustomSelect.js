'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X, SlidersHorizontal } from 'lucide-react';

export default function CustomSelect({
  id,
  value = '',
  onChange,
  options = [],
  placeholder = 'Semua Kategori',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalized options
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.id !== undefined ? String(opt.id) : String(opt.value ?? ''),
        label: opt.nama || opt.label || String(opt.id || opt.value || ''),
      };
    }
    return { value: String(opt), label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === String(value));

  // Filtered options based on inline search
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && normalizedOptions.length > 7) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    } else {
      setFilterQuery('');
    }
  }, [isOpen, normalizedOptions.length]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  const handleSelect = (val) => {
    if (onChange) {
      onChange(val);
    }
    setIsOpen(false);
  };

  const isFiltered = Boolean(value);

  return (
    <div
      ref={containerRef}
      className={`relative z-40 ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`w-full h-12 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-xl sm:rounded-full outline-none transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer border ${
          isOpen
            ? 'bg-blue-50 dark:bg-slate-800 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
            : isFiltered
            ? 'bg-blue-50/80 dark:bg-slate-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
            : 'bg-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/70 border-transparent text-slate-700 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal
            size={14}
            className={`shrink-0 transition-colors ${
              isFiltered ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          <span className="truncate text-left font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isFiltered && (
            <span
              role="button"
              tabIndex={0}
              title="Reset kategori"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('');
              }}
              className="p-0.5 rounded-full hover:bg-blue-200/60 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition-colors"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 text-slate-400 dark:text-slate-500 ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Solid Popover Menu - High Contrast & Opaque */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={placeholder}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{ backgroundColor: 'var(--dropdown-solid-bg)' }}
          className="absolute right-0 top-full mt-2 w-full sm:w-72 z-50 bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Quick Search Header if options > 7 */}
          {normalizedOptions.length > 7 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#070d1d]">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari kategori..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500"
                />
                {filterQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery('')}
                    className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="p-1.5 max-h-60 sm:max-h-72 overflow-y-auto space-y-0.5">
            {/* Reset / All Categories option */}
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect('');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-xl font-medium transition-colors text-left cursor-pointer ${
                !value
                  ? 'bg-blue-600/10 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span>{placeholder}</span>
              {!value && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
            </button>

            {filteredOptions.length > 0 && (
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                Kategori tidak ditemukan
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(value) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(opt.value);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-xl transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/10 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && (
                      <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
