'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuPlacement?: 'bottom' | 'top' | 'auto';
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Dooro...',
  disabled = false,
  className = '',
  menuPlacement = 'auto',
  showSearch = false,
  searchPlaceholder = 'Raadi...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none outline-none ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            : isOpen
            ? 'bg-white border-blue-600 ring-2 ring-blue-500/15 shadow-sm'
            : 'bg-[#F8F9FA] hover:bg-slate-100/70 focus:bg-white border-[#ECEEF2] hover:border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <div className="min-w-0 flex-1">
            {selectedOption ? (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${selectedOption.badgeColor || 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs sm:text-sm font-medium text-slate-400">
                {placeholder}
              </span>
            )}
            {selectedOption?.sublabel && (
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                {selectedOption.sublabel}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Modern Popover / Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop on mobile for extra clean focus */}
          <div
            className="fixed inset-0 z-40 bg-slate-950/20 sm:hidden backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={listRef}
            className="absolute left-0 right-0 z-50 mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 flex flex-col"
            style={{
              boxShadow: '0 12px 36px -4px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.08)'
            }}
          >
            {/* Optional Search */}
            {(showSearch || options.length > 6) && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/70 shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-8 pl-8 pr-7 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900"
                    autoFocus
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* List of Options */}
            <div className="overflow-y-auto p-1.5 space-y-0.5 divide-y-0 divide-slate-100">
              {filteredOptions.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 font-medium">
                  Wax natiijo ah lama helin
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-900 font-bold border border-blue-200/60'
                          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {option.icon && (
                          <span className="shrink-0">{option.icon}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs sm:text-[13px] leading-tight ${isSelected ? 'font-bold text-blue-950' : 'font-medium'}`}>
                              {option.label}
                            </span>
                            {option.badge && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${option.badgeColor || (isSelected ? 'bg-blue-200/70 text-blue-900' : 'bg-slate-100 text-slate-600')}`}>
                                {option.badge}
                              </span>
                            )}
                          </div>
                          {option.sublabel && (
                            <p className="text-[11px] text-slate-500 mt-0.5 font-normal leading-snug">
                              {option.sublabel}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Custom radio / check indicator */}
                      <div className="shrink-0 flex items-center justify-center">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-slate-400 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
