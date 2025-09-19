import React, { useState, useRef, useEffect } from 'react';
import { FavoriteGuideEntry } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteGuideEntry[];
  onLoad: (entry: FavoriteGuideEntry) => void;
  onEdit: (entry: FavoriteGuideEntry) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose, favorites, onLoad, onEdit, onDelete, onExport }) => {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Clear timer if component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Reset confirmation when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setConfirmingDeleteId(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [isOpen]);

  const handleDeleteClick = (id: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (confirmingDeleteId === id) {
      onDelete(id);
      setConfirmingDeleteId(null);
    } else {
      setConfirmingDeleteId(id);
      timerRef.current = window.setTimeout(() => {
        setConfirmingDeleteId(null);
        timerRef.current = null;
      }, 3000); // Reset after 3 seconds
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="favorites-modal-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 id="favorites-modal-title" className="text-2xl font-bold text-primary">Guias Favoritas</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Fechar modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {favorites.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Você ainda não salvou nenhuma guia como favorita.</p>
          ) : (
            <ul className="space-y-3">
              {favorites.map((entry) => (
                <li key={entry.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-light hover:shadow-md transition-shadow">
                  <div className="flex-grow">
                    <p className="font-bold text-secondary">{entry.favoriteName}</p>
                    <p className="text-sm text-gray-700">
                      Paciente: <span className="font-semibold">{entry.patientName || 'Não informado'}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Plano: <span className="font-semibold">{entry.planName}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Salvo em: {new Date(entry.savedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onEdit(entry)}
                      className="px-3 py-1 bg-yellow-500 text-white text-sm font-semibold rounded-md hover:bg-yellow-600 transition-colors"
                      aria-label={`Editar guia favorita ${entry.favoriteName}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onLoad(entry)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors"
                      aria-label={`Carregar guia favorita ${entry.favoriteName}`}
                    >
                      Carregar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(entry.id)}
                      className={`px-3 py-1 text-white text-sm font-semibold rounded-md transition-colors ${
                        confirmingDeleteId === entry.id
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      aria-label={
                        confirmingDeleteId === entry.id
                          ? `Confirmar exclusão de ${entry.favoriteName}`
                          : `Excluir guia favorita ${entry.favoriteName}`
                      }
                    >
                      {confirmingDeleteId === entry.id ? 'Confirmar?' : 'Excluir'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t flex justify-between items-center">
            <button
                onClick={onExport}
                className="px-4 py-2 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition-colors flex items-center gap-2"
                aria-label="Exportar todas as guias favoritas para um arquivo JSON"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Favoritos
            </button>
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};

export default FavoritesModal;