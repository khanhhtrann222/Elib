import { useState, useEffect, useRef } from 'react';
import useGitHubClient from '../../hooks/useGitHubClient';
import useGeminiMetadata from './hooks/useGeminiMetadata';
import UploadDropzone from './components/UploadDropzone';
import './AdminContainer.css';

export default function AdminContainer({ onNavigateToCatalog }) {
  const { config, saveConfig, isGitHubConnected, commitBook } = useGitHubClient();
  const { generateMetadata, loading: isGeminiLoading } = useGeminiMetadata();

  // Tabs: 'upload' | 'settings'
  const [activeTab, setActiveTab] = useState('upload');
  
  // API credentials states (local copy before save)
  const [owner, setOwner] = useState(config.owner || '');
  const [repo, setRepo] = useState(config.repo || '');
  const [branch, setBranch] = useState(config.branch || 'main');
  const [token, setToken] = useState(config.token || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('elib_gemini_key') || '');

  // Upload file states
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // Editable Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [customCoverUrl, setCustomCoverUrl] = useState('');

  // Status indicators
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'committing' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const coverInputRef = useRef(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [coverFile]);

  const handleCoverInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setCoverFile(selected);
    }
  };

  const handleOpenCoverDialog = () => {
    coverInputRef.current?.click();
  };

  // Handle saving API configuration
  const handleSaveSettings = () => {
    saveConfig({ owner, repo, branch, token });
    localStorage.setItem('elib_gemini_key', geminiKey);
    setStatusMessage('API configurations saved successfully.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Trigger Gemini API metadata generation
  const handleGeminiGen = async () => {
    if (!pdfFile) return;
    setStatusMessage('');
    try {
      const result = await generateMetadata(pdfFile, geminiKey);
      if (result) {
        setTitle(result.title || '');
        setAuthor(result.author || '');
        setDescription(result.description || '');
        setTags(result.tags ? result.tags.join(', ') : '');
        setCategories(result.categories ? result.categories.join(', ') : '');
        setPublicationYear(result.publicationYear || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit files & metadata commits
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile && !title) return;
    
    setUploadStatus('committing');
    setStatusMessage('Uploading resources to storage backend...');
    
    const formattedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    const formattedCategories = categories.split(',').map(c => c.trim()).filter(Boolean);

    const bookMetadata = {
      title,
      author,
      description,
      tags: formattedTags,
      categories: formattedCategories,
      publicationYear,
      coverUrl: customCoverUrl || ''
    };

    try {
      const bookId = await commitBook(bookMetadata, pdfFile, coverFile);
      setUploadStatus('success');
      setStatusMessage(`Successfully saved "${title}" (ID: ${bookId}) to library.`);
      
      // Reset forms
      setPdfFile(null);
      setCoverFile(null);
      setTitle('');
      setAuthor('');
      setDescription('');
      setTags('');
      setCategories('');
      setPublicationYear('');
      setCustomCoverUrl('');
      
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
      setStatusMessage(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="admin-page-shell">
      <header className="admin-page-shell__topbar">
        <div className="admin-page-shell__heading">
          <h1 className="admin-page-shell__title">Thêm sách mới</h1>
          <p className="admin-page-shell__subtitle">Thu thập nội dung, bìa và siêu dữ liệu để xuất bản ngay trong thư viện.</p>
        </div>

        <div className="admin-page-shell__actions">
          <div className="admin-page-shell__icon-group">
            <button type="button" className="icon-button" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button" className="icon-button" title="Account">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>

          <div className="admin-page-shell__button-group">
            <button type="button" className="secondary-button" onClick={onNavigateToCatalog}>Hủy</button>
            <button type="submit" className="primary-button" form="add-book-form" disabled={uploadStatus === 'committing'}>
              {uploadStatus === 'committing' ? 'Đang xử lý...' : 'Thêm vào thư viện'}
            </button>
          </div>
        </div>
      </header>

      <main className="admin-page-shell__grid">
        <section className="admin-panel admin-panel--content">
          <h2>Thông tin chi tiết</h2>
          <form id="add-book-form" className="admin-book-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tiêu đề sách</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên sách..."
                type="text"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Tác giả</label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Tên tác giả..."
                  type="text"
                />
              </div>
              <div className="form-group">
                <label>Thể loại</label>
                <select value={categories} onChange={(e) => setCategories(e.target.value)}>
                  <option value="">Chọn thể loại</option>
                  <option value="Văn học cổ điển">Văn học cổ điển</option>
                  <option value="Khoa học viễn tưởng">Khoa học viễn tưởng</option>
                  <option value="Kinh tế &amp; Quản trị">Kinh tế &amp; Quản trị</option>
                  <option value="Tâm lý học">Tâm lý học</option>
                  <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tóm tắt nội dung sách..."
                rows={6}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>ISBN</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="978-3-16-148410-0"
                  type="text"
                />
              </div>
              <div className="form-group">
                <label>Năm xuất bản</label>
                <input
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(e.target.value)}
                  placeholder="2024"
                  type="number"
                />
              </div>
            </div>

            <div className="admin-form-divider" />

            <div className="upload-section">
              <label>1. Tệp nội dung sách (PDF)</label>
              <UploadDropzone
                accept="application/pdf"
                label="Upload PDF"
                onFileSelect={setPdfFile}
              />
            </div>

            <div className="upload-info-row">
              <span className="material-symbols-outlined">description</span>
              <span>{pdfFile ? pdfFile.name : 'Chưa chọn tệp nào'}</span>
            </div>
          </form>
        </section>

        <aside className="admin-panel admin-panel--sidebar">
          <div className="cover-panel">
            <div className="cover-panel__header">
              <h2>Ảnh bìa sách</h2>
            </div>
            <div className="cover-preview" onClick={handleOpenCoverDialog}>
              {coverPreviewUrl ? (
                <img src={coverPreviewUrl} alt="Book cover preview" />
              ) : (
                <div className="cover-preview__placeholder">
                  <span className="material-symbols-outlined">cloud_upload</span>
                  <div>
                    <strong>Kéo thả hoặc click để tải lên</strong>
                    <p>Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
                  </div>
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="cover-preview__input"
                onChange={handleCoverInputChange}
              />
            </div>

            <button type="button" className="cover-upload-btn" onClick={handleOpenCoverDialog}>
              <span className="material-symbols-outlined">image</span>
              Tải lên ảnh bìa
            </button>

            <div className="cover-hint">
              <div className="cover-hint__icon">
                <span className="material-symbols-outlined">info</span>
              </div>
              <p>Sử dụng ảnh có độ phân giải tối thiểu 1200x1800 để có chất lượng hiển thị tốt nhất trên mọi thiết bị.</p>
            </div>
          </div>
        </aside>
      </main>

      <div className={`admin-toast ${uploadStatus === 'success' ? 'admin-toast--success' : ''} ${uploadStatus === 'error' ? 'admin-toast--error' : ''}`}>
        <span className="material-symbols-outlined">check_circle</span>
        <span>{uploadStatus === 'success' ? 'Sách đã được thêm thành công vào thư viện!' : statusMessage || 'Sẵn sàng để thêm sách.'}</span>
      </div>
    </div>
  );
}

                
    