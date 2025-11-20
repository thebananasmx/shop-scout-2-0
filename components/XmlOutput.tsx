
import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface XmlOutputProps {
  xml: string;
}

export const XmlOutput: React.FC<XmlOutputProps> = ({ xml }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(xml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [xml]);

  return (
    <div className="relative">
      <h3 className="text-lg font-semibold mb-2 text-gray-200">Catálogo XML Generado:</h3>
      <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto border border-gray-700">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all">
          <code>{xml}</code>
        </pre>
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-0 right-0 mt-2 mr-2 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
        aria-label="Copiar XML"
      >
        {copied ? (
          <CheckIcon className="w-5 h-5 text-green-400" />
        ) : (
          <CopyIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>
    </div>
  );
};
