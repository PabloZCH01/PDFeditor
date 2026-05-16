import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { ScanSearch, Plus, Type, Move, Trash2 } from 'lucide-react';
import FormattingToolbar from './FormattingToolbar';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const PDFViewer = ({ pdfFile, onModificationUpdate, onModificationDelete, isEditMode, modifications = [], scale = 1.5, ocrLanguage = 'spa' }) => {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const containerRef = useRef(null);
  
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  

  const [isRendering, setIsRendering] = useState(false);
  const [textContentData, setTextContentData] = useState(null);
  const [focusedSpanInfo, setFocusedSpanInfo] = useState(null);
  
  // OCR Tracking
  const [hasNoText, setHasNoText] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  // Manual Annotation Mode
  const [annotations, setAnnotations] = useState([]);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfFile) return;
      setHasNoText(false);
      setAnnotations([]);
      const arrayBuffer = await pdfFile.arrayBuffer();
      const document = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(document);
      setNumPages(document.numPages);
      setPageNumber(1);
    };
    loadPdf();
  }, [pdfFile]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;
      
      setIsRendering(true);
      setHasNoText(false);
      
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          background: 'rgba(255,255,255,1)'
        };
        
        await page.render(renderContext).promise;

        const textContent = await page.getTextContent();
        setTextContentData({ items: textContent.items, viewport });
        
        if (textContent.items.length === 0) {
           setHasNoText(true);
        }
        
      } catch (e) {
        console.error("Render error", e);
      }
      setIsRendering(false);
    };

    renderPage();
  }, [pdfDoc, pageNumber, scale]);

  /**
   * Enhanced OCR with high-resolution rendering and image preprocessing.
   * Uses a temporary off-screen canvas at 3x scale for better Tesseract accuracy.
   */
  const runOCR = async () => {
    if (!pdfDoc) return;
    setIsOcrRunning(true);
    setOcrProgress(0);
    
    try {
      // Step 1: Render at HIGH resolution for OCR (3x scale minimum)
      const ocrScale = Math.max(scale, 3);
      const page = await pdfDoc.getPage(pageNumber);
      const ocrViewport = page.getViewport({ scale: ocrScale });
      
      // Create off-screen canvas at high resolution
      const offCanvas = document.createElement('canvas');
      offCanvas.width = ocrViewport.width;
      offCanvas.height = ocrViewport.height;
      const offCtx = offCanvas.getContext('2d');
      
      // White background
      offCtx.fillStyle = '#ffffff';
      offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
      
      setOcrProgress(10);
      
      await page.render({
        canvasContext: offCtx,
        viewport: ocrViewport,
        background: 'rgba(255,255,255,1)'
      }).promise;

      setOcrProgress(25);

      // Step 2: Image preprocessing — enhance contrast and sharpness
      const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
      const data = imageData.data;
      
      // Convert to high-contrast grayscale with adaptive thresholding
      for (let i = 0; i < data.length; i += 4) {
        // Weighted grayscale (luminosity method)
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        // Increase contrast: push dark pixels darker, light pixels lighter
        const enhanced = gray < 128 
          ? Math.max(0, gray * 0.6)      // Darken text
          : Math.min(255, gray * 1.15 + 30); // Lighten background
        data[i] = data[i + 1] = data[i + 2] = enhanced;
      }
      offCtx.putImageData(imageData, 0, 0);
      
      setOcrProgress(35);

      // Step 3: Run Tesseract on the preprocessed high-res image
      const imageSrc = offCanvas.toDataURL('image/png');
      
      const result = await Tesseract.recognize(imageSrc, ocrLanguage, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(35 + Math.round(m.progress * 55));
          }
        }
      });
      
      console.log("OCR Result:", result);
      setOcrProgress(92);
      
      // Step 4: Extract words and map to display canvas coordinates
      const displayViewport = page.getViewport({ scale });
      const H = displayViewport.height;
      const S = scale;
      const ocrToDisplayRatio = scale / ocrScale;
      
      // Try words first, then fall back to lines if words are too fragmented
      let words = result?.data?.words || [];
      const lines = result?.data?.lines || [];
      const blocks = result?.data?.blocks || [];
      
      // Filter out low-confidence noise
      words = words.filter(w => w.text && w.text.trim() !== '' && w.confidence > 20);
      
      // If words are too few, try extracting from lines
      if (words.length < 3 && lines.length > 0) {
        words = lines
          .filter(l => l.text && l.text.trim() !== '' && l.confidence > 15)
          .map(l => ({
            text: l.text.trim(),
            bbox: l.bbox,
            confidence: l.confidence
          }));
      }

      // If lines are also empty, try blocks
      if (words.length < 3 && blocks.length > 0) {
        words = blocks
          .filter(b => b.text && b.text.trim() !== '' && b.confidence > 10)
          .map(b => ({
            text: b.text.trim(),
            bbox: b.bbox,
            confidence: b.confidence
          }));
      }

      if (words.length === 0) {
        setIsOcrRunning(false);
        setOcrProgress(0);
        // Don't just show an alert — offer manual annotation instead
        setHasNoText(true);
        return;
      }

      // Map OCR bounding boxes (from high-res canvas) → display canvas coordinates
      const synthItems = words.map(w => {
        const { x0, y0, x1, y1 } = w.bbox;
        // Scale from OCR canvas coords to display canvas coords
        const dispX = x0 * ocrToDisplayRatio;
        const dispY0 = y0 * ocrToDisplayRatio;
        const dispX1 = x1 * ocrToDisplayRatio;
        const dispY1 = y1 * ocrToDisplayRatio;
        
        const Cw = dispX1 - dispX;
        const Ch = dispY1 - dispY0;
        
        // PDF transform: [fontSize, 0, 0, fontSize, x, y] where y is from bottom
        const pdfFontSize = Ch / S;
        const pdfX = dispX / S;
        const pdfY = (H - dispY1) / S;
        
        return {
          str: w.text,
          width: Cw / S,
          transform: [pdfFontSize, 0, 0, pdfFontSize, pdfX, pdfY],
          fontName: 'sans-serif',
          confidence: w.confidence
        };
      });

      setOcrProgress(100);
      
      // Inject the detected text into the text layer system
      setTextContentData(prev => ({
        ...prev,
        items: synthItems,
        viewport: displayViewport
      }));
      setHasNoText(false);
      setIsOcrRunning(false);
      
      // Clean up
      offCanvas.remove();
      
    } catch (e) {
      console.error("OCR Failed", e);
      setIsOcrRunning(false);
      setOcrProgress(0);
      setHasNoText(true);
    }
  };

  // === MANUAL ANNOTATION SYSTEM ===
  const addAnnotation = useCallback((e) => {
    if (!isAnnotationMode || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newAnnotation = {
      id: Date.now(),
      text: 'Texto aquí',
      x, y,
      width: 200,
      height: 30,
      fontSize: 16,
      pageIndex: pageNumber - 1,
      isNew: true
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    setActiveAnnotation(newAnnotation.id);
    setIsAnnotationMode(false);
  }, [isAnnotationMode, pageNumber]);

  const updateAnnotation = (id, updates) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAnnotation = (id) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (activeAnnotation === id) setActiveAnnotation(null);
  };

  const handleAnnotationMouseDown = (e, ann) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setActiveAnnotation(ann.id);
    setDragOffset({
      x: e.clientX - rect.left - ann.x,
      y: e.clientY - rect.top - ann.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      // Update local state for immediate feedback
      setAnnotations(prev => prev.map(a => a.id === activeAnnotation ? { ...a, x, y } : a));
      
      // Sync with global modifications state for images/signatures
      const mod = modifications.find(m => m.id === activeAnnotation);
      if (mod && onModificationUpdate) {
        onModificationUpdate({ id: mod.id, x, y });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      // Register modification for export
      const ann = annotations.find(a => a.id === activeAnnotation);
      if (ann && onModificationUpdate) {
        onModificationUpdate({
          id: ann.id,
          pageIndex: ann.pageIndex,
          oldText: '',
          newText: ann.text,
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height,
          fontSize: ann.fontSize / scale,
          pdfX: ann.x / scale,
          pdfY: (canvasRef.current?.height - ann.y - ann.height) / scale,
          pdfWidth: ann.width / scale,
          pdfFontSize: ann.fontSize / scale,
          isAnnotation: true
        });
      }
      
      // Also handle images/signatures dragging
      const mod = modifications.find(m => m.id === activeAnnotation);
      if (mod && onModificationUpdate) {
        onModificationUpdate({
          id: mod.id,
          x: mod.x,
          y: mod.y
        });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, activeAnnotation, annotations, onModificationUpdate, scale, modifications]);

  const commitAnnotation = (ann) => {
    if (onModificationUpdate) {
      onModificationUpdate({
        id: ann.id,
        pageIndex: ann.pageIndex,
        oldText: '',
        newText: ann.text,
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        fontSize: ann.fontSize / scale,
        pdfX: ann.x / scale,
        pdfY: (canvasRef.current?.height - ann.y - ann.height) / scale,
        pdfWidth: ann.width / scale,
        pdfFontSize: ann.fontSize / scale,
        isAnnotation: true
      });
    }
  };

  // Handle render text spans based on mode
  useEffect(() => {
    if (!textContentData || !textLayerRef.current) return;
    const { items, viewport } = textContentData;
    const textLayer = textLayerRef.current;
    
    textLayer.innerHTML = '';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;
    textLayer.style.position = 'absolute';
    textLayer.style.top = '0';
    textLayer.style.left = '0';
    
    if (!isEditMode) {
       textLayer.style.color = 'transparent'; 
       textLayer.classList.remove('editing-active');
       textLayer.style.pointerEvents = 'none';
    } else {
       textLayer.style.color = 'transparent'; 
       textLayer.classList.add('editing-active');
       textLayer.style.pointerEvents = 'none';
    }

    items.forEach((item, index) => {
      if (item.str.trim() === '' && isEditMode) return;
      
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
      const spanWidth = item.width * viewport.scale;

      const existingMod = modifications.find(m => 
          m.pageIndex === (pageNumber - 1) && 
          Math.abs(m.y - (tx[5] - fontHeight)) < 5 &&
          m.oldText === item.str
      );

      const pdfFontHeight = Math.sqrt((item.transform[2] * item.transform[2]) + (item.transform[3] * item.transform[3]));
      const pdfX = item.transform[4];
      const pdfY = item.transform[5];
      const pdfWidth = item.width;

      const span = document.createElement('span');
      span.textContent = existingMod ? existingMod.newText : item.str;
      
      span.dataset.idx = index;
      span.dataset.original = item.str;
      span.dataset.x = tx[4];
      span.dataset.y = tx[5] - fontHeight;
      span.dataset.width = spanWidth;
      span.dataset.height = fontHeight;
      span.dataset.fontSize = fontHeight;
      span.dataset.pdfX = pdfX;
      span.dataset.pdfY = pdfY;
      span.dataset.pdfWidth = pdfWidth;
      span.dataset.pdfFontSize = pdfFontHeight;
      span.dataset.fontName = item.fontName || 'sans-serif';

      const fontName = (item.fontName || 'sans-serif').toLowerCase();
      let visualFont = 'sans-serif';
      if (fontName.includes('serif') || fontName.includes('times') || fontName.includes('roman')) visualFont = 'serif';
      else if (fontName.includes('mono') || fontName.includes('courier')) visualFont = 'monospace';

      span.style.left = `${tx[4]}px`;
      span.style.top = `${tx[5] - fontHeight}px`; 
      span.style.fontSize = `${fontHeight}px`;
      span.style.fontFamily = visualFont;
      span.style.position = 'absolute';
      span.style.transformOrigin = 'left bottom';
      span.style.whiteSpace = 'pre';
      span.style.width = `${spanWidth}px`;
      span.style.height = `${fontHeight * 1.2}px`;
      span.style.display = 'inline-block';
      span.style.lineHeight = 1;
      
      span.style.pointerEvents = 'auto';

      if (existingMod) {
          span.style.color = '#000';
          span.style.background = '#fff';
          span.classList.add('edited');
          // Restore formatting styles from the modification
          if (existingMod.bold) {
            span.style.fontWeight = 'bold';
          }
          if (existingMod.italic) {
            span.style.fontStyle = 'italic';
          }
          if (existingMod.underline) {
            span.style.textDecoration = 'underline';
          }
          // Update the fontName data attribute to match the modification
          if (existingMod.fontName) {
            span.dataset.fontName = existingMod.fontName;
            // Update visual font family
            if (existingMod.fontName.toLowerCase().includes('serif')) span.style.fontFamily = 'serif';
            else if (existingMod.fontName.toLowerCase().includes('mono')) span.style.fontFamily = 'monospace';
            else span.style.fontFamily = 'sans-serif';
          }
      }

      if (isEditMode) {
        span.contentEditable = true;
        span.className = 'editable-pdf-text';
        if (existingMod || span.classList.contains('edited')) {
           span.classList.add('edited');
        }
        span.spellcheck = false;
        
        span.addEventListener('focus', (e) => {
          span.style.color = '#000';
          span.style.background = '#fff';
          
          // Show formatting toolbar
          const rect = span.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          setFocusedSpanInfo({
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            span: span,
            fontName: span.dataset.fontName
          });
        });

        span.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            span.blur();
          }
        });
        
        span.addEventListener('blur', (e) => {
           const newStr = e.target.textContent;
           
           // Small delay to allow clicking on the toolbar
           setTimeout(() => {
             if (document.activeElement !== span) {
                // Only hide if we didn't click the toolbar
                // setFocusedSpanInfo(null);
             }
           }, 200);

           if (newStr !== item.str) {
              span.classList.add('edited');
              span.style.color = '#000';
              span.style.background = '#fff';

              if (onModificationUpdate) {
                  onModificationUpdate({
                      pageIndex: pageNumber - 1,
                      oldText: item.str,
                      newText: newStr,
                      x: parseFloat(span.dataset.x),
                      y: parseFloat(span.dataset.y),
                      width: parseFloat(span.dataset.width),
                      height: parseFloat(span.dataset.height),
                      fontSize: parseFloat(span.dataset.fontSize),
                      pdfX: parseFloat(span.dataset.pdfX),
                      pdfY: parseFloat(span.dataset.pdfY),
                      pdfWidth: parseFloat(span.dataset.pdfWidth),
                      pdfFontSize: parseFloat(span.dataset.pdfFontSize),
                      fontName: span.dataset.fontName || 'sans-serif'
                  });
              }
           } else if (!span.classList.contains('edited')) {
              span.style.color = 'transparent';
              span.style.background = 'transparent';
           }
        });
      }

      textLayer.appendChild(span);
    });
  }, [textContentData, isEditMode, pageNumber, onModificationUpdate, modifications]);

  const handleFormattingAction = (action) => {
    if (!focusedSpanInfo) return;
    const { span } = focusedSpanInfo;
    
    // Toggle styles in DOM
    if (action === 'bold') {
      span.style.fontWeight = span.style.fontWeight === 'bold' ? 'normal' : 'bold';
    } else if (action === 'italic') {
      span.style.fontStyle = span.style.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (action === 'underline') {
      span.style.textDecoration = span.style.textDecoration === 'underline' ? 'none' : 'underline';
    }
    
    // Trigger modification with all current styles
    if (onModificationUpdate) {
      onModificationUpdate({
        pageIndex: pageNumber - 1,
        oldText: span.dataset.original,
        newText: span.textContent,
        x: parseFloat(span.dataset.x),
        y: parseFloat(span.dataset.y),
        width: parseFloat(span.dataset.width),
        height: parseFloat(span.dataset.height),
        fontSize: parseFloat(span.dataset.fontSize),
        pdfX: parseFloat(span.dataset.pdfX),
        pdfY: parseFloat(span.dataset.pdfY),
        pdfWidth: parseFloat(span.dataset.pdfWidth),
        pdfFontSize: parseFloat(span.dataset.pdfFontSize),
        fontName: span.dataset.fontName,
        bold: span.style.fontWeight === 'bold' || span.style.fontWeight === '700',
        italic: span.style.fontStyle === 'italic',
        underline: span.style.textDecoration.includes('underline')
      });
    }
  };

  const handleModDragStart = (e, mod) => {
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setActiveAnnotation(mod.id);
    setDragOffset({
      x: e.clientX - rect.left - mod.x,
      y: e.clientY - rect.top - mod.y
    });
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div 
        ref={containerRef} 
        style={{ 
          position: 'relative', 
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
          background: 'white',
          overflow: 'hidden',
          cursor: isAnnotationMode ? 'crosshair' : 'default'
        }}
        onClick={isAnnotationMode ? addAnnotation : undefined}
      >
        {isRendering && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'black', background: 'rgba(255,255,255,0.8)', padding: '4px 12px', borderRadius: '4px', zIndex: 100 }}>Renderizando...</div>}
        
        {/* OCR Overlay — Enhanced with multiple options */}
        {hasNoText && !isOcrRunning && (
            <div className="ocr-overlay">
                <div style={{ textAlign: 'center', maxWidth: '360px' }}>
                    <ScanSearch size={48} style={{ color: 'var(--accent-solid)', marginBottom: '16px' }} />
                    <h3 style={{ color: 'black', marginBottom: '8px' }}>Documento Sin Capa de Texto</h3>
                    <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
                      Este PDF es una imagen escaneada o no contiene texto digital nativo. Puedes intentar detectar el texto automáticamente o agregar anotaciones manualmente.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button className="btn btn-primary" onClick={runOCR} style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px' }}>
                          <ScanSearch size={16} style={{ marginRight: '8px' }} /> Analizar con OCR (Alta Resolución)
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => { setHasNoText(false); setIsAnnotationMode(true); }} 
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.15)' }}
                      >
                          <Type size={16} style={{ marginRight: '8px' }} /> Agregar Texto Manualmente
                      </button>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '12px' }}>
                      La opción manual te permite posicionar bloques de texto sobre la imagen del documento.
                    </p>
                </div>
            </div>
        )}

        {/* OCR Progress with real percentage */}
        {isOcrRunning && (
            <div className="ocr-overlay">
                <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                    <div className="ocr-progress-ring">
                      <svg viewBox="0 0 60 60" width="60" height="60">
                        <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
                        <circle 
                          cx="30" cy="30" r="26" fill="none" 
                          stroke="var(--accent-solid)" strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 26}`}
                          strokeDashoffset={`${2 * Math.PI * 26 * (1 - ocrProgress / 100)}`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />
                      </svg>
                      <span className="ocr-progress-text">{ocrProgress}%</span>
                    </div>
                    <h3 style={{ color: 'black', marginTop: '16px' }}>Analizando Documento...</h3>
                    <p style={{ color: '#555', fontSize: '0.82rem', marginTop: '6px' }}>
                      {ocrProgress < 25 ? 'Renderizando a alta resolución...' :
                       ocrProgress < 35 ? 'Preprocesando imagen...' :
                       ocrProgress < 90 ? 'Reconociendo texto con Tesseract...' :
                       'Mapeando resultados...'}
                    </p>
                </div>
            </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'block' }} />
        <div ref={textLayerRef} className="text-layer" /> 
        
        {/* Manual Annotations Layer */}
        {annotations.filter(a => a.pageIndex === pageNumber - 1).map(ann => (
          <div
            key={ann.id}
            className={`annotation-box ${activeAnnotation === ann.id ? 'active' : ''}`}
            style={{
              position: 'absolute',
              left: ann.x,
              top: ann.y,
              minWidth: ann.width,
              zIndex: 200,
            }}
            onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
          >
            <div 
              contentEditable 
              suppressContentEditableWarning
              className="annotation-text"
              style={{ fontSize: `${ann.fontSize}px` }}
              onBlur={(e) => {
                const newText = e.target.textContent;
                updateAnnotation(ann.id, { text: newText, isNew: false });
                commitAnnotation({ ...ann, text: newText });
              }}
              onFocus={() => setActiveAnnotation(ann.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }}}
            >
              {ann.text}
            </div>
            {activeAnnotation === ann.id && (
              <button 
                className="annotation-delete"
                onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        {/* Modifications Layer (Images, Signatures) */}
        {modifications.filter(m => m.pageIndex === pageNumber - 1 && (m.type === 'image' || m.type === 'signature')).map(mod => (
          <div
            key={mod.id}
            style={{
              position: 'absolute',
              left: mod.x,
              top: mod.y,
              width: mod.width,
              height: mod.height,
              border: activeAnnotation === mod.id ? '2px solid var(--accent-solid)' : '1px dashed rgba(0,0,0,0.2)',
              zIndex: 150,
              cursor: 'move',
              background: mod.type === 'signature' ? 'rgba(255,255,255,0.7)' : 'transparent'
            }}
            onMouseDown={(e) => handleModDragStart(e, mod)}
          >
            {mod.type === 'image' || mod.type === 'signature' ? (
              <img src={mod.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} alt="Content" />
            ) : (
              <div 
                contentEditable 
                suppressContentEditableWarning
                style={{ 
                  width: '100%', height: '100%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Dancing Script", cursive', fontSize: '1.8rem', color: '#003399',
                  textAlign: 'center', padding: '0 10px'
                }}
                onBlur={(e) => {
                  const newText = e.target.textContent;
                  if (onModificationUpdate) {
                    onModificationUpdate({ ...mod, text: newText });
                  }
                }}
              >
                {mod.text}
              </div>
            )}
            {activeAnnotation === mod.id && (
              <div style={{ position: 'absolute', top: '-24px', right: '0', display: 'flex', gap: '4px', zIndex: 300 }}>
                 <button 
                   className="btn btn-secondary" 
                   style={{ padding: '4px', background: '#f43f5e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} 
                   onClick={(e) => {
                     e.stopPropagation();
                     if (onModificationDelete) onModificationDelete(mod.id);
                     setActiveAnnotation(null);
                   }}
                 >
                   <Trash2 size={14} />
                 </button>
              </div>
            )}
          </div>
        ))}

        <FormattingToolbar 
          position={focusedSpanInfo} 
          currentFont={focusedSpanInfo?.fontName}
          onAction={handleFormattingAction}
          onClose={() => setFocusedSpanInfo(null)}
        />


      </div>

      {/* Bottom Controls */}
      <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          background: 'var(--glass-bg)',
          padding: '8px 16px',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
        <button 
          className="btn btn-secondary" 
          disabled={pageNumber <= 1} 
          onClick={() => setPageNumber(p => p - 1)}
          style={{ padding: '4px 12px', borderRadius: '16px' }}
        >
          Anterior
        </button>
        <span style={{ fontSize: '0.85rem' }}>Página {pageNumber} de {numPages}</span>
        <button 
          className="btn btn-secondary" 
          disabled={pageNumber >= numPages} 
          onClick={() => setPageNumber(p => p + 1)}
          style={{ padding: '4px 12px', borderRadius: '16px' }}
        >
          Siguiente
        </button>

        {/* Annotation tools */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />
        <button 
          className={`btn ${isAnnotationMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setIsAnnotationMode(!isAnnotationMode)}
          style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem' }}
          title="Agregar texto sobre el documento"
        >
          <Plus size={14} /> <Type size={14} /> Anotar
        </button>
      </div>

      {/* Annotation Mode Hint */}
      {isAnnotationMode && (
        <div style={{
          marginTop: '8px',
          padding: '6px 16px',
          background: 'rgba(56,189,248,0.15)',
          border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          animation: 'fadeIn 0.2s ease'
        }}>
          🖱️ Haz clic en cualquier parte del documento para agregar un bloque de texto
        </div>
      )}

      <style>{`
        .text-layer {
          --pdf-text-selection-color: rgba(56, 189, 248, 0.4);
        }
        .text-layer ::selection {
          background: var(--pdf-text-selection-color);
        }
        .text-layer > span {
          cursor: text;
        }

        .editing-active .editable-pdf-text {
          border: 1px dashed rgba(56, 189, 248, 0.5);
          cursor: text;
          z-index: 10;
        }
        
        .editing-active .editable-pdf-text:hover {
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 1);
        }

        .editing-active .editable-pdf-text:focus,
        .editable-pdf-text.edited {
          outline: 2px solid var(--accent-solid);
          border: none;
          border-radius: 2px;
          z-index: 20;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .ocr-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(6px);
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ocr-progress-ring {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ocr-progress-text {
          position: absolute;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-solid, #38bdf8);
        }

        /* Annotation styles */
        .annotation-box {
          cursor: move;
          border: 2px dashed rgba(56, 189, 248, 0.6);
          background: rgba(255, 255, 255, 0.92);
          border-radius: 4px;
          padding: 4px 8px;
          transition: border-color 0.2s, box-shadow 0.2s;
          user-select: none;
        }
        .annotation-box:hover {
          border-color: rgba(56, 189, 248, 1);
          box-shadow: 0 2px 12px rgba(56,189,248,0.2);
        }
        .annotation-box.active {
          border-color: #38bdf8;
          border-style: solid;
          box-shadow: 0 4px 16px rgba(56,189,248,0.3);
        }
        .annotation-text {
          outline: none;
          min-width: 60px;
          color: #000;
          font-family: 'Inter', sans-serif;
          line-height: 1.4;
          cursor: text;
          user-select: text;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .annotation-delete {
          position: absolute;
          top: -10px; right: -10px;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #f43f5e;
          color: white;
          border: 2px solid white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.15s;
        }
        .annotation-delete:hover {
          transform: scale(1.15);
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PDFViewer;
