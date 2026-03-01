// ============================================
//  gallery.js — Gallery Page
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
  loadGallery();
  setupLightbox();
});

// ── Announcement ─────────────────────────────
async function loadAnnouncement() {
  const el = document.getElementById("marquee-text");
  if (!el) return;
  try {
    const snap = await getDoc(doc(db, "settings", "announcement"));
    el.textContent = snap.exists() && snap.data().message
      ? "🚩 " + snap.data().message + " 🚩"
      : "🚩 जय श्री राम! Sundarkand Mandal 🚩";
  } catch {
    el.textContent = "🚩 जय श्री राम! Sundarkand Mandal 🚩";
  }
}

// ── Load Gallery Images ───────────────────────
async function loadGallery() {
  const container = document.getElementById("gallery-container");
  container.innerHTML = `<div class="loading-container" style="grid-column:1/-1;"><div class="spinner"></div></div>`;

  try {
    const q = query(collection(db, "gallery"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="alert alert-info" style="grid-column:1/-1; text-align:center;">
          📷 No images yet. Check back soon!
        </div>`;
      return;
    }

    let html = "";
    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const caption = item.caption || "Divine Moment";
      const imgUrl = item.imageUrl || "";

      if (imgUrl) {
        html += `
          <div class="gallery-item" onclick="openLightbox('${imgUrl.replace(/'/g, "\\'")}', '${caption.replace(/'/g, "\\'")}')">
            <img src="${imgUrl}" alt="${caption}" class="gallery-item-img" loading="lazy"
                 onerror="this.parentElement.querySelector('.gallery-item-placeholder').style.display='flex'; this.style.display='none'">
            <div class="gallery-item-placeholder" style="display:none;">🛕</div>
            <div class="gallery-item-caption">${caption}</div>
          </div>`;
      } else {
        html += `
          <div class="gallery-item">
            <div class="gallery-item-placeholder">🛕</div>
            <div class="gallery-item-caption">${caption}</div>
          </div>`;
      }
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Gallery load error:", error);
    container.innerHTML = `
      <div class="alert alert-error" style="grid-column:1/-1;">
        ⚠️ Failed to load gallery. Please try again later.
      </div>`;
  }
}

// ── Lightbox ──────────────────────────────────
function setupLightbox() {
  const overlay = document.getElementById("lightbox-overlay");
  if (!overlay) return;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}

// Global so onclick in HTML can call it
window.openLightbox = function (imgUrl, caption) {
  const overlay = document.getElementById("lightbox-overlay");
  const img = document.getElementById("lightbox-img");
  const cap = document.getElementById("lightbox-caption");
  if (!overlay) return;
  img.src = imgUrl;
  img.alt = caption;
  cap.textContent = caption;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
};

window.closeLightbox = function () {
  const overlay = document.getElementById("lightbox-overlay");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
};