// ============================================
//  live.js — Live Streaming & Past Lives Page
// ============================================

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  loadAnnouncement();
  loadCurrentLive();
  loadPastLives();
});

// ── Announcement ─────────────────────────────
async function loadAnnouncement() {
  const el = document.getElementById("marquee-text");
  if (!el) return;
  try {
    const snap = await getDoc(doc(db, "settings", "announcement"));
    el.textContent = snap.exists() && snap.data().message
      ? "🚩 " + snap.data().message + " 🚩"
      : "🚩 जय श्री राम! Bageshwar Bala Ji Sundarkand Mandal 🚩";
  } catch {
    el.textContent = "🚩 जय श्री राम! Bageshwar Bala Ji Sundarkand Mandal 🚩";
  }
}

// ── Extract YouTube Embed ID from URL ────────
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Live stream or watch URL
    let videoId = u.searchParams.get("v");
    // youtu.be short URL
    if (!videoId && u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
    }
    // Embed URL already
    if (!videoId && u.pathname.includes("/embed/")) {
      videoId = u.pathname.split("/embed/")[1].split("?")[0];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
  } catch (e) {}
  return null;
}

// ── Load Current Live Stream ──────────────────
async function loadCurrentLive() {
  const container = document.getElementById("current-live-container");
  try {
    const snap = await getDoc(doc(db, "settings", "live"));
    const link =
      snap.exists() && snap.data().currentLiveLink
        ? snap.data().currentLiveLink.trim()
        : "";

    if (link) {
      const embedUrl = getYouTubeEmbedUrl(link);
      if (embedUrl) {
        container.innerHTML = `
          <div class="live-badge">🔴 LIVE NOW</div>
          <div class="video-embed-wrapper">
            <iframe src="${embedUrl}" frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen title="Live Darshan"></iframe>
          </div>`;
      } else {
        container.innerHTML = `
          <div class="live-soon-box">
            <div class="live-icon">📡</div>
            <h3>Live stream link is set</h3>
            <p><a href="${link}" target="_blank" style="color:var(--gold);">Click here to watch ↗</a></p>
          </div>`;
      }
    } else {
      container.innerHTML = `
        <div class="live-soon-box">
          <div class="live-icon">📡</div>
          <h3>Live Streaming Will Start Soon</h3>
          <p>Please subscribe to our YouTube channel and enable notifications to be notified when we go live.</p>
        </div>`;
    }
  } catch (err) {
    console.error("Live load error:", err);
    container.innerHTML = `
      <div class="live-soon-box">
        <div class="live-icon">📡</div>
        <h3>Live Streaming Will Start Soon</h3>
        <p>Stay tuned for the next Sundarkand Path.</p>
      </div>`;
  }
}

// ── Load Past Live Recordings ─────────────────
async function loadPastLives() {
  const container = document.getElementById("past-lives-list");
  container.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;

  try {
    const q = query(collection(db, "pastLives"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = `<p class="text-muted text-center">No past recordings available yet.</p>`;
      return;
    }

    let html = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let dateStr = "";
      if (data.date && data.date.toDate) {
        dateStr = data.date.toDate().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      // Extract YouTube thumbnail if possible
      let thumbHtml = `<div class="past-live-thumb">🎬</div>`;
      try {
        const u = new URL(data.youtubeLink);
        let vid = u.searchParams.get("v") || (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
        if (vid) {
          thumbHtml = `
            <div class="past-live-thumb" style="padding:0; overflow:hidden;">
              <img src="https://img.youtube.com/vi/${vid}/mqdefault.jpg"
                   alt="${data.title}" style="width:100%; height:100%; object-fit:cover;"
                   onerror="this.parentElement.innerHTML='<span style=font-size:3rem>🎬</span>'">
            </div>`;
        }
      } catch (e) {}

      html += `
        <div class="past-live-card">
          ${thumbHtml}
          <div class="past-live-info">
            <h4>${data.title || "Sundarkand Path"}</h4>
            <p>📅 ${dateStr}</p>
            <a href="${data.youtubeLink}" target="_blank" rel="noopener"
               class="btn btn-primary btn-sm" style="display:inline-block; text-decoration:none;">
              ▶️ Watch Now
            </a>
          </div>
        </div>`;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Past lives load error:", error);
    container.innerHTML = `<p class="text-muted text-center">Failed to load recordings.</p>`;
  }
}