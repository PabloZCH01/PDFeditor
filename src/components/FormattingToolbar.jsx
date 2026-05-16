import React, { forwardRef } from 'react';
import { Bold, Italic, Underline, Type } from 'lucide-react';

const FormattingToolbar = forwardRef(({ position, selectedText, onAction, onClose, currentFont }, ref) => {
  if (!position) return null;

  const preventSelectionLoss = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      ref={ref}
      className="glass-panel" 
      data-formatting-toolbar="true"
      onMouseDown={preventSelectionLoss}
      style={{
        position: 'absolute',
        top: position.y - 70,
        left: position.x,
        display: 'flex',
        padding: '5px',
        gap: '3px',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        animation: 'fadeIn 0.2s ease-out',
        alignItems: 'center',
        userSelect: 'none',
        borderRadius: '12px'
      }}
    >
      <div style={{ padding: '0 8px', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Type size={12} /> {(() => {
          const name = (currentFont || '').toLowerCase();
          if (name.includes('serif') || name.includes('times') || name.includes('roman')) return 'Serif';
          if (name.includes('mono') || name.includes('courier')) return 'Monospace';
          if (name.includes('sans') || name.includes('arial') || name.includes('helvetica')) return 'Sans-Serif';
          return currentFont || 'Estándar';
        })()}
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 2px' }} />

      <button 
        className="btn btn-secondary" 
        style={{ padding: '6px 8px', border: 'none', fontWeight: 700 }}
        onClick={() => onAction('bold')}
        title="Negrita"
      >
        <Bold size={14} />
      </button>

      <button 
        className="btn btn-secondary" 
        style={{ padding: '6px 8px', border: 'none' }}
        onClick={() => onAction('italic')}
        title="Cursiva"
      >
        <Italic size={14} />
      </button>

      <button 
        className="btn btn-secondary" 
        style={{ padding: '6px 8px', border: 'none' }}
        onClick={() => onAction('underline')}
        title="Subrayado"
      >
        <Underline size={14} />
      </button>

      <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 2px' }} />
      
      <button 
        className="btn btn-secondary" 
        style={{ padding: '6px', border: 'none', color: '#f43f5e' }}
        onClick={onClose}
      >
        &times;
      </button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

FormattingToolbar.displayName = 'FormattingToolbar';
export default FormattingToolbar;
