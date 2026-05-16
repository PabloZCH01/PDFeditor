import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check } from 'lucide-react';

const SignatureModal = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#003399';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const save = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ width: '500px', padding: '24px' }}>
        <div className="modal-header">
          <h3>Dibujar Firma</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="signature-container" style={{ 
          background: 'white', 
          borderRadius: '8px', 
          marginTop: '20px',
          border: '2px dashed var(--border-color)',
          height: '250px',
          cursor: 'crosshair',
          touchAction: 'none'
        }}>
          <canvas
            ref={canvasRef}
            width={450}
            height={250}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={clear}>
            <Eraser size={16} /> Limpiar
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={isEmpty}>
              <Check size={16} /> Guardar Firma
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-panel);
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SignatureModal;
