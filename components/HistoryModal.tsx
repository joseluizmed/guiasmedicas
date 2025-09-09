import React from 'react';
import { GuideHistoryEntry } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GuideHistoryEntry[];
  onLoad: (entry: GuideHistoryEntry) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onLoad }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 id="history-modal-title" className="text-2xl font-bold text-primary">Histórico de Guias Geradas</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Fechar modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Nenhuma guia foi gerada ainda.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((entry) => (
                <li key={entry.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-light hover:shadow-md transition-shadow">
                  <div className="flex-grow">
                    <p className="font-bold text-secondary">{entry.patientName || 'Paciente não informado'}</p>
                    <p className="text-sm text-gray-600">
                      Plano: <span className="font-semibold">{entry.planName}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Gerado em: {new Date(entry.generatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onLoad(entry)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors"
                      aria-label={`Carregar guia de ${entry.patientName}`}
                    >
                      Carregar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t text-right">
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

export default HistoryModal;