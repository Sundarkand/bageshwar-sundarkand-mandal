<div align="center">

<!-- LOGO -->
<img src="assets/logo.png" alt="Bageshwar Bala Ji Mandal Logo" width="120" height="120" style="border-radius:50%;" />

<br/>

# 🚩 बागेश्वर बाला जी सुंदरकांड मंडल
## Bageshwar Bala Ji Sundarkand Mandal, Nagla Dallu

**नगला डल्लू की आधिकारिक धार्मिक वेब पोर्टल**  
*Official Religious Web Portal of Nagla Dallu*

<br/>

[![Live Website](https://img.shields.io/badge/🌐_Live_Website-Visit_Now-FF6B00?style=for-the-badge)](https://balajisundarkand.netlify.app)
[![Netlify Status](https://img.shields.io/badge/Hosted_On-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://netlify.com)
[![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> 🕉️ *जय श्री राम! जय बजरंगबली!* 🚩  
> *हर घर में सुंदरकांड की दिव्य ऊर्जा का प्रसार हो।*

---

</div>

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Pages](#-pages)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Firebase Setup](#-firebase-setup)
- [Cloudinary Setup](#-cloudinary-setup)
- [Security](#-security)
- [Admin Panel](#-admin-panel)
- [Contact](#-contact)
- [Developer](#-developer)

---

## 🛕 About the Project

**बागेश्वर बाला जी सुंदरकांड मंडल** is a community religious organization based in the pious village of **Nagla Dallu**. This website is the official digital presence of the Mandal, built to serve devotees with live streaming, event information, Sundarkand text, donation services, and more.

यह वेबसाइट मंडल के भक्तों को एक डिजिटल मंच प्रदान करती है जहाँ वे —
- सुंदरकांड पाठ ऑनलाइन पढ़ सकते हैं
- लाइव प्रसारण देख सकते हैं
- आगामी कार्यक्रमों की जानकारी ले सकते हैं
- मंडल की सेवा में दान कर सकते हैं
- गैलरी व सदस्यों की जानकारी देख सकते हैं

---

## 🌐 Live Demo

| Platform | Link |
|----------|------|
| 🌍 Live Website | [balajisundarkandtest.netlify.app](https://balajisundarkand.netlify.app) |
| 📺 YouTube Channel | [@BalaJiSundarkand](https://www.youtube.com/@BalaJiSundarkand) |
| 💬 WhatsApp Group | [Join Here](https://chat.whatsapp.com/KI2jvB22PejKQcpKCHP8Ee) |

---

## ✨ Features

### 🙏 Public Features
| Feature | Description |
|---------|-------------|
| 🏠 **Home Page** | Welcome page with stats, recent supporters, and quick navigation |
| 📖 **Sundarkand Path** | Complete Sundarkand text with Hindi meaning in beautiful layout |
| 🔴 **Live Streaming** | Embedded YouTube live stream — plays directly on website |
| 🎬 **Past Recordings** | All past Sundarkand sessions embedded on the page |
| 📅 **Upcoming Events** | Event details with date, time, venue and Google Maps link |
| 🖼️ **Gallery** | Photo gallery of events and programs |
| 🙏 **Donation** | Online UPI donation with QR code, transaction ID saving |
| 👥 **About & Members** | Mandal information, core members, and contact details |
| 📢 **Announcements** | Live scrolling announcement bar managed by admin |

### 🛡️ Admin Features
| Feature | Description |
|---------|-------------|
| 🔐 **Secure Login** | Firebase Authentication — email/password only |
| ✅ **Donation Verification** | Admin can verify or delete donation records |
| 📅 **Event Management** | Add and delete upcoming events |
| 🎬 **Recordings Management** | Add past live recordings with YouTube links |
| 🖼️ **Gallery Upload** | Upload images via Cloudinary (no Firebase Storage needed) |
| 👥 **Member Management** | Add/delete core members with photos |
| 📢 **Announcement Control** | Update scrolling announcement bar |
| 🔴 **Live Link Control** | Set current live YouTube link from dashboard |

### 📱 UI/UX Features
- ✅ Fully **Mobile Responsive** with hamburger navigation menu
- ✅ **Sticky Header** — stays visible while scrolling
- ✅ **Saffron & Maroon** devotional color theme
- ✅ **Hindi language** throughout the interface
- ✅ **Animated** WhatsApp floating button
- ✅ **Smooth fade-in** animations on content load
- ✅ Videos play **directly on website** — no redirect to YouTube

---

## 📄 Pages

/
├── index.html          → Home Page
├── upcoming.html       → Upcoming Events
├── live.html           → Live & Past Recordings
├── sundarkand.html     → Sundarkand Path Text
├── gallery.html        → Photo Gallery
├── donation.html       → Donation Page
├── about.html          → About Mandal & Contact
├── admin-login.html    → Admin Login (protected)
└── admin-dashboard.html→ Admin Control Panel (protected)

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | All pages and UI |
| **Database** | Firebase Firestore | Events, donations, members, settings |
| **Authentication** | Firebase Auth | Admin login security |
| **Image Hosting** | Cloudinary | Gallery and member photos |
| **Video** | YouTube iFrame API | Live and past recordings |
| **Hosting** | Netlify | Website deployment |
| **Version Control** | GitHub | Code repository |
| **Payments** | UPI Deep Link + QR | Donation payment |

> ⚠️ **No Firebase Storage used** — Cloudinary is used instead due to regional restrictions. Firebase database is in `Asia South 2` region while Firebase Storage free tier only supports US regions.

---

## 📁 Project Structure


bageshwar-bala-ji-mandal/
│
├── 📄 index.html
├── 📄 upcoming.html
├── 📄 live.html
├── 📄 sundarkand.html
├── 📄 gallery.html
├── 📄 donation.html
├── 📄 about.html
├── 📄 admin-login.html
├── 📄 admin-dashboard.html
│
├── 📁 css/
│   └── style.css              ← All styles (theme, layout, components)
│
├── 📁 js/
│   ├── firebase-config.js     ← Firebase + Cloudinary config
│   ├── home.js                ← Home page logic
│   ├── upcoming.js            ← Events page logic
│   ├── live.js                ← Live + recordings logic
│   ├── sundarkand.js          ← Sundarkand text loader
│   ├── gallery.js             ← Gallery loader
│   ├── donation.js            ← Donation form + display
│   └── admin.js               ← Admin dashboard logic
│
└── 📁 assets/
├── logo.png               ← Mandal logo
├── hanuman-banner.jpg     ← Header banner image
└── qr-code.png            ← Donation QR code

---


## 🔥 Firebase Setup

This project uses **Firebase Firestore** for the database and **Firebase Authentication** for the admin login.

### Firestore Collections

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `donations` | name, amount, note, mode, anonymous, status, transactionId, date | Donation records |
| `events` | title, date, time, templeName, locationText, googleMapLink, organizer | Upcoming events |
| `pastLives` | title, youtubeLink, date | Past recordings |
| `gallery` | imageUrl, caption, date | Gallery photos |
| `members` | name, position, contact, photoUrl | Core members |
| `sundarkandText` | order, sanskrit, hindiMeaning | Sundarkand verses |
| `settings/announcement` | message | Scrolling announcement |
| `settings/live` | currentLiveLink | Current live YouTube link |

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
             request.auth.token.email == "YOUR_ADMIN_EMAIL";
    }

    match /events/{id}        { allow read: if true; allow write: if isAdmin(); }
    match /pastLives/{id}     { allow read: if true; allow write: if isAdmin(); }
    match /gallery/{id}       { allow read: if true; allow write: if isAdmin(); }
    match /members/{id}       { allow read: if true; allow write: if isAdmin(); }
    match /settings/{id}      { allow read: if true; allow write: if isAdmin(); }
    match /sundarkandText/{id}{ allow read: if true; allow write: if isAdmin(); }

    match /donations/{id} {
      allow read: if true;
      allow create: if request.resource.data.status == "pending"
                    && request.resource.data.amount is number
                    && request.resource.data.amount > 0;
      allow update, delete: if isAdmin();
    }

    match /{document=**} { allow read, write: if false; }
  }
}
```

---

## ☁️ Cloudinary Setup

Firebase Storage was not used due to a **regional conflict** — the database is in `Asia South 2` but Firebase Storage free tier only works in `US` regions.

**Cloudinary** is used instead as a free image hosting solution.

### Setup Steps
1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to **Settings → Upload → Upload Presets**
3. Create a new preset:
   - **Name:** `mandal_uploads`
   - **Signing Mode:** `Unsigned`
4. Copy your **Cloud Name** from the dashboard
5. Update `js/firebase-config.js`:

```javascript
export const CLOUDINARY_CLOUD_NAME = "your_cloud_name_here";
export const CLOUDINARY_UPLOAD_PRESET = "mandal_uploads";
```

---

## 🔐 Security

### Is the public Firebase API key safe?

**Yes.** Firebase API keys are designed to be public. They only identify which Firebase project to connect to. Your real security comes from **Firestore Security Rules** (shown above).

### What is protected:
- ✅ Admin login requires Firebase Auth (email + password)
- ✅ Only admin can verify/delete donations
- ✅ Only admin can add/delete events, members, gallery, recordings
- ✅ Public users can only CREATE pending donations (not verify them)
- ✅ Firestore rules block all unauthorized writes

### What is intentionally public:
- ℹ️ Firebase API key (safe by Firebase design)
- ℹ️ Cloudinary upload preset (unsigned presets are designed to be public)
- ℹ️ All read data (events, gallery, members — these are meant to be public)

---

## 🛡️ Admin Panel

The admin panel is accessible at `/admin-login.html` and is protected by Firebase Authentication.

**Admin can:**
- View all donations (pending + verified)
- Verify or delete donations
- Add/delete upcoming events
- Add/delete past live recordings
- Upload images to gallery (via Cloudinary)
- Add/delete core members (with photos via Cloudinary)
- Update the announcement bar message
- Set the current live YouTube link

> 🔒 Admin email is set in `firebase-config.js` as `ADMIN_EMAIL`. Only this exact email can access the dashboard.

---

## 📞 Contact

| Method | Details |
|--------|---------|
| 📧 Email | [balajisundarkandnagladallu@gmail.com](mailto:balajisundarkandnagladallu@gmail.com) |
| 📞 Phone | [+91 79832 74853](tel:+917983274853) |
| 📺 YouTube | [@BalaJiSundarkand](https://www.youtube.com/@BalaJiSundarkand) |
| 💬 WhatsApp | [Join Group](https://chat.whatsapp.com/KI2jvB22PejKQcpKCHP8Ee) |

---

## 👨🏻‍💻 Developer

<div align="center">

**Developed with 🙏 and ❤️ by**

### Aman Shankhdhar

*Full Stack Web Developer*

---

*इस वेबसाइट को बनाने में जो भी पुण्य मिला, वह श्री बागेश्वर बाला जी के चरणों में समर्पित है।*  
*Whatever merit earned in building this website is dedicated to the feet of Shri Bageshwar Bala Ji.*

---

**🚩 जय श्री राम! जय बजरंगबली! 🚩**

</div>

---

<div align="center">

*© 2026 Bageshwar Bala Ji Sundarkand Mandal, Nagla Dallu. All Rights Reserved.*

</div>
