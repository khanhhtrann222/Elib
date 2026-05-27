import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export default function BookCard({ book, onClick }) {
  const [progress] = useState(() => {
    try {
      const savedProgress = localStorage.getItem('elib_reading_progress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        if (parsed[book.id]) {
          return parsed[book.id].percent || 0;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 0;
  });

  const [isFavorited] = useState(() => {
    try {
      const savedBookmarks = localStorage.getItem(`elib_bookmarks_${book.id}`);
      if (savedBookmarks) {
        const bookmarks = JSON.parse(savedBookmarks);
        if (bookmarks.length > 0) {
          return true;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  return (
    <div 
      onClick={onClick}
      className="group bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-variant hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col h-full"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-surface-variant flex items-center justify-center">
        {book.coverUrl ? (
          <img 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            src={book.coverUrl}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-on-surface-variant p-4 text-center">
            <BookOpen size={48} className="opacity-40 mb-2" />
            <span className="text-xs font-semibold max-w-[80%] truncate">{book.title}</span>
          </div>
        )}
        
        {/* Bookmark star indicator */}
        {isFavorited && (
          <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-md p-2 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
        )}

        {/* Category label on cover top-left */}
        {book.categories?.[0] && (
          <div className="absolute top-4 left-4 bg-primary/95 text-on-primary text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">
            {book.categories[0]}
          </div>
        )}
      </div>

      <div className="p-lg flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-title-md text-title-md text-on-surface mb-xs truncate group-hover:text-primary transition-colors" title={book.title}>
            {book.title}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-md truncate">
            {book.author}
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-surface-variant/40">
          {progress > 0 ? (
            <div className="space-y-1">
              <div className="flex justify-between text-label-md font-label-md text-on-surface-variant">
                <span>Tiến độ đọc</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full bg-secondary-fixed/30 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-label-md font-label-md text-on-surface-variant">
              <span>Chưa đọc</span>
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
            </div>
          )}

          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
