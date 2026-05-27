import React from 'react';
import Button from '../../../components/Button';
import ProgressBar from '../../../components/ProgressBar';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Menu,
  Maximize2
} from 'lucide-react';
import './ReaderControlBar.css';

export default function ReaderControlBar({
  currentPage,
  totalPages,
  scale,
  onScaleChange,
  onPageChange,
  isBookmarked,
  onToggleBookmark,
  onToggleOutline,
  onCloseReader
}) {
  const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  const handlePageInput = (e) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(e.target.value, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        onPageChange(pageNum);
      }
    }
  };

  const handleProgressScrub = (percentage) => {
    const targetPage = Math.max(1, Math.min(totalPages, Math.round((percentage / 100) * totalPages)));
    onPageChange(targetPage);
  };

  return (
    <div className="reader-control-bar glass-panel animate-fade-in">
      <div className="reader-control-bar__section left">
        <Button 
          variant="text" 
          icon={<ArrowLeft size={18} />} 
          onClick={onCloseReader}
          className="reader-control-bar__back-btn"
        >
          Back
        </Button>
        <div className="reader-control-bar__divider" />
        <Button 
          variant="text" 
          icon={<Menu size={18} />} 
          onClick={onToggleOutline}
        >
          Contents
        </Button>
      </div>

      <div className="reader-control-bar__section center">
        <div className="reader-control-bar__navigation">
          <button 
            disabled={currentPage <= 1} 
            onClick={() => onPageChange(currentPage - 1)}
            className="reader-control-bar__nav-btn"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="reader-control-bar__page-indicator">
            <input 
              type="text" 
              defaultValue={currentPage}
              key={currentPage} // Forces update when page changes externally
              onKeyDown={handlePageInput}
              className="reader-control-bar__page-input"
            />
            <span className="reader-control-bar__page-total">/ {totalPages}</span>
          </div>

          <button 
            disabled={currentPage >= totalPages} 
            onClick={() => onPageChange(currentPage + 1)}
            className="reader-control-bar__nav-btn"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="reader-control-bar__scrubber-container">
          <ProgressBar 
            progress={progressPercent} 
            interactive={true} 
            onChange={handleProgressScrub}
            className="reader-control-bar__scrubber"
          />
        </div>
      </div>

      <div className="reader-control-bar__section right">
        <div className="reader-control-bar__zoom">
          <button 
            onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}
            className="reader-control-bar__zoom-btn"
          >
            <ZoomOut size={16} />
          </button>
          <span className="reader-control-bar__zoom-label">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => onScaleChange(Math.min(2.5, scale + 0.25))}
            className="reader-control-bar__zoom-btn"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            onClick={() => onScaleChange(1.0)} // Reset to 100%
            className="reader-control-bar__zoom-btn reset"
            title="Reset Zoom"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        
        <div className="reader-control-bar__divider" />

        <Button 
          variant={isBookmarked ? 'filled' : 'tonal'} 
          icon={<Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />} 
          onClick={onToggleBookmark}
          className="reader-control-bar__bookmark-btn"
        >
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
      </div>
    </div>
  );
}
