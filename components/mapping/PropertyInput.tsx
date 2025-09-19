import React from 'react';

interface PropertyInputProps {
  label: string;
  value: number | '';
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  tooltip?: string;
  placeholder?: string;
}

const PropertyInput: React.FC<PropertyInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  tooltip,
  placeholder,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value, 10);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  return (
    <div className="grid grid-cols-3 items-center gap-2" title={tooltip}>
      <label
        htmlFor={`prop-${label}`}
        className="text-gray-700 font-medium col-span-1"
      >
        {label}
      </label>
      <input
        type="number"
        id={`prop-${label}`}
        value={value}
        onChange={handleInputChange}
        min={min}
        step={step}
        placeholder={placeholder}
        className="col-span-2 w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
      />
    </div>
  );
};

export default PropertyInput;