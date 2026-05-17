import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Settings, Sidebar as SidebarIcon, Edit3, Image, PenTool } from 'lucide-react';
import PDFViewer from './components/PDFViewer';
import SettingsModal from './components/SettingsModal';
import SignatureModal from './components/SignatureModal';
import { processPdfModifications } from './utils/pdfProcessor';
import './index.css';

const DEFAULT_SETTINGS = {
  darkMode: true,
  zoomLevel: 1.5,
  autoSave: false,
};

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [modifications, setModifications] = useState([]);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-pdf-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus-pdf-settings', JSON.stringify(settings));
    } catch { /* ignore */ }
  }, [settings]);

  // Auto-save modifications to localStorage
  useEffect(() => {
    if (settings.autoSave && modifications.length > 0) {
      try {
        localStorage.setItem('nexus-pdf-modifications', JSON.stringify(modifications));
      } catch { /* ignore */ }
    }
  }, [modifications, settings.autoSave]);

  // Keyboard shortcuts
  const handleExportPDF = useCallback(async () => {
    if (!pdfFile) return;
    try {
      const originalBytes = await pdfFile.arrayBuffer();
      const newPdfBytes = await processPdfModifications(originalBytes, modifications);
      
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited_${pdfFile.name}`;
      link.click();
    } catch (e) {
      console.error("Failed to export PDF", e);
      alert("Failed to export PDF.");
    }
  }, [pdfFile, modifications]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S → Export
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleExportPDF();
      }
      // Ctrl++ → Zoom In
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setSettings(prev => ({ ...prev, zoomLevel: Math.min(3, prev.zoomLevel + 0.25) }));
      }
      // Ctrl+- → Zoom Out
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setSettings(prev => ({ ...prev, zoomLevel: Math.max(0.5, prev.zoomLevel - 0.25) }));
      }
      // Ctrl+0 → Reset Zoom
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        setSettings(prev => ({ ...prev, zoomLevel: 1 }));
      }
      // Esc → Close Settings
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExportPDF]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setModifications([]);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const updateModification = (mod) => {
    setModifications(prev => {
      const index = prev.findIndex(m => m.id === mod.id || (m.pageIndex === mod.pageIndex && m.x === mod.x && m.y === mod.y && m.oldText === mod.oldText && mod.oldText));
      if (index > -1) {
        const newMods = [...prev];
        newMods[index] = { ...newMods[index], ...mod };
        return newMods;
      }
      return [...prev, { id: Date.now(), ...mod }];
    });
  };

  const deleteModification = (id) => {
    setModifications(prev => prev.filter(m => m.id !== id));
  };

  const handleClearEdits = () => {
    setModifications([]);
    try { localStorage.removeItem('nexus-pdf-modifications'); } catch {}
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Add image modification
        const mod = {
          id: Date.now(),
          type: 'image',
          dataUrl: event.target.result,
          pageIndex: 0, // Default to first page for now, PDFViewer can handle movement
          x: 50,
          y: 50,
          width: 150,
          height: 150
        };
        setModifications(prev => [...prev, mod]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSignature = () => {
    setIsSignatureModalOpen(true);
  };

  const handleSaveSignature = (dataUrl) => {
    const mod = {
      id: Date.now(),
      type: 'signature',
      dataUrl: dataUrl,
      pageIndex: 0,
      x: 100,
      y: 100,
      width: 200,
      height: 100
    };
    setModifications(prev => [...prev, mod]);
  };

  // Apply theme class
  const themeClass = settings.darkMode ? '' : 'light-mode';

  return (
    <div className={`app-container ${themeClass}`}>
      {/* Top Toolbar */}
      <header className="top-toolbar">
        <div className="logo-container">
          <div className="logo-icon">
            <Edit3 size={18} />
          </div>
          Nexus PDF Editor
        </div>

        <div className="toolbar-center-tools">
          {pdfFile && (
            <div className="mode-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-accent)', fontSize: '0.9rem', fontWeight: '500' }}>
              <Edit3 size={16} /> Modo Edición Activo
            </div>
          )}
        </div>

        <div className="toolbar-actions">
          {pdfFile && (
            <>
              <button className="btn btn-secondary" onClick={() => imageInputRef.current?.click()} title="Agregar Imagen">
                <Image size={16} /> Imagen
              </button>
              <button className="btn btn-secondary" onClick={handleAddSignature} title="Agregar Firma">
                <PenTool size={16} /> Firmar
              </button>
              <button className="btn btn-primary" onClick={handleExportPDF}>
                <Download size={16} /> Exportar PDF
              </button>
              <input 
                type="file" 
                ref={imageInputRef} 
                onChange={handleImageUpload} 
                className="hidden-file-input"
                accept="image/*"
              />
            </>
          )}
          <button 
             className="btn btn-secondary glass-panel" 
             style={{ padding: '8px' }}
             onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Páginas</span>
            <SidebarIcon size={16} />
          </div>
          <div className="thumbnails-container">
            {pdfFile ? (
              <>
                <div className="thumbnail-placeholder active">Página 1</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '12px' }}>
                 ({modifications.length} ediciones registradas)
               </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', marginTop: '40px' }}>
                Sube un PDF para ver las páginas
              </div>
            )}
          </div>
        </aside>


        <div className="ad-slot sidebar-left">
          
          <script src="https://pl29470759.effectivecpmnetwork.com/16/66/3f/16663f049bcfa1107f37770ddb3d190b.js"></script>
        </div>

        {/* Viewer Area */}
        <main className="viewer-area">
          
          <div className="ad-slot top-banner">
            {/* PASTE YOUR TOP AD CODE HERE */}
            <script src="https://pl29470759.effectivecpmnetwork.com/16/66/3f/16663f049bcfa1107f37770ddb3d190b.js"></script>

          </div>
          {!pdfFile ? (
            <div className="upload-prompt" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
              <Upload size={48} color="var(--accent-solid)" />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Subir Documento PDF</h3>
                <p>Haz clic para explorar el archivo</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden-file-input"
                accept=".pdf"
              />
            </div>
          ) : (
            <div className="pdf-page-container">
              <PDFViewer 
                pdfFile={pdfFile} 
                onModificationUpdate={updateModification}
                onModificationDelete={deleteModification}
                isEditMode={isEditMode} 
                modifications={modifications}
                scale={settings.zoomLevel}
              />
            </div>
          )}

          {/* AD SLOT: SIDEBAR RIGHT (Optional) */}
          <div className="ad-slot sidebar-right">
            {/* PASTE YOUR SIDEBAR AD CODE HERE */}
            <script src="https://pl29470761.effectivecpmnetwork.com/86/98/53/86985357f68d8ac2dc3a189a7e131c70.js"></script>

          </div>
        </main>
      </div>

      {/* AD SLOT: BOTTOM BANNER */}
      <div className="ad-slot bottom-banner">
        {/* PASTE YOUR BOTTOM AD CODE HERE */}
        <div className="ad-placeholder">Banner Publicitario Inferior</div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onClearEdits={handleClearEdits}
        modificationsCount={modifications.length}
        settings={settings}
        onSettingsChange={setSettings}
      />
      <SignatureModal 
        isOpen={isSignatureModalOpen} 
        onClose={() => setIsSignatureModalOpen(false)} 
        onSave={handleSaveSignature}
      />
    </div>
  );
}

export default App;
