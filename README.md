<h1 align="center">Phone Control</h1>

<p align="center">
  <b>Your Personal Web Dashboard to Control Your Android Phone from Your PC</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0-ff1a1a?style=for-the-badge" alt="Version 1.0"/>
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Android-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Platform"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/>
</p>

<p align="center">
  <i>Developed and Created by <b>Manoj Royal</b></i>
</p>

---

## 📖 What is Phone Control?

**Phone Control** is a powerful web-based dashboard and automation server that lets you seamlessly manage, monitor, and control your Android device directly from your PC. 

Whether you want to send SMS, manage your files, take screenshots, check your battery health, or launch applications without touching your phone, Phone Control provides an intuitive interface to do it all.

- **Monitor everything** — See battery health, CPU usage, RAM, network stats, and device temperature.
- **Control hardware** — Toggle WiFi, Bluetooth, Flashlight, Airplane Mode, and adjust brightness/volume.
- **Manage communications** — Read and send SMS, make phone calls, and manage WhatsApp messages.
- **File Management** — Browse, copy, delete, and transfer files between your PC and Android device.
- **Automation ready** — Comes with natural language command processing to automate phone tasks.

---

## 🎬 How Does It Work?

Phone Control uses a Python (Flask) backend to communicate with your Android device via ADB (Android Debug Bridge), while providing a clean, modern React web interface for you to interact with.

```
Your Web Browser (React UI) 
          ↓
  Python Flask Server (app.py)
          ↓
  ADB Commands (android_automation.py)
          ↓
    📱 Your Android Phone
```

---

## ✨ Features — Everything Phone Control Can Do

### 📊 System Diagnostics
| Feature | What It Does |
|---|---|
| **Live Stats** | Monitor CPU, RAM, and internal storage usage. |
| **Battery Health** | Check battery percentage, temperature, voltage, and charging status. |
| **Network Info** | View IP address, MAC address, and active connections. |
| **Process Manager** | See running background processes and installed applications. |

### ⚙️ Hardware Control
| Feature | What It Does |
|---|---|
| **Quick Toggles** | Turn WiFi, Bluetooth, Mobile Data, and Airplane mode on or off. |
| **Display & Audio** | Adjust screen brightness, set media volume, and toggle Do Not Disturb. |
| **Camera & Media** | Take photos, record videos, and play/pause media playing on the phone. |
| **Flashlight** | Instantly toggle the phone's flashlight. |

### 💬 Communication & Social
| Feature | What It Does |
|---|---|
| **SMS Management** | Send SMS, read the latest texts, and search through messages. |
| **Phone Calls** | Make phone calls, answer incoming calls, end calls, and manage active calls. |
| **WhatsApp Integration** | Send WhatsApp messages and initiate WhatsApp calls directly. |
| **Email Integration** | Automate sending emails from your device. |

### 👁️ Screen & UI Interaction
| Feature | What It Does |
|---|---|
| **Remote Screen Capture** | Take high-quality screenshots and save them instantly to your PC. |
| **Remote Input** | Type text, simulate keypresses, and tap specific coordinates on the phone. |
| **App Launcher** | Open or close any installed application safely. |
| **Clipboard Sync** | Copy text from PC to phone clipboard, or retrieve phone clipboard to PC. |

### 📁 File Management
| Feature | What It Does |
|---|---|
| **Browse Files** | List files and directories on your phone's storage. |
| **Transfer Files** | Push files from PC to phone, or pull files from phone to PC. |
| **Organize** | Create folders, copy, move, and delete files on the device. |

### 🤖 Smart Features
| Feature | What It Does |
|---|---|
| **Natural Commands** | Process dynamic natural commands for automation. |
| **Assistant & Nav** | Launch Google Assistant or open Maps navigation. |
| **Alarms & Reminders** | Set alarms, start timers, and create calendar events. |

---

## 🛠️ Technology Stack

### Backend & Core
| Technology | Purpose |
|---|---|
| **Python 3** | Core server logic and ADB automation. |
| **Flask** | Lightweight web framework serving the API and frontend. |
| **ADB (Android Debug Bridge)** | Native communication protocol with the Android device. |

### Frontend
| Technology | Purpose |
|---|---|
| **React** | Dynamic and responsive web interface. |
| **HTML/CSS/JS** | Structure, styling, and client-side interactions. |

---

## 🚀 Setup Guide

### Prerequisites
- **Python 3.8+** installed on your PC.
- **Node.js & npm** (if you want to build the frontend manually).
- An **Android phone** with **USB Debugging** enabled in Developer Options.
- A USB cable to connect your phone to the PC (or setup wireless ADB).

### Step 1: Connect Your Phone
1. Enable Developer Options on your Android phone (Tap 'Build Number' 7 times in Settings).
2. Enable **USB Debugging**.
3. Connect your phone to the PC via USB.
4. Allow the debugging connection prompt on your phone's screen.

### Step 2: Install Python Dependencies
Open your terminal in the project directory and run:
```bash
pip install flask
```
*(Install any other required libraries if noted in a `requirements.txt` file)*

### Step 3: Run the Server
```bash
cd app
python app.py
```

The server will start and host the dashboard. Open your web browser and navigate to:
**`http://localhost:5000`** (or the port specified in your console).

---

## 📁 Project Structure

```
phone-control/
├── app/
│   ├── app.py                  # 🧠 Main Flask web server
│   ├── android_automation.py   # 🔧 ADB automation and logic
│   ├── setup.py                # ⚙️ Setup script (if applicable)
│   ├── frontend/               # 🖥️ React UI source and build files
│   │   └── dist/               #   Compiled frontend ready to serve
│   └── screenshots/            # 📸 Saved screen captures
```

---

## 🙏 Credits & Acknowledgments

### Developer
**Manoj Royal** — Developer & Creator of Phone Control

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  <b>Phone Control v1.0</b>
  <br/>
  <i>Built with ❤️ by Manoj Royal</i>
</p>
