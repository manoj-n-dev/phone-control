import sys
import time
import os
import re
import urllib.parse
import base64
import xml.etree.ElementTree as ET
from ppadb.client import Client as AdbClient  

APP_PACKAGES = {
    "whatsapp": "com.whatsapp",
    "whatsapp business": "com.whatsapp.w4b",
    "instagram": "com.instagram.android",
    "facebook": "com.facebook.katana",
    "messenger": "com.facebook.orca",
    "facebook lite": "com.facebook.lite",
    "tiktok": "com.zhiliaoapp.musically",
    "snapchat": "com.snapchat.android",
    "telegram": "org.telegram.messenger",
    "x": "com.twitter.android",
    "twitter": "com.twitter.android",
    "reddit": "com.reddit.frontpage",
    "pinterest": "com.pinterest",
    "discord": "com.discord",
    "linkedin": "com.linkedin.android",
    "signal": "org.thoughtcrime.securesms",

    "spotify": "com.spotify.music",
    "youtube music": "com.google.android.apps.youtube.music",
    "yt music": "com.google.android.apps.youtube.music",
    "jiosaavn": "com.jio.media.jiobeats",
    "saavn": "com.jio.media.jiobeats",
    "wynk": "com.bsb.hike",
    "wynk music": "com.bsb.hike",
    "gaana": "com.gaana",
    "amazon music": "com.amazon.mp3",
    "apple music": "com.apple.android.music",
    "soundcloud": "com.soundcloud.android",
    "shazam": "com.shazam.android",

    "youtube": "com.google.android.youtube",
    "chrome": "com.android.chrome",
    "gmail": "com.google.android.gm",
    "maps": "com.google.android.apps.maps",
    "google maps": "com.google.android.apps.maps",
    "drive": "com.google.android.apps.docs",
    "google drive": "com.google.android.apps.docs",
    "photos": "com.google.android.apps.photos",
    "google photos": "com.google.android.apps.photos",
    "calendar": "com.google.android.calendar",
    "keep": "com.google.android.apps.notes",
    "meet": "com.google.android.apps.dynamite",
    "translate": "com.google.android.apps.translate",
    "files": "com.google.android.apps.nbu.files",
    "gemini": "com.google.android.apps.googleassistant",

    "netflix": "com.netflix.mediaclient",
    "prime video": "com.amazon.avod.thirdpartyclient",
    "disney": "com.disney.disneyplus",
    "hotstar": "in.startv.hotstar",
    "twitch": "tv.twitch.android",

    "chatgpt": "com.openai.chatgpt",
    "microsoft teams": "com.microsoft.teams",
    "zoom": "us.zoom.videomeetings",
    "outlook": "com.microsoft.office.outlook",
    "word": "com.microsoft.office.word",
    "excel": "com.microsoft.office.excel",
    "onedrive": "com.microsoft.skydrive",
    "dropbox": "com.dropbox.android",
    "duolingo": "com.duolingo",

    "amazon": "com.amazon.mShop.android.shopping",
    "temu": "com.einnovation.temu",
    "shein": "com.zzkko",
    "ebay": "com.ebay.mobile",
    "mcdonalds": "com.mcdonalds.mobileapp",
    "flipkart": "com.flipkart.android",

    "settings": "com.android.settings",
    "camera": "com.android.camera",
    "gallery": "com.android.gallery3d",
    "clock": "com.google.android.deskclock",
    "calculator": "com.google.android.calculator",
    "phone": "com.google.android.dialer",
    "contacts": "com.google.android.contacts",
    "play store": "com.android.vending",

    "roblox": "com.roblox.client",
    "subway surfers": "com.kiloo.subwaysurf",
    "candy crush": "com.king.candycrushsaga",
    "pubg": "com.tencent.ig",
    "free fire": "com.dts.freefireth"
}

def clean_package_name(package):
    """Translates package IDs (e.g. com.whatsapp) into clean human-readable app names."""
    rev_map = {pkg: name.title() for name, pkg in APP_PACKAGES.items()}
    if package in rev_map:
        return rev_map[package]
    
    overrides = {
        "com.android.settings": "Settings",
        "com.android.camera": "Camera",
        "com.android.gallery3d": "Gallery",
        "com.google.android.dialer": "Phone",
        "com.google.android.contacts": "Contacts",
        "com.android.vending": "Play Store",
        "com.google.android.apps.messaging": "Messages",
        "com.google.android.calculator": "Calculator",
        "com.google.android.deskclock": "Clock",
        "com.android.chrome": "Chrome",
        "com.google.android.gm": "Gmail",
        "com.google.android.apps.maps": "Maps",
        "com.google.android.apps.photos": "Photos",
        "com.google.android.youtube": "YouTube",
    }
    if package in overrides:
        return overrides[package]
        
    parts = package.split('.')
    if not parts:
        return package
        
    name_part = parts[-1]
    generic = {'android', 'app', 'client', 'mobile', 'messenger', 'service', 'free', 'lite', 'player'}
    if name_part.lower() in generic and len(parts) > 2:
        name_part = parts[-2]
        
    name_part = re.sub(r'(?<!^)(?=[A-Z])', ' ', name_part)
    name_part = name_part.replace('_', ' ').replace('-', ' ')
    
    words = [w.capitalize() for w in name_part.split()]
    return ' '.join(words)

def connect_to_phone():
    """Initializes the ADB client connection securely."""
    client = AdbClient(host="127.0.0.1", port=5037)
    try:
        devices = client.devices()
    except Exception as e:
        print(f" ADB Server Connection Error: {e}")
        print(" Ensure ADB server is running. Try typing 'adb devices' in your command prompt.")
        return None

    if len(devices) == 0:
        print(" Error: No USB connected phone detected.")
        print(" Make sure USB Debugging is ON and your PC is authorized on the phone screen.")
        return None
    print(f" Connected directly to device: {devices[0].serial}")
    return devices[0]

def is_screen_on(device):
    """Parses system power state to determine if device display panel is active."""
    power_state = device.shell("dumpsys power | grep mWakefulness=")
    return "Awake" in power_state

def toggle_screen(device, action):
    """Intelligently changes screen state based on current device reality."""
    screen_active = is_screen_on(device)
    if action == "off" and screen_active:
        device.shell("input keyevent 26")  
        print(" Screen suspended.")
    elif action == "on" and not screen_active:
        device.shell("input keyevent 224") 
        print(" Screen awakened.")
    elif action == "on" and screen_active:
        print(" Screen is already powered on.")
    elif action == "off" and not screen_active:
        print(" Screen is already sleeping.")

def unlock_with_pin(device, pin_code=None):
    """Flashes keyguard layout and feeds numerical pin patterns into input interface."""
    toggle_screen(device, "on")
    time.sleep(0.4)
    device.shell("input keyevent 82") 
    time.sleep(0.4)
    
    if not pin_code:
        user_pin = input(" Enter phone PIN code here: ").strip()
    else:
        user_pin = str(pin_code).strip()

    if user_pin:
        device.shell(f"input text {user_pin}")
        time.sleep(0.3)
        device.shell("input keyevent 66") 
        print(" Unlock pattern transmission completed.")

def unlock_with_pattern(device, pattern_sequence):
    """Simulates a continuous swipe sequence for pattern unlock using monkey scripting."""
    if not pattern_sequence:
        return
    print(f" Simulating Pattern Unlock: {pattern_sequence}")
    if not is_screen_on(device):
        device.shell("input keyevent 224")
        time.sleep(0.5)
    
    device.shell("input swipe 500 1500 500 500 300")
    time.sleep(0.6)
    
    size_str = device.shell("wm size")
    width, height = 1080, 2400  
    match = re.search(r'(\d+)x(\d+)', size_str)
    if match:
        width = int(match.group(1))
        height = int(match.group(2))
        
    x_start = width * 0.18
    x_end = width * 0.82
    y_start = height * 0.58
    y_end = height * 0.85
    
    dots = {}
    for i in range(9):
        row = i // 3
        col = i % 3
        cx = x_start + col * (x_end - x_start) / 2
        cy = y_start + row * (y_end - y_start) / 2
        dots[i+1] = (cx, cy)
        
    script_lines = [
        "type= user",
        "count= 1",
        "speed= 1.0",
        "start data >>"
    ]
    
    now = int(time.time() * 1000)
    first_dot = int(pattern_sequence[0])
    fx, fy = dots[first_dot]
    script_lines.append(f"DispatchPointer({now}, {now}, 0, {fx}, {fy}, 0, 0, 0, 0, 0, 0, 0)")
    
    for idx, dot in enumerate(pattern_sequence[1:]):
        curr_time = now + 80 * (idx + 1)
        cx, cy = dots[int(dot)]
        script_lines.append(f"DispatchPointer({now}, {curr_time}, 2, {cx}, {cy}, 0, 0, 0, 0, 0, 0, 0)")
        
    last_dot = int(pattern_sequence[-1])
    lx, ly = dots[last_dot]
    end_time = now + 80 * len(pattern_sequence) + 20
    script_lines.append(f"DispatchPointer({now}, {end_time}, 1, {lx}, {ly}, 0, 0, 0, 0, 0, 0, 0)")
    
    script_content = "\n".join(script_lines) + "\n"
    
    b64_script = base64.b64encode(script_content.encode('utf-8')).decode('utf-8')
    device.shell(f"echo {b64_script} | base64 -d > /data/local/tmp/pattern.script")
    device.shell("monkey -f /data/local/tmp/pattern.script 1")
    device.shell("rm /data/local/tmp/pattern.script")
    print(" Unlock pattern transmission completed.")

