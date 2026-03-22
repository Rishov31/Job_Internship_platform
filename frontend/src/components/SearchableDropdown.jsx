import React, { useState, useRef, useEffect } from 'react';

export default function SearchableDropdown({ 
  options, 
  value, 
  placeholder = "Select or type to search...",
  label,
  onSelect,
  /** @type {"light"|"dark"} */
  variant = "light",
}) {
  const isDark = variant === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Filter options based on search term
    if (searchTerm.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  useEffect(() => {
    // Update search term when value prop changes (from parent)
    if (value !== undefined && value !== searchTerm) {
      setSearchTerm(value || '');
    }
  }, [value]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    // Don't trigger onChange while typing - only update local state for filtering dropdown
  };

  const handleSelect = (option) => {
    setSearchTerm(option);
    setIsOpen(false);
    if (onSelect) {
      onSelect(option);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleSelect(filteredOptions[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const labelCls = isDark
    ? "block text-sm font-medium text-slate-400 mb-2"
    : "block text-sm font-medium text-gray-700 mb-2";
  const inputCls = isDark
    ? "w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
    : "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const chevronCls = isDark
    ? "text-slate-500 hover:text-slate-300"
    : "text-gray-400 hover:text-gray-600";
  const menuCls = isDark
    ? "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-600 bg-slate-900 shadow-xl"
    : "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto";
  const itemCls = isDark
    ? "cursor-pointer border-b border-slate-700/80 px-4 py-2 text-sm text-slate-200 last:border-b-0 hover:bg-slate-800"
    : "px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0";
  const emptyCls = isDark
    ? "absolute z-50 mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 shadow-xl"
    : "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg";
  const emptyTextCls = isDark ? "px-4 py-2 text-sm text-slate-500" : "px-4 py-2 text-sm text-gray-500";

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className={labelCls}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 transform ${chevronCls}`}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {isOpen && filteredOptions.length > 0 && (
        <div className={menuCls}>
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelect(option)}
              className={itemCls}
            >
              {option}
            </div>
          ))}
        </div>
      )}
      
      {isOpen && filteredOptions.length === 0 && searchTerm.trim() !== '' && (
        <div className={emptyCls}>
          <div className={emptyTextCls}>
            No options found
          </div>
        </div>
      )}
    </div>
  );
}

