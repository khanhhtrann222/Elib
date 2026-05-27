import React, { useEffect, useState } from 'react';
import Card from '../../../components/Card';
import ProgressBar from '../../../components/ProgressBar';
import { BookOpen } from 'lucide-react';
import './BookCard.css';

export default function BookCard({ book, onClick }) {
  const [progress, setProgress] = useState(0);

  // Retrieve reading progress for this book
  useEffect(() => {
    const savedProgress = localStorage.getItem('elib_reading_progress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      if (parsed[book.id]) {
        setProgress(parsed[book.id].percent || 0);
      }
    }
  }, [book.id]);

  return (
    <Card 
      variant="outlined" 
      hoverable={true} 
      className="book-card animate-fade-in"
      onClick={onClick}
    >
      <div className="book-card__cover-wrapper">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={`Cover of ${book.title}`} 
            className="book-card__cover"
            loading="lazy"
          />
        ) : (
          <div className="book-card__cover-placeholder">
            <BookOpen size={48} className="book-card__cover-icon" />
          </div>
        )}
        
        {progress > 0 && (
          <div className="book-card__progress-badge">
            {Math.round(progress)}% read
          </div>
        )}
      </div>

      <div className="book-card__details">
        <span className="book-card__category">{book.categories?.[0] || 'General'}</span>
        <h4 className="book-card__title">{book.title}</h4>
        <p className="book-card__author">by {book.author}</p>
        
        <p className="book-card__description">{book.description}</p>
        
        <div className="book-card__footer">
          <div className="book-card__tags">
            {book.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="book-card__tag">{tag}</span>
            ))}
          </div>
          {book.publicationYear && (
            <span className="book-card__year">{book.publicationYear}</span>
          )}
        </div>

        {progress > 0 && (
          <div className="book-card__progress-bar-container">
            <ProgressBar progress={progress} interactive={false} />
          </div>
        )}
      </div>
    </Card>
  );
}
