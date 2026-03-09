// ============================================
//  upcoming.js — Upcoming Events Page
// ============================================

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  loadAnnouncement();
  loadEvents();
});

// ── Announcement ─────────────────────────────
async function loadAnnouncement() {
  const el = document.getElementById("marquee-text");
  if (!el) return;
  try {
    const snap = await getDoc(doc(db, "settings", "announcement"));
    el.textContent = snap.exists() && snap.data().message
      ? "🚩 " + snap.data().message + " 🚩"
      : "🚩 जय श्री राम! Bageshwar Bala Ji Sundarkand Mandal Nagla Dallu 🚩";
  } catch {
    el.textContent = "🚩 जय श्री राम! Bageshwar Bala Ji Sundarkand Mandal Nagla Dallu 🚩";
  }
}

// ── Load Events ───────────────────────────────
async function loadEvents() {
  const container = document.getElementById("events-list");
  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading events...</p>
    </div>`;

  try {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="alert alert-info">
          📅 No upcoming events at the moment. Stay tuned!
          (फिलहाल कोई आगामी कार्यक्रम नहीं है। भविष्य में आने वाली जानकारी के लिए हमारे साथ जुड़े रहें!)
        </div>`;
      return;
    }

    let html = "";
    snapshot.forEach((docSnap) => {
      const ev = docSnap.data();

      // Convert Firestore Timestamp to readable date
      let dateStr = "TBA";
      if (ev.date && ev.date.toDate) {
        dateStr = ev.date.toDate().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } else if (typeof ev.date === "string") {
        dateStr = ev.date;
      }

      html += `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.8rem;">
            <h3 class="card-title">📅 ${ev.title || "Unnamed Event"}</h3>
          </div>
          <p class="card-meta">🗓️ <strong>दिनांक (Date):</strong> ${dateStr}</p>
          <p class="card-meta">🕐 <strong>समय (Time):</strong> ${ev.time || "N/A"}</p>
          <p class="card-meta">🛕 <strong>स्थान (Venue):</strong> ${ev.templeName || ""}, ${ev.locationText || ""}</p>
          <p class="card-meta">👤 <strong>आयोजक (Organizer):</strong> ${ev.organizer || "N/A"}</p>
          ${
            ev.googleMapLink
              ? `<a href="${ev.googleMapLink}" target="_blank" rel="noopener"
                   style="display:inline-block; margin-top:0.8rem; color:var(--saffron-dark); font-weight:600;">
                   📍 Google Maps पर देखें (View on Google Maps) ↗️
                 </a>`
              : ""
          }
        </div>`;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading events:", error);
    container.innerHTML = `
      <div class="alert alert-error">
        ⚠️ Failed to load events. Please try again later.
      </div>`;
  }
}
