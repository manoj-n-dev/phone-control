import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, File, Folder, ArrowUp, Trash2, Copy, Scissors, Clipboard, FolderPlus, Download, Upload, Plus } from 'lucide-react';
import { Api } from '../api';

export default function FileExplorer({ connected, addLog, addToast }) {
  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [files, setFiles] = useState([]);
  const [pathInput, setPathInput] = useState('/sdcard');
  const [loading, setLoading] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [clipboard, setClipboard] = useState(null); 
  
  const fileInputRef = useRef(null);

  const browse = async (path) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    setLoading(true);
    setSelectedItem(null);
    try {
      const res = await Api.files(path || currentPath);
      if (res.success) {
        setFiles(res.data);
        setCurrentPath(res.current_path);
        setPathInput(res.current_path);
        addLog(`Listed ${res.data.length} items in ${res.current_path}`, 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      addLog('File listing error: ' + e.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (connected) {
      browse(currentPath);
    }
  }, [connected]);

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      const parent = '/' + parts.join('/');
      browse(parent === '' ? '/' : parent);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  const handleRowDoubleClick = (item) => {
    if (item.is_directory) {
      browse(item.path);
    }
  };

  const handleDownload = () => {
    if (!selectedItem || selectedItem.is_directory) return;
    addLog(`Downloading file: ${selectedItem.name}`, 'info');
    window.open(`/api/file/download?path=${encodeURIComponent(selectedItem.path)}`, '_blank');
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('remote_path', currentPath);

    setLoading(true);
    try {
      const res = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Uploaded ${file.name}`, 'success');
        addLog(`Uploaded file: ${file.name} to ${currentPath}`, 'success');
        browse(currentPath);
      } else {
        addLog(data.message, 'error');
        addToast('Upload failed: ' + data.message, 'error');
      }
    } catch (err) {
      addLog('Upload error: ' + err.message, 'error');
      addToast('Upload error', 'error');
    }
    setLoading(false);
    e.target.value = '';
  };

  const handleNewFolder = async () => {
    const name = prompt('Enter new folder name:');
    if (!name) return;
    const fullPath = `${currentPath}/${name}`.replace('//', '/');
    setLoading(true);
    try {
      const res = await Api.fileMkdir(fullPath);
      if (res.success) {
        addToast('Folder created', 'success');
        addLog(`Created directory: ${fullPath}`, 'success');
        browse(currentPath);
      } else {
        addLog(res.message, 'error');
      }
    } catch (err) {
      addLog('Mkdir error: ' + err.message, 'error');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!selectedItem) return;
    setClipboard({ type: 'copy', path: selectedItem.path, filename: selectedItem.name });
    addToast(`Copied ${selectedItem.name}`, 'success');
    addLog(`Copied file: ${selectedItem.path} to clipboard`, 'info');
  };

  const handleCut = () => {
    if (!selectedItem) return;
    setClipboard({ type: 'cut', path: selectedItem.path, filename: selectedItem.name });
    addToast(`Cut ${selectedItem.name}`, 'success');
    addLog(`Cut file: ${selectedItem.path} to clipboard`, 'info');
  };

  const handlePaste = async () => {
    if (!clipboard) return;
    const destPath = `${currentPath}/${clipboard.filename}`.replace('//', '/');
    setLoading(true);
    try {
      let res;
      if (clipboard.type === 'copy') {
        res = await Api.fileCopy(clipboard.path, destPath);
      } else {
        res = await Api.fileMove(clipboard.path, destPath);
      }
      
      if (res.success) {
        addToast('Pasted successfully', 'success');
        addLog(`Pasted: ${clipboard.path} to ${destPath}`, 'success');
        setClipboard(null);
        browse(currentPath);
      } else {
        addLog(res.message, 'error');
        addToast('Paste failed', 'error');
      }
    } catch (err) {
      addLog('Paste error: ' + err.message, 'error');
      addToast('Paste error', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!confirm(`Are you sure you want to delete ${selectedItem.name}?`)) return;
    setLoading(true);
    try {
      const res = await Api.fileDelete(selectedItem.path);
      if (res.success) {
        addToast('Deleted successfully', 'success');
        addLog(`Deleted: ${selectedItem.path}`, 'success');
        setSelectedItem(null);
        browse(currentPath);
      } else {
        addLog(res.message, 'error');
        addToast('Delete failed', 'error');
      }
    } catch (err) {
      addLog('Delete error: ' + err.message, 'error');
      addToast('Delete error', 'error');
    }
    setLoading(false);
  };

  const renderBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    return (
      <div className="breadcrumbs-bar" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <span className="crumb clickable" onClick={() => browse('/')} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: parts.length === 0 ? '600' : 'normal' }}>Root</span>
        {parts.map((p, idx) => {
          const path = '/' + parts.slice(0, idx + 1).join('/');
          const isLast = idx === parts.length - 1;
          return (
            <React.Fragment key={idx}>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span className="crumb clickable" onClick={() => browse(path)} style={{ color: isLast ? 'var(--text-primary)' : 'var(--accent)', cursor: 'pointer', fontWeight: isLast ? '600' : 'normal' }}>
                {p}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <h2 className="section-title">
        <FolderOpen /> File Explorer
      </h2>

      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            <button className="btn" onClick={goUp} disabled={currentPath === '/' || loading} title="Go Up One Level">
              <ArrowUp size={16} /> Up
            </button>

            {renderBreadcrumbs()}
            
            <button className="btn" onClick={() => browse(currentPath)} disabled={loading} title="Refresh Directory">
              Refresh
            </button>
          </div>

          <div className="explorer-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <button className="btn btn-sm btn-accent" onClick={handleNewFolder} disabled={loading}>
              <FolderPlus size={14} /> New Folder
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              style={{ display: 'none' }} 
            />
            <button className="btn btn-sm btn-accent" onClick={handleUploadClick} disabled={loading}>
              <Upload size={14} /> Upload File
            </button>
            
            <div style={{ width: 1, background: 'var(--border)', margin: '0 8px' }} />

            <button className="btn btn-sm" onClick={handleCopy} disabled={!selectedItem || loading}>
              <Copy size={14} /> Copy
            </button>
            <button className="btn btn-sm" onClick={handleCut} disabled={!selectedItem || loading}>
              <Scissors size={14} /> Cut
            </button>
            <button className="btn btn-sm btn-success" onClick={handlePaste} disabled={!clipboard || loading} title={clipboard ? `Paste ${clipboard.filename}` : 'Nothing to paste'}>
              <Clipboard size={14} /> Paste
            </button>
            <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={!selectedItem || loading}>
              <Trash2 size={14} /> Delete
            </button>
            
            <div style={{ width: 1, background: 'var(--border)', margin: '0 8px' }} />
            
            <button className="btn btn-sm btn-accent" onClick={handleDownload} disabled={!selectedItem || selectedItem.is_directory || loading}>
              <Download size={14} /> Download
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              className="input"
              value={pathInput}
              onChange={e => setPathInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && browse(pathInput)}
              placeholder="Enter custom path (e.g. /sdcard/Download)"
              style={{ flex: 1 }}
            />
            <button className="btn" onClick={() => browse(pathInput)} disabled={loading}>Go</button>
          </div>

          <div style={{ minHeight: 250, background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250, color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ width: 24, height: 24, marginBottom: 12 }} />
                <span>Loading device files...</span>
              </div>
            ) : files.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250, color: 'var(--text-muted)' }}>
                No files or folders in this directory.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="file-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: 12 }}>Name</th>
                      <th style={{ padding: 12 }}>Size</th>
                      <th style={{ padding: 12 }}>Permissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f, i) => {
                      const isSelected = selectedItem?.path === f.path;
                      return (
                        <tr
                          key={i}
                          onClick={() => handleRowClick(f)}
                          onDoubleClick={() => handleRowDoubleClick(f)}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: isSelected ? 'var(--accent-glow)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.1s var(--ease)'
                          }}
                          className={isSelected ? 'selected-row' : ''}
                        >
                          <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, color: f.is_directory ? 'var(--accent)' : 'var(--text-primary)' }}>
                            {f.is_directory ? <Folder size={16} /> : <File size={16} />}
                            <span style={{ fontWeight: f.is_directory ? '600' : 'normal' }}>{f.name}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{f.size}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{f.permissions}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