def reboot_device(device, mode="standard"):
    """Forces physical boot modifications via hardware pipeline parameters."""
    print(f" Executing Device Reset Strategy: [{mode.upper()} MODE]")
    if mode == "recovery":
        device.shell("reboot recovery")
    elif mode == "bootloader" or mode == "fastboot":
        device.shell("reboot bootloader")
    else:
        device.shell("reboot")

def simulate_key(device, key_name):
    """Maps dynamic system keywords directly to explicit hardware response codes."""
    keys = {
        "home": 3, "back": 4, "call": 5, "endcall": 6,
        "volume_up": 24, "vol_up": 24, "volume_down": 25, "vol_down": 25,
        "mute": 164, "enter": 66, "del": 67, "delete": 67, "space": 62, "tab": 61,
        "brightness_up": 221, "brightness_down": 220, "menu": 82, "search": 84
    }
    code = keys.get(key_name.lower().strip().replace(" ", "_"))
    if code:
        device.shell(f"input keyevent {code}")
        print(f" Physical Event Synthesized: [KEYCODE {key_name.upper()} ({code})]")
    else:
        print(f" Warning: Hardware translation key mapping target '{key_name}' missing.")

def tap_coordinates(device, x, y):
    """Injects direct coordinate digit touches anywhere on physical screen display plane."""
    device.shell(f"input tap {x} {y}")
    print(f" Precision Touch Vector Registered at: X={x}, Y={y}")

def swipe_gesture(device, direction, exact_coords=None):
    """Transforms semantic directions or arbitrary bounds into real screen sweeps."""
    gestures = {
        "up": "500 1600 500 400 300",
        "down": "500 400 500 1600 300",
        "left": "950 1000 50 1000 300",
        "right": "50 1000 950 1000 300"
    }
    
    if exact_coords:
        coords = exact_coords
    else:
        coords = gestures.get(direction.lower().strip())
        
    if coords:
        device.shell(f"input swipe {coords}")
        print(f" Swiped Surface Matrix: Direction=[{direction.upper()}], Bounds=[{coords}]")
    else:
        print(f" Directional parsing parameters for gesture translation failed.")

def control_media(device, action):
    """Feeds explicit media layout pipeline keys directly to active OS listener."""
    media_events = {
        "play": 126, "pause": 127, "next": 87, "skip": 87,
        "previous": 88, "prev": 88, "stop": 86, "rewind": 89, "fastforward": 90
    }
    code = media_events.get(action.lower().strip())
    if code:
        device.shell(f"input keyevent {code}")
        print(f" Media Stream Action Modified: {action.upper()}")
    else:
        print(f" Media instruction profile unmapped.")

def type_text(device, text):
    """Escapes operating shell whitespace parameters to stream text structures directly."""
    escaped_text = text.replace(" ", "%s").replace("'", "").replace('"', "")
    device.shell(f"input text {escaped_text}")
    print(f" Injected text string: '{text}'")

def take_screenshot(device):
    """Captures and dynamically transfers screen images out of underlying disk space."""
    filename = f"screenshot_{int(time.time())}.png"
    device.shell("screencap -p /sdcard/runtime_capture.png")
    device.pull("/sdcard/runtime_capture.png", filename)
    device.shell("rm /sdcard/runtime_capture.png")
    print(f" Screen Captured! Frame exported to directory: {os.path.abspath(filename)}")

def show_battery_diagnostics(device):
    """Dumps real-time electrical telemetry matrices from hardware charging modules."""
    info = device.shell("dumpsys battery")
    print("\n --- LIVE HARDWARE ELECTRICAL TELEMETRY ---")
    print(info.strip())

def clear_all_background_apps(device):
    """Iterates through localized lookup profiles to force drop active user spaces."""
    print(" Purging active third-party execution structures out of memory rings...")
    for app, package in APP_PACKAGES.items():
        if "com.android" not in package and "google" not in package:
            device.shell(f"am force-stop {package}")
    print(" Non-critical background framework memory segments recovered successfully.")

def clear_recent_apps(device):
    """Clears all recently used apps using app switch key."""
    print(" Clearing recent apps via UI...")
    device.shell("input keyevent 187") 
    time.sleep(1.0)
    for _ in range(5):
        device.shell("input swipe 500 1000 500 100 300")
        time.sleep(0.3)
    device.shell("input keyevent 3") 
    print(" Recent apps cleared.")

def live_discover_package(device, app_hint):
    """Dynamically queries the live connected device to discover match package footprints on the fly."""
    hint = app_hint.lower().strip()
    
    if hint in ["insta", "ig"]: hint = "instagram"
    if hint in ["fb"]: hint = "facebook"
    if hint in ["wa"]: hint = "whatsapp"
    
    if hint in APP_PACKAGES:
        return APP_PACKAGES[hint]
        
    print(f" Scanning internal device architecture dynamically for footprint: '{hint}'...")
    raw_pm_output = device.shell(f"pm list packages | grep {hint}")
    if raw_pm_output and "package:" in raw_pm_output:
        lines = [line.replace("package:", "").strip() for line in raw_pm_output.split("\n") if line.strip()]
        if lines:
            found_package = lines[0]
            print(f" Dynamic Discovery Success! Found Package ID: {found_package}")
            return found_package
            
    return None

def launch_app_safely(device, app_name):
    """Resolves and forces initialization of any system package architecture layout."""
    clean_name = app_name.lower().strip()
    if clean_name in ["music", "default music"]:
        device.shell("am start -a android.intent.action.MAIN -c android.intent.category.APP_MUSIC")
        return
        
    package = live_discover_package(device, clean_name)
    if not package:
        print(f" '{app_name}' couldn't be discovered dynamically or found in dictionary.")
        return
        
    resolve_cmd = f"cmd package resolve-activity --brief {package}"
    output = device.shell(resolve_cmd).strip()
    if "No activity found" in output or not output or "Error" in output:
        device.shell(f"monkey -p {package} -c android.intent.category.LAUNCHER 1")
        return
    component = output.split('\n')[-1].strip()
    device.shell(f"am start -n {component}")
    print(f" Initialized application: {package}")

def close_app_safely(device, app_name):
    """Force terminates execution processes tied to any mapped package signature."""
    package = live_discover_package(device, app_name)
    if package:
        device.shell(f"am force-stop {package}")
        print(f" Closed down and killed process tree: {package}")
    else:
        print(f" System mapping signature for target '{app_name}' not discovered.")

def search_in_chrome(device, query):
    """Dynamically forces Chrome open straight into a Google search query layout via intent routing."""
    print(f" [CHROME PLATFORM] Compiling web query layout for target: '{query}'")
    encoded_query = urllib.parse.quote(query)
    search_url = f"https://www.google.com/search?q={encoded_query}"
    device.shell(f"am start -n com.android.chrome/com.google.android.apps.chrome.Main -d '{search_url}'")
    time.sleep(2.0)

def search_in_whatsapp(device, query):
    """Launches WhatsApp and drives automated navigation layout touches to interact with chats."""
    print(f" [WHATSAPP PLATFORM] Directing workflow interface targeting chat string: '{query}'")
    device.shell("am start -n com.whatsapp/com.whatsapp.HomeActivity")
    time.sleep(2.0)
    
    print(" Striking screen interaction vectors [WhatsApp Top Bar Search Focus Point]")
    device.shell("input tap 880 150")
    time.sleep(1.0)
    type_text(device, query)
    simulate_key(device, "enter")
    time.sleep(1.5)

def search_in_instagram(device, query):
    """Utilizes protocol scheme paths to dump directly into Instagram discovery and view matrices."""
    print(f" [INSTAGRAM PLATFORM] Processing deep link uri payload for chat/profile: '{query}'")
    encoded_query = urllib.parse.quote(query)
    deep_link = f"instagram://search?query={encoded_query}"
    device.shell(f"am start -a android.intent.action.VIEW -d '{deep_link}' com.instagram.android")
    time.sleep(2.5)
    
    device.shell("input tap 250 2200") 
    time.sleep(1.0)
    device.shell("input tap 500 140")  
    time.sleep(1.0)
    type_text(device, query)
    simulate_key(device, "enter")
    time.sleep(1.5)

def search_in_facebook(device, query):
    """Fires internal application intent graph maps straight into Facebook search node architectures."""
    print(f" [FACEBOOK PLATFORM] Triggering local index system queries for target: '{query}'")
    encoded_query = urllib.parse.quote(query)
    deep_link = f"fb://search/%7Bquery%3A%22{encoded_query}%22%7D"
    device.shell(f"am start -a android.intent.action.VIEW -d '{deep_link}' com.facebook.katana")
    time.sleep(2.5)
    
    device.shell("input tap 900 130") 
    time.sleep(1.0)
    type_text(device, query)
    simulate_key(device, "enter")
    time.sleep(1.5)

