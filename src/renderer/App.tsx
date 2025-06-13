import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { useAppStore } from './stores/appStore';
import { isElectron } from '../shared/utils/environment';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { initialize, isLoading } = useAppStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Initializing Personal Social Media Assistant...');
        
        // Check if running in Electron
        if (isElectron) {
          console.log('Running in Electron environment');
          
          // Test Electron API availability
          if (!window.electronAPI) {
            throw new Error('Electron API not available');
          }
          
          // Get app info
          const version = await window.electronAPI.app.getVersion();
          const platform = await window.electronAPI.app.getPlatform();
          console.log(`App version: ${version}, Platform: ${platform}`);
        } else {
          console.log('Running in browser environment');
        }
        
        // Initialize app store
        await initialize();
        
        setIsInitialized(true);
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError(
          error instanceof Error ? error.message : 'Unknown initialization error'
        );
      }
    };

    initApp();
  }, [initialize]);

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <LoadingScreen 
        message={initError ? `エラー: ${initError}` : "アプリケーションを初期化中..."}
        error={!!initError}
      />
    );
  }

  // Show loading overlay if app is performing operations
  return (
    <Router>
      <div className="app h-screen flex flex-col bg-gray-50">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">処理中...</span>
            </div>
          </div>
        )}
        
        <Layout />
      </div>
    </Router>
  );
};

export default App;
