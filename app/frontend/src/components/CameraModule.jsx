import React, { useState } from 'react';
import { Camera, Video, VideoOff } from 'lucide-react';
import { Api } from '../api';

export default function CameraModule({ connected, addLog, addToast }) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const takePhoto = async (facing) => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    setLoading(true);
    try {
      const res = await Api.cameraPhoto(facing);
      if (res.success) {
        addLog(`Photo captured using ${facing} camera`, 'success');
        addToast(`Photo captured (${facing})`, 'success');
      } else {
        addLog(res.message, 'error');
        addToast('Photo capture failed', 'error');
      }
    } catch (e) {
      addLog('Camera error: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const toggleVideo = async () => {
    if (!connected) { addToast('Device not connected', 'error'); return; }
    const action = recording ? 'stop' : 'start';
    try {
      const res = await Api.cameraVideo(action);
      if (res.success) {
        setRecording(!recording);
        addLog(`Video recording ${action}ed`, 'success');
        addToast(`Video recording ${action}ed`, 'success');
      } else {
        addLog(res.message, 'error');
      }
    } catch (e) {
      addLog('Video error: ' + e.message, 'error');
    }
  };

  return (
    <div>
      <h2 className="section-title">
        <Camera /> Camera Control
      </h2>

      <div className="card" style={{ maxWidth: 500 }}>
        <div className="card-body">
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Triggers the default system camera application on the device.
          </div>
          
          <div className="btn-group">
            <button className="btn btn-accent" onClick={() => takePhoto('back')} disabled={loading}>
              <Camera size={16} /> Take Back Photo
            </button>
            <button className="btn btn-accent" onClick={() => takePhoto('front')} disabled={loading}>
              <Camera size={16} /> Take Front Photo
            </button>
            <button className={`btn ${recording ? 'btn-danger' : 'btn-success'}`} onClick={toggleVideo}>
              {recording ? <VideoOff size={16} /> : <Video size={16} />}
              {recording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
