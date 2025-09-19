
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';

  const successIcon = (
    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  );

  const errorIcon = (
     <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  );

  return (
    <div className={`fixed top-8 right-8 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center`}>
      {isSuccess ? successIcon : errorIcon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-semibold text-xl leading-none opacity-70 hover:opacity-100">&times;</button>
    </div>
  );
};

export default Toast;