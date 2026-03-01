// ============================================
//  donation.js — Donation Page Logic
// ============================================

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  loadAnnouncement();
  fetchVerifiedDonations();
  setupDonationForm();
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

// ── Donation Form Submission ──────────────────
function setupDonationForm() {
  const form = document.getElementById("donation-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submit-donation-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const name = document.getElementById("donor-name").value.trim();
    const amount = parseFloat(document.getElementById("donor-amount").value);
    const note = document.getElementById("donor-note").value.trim();
    const mode = document.getElementById("donor-mode").value;
    const anonymous = document.getElementById("donor-anonymous").checked;

    // Basic validation
    if (!name || !amount || amount <= 0) {
      showToast("Please fill in all required fields correctly.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Donation 🙏";
      return;
    }

    try {
      await addDoc(collection(db, "donations"), {
        name,
        amount,
        note,
        mode,
        anonymous,
        status: "pending",
        date: serverTimestamp(),
      });

      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Donation 🙏";

      if (mode === "Online") {
        openQrModal(amount);
      } else {
        showToast(
          "🙏 Donation recorded! Awaiting admin verification.",
          "success"
        );
      }
    } catch (error) {
      console.error("Donation submit error:", error);
      showToast("⚠️ Failed to submit. Please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Donation 🙏";
    }
  });
}

// ── Fetch & Display Verified Donations ────────
async function fetchVerifiedDonations() {
  const listEl = document.getElementById("public-donations-list");
  const totalEl = document.getElementById("total-collection");

  listEl.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;

  try {
    const q = query(
      collection(db, "donations"),
      where("status", "==", "verified"),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    let totalAmount = 0;
    let html = "";

    if (snapshot.empty) {
      listEl.innerHTML = `<p class="text-muted text-center mt-2">No donations recorded yet. Be the first! 🙏</p>`;
      if (totalEl) totalEl.textContent = "₹ 0";
      return;
    }

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      totalAmount += d.amount || 0;

      const displayName = d.anonymous ? "🙏 Anonymous Devotee" : "🙏 " + d.name;
      let dateStr = "";
      if (d.date && d.date.toDate) {
        dateStr = d.date.toDate().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }

      html += `
        <div class="card">
          <div class="donation-card">
            <div class="donation-card-info">
              <h4>${displayName}</h4>
              <p>
                ${dateStr ? `📅 ${dateStr} &nbsp;|&nbsp;` : ""}
                <span class="badge badge-${d.mode === "Online" ? "online" : "offline"}">${d.mode}</span>
              </p>
              ${d.note ? `<p style="margin-top:0.3rem; font-style:italic; color:var(--text-muted);">"${d.note}"</p>` : ""}
            </div>
            <div class="donation-card-amount">₹ ${(d.amount || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>`;
    });

    listEl.innerHTML = html;
    if (totalEl)
      totalEl.textContent = "₹ " + totalAmount.toLocaleString("en-IN");
  } catch (error) {
    console.error("Donations fetch error:", error);
    listEl.innerHTML = `<div class="alert alert-error">⚠️ Failed to load donations.</div>`;
  }
}

// ── QR Modal ──────────────────────────────────
function openQrModal(amount) {
  const modal = document.getElementById("qr-modal");
  const amountEl = document.getElementById("qr-amount");
  if (modal) {
    if (amountEl) amountEl.textContent = "₹ " + amount.toLocaleString("en-IN");
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

window.closeQrModal = function () {
  const modal = document.getElementById("qr-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    showToast("🙏 Please wait for admin to verify your payment.", "success");
    fetchVerifiedDonations();
  }
};

// ── Toast Notification ─────────────────────────
function showToast(message, type = "success") {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background =
    type === "error" ? "#c0392b" : "var(--red-dark)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}