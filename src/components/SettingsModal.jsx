import React, { useState } from 'react';
import {
  X, Trash2, Moon, Sun, ZoomIn,
  Save, Keyboard, ChevronRight,
  RotateCcw, Monitor, Settings, Heart, ExternalLink, Copy, Zap
} from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onClearEdits, modificationsCount, settings, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const updateSetting = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Monitor size={16} /> },
    { id: 'editor', label: 'Editor', icon: <ZoomIn size={16} /> },
    { id: 'shortcuts', label: 'Atajos', icon: <Keyboard size={16} /> },
    { id: 'support', label: 'Apoyo', icon: <Heart size={16} /> },
  ];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="settings-header-icon" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <Settings size={18} style={{ color: 'var(--accent-solid)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Configuración</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Ajustes y preferencias del editor</p>
            </div>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs + Content */}
        <div className="settings-layout">
          {/* Sidebar Tabs */}
          <nav className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <ChevronRight size={14} className="tab-chevron" />
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <div className="settings-content">

            {/* === GENERAL TAB === */}
            {activeTab === 'general' && (
              <div className="settings-panel" key="general">
                <div className="settings-panel-title">Apariencia y Preferencias</div>

                {/* Dark Mode */}
                <div className="setting-card">
                  <div className="setting-card-info">
                    <div className="setting-card-icon" style={{ background: settings.darkMode ? 'rgba(99,102,241,0.15)' : 'rgba(251,191,36,0.15)' }}>
                      {settings.darkMode ? <Moon size={18} style={{ color: '#818cf8' }} /> : <Sun size={18} style={{ color: '#fbbf24' }} />}
                    </div>
                    <div>
                      <p className="setting-label">Tema de Interfaz</p>
                      <p className="setting-desc">{settings.darkMode ? 'Modo oscuro — reduce fatiga visual' : 'Modo claro — alta visibilidad'}</p>
                    </div>
                  </div>
                  <button
                    className={`toggle-switch-v2 ${settings.darkMode ? 'active' : ''}`}
                    onClick={() => updateSetting('darkMode', !settings.darkMode)}
                    aria-label="Alternar modo oscuro"
                  >
                    <div className="toggle-knob-v2">
                      {settings.darkMode ? <Moon size={12} /> : <Sun size={12} />}
                    </div>
                  </button>
                </div>

                {/* Auto Save */}
                <div className="setting-card">
                  <div className="setting-card-info">
                    <div className="setting-card-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <Save size={18} style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <p className="setting-label">Auto-guardado Local</p>
                      <p className="setting-desc">Guarda las ediciones en el navegador automáticamente</p>
                    </div>
                  </div>
                  <button
                    className={`toggle-switch-v2 ${settings.autoSave ? 'active' : ''}`}
                    onClick={() => updateSetting('autoSave', !settings.autoSave)}
                    aria-label="Alternar auto-guardado"
                  >
                    <div className="toggle-knob-v2" />
                  </button>
                </div>

                {/* Edit Management */}
                <div className="setting-card danger-zone">
                  <div className="setting-card-info">
                    <div className="setting-card-icon" style={{ background: 'rgba(244,63,94,0.12)' }}>
                      <Trash2 size={18} style={{ color: '#f43f5e' }} />
                    </div>
                    <div>
                      <p className="setting-label">Gestión de Ediciones</p>
                      <p className="setting-desc">
                        {modificationsCount > 0
                          ? <><strong style={{ color: 'var(--text-primary)' }}>{modificationsCount}</strong> ediciones sin exportar</>
                          : 'Sin ediciones pendientes'}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn-reset"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres descartar todas las modificaciones y volver al PDF original?')) {
                        onClearEdits();
                        onClose();
                      }
                    }}
                    disabled={modificationsCount === 0}
                  >
                    <RotateCcw size={14} />
                    Restablecer
                  </button>
                </div>
              </div>
            )}
            {/* === SUPPORT TAB === */}
            {activeTab === 'support' && (
              <div className="settings-panel" key="support">
                <div className="settings-panel-title">Apoyo al Creador</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  Si este editor te ha sido útil, considera apoyar su desarrollo continuo. ¡Cualquier aporte ayuda mucho!
                </p>

                {/* PayPal */}
                <div className="setting-card" style={{ borderLeft: '4px solid #0070ba' }}>
                  <div className="setting-card-info">
                    <div className="setting-card-icon" style={{ background: 'rgba(0,112,186,0.15)' }}>
                      <ExternalLink size={18} style={{ color: '#0070ba' }} />
                    </div>
                    <div>
                      <p className="setting-label">Donación vía PayPal</p>
                      <p className="setting-desc">Apoya de forma segura a través de PayPal</p>
                    </div>
                  </div>
                  <a
                    href="https://www.paypal.me/pablochambi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-support paypal"
                  >
                    Donar con PayPal
                  </a>
                </div>

                {/* Yape BCP */}
                <div className="setting-card" style={{ borderLeft: '4px solid #8c32a8' }}>
                  <div className="setting-card-info">
                    <div className="setting-card-icon" style={{ background: 'rgba(140,50,168,0.15)' }}>
                      <Zap size={18} style={{ color: '#8c32a8' }} />
                    </div>
                    <div>
                      <p className="setting-label">Yape (BCP)</p>
                      <p className="setting-desc">Aporte directo mediante Yape</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8c32a8' }}>930113336</span>
                    <button
                      className="btn-copy"
                      onClick={() => {
                        navigator.clipboard.writeText('920590890');
                        alert('Número de Yape copiado al portapapeles');
                      }}
                    >
                      <Copy size={12} /> Copiar
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center', opacity: 0.6 }}>
                  <Heart size={24} style={{ color: '#f43f5e' }} />
                  <p style={{ fontSize: '0.7rem', marginTop: '8px' }}>¡Gracias por tu apoyo!</p>
                </div>
              </div>
            )}


            {/* === EDITOR TAB === */}
            {activeTab === 'editor' && (
              <div className="settings-panel" key="editor">
                <div className="settings-panel-title">Preferencias del Visor</div>

                {/* Zoom Level */}
                <div className="setting-card">
                  <div className="setting-card-info" style={{ width: '100%' }}>
                    <div className="setting-card-icon" style={{ background: 'rgba(56,189,248,0.15)' }}>
                      <ZoomIn size={18} style={{ color: '#38bdf8' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="setting-label">Nivel de Zoom</p>
                      <p className="setting-desc">Ajusta el tamaño de visualización del documento PDF</p>
                      <div className="zoom-control">
                        <button
                          className="zoom-btn"
                          onClick={() => updateSetting('zoomLevel', Math.max(0.5, settings.zoomLevel - 0.25))}
                          disabled={settings.zoomLevel <= 0.5}
                        >−</button>
                        <div className="zoom-slider-container">
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.25"
                            value={settings.zoomLevel}
                            onChange={(e) => updateSetting('zoomLevel', parseFloat(e.target.value))}
                            className="zoom-slider"
                          />
                          <div className="zoom-track-fill" style={{ width: `${((settings.zoomLevel - 0.5) / 2.5) * 100}%` }} />
                        </div>
                        <button
                          className="zoom-btn"
                          onClick={() => updateSetting('zoomLevel', Math.min(3, settings.zoomLevel + 0.25))}
                          disabled={settings.zoomLevel >= 3}
                        >+</button>
                        <span className="zoom-value">{Math.round(settings.zoomLevel * 100)}%</span>
                      </div>
                      <div className="zoom-presets">
                        {[0.75, 1, 1.5, 2, 2.5].map(val => (
                          <button
                            key={val}
                            className={`zoom-preset ${settings.zoomLevel === val ? 'active' : ''}`}
                            onClick={() => updateSetting('zoomLevel', val)}
                          >
                            {Math.round(val * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === SHORTCUTS TAB === */}
            {activeTab === 'shortcuts' && (
              <div className="settings-panel" key="shortcuts">
                <div className="settings-panel-title">Atajos de Teclado</div>
                <div className="shortcuts-grid">
                  {[
                    { keys: ['Ctrl', 'S'], desc: 'Exportar PDF editado' },
                    { keys: ['Ctrl', 'Z'], desc: 'Deshacer última edición' },
                    { keys: ['Ctrl', '+'], desc: 'Aumentar zoom' },
                    { keys: ['Ctrl', '-'], desc: 'Reducir zoom' },
                    { keys: ['Ctrl', '0'], desc: 'Zoom al 100%' },
                    { keys: ['Esc'], desc: 'Cerrar modal / deseleccionar' },
                    { keys: ['Enter'], desc: 'Confirmar edición de texto' },
                    { keys: ['Tab'], desc: 'Siguiente campo editable' },
                  ].map((shortcut, i) => (
                    <div className="shortcut-item" key={i}>
                      <div className="shortcut-keys">
                        {shortcut.keys.map((key, j) => (
                          <React.Fragment key={j}>
                            <kbd className="kbd">{key}</kbd>
                            {j < shortcut.keys.length - 1 && <span className="kbd-plus">+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                      <span className="shortcut-desc">{shortcut.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Nexus PDF Editor v1.0 — Las preferencias se guardan en la sesión actual
          </p>
          <button className="btn-done" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>

      <style>{`
        .settings-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: settingsFadeIn 0.25s ease;
        }

        .settings-modal {
          width: 680px;
          max-width: 94vw;
          max-height: 85vh;
          background: var(--bg-panel);
          border: 1px solid var(--border-focus);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
          animation: settingsSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }

        .settings-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .settings-header-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--accent-gradient);
          display: flex; align-items: center; justify-content: center;
          color: white;
        }

        .settings-close-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .settings-close-btn:hover {
          background: rgba(244,63,94,0.1);
          border-color: rgba(244,63,94,0.3);
          color: #f43f5e;
        }

        .settings-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        .settings-tabs {
          width: 170px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-color);
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .settings-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }
        .settings-tab .tab-chevron {
          margin-left: auto;
          opacity: 0;
          transition: all 0.2s;
        }
        .settings-tab:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
        }
        .settings-tab:hover .tab-chevron { opacity: 0.5; }
        .settings-tab.active {
          background: rgba(56,189,248,0.1);
          color: var(--accent-solid);
        }
        .settings-tab.active .tab-chevron { opacity: 1; color: var(--accent-solid); }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        .settings-panel {
          animation: panelFadeIn 0.2s ease;
        }

        .settings-panel-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          font-weight: 600;
        }

        .setting-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: all 0.2s;
        }
        .setting-card:hover {
          border-color: rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
        }

        .setting-card-info {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .setting-card-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .setting-label {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .setting-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Toggle V2 */
        .toggle-switch-v2 {
          width: 48px; height: 26px;
          border-radius: 13px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.08);
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }
        .toggle-switch-v2.active {
          background: var(--accent-solid);
          border-color: var(--accent-solid);
        }
        .toggle-knob-v2 {
          width: 22px; height: 22px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 1px; left: 1px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; align-items: center; justify-content: center;
          color: #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .toggle-switch-v2.active .toggle-knob-v2 {
          left: 23px;
        }

        /* Reset Button */
        .btn-reset {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          background: rgba(244,63,94,0.1);
          color: #f43f5e;
          border: 1px solid rgba(244,63,94,0.25);
          cursor: pointer;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-reset:hover:not(:disabled) {
          background: rgba(244,63,94,0.2);
          border-color: rgba(244,63,94,0.5);
        }
        .btn-reset:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Model Cards */
        .model-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .model-card {
          position: relative;
          padding: 14px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          color: var(--text-primary);
          transition: all 0.2s;
          overflow: hidden;
        }
        .model-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          transform: translateY(-1px);
        }
        .model-card.selected {
          border-color: var(--accent-solid);
          background: rgba(56,189,248,0.08);
        }

        .model-card-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .model-badge {
          font-size: 0.65rem;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .model-name {
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .model-desc {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }
        .model-selected-indicator {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 0 0 10px 10px;
        }

        /* Select Wrapper */
        .select-wrapper {
          margin-top: 10px;
        }
        .glass-select-v2 {
          width: 100%;
          padding: 10px 14px;
          background: rgba(0,0,0,0.25);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.9rem;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
        }
        .glass-select-v2:focus {
          border-color: var(--accent-solid);
        }
        .glass-select-v2 option {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        /* Zoom Control */
        .zoom-control {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
        }
        .zoom-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 1.1rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          font-family: inherit;
        }
        .zoom-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.12);
          border-color: var(--accent-solid);
        }
        .zoom-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .zoom-slider-container {
          flex: 1;
          position: relative;
          height: 32px;
          display: flex;
          align-items: center;
        }
        .zoom-slider {
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.1);
          outline: none;
          position: relative;
          z-index: 2;
        }
        .zoom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--accent-solid);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(56,189,248,0.4);
          transition: transform 0.15s;
        }
        .zoom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .zoom-track-fill {
          position: absolute;
          top: 50%;
          left: 0;
          height: 6px;
          border-radius: 3px;
          background: var(--accent-gradient);
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 1;
        }

        .zoom-value {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent-solid);
          min-width: 45px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .zoom-presets {
          display: flex;
          gap: 6px;
          margin-top: 10px;
        }
        .zoom-preset {
          padding: 4px 12px;
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .zoom-preset:hover {
          background: rgba(255,255,255,0.08);
          color: var(--text-primary);
        }
        .zoom-preset.active {
          background: rgba(56,189,248,0.15);
          border-color: var(--accent-solid);
          color: var(--accent-solid);
        }

        /* Shortcuts */
        .shortcuts-grid {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .shortcut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .shortcut-item:hover {
          background: rgba(255,255,255,0.03);
        }
        .shortcut-keys {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-bottom: 2px solid rgba(255,255,255,0.15);
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'Inter', monospace;
          color: var(--text-primary);
        }
        .kbd-plus {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
        .shortcut-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        /* Danger Zone */
        .danger-zone {
          border-color: rgba(244,63,94,0.15);
        }
        .danger-zone:hover {
          border-color: rgba(244,63,94,0.25);
        }

        /* Footer */
        .settings-footer {
          padding: 14px 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .btn-done {
          padding: 8px 24px;
          border-radius: 8px;
          background: var(--accent-gradient);
          color: white;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(56,189,248,0.25);
        }
        .btn-done:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(56,189,248,0.35);
        }

        /* Animations */
        @keyframes settingsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes settingsSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes panelFadeIn {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        /* Support Buttons */
        .btn-support {
          padding: 8px 16px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-support.paypal {
          background: #0070ba;
          color: white;
        }
        .btn-support.paypal:hover {
          background: #005ea6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,112,186,0.3);
        }

        .btn-copy {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .btn-copy:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default SettingsModal;
