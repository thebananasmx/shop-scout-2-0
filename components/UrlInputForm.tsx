
import React, { useState } from 'react';
import { ExtractIcon } from './icons';

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Pega la URL de la página principal de la tienda..."
        required
        disabled={isLoading}
        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none transition-all duration-300 text-white placeholder-gray-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading || !url}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-lg hover:bg-sky-500 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100"
      >
        <ExtractIcon className="w-5 h-5" />
        <span>{isLoading ? 'Rastreando...' : 'Iniciar Rastreo y Extraer Productos'}</span>
      </button>
    </form>
  );
};