def execute_universal_cross_search(device, target_app_hint, search_query):
    """Coordinates search flow targeting precise specific channels or cascading down into all apps."""
    target = target_app_hint.lower().strip()
    
    if any(keyword in target for keyword in ["everywhere", "all", "everything", "anywhere", "each"]):
        print(f"\n BROADCASTING UNIVERSAL DEEP-SEARCH ENGINE MATRIX FOR: '{search_query}'")
        print("==========================================================================")
        
        search_in_instagram(device, search_query)
        print(" Shifting processing context windows [4s interval pause]...")
        time.sleep(4.0)
        
        search_in_whatsapp(device, search_query)
        print(" Shifting processing context windows [4s interval pause]...")
        time.sleep(4.0)
        
        search_in_facebook(device, search_query)
        print(" Shifting processing context windows [4s interval pause]...")
        time.sleep(4.0)
        
        search_in_chrome(device, search_query)
        print("\n Universal Cross-Platform Sequential Matrix Dispatching Run Completed.")
    
    elif "instagram" in target or "insta" in target or "ig" in target:
        search_in_instagram(device, search_query)
    elif "whatsapp" in target or "wa" in target:
        search_in_whatsapp(device, search_query)
    elif "facebook" in target or "fb" in target:
        search_in_facebook(device, search_query)
    elif "chrome" in target or "google" in target or "web" in target:
        search_in_chrome(device, search_query)
    else:
        print(f" Target platform ambiguous ({target_app_hint}). Launching Dynamic Device Discovery Strategy...")
        launch_app_safely(device, target)
        time.sleep(2.0)
        print(f" Injecting string parameters on discovered window element for: '{search_query}'")
        type_text(device, search_query)
        simulate_key(device, "enter")

def make_call(device, phone_number):
    """Initiates a phone call to the specified number using system dialer intent."""
    print(f" Initiating call to: {phone_number}")
    clean_number = re.sub(r'[^\d+]', '', phone_number)
    
    if not clean_number:
        print(" Invalid phone number format.")
        return
    
    device.shell(f"am start -a android.intent.action.CALL -d tel:{clean_number}")
    print(f" Call initiated to {clean_number}")
    time.sleep(2.0)

def call_contact(device, contact_name):
    """Searches for a contact in the dialer and initiates a call."""
    print(f" Searching for contact: {contact_name}")
    device.shell("am start -a android.intent.action.DIAL")
    time.sleep(2.0)
    
    device.shell("input tap 500 200")
    time.sleep(1.0)
    
    type_text(device, contact_name)
    time.sleep(1.5)
    
    simulate_key(device, "call")
    print(f" Attempting to call contact: {contact_name}")

def end_call(device):
    """Ends the current active call."""
    print(" Ending current call...")
    simulate_key(device, "endcall")
    time.sleep(1.0)

def answer_call(device):
    """Answers an incoming call."""
    print(" Answering incoming call...")
    simulate_key(device, "call")
    time.sleep(1.0)

def reject_call(device):
    """Rejects an incoming call."""
    print(" Rejecting incoming call...")
    simulate_key(device, "endcall")
    time.sleep(1.0)

def control_active_call(device, action):
    """Controls an active call (Speaker, Mute, Record, Hold) by finding the UI elements dynamically."""
    print(f" Call Control Action Requested: {action}")
    
    coords = None
    if action == "speaker":
        coords = find_ui_element_coords(device, search_text="speaker") or \
                 find_ui_element_coords(device, content_desc="speaker") or \
                 find_ui_element_coords(device, content_desc="speakerphone")
    elif action == "mute":
        coords = find_ui_element_coords(device, search_text="mute") or \
                 find_ui_element_coords(device, content_desc="mute")
        if not coords:
            device.shell("input keyevent 227")
    elif action == "record":
        coords = find_ui_element_coords(device, search_text="record") or \
                 find_ui_element_coords(device, content_desc="record")
    elif action == "hold":
        coords = find_ui_element_coords(device, search_text="hold") or \
                 find_ui_element_coords(device, content_desc="hold")
                 
    if coords:
        device.shell(f"input tap {coords[0]} {coords[1]}")
        print(f" Call action '{action}' executed via UI click at {coords}")
    else:
        fallbacks = {
            "speaker": (800, 500),
            "mute": (200, 500),
            "record": (500, 800),
            "hold": (800, 800)
        }
        fallback_coords = fallbacks.get(action)
        if fallback_coords:
            device.shell(f"input tap {fallback_coords[0]} {fallback_coords[1]}")
            print(f" Call action '{action}' executed via fallback tap at {fallback_coords}")

def make_whatsapp_call(device, phone_number, call_type="voice"):
    """Makes a WhatsApp voice or video call."""
    clean_number = re.sub(r'[^\d+]', '', phone_number)
    print(f" Initiating WhatsApp {call_type} call to {clean_number}")
    device.shell(f"am start -a android.intent.action.VIEW -d 'whatsapp://send?phone={clean_number}'")
    time.sleep(2.0)
    if call_type == "video":
        device.shell("input tap 750 150")
    else:
        device.shell("input tap 900 150")

def play_music_and_call(device, phone_number, music_app="spotify", search_query=None):
    """Opens music app, starts playback, then initiates a call simultaneously."""
    print(f" Starting simultaneous music playback and call sequence...")
    
    print(f" Launching {music_app}...")
    launch_app_safely(device, music_app)
    time.sleep(3.0)
    
    if search_query:
        print(f" Searching for: {search_query}")
        device.shell("input tap 500 150")
        time.sleep(1.0)
        type_text(device, search_query)
        simulate_key(device, "enter")
        time.sleep(2.0)
    
    control_media(device, "play")
    time.sleep(1.0)
    
    simulate_key(device, "home")
    time.sleep(1.0)
    
    print(f" Initiating call while music plays...")
    make_call(device, phone_number)
    
    print(" Music playing in background while call is active!")

def play_music_on_loop(device, music_app="spotify", search_query=None):
    """Opens music app and plays music on continuous loop."""
    print(f" Starting continuous music playback on {music_app}...")
    
    launch_app_safely(device, music_app)
    time.sleep(3.0)
    
    if search_query:
        print(f" Searching for: {search_query}")
        device.shell("input tap 500 150")
        time.sleep(1.0)
        type_text(device, search_query)
        simulate_key(device, "enter")
        time.sleep(2.0)
    
    control_media(device, "play")
    print(" Music started. Will continue playing in background.")

def play_specific_song(device, song_name, music_app="spotify"):
    """Searches and plays a specific song in the music app."""
    print(f" Playing specific song: {song_name}")
    
    launch_app_safely(device, music_app)
    time.sleep(3.0)
    
    device.shell("input tap 500 150")
    time.sleep(1.0)
    
    type_text(device, song_name)
    simulate_key(device, "enter")
    time.sleep(2.0)
    
    device.shell("input tap 500 500")
    time.sleep(1.0)
    
    control_media(device, "play")
    print(f" Now playing: {song_name}")

def create_playlist_and_play(device, playlist_name, songs, music_app="spotify"):
    """Creates a playlist concept and plays multiple songs."""
    print(f" Creating playlist: {playlist_name}")
    
    launch_app_safely(device, music_app)
    time.sleep(3.0)
    
    for i, song in enumerate(songs):
        print(f" Adding song {i+1}/{len(songs)}: {song}")
        
        device.shell("input tap 500 150")
        time.sleep(1.0)
        type_text(device, song)
        simulate_key(device, "enter")
        time.sleep(2.0)
        
        device.shell("input tap 500 500")
        time.sleep(1.0)
        control_media(device, "play")
        time.sleep(3.0)
        
        device.shell("input tap 900 1800")
        time.sleep(1.0)
        device.shell("input tap 500 1000")
        time.sleep(1.0)
        
        simulate_key(device, "back")
        time.sleep(1.0)
    
    print(f" Playlist '{playlist_name}' created and playing!")

def send_sms(device, phone_number, message):
    """Sends an SMS message to the specified number."""
    print(f" Sending SMS to {phone_number}: {message}")
    clean_number = re.sub(r'[^\d+]', '', phone_number)
    if not clean_number:
        print(" Invalid phone number format.")
        return
    
    device.shell(f"am start -a android.intent.action.SENDTO -d sms:{clean_number} --es android.intent.extra.TEXT '{message}'")
    time.sleep(2.0)
    device.shell("input keyevent 22")
    device.shell("input keyevent 66")
    device.shell("input tap 950 1450") 
    print(" SMS composed and sent.")

def send_whatsapp_message(device, phone_number, message):
    """Sends a WhatsApp message to the specified number."""
    print(f" Sending WhatsApp to {phone_number}: {message}")
    clean_number = re.sub(r'[^\d+]', '', phone_number)
    if not clean_number:
        print(" Invalid phone number format.")
        return
    
    device.shell(f"am start -a android.intent.action.SENDTO -d 'whatsapp://send?phone={clean_number}' --es android.intent.extra.TEXT '{message}'")
    time.sleep(2.0)
    device.shell("input keyevent 22")
    device.shell("input keyevent 66")
    device.shell("input tap 950 1450") 
    print(" WhatsApp message composed and sent.")

