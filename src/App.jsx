import React, { useState, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import './App.css';

// Lazy load feature containers to trigger Rollup bundle splitting config.
const CatalogContainer = lazy(() => import('./features/catalog/CatalogContainer'));
const ReaderContainer = lazy(() => import('./features/reader/ReaderContainer'));
const AdminContainer = lazy(() => import('./features/admin/AdminContainer'));

function LoaderFallback() {
  return (
    <div className="app-suspense-loader">
      <Loader2 className="app-suspense-loader__spinner animate-spin" size={32} />
      <span>Initializing cinematic layout...</span>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState('catalog'); // 'catalog' | 'reader' | 'admin'
  const [activeBookId, setActiveBookId] = useState(null);

  const handleSelectBook = (bookId) => {
    setActiveBookId(bookId);
    setRoute('reader');
  };

  const handleCloseReader = () => {
    setActiveBookId(null);
    setRoute('catalog');
  };

  return (
    <div className="app-root">
      {/* Cinematic ambient background glow */}
      <div className="ambient-glow" style={{ top: '10%', left: '5%' }} />
      <div className="ambient-glow" style={{ bottom: '10%', right: '5%', animationDelay: '-4s' }} />

      <Suspense fallback={<LoaderFallback />}>
        {route === 'catalog' && (
          <CatalogContainer 
            onSelectBook={handleSelectBook}
            onNavigateToAdmin={() => setRoute('admin')}
          />
        )}
        
        {route === 'reader' && activeBookId && (
          <ReaderContainer 
            bookId={activeBookId}
            onCloseReader={handleCloseReader}
          />
        )}
        
        {route === 'admin' && (
          <AdminContainer 
            onNavigateToCatalog={() => setRoute('catalog')}
          />
        )}
      </Suspense>
    </div>
  );
}
