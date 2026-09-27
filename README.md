# 🔐 SChat — ECC P-256 End-to-End Encrypted Messaging System

> A modern secure messaging application built with **React + Firebase** implementing **End-to-End Encryption (E2EE)** using **Elliptic Curve Cryptography (ECC P-256)**, **AES-256-GCM**, and the **Web Crypto API**.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase)
![ECC](https://img.shields.io/badge/ECC-P--256-2563EB)
![AES-256-GCM](https://img.shields.io/badge/AES--256--GCM-Secure-16A34A)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-blue)

**Live Demo:** https://schat-000.web.app

---

## 📖 Overview

SChat is a secure real-time messaging platform that encrypts every message **before it leaves the sender's device**. The server (Firebase Firestore) stores only encrypted ciphertext and never has access to users' private keys or plaintext messages.

The project demonstrates the complete workflow of an **End-to-End Encrypted Chat System** using modern browser cryptography and cloud services.

### ✨ Key Highlights

- 🔐 End-to-End Encryption using ECC (P-256 / secp256r1)
- 🔑 ECDH Shared Secret Key Exchange
- 🛡 AES-256-GCM authenticated encryption
- 📧 OTP Email Verification using EmailJS
- ☁ Firebase Authentication + Firestore + Hosting
- 👤 Public/Private Key Management
- 📱 Fully Responsive Apple Liquid Glass UI
- ⚡ Built with React + Vite

---

# 🏗 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, Vite, Tailwind CSS |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Cryptography | Web Crypto API |
| Key Exchange | ECC P-256 (ECDH) |
| Encryption | AES-256-GCM |
| Hashing | SHA-256 |
| OTP Service | EmailJS |
| Hosting | Firebase Hosting |

---

# 🔐 End-to-End Encryption Architecture

## Encryption Flow

```text
Sender Device
     │
     │ Generate Shared Secret using ECDH
     ▼
ECC (P-256)
     │
     ▼
HKDF + SHA-256
     │
     ▼
AES-256-GCM Session Key
     │
     ▼
Encrypt Message
     │
     ▼
Ciphertext + IV
     │
     ▼
Firestore Database
     │
     ▼
Receiver Device
     │
     ▼
Shared Secret via Receiver Private Key
     │
     ▼
AES-256-GCM Decryption
     │
     ▼
Original Plaintext
```

---

## How Encryption Works

### 1. Key Pair Generation

Every user receives an ECC key pair during account creation.

| Key | Stored |
|------|--------|
| Public Key | Firestore (`users/{uid}`) |
| Private Key | Browser Local Storage / Web Crypto |

Private keys never leave the user's device.

---

### 2. Shared Secret Creation

When User A messages User B:

- Sender loads Receiver's Public Key.
- Sender uses their Private Key.
- ECDH derives a shared secret.

Receiver derives the **same shared secret** using:

- Receiver Private Key
- Sender Public Key

No shared secret is transmitted over the network.

---

### 3. AES Encryption

Message encryption uses:

- AES-256-GCM
- Random 96-bit IV
- Authentication Tag
- UTF-8 Encoding

Firestore stores:

```json
{
  "ciphertext": "...",
  "iv": "...",
  "senderId": "...",
  "receiverId": "...",
  "timestamp": "...",
  "encrypted": true
}
```

---

### 4. Message Decryption

Receiver downloads ciphertext.

Browser:

1. Loads local private key.
2. Fetches sender public key.
3. Derives shared secret.
4. Decrypts AES ciphertext.
5. Displays plaintext.

---

# 🚀 Features

## Authentication

- Email OTP verification.
- Firebase Authentication.
- Login / Signup.
- Password reset.
- Email verification.

## Messaging

- End-to-End encrypted messages.
- Conversation sidebar.
- Read receipts (✓ ✓).
- Typing indicator.
- Reply to message.
- Search messages.
- Message timestamps.

## Security

- ECC P-256 key generation.
- Public key fingerprint.
- Rotate Key Pair.
- SHA-256 fingerprint verification.
- AES authenticated encryption.

## User Experience

- Apple Liquid Glass UI.
- Dark/Light adaptive colors.
- Mobile-first responsive layout.
- Avatar selection.
- Smooth animations.

---

# 📱 Responsive Design

SChat supports:

- Android phones.
- iPhones.
- Tablets.
- Laptops.
- Desktop monitors.
- Ultrawide displays.

### Mobile Layout

- Full-screen conversation list.
- Back navigation from chat.
- Bottom navigation for Chats / Settings.
- Safe-area support for modern phones.

---

# 📂 Project Structure

```text
SChat/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── ChatWindow.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── AvatarPicker.jsx
│   │   └── InputField.jsx
│   │
│   ├── pages/
│   │   ├── Chats.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Settings.jsx
│   │   └── ForgotPassword.jsx
│   │
│   ├── services/
│   │   ├── auth.js
│   │   ├── firestore.js
│   │   ├── crypto.js
│   │   ├── firebase.js
│   │   └── otp.js
│   │
│   ├── utils/
│   ├── constants/
│   ├── App.jsx
│   └── main.jsx
│
├── firebase.json
├── firestore.rules
├── vite.config.js
└── package.json
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/SaiVishwanathV/ECC-chat.git

cd ECC-chat
```

## Install Dependencies

```bash
npm install
```

## Create Environment File

Create `.env.local`

```env
# Firebase
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# EmailJS
VITE_EMAILJS_SERVICE_ID=YOUR_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID=YOUR_TEMPLATE_ID
VITE_EMAILJS_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

## Start Development Server

```bash
npm run dev
```

Application runs at:

```text
http://localhost:5173
```

---

# 🔥 Firebase Configuration

SChat uses Firebase services:

- Authentication
- Firestore Database
- Hosting

Deploy hosting:

```bash
npm run build
firebase deploy --only hosting
```

---

# 🔐 Cryptographic Specifications

| Algorithm | Purpose |
|-----------|---------|
| ECC P-256 | Public/Private Key Generation |
| ECDH | Shared Secret Derivation |
| HKDF (SHA-256) | Key Derivation |
| AES-256-GCM | Message Encryption |
| SHA-256 | Public Key Fingerprint |

---

# 🔑 Security & Keys Page

The application includes a dedicated **Security & Keys** dashboard.

Features include:

- Active ECC Algorithm status.
- AES Encryption status.
- SHA-256 Key Derivation status.
- Public Key Fingerprint.
- Rotate Key Pair button.
- Developer Mode (Academic Demonstration).

Developer Mode can display exported keys locally for educational purposes only.

> **Note:** Private keys remain local to the browser and are never uploaded to Firestore.

---

# 📧 OTP Verification

Email verification uses **EmailJS**.

Workflow:

1. User enters email.
2. Random 6-digit OTP generated.
3. EmailJS sends OTP.
4. User verifies OTP.
5. Firebase account creation proceeds.

---

# 🧪 Security Design

| Property | Status |
|----------|--------|
| End-to-End Encryption | ✅ |
| Private Keys Stored Server-side | ❌ |
| Public Keys Stored in Firestore | ✅ |
| Ciphertext Stored in Firestore | ✅ |
| Plaintext Stored in Database | ❌ |
| AES Authentication Tag | ✅ |
| Public Key Fingerprint Verification | ✅ |

---

# 🚀 Future Enhancements

- Voice messages with E2EE.
- Image/File encryption before upload.
- Group chat with shared group keys.
- Push notifications.
- Multi-device encrypted sessions.
- QR code fingerprint verification.

---

# 👨‍💻 Author

**V Sai Vishwanath**

B.Tech Computer Science & Engineering

Mahatma Gandhi Institute of Technology (MGIT), Hyderabad

GitHub: `SaiVishwanathV`

---

## ⭐ If you found this project useful, consider giving it a star on GitHub!