def read_last_sms(device):
    """Reads the last received SMS message."""
    print(" Reading last SMS...")
    result = device.shell(r"content query --uri content://sms/inbox --projection address:body:date --sort date\ DESC --limit 1")
    print(" Last SMS:")
    print(result)

def search_sms(device, keyword):
    """Searches SMS messages for a keyword."""
    print(f" Searching SMS for: {keyword}")
    result = device.shell(f"content query --uri content://sms/inbox --projection address:body:date --where \"body LIKE '%{keyword}%'\"")
    print(f" SMS search results for '{keyword}':")
    print(result)

def send_email(device, recipient, subject, body):
    """Composes an email with the specified details."""
    print(f" Composing email to {recipient}")
    device.shell(f"am start -a android.intent.action.SENDTO -d 'mailto:{recipient}' --es android.intent.extra_SUBJECT '{subject}' --es android.intent.extra_TEXT '{body}'")
    time.sleep(2.0)
    device.shell("input tap 900 150")
    print(" Email composed and sent.")

def list_files(device, path="/sdcard"):
    """Lists files in the specified directory."""
    print(f" Listing files in: {path}")
    result = device.shell(f"ls -la {path}")
    print(result)

def copy_file(device, source, destination):
    """Copies a file from source to destination."""
    print(f" Copying {source} to {destination}")
    device.shell(f"cp {source} {destination}")
    print(" File copied successfully.")

def move_file(device, source, destination):
    """Moves a file from source to destination."""
    print(f" Moving {source} to {destination}")
    device.shell(f"mv {source} {destination}")
    print(" File moved successfully.")

def delete_file(device, filepath):
    """Deletes the specified file."""
    print(f" Deleting: {filepath}")
    device.shell(f"rm {filepath}")
    print(" File deleted.")

def create_directory(device, path):
    """Creates a new directory."""
    print(f" Creating directory: {path}")
    device.shell(f"mkdir -p {path}")
    print(" Directory created.")

def pull_file(device, remote_path, local_path):
    """Pulls a file from device to local computer."""
    print(f" Pulling {remote_path} to {local_path}")
    device.pull(remote_path, local_path)
    print(" File pulled successfully.")

def push_file(device, local_path, remote_path):
    """Pushes a file from local computer to device."""
    print(f" Pushing {local_path} to {remote_path}")
    device.push(local_path, remote_path)
    print(" File pushed successfully.")

def get_file_info(device, filepath):
    """Gets detailed information about a file."""
    print(f" Getting info for: {filepath}")
    result = device.shell(f"stat {filepath}")
    print(result)

def toggle_wifi(device, action):
    """Toggles WiFi on/off."""
    print(f" WiFi: {action}")
    if action.lower() in ["on", "enable", "start"]:
        device.shell("svc wifi enable")
        print(" WiFi enabled.")
    elif action.lower() in ["off", "disable", "stop"]:
        device.shell("svc wifi disable")
        print(" WiFi disabled.")

def toggle_bluetooth(device, action):
    """Toggles Bluetooth on/off using cmd bluetooth_manager."""
    print(f" Bluetooth: {action}")
    if action.lower() in ["on", "enable", "start"]:
        device.shell("cmd bluetooth_manager enable")
        device.shell("service call bluetooth_manager 6")
        print(" Bluetooth enabled.")
    elif action.lower() in ["off", "disable", "stop"]:
        device.shell("cmd bluetooth_manager disable")
        device.shell("service call bluetooth_manager 8")
        print(" Bluetooth disabled.")

def toggle_airplane_mode(device, action):
    """Toggles airplane mode on/off."""
    print(f" Airplane mode: {action}")
    if action.lower() in ["on", "enable"]:
        device.shell("settings put global airplane_mode_on 1")
        device.shell("am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true")
        print(" Airplane mode enabled.")
    elif action.lower() in ["off", "disable"]:
        device.shell("settings put global airplane_mode_on 0")
        device.shell("am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false")
        print(" Airplane mode disabled.")

def set_brightness(device, level):
    """Sets screen brightness (0-255)."""
    print(f" Setting brightness to: {level}")
    device.shell(f"settings put system screen_brightness {level}")
    device.shell("settings put system screen_brightness_mode 0")  
    print(f" Brightness set to {level}.")

def set_volume(device, stream, level):
    """Sets volume level (0-15) for specific stream using media volume."""
    streams = {
        "music": 3,
        "ring": 2,
        "alarm": 4,
        "notification": 5,
        "system": 1,
        "voice_call": 0
    }
    stream_code = streams.get(stream.lower(), 3)
    print(f" Setting {stream} volume to: {level}")
    device.shell(f"media volume --stream {stream_code} --set {level}")
    print(f" {stream} volume set to {level}.")

def toggle_do_not_disturb(device, action):
    """Toggles Do Not Disturb mode."""
    print(f" Do Not Disturb: {action}")
    if action.lower() in ["on", "enable"]:
        device.shell("settings put global zen_mode 1")
        print(" Do Not Disturb enabled.")
    elif action.lower() in ["off", "disable"]:
        device.shell("settings put global zen_mode 0")
        print(" Do Not Disturb disabled.")

def set_mobile_data(device, action):
    """Toggles mobile data on/off."""
    print(f" Mobile data: {action}")
    if action.lower() in ["on", "enable"]:
        device.shell("svc data enable")
        print(" Mobile data enabled.")
    elif action.lower() in ["off", "disable"]:
        device.shell("svc data disable")
        print(" Mobile data disabled.")

def find_ui_element_coords(device, search_text=None, resource_id=None, content_desc=None):
    """Dumps screen UI XML, searches for a node matching criteria, and returns (x, y) center coordinates."""
    device.shell("uiautomator dump /data/local/tmp/uidump.xml")
    temp_xml = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uidump.xml")
    try:
        device.pull("/data/local/tmp/uidump.xml", temp_xml)
        device.shell("rm /data/local/tmp/uidump.xml")
    except Exception as e:
        print(f"Error pulling UI dump: {e}")
        return None

    if not os.path.exists(temp_xml):
        return None

    try:
        tree = ET.parse(temp_xml)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing UI XML: {e}")
        if os.path.exists(temp_xml):
            os.remove(temp_xml)
        return None

    target_node = None
    for node in root.iter('node'):
        text = node.get('text', '')
        r_id = node.get('resource-id', '')
        desc = node.get('content-desc', '')

        match = False
        if search_text and search_text.lower() in text.lower():
            match = True
        if resource_id and resource_id in r_id:
            match = True
        if content_desc and content_desc.lower() in desc.lower():
            match = True

        if match:
            target_node = node
            break

    if os.path.exists(temp_xml):
        os.remove(temp_xml)

    if target_node is not None:
        bounds = target_node.get('bounds', '')
        m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', bounds)
        if m:
            left, top, right, bottom = map(int, m.groups())
            cx = (left + right) // 2
            cy = (top + bottom) // 2
            return cx, cy

    return None

def toggle_flashlight(device, action):
    """Toggles flashlight on/off dynamically via Settings or UI automation."""
    print(f" Flashlight: {action}")
    
    val = "1" if action.lower() in ["on", "enable"] else "0"
    device.shell(f"settings put system flashlight_enabled {val}")
    
    device.shell("cmd statusbar expand-settings")
    time.sleep(0.8)
    
    coords = find_ui_element_coords(device, search_text="flashlight") or find_ui_element_coords(device, search_text="torch")
    if coords:
        device.shell(f"input tap {coords[0]} {coords[1]}")
        print(f" Flashlight toggled via UI click at {coords}.")
    else:
        device.shell("input tap 500 400")
        print(" Flashlight toggled via fallback coordinate tap.")
        
    time.sleep(0.3)
    device.shell("cmd statusbar collapse")

def list_notifications(device):
    """Lists all current notifications."""
    print(" Listing notifications...")
    result = device.shell("dumpsys notification")
    print(result)

def clear_notifications(device):
    """Clears all notifications."""
    print(" Clearing all notifications...")
    device.shell("service call notification 1")
    print(" Notifications cleared.")

def dismiss_notification(device, package):
    """Dismisses notifications from a specific app."""
    print(f" Dismissing notifications from: {package}")
    device.shell(f"dumpsys notification | grep {package}")
    print(f" Notifications from {package} identified.")

def take_photo(device, camera="back"):
    """Takes a photo using the specified camera."""
    print(f" Taking photo with {camera} camera...")
    launch_app_safely(device, "camera")
    time.sleep(3.0)
    
    device.shell("input tap 500 1000")
    time.sleep(0.5)
    device.shell("input keyevent 27")  
    time.sleep(1.0)
    print(" Photo captured.")

def start_video_recording(device):
    """Starts video recording."""
    print(" Starting video recording...")
    launch_app_safely(device, "camera")
    time.sleep(3.0)
    
    device.shell("input tap 900 1800")
    time.sleep(1.0)
    
    device.shell("input tap 500 1500")
    time.sleep(1.0)
    print(" Video recording started.")

