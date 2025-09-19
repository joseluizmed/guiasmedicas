import React, { useState, useEffect, useRef } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const CORRECT_PASSWORD = '12345';

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess, setToast }) => {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (password === CORRECT_PASSWORD) {
      setToast({ message: 'Acesso concedido!', type: 'success' });
      onSuccess();
    } else {
      setToast({ message: 'Senha incorreta!', type: 'error' });
      inputRef.current?.select();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h2 id="password-modal-title" className="text-xl font-bold text-primary">Acesso Restrito</h2>
        </div>
        <div className="p-6">
          <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-2">
            Digite a senha para gerenciar o mapeamento:
          </label>
          <input
            ref={inputRef}
            type="password"
            id="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
            aria-required="true"
          />
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-secondary">
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
