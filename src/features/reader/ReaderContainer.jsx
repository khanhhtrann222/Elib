import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import useGitHubClient from '../../hooks/useGitHubClient';
import PdfPage from './components/PdfPage';
import ReaderControlBar from './components/ReaderControlBar';
import OutlineDrawer from './components/OutlineDrawer';
import { Loader2 } from 'lucide-react';
import './ReaderContainer.css';

// Set up PDF.js worker path dynamically using unpkg to match installed library version.
// This is the most bulletproof Vite setup pattern for code splitting.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ReaderContainer({ bookId, onCloseReader }) {
  const { getBookPdfUrl, getBookMetadata } = useGitHubClient();
  
  const [bookMetadata, setBookMetadata] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation & Bookmarks State
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  const scrollContainerRef = useRef(null);

  // 1. Fetch book details and PDF file stream url
  useEffect(() => {
    let active = true;
    
    const loadBookData = async () => {
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
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to retrieve PDF file. Ensure the repository path exists.');
      }
    };

    loadBookData();
    return () => { active = false; };
  }, [bookId, getBookPdfUrl, getBookMetadata]);

  // 2. Load PDF Document from URL
  useEffect(() => {
    if (!pdfUrl) return;

    let active = true;
    const loadingTask = pdfjs.getDocument({
      url: pdfUrl,
      withCredentials: false
    });

    loadingTask.promise.then(
      (loadedDoc) => {
        if (!active) return;
        setPdfDoc(loadedDoc);
        setTotalPages(loadedDoc.numPages);
        setLoading(false);

        // Restore last read page if it exists
        const savedProgress = localStorage.getItem('elib_reading_progress');
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          if (parsed[bookId]?.page) {
            setTimeout(() => {
              navigateToPage(parsed[bookId].page);
            }, 500);
          }
        }
      },
      (err) => {
        console.error('PDF.js loading failed:', err);
        if (active) {
          setError(`Failed to open PDF document: ${err.message}`);
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      loadingTask.destroy();
    };
  }, [pdfUrl, bookId]);

  // 3. Load bookmarks from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(`elib_bookmarks_${bookId}`);
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, [bookId]);

  // 4. Save progress to LocalStorage
  const handlePageVisible = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    
    // Throttle progress updates to LocalStorage
    const savedProgress = localStorage.getItem('elib_reading_progress') || '{}';
    const parsed = JSON.parse(savedProgress);
    const percent = totalPages > 0 ? (pageNumber / totalPages) * 100 : 0;
    
    parsed[bookId] = {
      page: pageNumber,
      percent: percent,
      lastRead: new Date().toISOString()
    };
    localStorage.setItem('elib_reading_progress', JSON.stringify(parsed));
  }, [bookId, totalPages]);

  // Toggle dynamic bookmark
  const toggleBookmark = () => {
    let updated;
    if (bookmarks.includes(currentPage)) {
      updated = bookmarks.filter(p => p !== currentPage);
    } else {
      updated = [...bookmarks, currentPage];
    }
    setBookmarks(updated);
    localStorage.setItem(`elib_bookmarks_${bookId}`, JSON.stringify(updated));
  };

  const deleteBookmark = (pageNumber) => {
    const updated = bookmarks.filter(p => p !== pageNumber);
    setBookmarks(updated);
    localStorage.setItem(`elib_bookmarks_${bookId}`, JSON.stringify(updated));
  };

  // Jump scroll viewport to page index
  const navigateToPage = (pageNum) => {
    const targetElement = document.getElementById(`pdf-page-wrapper-${pageNum}`);
    if (targetElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const topOffset = targetElement.offsetTop - container.offsetTop - 24; // Padding offset
      container.scrollTo({
        top: topOffset,
        behavior: 'smooth'
      });
      setCurrentPage(pageNum);
    }
  };

  if (loading) {
    return (
      <div className="reader-loader animate-fade-in">
        <Loader2 className="reader-loader__spinner" size={48} />
        <h3>Loading PDF Document</h3>
        <p>Streaming binary chunks from file storage...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reader-error animate-fade-in">
        <h3>Unable to load document</h3>
        <p>{error}</p>
        <button className="reader-error__btn" onClick={onCloseReader}>Return to Catalog</button>
      </div>
    );
  }

  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);
  const isBookmarked = bookmarks.includes(currentPage);

  return (
    <div className="reader-container">
      {bookMetadata && (
        <div className="reader-titlebar glass-panel animate-fade-in">
          <span className="reader-titlebar__title">{bookMetadata.title}</span>
          <span className="reader-titlebar__subtitle">by {bookMetadata.author}</span>
        </div>
      )}

      <div className="reader-viewport" ref={scrollContainerRef}>
        <div className="reader-pages-list">
          {pdfDoc && pagesArray.map((pageNum) => (
            <div 
              id={`pdf-page-wrapper-${pageNum}`} 
              key={pageNum}
              className="reader-page-wrapper"
            >
              <PdfPage
                pdfDoc={pdfDoc}
                pageNumber={pageNum}
                scale={scale}
                onVisible={handlePageVisible}
              />
            </div>
          ))}
        </div>
      </div>

      <ReaderControlBar
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onScaleChange={setScale}
        onPageChange={navigateToPage}
        isBookmarked={isBookmarked}
        onToggleBookmark={toggleBookmark}
        onToggleOutline={() => setIsOutlineOpen(true)}
        onCloseReader={onCloseReader}
      />

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