def stop_video_recording(device):
    """Stops video recording."""
    print(" Stopping video recording...")
    device.shell("input tap 500 1500")  
    time.sleep(1.0)
    print(" Video recording stopped.")

def toggle_camera_flash(device, mode):
    """Toggles camera flash mode."""
    print(f" Camera flash: {mode}")
    launch_app_safely(device, "camera")
    time.sleep(3.0)
    
    device.shell("input tap 100 500")
    time.sleep(0.5)
    print(f" Flash set to {mode}.")

def long_press(device, x, y, duration=2000):
    """Performs a long press at specified coordinates."""
    print(f" Long pressing at X={x}, Y={y} for {duration}ms")
    device.shell(f"input swipe {x} {y} {x} {y} {duration}")
    print(" Long press completed.")

def double_tap(device, x, y):
    """Performs a double tap at specified coordinates."""
    print(f" Double tapping at X={x}, Y={y}")
    device.shell(f"input tap {x} {y}")
    time.sleep(0.1)
    device.shell(f"input tap {x} {y}")
    print(" Double tap completed.")

def pinch_zoom(device, direction="in"):
    """Performs pinch zoom gesture."""
    print(f" Pinch zoom: {direction}")
    if direction == "in":
        device.shell("input multitouch 0 500 800 500 800")
        device.shell("input multitouch 1 300 600 700 1000")
        device.shell("input multitouch sync")
        device.shell("input multitouch end")
    else:
        device.shell("input multitouch 0 300 600 300 600")
        device.shell("input multitouch 1 700 1000 700 1000")
        device.shell("input multitouch sync")
        device.shell("input multitouch end")
    print(f" Pinch zoom {direction} completed.")

def scroll_to_element(device, x, y, direction="down", duration=500):
    """Scrolls in a specific direction to find an element."""
    print(f" Scrolling {direction} at X={x}, Y={y}")
    if direction == "down":
        device.shell(f"input swipe {x} {y} {x} {y-500} {duration}")
    elif direction == "up":
        device.shell(f"input swipe {x} {y} {x} {y+500} {duration}")
    print(" Scroll completed.")

def send_whatsapp_quick_message(device, contact, message):
    """Quickly sends a WhatsApp message to a contact."""
    print(f" Quick WhatsApp to {contact}: {message}")
    device.shell("am start -n com.whatsapp/com.whatsapp.HomeActivity")
    time.sleep(2.0)
    
    device.shell("input tap 880 150")
    time.sleep(1.0)
    type_text(device, contact)
    simulate_key(device, "enter")
    time.sleep(1.5)
    
    type_text(device, message)
    simulate_key(device, "enter")
    print(" WhatsApp message sent.")

def create_calendar_event(device, title, date, time):
    """Creates a calendar event."""
    import time as time_module
    print(f" Creating calendar event: {title}")
    device.shell("am start -a android.intent.action.INSERT --begin_time 0 --end_time 0 -t 'vnd.android.cursor.dir/event' -e title 'Meeting' -e description 'Important meeting'")
    time_module.sleep(2.0)
    print(" Calendar event created.")

def open_google_maps_navigation(device, destination):
    """Opens Google Maps with navigation to destination."""
    print(f" Navigating to: {destination}")
    encoded_dest = urllib.parse.quote(destination)
    device.shell(f"am start -a android.intent.action.VIEW -d 'google.navigation://q={encoded_dest}'")
    time.sleep(2.0)
    print(" Navigation started.")

def set_alarm(device, time_str):
    """Sets an alarm for the specified time."""
    print(f" Setting alarm for: {time_str}")
    device.shell("am start -a android.intent.action.SET_ALARM")
    time.sleep(2.0)
    
    device.shell("input tap 500 800")
    time.sleep(0.5)
    type_text(device, time_str)
    simulate_key(device, "enter")
    print(" Alarm set.")

def set_timer(device, duration):
    """Sets a timer for the specified duration."""
    print(f" Setting timer for: {duration}")
    device.shell("am start -a android.intent.action.SET_TIMER")
    time.sleep(2.0)
    
    device.shell("input tap 500 800")
    time.sleep(0.5)
    type_text(device, duration)
    simulate_key(device, "enter")
    print(" Timer set.")

def get_device_info(device):
    """Gets device information."""
    print(" --- DEVICE INFORMATION ---")
    
    model = device.shell("getprop ro.product.model")
    manufacturer = device.shell("getprop ro.product.manufacturer")
    android_version = device.shell("getprop ro.build.version.release")
    
    print(f" Model: {model.strip()}")
    print(f" Manufacturer: {manufacturer.strip()}")
    print(f" Android Version: {android_version.strip()}")
    
    screen_density = device.shell("wm density")
    screen_size = device.shell("wm size")
    print(f" Screen: {screen_size.strip()}")
    print(f" Density: {screen_density.strip()}")

def get_storage_info(device):
    """Gets storage information."""
    print(" --- STORAGE INFORMATION ---")
    result = device.shell("df -h")
    print(result)

def get_memory_info(device):
    """Gets memory usage information."""
    print(" --- MEMORY INFORMATION ---")
    result = device.shell("dumpsys meminfo")
    print(result)

def get_network_info(device):
    """Gets network information."""
    print(" --- NETWORK INFORMATION ---")
    
    wifi_status = device.shell("dumpsys wifi | grep Wi-Fi")
    print(f" WiFi: {wifi_status}")
    
    ip_address = device.shell("ip addr show")
    print(f" IP Address: {ip_address}")

def get_installed_apps(device):
    """Lists all installed applications."""
    print(" --- INSTALLED APPLICATIONS ---")
    result = device.shell("pm list packages")
    apps = [line.replace("package:", "").strip() for line in result.split("\n") if line.strip()]
    print(f"Total installed apps: {len(apps)}")
    for app in apps[:50]:  
        print(f"  - {app}")
    if len(apps) > 50:
        print(f"  ... and {len(apps) - 50} more")

def get_running_processes(device):
    """Gets list of running processes."""
    print(" --- RUNNING PROCESSES ---")
    result = device.shell("ps")
    print(result)

def get_cpu_info(device):
    """Gets CPU information."""
    print(" --- CPU INFORMATION ---")
    result = device.shell("cat /proc/cpuinfo")
    print(result)

def get_temperature_info(device):
    """Gets device temperature information."""
    print(" --- TEMPERATURE INFORMATION ---")
    result = device.shell("dumpsys battery | grep temperature")
    print(result)

def copy_to_clipboard(device, text):
    """Copies text to device clipboard."""
    print(f" Copying to clipboard: {text}")
    device.shell(f"service call clipboard 3 i32 1 s16 '{text}'")
    print(" Text copied to clipboard.")

def paste_from_clipboard(device):
    """Pastes from clipboard."""
    print(" Pasting from clipboard...")
    device.shell("service call clipboard 2 i32 1")
    print(" Clipboard content pasted.")

def clear_clipboard(device):
    """Clears the clipboard."""
    print(" Clearing clipboard...")
    device.shell("service call clipboard 3 i32 1 s16 ''")
    print(" Clipboard cleared.")

def launch_google_assistant(device):
    """Launches Google Assistant."""
    print(" Launching Google Assistant...")
    device.shell("am start -a android.intent.action.ASSIST")
    time.sleep(2.0)
    print(" Google Assistant launched.")

def voice_command(device, command):
    """Sends a voice command to Google Assistant."""
    print(f" Voice command: {command}")
    launch_google_assistant(device)
    time.sleep(2.0)
    
    type_text(device, command)
    simulate_key(device, "enter")
    print(" Voice command sent.")

def launch_siri_alternative(device):
    """Launches alternative voice assistant (Bixby, etc.)."""
    print(" Launching voice assistant...")
    device.shell("am start -a android.intent.action.VOICE_COMMAND")
    time.sleep(2.0)
    print(" Voice assistant launched.")

def create_macro(device, name, commands):
    """Creates a macro with multiple commands."""
    print(f" Creating macro: {name}")
    macros[name] = commands
    print(f" Macro '{name}' created with {len(commands)} commands.")

def run_macro(device, name):
    """Executes a saved macro."""
    print(f" Running macro: {name}")
    if name in macros:
        for cmd in macros[name]:
            process_dynamic_natural_command(device, cmd)
            time.sleep(1.0)
        print(f" Macro '{name}' completed.")
    else:
        print(f" Macro '{name}' not found.")

def schedule_task(device, command, delay_seconds):
    """Schedules a command to run after a delay."""
    print(f" Scheduling task in {delay_seconds} seconds: {command}")
    time.sleep(delay_seconds)
    process_dynamic_natural_command(device, command)
    print(" Scheduled task completed.")

def repeat_action(device, command, times, interval=1.0):
    """Repeats an action multiple times."""
    print(f" Repeating action {times} times: {command}")
    for i in range(times):
        print(f"Iteration {i+1}/{times}")
        process_dynamic_natural_command(device, command)
        time.sleep(interval)
    print(f" Action repeated {times} times.")

macros = {}

