import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import './PdfPage.css';

export default function PdfPage({ pdfDoc, pageNumber, scale, onVisible }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  
  const [isVisible, setIsVisible] = useState(false);
  const [renderStatus, setRenderStatus] = useState('idle'); // 'idle' | 'rendering' | 'rendered' | 'error'
  const [dimensions, setDimensions] = useState({ width: 612, height: 792 }); // Default letter size aspect ratio

  // 1. Observe visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (onVisible) onVisible(pageNumber);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '100% 0px 100% 0px', // Buffer 1 full screen above/below
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [pageNumber, onVisible]);

  // 2. Fetch page dimensions (run once when PDF loads)
  useEffect(() => {
    let active = true;
    if (!pdfDoc) return;

    pdfDoc.getPage(pageNumber).then(page => {
      if (!active) return;
      const viewport = page.getViewport({ scale: 1 });
      setDimensions({ width: viewport.width, height: viewport.height });
    }).catch(err => {
      console.error(`Error loading page dimensions for page ${pageNumber}`, err);
    });

    return () => {
      active = false;
    };
  }, [pdfDoc, pageNumber]);

  // 3. Render page canvas when visible
  useEffect(() => {
    let active = true;
    if (!pdfDoc || !isVisible || !canvasRef.current) {
      // If no longer visible, cancel any ongoing rendering tasks to save CPU cycles
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
        setRenderStatus('idle');
      }
      return;
    }

    const renderPage = async () => {
      setRenderStatus('rendering');
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (!active) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Adjust for device pixel ratio for crystal clear text rendering
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale });
        
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        
        context.scale(dpr, dpr);

        // Cancel previous rendering if exists
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (active) {
          setRenderStatus('rendered');
        }
      } catch (err) {
        if (err.name === 'RenderingCancelledException' || err.name === 'WorkerDragCancelledException') {
          // Ignored since it was intentionally cancelled
          return;
        }
        console.error(`Page ${pageNumber} render failed:`, err);
        if (active) {
          setRenderStatus('error');
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, pageNumber, isVisible, scale]);

  // Calculate scaled height based on the loaded dimensions and active scale
  const scaledWidth = dimensions.width * scale;
  const scaledHeight = dimensions.height * scale;

  return (
    <div 
      className="pdf-page-container"
      ref={containerRef}
      style={{ 
        width: `${scaledWidth}px`, 
        height: `${scaledHeight}px`,
        marginBottom: '24px'
      }}
    >
      {isVisible ? (
        <>
          <canvas ref={canvasRef} className="pdf-page-canvas" />
          {renderStatus === 'rendering' && (
            <div className="pdf-page-loading-overlay">
              <Loader2 className="pdf-page-spinner" size={24} />
            </div>
          )}
        </>
      ) : (
        <div className="pdf-page-placeholder">
          <span className="pdf-page-number-hint">Page {pageNumber}</span>
        </div>
      )}
    </div>
  );
}
