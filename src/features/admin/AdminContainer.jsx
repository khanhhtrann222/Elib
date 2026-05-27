import { useState } from 'react';
import useGitHubClient from '../../hooks/useGitHubClient';
import useGeminiMetadata from './hooks/useGeminiMetadata';
import UploadDropzone from './components/UploadDropzone';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { ArrowLeft, Save, Sparkles, Settings, FileCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
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
    <div className="admin-container">
      <header className="admin-header glass-panel">
        <div className="admin-header__brand">
          <Button 
            variant="text" 
            icon={<ArrowLeft size={18} />} 
            onClick={onNavigateToCatalog}
          >
            Catalog
          </Button>
          <div className="admin-header__divider" />
          <h1 className="admin-header__title">Workspace Manager</h1>
        </div>

        <div className="admin-header__tabs">
          <button 
            className={`admin-header__tab ${activeTab === 'upload' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Sparkles size={16} />
            <span>Add Book</span>
          </button>
          
          <button 
            className={`admin-header__tab ${activeTab === 'settings' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>Connection Settings</span>
          </button>
        </div>
      </header>

      {statusMessage && (
        <div className={`admin-status-toast glass-panel animate-fade-in ${uploadStatus}`}>
          {uploadStatus === 'success' ? (
            <CheckCircle2 size={16} className="status-icon success" />
          ) : (
            <FileCheck size={16} className="status-icon info" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      <main className="admin-content">
        {activeTab === 'settings' ? (
          <Card variant="glass" className="admin-settings-card animate-fade-in">
            <h2>Storage & AI Credentials</h2>
            <p className="settings-intro">
              Connecting your application to a GitHub Repository will let you commit new PDF files, cover images, and index files directly. If left blank, the app will simulate commits using your browser's Local Storage.
            </p>

            <div className="settings-section">
              <h3>GitHub Repository Settings</h3>
              <div className="settings-grid">
                <TextField 
                  label="GitHub Owner (Username / Org)"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. github-username"
                />
                <TextField 
                  label="Repository Name"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g. library-vault"
                />
                <TextField 
                  label="Branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                />
                <TextField 
                  label="Personal Access Token (Classic / Fine-grained)"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_..."
                  helperText="Required permissions: 'repo' or 'contents:write'"
                />
              </div>
            </div>

            <div className="settings-section divider">
              <h3>Gemini AI Credentials</h3>
              <TextField 
                label="Gemini API Key"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                helperText="Required to automatically generate book metadata using Gemini models"
              />
            </div>

            <div className="settings-actions">
              <Button variant="filled" icon={<Save size={16} />} onClick={handleSaveSettings}>
                Save Credentials
              </Button>
              <div className="connection-status">
                {isGitHubConnected ? (
                  <span className="status-badge connected">GitHub Storage Enabled</span>
                ) : (
                  <span className="status-badge mock">Local Sandbox Mode Enabled</span>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <form className="admin-upload-workspace" onSubmit={handleSubmit}>
            <div className="workspace-column left">
              <Card variant="outlined" className="upload-card">
                <h3>Select Resources</h3>
                
                <div className="upload-dropzone-wrapper">
                  <label className="input-field-title">1. Document File (PDF) *</label>
                  <UploadDropzone 
                    accept="application/pdf"
                    label="Upload PDF"
                    onFileSelect={setPdfFile}
                  />
                </div>

                <div className="upload-dropzone-wrapper">
                  <label className="input-field-title">2. Cover Art Image (PNG/JPG)</label>
                  <UploadDropzone 
                    accept="image/png, image/jpeg, image/jpg"
                    label="Upload Cover"
                    onFileSelect={setCoverFile}
                  />
                </div>

                {pdfFile && (
                  <div className="gemini-trigger-box animate-fade-in">
                    <div className="gemini-trigger-desc">
                      <Sparkles size={16} className="gemini-magic-icon" />
                      <div>
                        <strong>Metadata Generator</strong>
                        <p>Use Gemini 2.5 Flash to automatically extract title, author, description, tags, and year from this PDF.</p>
                      </div>
                    </div>
                    
                    <Button 
                      type="button"
                      variant="tonal"
                      onClick={handleGeminiGen}
                      disabled={isGeminiLoading || !geminiKey}
                      className="gemini-trigger-btn"
                    >
                      {isGeminiLoading ? 'Analyzing PDF...' : 'AI Generate'}
                    </Button>
                    
                    {!geminiKey && (
                      <span className="api-key-warning">
                        <AlertTriangle size={12} />
                        Add a Gemini API Key in settings to enable.
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <div className="workspace-column right">
              <Card variant="outlined" className="form-card">
                <h3>Book Metadata</h3>
                
                <div className="form-grid">
                  <TextField 
                    label="Book Title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter book title"
                  />
                  
                  <TextField 
                    label="Author(s) *"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                    placeholder="Enter author name"
                  />

                  <div className="form-grid__row-2">
                    <TextField 
                      label="Publication Year"
                      value={publicationYear}
                      onChange={(e) => setPublicationYear(e.target.value)}
                      placeholder="e.g. 2021"
                    />
                    
                    <TextField 
                      label="Custom Cover URL (Optional)"
                      value={customCoverUrl}
                      onChange={(e) => setCustomCoverUrl(e.target.value)}
                      placeholder="https://..."
                      disabled={!!coverFile}
                      helperText={coverFile ? "Using uploaded cover art" : "Direct link to cover image"}
                    />
                  </div>

                  <TextField 
                    label="Categories (comma separated)"
                    value={categories}
                    onChange={(e) => setCategories(e.target.value)}
                    placeholder="e.g. Technology, Programming"
                  />

                  <TextField 
                    label="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. JavaScript, ES6, Advanced"
                  />

                  <div className="text-field-textarea-wrapper">
                    <label className="textarea-label">Book Summary / Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write a brief overview of the book contents..."
                      className="form-textarea"
                      rows={5}
                    />
                  </div>
                </div>

                <div className="form-submit-actions">
                  <Button 
                    type="submit" 
                    variant="filled" 
                    disabled={uploadStatus === 'committing' || (!pdfFile && !title)}
                    className="submit-btn"
                  >
                    {uploadStatus === 'committing' ? 'Saving Book...' : 'Save to Library'}
                  </Button>
                </div>
              </Card>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