def preprocess_natural_command(text_input):
    """Preprocess conversational natural language commands by stripping filler words and punctuation."""
    cmd = text_input.strip().lower()
    
    for type_prefix in ["type ", "write ", "enter "]:
        if cmd.startswith(type_prefix):
            content = text_input[len(type_prefix):].strip()
            content = re.sub(r'[?.!,;:]+$', '', content)
            return type_prefix + content
            
    cmd = re.sub(r'[?.!,;:]+$', '', cmd)
    
    fillers = [
        "could you please", "would you please", "would you mind", "can you please",
        "please can you", "could you", "would you", "please try to", "go ahead and",
        "i want you to", "i need to", "can you", "please", "kindly", "hey phone",
        "ok phone", "okay phone", "phone", "hey assistant", "ok assistant",
        "assistant", "now", "immediately", "quickly", "please do", "just"
    ]
    
    for filler in fillers:
        pattern = r'\b' + re.escape(filler) + r'\b'
        cmd = re.sub(pattern, '', cmd)
    
    cmd = re.sub(r'\s+', ' ', cmd).strip()
    return cmd


def process_dynamic_natural_command(device, text_input):
    """Deconstructs unformatted sentences using regular expressions and strings to execute automations."""
    cmd = preprocess_natural_command(text_input)
    if not cmd:
        return

    print(f" Parsing Conversational Core Context Matrix for: '{cmd}' (raw: '{text_input}')")

    call_match = re.search(r'(?:call|dial)\s+(.+)', cmd)
    if call_match and "music" not in cmd:
        target = call_match.group(1).strip()
        if re.search(r'\d', target):
            make_call(device, target)
        else:
            call_contact(device, target)
        return

    if "answer" in cmd and "call" in cmd or "pick up" in cmd:
        answer_call(device)
        return

    if "reject" in cmd or "decline" in cmd or ("hang up" in cmd or "end call" in cmd):
        end_call(device)
        return

    music_call_match = re.search(r'(?:play\s+music\s+and\s+call|call\s+.+?\s+while\s+playing)\s+(.+)', cmd)
    if music_call_match:
        target = music_call_match.group(1).strip()
        phone_match = re.search(r'[\d+]+', target)
        if phone_match:
            phone_number = phone_match.group(0)
            if "spotify" in cmd:
                music_app = "spotify"
            elif "youtube music" in cmd or "yt music" in cmd:
                music_app = "youtube music"
            else:
                music_app = "spotify"
            
            search_match = re.search(r'(?:search|play)\s+(.+?)(?:\s+and|\s+while|$)', cmd)
            search_query = search_match.group(1).strip() if search_match else None
            
            play_music_and_call(device, phone_number, music_app, search_query)
        return

    play_song_match = re.search(r'play\s+(?:song\s+)?(.+)', cmd)
    if play_song_match and "call" not in cmd:
        song_name = play_song_match.group(1).strip()
        if not any(word in song_name.lower() for word in ["call", "dial", "phone"]):
            play_specific_song(device, song_name)
            return

    playlist_match = re.search(r'create\s+playlist\s+(\w+)(?:\s+with\s+(.+))?', cmd)
    if playlist_match:
        playlist_name = playlist_match.group(1).strip()
        songs_str = playlist_match.group(2).strip() if playlist_match.group(2) else ""
        if songs_str:
            songs = [s.strip() for s in songs_str.split(",")]
            create_playlist_and_play(device, playlist_name, songs)
        return

    match_pattern_1 = re.search(r'(?:open\s+)?([a-z0-9\s_]+)\s+(?:and\s+)?search\s+(?:for\s+)?(.+)', cmd)
    match_pattern_2 = re.search(r'search\s+(?:for\s+)?(.+?)\s+in\s+([a-z0-9\s_]+)', cmd)
    match_pattern_universal = re.search(r'search\s+(?:for\s+)?(.+?)\s+(?:everywhere|on\s+all\s+apps|across\s+everything|anywhere)', cmd)

    if match_pattern_universal:
        extracted_query = match_pattern_universal.group(1).strip()
        execute_universal_cross_search(device, "everywhere", extracted_query)
        return

    if match_pattern_2:
        extracted_query = match_pattern_2.group(1).strip()
        extracted_app = match_pattern_2.group(2).strip()
        execute_universal_cross_search(device, extracted_app, extracted_query)
        return

    if match_pattern_1:
        extracted_app = match_pattern_1.group(1).strip()
        extracted_query = match_pattern_1.group(2).strip()
        
        if extracted_query.startswith("for "): extracted_query = extracted_query[4:]
        
        if "everywhere" in extracted_query or "all" in extracted_app or "everything" in extracted_query:
            clean_query = extracted_query.replace("everywhere", "").replace("across everything", "").strip()
            execute_universal_cross_search(device, "everywhere", clean_query)
        else:
            execute_universal_cross_search(device, extracted_app, extracted_query)
        return

    coord_tap_match = re.search(r'(?:tap|click|touch)(?:\s+at)?\s+(\d+)[,\s]+(\d+)', cmd)
    if coord_tap_match:
        x = coord_tap_match.group(1)
        y = coord_tap_match.group(2)
        tap_coordinates(device, x, y)
        return

    swipe_custom_match = re.search(r'swipe\s+(?:from\s+)?(\d+)[\s,]+(\d+)[\s,]+(?:to\s+)?(\d+)[\s,]+(\d+)', cmd)
    if swipe_custom_match:
        x1, y1, x2, y2 = swipe_custom_match.groups()
        swipe_gesture(device, "custom", exact_coords=f"{x1} {y1} {x2} {y2} 400")
        return

    if any(cmd.startswith(p) for p in ["close ", "kill ", "stop ", "terminate "]):
        for prefix in ["close up ", "close ", "kill ", "stop ", "terminate "]:
            if cmd.startswith(prefix):
                target_app = cmd[len(prefix):].strip()
                close_app_safely(device, target_app)
                return

    if any(cmd.startswith(p) for p in ["open ", "launch ", "start ", "go to "]):
        for prefix in ["open up ", "open ", "launch ", "start ", "go to "]:
            if cmd.startswith(prefix):
                target_app = cmd[len(prefix):].strip()
                launch_app_safely(device, target_app)
                return

    if cmd.startswith("type ") or cmd.startswith("write ") or cmd.startswith("enter "):
        parts = cmd.split(None, 1)
        if len(parts) > 1:
            type_text(device, parts[1])
            return

    if "turn off" in cmd or "lock screen" in cmd or "sleep phone" in cmd or "suspend" in cmd:
        toggle_screen(device, "off")
        return
    if "turn on" in cmd or "wake" in cmd or "screen on" in cmd:
        toggle_screen(device, "on")
        return

    if "unlock" in cmd or "bypass lock" in cmd:
        pin_match = re.search(r'\b\d{4,6}\b', cmd)
        extracted_pin = pin_match.group(0) if pin_match else None
        unlock_with_pin(device, pin_code=extracted_pin)
        return

    if "home" in cmd: simulate_key(device, "home"); return
    if "back" in cmd: simulate_key(device, "back"); return
    if "menu" in cmd: simulate_key(device, "menu"); return
    if "search" in cmd: simulate_key(device, "search"); return
    if "volume up" in cmd or "vol up" in cmd or "louder" in cmd: simulate_key(device, "volume_up"); return
    if "volume down" in cmd or "vol down" in cmd or "quieter" in cmd: simulate_key(device, "volume_down"); return
    if "mute" in cmd or "silence" in cmd: simulate_key(device, "mute"); return

    if "swipe" in cmd or "scroll" in cmd or "slide" in cmd:
        for direction in ["up", "down", "left", "right"]:
            if direction in cmd:
                swipe_gesture(device, direction)
                return

    if "media" in cmd or "music" in cmd or "song" in cmd or "video" in cmd:
        for action in ["play", "pause", "next", "skip", "previous", "prev", "stop", "rewind"]:
            if action in cmd:
                control_media(device, action)
                return

    sms_match = re.search(r'(?:send\s+(?:sms|text|message)\s+(?:to\s+)?)?(\d+|\w+)\s+(.+)', cmd)
    if sms_match and "whatsapp" not in cmd:
        recipient = sms_match.group(1).strip()
        message = sms_match.group(2).strip()
        if re.search(r'\d', recipient):
            send_sms(device, recipient, message)
        return
    
    whatsapp_match = re.search(r'(?:send\s+)?whatsapp\s+(?:to\s+)?(\d+|\w+)\s+(.+)', cmd)
    if whatsapp_match:
        recipient = whatsapp_match.group(1).strip()
        message = whatsapp_match.group(2).strip()
        send_whatsapp_message(device, recipient, message)
        return
    
    if "read last sms" in cmd or "show messages" in cmd or "check sms" in cmd:
        read_last_sms(device)
        return
    
    search_sms_match = re.search(r'(?:search|find)\s+(?:sms|messages?)\s+(?:for\s+)?(.+)', cmd)
    if search_sms_match:
        keyword = search_sms_match.group(1).strip()
        search_sms(device, keyword)
        return
    
    email_match = re.search(r'send\s+email\s+(?:to\s+)?(\S+)\s+(?:subject\s+)?(\S+)\s+(?:body\s+)?(.+)', cmd)
    if email_match:
        recipient = email_match.group(1).strip()
        subject = email_match.group(2).strip()
        body = email_match.group(3).strip()
        send_email(device, recipient, subject, body)
        return

    list_files_match = re.search(r'(?:list|show)\s+(?:files?\s+(?:in\s+)?)?(.+)?', cmd)
    if list_files_match:
        path = list_files_match.group(1).strip() if list_files_match.group(1) else "/sdcard"
        list_files(device, path)
        return
    
    copy_match = re.search(r'copy\s+(?:file\s+)?from\s+(.+)\s+to\s+(.+)', cmd)
    if copy_match:
        source = copy_match.group(1).strip()
        destination = copy_match.group(2).strip()
        copy_file(device, source, destination)
        return
    
    move_match = re.search(r'move\s+(?:file\s+)?from\s+(.+)\s+to\s+(.+)', cmd)
    if move_match:
        source = move_match.group(1).strip()
        destination = move_match.group(2).strip()
        move_file(device, source, destination)
        return
    
    delete_match = re.search(r'(?:delete|remove)\s+(?:file\s+)?(.+)', cmd)
    if delete_match:
        filepath = delete_match.group(1).strip()
        delete_file(device, filepath)
        return
    
    mkdir_match = re.search(r'(?:create\s+)?(?:directory|folder|mkdir)\s+(.+)', cmd)
    if mkdir_match:
        path = mkdir_match.group(1).strip()
        create_directory(device, path)
        return
    
    pull_match = re.search(r'pull\s+(?:file\s+)?from\s+(.+)\s+(?:to\s+)?(.+)', cmd)
    if pull_match:
        remote_path = pull_match.group(1).strip()
        local_path = pull_match.group(2).strip()
        pull_file(device, remote_path, local_path)
        return
    
    push_match = re.search(r'push\s+(?:file\s+)?(.+)\s+(?:to\s+)?(.+)', cmd)
    if push_match:
        local_path = push_match.group(1).strip()
        remote_path = push_match.group(2).strip()
        push_file(device, local_path, remote_path)
        return

    wifi_match = re.search(r'(?:turn\s+)?(?:wifi|wi-fi)\s+(on|off|enable|disable)', cmd)
    if wifi_match:
        action = wifi_match.group(1).strip()
        toggle_wifi(device, action)
        return
    
    bt_match = re.search(r'(?:turn\s+)?bluetooth\s+(on|off|enable|disable)', cmd)
    if bt_match:
        action = bt_match.group(1).strip()
        toggle_bluetooth(device, action)
        return
    
    airplane_match = re.search(r'(?:turn\s+)?(?:airplane\s+mode)\s+(on|off|enable|disable)', cmd)
    if airplane_match:
        action = airplane_match.group(1).strip()
        toggle_airplane_mode(device, action)
        return
    
    brightness_match = re.search(r'(?:set\s+)?brightness\s+(?:to\s+)?(\d+)', cmd)
    if brightness_match:
        level = brightness_match.group(1).strip()
        set_brightness(device, level)
        return
    
    volume_match = re.search(r'(?:set\s+)?(?:music|ring|alarm|notification|system|voice)\s+volume\s+(?:to\s+)?(\d+)', cmd)
    if volume_match:
        level = volume_match.group(1).strip()
        stream = "music"  
        if "ring" in cmd: stream = "ring"
        elif "alarm" in cmd: stream = "alarm"
        elif "notification" in cmd: stream = "notification"
        elif "system" in cmd: stream = "system"
        elif "voice" in cmd: stream = "voice_call"
        set_volume(device, stream, level)
        return
    
    dnd_match = re.search(r'(?:turn\s+)?(?:do\s+not\s+disturb|dnd)\s+(on|off|enable|disable)', cmd)
    if dnd_match:
        action = dnd_match.group(1).strip()
        toggle_do_not_disturb(device, action)
        return
    
    data_match = re.search(r'(?:turn\s+)?(?:mobile\s+)?data\s+(on|off|enable|disable)', cmd)
    if data_match:
        action = data_match.group(1).strip()
        set_mobile_data(device, action)
        return
    
    flashlight_match = re.search(r'(?:turn\s+)?flashlight\s+(on|off|enable|disable)', cmd)
    if flashlight_match:
        action = flashlight_match.group(1).strip()
        toggle_flashlight(device, action)
        return

    if "list notifications" in cmd or "show notifications" in cmd:
        list_notifications(device)
        return
    
    if "clear notifications" in cmd or "dismiss all" in cmd:
        clear_notifications(device)
        return
    
    dismiss_match = re.search(r'dismiss\s+notifications?\s+from\s+(.+)', cmd)
    if dismiss_match:
        package = dismiss_match.group(1).strip()
        dismiss_notification(device, package)
        return

    if "take photo" in cmd or "capture photo" in cmd or "take picture" in cmd:
        camera = "front" if "front" in cmd else "back"
        take_photo(device, camera)
        return
    
    if "start video" in cmd or "record video" in cmd:
        start_video_recording(device)
        return
    
    if "stop video" in cmd or "stop recording" in cmd:
        stop_video_recording(device)
        return
    
    flash_match = re.search(r'(?:camera\s+)?flash\s+(on|off|auto)', cmd)
    if flash_match:
        mode = flash_match.group(1).strip()
        toggle_camera_flash(device, mode)
        return

    long_press_match = re.search(r'long\s+press\s+(?:at\s+)?(\d+)\s+(\d+)', cmd)
    if long_press_match:
        x = long_press_match.group(1).strip()
        y = long_press_match.group(2).strip()
        long_press(device, x, y)
        return
    
    double_tap_match = re.search(r'double\s+tap\s+(?:at\s+)?(\d+)\s+(\d+)', cmd)
    if double_tap_match:
        x = double_tap_match.group(1).strip()
        y = double_tap_match.group(2).strip()
        double_tap(device, x, y)
        return
    
    if "pinch in" in cmd or "zoom out" in cmd:
        pinch_zoom(device, "in")
        return
    if "pinch out" in cmd or "zoom in" in cmd:
        pinch_zoom(device, "out")
        return
    
    scroll_match = re.search(r'scroll\s+(up|down)\s+(?:at\s+)?(\d+)\s+(\d+)', cmd)
    if scroll_match:
        direction = scroll_match.group(1).strip()
        x = scroll_match.group(2).strip()
        y = scroll_match.group(3).strip()
        scroll_to_element(device, x, y, direction)
        return

    wa_quick_match = re.search(r'(?:send\s+)?whatsapp\s+(?:quick\s+message\s+(?:to\s+)?)?(\w+)\s+(.+)', cmd)
    if wa_quick_match:
        contact = wa_quick_match.group(1).strip()
        message = wa_quick_match.group(2).strip()
        send_whatsapp_quick_message(device, contact, message)
        return
    
    nav_match = re.search(r'(?:navigate\s+(?:to\s+)?|go\s+to\s+)(.+)', cmd)
    if nav_match and "app" not in cmd:
        destination = nav_match.group(1).strip()
        open_google_maps_navigation(device, destination)
        return
    
    alarm_match = re.search(r'(?:set\s+)?alarm\s+(?:for\s+)?(.+)', cmd)
    if alarm_match:
        time_str = alarm_match.group(1).strip()
        set_alarm(device, time_str)
        return
    
    timer_match = re.search(r'(?:set\s+)?timer\s+(?:for\s+)?(.+)', cmd)
    if timer_match:
        duration = timer_match.group(1).strip()
        set_timer(device, duration)
        return
    
    calendar_match = re.search(r'create\s+(?:calendar\s+)?event\s+(.+)', cmd)
    if calendar_match:
        event_details = calendar_match.group(1).strip()
        create_calendar_event(device, event_details, "", "")
        return

    if "device info" in cmd or "phone info" in cmd or "show device" in cmd:
        get_device_info(device)
        return
    
    if "storage info" in cmd or "disk info" in cmd or "show storage" in cmd:
        get_storage_info(device)
        return
    
    if "memory info" in cmd or "ram info" in cmd or "show memory" in cmd:
        get_memory_info(device)
        return
    
    if "network info" in cmd or "wifi info" in cmd or "show network" in cmd:
        get_network_info(device)
        return
    
    if "installed apps" in cmd or "list apps" in cmd or "show apps" in cmd:
        get_installed_apps(device)
        return
    
    if "running processes" in cmd or "show processes" in cmd or "list processes" in cmd:
        get_running_processes(device)
        return
    
    if "cpu info" in cmd or "processor info" in cmd or "show cpu" in cmd:
        get_cpu_info(device)
        return
    
    if "temperature info" in cmd or "battery temp" in cmd or "show temperature" in cmd:
        get_temperature_info(device)
        return

    copy_clip_match = re.search(r'(?:copy\s+(?:to\s+clipboard\s+)?)?(.+)', cmd)
    if copy_clip_match and "file" not in cmd:
        text = copy_clip_match.group(1).strip()
        copy_to_clipboard(device, text)
        return
    
    if "paste" in cmd:
        paste_from_clipboard(device)
        return
    
    if "clear clipboard" in cmd or "empty clipboard" in cmd:
        clear_clipboard(device)
        return

    if "google assistant" in cmd or "open assistant" in cmd or "hey google" in cmd:
        launch_google_assistant(device)
        return
    
    voice_match = re.search(r'(?:voice\s+command|tell\s+assistant)\s+(.+)', cmd)
    if voice_match:
        command = voice_match.group(1).strip()
        voice_command(device, command)
        return
    
    if "voice assistant" in cmd or "bixby" in cmd:
        launch_siri_alternative(device)
        return

    macro_match = re.search(r'create\s+macro\s+(\w+)\s+(?:with\s+commands?\s+)?(.+)', cmd)
    if macro_match:
        name = macro_match.group(1).strip()
        commands_str = macro_match.group(2).strip()
        commands = [c.strip() for c in commands_str.split(",")]
        create_macro(device, name, commands)
        return
    
    run_macro_match = re.search(r'(?:run|execute)\s+macro\s+(\w+)', cmd)
    if run_macro_match:
        name = run_macro_match.group(1).strip()
        run_macro(device, name)
        return
    
    schedule_match = re.search(r'schedule\s+task\s+(?:in\s+)?(\d+)\s+(?:seconds?|minutes?|hours?)\s+(.+)', cmd)
    if schedule_match:
        delay = int(schedule_match.group(1).strip())
        command = schedule_match.group(2).strip()
        schedule_task(device, command, delay)
        return
    
    repeat_match = re.search(r'repeat\s+(?:action\s+)?(.+?)\s+(\d+)\s+times?', cmd)
    if repeat_match:
        command = repeat_match.group(1).strip()
        times = int(repeat_match.group(2).strip())
        repeat_action(device, command, times)
        return

    if "screenshot" in cmd or "capture screen" in cmd or "take snap" in cmd: take_screenshot(device); return
    if "battery" in cmd or "power status" in cmd or "charge metrics" in cmd: show_battery_diagnostics(device); return
    if "clear" in cmd or "purge" in cmd or "clean apps" in cmd: clear_all_background_apps(device); return
    if "reboot" in cmd or "restart" in cmd:
        if "recovery" in cmd: reboot_device(device, "recovery")
        elif "bootloader" in cmd or "fastboot" in cmd: reboot_device(device, "bootloader")
        else: reboot_device(device, "standard")
        return
    print(" Command context unverified by standard routing maps. Triggering fallback app target lookups...")
    words = cmd.split()
    for word in words:
        if len(word) > 3:
            package_test = live_discover_package(device, word)
            if package_test:
                print(f" Target app string matched inside phrase array! Opening application: [{word}]")
                launch_app_safely(device, word)
                return
    print(" Critical parsing engine block: Natural language input sequence could not be synthesized into execution parameters.")
