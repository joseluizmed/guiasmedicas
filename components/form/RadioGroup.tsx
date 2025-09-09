
import React from 'react';
import { Option } from '../../types';

interface RadioGroupProps {
  legend: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: Option[];
  required?: boolean;
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ legend, name, value, onChange, options, required = false, className = '' }) => {
  return (
    <fieldset className={className}>
      <legend className="mb-1 font-medium text-gray-700">
        {legend} {required && <span className="text-red-500">*</span>}
      </legend>
      <div className="flex flex-wrap gap-4 mt-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              required={required}
              className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
            />
            <label htmlFor={`${name}-${option.value}`} className="ml-2 block text-sm text-gray-900">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export default RadioGroup;
