import React, { useState, useEffect } from 'react';
import Drawer from '../../../components/Drawer';
import { Bookmark, List, ChevronRight, Trash2 } from 'lucide-react';
import './OutlineDrawer.css';

export default function OutlineDrawer({
  isOpen,
  onClose,
  pdfDoc,
  onNavigatePage,
  bookmarks = [],
  onDeleteBookmark
}) {
  const [activeTab, setActiveTab] = useState('outline'); // 'outline' | 'bookmarks'
  const [outline, setOutline] = useState([]);

  // Fetch the PDF's outline (Table of Contents) when the PDF doc is loaded
  useEffect(() => {
    if (!pdfDoc || !isOpen) return;

    const fetchOutline = async () => {
      try {
        const docOutline = await pdfDoc.getOutline();
        if (docOutline) {
          // Format outline to a flat or simple hierarchical structure
          const formatted = await Promise.all(
            docOutline.map(async (item) => {
              let pageIndex = -1;
              try {
                if (item.dest) {
                  // Resolve destination target to a page ref/index
                  const ref = typeof item.dest === 'string' ? item.dest : item.dest[0];
                  const pageNumber = await pdfDoc.getPageIndex(ref);
                  pageIndex = pageNumber + 1; // getPageIndex is 0-indexed
                }
              } catch (e) {
                console.warn('Could not resolve dest page number', e);
              }
              return {
                title: item.title,
                pageNumber: pageIndex,
                items: item.items || []
              };
            })
          );
          setOutline(formatted.filter(item => item.pageNumber > 0));
        } else {
          setOutline([]);
        }
      } catch (err) {
        console.error('Failed to retrieve PDF outline:', err);
        setOutline([]);
      }
    };

    fetchOutline();
  }, [pdfDoc, isOpen]);

  const handleOutlineClick = (pageNum) => {
    onNavigatePage(pageNum);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      anchor="left"
      title="Book Navigation"
    >
      <div className="outline-drawer">
        <div className="outline-drawer__tabs">
          <button
            className={`outline-drawer__tab ${activeTab === 'outline' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('outline')}
          >
            <List size={16} />
            <span>Contents</span>
          </button>
          
          <button
            className={`outline-drawer__tab ${activeTab === 'bookmarks' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <Bookmark size={16} />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>
        </div>

        <div className="outline-drawer__body">
          {activeTab === 'outline' ? (
            outline.length > 0 ? (
              <ul className="outline-list">
                {outline.map((item, idx) => (
                  <li 
                    key={idx} 
                    className="outline-item"
                    onClick={() => handleOutlineClick(item.pageNumber)}
                  >
                    <span className="outline-item__title">
                      <ChevronRight size={14} className="outline-item__bullet" />
                      {item.title}
                    </span>
                    <span className="outline-item__page">p. {item.pageNumber}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="outline-drawer__empty">
                <p>No table of contents available in this document.</p>
              </div>
            )
          ) : (
            bookmarks.length > 0 ? (
              <ul className="bookmark-list">
                {bookmarks.sort((a, b) => a - b).map((pageNum) => (
                  <li 
                    key={pageNum} 
                    className="bookmark-item animate-fade-in"
                  >
                    <div 
                      className="bookmark-item__click-zone"
                      onClick={() => handleOutlineClick(pageNum)}
                    >
                      <Bookmark size={14} fill="var(--md-sys-color-primary)" color="var(--md-sys-color-primary)" />
                      <span>Page {pageNum}</span>
                    </div>
                    <button 
                      className="bookmark-item__delete"
                      onClick={() => onDeleteBookmark(pageNum)}
                      aria-label={`Delete bookmark on page ${pageNum}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="outline-drawer__empty">
                <p>No bookmarks set. Click the Bookmark button while reading to save pages.</p>
              </div>
            )
          )}
        </div>
      </div>
    </Drawer>
  );
}
