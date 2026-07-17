import subprocess
import os
import sys
import time
import webbrowser

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, 'frontend')
    
    print("Starting Flask Backend...")
    backend_process = subprocess.Popen(
        [sys.executable, 'app.py'],
        cwd=base_dir
    )
    
    print("Starting Vite Frontend...")
    frontend_process = subprocess.Popen(
        ['npm', 'run', 'dev'],
        cwd=frontend_dir,
        shell=True
    )
    
    print("Waiting for servers to initialize...")
    time.sleep(3)
    
    url = "http://localhost:3000"
    print(f"Opening {url} in Chrome...")
    
    chrome_path_64 = "C:/Program Files/Google/Chrome/Application/chrome.exe"
    chrome_path_32 = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    
    try:
        if os.path.exists(chrome_path_64):
            webbrowser.get(f'"{chrome_path_64}" %s').open(url)
        elif os.path.exists(chrome_path_32):
            webbrowser.get(f'"{chrome_path_32}" %s').open(url)
        else:
            webbrowser.open(url)
    except Exception as e:
        print(f"Failed to open Chrome specifically: {e}")
        webbrowser.open(url)
        
    print("\n--- Both servers are running. Press Ctrl+C to stop. ---")
    
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Servers stopped.")

if __name__ == '__main__':
    main()
