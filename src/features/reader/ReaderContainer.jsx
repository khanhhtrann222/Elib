import { useEffect, useState, useRef, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import useGitHubClient from '../../hooks/useGitHubClient';
import ReaderControlBar from './components/ReaderControlBar';
import OutlineDrawer from './components/OutlineDrawer';
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import './ReaderContainer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ── Single Page Canvas rendered directly in the flipbook ──────────────────────
function FlipbookPage({ pdfDoc, pageNumber, isVisible }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!pdfDoc || !isVisible || pageNumber < 1) return;

    let active = true;
    const render = async () => {
      setStatus('rendering');
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        const containerW = container?.clientWidth || 500;
        const containerH = container?.clientHeight || 700;

        // Calculate scale to fit the container
        const viewport1 = page.getViewport({ scale: 1 });
        const scaleW = containerW / viewport1.width;
        const scaleH = containerH / viewport1.height;
        const scale = Math.min(scaleW, scaleH);

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        if (renderTaskRef.current) renderTaskRef.current.cancel();

        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
        if (active) setStatus('done');
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Flipbook page ${pageNumber} render error:`, err);
          if (active) setStatus('error');
        }
      }
    };
    render();
    return () => {
      active = false;
      if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
    };
  }, [pdfDoc, pageNumber, isVisible]);

  return (
    <div className="book-page__canvas-wrapper">
      {status === 'rendering' && (
        <div className="flipbook-page-loading">
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#6a4ba0' }} />
        </div>
      )}
      <canvas ref={canvasRef} className="flipbook-page-canvas" />
    </div>
  );
}

// ── Main Reader Container ──────────────────────────────────────────────────────
export default function ReaderContainer({ bookId, onCloseReader }) {
  const { getBookPdfUrl, getBookMetadata } = useGitHubClient();

  const [bookMetadata, setBookMetadata] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [flipbookReady, setFlipbookReady] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  // currentPage = the LEFT page in the spread (right = currentPage + 1)
  // Page 1 is cover → shown alone on right side
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(`elib_bookmarks_${bookId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(null); // 'next' | 'prev'
  const flipbookRef = useRef(null);

  // Derive left & right page numbers from currentPage
  // Page 1 = cover → left empty, right = page 1
  // Page 2 onwards → left = even page, right = odd page
  const leftPageNum = currentPage === 1 ? null : currentPage;
  const rightPageNum = currentPage === 1 ? 1 : (currentPage + 1 <= totalPages ? currentPage + 1 : null);

  // 1. Load book metadata + PDF URL
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [metadata, url] = await Promise.all([
          getBookMetadata(bookId),
          getBookPdfUrl(bookId)
        ]);
        if (!active) return;
        setBookMetadata(metadata);
        setPdfUrl(url);
        setFlipbookReady(false);

        const loadingTask = pdfjs.getDocument({ url, withCredentials: false });
        const doc = await loadingTask.promise;
        if (!active) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoading(false);

        // Restore saved progress
        const saved = localStorage.getItem('elib_reading_progress');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed[bookId]?.page) {
            const savedPage = parsed[bookId].page;
            // Snap to nearest left-page of a spread
            const snapped = savedPage <= 1 ? 1 : (savedPage % 2 === 0 ? savedPage : savedPage - 1);
            setCurrentPage(snapped);
          }
        }
      } catch (err) {
        console.error(err);
        if (active) { setError('Không thể tải tài liệu PDF.'); setLoading(false); }
      }
    };
    load();
    return () => { active = false; };
  }, [bookId, getBookPdfUrl, getBookMetadata]);


  // Initialize the jQuery FlipBook plugin if it is available
  useEffect(() => {
    if (!pdfUrl || !bookMetadata || !flipbookRef.current) return;
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.flipBook) {
      window.jQuery(flipbookRef.current).flipBook({
        pdf: pdfUrl,
        responsive: true,
        toolbar: true,
        autoPlay: false
      });
      setFlipbookReady(true);
    }
  }, [pdfUrl, bookMetadata]);

  // 3. Save progress whenever currentPage changes
  useEffect(() => {
    if (!totalPages) return;
    const savedProgress = JSON.parse(localStorage.getItem('elib_reading_progress') || '{}');
    const percent = (currentPage / totalPages) * 100;
    savedProgress[bookId] = { page: currentPage, percent, lastRead: new Date().toISOString() };
    localStorage.setItem('elib_reading_progress', JSON.stringify(savedProgress));
  }, [currentPage, totalPages, bookId]);

  // Navigation: go to next spread (2 pages at a time)
  const goNext = useCallback(() => {
    if (isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('next');
    setTimeout(() => {
      setCurrentPage(prev => {
        if (prev === 1) return 2; // cover → first spread
        return Math.min(prev + 2, totalPages % 2 === 0 ? totalPages - 1 : totalPages);
      });
      setIsFlipping(false);
      setFlipDirection(null);
    }, 600);
  }, [isFlipping, totalPages]);

  const goPrev = useCallback(() => {
    if (isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    setTimeout(() => {
      setCurrentPage(prev => {
        if (prev <= 2) return 1; // back to cover
        return prev - 2;
      });
      setIsFlipping(false);
      setFlipDirection(null);
    }, 600);
  }, [isFlipping]);

  // Navigate to specific page (snaps to nearest spread)
  const navigateToPage = useCallback((pageNum) => {
    const clamped = Math.max(1, Math.min(totalPages, pageNum));
    if (clamped === 1) { setCurrentPage(1); return; }
    const snapped = clamped % 2 === 0 ? clamped : clamped - 1;
    setCurrentPage(Math.max(1, snapped));
  }, [totalPages]);

  // Bookmarks
  const toggleBookmark = () => {
    const pg = currentPage;
    const updated = bookmarks.includes(pg)
      ? bookmarks.filter(p => p !== pg)
      : [...bookmarks, pg];
    setBookmarks(updated);
    localStorage.setItem(`elib_bookmarks_${bookId}`, JSON.stringify(updated));
  };

  const deleteBookmark = (pageNumber) => {
    const updated = bookmarks.filter(p => p !== pageNumber);
    setBookmarks(updated);
    localStorage.setItem(`elib_bookmarks_${bookId}`, JSON.stringify(updated));
  };

  // ── Render loading / error ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="reader-container">
        <div className="reader-loader animate-fade-in">
          <Loader2 className="reader-loader__spinner" size={48} />
          <h3>Đang tải tài liệu PDF</h3>
          <p>Đang truyền dữ liệu từ kho lưu trữ…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reader-container">
        <div className="reader-error animate-fade-in">
          <h3>Không thể mở tài liệu</h3>
          <p>{error}</p>
          <button className="reader-error__btn" onClick={onCloseReader}>
            Quay lại thư viện
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  const isBookmarked = bookmarks.includes(currentPage);
  const canGoNext = currentPage < (totalPages > 1 ? totalPages - (totalPages % 2 === 1 ? 0 : 1) : 1);
  const canGoPrev = currentPage > 1;

  return (
    <div className="reader-container">
      {/* Left Navigation Rail */}
      <aside className="reader-sidenav">
        <span className="reader-sidenav__logo material-symbols-outlined">auto_stories</span>
        <nav className="reader-sidenav__nav">
          <button className="reader-sidenav__item" onClick={onCloseReader} title="Trang chủ">
            <span className="material-symbols-outlined">home</span>
            <span>Trang chủ</span>
          </button>
          <button className="reader-sidenav__item" onClick={onCloseReader} title="Thư viện">
            <span className="material-symbols-outlined">local_library</span>
            <span>Thư viện</span>
          </button>
          <button className="reader-sidenav__item is-active" title="Đang đọc">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
            <span>Đang đọc</span>
          </button>
          <button className="reader-sidenav__item" onClick={() => setIsOutlineOpen(true)} title="Mục lục">
            <span className="material-symbols-outlined">list</span>
            <span>Mục lục</span>
          </button>
        </nav>
        <div className="reader-sidenav__avatar">
          <img
            alt="Avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDoZrd9dpofw5HNg4yWO5lwcxYFBVj0KcxfqKNLlNs-n2dR9PQ6WElMerEzVJGptHeAINKytrd_uS6T5ZXA4MEOlu2urB52sAO87hVL3aH6h2Ujoh7PjFw8TCIOddg_OQq5cttmO9_uxPOKzFe_-tSqMbShjCY3w13T8002zKu_tCptx-EARpbTVXHK0ldr2xQDyCYc6K7hRu0LUZygsuR_BsaCT21TQAO5ZKAKzB6Z1wb4lqQzzOpNp74SKU9JYusXwXbYYaNXQw"
          />
        </div>
      </aside>

      {/* Top App Bar */}
      <header className="reader-topbar">
        <div className="reader-topbar__left">
          <button className="reader-topbar__back" onClick={onCloseReader}>
            <ArrowLeft size={16} />
            Thư viện
          </button>
          {bookMetadata && (
            <>
              <span className="reader-topbar__title">{bookMetadata.title}</span>
              <span className="reader-topbar__author">by {bookMetadata.author}</span>
            </>
          )}
        </div>
        <div className="reader-topbar__actions">
          <button className="reader-topbar__icon-btn material-symbols-outlined" title="Thu phóng">zoom_in</button>
          <button
            className={`reader-topbar__icon-btn material-symbols-outlined`}
            style={isBookmarked ? { fontVariationSettings: "'FILL' 1", color: '#d4bbff' } : {}}
            onClick={toggleBookmark}
            title="Đánh dấu trang"
          >
            bookmark
          </button>
          <button className="reader-topbar__icon-btn material-symbols-outlined" onClick={() => setIsOutlineOpen(true)} title="Mục lục">
            menu
          </button>
        </div>
      </header>

      {/* Main Book Canvas */}
      <div className="reader-canvas">
        {flipbookReady ? (
          <div ref={flipbookRef} className="reader-flipbook-container" />
        ) : (
          <div className="book-flipper">
            {/* Prev Arrow */}
            <button
              className="book-nav-arrow"
              onClick={goPrev}
              disabled={!canGoPrev}
              title="Trang trước"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Book Spread */}
            <div className="book-perspective-wrapper">
              {/* LEFT PAGE */}
              <div className={`book-page book-page--left ${flipDirection === 'prev' ? 'book-page--flip-prev' : ''} ${!leftPageNum ? 'book-page--empty' : ''}`}>
                {leftPageNum ? (
                  <>
                    <div className="page-spine" />
                    <FlipbookPage pdfDoc={pdfDoc} pageNumber={leftPageNum} isVisible={true} />
                    <span className="page-number-label">{leftPageNum}</span>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'rgba(212,187,255,0.15)', fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                  </div>
                )}
              </div>

              {/* GUTTER */}
              <div className="book-gutter" />

              {/* RIGHT PAGE */}
              <div
                className={`book-page book-page--right ${flipDirection === 'next' ? 'book-page--flip-next' : ''}`}
                onClick={canGoNext ? goNext : undefined}
              >
                {rightPageNum ? (
                  <>
                    <div className="page-spine" />
                    <FlipbookPage pdfDoc={pdfDoc} pageNumber={rightPageNum} isVisible={true} />
                    <div className="page-curl-corner" />
                    <span className="page-number-label">{rightPageNum}</span>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <span style={{ color: 'rgba(26,26,26,0.3)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>Kết thúc</span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Arrow */}
            <button
              className="book-nav-arrow"
              onClick={goNext}
              disabled={!canGoNext}
              title="Trang sau"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <ReaderControlBar
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onScaleChange={setScale}
        onPageChange={navigateToPage}
        onNext={goNext}
        onPrev={goPrev}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        isBookmarked={isBookmarked}
        onToggleBookmark={toggleBookmark}
        onToggleOutline={() => setIsOutlineOpen(true)}
        progressPercent={progressPercent}
      />

      {/* Outline / Bookmarks Drawer */}
      <OutlineDrawer
        isOpen={isOutlineOpen}
        onClose={() => setIsOutlineOpen(false)}
        pdfDoc={pdfDoc}
        onNavigatePage={navigateToPage}
        bookmarks={bookmarks}
        onDeleteBookmark={deleteBookmark}
      />
    </div>
  );
}
