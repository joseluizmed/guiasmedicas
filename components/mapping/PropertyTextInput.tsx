import React from 'react';

interface PropertyTextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tooltip?: string;
  readOnly?: boolean;
}

const PropertyTextInput: React.FC<PropertyTextInputProps> = ({
  label,
  value,
  onChange,
  tooltip,
  readOnly = false,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
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
        type="text"
        id={`prop-${label}`}
        value={value}
        onChange={handleInputChange}
        readOnly={readOnly}
        className={`col-span-2 w-full p-1 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    </div>
  );
};

export default PropertyTextInput;
