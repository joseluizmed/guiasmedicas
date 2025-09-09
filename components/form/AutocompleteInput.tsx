
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface AutocompleteInputProps<T> {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (item: T) => void;
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
              onClick={() => handleSelect(item)}
              className="px-4 py-2 cursor-pointer hover:bg-secondary hover:text-white"
            >
              {displayFn(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;