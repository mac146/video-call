# 📹 Video Call Feature (WebRTC)

This project implements a **real-time video calling feature** using **WebRTC** along with signaling via Node.js and Express. It allows two or more users to join a room and communicate through audio and video directly in their browsers.

---

## 🚀 Features
- 🔗 Peer-to-peer video & audio calls using **WebRTC**
- ⚡ Real-time signaling with **Socket.io**
- 🎤 Mute/unmute microphone
- 🎥 Turn camera on/off
- 👋 Join and leave meeting room
- 📱 Works on modern browsers (Chrome, Firefox, Edge)

---

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Node.js, Express.js  
- **Real-time Communication**: WebRTC, Socket.io  

---

## 📂 Project Structure
├── server.js # Backend server with signaling (Express + Socket.io)
├── public/
│ ├── index.html # UI for video call
│ ├── style.css # Styles
│ └── script.js # WebRTC & Socket.io logic
└── package.json