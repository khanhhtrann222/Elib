import React, { useEffect, useState, useMemo } from 'react';
import useGitHubClient from '../../hooks/useGitHubClient';
import BookCard from './components/BookCard';
import FilterBar from './components/FilterBar';
import { Library, UploadCloud, RefreshCw } from 'lucide-react';
import Button from '../../components/Button';
import './CatalogContainer.css';

export default function CatalogContainer({ onSelectBook, onNavigateToAdmin }) {
  const { getBooksIndex } = useGitHubClient();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const index = await getBooksIndex();
      setBooks(index);
    } catch (err) {
      console.error(err);
      setError('Failed to load catalog books. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [getBooksIndex]);

  // Extract all unique categories dynamically
  const categories = useMemo(() => {
    const allCats = books.flatMap(b => b.categories || []);
    return [...new Set(allCats)].filter(Boolean);
  }, [books]);

  // Filter & Sort books
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(book => 
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q) ||
        book.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // 2. Category selection
    if (selectedCategory) {
      result = result.filter(book => 
        book.categories?.includes(selectedCategory)
      );
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'author') {
        return a.author.localeCompare(b.author);
      }
      if (sortBy === 'newest') {
        // Mock ID comparison or date if available
        return b.id.localeCompare(a.id);
      }
      return 0;
    });

    return result;
  }, [books, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="catalog-container">
      <header className="catalog-header glass-panel">
        <div className="catalog-header__brand">
          <div className="catalog-header__logo">
            <Library size={24} className="catalog-header__logo-icon" />
          </div>
          <div>
            <h1 className="catalog-header__title">Bibliotheca</h1>
            <p className="catalog-header__subtitle">A cinematic workspace for high-performance reading</p>
          </div>
        </div>

        <div className="catalog-header__actions">
          <Button 
            variant="tonal" 
            icon={<RefreshCw size={16} />} 
            onClick={fetchBooks}
            disabled={loading}
            className="catalog-header__btn"
          >
            Refresh
          </Button>
          <Button 
            variant="filled" 
            icon={<UploadCloud size={16} />} 
            onClick={onNavigateToAdmin}
            className="catalog-header__btn"
          >
            Admin Panel
          </Button>
        </div>
      </header>

      <main className="catalog-content">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {loading ? (
          <div className="catalog-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="catalog-skeleton-card animate-fade-in">
                <div className="catalog-skeleton-cover" />
                <div className="catalog-skeleton-line title" />
                <div className="catalog-skeleton-line author" />
                <div className="catalog-skeleton-line desc" />
                <div className="catalog-skeleton-line desc" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="catalog-error">
            <p>{error}</p>
            <Button variant="outlined" onClick={fetchBooks}>Try Again</Button>
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="catalog-empty">
            <h3>No books found</h3>
            <p>Try resetting filters or adding new files in the admin panel.</p>
          </div>
        ) : (
          <div className="catalog-grid">
            {filteredAndSortedBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={() => onSelectBook(book.id)} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
