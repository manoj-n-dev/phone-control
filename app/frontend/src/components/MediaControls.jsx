import React, { useState } from 'react';
import { Music, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { Api } from '../api';

export default function MediaControls({ connected, addLog, addToast }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const doMedia = async (action) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    try {
      const res = await Api.media(action);
      addLog(`Media ${action}: ${res.message}`, res.success ? 'success' : 'error');
      if (res.success) {
        addToast(`Media ${action}`, 'success');
        if (action === 'play') setIsPlaying(true);
        if (action === 'pause') setIsPlaying(false);
      }
    } catch (e) {
      addLog('Media error: ' + e.message, 'error');
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      doMedia('pause');
    } else {
      doMedia('play');
    }
  };

  return (
    <div>
      <h2 className="section-title">
        <Music /> Media Controls
      </h2>

      <div className="card" style={{ maxWidth: 400 }}>
        <div className="card-body">
          <div className="media-transport" style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <button className="btn btn-icon round" onClick={() => doMedia('previous')}>
              <SkipBack size={20} />
            </button>
            <button className="btn btn-icon round play-btn" style={{ background: 'var(--accent)', color: '#000' }} onClick={togglePlayPause}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button className="btn btn-icon round" onClick={() => doMedia('next')}>
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
