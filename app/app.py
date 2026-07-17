import sys
import os
import io
import re
import time
import base64
import json
import subprocess
from contextlib import redirect_stdout
from flask import Flask, request, jsonify, send_from_directory, send_file, after_this_request

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from android_automation import (
    connect_to_phone,
    clean_package_name,
    process_dynamic_natural_command,
    take_screenshot,
    show_battery_diagnostics,
    get_device_info,
    get_storage_info,
    get_memory_info,
    get_network_info,
    get_installed_apps,
    get_running_processes,
    get_cpu_info,
    get_temperature_info,
    list_files,
    toggle_wifi,
    toggle_bluetooth,
    toggle_airplane_mode,
    set_brightness,
    set_volume,
    toggle_do_not_disturb,
    set_mobile_data,
    toggle_flashlight,
    list_notifications,
    clear_notifications,
    take_photo,
    start_video_recording,
    stop_video_recording,
    launch_app_safely,
    close_app_safely,
    make_call,
    end_call,
    answer_call,
    control_media,
    toggle_screen,
    simulate_key,
    tap_coordinates,
    type_text,
    send_sms,
    send_whatsapp_message,
    read_last_sms,
    search_sms,
    send_email,
    copy_file,
    move_file,
    delete_file,
    create_directory,
    pull_file,
    push_file,
    copy_to_clipboard,
    paste_from_clipboard,
    clear_clipboard,
    launch_google_assistant,
    voice_command,
    set_alarm,
    set_timer,
    open_google_maps_navigation,
    create_calendar_event,
    unlock_with_pin,
    unlock_with_pattern,
    is_screen_on,
    clear_recent_apps,
    control_active_call,
    make_whatsapp_call
)

FRONTEND_BUILD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')

app = Flask(__name__, static_folder=FRONTEND_BUILD, static_url_path='')

device = None

SCREENSHOTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'screenshots')
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


def capture_output(func, *args, **kwargs):
    """Run a function and capture its stdout output."""
    buf = io.StringIO()
    with redirect_stdout(buf):
        result = func(*args, **kwargs)
    return buf.getvalue(), result


@app.route('/')
def serve_react():
    return send_from_directory(FRONTEND_BUILD, 'index.html')


@app.errorhandler(404)
def not_found(e):
    if not request.path.startswith('/api/'):
        return send_from_directory(FRONTEND_BUILD, 'index.html')
    return jsonify({'success': False, 'message': 'Not found'}), 404


