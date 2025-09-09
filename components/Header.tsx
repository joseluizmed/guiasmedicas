import React from 'react';

interface HeaderProps {
  onShowHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowHistory }) => {
  return (
    <header id="app-header" className="bg-primary text-white shadow-md sticky top-0 z-20 p-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-accent flex-shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M9 15l2 2 4-4"></path>
            </svg>
            <div>
              <h1 className="text-3xl font-bold text-accent">Gerador de Guias Médicas</h1>
              <p className="text-light">Preencha formulários de planos de saúde de forma fácil e rápida</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onShowHistory}
            className="px-4 py-2 bg-secondary text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            aria-label="Ver histórico de guias"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Histórico
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;