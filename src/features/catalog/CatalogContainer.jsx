import React, { useEffect, useState, useMemo } from 'react';
import useGitHubClient from '../../hooks/useGitHubClient';
import BookCard from './components/BookCard';
import { RefreshCw, LayoutGrid, FileText } from 'lucide-react';

export default function CatalogContainer({ onSelectBook, onNavigateToAdmin, searchQuery, onlyFavorites }) {
  const { getBooksIndex } = useGitHubClient();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting within catalog
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');

  // Trigger loading books
  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const index = await getBooksIndex();
      setBooks(index);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách sách. Vui lòng làm mới trang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [getBooksIndex]);

  // Extract unique categories
  const categories = useMemo(() => {
    const allCats = books.flatMap(b => b.categories || []);
    return [...new Set(allCats)].filter(Boolean);
  }, [books]);

  // Count books currently being read
  const stats = useMemo(() => {
    const savedProgress = JSON.parse(localStorage.getItem('elib_reading_progress') || '{}');
    const readingBooksCount = books.filter(b => savedProgress[b.id]?.percent > 0).length;
    return {
      total: books.length,
      reading: readingBooksCount
    };
  }, [books]);

  // Filter & Sort books list
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books];

    // 1. Favorites Filter (if enabled via navigation)
    if (onlyFavorites) {
      const savedProgress = JSON.parse(localStorage.getItem('elib_reading_progress') || '{}');
      result = result.filter(book => {
        if (savedProgress[book.id] && savedProgress[book.id].percent > 0) return true;
        const bookmarks = JSON.parse(localStorage.getItem(`elib_bookmarks_${book.id}`) || '[]');
        if (bookmarks.length > 0) return true;
        return false;
      });
    }

    // 2. Search Query (passed from App.jsx global header)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(book => 
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description?.toLowerCase().includes(q) ||
        book.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // 3. Category Filter
    if (selectedCategory) {
      result = result.filter(book => 
        book.categories?.includes(selectedCategory)
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'author') {
        return a.author.localeCompare(b.author);
      }
      if (sortBy === 'newest') {
        return b.id.localeCompare(a.id);
      }
      return 0;
    });

    return result;
  }, [books, searchQuery, selectedCategory, sortBy, onlyFavorites]);

  return (
    <section className="h-full overflow-y-auto pr-2 custom-scrollbar pb-16">
      {/* Catalog Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-lg gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            {onlyFavorites ? 'Sách yêu thích của bạn' : 'Bộ sưu tập của bạn'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {onlyFavorites 
              ? `${filteredAndSortedBooks.length} cuốn sách được đánh dấu hoặc đang đọc` 
              : `${stats.total} cuốn sách trong thư viện • ${stats.reading} cuốn đang đọc`
            }
          </p>
        </div>

        {/* Action button panel */}
        <div className="flex items-center gap-sm">
          {/* Sorting Dropdown */}
          <div className="relative">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 rounded-full border border-outline-variant bg-surface text-label-lg font-label-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-surface-container-high transition-colors text-on-surface"
            >
              <option value="title">Sắp xếp: Tên sách</option>
              <option value="author">Sắp xếp: Tác giả</option>
              <option value="newest">Sắp xếp: Gần đây</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">arrow_drop_down</span>
          </div>

          <button 
            onClick={fetchBooks}
            disabled={loading}
            className="p-2 rounded-full border border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center disabled:opacity-50"
            title="Làm mới thư viện"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      {!onlyFavorites && categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-lg custom-scrollbar">
          <button 
            onClick={() => setSelectedCategory('')}
            className={`px-md py-sm rounded-full text-label-lg font-label-lg transition-all duration-200 shrink-0 ${!selectedCategory ? 'bg-secondary-container text-on-secondary-container shadow-sm font-semibold' : 'border border-outline-variant hover:bg-surface-container-high text-on-surface-variant'}`}
          >
            Tất cả thể loại
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-md py-sm rounded-full text-label-lg font-label-lg transition-all duration-200 shrink-0 ${selectedCategory === cat ? 'bg-secondary-container text-on-secondary-container shadow-sm font-semibold' : 'border border-outline-variant hover:bg-surface-container-high text-on-surface-variant'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-container-lowest rounded-lg border border-surface-variant overflow-hidden animate-pulse flex flex-col h-full">
              <div className="aspect-[3/4] bg-surface-container" />
              <div className="p-lg space-y-3 flex-grow">
                <div className="h-5 bg-surface-container rounded w-3/4" />
                <div className="h-4 bg-surface-container rounded w-1/2" />
                <div className="h-2 bg-surface-container rounded w-full pt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-xl bg-surface-container-low rounded-lg border border-surface-variant text-center max-w-lg mx-auto mt-10">
          <span className="material-symbols-outlined text-error text-[48px] mb-md">error</span>
          <h3 className="font-title-lg text-title-lg text-on-surface mb-xs">Lỗi kết nối</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{error}</p>
          <button 
            onClick={fetchBooks}
            className="px-lg py-sm rounded-full bg-primary text-on-primary text-label-lg font-label-lg hover:opacity-90 shadow"
          >
            Thử lại
          </button>
        </div>
      ) : filteredAndSortedBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-xl text-center max-w-lg mx-auto mt-10">
          <span className="material-symbols-outlined text-on-surface-variant text-[64px] mb-md opacity-50">search_off</span>
          <h3 className="font-title-lg text-title-lg text-on-surface mb-xs">Không tìm thấy sách</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {onlyFavorites 
              ? 'Thư mục yêu thích trống. Hãy đánh dấu trang sách hoặc đọc thêm sách!'
              : 'Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.'
            }
          </p>
          {!onlyFavorites && (
            <button 
              onClick={() => { setSelectedCategory(''); }}
              className="mt-md px-lg py-sm rounded-full border border-outline-variant hover:bg-surface-container-high text-label-lg font-label-lg text-on-surface transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {filteredAndSortedBooks.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              onClick={() => onSelectBook(book.id)} 
            />
          ))}
        </div>
      )}
    </section>
  );
}
