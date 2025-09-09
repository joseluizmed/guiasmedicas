import React from 'react';

interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ label, name, value, onChange, required = false, placeholder = '', className = '', readOnly = false }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={name} className="mb-1 font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    </div>
  );
};

export default TextInput;
