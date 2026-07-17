import React, { useState } from 'react';
import { FolderOpen, File, Folder, ArrowUp, Trash2, Copy, Move, FolderPlus, Download, Upload } from 'lucide-react';
import { Api } from '../api';

export default function FileExplorer({ connected, addLog, addToast }) {
  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [files, setFiles] = useState([]);
  const [pathInput, setPathInput] = useState('/sdcard');
  const [loading, setLoading] = useState(false);

  // Operation states
  const [copySource, setCopySource] = useState('');
  const [copyDest, setCopyDest] = useState('');
  const [moveSource, setMoveSource] = useState('');
  const [moveDest, setMoveDest] = useState('');
  const [newDirPath, setNewDirPath] = useState('');
  const [pullRemote, setPullRemote] = useState('');
  const [pullLocal, setPullLocal] = useState('');
  const [pushLocal, setPushLocal] = useState('');
  const [pushRemote, setPushRemote] = useState('');

  const browse = async (path) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    setLoading(true);
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

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      browse('/' + parts.join('/'));
    }
  };

  const openDir = (path) => browse(path);

  const deleteFile = async (path) => {
    if (!connected) return;
    if (!confirm(`Delete ${path}?`)) return;
    try {
      const res = await Api.fileDelete(path);
      addLog(`Delete ${path}: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) { addToast('Deleted', 'success'); browse(currentPath); }
    } catch (e) { addLog('Delete error: ' + e.message, 'error'); }
  };

  const doCopy = async () => {
    if (!copySource || !copyDest) return;
    const res = await Api.fileCopy(copySource, copyDest);
    addLog(`Copy: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) addToast('Copied', 'success');
  };

  const doMove = async () => {
    if (!moveSource || !moveDest) return;
    const res = await Api.fileMove(moveSource, moveDest);
    addLog(`Move: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) { addToast('Moved', 'success'); browse(currentPath); }
  };

  const doMkdir = async () => {
    if (!newDirPath) return;
    const res = await Api.fileMkdir(newDirPath);
    addLog(`Mkdir: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) { addToast('Directory created', 'success'); browse(currentPath); }
  };

  const doPull = async () => {
    if (!pullRemote || !pullLocal) return;
    const res = await Api.filePull(pullRemote, pullLocal);
    addLog(`Pull: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) addToast('File pulled', 'success');
  };

  const doPush = async () => {
    if (!pushLocal || !pushRemote) return;
    const res = await Api.filePush(pushLocal, pushRemote);
    addLog(`Push: ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) addToast('File pushed', 'success');
  };

  return (
    <div>
      <h2 className="section-title">
        <FolderOpen /> File Explorer
      </h2>

      <div className="card">
        <div className="card-body">
          {/* Path bar */}
          <div className="input-row" style={{ marginBottom: 16 }}>
            <button className="btn" onClick={goUp}><ArrowUp size={16} /></button>
            <input
              className="input"
              value={pathInput}
              onChange={e => setPathInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && browse(pathInput)}
              placeholder="/sdcard"
            />
            <button className="btn btn-accent" onClick={() => browse(pathInput)} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Browse'}
            </button>
          </div>

          {/* File table */}
          {files.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table className="file-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f, i) => (
                    <tr key={i}>
                      <td>
                        <div className={`file-name ${f.is_directory ? 'dir' : ''} ${f.is_directory ? 'clickable' : ''}`}
                          onClick={() => f.is_directory && openDir(f.path)}
                        >
                          {f.is_directory ? <Folder size={16} /> : <File size={16} />}
                          {f.name}
                        </div>
                      </td>
                      <td>{f.size}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{f.permissions}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteFile(f.path)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* File operations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
            {/* Copy */}
            <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Copy size={14} /> Copy File
              </div>
              <input className="input" placeholder="Source path" value={copySource} onChange={e => setCopySource(e.target.value)} style={{ marginBottom: 6 }} />
              <input className="input" placeholder="Destination path" value={copyDest} onChange={e => setCopyDest(e.target.value)} style={{ marginBottom: 6 }} />
              <button className="btn btn-sm btn-accent" onClick={doCopy}>Copy</button>
            </div>

            {/* Move */}
            <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Move size={14} /> Move File
              </div>
              <input className="input" placeholder="Source path" value={moveSource} onChange={e => setMoveSource(e.target.value)} style={{ marginBottom: 6 }} />
              <input className="input" placeholder="Destination path" value={moveDest} onChange={e => setMoveDest(e.target.value)} style={{ marginBottom: 6 }} />
              <button className="btn btn-sm btn-accent" onClick={doMove}>Move</button>
            </div>

            {/* Mkdir */}
            <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FolderPlus size={14} /> Create Directory
              </div>
              <input className="input" placeholder="Directory path" value={newDirPath} onChange={e => setNewDirPath(e.target.value)} style={{ marginBottom: 6 }} />
              <button className="btn btn-sm btn-accent" onClick={doMkdir}>Create</button>
            </div>

            {/* Pull */}
            <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Pull File (Device to PC)
              </div>
              <input className="input" placeholder="Remote path" value={pullRemote} onChange={e => setPullRemote(e.target.value)} style={{ marginBottom: 6 }} />
              <input className="input" placeholder="Local save path" value={pullLocal} onChange={e => setPullLocal(e.target.value)} style={{ marginBottom: 6 }} />
              <button className="btn btn-sm btn-accent" onClick={doPull}>Pull</button>
            </div>

            {/* Push */}
            <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Upload size={14} /> Push File (PC to Device)
              </div>
              <input className="input" placeholder="Local file path" value={pushLocal} onChange={e => setPushLocal(e.target.value)} style={{ marginBottom: 6 }} />
              <input className="input" placeholder="Remote destination" value={pushRemote} onChange={e => setPushRemote(e.target.value)} style={{ marginBottom: 6 }} />
              <button className="btn btn-sm btn-accent" onClick={doPush}>Push</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
