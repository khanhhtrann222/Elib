import React, { useState, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import './App.css';

// Lazy load feature containers to trigger Rollup bundle splitting config.
const CatalogContainer = lazy(() => import('./features/catalog/CatalogContainer'));
const ReaderContainer = lazy(() => import('./features/reader/ReaderContainer'));
const AdminContainer = lazy(() => import('./features/admin/AdminContainer'));

function LoaderFallback() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-on-surface-variant font-medium text-lg">
      <Loader2 className="animate-spin text-primary" size={32} />
      <span>Đang khởi động giao diện...</span>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState('catalog'); // 'catalog' | 'favorites' | 'admin' | 'reader'
  const [adminTab, setAdminTab] = useState('upload'); // 'upload' | 'settings'
  const [activeBookId, setActiveBookId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null); // { route, tab }
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSelectBook = (bookId) => {
    setActiveBookId(bookId);
    setRoute('reader');
  };

  const handleCloseReader = () => {
    setActiveBookId(null);
    setRoute('catalog');
  };

  // Intercept and authenticate admin access
  const handleAdminNavigation = (tab = 'upload') => {
    if (isAdminLoggedIn) {
      setRoute('admin');
      setAdminTab(tab);
    } else {
      setPendingRoute({ route: 'admin', tab });
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginUsername === 'root' && loginPassword === 'admin123') {
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
      
      // Proceed to the intercepted route
      if (pendingRoute) {
        setRoute(pendingRoute.route);
        setAdminTab(pendingRoute.tab);
        setPendingRoute(null);
      }
    } else {
      setLoginError('Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    if (route === 'admin') {
      setRoute('catalog');
    }
  };

  const renderMainContent = () => {
    return (
      <div className="min-h-screen bg-surface-bright text-on-surface">
        {/* Side Navigation Rail */}
        <aside className="fixed left-0 top-0 h-full w-nav-rail-width flex flex-col items-center py-xl gap-lg bg-surface border-r border-outline-variant transition-colors duration-200 ease-in-out z-50">
          <div className="font-headline-lg text-headline-lg font-bold text-primary mb-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">menu_book</span>
          </div>
          <nav className="flex flex-col gap-md flex-grow w-full px-2">
            {/* Trang chủ */}
            <button 
              onClick={() => setRoute('catalog')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 w-full hover:bg-surface-container-high ${route === 'catalog' ? 'bg-primary-fixed text-on-primary-fixed nav-active font-semibold shadow-sm' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: route === 'catalog' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
              <span className="font-label-md text-label-md mt-1 text-center text-[11px] leading-tight">Trang chủ</span>
            </button>
            {/* Thư viện */}
            <button 
              onClick={() => setRoute('catalog')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 w-full hover:bg-surface-container-high ${route === 'catalog' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: route === 'catalog' ? "'FILL' 1" : "'FILL' 0" }}>library_books</span>
              <span className="font-label-md text-label-md mt-1 text-center text-[11px] leading-tight">Thư viện</span>
            </button>
            {/* Yêu thích */}
            <button 
              onClick={() => setRoute('favorites')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 w-full hover:bg-surface-container-high ${route === 'favorites' ? 'bg-primary-fixed text-on-primary-fixed nav-active font-semibold shadow-sm' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: route === 'favorites' ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
              <span className="font-label-md text-label-md mt-1 text-center text-[11px] leading-tight">Yêu thích</span>
            </button>
            
            <div className="flex-grow"></div>
            
            {/* Cài đặt */}
            <button 
              onClick={() => handleAdminNavigation('settings')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 w-full hover:bg-surface-container-high ${route === 'admin' && adminTab === 'settings' ? 'bg-primary-fixed text-on-primary-fixed nav-active font-semibold shadow-sm' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: (route === 'admin' && adminTab === 'settings') ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
              <span className="font-label-md text-label-md mt-1 text-center text-[11px] leading-tight">Cài đặt</span>
            </button>
          </nav>
          <div className="mt-auto flex flex-col items-center gap-2">
            {isAdminLoggedIn && (
              <button 
                onClick={handleLogout}
                title="Đăng xuất Admin"
                className="p-1 rounded-full bg-error-container text-on-error-container hover:opacity-95 transition-opacity text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            )}
            <img 
              alt="Ảnh đại diện" 
              onClick={() => handleAdminNavigation('upload')}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-container cursor-pointer hover:scale-105 transition-transform" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDoZrd9dpofw5HNg4yWO5lwcxYFBVj0KcxfqKNLlNs-n2dR9PQ6WElMerEzVJGptHeAINKytrd_uS6T5ZXA4MEOlu2urB52sAO87hVL3aH6h2Ujoh7PjFw8TCIOddg_OQq5cttmO9_uxPOKzFe_-tSqMbShjCY3w13T8002zKu_tCptx-EARpbTVXHK0ldr2xQDyCYc6K7hRu0LUZygsuR_BsaCT21TQAO5ZKAKzB6Z1wb4lqQzzOpNp74SKU9JYusXwXbYYaNXQw"
            />
          </div>
        </aside>

        {/* Top Navigation Bar */}
        <header className="fixed top-0 right-0 left-nav-rail-width h-16 bg-surface border-b border-outline-variant flex items-center px-margin-desktop z-40">
          <div className="flex-1 max-w-2xl">
            <div className="relative flex items-center group">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-12 rounded-full bg-surface-variant border-none focus:ring-2 focus:ring-primary font-body-md text-body-md placeholder:text-on-surface-variant transition-all outline-none" 
                placeholder="Tìm kiếm trong thư viện của bạn..." 
                type="text"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-12 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              <button className="absolute right-4 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">tune</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-lg ml-auto">
            {isAdminLoggedIn && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary-container text-on-secondary-container">Admin Mode</span>
            )}
            <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button 
              onClick={() => handleAdminNavigation('upload')}
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="ml-nav-rail-width mt-16 p-margin-desktop h-[calc(100vh-64px)] overflow-hidden">
          <Suspense fallback={<LoaderFallback />}>
            {(route === 'catalog' || route === 'favorites') && (
              <CatalogContainer 
                onSelectBook={handleSelectBook}
                onNavigateToAdmin={() => handleAdminNavigation('upload')}
                searchQuery={searchQuery}
                onlyFavorites={route === 'favorites'}
              />
            )}
            
            {route === 'admin' && (
              <AdminContainer 
                onNavigateToCatalog={() => setRoute('catalog')}
                initialTab={adminTab}
              />
            )}
          </Suspense>
        </main>

        {/* Floating Action Button (FAB) for Admin Upload */}
        {route !== 'admin' && (
          <button 
            onClick={() => handleAdminNavigation('upload')}
            title="Thêm sách mới"
            className="fixed bottom-margin-desktop right-margin-desktop w-14 h-14 bg-primary text-on-primary rounded-lg flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all group z-50"
          >
            <span className="material-symbols-outlined text-[28px] group-hover:rotate-90 transition-transform duration-300">add</span>
          </button>
        )}

        {/* Admin Credentials Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in px-4">
            <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-lg max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-sm text-primary mb-md">
                <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
                <h2 className="font-title-lg text-title-lg text-on-surface">Đăng nhập Admin</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                Bạn cần đăng nhập quyền quản trị viên để thay đổi cài đặt hoặc thêm sách vào thư viện.
              </p>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-label-lg font-label-lg text-on-surface-variant mb-1">Tài khoản</label>
                  <input 
                    type="text" 
                    value={loginUsername} 
                    onChange={(e) => setLoginUsername(e.target.value)} 
                    className="w-full h-12 px-4 rounded-lg bg-surface-variant border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md" 
                    placeholder="Nhập tên đăng nhập (root)" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-label-lg font-label-lg text-on-surface-variant mb-1">Mật khẩu</label>
                  <input 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    className="w-full h-12 px-4 rounded-lg bg-surface-variant border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md" 
                    placeholder="Nhập mật khẩu (admin123)" 
                    required 
                  />
                </div>
                {loginError && (
                  <p className="text-error font-body-md text-body-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {loginError}
                  </p>
                )}
                <div className="flex justify-end gap-sm pt-md">
                  <button 
                    type="button" 
                    onClick={() => { setShowLoginModal(false); setLoginError(''); setLoginUsername(''); setLoginPassword(''); }} 
                    className="px-md py-sm rounded-full text-label-lg font-label-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="px-md py-sm rounded-full bg-primary text-on-primary text-label-lg font-label-lg hover:opacity-90 transition-colors shadow-md flex items-center gap-1"
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-root">
      <Suspense fallback={<LoaderFallback />}>
        {route === 'reader' && activeBookId ? (
          <ReaderContainer 
            bookId={activeBookId}
            onCloseReader={handleCloseReader}
          />
        ) : (
          renderMainContent()
        )}
      </Suspense>
    </div>
  );
}
