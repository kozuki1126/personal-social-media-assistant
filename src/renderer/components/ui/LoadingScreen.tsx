import React from 'react';

interface LoadingScreenProps {
  message?: string;
  error?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = '読み込み中...', 
  error = false 
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {error ? (
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        ) : (
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        )}
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Personal Social Media Assistant
        </h2>
        
        <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-600'}`}>
          {message}
        </p>
        
        {error && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            再読み込み
          </button>
        )}
      </div>
    </div>
  );
};
