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

// ─────────────────────────────────────────────
// Recent Supporters — Last 3 Verified Donors
// ─────────────────────────────────────────────
async function loadRecentSupporters() {
  const listEl = document.getElementById("supporters-list");
  if (!listEl) return;

  try {
    // Only where() — no orderBy() to avoid Firebase Index Error
    const q = query(
      collection(db, "donations"),
      where("status", "==", "verified")
    );

    const snapshot = await getDocs(q);

    // Collect into array
    let donations = [];
    snapshot.forEach((docSnap) => {
      donations.push(docSnap.data());
    });

    // Sort newest first using JavaScript
    donations.sort((a, b) => {
      const tA = a.date && a.date.seconds ? a.date.seconds : 0;
      const tB = b.date && b.date.seconds ? b.date.seconds : 0;
      return tB - tA;
    });

    // Take only latest 3
    const top3 = donations.slice(0, 3);

    // Empty state
    if (top3.length === 0) {
      listEl.innerHTML = `
        <div class="supporters-empty">
          🙏 अभी तक कोई सहयोगी नहीं।<br>
          <span style="font-size:0.8rem; color:#aaa;">No supporters yet. Be the first!</span>
        </div>`;
      return;
    }

    // Build cards
    let html = "";
    top3.forEach((d) => {
      // Name logic
      const isAnon = d.anonymous || !d.name || d.name.trim() === "";
      const displayName = isAnon ? "Anonymous / गुमनाम" : d.name.trim();
      const avatarChar = isAnon ? "🙏" : d.name.trim().charAt(0).toUpperCase();

      html += `
        <div class="supporter-item">
          <div class="supporter-avatar">${avatarChar}</div>
          <div>
            <div class="supporter-name">• ${displayName}</div>
            <div class="supporter-tag">सहयोगी • Supporter</div>
          </div>
        </div>`;
    });

    listEl.innerHTML = html;

  } catch (err) {
    console.error("Supporters error:", err);
    listEl.innerHTML = `
      <div class="supporters-empty">
        ⚠️ लोड नहीं हो सका।
      </div>`;
  }
}
