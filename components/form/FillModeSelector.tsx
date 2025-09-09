import React from 'react';

interface FillModeSelectorProps {
  fillMode: 'detailed' | 'quick';
  onFillModeChange: (mode: 'detailed' | 'quick') => void;
}

const FillModeSelector: React.FC<FillModeSelectorProps> = ({ fillMode, onFillModeChange }) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg flex flex-wrap justify-between items-center gap-4">
      <fieldset>
        <legend className="block text-lg font-medium text-gray-700 mb-2">
          Modo de Preenchimento
        </legend>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              id="detailed-mode"
              name="fill-mode"
              type="radio"
              value="detailed"
              checked={fillMode === 'detailed'}
              onChange={() => onFillModeChange('detailed')}
              className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
            />
            <label htmlFor="detailed-mode" className="ml-2 block text-sm font-medium text-gray-900">
              Preenchimento Detalhado
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="quick-mode"
              name="fill-mode"
              type="radio"
              value="quick"
              checked={fillMode === 'quick'}
              onChange={() => onFillModeChange('quick')}
              className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300"
            />
            <label htmlFor="quick-mode" className="ml-2 block text-sm font-medium text-gray-900">
              Preenchimento Rápido
            </label>
          </div>
        </div>
      </fieldset>
    </div>
  );
};

export default FillModeSelector;
