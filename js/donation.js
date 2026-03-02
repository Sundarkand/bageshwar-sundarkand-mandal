// ============================================
//  donation.js
//  Public Donation Page
//  Fixed: Removed orderBy+where combo that
//  causes Firebase Index Error
//  Bageshwar Bala Ji Sundarkand Mandal
// ============================================

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─────────────────────────────────────────────
// On Page Load
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadAnnouncement();
  loadVerifiedDonations();
  setupDonationForm();
});

// ─────────────────────────────────────────────
// Load Announcement Banner
// ─────────────────────────────────────────────
async function loadAnnouncement() {
  const el = document.getElementById("marquee-text");
  if (!el) return;
  try {
    const snap = await getDoc(doc(db, "settings", "announcement"));
    if (snap.exists() && snap.data().message) {
      el.textContent = "🚩 " + snap.data().message + " 🚩";
    } else {
      el.textContent = "🚩 जय श्री राम! बागेश्वर बाला जी सुंदरकांड मंडल 🚩";
    }
  } catch (err) {
    el.textContent = "🚩 जय श्री राम! बागेश्वर बाला जी सुंदरकांड मंडल 🚩";
  }
}

// ─────────────────────────────────────────────
// Load Verified Donations
// KEY FIX: We only use "where" — NO "orderBy"
// Then we sort manually in JavaScript
// This prevents the Firebase Index Error!
// ─────────────────────────────────────────────
async function loadVerifiedDonations() {
  const listEl = document.getElementById("public-donations-list");
  const totalEl = document.getElementById("total-collection");

  if (!listEl) return;

  // Show loading spinner
  listEl.innerHTML = `
    <div style="text-align:center; padding:2rem;">
      <div class="spinner" style="margin:0 auto 1rem;"></div>
      <p style="color:#999;">Loading donations...</p>
    </div>`;

  try {
    // FIXED: Only using "where" — no "orderBy" to avoid index error
    const q = query(
      collection(db, "donations"),
      where("status", "==", "verified")
    );

    const snapshot = await getDocs(q);

    // Put all donations into an array
    let donations = [];
    snapshot.forEach((docSnap) => {
      donations.push(docSnap.data());
    });

    // Sort by date NEWEST FIRST using plain JavaScript
    donations.sort((a, b) => {
      const timeA = a.date && a.date.seconds ? a.date.seconds : 0;
      const timeB = b.date && b.date.seconds ? b.date.seconds : 0;
      return timeB - timeA; // Descending order
    });

    // Calculate total
    let totalAmount = 0;
    donations.forEach((d) => {
      totalAmount += d.amount || 0;
    });

    // Update total display
    if (totalEl) {
      totalEl.textContent = "₹ " + totalAmount.toLocaleString("en-IN");
    }

    // Handle empty state
    if (donations.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:3rem; color:#999;">
          <div style="font-size:3rem; margin-bottom:1rem;">🙏</div>
          <p>No donations recorded yet. Be the first to donate!</p>
        </div>`;
      return;
    }

    // Build donation cards HTML
    let html = "";
    donations.forEach((d) => {
      const displayName = d.anonymous ? "🙏 Anonymous Devotee" : "🙏 " + d.name;
      let dateStr = "";
      if (d.date && d.date.toDate) {
        dateStr = d.date.toDate().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      }

      const modeBg = d.mode === "Online" ? "#2980b9" : "#7f8c8d";

      html += `
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <h4 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:0.3rem;">
                ${displayName}
              </h4>
              <p style="font-size:0.85rem; color:#777; margin-bottom:0.3rem;">
                ${dateStr ? "📅 " + dateStr + " &nbsp;|&nbsp;" : ""}
                <span style="background:${modeBg}; color:white; padding:2px 8px; border-radius:10px; font-size:0.75rem;">
                  ${d.mode || "Offline"}
                </span>
              </p>
              ${d.note
                ? `<p style="font-size:0.9rem; font-style:italic; color:#888;">"${d.note}"</p>`
                : ""}
            </div>
            <div style="font-size:1.4rem; font-weight:900; color:var(--red-dark);">
              ₹ ${(d.amount || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>`;
    });

    listEl.innerHTML = html;

  } catch (err) {
    console.error("Donations load error:", err);
    listEl.innerHTML = `
      <div style="background:#fadbd8; border-left:4px solid #e74c3c; padding:1rem; border-radius:8px;">
        <strong>⚠️ Error loading donations.</strong>
        <p style="margin-top:0.3rem; font-size:0.9rem;">Please refresh the page and try again.</p>
      </div>`;
  }
}

// ─────────────────────────────────────────────
// Donation Form Setup
// ─────────────────────────────────────────────
function setupDonationForm() {
  const form = document.getElementById("donation-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.getElementById("submit-donation-btn");
    btn.disabled = true;
    btn.textContent = "Submitting...";

    const name = document.getElementById("donor-name").value.trim();
    const amount = parseFloat(document.getElementById("donor-amount").value);
    const note = document.getElementById("donor-note").value.trim();
    const mode = document.getElementById("donor-mode").value;
    const anonymous = document.getElementById("donor-anonymous").checked;

    // Validation
    if (!name) {
      showMessage("Please enter your name.", "error");
      btn.disabled = false;
      btn.textContent = "Submit Donation 🙏";
      return;
    }

    if (!amount || amount <= 0) {
      showMessage("Please enter a valid donation amount.", "error");
      btn.disabled = false;
      btn.textContent = "Submit Donation 🙏";
      return;
    }

    try {
      // Save donation to Firestore with "pending" status
      await addDoc(collection(db, "donations"), {
        name,
        amount,
        note,
        mode,
        anonymous,
        status: "pending",
        date: serverTimestamp()
      });

      // Reset form
      form.reset();
      btn.disabled = false;
      btn.textContent = "Submit Donation 🙏";

      if (mode === "Online") {
        // Show QR modal for online payment
        openQrModal(amount);
      } else {
        showMessage(
          "🙏 Thank you! Your donation has been recorded. It will appear after admin verification.",
          "success"
        );
      }

    } catch (err) {
      console.error("Donation submit error:", err);
      showMessage("⚠️ Failed to submit donation. Please try again.", "error");
      btn.disabled = false;
      btn.textContent = "Submit Donation 🙏";
    }
  });
}

// ─────────────────────────────────────────────
// QR Modal
// ─────────────────────────────────────────────
function openQrModal(amount) {
  const modal = document.getElementById("qr-modal");
  const amountEl = document.getElementById("qr-amount");
  if (!modal) return;

  if (amountEl) amountEl.textContent = "₹ " + amount.toLocaleString("en-IN");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

window.closeQrModal = function () {
  const modal = document.getElementById("qr-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    showMessage(
      "🙏 Thank you for your donation! The admin will verify it soon.",
      "success"
    );
  }
};

// ─────────────────────────────────────────────
// Show Inline Message on Page
// ─────────────────────────────────────────────
function showMessage(text, type) {
  let msgEl = document.getElementById("donation-msg");
  if (!msgEl) {
    msgEl = document.createElement("div");
    msgEl.id = "donation-msg";
    const form = document.getElementById("donation-form");
    if (form) form.insertAdjacentElement("afterend", msgEl);
  }

  msgEl.style.cssText = `
    padding: 1rem 1.2rem;
    border-radius: 8px;
    margin: 1rem 0;
    font-weight: 600;
    border-left: 4px solid ${type === "error" ? "#e74c3c" : "#27ae60"};
    background: ${type === "error" ? "#fadbd8" : "#d5f5e3"};
    color: ${type === "error" ? "#922b21" : "#1e8449"};
  `;
  msgEl.textContent = text;

  // Auto hide after 6 seconds
  setTimeout(() => {
    if (msgEl) msgEl.textContent = "";
    msgEl.style.display = "none";
  }, 6000);
}
