
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface AutocompleteInputProps<T> {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (item: T) => void;
  onDeleteItem?: (item: T) => void;
  data: T[];
  filterFn: (item: T, query: string) => boolean;
  displayFn: (item: T) => string;
  required?: boolean;
  className?: string;
}

function AutocompleteInput<T,>({
  label,
  name,
  value,
  onChange,
  onSelect,
  onDeleteItem,
  data,
  filterFn,
  displayFn,
  required = false,
  className = ''
}: AutocompleteInputProps<T>) {
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    const query = e.target.value;
    if (query.length > 0) {
      const filtered = data.filter(item => filterFn(item, query)).slice(0, 20);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setSuggestions([]);
    setShowSuggestions(false);
  };
  
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);
  
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleDelete = (item: T) => {
    if (onDeleteItem) {
      onDeleteItem(item);
      // Refilter suggestions after deletion
      const query = value;
      if (query.length > 0) {
        // We need to get the updated data, which we don't have here.
        // A simple solution is to just hide the suggestions. The user can re-type to see the updated list.
        setShowSuggestions(false);
      }
    }
  }


  return (
    <div className={`relative flex flex-col ${className}`} ref={containerRef}>
      <label htmlFor={name} className="mb-1 font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={handleInputChange}
        required={required}
        autoComplete="off"
        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto top-full">
          {suggestions.map((item, index) => (
            <li
              key={index}
              className="px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-secondary hover:text-white group"
            >
              <span onClick={() => handleSelect(item)} className="flex-grow">
                  {displayFn(item)}
              </span>
              {onDeleteItem && (
                  <button
                      type="button"
                      onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                      }}
                      className="ml-2 p-1 rounded-full text-gray-400 group-hover:text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover favorito"
                      title="Remover favorito"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                  </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;