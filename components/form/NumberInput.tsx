
import React from 'react';

interface NumberInputProps {
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  min?: number;
  className?: string;
  disabled?: boolean;
  emptyOnZero?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, name, value, onChange, required = false, min, className = '', disabled = false, emptyOnZero = false }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={name} className="mb-1 font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="number"
        id={name}
        name={name}
        value={emptyOnZero && value === 0 ? '' : value}
        onChange={onChange}
        required={required}
        min={min}
        disabled={disabled}
        className={`p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    </div>
  );
};

export default NumberInput;