
import React from 'react';

interface StatusLogProps {
  message: string;
  currentUrl: string;
}

export const StatusLog: React.FC<StatusLogProps> = ({ message, currentUrl }) => {
  return (
    <div className="text-center mt-3 text-sm">
      <p className="text-gray-300">{message}</p>
      {currentUrl && (
        <p className="text-gray-500 truncate font-mono text-xs mt-1">
          {currentUrl}
        </p>
      )}
    </div>
  );
};
