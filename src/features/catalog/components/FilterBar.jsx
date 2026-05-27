import TextField from '../../../components/TextField';
import { Search, SlidersHorizontal } from 'lucide-react';
import './FilterBar.css';

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  categories = [],
  sortBy,
  onSortChange
}) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__search-row">
        <TextField
          label="Search Books"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search size={20} />}
          placeholder="Search by title, author, or tags..."
          className="filter-bar__search"
        />
        
        <div className="filter-bar__sort-wrapper">
          <label className="filter-bar__sort-label">
            <SlidersHorizontal size={16} />
            <span>Sort by:</span>
          </label>
          <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value)}
            className="filter-bar__sort-select"
          >
            <option value="title">Title (A-Z)</option>
            <option value="author">Author (A-Z)</option>
            <option value="newest">Newest Added</option>
          </select>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="filter-bar__chips-container">
          <button
            className={`filter-chip ${selectedCategory === '' ? 'filter-chip--active' : ''}`}
            onClick={() => onCategorySelect('')}
          >
            All Books
          </button>
          
          {categories.map(category => (
            <button
              key={category}
              className={`filter-chip ${selectedCategory === category ? 'filter-chip--active' : ''}`}
              onClick={() => onCategorySelect(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
