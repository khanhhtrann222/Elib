import React, { useState, useRef } from 'react';
import { FileUp, File, Image, AlertCircle } from 'lucide-react';
import './UploadDropzone.css';

export default function UploadDropzone({ 
  onFileSelect, 
  accept = 'application/pdf', 
  label = 'Upload file',
  maxSizeMB = 25
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateFile = (file) => {
    setError('');
    
    // Validate file type
    const acceptTypes = accept.split(',').map(t => t.trim());
    const fileType = file.type;
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    const isValidType = acceptTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type;
      }
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return fileType === type;
    });

    if (!isValidType) {
      setError(`Invalid file type. Expected: ${accept}`);
      return false;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Max allowed: ${maxSizeMB}MB.`);
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isPdf = accept.includes('pdf');

  return (
    <div 
      className={`upload-dropzone ${isDragActive ? 'is-drag-active' : ''} ${error ? 'has-error' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="upload-dropzone__input"
        accept={accept}
        onChange={handleChange}
      />
      
      <div className="upload-dropzone__content" onClick={onButtonClick}>
        {selectedFile ? (
          <div className="upload-dropzone__selected">
            {isPdf ? (
              <File className="upload-dropzone__icon selected pdf" size={40} />
            ) : (
              <Image className="upload-dropzone__icon selected img" size={40} />
            )}
            <div className="upload-dropzone__details">
              <span className="upload-dropzone__filename">{selectedFile.name}</span>
              <span className="upload-dropzone__filesize">{formatBytes(selectedFile.size)}</span>
            </div>
          </div>
        ) : (
          <>
            <FileUp className="upload-dropzone__icon" size={32} />
            <p className="upload-dropzone__prompt">
              Drag & drop your {isPdf ? 'PDF book' : 'Cover image'} or <span className="upload-dropzone__link">browse files</span>
            </p>
            <p className="upload-dropzone__specs">
              Supported formats: {isPdf ? '.pdf' : '.png, .jpg'} (Max {maxSizeMB}MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="upload-dropzone__error animate-fade-in">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