@app.route('/api/connect', methods=['POST'])
def api_connect():
    global device
    try:
        device = connect_to_phone()
        if device:
            model = device.shell("getprop ro.product.model").strip()
            manufacturer = device.shell("getprop ro.product.manufacturer").strip()
            android_ver = device.shell("getprop ro.build.version.release").strip()
            serial = device.serial
            return jsonify({
                'success': True,
                'message': 'Connected to device',
                'data': {
                    'serial': serial,
                    'model': model,
                    'manufacturer': manufacturer,
                    'android_version': android_ver
                }
            })
        else:
            return jsonify({'success': False, 'message': 'No device found. Ensure USB debugging is enabled.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/status', methods=['GET'])
def api_status():
    global device
    if device:
        try:
            device.shell("echo ok")
            return jsonify({'success': True, 'connected': True})
        except Exception:
            device = None
    return jsonify({'success': True, 'connected': False})


@app.route('/api/mirror', methods=['GET'])
def api_mirror():
    """Capture current screen and return as base64-encoded JPEG."""
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'}), 400
    try:
        temp_path = os.path.join(SCREENSHOTS_DIR, '_mirror.png')
        device.shell("screencap -p /sdcard/_mirror_tmp.png")
        device.pull("/sdcard/_mirror_tmp.png", temp_path)
        device.shell("rm /sdcard/_mirror_tmp.png")

        with open(temp_path, 'rb') as f:
            img_data = f.read()
        b64 = base64.b64encode(img_data).decode('utf-8')
        return jsonify({'success': True, 'image': b64})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/tap', methods=['POST'])
def api_tap():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    x = request.json.get('x', 0)
    y = request.json.get('y', 0)
    try:
        device.shell(f"input tap {int(x)} {int(y)}")
        return jsonify({'success': True, 'message': f'Tapped at {x}, {y}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/unlock', methods=['POST'])
def api_unlock():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    
    unlock_type = request.json.get('type', 'pin')
    value = request.json.get('value', '')
    
    try:
        screen_on = is_screen_on(device)
        if not screen_on:
            device.shell("input keyevent 224")
            time.sleep(0.5)
            
        device.shell("input swipe 500 1500 500 500 300")
        time.sleep(0.5)
        
        if unlock_type in ['pin', 'password']:
            if value:
                escaped_val = str(value).replace(" ", "%s").replace("'", "\\'")
                device.shell(f"input text '{escaped_val}'")
                time.sleep(0.3)
                device.shell("input keyevent 66")
        elif unlock_type == 'pattern':
            if value:
                if isinstance(value, list):
                    pattern_seq = [int(v) for v in value]
                elif isinstance(value, str):
                    if ',' in value:
                        pattern_seq = [int(v.strip()) for v in value.split(',') if v.strip().isdigit()]
                    else:
                        pattern_seq = [int(v) for v in value if v.isdigit()]
                else:
                    pattern_seq = []
                
                if pattern_seq:
                    unlock_with_pattern(device, pattern_seq)

        return jsonify({'success': True, 'message': 'Unlock sequence sent'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/screen', methods=['POST'])
def api_screen():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    action = request.json.get('action', 'on')
    try:
        output, _ = capture_output(toggle_screen, device, action)
        return jsonify({'success': True, 'message': f'Screen turned {action}', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/command', methods=['POST'])
def api_command():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    command = request.json.get('command', '')
    if not command:
        return jsonify({'success': False, 'message': 'No command provided'})
    try:
        output, _ = capture_output(process_dynamic_natural_command, device, command)
        return jsonify({'success': True, 'message': f'Executed: {command}', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/keyboard', methods=['POST'])
def api_keyboard():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    
    text = request.json.get('text', '')
    key = request.json.get('key', '')
    
    try:
        if key:
            keys = {
                'Enter': 66, 'Backspace': 67, 'Space': 62, 'Tab': 61,
                'ArrowUp': 19, 'ArrowDown': 20, 'ArrowLeft': 21, 'ArrowRight': 22,
                'Escape': 111, 'Delete': 112
            }
            if key in keys:
                device.shell(f"input keyevent {keys[key]}")
                return jsonify({'success': True, 'message': f'Key {key} pressed'})
            elif len(key) == 1:
                text = key
        
        if text:
            escaped = text.replace(" ", "%s").replace("'", "\\'").replace('"', '\\"')
            device.shell(f"input text '{escaped}'")
            return jsonify({'success': True, 'message': f'Typed: {text}'})
            
        return jsonify({'success': False, 'message': 'No input provided'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/screenshot', methods=['POST'])
def api_screenshot():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        filename = f"screenshot_{int(time.time())}.png"
        filepath = os.path.join(SCREENSHOTS_DIR, filename)
        device.shell("screencap -p /sdcard/_screenshot_tmp.png")
        device.pull("/sdcard/_screenshot_tmp.png", filepath)
        device.shell("rm /sdcard/_screenshot_tmp.png")

        with open(filepath, 'rb') as f:
            img_data = f.read()
        b64 = base64.b64encode(img_data).decode('utf-8')
        return jsonify({
            'success': True,
            'message': 'Screenshot captured',
            'image': b64,
            'filename': filename
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/battery', methods=['GET'])
def api_battery():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        raw = device.shell("dumpsys battery")
        data = {}
        for line in raw.strip().split('\n'):
            line = line.strip()
            if ':' in line:
                key, val = line.split(':', 1)
                key = key.strip().lower().replace(' ', '_')
                val = val.strip()
                try:
                    val = int(val)
                except ValueError:
                    try:
                        val = float(val)
                    except ValueError:
                        pass
                data[key] = val
        if 'temperature' in data and isinstance(data['temperature'], (int, float)):
            data['temperature_c'] = round(data['temperature'] / 10, 1)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/device_info', methods=['GET'])
def api_device_info():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        model = device.shell("getprop ro.product.model").strip()
        manufacturer = device.shell("getprop ro.product.manufacturer").strip()
        android_version = device.shell("getprop ro.build.version.release").strip()
        sdk = device.shell("getprop ro.build.version.sdk").strip()
        build = device.shell("getprop ro.build.display.id").strip()
        hardware = device.shell("getprop ro.hardware").strip()
        screen_size = device.shell("wm size").strip()
        screen_density = device.shell("wm density").strip()
        serial = device.serial

        return jsonify({
            'success': True,
            'data': {
                'model': model,
                'manufacturer': manufacturer,
                'android_version': android_version,
                'sdk_version': sdk,
                'build_id': build,
                'hardware': hardware,
                'screen_size': screen_size.replace('Physical size: ', ''),
                'screen_density': screen_density.replace('Physical density: ', ''),
                'serial': serial
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/storage', methods=['GET'])
def api_storage():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        raw = device.shell("df -h /data /sdcard 2>/dev/null || df -h")
        lines = [l for l in raw.strip().split('\n') if l.strip()]
        entries = []
        seen_mounts = set()
        for line in lines:
            parts = line.split()
            if len(parts) >= 6 and not parts[0].lower().startswith("filesystem"):
                mounted_on = parts[5]
                label = mounted_on
                if mounted_on == '/data':
                    label = 'System Storage (/data)'
                elif mounted_on == '/sdcard' or 'emulated' in mounted_on:
                    label = 'Internal Storage (/sdcard)'
                
                if label in seen_mounts:
                    continue
                seen_mounts.add(label)
                entries.append({
                    'filesystem': parts[0],
                    'size': parts[1],
                    'used': parts[2],
                    'available': parts[3],
                    'use_percent': parts[4],
                    'mounted_on': label
                })
        return jsonify({'success': True, 'data': entries, 'raw': raw.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/memory', methods=['GET'])
def api_memory():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        raw = device.shell("cat /proc/meminfo")
        data = {}
        for line in raw.strip().split('\n'):
            if ':' in line:
                key, val = line.split(':', 1)
                key = key.strip()
                val = val.strip().replace(' kB', '')
                try:
                    data[key] = int(val)
                except ValueError:
                    data[key] = val
        total_kb = data.get('MemTotal', 0)
        free_kb = data.get('MemAvailable', data.get('MemFree', 0))
        used_kb = total_kb - free_kb if total_kb else 0
        return jsonify({
            'success': True,
            'data': {
                'total_mb': round(total_kb / 1024, 1) if total_kb else 0,
                'used_mb': round(used_kb / 1024, 1) if used_kb else 0,
                'free_mb': round(free_kb / 1024, 1) if free_kb else 0,
                'percent_used': round((used_kb / total_kb) * 100, 1) if total_kb else 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/network', methods=['GET'])
def api_network():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        wifi_raw = device.shell("dumpsys wifi | grep 'Wi-Fi is'").strip()
        ip_raw = device.shell("ip route | grep 'src'").strip()
        ssid_raw = device.shell("dumpsys wifi | grep 'mWifiInfo'").strip()

        wifi_enabled = 'enabled' in wifi_raw.lower() if wifi_raw else False
        ip_match = re.search(r'src\s+([\d.]+)', ip_raw)
        ip_addr = ip_match.group(1) if ip_match else 'N/A'
        ssid_match = re.search(r'SSID:\s*"?([^",]+)"?', ssid_raw)
        ssid = ssid_match.group(1) if ssid_match else 'N/A'

        return jsonify({
            'success': True,
            'data': {
                'wifi_enabled': wifi_enabled,
                'ip_address': ip_addr,
                'ssid': ssid,
                'raw': wifi_raw
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/cpu', methods=['GET'])
def api_cpu():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        raw = device.shell("cat /proc/cpuinfo")
        cores = raw.count('processor')
        hardware_match = re.search(r'Hardware\s*:\s*(.+)', raw)
        hardware = hardware_match.group(1).strip() if hardware_match else 'Unknown'
        return jsonify({
            'success': True,
            'data': {
                'cores': cores,
                'hardware': hardware,
                'raw': raw[:2000]
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/temperature', methods=['GET'])
def api_temperature():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        raw = device.shell("dumpsys battery | grep temperature")
        temp_match = re.search(r'temperature:\s*(\d+)', raw)
        temp_raw = int(temp_match.group(1)) if temp_match else 0
        temp_c = round(temp_raw / 10, 1)
        return jsonify({
            'success': True,
            'data': {
                'temperature_c': temp_c,
                'temperature_raw': temp_raw
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/apps', methods=['GET'])
def api_apps():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        raw = device.shell("pm list packages -3")
        packages = [l.replace("package:", "").strip() for l in raw.split('\n') if l.strip()]
        apps_list = []
        for pkg in packages:
            apps_list.append({
                'name': clean_package_name(pkg),
                'package': pkg
            })
        apps_list.sort(key=lambda x: x['name'].lower())
        return jsonify({'success': True, 'data': apps_list, 'count': len(apps_list)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/launch_app', methods=['POST'])
def api_launch_app():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    app_name = request.json.get('app_name', '')
    try:
        output, _ = capture_output(launch_app_safely, device, app_name)
        return jsonify({'success': True, 'message': f'Launched {app_name}', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/close_app', methods=['POST'])
def api_close_app():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    app_name = request.json.get('app_name', '')
    try:
        output, _ = capture_output(close_app_safely, device, app_name)
        return jsonify({'success': True, 'message': f'Closed {app_name}', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/files', methods=['POST'])
def api_files():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    path = request.json.get('path', '/sdcard')
    try:
        raw = device.shell(f"ls -la {path}")
        lines = raw.strip().split('\n')
        entries = []
        for line in lines:
            parts = line.split()
            if len(parts) >= 7:
                perms = parts[0]
                is_dir = perms.startswith('d')
                size = parts[3] if not is_dir else '-'
                name = ' '.join(parts[6:])
                if name in ['.', '..']:
                    continue
                entries.append({
                    'name': name,
                    'permissions': perms,
                    'size': size,
                    'is_directory': is_dir,
                    'path': f"{path}/{name}".replace('//', '/')
                })
        return jsonify({'success': True, 'data': entries, 'current_path': path})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/file/copy', methods=['POST'])
def api_file_copy():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    src = request.json.get('source', '')
    dst = request.json.get('destination', '')
    try:
        device.shell(f"cp -r {src} {dst}")
        return jsonify({'success': True, 'message': f'Copied {src} to {dst}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/file/move', methods=['POST'])
def api_file_move():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    src = request.json.get('source', '')
    dst = request.json.get('destination', '')
    try:
        device.shell(f"mv {src} {dst}")
        return jsonify({'success': True, 'message': f'Moved {src} to {dst}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/file/delete', methods=['POST'])
def api_file_delete():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    filepath = request.json.get('path', '')
    try:
        device.shell(f"rm -rf {filepath}")
        return jsonify({'success': True, 'message': f'Deleted {filepath}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/file/mkdir', methods=['POST'])
def api_file_mkdir():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    path = request.json.get('path', '')
    try:
        device.shell(f"mkdir -p {path}")
        return jsonify({'success': True, 'message': f'Created directory {path}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/file/pull', methods=['POST'])
def api_file_pull():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    remote = request.json.get('remote_path', '')
    local = request.json.get('local_path', '')
    try:
        device.pull(remote, local)
        return jsonify({'success': True, 'message': f'Pulled {remote} to {local}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/file/push', methods=['POST'])
def api_file_push():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    local = request.json.get('local_path', '')
    remote = request.json.get('remote_path', '')
    try:
        device.push(local, remote)
        return jsonify({'success': True, 'message': f'Pushed {local} to {remote}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/file/upload', methods=['POST'])
def api_file_upload():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'})
    file = request.files['file']
    remote_path = request.form.get('remote_path', '/sdcard')
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'})
        
    try:
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, file.filename)
        file.save(temp_path)
        
        remote_file_path = os.path.join(remote_path, file.filename).replace('\\', '/')
        device.push(temp_path, remote_file_path)
        
        os.remove(temp_path)
        return jsonify({'success': True, 'message': f'Uploaded {file.filename} to {remote_path}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/file/download', methods=['GET'])
def api_file_download():
    global device
    if not device:
        return 'Device not connected', 400
    remote_path = request.args.get('path', '')
    if not remote_path:
        return 'No path specified', 400
        
    try:
        filename = os.path.basename(remote_path)
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_downloads')
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, filename)
        
        device.pull(remote_path, temp_path)
        
        @after_this_request
        def cleanup(response):
            try:
                os.remove(temp_path)
            except Exception:
                pass
            return response
            
        return send_file(temp_path, as_attachment=True, download_name=filename)
    except Exception as e:
        return str(e), 500


@app.route('/api/toggle', methods=['POST'])
def api_toggle():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    setting = request.json.get('setting', '')
    action = request.json.get('action', 'on')
    try:
        output = ''
        if setting == 'wifi':
            output, _ = capture_output(toggle_wifi, device, action)
        elif setting == 'bluetooth':
            output, _ = capture_output(toggle_bluetooth, device, action)
        elif setting == 'airplane':
            output, _ = capture_output(toggle_airplane_mode, device, action)
        elif setting == 'data':
            output, _ = capture_output(set_mobile_data, device, action)
        elif setting == 'dnd':
            output, _ = capture_output(toggle_do_not_disturb, device, action)
        elif setting == 'flashlight':
            if action in ['on', 'enable']:
                device.shell("cmd statusbar expand-notifications")
                time.sleep(0.5)
                device.shell("cmd statusbar collapse")
                device.shell("settings put system flashlight_enabled 1")
            else:
                device.shell("settings put system flashlight_enabled 0")
            output = f'Flashlight {action}'
        else:
            return jsonify({'success': False, 'message': f'Unknown setting: {setting}'})
        return jsonify({'success': True, 'message': f'{setting} set to {action}', 'output': output.strip() if isinstance(output, str) else output})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/brightness', methods=['POST'])
def api_brightness():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    level = request.json.get('level', 150)
    try:
        device.shell(f"settings put system screen_brightness {level}")
        device.shell("settings put system screen_brightness_mode 0")
        return jsonify({'success': True, 'message': f'Brightness set to {level}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/volume', methods=['POST'])
def api_volume():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    stream = request.json.get('stream', 'music')
    percentage = request.json.get('level', 50)
    
    try:
        level = int((percentage / 100) * 15)
        output, _ = capture_output(set_volume, device, stream, level)
        return jsonify({'success': True, 'message': f'{stream} volume set to {percentage}%'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/ringer_mode', methods=['POST'])
def api_ringer_mode():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    mode = request.json.get('mode', 'normal')
    
    try:
        if mode == 'silent':
            device.shell("service call audio 6 i32 0")
            device.shell("settings put global zen_mode 1")
        elif mode == 'vibrate':
            device.shell("service call audio 6 i32 1")
            device.shell("settings put global zen_mode 0")
        else: 
            device.shell("service call audio 6 i32 2")
            device.shell("settings put global zen_mode 0")
            
        return jsonify({'success': True, 'message': f'Ringer mode set to {mode}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/key', methods=['POST'])
def api_key():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    key_name = request.json.get('key', 'home')
    try:
        if key_name == 'mute':
            current = device.shell("settings get global zen_mode").strip()
            if current == '0':
                device.shell("settings put global zen_mode 1")
                return jsonify({'success': True, 'message': 'Device muted (DND enabled)', 'state': 'muted'})
            else:
                device.shell("settings put global zen_mode 0")
                return jsonify({'success': True, 'message': 'Device unmuted (DND disabled)', 'state': 'unmuted'})
        elif key_name == 'volume_mute':
            device.shell("input keyevent 164")
            return jsonify({'success': True, 'message': 'Volume mute toggled'})
        else:
            output, _ = capture_output(simulate_key, device, key_name)
            return jsonify({'success': True, 'message': f'Key {key_name} pressed', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/call', methods=['POST'])
def api_call():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    action = request.json.get('action', 'make')
    number = request.json.get('number', '')
    call_type = request.json.get('type', 'voice') 
    
    try:
        if action == 'make':
            output, _ = capture_output(make_call, device, number)
        elif action == 'answer':
            output, _ = capture_output(answer_call, device)
        elif action == 'end':
            output, _ = capture_output(end_call, device)
        elif action == 'whatsapp':
            output, _ = capture_output(make_whatsapp_call, device, number, call_type)
        elif action in ['speaker', 'mute', 'hold', 'record']:
            output, _ = capture_output(control_active_call, device, action)
        else:
            return jsonify({'success': False, 'message': f'Unknown action: {action}'})
        return jsonify({'success': True, 'message': f'Call action {action} executed', 'output': output.strip() if isinstance(output, str) else ''})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/recent_apps', methods=['POST'])
def api_recent_apps():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    try:
        output, _ = capture_output(clear_recent_apps, device)
        return jsonify({'success': True, 'message': 'Recent apps cleared', 'output': output.strip() if isinstance(output, str) else ''})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/sms', methods=['POST'])
def api_sms():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    action = request.json.get('action', 'send')
    try:
        if action == 'send':
            number = request.json.get('number', '')
            message = request.json.get('message', '')
            output, _ = capture_output(send_sms, device, number, message)
        elif action == 'read':
            raw = device.shell(r"content query --uri content://sms/inbox --projection address:body:date --sort date\ DESC --limit 5")
            return jsonify({'success': True, 'data': raw.strip()})
        elif action == 'search':
            keyword = request.json.get('keyword', '')
            raw = device.shell(f"content query --uri content://sms/inbox --projection address:body:date --where \"body LIKE '%{keyword}%'\" --limit 10")
            return jsonify({'success': True, 'data': raw.strip()})
        else:
            return jsonify({'success': False, 'message': f'Unknown action: {action}'})
        return jsonify({'success': True, 'message': 'SMS action executed', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/whatsapp', methods=['POST'])
def api_whatsapp():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    number = request.json.get('number', '')
    message = request.json.get('message', '')
    try:
        import urllib.parse
        clean_number = re.sub(r'[^\d+]', '', number)
        encoded_msg = urllib.parse.quote(message)
        url = f"https://api.whatsapp.com/send?phone={clean_number}&text={encoded_msg}"
        device.shell(f"am start -a android.intent.action.VIEW -d '{url}'")
        time.sleep(3)
        device.shell("input tap 940 1600")
        time.sleep(0.5)
        return jsonify({'success': True, 'message': f'WhatsApp message sent to {number}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/email', methods=['POST'])
def api_email():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    recipient = request.json.get('recipient', '')
    subject = request.json.get('subject', '')
    body = request.json.get('body', '')
    try:
        output, _ = capture_output(send_email, device, recipient, subject, body)
        return jsonify({'success': True, 'message': f'Email composed to {recipient}', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/media', methods=['POST'])
def api_media():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    action = request.json.get('action', 'play')
    try:
        output, _ = capture_output(control_media, device, action)
        return jsonify({'success': True, 'message': f'Media {action}', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/camera/photo', methods=['POST'])
def api_camera_photo():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    camera = request.json.get('camera', 'back')
    try:
        device.shell("am start -a android.media.action.STILL_IMAGE_CAMERA")
        time.sleep(3)  
        
        if camera == 'front':
            device.shell("am start -a android.media.action.STILL_IMAGE_CAMERA --ei android.intent.extras.CAMERA_FACING 1")
            time.sleep(1)
        
        time.sleep(1)
        
        device.shell("input keyevent KEYCODE_CAMERA")
        time.sleep(1)
        device.shell("input keyevent KEYCODE_VOLUME_DOWN")
        time.sleep(2)
        
        return jsonify({'success': True, 'message': f'Photo captured with {camera} camera'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/camera/video', methods=['POST'])
def api_camera_video():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    action = request.json.get('action', 'start')
    try:
        if action == 'start':
            device.shell("am start -a android.media.action.VIDEO_CAPTURE")
            time.sleep(3)  
            device.shell("input keyevent KEYCODE_MEDIA_RECORD")
            time.sleep(1)
            return jsonify({'success': True, 'message': 'Video recording started'})
        else:
            device.shell("input keyevent KEYCODE_MEDIA_RECORD")
            time.sleep(1)
            device.shell("input keyevent KEYCODE_CAMERA")
            time.sleep(1)
            return jsonify({'success': True, 'message': 'Video recording stopped'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/notifications', methods=['POST'])
def api_notifications():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    action = request.json.get('action', 'list')
    try:
        if action == 'list':
            raw = device.shell("dumpsys notification --noredact")
            notifications = _parse_notifications(raw)
            return jsonify({'success': True, 'data': notifications})
        elif action == 'clear':
            device.shell("service call notification 1")
            return jsonify({'success': True, 'message': 'Notifications cleared'})
        return jsonify({'success': False, 'message': 'Unknown action'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


def _parse_notifications(raw):
    """Parse dumpsys notification --noredact into structured notification objects."""
    notifications = []
    seen = set()
    
    blocks = re.split(r'NotificationRecord\(', raw)
    
    for block in blocks[1:]:  
        try:
            pkg_match = re.search(r'pkg=(\S+)', block)
            pkg = pkg_match.group(1) if pkg_match else None
            if not pkg:
                continue
            
            title_match = re.search(r'android\.title=([^\n]+)', block)
            title = title_match.group(1).strip() if title_match else ''
            
            text_match = re.search(r'android\.text=([^\n]+)', block)
            text = text_match.group(1).strip() if text_match else ''
            
            subtext_match = re.search(r'android\.subText=([^\n]+)', block)
            subtext = subtext_match.group(1).strip() if subtext_match else ''
            
            time_match = re.search(r'postTime=(\d+)', block)
            post_time = int(time_match.group(1)) if time_match else 0
            
            if not title and not text:
                continue
            
            if title == 'null':
                title = ''
            if text == 'null':
                text = ''
            if subtext == 'null':
                subtext = ''
            
            if not title and not text:
                continue
            
            dedup_key = f"{pkg}|{title}|{text}"
            if dedup_key in seen:
                continue
            seen.add(dedup_key)
            
            app_name = clean_package_name(pkg)
            
            notifications.append({
                'package': pkg,
                'app': app_name,
                'title': title,
                'text': text,
                'subtext': subtext,
                'time': post_time,
            })
        except Exception:
            continue
    
    notifications.sort(key=lambda n: n.get('time', 0), reverse=True)
    return notifications


@app.route('/api/alarm', methods=['POST'])
def api_alarm():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    time_str = request.json.get('time', '')
    try:
        parts = time_str.replace('.', ':').split(':')
        hour = int(parts[0]) if parts else 7
        minute = int(parts[1]) if len(parts) > 1 else 0
        device.shell(f"am start -a android.intent.action.SET_ALARM --ei android.intent.extra.alarm.HOUR {hour} --ei android.intent.extra.alarm.MINUTES {minute} --ez android.intent.extra.alarm.SKIP_UI true")
        return jsonify({'success': True, 'message': f'Alarm set for {hour}:{minute:02d}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/timer', methods=['POST'])
def api_timer():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    seconds = request.json.get('seconds', 60)
    try:
        device.shell(f"am start -a android.intent.action.SET_TIMER --ei android.intent.extra.timer.LENGTH {seconds} --ez android.intent.extra.timer.SKIP_UI true")
        return jsonify({'success': True, 'message': f'Timer set for {seconds} seconds'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/navigate', methods=['POST'])
def api_navigate():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    destination = request.json.get('destination', '')
    try:
        import urllib.parse
        encoded = urllib.parse.quote(destination)
        device.shell(f"am start -a android.intent.action.VIEW -d 'google.navigation:q={encoded}'")
        return jsonify({'success': True, 'message': f'Navigating to {destination}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/calendar', methods=['POST'])
def api_calendar():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    title = request.json.get('title', '')
    description = request.json.get('description', '')
    location = request.json.get('location', '')
    begin_time = request.json.get('beginTime', '')
    end_time = request.json.get('endTime', '')
    try:
        cmd = "am start -a android.intent.action.INSERT -t 'vnd.android.cursor.dir/event'"
        cmd += f" --es title \"{title.replace('&', '\&').replace('\"', '\\\"')}\""
        if description:
            cmd += f" --es description \"{description.replace('&', '\&').replace('\"', '\\\"')}\""
        if location:
            cmd += f" --es eventLocation \"{location.replace('&', '\&').replace('\"', '\\\"')}\""
        
        import datetime
        if begin_time:
            dt = datetime.datetime.fromisoformat(begin_time)
            epoch_ms = int(dt.timestamp() * 1000)
            cmd += f" --el beginTime {epoch_ms}"
        if end_time:
            dt = datetime.datetime.fromisoformat(end_time)
            epoch_ms = int(dt.timestamp() * 1000)
            cmd += f" --el endTime {epoch_ms}"
            
        device.shell(cmd)
        return jsonify({'success': True, 'message': f'Calendar event composed: {title}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/clipboard', methods=['POST'])
def api_clipboard():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    action = request.json.get('action', 'copy')
    text = request.json.get('text', '')
    try:
        if action == 'copy':
            output, _ = capture_output(copy_to_clipboard, device, text)
        elif action == 'paste':
            output, _ = capture_output(paste_from_clipboard, device)
        elif action == 'clear':
            output, _ = capture_output(clear_clipboard, device)
        else:
            return jsonify({'success': False, 'message': 'Unknown action'})
        return jsonify({'success': True, 'message': f'Clipboard {action} done', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/assistant', methods=['POST'])
def api_assistant():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    command = request.json.get('command', '')
    try:
        if command:
            output, _ = capture_output(voice_command, device, command)
        else:
            output, _ = capture_output(launch_google_assistant, device)
        return jsonify({'success': True, 'message': 'Assistant command sent', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/type', methods=['POST'])
def api_type():
    global device
    if not device:
        return jsonify({'success': False, 'message': 'Device not connected'})
    text = request.json.get('text', '')
    try:
        output, _ = capture_output(type_text, device, text)
        return jsonify({'success': True, 'message': f'Typed text', 'output': output.strip()})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
