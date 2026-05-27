import { ZoomIn, ZoomOut, Maximize2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import './ReaderControlBar.css';

export default function ReaderControlBar({
  currentPage,
  totalPages,
  scale,
  onScaleChange,
  onPageChange,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  isBookmarked,
  onToggleBookmark,
  onToggleOutline,
  progressPercent,
}) {
  const handlePageInput = (e) => {
    if (e.key === 'Enter') {
      const v = parseInt(e.target.value, 10);
      if (!isNaN(v) && v >= 1 && v <= totalPages) onPageChange(v);
    }
  };

  const handleScrubClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const page = Math.max(1, Math.round((pct / 100) * totalPages));
    onPageChange(page);
  };

  return (
    <div className="reader-control-bar animate-fade-in">
      {/* Top row: prev | page info | next | zoom | bookmark | outline */}
      <div className="reader-control-bar__top">
        <div className="reader-control-bar__nav-group">
          <button
            className="reader-control-bar__nav-btn"
            onClick={onPrev}
            disabled={!canGoPrev}
          >
            <ChevronLeft size={18} />
            Trang trước
          </button>

          <div className="reader-control-bar__page-display">
            <span className="reader-control-bar__page-total" style={{ color: 'rgba(255,255,255,0.4)', marginRight: 4 }}>Trang</span>
            <input
              className="reader-control-bar__page-input"
              type="text"
              defaultValue={currentPage}
              key={currentPage}
              onKeyDown={handlePageInput}
            />
            <span className="reader-control-bar__page-total">/ {totalPages}</span>
          </div>

          <button
            className="reader-control-bar__nav-btn"
            onClick={onNext}
            disabled={!canGoNext}
          >
            Trang sau
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="reader-control-bar__right">
          {/* Zoom group */}
          <div className="reader-control-bar__zoom-group">
            <button
              className="reader-control-bar__zoom-btn"
              onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}
              title="Thu nhỏ"
            >
              <ZoomOut size={15} />
            </button>
            <span className="reader-control-bar__zoom-label">{Math.round(scale * 100)}%</span>
            <button
              className="reader-control-bar__zoom-btn"
              onClick={() => onScaleChange(Math.min(2.5, scale + 0.25))}
              title="Phóng to"
            >
              <ZoomIn size={15} />
            </button>
            <button
              className="reader-control-bar__zoom-btn"
              onClick={() => onScaleChange(1.0)}
              title="Đặt lại"
            >
              <Maximize2 size={12} />
            </button>
          </div>

          <div className="reader-control-bar__divider" />

          {/* Bookmark */}
          <button
            className={`reader-control-bar__action-btn${isBookmarked ? ' is-bookmarked' : ''}`}
            onClick={onToggleBookmark}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '1rem', fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
            {isBookmarked ? 'Đã đánh dấu' : 'Đánh dấu'}
          </button>

          {/* Outline */}
          <button className="reader-control-bar__action-btn" onClick={onToggleOutline}>
            <BookOpen size={15} />
            Mục lục
          </button>
        </div>
      </div>

      {/* Progress row */}
      <div className="reader-control-bar__progress-row">
        <span className="reader-control-bar__progress-pct">{Math.round(progressPercent)}%</span>
        <div
          className="reader-control-bar__scrubber"
          onClick={handleScrubClick}
          title="Nhấp để chuyển trang"
        >
          <div
            className="reader-control-bar__scrubber-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem' }}>flag</span>
      </div>
    </div>
  );
}
