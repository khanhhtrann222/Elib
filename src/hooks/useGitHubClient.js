import { useState, useCallback, useEffect } from 'react';

// Pre-seeded mock data for immediate out-of-the-box utility
const DEFAULT_BOOKS = [
  {
    id: 'eloquent-javascript',
    title: 'Eloquent JavaScript',
    author: 'Marijn Haverbeke',
    description: 'A modern introduction to programming, JavaScript, and the wonders of the digital world. This book guides you through the language from basics to advanced patterns.',
    tags: ['JavaScript', 'Programming', 'Web Development'],
    categories: ['Engineering'],
    publicationYear: '2018',
    coverUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80',
    pdfUrl: 'https://eloquentjavascript.net/Eloquent_JavaScript.pdf'
  },
  {
    id: 'you-dont-know-js',
    title: "You Don't Know JS Yet: Get Started",
    author: 'Kyle Simpson',
    description: 'An essential guide to understanding the deeper mechanics of JavaScript, clarifying closure, prototypes, scope, and the basic building blocks of the language.',
    tags: ['JavaScript', 'Advanced', 'Programming'],
    categories: ['Engineering'],
    publicationYear: '2020',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
    // Fallback public PDF link
    pdfUrl: 'https://raw.githubusercontent.com/getify/You-Dont-Know-JS/master/get-started/ch1.md' // MD, but let's use a dummy PDF for standard loading
  },
  {
    id: 'clean-architecture-preview',
    title: 'Clean Architecture (Sample)',
    author: 'Robert C. Martin',
    description: 'A brief introduction to system design patterns, component boundaries, and building modular, testable software applications.',
    tags: ['Architecture', 'Design Patterns', 'Testing'],
    categories: ['Systems'],
    publicationYear: '2017',
    coverUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
];

export default function useGitHubClient() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('elib_github_config');
    return saved ? JSON.parse(saved) : { owner: '', repo: '', token: '', branch: 'main' };
  });

  const [isGitHubConnected, setIsGitHubConnected] = useState(false);

  // Validate connection
  useEffect(() => {
    if (config.owner && config.repo && config.token) {
      setIsGitHubConnected(true);
    } else {
      setIsGitHubConnected(false);
    }
  }, [config]);

  const saveConfig = useCallback((newConfig) => {
    localStorage.setItem('elib_github_config', JSON.stringify(newConfig));
    setConfig(newConfig);
  }, []);

  // Ensure index file is initialized in localStorage if using mock
  useEffect(() => {
    if (!localStorage.getItem('elib_mock_books')) {
      localStorage.setItem('elib_mock_books', JSON.stringify(DEFAULT_BOOKS));
    }
  }, []);

  // 1. Get Books Index
  const getBooksIndex = useCallback(async () => {
    if (isGitHubConnected) {
      try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/metadata/index.json?ref=${config.branch}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `token ${config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch from GitHub');
        const data = await response.json();
        const content = atob(data.content.replace(/\s/g, ''));
        return JSON.parse(content);
      } catch (err) {
        console.warn('GitHub fetch failed, falling back to local storage', err);
        return JSON.parse(localStorage.getItem('elib_mock_books') || '[]');
      }
    } else {
      // Mock delayed response
      await new Promise(resolve => setTimeout(resolve, 300));
      return JSON.parse(localStorage.getItem('elib_mock_books') || '[]');
    }
  }, [config, isGitHubConnected]);

  // 2. Get Single Book Metadata
  const getBookMetadata = useCallback(async (id) => {
    if (isGitHubConnected) {
      try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/metadata/${id}.json?ref=${config.branch}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `token ${config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (!response.ok) throw new Error('Metadata not found on GitHub');
        const data = await response.json();
        const content = atob(data.content.replace(/\s/g, ''));
        return JSON.parse(content);
      } catch (err) {
        console.warn(`Failed to get metadata for ${id} from GitHub, searching local`, err);
      }
    }
    
    // Local fallback
    const localBooks = JSON.parse(localStorage.getItem('elib_mock_books') || '[]');
    const book = localBooks.find(b => b.id === id);
    if (!book) throw new Error('Book metadata not found');
    return book;
  }, [config, isGitHubConnected]);

  // 3. Get Book PDF URL / Stream
  const getBookPdfUrl = useCallback(async (id) => {
    if (isGitHubConnected) {
      // Return raw content URL which PDF.js can fetch directly, adding authentication query/headers
      // Note: PDF.js requires CORS. If token is active, we fetch and create an Object URL.
      try {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/books/${id}.pdf?ref=${config.branch}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `token ${config.token}`,
            'Accept': 'application/vnd.github.v3.raw'
          }
        });
        if (!response.ok) throw new Error('Failed to retrieve PDF binary');
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error('Failed to get PDF from GitHub, checking local', err);
      }
    }

    // Local fallback
    const localBooks = JSON.parse(localStorage.getItem('elib_mock_books') || '[]');
    const book = localBooks.find(b => b.id === id);
    
    if (book?.pdfUrl) {
      return book.pdfUrl;
    }
    
    // Check if we have committed a base64 version locally
    const base64Pdf = localStorage.getItem(`elib_pdf_${id}`);
    if (base64Pdf) {
      const bin = atob(base64Pdf);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        arr[i] = bin.charCodeAt(i);
      }
      const blob = new Blob([arr], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    }
    
    // Default fallback to a working public PDF
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  }, [config, isGitHubConnected]);

  // Helper: Convert File to Base64
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });

  // 4. Commit Book (Save PDF, Cover, and Metadata)
  const commitBook = useCallback(async (bookData, pdfFile, coverFile) => {
    const bookId = bookData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    let coverUrl = bookData.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80';
    let pdfUrl = '';

    let pdfBase64 = '';
    let coverBase64 = '';

    if (pdfFile) {
      pdfBase64 = await fileToBase64(pdfFile);
    }
    if (coverFile) {
      coverBase64 = await fileToBase64(coverFile);
    }

    const bookMetadata = {
      ...bookData,
      id: bookId,
      coverUrl: coverFile ? `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/covers/${bookId}.png` : coverUrl,
      pdfUrl: pdfFile ? `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/books/${bookId}.pdf` : ''
    };

    if (isGitHubConnected) {
      // 1. Upload Cover Image (Optional)
      if (coverFile && coverBase64) {
        await commitToGitHub(`covers/${bookId}.png`, coverBase64, `Upload cover for ${bookData.title}`, config);
      }
      
      // 2. Upload PDF Book File
      if (pdfFile && pdfBase64) {
        await commitToGitHub(`books/${bookId}.pdf`, pdfBase64, `Upload PDF for ${bookData.title}`, config);
      }

      // 3. Upload Book Metadata JSON
      const metadataBase64 = btoa(JSON.stringify(bookMetadata, null, 2));
      await commitToGitHub(`metadata/${bookId}.json`, metadataBase64, `Create metadata for ${bookData.title}`, config);

      // 4. Update index.json
      let currentIndex = [];
      try {
        currentIndex = await getBooksIndex();
      } catch (e) {
        console.log('Index file not created yet, starting fresh.');
      }
      
      const newIndex = [...currentIndex.filter(b => b.id !== bookId), {
        id: bookId,
        title: bookMetadata.title,
        author: bookMetadata.author,
        description: bookMetadata.description,
        tags: bookMetadata.tags,
        categories: bookMetadata.categories,
        publicationYear: bookMetadata.publicationYear,
        coverUrl: bookMetadata.coverUrl
      }];

      const indexBase64 = btoa(JSON.stringify(newIndex, null, 2));
      await commitToGitHub('metadata/index.json', indexBase64, `Update index.json for ${bookData.title}`, config);
    } else {
      // Save locally
      if (pdfBase64) {
        localStorage.setItem(`elib_pdf_${bookId}`, pdfBase64);
      }
      if (coverFile && coverBase64) {
        // Create local object URL / base64 image data URL
        const reader = new FileReader();
        reader.readAsDataURL(coverFile);
        await new Promise((resolve) => {
          reader.onload = () => {
            coverUrl = reader.result;
            resolve();
          };
        });
      }

      const finalLocalMetadata = {
        ...bookMetadata,
        coverUrl,
        pdfUrl: pdfFile ? '' : bookData.pdfUrl
      };

      const localBooks = JSON.parse(localStorage.getItem('elib_mock_books') || '[]');
      const updatedBooks = [...localBooks.filter(b => b.id !== bookId), finalLocalMetadata];
      localStorage.setItem('elib_mock_books', JSON.stringify(updatedBooks));
    }

    return bookId;
  }, [config, isGitHubConnected, getBooksIndex]);

  return {
    config,
    saveConfig,
    isGitHubConnected,
    getBooksIndex,
    getBookMetadata,
    getBookPdfUrl,
    commitBook
  };
}

// GitHub API Commit Helper
async function commitToGitHub(path, base64Content, commitMessage, config) {
  // Check if file exists to get SHA for updates
  let sha = undefined;
  try {
    const checkUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      sha = checkData.sha;
    }
  } catch (e) {
    console.log('File does not exist or fetch error, creating new: ', path);
  }

  const commitUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  const commitBody = {
    message: commitMessage,
    content: base64Content,
    branch: config.branch,
    ...(sha && { sha })
  };

  const response = await fetch(commitUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commitBody)
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to commit file to path ${path}. Details: ${errorDetails}`);
  }
}
