
import React, { useState } from 'react';

interface FileInputProps {
  label: string;
  name: string;
  value: string; // base64 string
  onChange: (name: string, value: string) => void;
  className?: string;
}

const FileInput: React.FC<FileInputProps> = ({ label, name, value, onChange, className = '' }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(name, reader.result as string);
          setError(null);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Por favor, selecione um arquivo PNG ou JPG.');
      }
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={name} className="mb-1 font-medium text-gray-700">
        {label}
      </label>
      <input
        type="file"
        id={name}
        name={name}
        accept="image/png, image/jpeg"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {value && (
        <div className="mt-2">
          <p className="text-sm font-medium">Pré-visualização:</p>
          <img src={value} alt="Preview" className="mt-1 border rounded-md max-h-24" />
        </div>
      )}
    </div>
  );
};

export default FileInput;