if __name__ == "__main__":
    my_phone = connect_to_phone()
    
    if my_phone:
        print("\n=========================================================================")
        print(" COMPREHENSIVE ANDROID CONTROL MATRIX - FULL PHONE AUTOMATION ")
        print("=========================================================================")
        print(" Complete text-based control over your Android device via ADB.")
        print("\n  CALLING & COMMUNICATION:")
        print("   'call 1234567890' | 'call mom' | 'dial +919876543210'")
        print("   'answer call' | 'reject call' | 'hang up' | 'end call'")
        print("   'send sms to 1234567890 hello world' | 'text mom I'm coming'")
        print("   'send whatsapp to 1234567890 hello' | 'whatsapp john hi'")
        print("   'read last sms' | 'search sms for keyword'")
        print("   'send email to test@example.com subject hello body world'")
        print("\n  MUSIC & MEDIA:")
        print("   'play shape of you' | 'play song blinding lights'")
        print("   'play music and call 1234567890' | 'call mom while playing spotify'")
        print("   'create playlist workout with song1, song2, song3'")
        print("   'media play' | 'media pause' | 'media next' | 'media previous'")
        print("\n  APP MANAGEMENT:")
        print("   'open instagram' | 'launch whatsapp' | 'close spotify'")
        print("   'open instagram and search for specific chat'")
        print("   'search for Alex Mercer everywhere'")
        print("   'search for news in chrome' | 'search in whatsapp for john'")
        print("\n  FILE MANAGEMENT:")
        print("   'list files in /sdcard' | 'show files'")
        print("   'copy file from /sdcard/test.txt to /sdcard/backup'")
        print("   'move file from /sdcard/test.txt to /sdcard/new'")
        print("   'delete file /sdcard/test.txt' | 'remove /sdcard/test.txt'")
        print("   'create directory /sdcard/newfolder' | 'mkdir /sdcard/test'")
        print("   'pull file from /sdcard/test.txt to local.txt'")
        print("   'push file local.txt to /sdcard/test.txt'")
        print("\n  SYSTEM SETTINGS:")
        print("   'turn on wifi' | 'enable wifi' | 'wifi off'")
        print("   'turn on bluetooth' | 'enable bluetooth' | 'bluetooth off'")
        print("   'turn on airplane mode' | 'enable airplane mode'")
        print("   'set brightness to 150' | 'brightness 200'")
        print("   'set music volume to 10' | 'volume ring 5'")
        print("   'turn on do not disturb' | 'enable dnd'")
        print("   'turn on mobile data' | 'enable data'")
        print("   'turn on flashlight' | 'enable flashlight'")
        print("\n  NOTIFICATIONS:")
        print("   'list notifications' | 'show notifications'")
        print("   'clear notifications' | 'dismiss all notifications'")
        print("   'dismiss notifications from whatsapp'")
        print("\n  CAMERA:")
        print("   'take photo' | 'capture photo' | 'take picture'")
        print("   'take front photo' | 'take back photo'")
        print("   'start video recording' | 'record video'")
        print("   'stop video recording' | 'stop recording'")
        print("   'flash on' | 'flash off' | 'camera flash auto'")
        print("\n  ADVANCED GESTURES:")
        print("   'long press at 500 500' | 'long press 300 400'")
        print("   'double tap at 500 500' | 'double tap 300 400'")
        print("   'pinch in' | 'pinch out' | 'zoom in' | 'zoom out'")
        print("   'scroll down at 500 1000' | 'scroll up 500 500'")
        print("   'tap 450 1200' | 'click at 300, 500'")
        print("   'swipe from 100 500 to 900 500'")
        print("\n  NAVIGATION & PRODUCTIVITY:")
        print("   'navigate to New York' | 'go to Times Square'")
        print("   'set alarm for 7:00' | 'alarm 8:30'")
        print("   'set timer for 5 minutes' | 'timer 10 minutes'")
        print("   'create calendar event meeting tomorrow 10am'")
        print("\n  SYSTEM INFORMATION:")
        print("   'device info' | 'phone info' | 'show device information'")
        print("   'storage info' | 'disk info' | 'show storage'")
        print("   'memory info' | 'ram info' | 'show memory'")
        print("   'network info' | 'wifi info' | 'show network'")
        print("   'installed apps' | 'list apps' | 'show installed apps'")
        print("   'running processes' | 'show processes' | 'list processes'")
        print("   'cpu info' | 'processor info' | 'show cpu'")
        print("   'temperature info' | 'battery temp' | 'show temperature'")
        print("\n  CLIPBOARD:")
        print("   'copy to clipboard hello' | 'copy hello'")
        print("   'paste from clipboard' | 'paste'")
        print("   'clear clipboard' | 'empty clipboard'")
        print("\n  VOICE ASSISTANT:")
        print("   'launch google assistant' | 'open assistant' | 'hey google'")
        print("   'voice command what's the weather' | 'tell assistant hello'")
        print("   'launch voice assistant' | 'open bixby'")
        print("\n  AUTOMATION & MACROS:")
        print("   'create macro morning with open whatsapp, play music, check sms'")
        print("   'run macro morning' | 'execute macro workout'")
        print("   'schedule task in 5 seconds open whatsapp'")
        print("   'repeat action tap 500 500 5 times' | 'repeat open whatsapp 3'")
        print("\n  GENERAL COMMANDS:")
        print("   'close instagram' | 'stop settings' | 'launch whatsapp'")
        print("   'type hello world' | 'write testing'")
        print("   'turn off screen' | 'wake screen' | 'unlock phone 1234'")
        print("   'home' | 'back' | 'menu' | 'search'")
        print("   'volume up' | 'volume down' | 'mute'")
        print("   'swipe up' | 'swipe down' | 'swipe left' | 'swipe right'")
        print("   'screenshot' | 'battery' | 'clear apps'")
        print("   'reboot' | 'reboot recovery' | 'reboot bootloader'")
        print("=========================================================================")
        
        while True:
            try:
                raw_input_string = input("\n Say what to do on phone: ")
                clean_input = raw_input_string.strip()
                
                if clean_input.lower() in ['exit', 'quit', 'terminate', 'halt']:
                    print(" Core interaction loop engine closed out successfully.")
                    break
                    
                process_dynamic_natural_command(my_phone, clean_input)
                
            except KeyboardInterrupt:
                print("\n System framework execution loop aborted manually.")
                sys.exit(0)
            except Exception as global_error:
                print(f" Trapped Critical Runtime Engine Block: {global_error}")
