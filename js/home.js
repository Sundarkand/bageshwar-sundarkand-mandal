// ============================================
//  home.js — Home Page Logic
// ============================================

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ── Run when DOM is ready ──────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadAnnouncement();
  loadHomeStats();
  loadRecentSupporters(); // ← ADD THIS
});

// ── Load scrolling announcement from Firestore ──
async function loadAnnouncement() {
  const el = document.getElementById("marquee-text");
  if (!el) return;
  try {
    const snap = await getDoc(doc(db, "settings", "announcement"));
    if (snap.exists() && snap.data().message) {
      el.textContent = "🚩 " + snap.data().message + " 🚩";
    } else {
      el.textContent = "🚩 जय श्री राम! Welcome to Bageshwar Bala Ji Sundarkand Mandal Nagla Dallu 🚩";
    }
  } catch (err) {
    console.error("Announcement load error:", err);
    el.textContent = "🚩 जय श्री राम! Welcome to Bageshwar Bala Ji Sundarkand Mandal Nagla Dallu 🚩";
  }
}

// ── Load quick stats (events count, donors count etc.) ──
async function loadHomeStats() {
  // Events count
  try {
    const eventsSnap = await getCountFromServer(collection(db, "events"));
    const el = document.getElementById("stat-events");
    if (el) el.textContent = eventsSnap.data().count;
  } catch (e) {}

  // Members count
  try {
    const membersSnap = await getCountFromServer(collection(db, "members"));
    const el = document.getElementById("stat-members");
    if (el) el.textContent = membersSnap.data().count;
  } catch (e) {}
  
}
