const BASE = '';

async function api(path, options = {}) {
  const url = `${BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  return res.json();
}

export const Api = {
  connect: () => api('/api/connect', { method: 'POST' }),
  status: () => api('/api/status'),

  mirror: () => api('/api/mirror'),
  tap: (x, y) => api('/api/tap', { method: 'POST', body: { x, y } }),

  unlock: (type, value) => api('/api/unlock', { method: 'POST', body: { type, value } }),

  screen: (action) => api('/api/screen', { method: 'POST', body: { action } }),

  command: (command) => api('/api/command', { method: 'POST', body: { command } }),

  screenshot: () => api('/api/screenshot', { method: 'POST' }),

  battery: () => api('/api/battery'),
  deviceInfo: () => api('/api/device_info'),
  storage: () => api('/api/storage'),
  memory: () => api('/api/memory'),
  network: () => api('/api/network'),
  cpu: () => api('/api/cpu'),
  temperature: () => api('/api/temperature'),

  apps: () => api('/api/apps'),
  launchApp: (app_name) => api('/api/launch_app', { method: 'POST', body: { app_name } }),
  closeApp: (app_name) => api('/api/close_app', { method: 'POST', body: { app_name } }),

  files: (path) => api('/api/files', { method: 'POST', body: { path } }),
  fileCopy: (source, destination) => api('/api/file/copy', { method: 'POST', body: { source, destination } }),
  fileMove: (source, destination) => api('/api/file/move', { method: 'POST', body: { source, destination } }),
  fileDelete: (path) => api('/api/file/delete', { method: 'POST', body: { path } }),
  fileMkdir: (path) => api('/api/file/mkdir', { method: 'POST', body: { path } }),
  filePull: (remote_path, local_path) => api('/api/file/pull', { method: 'POST', body: { remote_path, local_path } }),
  filePush: (local_path, remote_path) => api('/api/file/push', { method: 'POST', body: { local_path, remote_path } }),

  toggle: (setting, action) => api('/api/toggle', { method: 'POST', body: { setting, action } }),
  brightness: (level) => api('/api/brightness', { method: 'POST', body: { level } }),
  volume: (stream, level) => api('/api/volume', { method: 'POST', body: { stream, level } }),
  ringerMode: (mode) => api('/api/ringer_mode', { method: 'POST', body: { mode } }),

  key: (key) => api('/api/key', { method: 'POST', body: { key } }),

  call: (action, number, type) => api('/api/call', { method: 'POST', body: { action, number, type } }),
  sms: (action, number, message, keyword) => api('/api/sms', { method: 'POST', body: { action, number, message, keyword } }),
  whatsapp: (number, message) => api('/api/whatsapp', { method: 'POST', body: { number, message } }),
  email: (recipient, subject, body) => api('/api/email', { method: 'POST', body: { recipient, subject, body } }),

  media: (action) => api('/api/media', { method: 'POST', body: { action } }),

  cameraPhoto: (camera) => api('/api/camera/photo', { method: 'POST', body: { camera } }),
  cameraVideo: (action) => api('/api/camera/video', { method: 'POST', body: { action } }),

  notifications: (action) => api('/api/notifications', { method: 'POST', body: { action } }),

  alarm: (time) => api('/api/alarm', { method: 'POST', body: { time } }),
  timer: (seconds) => api('/api/timer', { method: 'POST', body: { seconds } }),
  navigate: (destination) => api('/api/navigate', { method: 'POST', body: { destination } }),
  calendar: (eventData) => api('/api/calendar', { method: 'POST', body: eventData }),

  clipboard: (action, text) => api('/api/clipboard', { method: 'POST', body: { action, text } }),

  assistant: (command) => api('/api/assistant', { method: 'POST', body: { command } }),

  typeText: (text) => api('/api/type', { method: 'POST', body: { text } }),
  
  recentApps: () => api('/api/recent_apps', { method: 'POST' }),
};
