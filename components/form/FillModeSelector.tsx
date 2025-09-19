import React from 'react';

interface FillModeSelectorProps {
  fillMode: 'detailed' | 'quick' | null;
  onFillModeChange: (mode: 'detailed' | 'quick') => void;
}

const FillModeSelector: React.FC<FillModeSelectorProps> = ({ fillMode, onFillModeChange }) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <fieldset>
        <legend className="block text-lg font-medium text-gray-700 mb-2">
          Modo de Preenchimento
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {/* Detailed Mode Option */}
          <div
            className={`relative rounded-lg border p-4 flex items-center cursor-pointer transition-all duration-200 ${
              fillMode === 'detailed'
                ? 'bg-light border-secondary shadow-lg'
                : 'bg-gray-50 border-gray-200 hover:border-secondary'
            }`}
            onClick={() => onFillModeChange('detailed')}
            role="radio"
            aria-checked={fillMode === 'detailed'}
            tabIndex={0}
            onKeyDown={(e) => e.key === ' ' && onFillModeChange('detailed')}
          >
            <input
              id="detailed-mode"
              name="fill-mode"
              type="radio"
              value="detailed"
              checked={fillMode === 'detailed'}
              onChange={() => onFillModeChange('detailed')}
              className="sr-only" // Hide the default radio button
              aria-labelledby="detailed-mode-label"
            />
            <div className="flex items-center">
              <div className="flex-shrink-0 text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <label id="detailed-mode-label" className="block text-base font-bold text-gray-900 cursor-pointer">
                  Preenchimento Detalhado
                </label>
                <p className="text-sm text-gray-600">Ideal para solicitações de procedimentos específicos e menos comuns.</p>
              </div>
            </div>
          </div>

          {/* Quick Mode Option */}
          <div
            className={`relative rounded-lg border p-4 flex items-center cursor-pointer transition-all duration-200 ${
              fillMode === 'quick'
                ? 'bg-light border-secondary shadow-lg'
                : 'bg-gray-50 border-gray-200 hover:border-secondary'
            }`}
            onClick={() => onFillModeChange('quick')}
            role="radio"
            aria-checked={fillMode === 'quick'}
            tabIndex={0}
            onKeyDown={(e) => e.key === ' ' && onFillModeChange('quick')}
          >
            <input
              id="quick-mode"
              name="fill-mode"
              type="radio"
              value="quick"
              checked={fillMode === 'quick'}
              onChange={() => onFillModeChange('quick')}
              className="sr-only" // Hide the default radio button
              aria-labelledby="quick-mode-label"
            />
            <div className="flex items-center">
              <div className="flex-shrink-0 text-secondary">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <label id="quick-mode-label" className="block text-base font-bold text-gray-900 cursor-pointer">
                  Preenchimento Rápido
                </label>
                 <p className="text-sm text-gray-600">Ideal para solicitações de procedimentos de rotina.</p>
              </div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
};

export default FillModeSelector;