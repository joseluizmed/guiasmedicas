
import React from 'react';

interface TextAreaInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ label, name, value, onChange, required = false, rows = 5, className = '' }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={name} className="mb-1 font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
      />
    </div>
  );
};

export default TextAreaInput;
