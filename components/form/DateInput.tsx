
import React from 'react';

interface DateInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}

const DateInput: React.FC<DateInputProps> = ({ label, name, value, onChange, required = false, className = '' }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={name} className="mb-1 font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="date"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
      />
    </div>
  );
};

export default DateInput;
