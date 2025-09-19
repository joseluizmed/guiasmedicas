import React, { useState, useEffect, useRef } from 'react';

interface SaveFavoriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
}

const SaveFavoriteModal: React.FC<SaveFavoriteModalProps> = ({ isOpen, onClose, onSave, defaultName }) => {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      // Focus and select the text in the input when the modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    } else {
        // Optionally, provide feedback if the name is empty
        inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
    } else if (e.key === 'Escape') {
        onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="save-favorite-modal-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 id="save-favorite-modal-title" className="text-xl font-bold text-primary">Salvar Guia nos Favoritos</h2>
           <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Fechar modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6">
          <label htmlFor="favoriteName" className="block text-sm font-medium text-gray-700 mb-2">
            Dê um nome para esta guia favorita:
          </label>
          <input
            ref={inputRef}
            type="text"
            id="favoriteName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
          />
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-secondary transition-colors"
            disabled={!name.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveFavoriteModal;
