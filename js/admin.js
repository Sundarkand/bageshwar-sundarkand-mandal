// ============================================
//  admin.js — Admin Login + Dashboard Logic
// ============================================

import { auth, db, storage, ADMIN_EMAIL } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const isLoginPage = window.location.pathname.includes("admin-login.html");
const isDashboardPage = window.location.pathname.includes("admin-dashboard.html");

// ============================================
//  AUTH STATE OBSERVER
// ============================================
onAuthStateChanged(auth, (user) => {
  if (isDashboardPage) {
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.href = "admin-login.html";
    } else {
      initDashboard();
    }
  }
  if (isLoginPage && user && user.email === ADMIN_EMAIL) {
    window.location.href = "admin-dashboard.html";
  }
});

// ============================================
//  ADMIN LOGIN PAGE
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const pass = document.getElementById("login-password").value;
      const errEl = document.getElementById("login-error");
      const submitBtn = document.getElementById("login-submit-btn");

      errEl.style.display = "none";
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";

      // Only allow admin email
      if (email !== ADMIN_EMAIL) {
        errEl.textContent = "⚠️ You are not authorized as admin.";
        errEl.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.location.href = "admin-dashboard.html";
      } catch (error) {
        errEl.textContent = "❌ Invalid email or password.";
        errEl.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
      }
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "admin-login.html";
    });
  }
});

// ============================================
//  ADMIN DASHBOARD INIT
// ============================================
function initDashboard() {
  loadAdminStats();
  setupTabs();
  loadPendingDonations();

  // Tab-specific loaders
  document
    .getElementById("tab-events-btn")
    ?.addEventListener("click", loadAdminEvents);
  document
    .getElementById("tab-pastlives-btn")
    ?.addEventListener("click", loadAdminPastLives);
  document
    .getElementById("tab-gallery-btn")
    ?.addEventListener("click", loadAdminGallery);
  document
    .getElementById("tab-members-btn")
    ?.addEventListener("click", loadAdminMembers);
  document
    .getElementById("tab-settings-btn")
    ?.addEventListener("click", loadAdminSettings);
  document
    .getElementById("tab-sundarkand-btn")
    ?.addEventListener("click", loadAdminSundarkand);

  // Form Submissions
  document
    .getElementById("add-event-form")
    ?.addEventListener("submit", handleAddEvent);
  document
    .getElementById("add-pastlive-form")
    ?.addEventListener("submit", handleAddPastLive);
  document
    .getElementById("add-gallery-form")
    ?.addEventListener("submit", handleAddGallery);
  document
    .getElementById("add-member-form")
    ?.addEventListener("submit", handleAddMember);
  document
    .getElementById("save-settings-form")
    ?.addEventListener("submit", handleSaveSettings);
  document
    .getElementById("add-verse-form")
    ?.addEventListener("submit", handleAddVerse);
}

// ── Tab System ────────────────────────────────
function setupTabs() {
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  const tabPanes = document.querySelectorAll(".admin-tab-pane");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId)?.classList.add("active");
    });
  });
}

// ── Load Dashboard Stats ──────────────────────
async function loadAdminStats() {
  try {
    // Pending donations count
    const pendingSnap = await getDocs(collection(db, "donations"));
    let pending = 0;
    let totalVerified = 0;
    pendingSnap.forEach((d) => {
      if (d.data().status === "pending") pending++;
      if (d.data().status === "verified") totalVerified += d.data().amount || 0;
    });
    const elP = document.getElementById("stat-pending");
    if (elP) elP.textContent = pending;
    const elT = document.getElementById("stat-total");
    if (elT) elT.textContent = "₹" + totalVerified.toLocaleString("en-IN");

    // Events
    const evSnap = await getDocs(collection(db, "events"));
    const elE = document.getElementById("stat-events-count");
    if (elE) elE.textContent = evSnap.size;

    // Members
    const memSnap = await getDocs(collection(db, "members"));
    const elM = document.getElementById("stat-members-count");
    if (elM) elM.textContent = memSnap.size;
  } catch (e) {
    console.error("Admin stats error:", e);
  }
}

// ── Pending Donations ─────────────────────────
async function loadPendingDonations() {
  const tbody = document.getElementById("admin-donations-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7"><div class="loading-container"><div class="spinner"></div></div></td></tr>`;

  try {
    const q = query(collection(db, "donations"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No donations found.</td></tr>`;
      return;
    }

    let html = "";
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const id = docSnap.id;
      let dateStr = "";
      if (d.date && d.date.toDate) {
        dateStr = d.date.toDate().toLocaleDateString("en-IN");
      }
      html += `
        <tr>
          <td>${dateStr}</td>
          <td>${d.name || "N/A"}${d.anonymous ? " <em>(Anon)</em>" : ""}</td>
          <td><strong>₹ ${(d.amount || 0).toLocaleString("en-IN")}</strong></td>
          <td>${d.note || "—"}</td>
          <td><span class="badge badge-${d.mode === "Online" ? "online" : "offline"}">${d.mode}</span></td>
          <td><span class="badge badge-${d.status}">${d.status}</span></td>
          <td>
            ${
              d.status === "pending"
                ? `<button class="btn-success" onclick="verifyDonation('${id}')">✔ Verify</button>`
                : "<span style='color:#27ae60;'>✔ Done</span>"
            }
            <button class="btn-danger" style="margin-left:5px;" onclick="deleteDonation('${id}')">🗑</button>
          </td>
        </tr>`;
    });
    tbody.innerHTML = html;
  } catch (e) {
    console.error("Admin donations error:", e);
  }
}

// Global verify/delete for onclick in HTML
window.verifyDonation = async (id) => {
  try {
    await updateDoc(doc(db, "donations", id), { status: "verified" });
    showAdminToast("✔ Donation verified!", "success");
    loadPendingDonations();
    loadAdminStats();
  } catch (e) {
    showAdminToast("⚠️ Error verifying donation.", "error");
  }
};

window.deleteDonation = async (id) => {
  if (!confirm("Delete this donation record?")) return;
  try {
    await deleteDoc(doc(db, "donations", id));
    showAdminToast("🗑 Deleted.", "success");
    loadPendingDonations();
    loadAdminStats();
  } catch (e) {
    showAdminToast("⚠️ Delete failed.", "error");
  }
};

// ── Events ────────────────────────────────────
async function loadAdminEvents() {
  const listEl = document.getElementById("admin-events-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const snap = await getDocs(q);
    if (snap.empty) { listEl.innerHTML = "<p>No events.</p>"; return; }
    let html = `<div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>Title</th><th>Date</th><th>Venue</th><th>Actions</th></tr></thead><tbody>`;
    snap.forEach((d) => {
      const ev = d.data();
      let dateStr = ev.date && ev.date.toDate
        ? ev.date.toDate().toLocaleDateString("en-IN")
        : ev.date || "N/A";
      html += `<tr>
        <td>${ev.title}</td><td>${dateStr}</td>
        <td>${ev.templeName || ""}</td>
        <td><button class="btn-danger" onclick="deleteDoc_('events','${d.id}', loadAdminEventsPublic)">🗑 Delete</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    listEl.innerHTML = html;
  } catch (e) { listEl.innerHTML = `<div class="alert alert-error">Error loading events.</div>`; }
}

async function handleAddEvent(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const dateVal = document.getElementById("ev-date").value;
    await addDoc(collection(db, "events"), {
      title: document.getElementById("ev-title").value.trim(),
      date: new Date(dateVal),
      time: document.getElementById("ev-time").value,
      templeName: document.getElementById("ev-temple").value.trim(),
      locationText: document.getElementById("ev-location").value.trim(),
      googleMapLink: document.getElementById("ev-map").value.trim(),
      organizer: document.getElementById("ev-organizer").value.trim(),
    });
    e.target.reset();
    showAdminToast("✔ Event added!", "success");
    loadAdminEvents();
  } catch (err) {
    showAdminToast("⚠️ Failed to add event.", "error");
  }
  btn.disabled = false;
}

// ── Past Lives ────────────────────────────────
async function loadAdminPastLives() {
  const listEl = document.getElementById("admin-pastlives-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const q = query(collection(db, "pastLives"), orderBy("date", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) { listEl.innerHTML = "<p>No recordings.</p>"; return; }
    let html = `<div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>Title</th><th>Date</th><th>Link</th><th>Action</th></tr></thead><tbody>`;
    snap.forEach((d) => {
      const pl = d.data();
      let dateStr = pl.date && pl.date.toDate
        ? pl.date.toDate().toLocaleDateString("en-IN")
        : "N/A";
      html += `<tr>
        <td>${pl.title}</td><td>${dateStr}</td>
        <td><a href="${pl.youtubeLink}" target="_blank" style="color:var(--saffron-dark);">Watch ↗</a></td>
        <td><button class="btn-danger" onclick="deleteDoc_('pastLives','${d.id}', loadAdminPastLivesPublic)">🗑</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    listEl.innerHTML = html;
  } catch (e) { listEl.innerHTML = `<div class="alert alert-error">Error.</div>`; }
}

async function handleAddPastLive(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    await addDoc(collection(db, "pastLives"), {
      title: document.getElementById("pl-title").value.trim(),
      youtubeLink: document.getElementById("pl-link").value.trim(),
      date: new Date(document.getElementById("pl-date").value),
    });
    e.target.reset();
    showAdminToast("✔ Recording added!", "success");
    loadAdminPastLives();
  } catch (err) {
    showAdminToast("⚠️ Failed.", "error");
  }
  btn.disabled = false;
}

// ── Gallery Upload ────────────────────────────
async function handleAddGallery(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const fileInput = document.getElementById("gallery-file");
  const caption = document.getElementById("gallery-caption").value.trim();

  if (!fileInput.files.length) {
    showAdminToast("Please select an image file.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Uploading...";

  try {
    const file = fileInput.files[0];
    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "gallery"), {
      imageUrl: downloadUrl,
      caption,
      date: serverTimestamp(),
    });

    e.target.reset();
    showAdminToast("✔ Image uploaded!", "success");
    loadAdminGallery();
  } catch (err) {
    console.error("Gallery upload error:", err);
    showAdminToast("⚠️ Upload failed.", "error");
  }
  btn.disabled = false;
  btn.textContent = "Upload Image";
}

async function loadAdminGallery() {
  const listEl = document.getElementById("admin-gallery-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const q = query(collection(db, "gallery"), orderBy("date", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) { listEl.innerHTML = "<p>No images.</p>"; return; }
    let html = `<div style="display:grid; grid-template-columns: repeat(auto-fill,minmax(150px,1fr)); gap:1rem;">`;
    snap.forEach((d) => {
      const g = d.data();
      html += `
        <div style="text-align:center;">
          <img src="${g.imageUrl}" alt="${g.caption}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; border:2px solid var(--saffron);">
          <p style="font-size:0.8rem; margin:4px 0;">${g.caption}</p>
          <button class="btn-danger" style="font-size:0.75rem; padding:2px 8px;" onclick="deleteDoc_('gallery','${d.id}', loadAdminGalleryPublic)">🗑 Delete</button>
        </div>`;
    });
    html += `</div>`;
    listEl.innerHTML = html;
  } catch (e) { listEl.innerHTML = `<div class="alert alert-error">Error.</div>`; }
}

// ── Members ────────────────────────────────────
async function loadAdminMembers() {
  const listEl = document.getElementById("admin-members-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const snap = await getDocs(collection(db, "members"));
    if (snap.empty) { listEl.innerHTML = "<p>No members.</p>"; return; }
    let html = `<div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>Name</th><th>Position</th><th>Contact</th><th>Action</th></tr></thead><tbody>`;
    snap.forEach((d) => {
      const m = d.data();
      html += `<tr>
        <td>${m.name}</td><td>${m.position}</td><td>${m.contact || "N/A"}</td>
        <td><button class="btn-danger" onclick="deleteDoc_('members','${d.id}', loadAdminMembersPublic)">🗑</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    listEl.innerHTML = html;
  } catch (e) { listEl.innerHTML = `<div class="alert alert-error">Error.</div>`; }
}

async function handleAddMember(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const fileInput = document.getElementById("member-photo");
    let photoUrl = "";
    if (fileInput.files.length) {
      const file = fileInput.files[0];
      const storageRef = ref(storage, `members/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      photoUrl = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, "members"), {
      name: document.getElementById("member-name").value.trim(),
      position: document.getElementById("member-position").value.trim(),
      contact: document.getElementById("member-contact").value.trim(),
      photoUrl,
    });
    e.target.reset();
    showAdminToast("✔ Member added!", "success");
    loadAdminMembers();
  } catch (err) {
    showAdminToast("⚠️ Failed.", "error");
  }
  btn.disabled = false;
}

// ── Settings ───────────────────────────────────
async function loadAdminSettings() {
  try {
    const annSnap = await getDoc(doc(db, "settings", "announcement"));
    if (annSnap.exists()) {
      const el = document.getElementById("settings-announcement");
      if (el) el.value = annSnap.data().message || "";
    }
    const liveSnap = await getDoc(doc(db, "settings", "live"));
    if (liveSnap.exists()) {
      const el = document.getElementById("settings-live-link");
      if (el) el.value = liveSnap.data().currentLiveLink || "";
    }
  } catch (e) {}
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const msg = document.getElementById("settings-announcement").value.trim();
    const liveLink = document.getElementById("settings-live-link").value.trim();
    await setDoc(doc(db, "settings", "announcement"), { message: msg });
    await setDoc(doc(db, "settings", "live"), { currentLiveLink: liveLink });
    showAdminToast("✔ Settings saved!", "success");
  } catch (err) {
    showAdminToast("⚠️ Save failed.", "error");
  }
  btn.disabled = false;
}

// ── Sundarkand Text ────────────────────────────
async function loadAdminSundarkand() {
  const listEl = document.getElementById("admin-sundarkand-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const q = query(collection(db, "sundarkandText"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    if (snap.empty) { listEl.innerHTML = "<p>No verses.</p>"; return; }
    let html = `<div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>#</th><th>Sanskrit (Preview)</th><th>Action</th></tr></thead><tbody>`;
    snap.forEach((d) => {
      const v = d.data();
      const preview = (v.sanskrit || "").substring(0, 60) + "...";
      html += `<tr>
        <td>${v.order}</td>
        <td title="${v.sanskrit || ""}">${preview}</td>
        <td><button class="btn-danger" onclick="deleteDoc_('sundarkandText','${d.id}', loadAdminSundarkandPublic)">🗑</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    listEl.innerHTML = html;
  } catch (e) { listEl.innerHTML = `<div class="alert alert-error">Error.</div>`; }
}

async function handleAddVerse(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    await addDoc(collection(db, "sundarkandText"), {
      order: parseInt(document.getElementById("verse-order").value),
      sanskrit: document.getElementById("verse-sanskrit").value.trim(),
      hindiMeaning: document.getElementById("verse-hindi").value.trim(),
    });
    e.target.reset();
    showAdminToast("✔ Verse added!", "success");
    loadAdminSundarkand();
  } catch (err) {
    showAdminToast("⚠️ Failed.", "error");
  }
  btn.disabled = false;
}

// ── Generic Delete Helper ─────────────────────
window.deleteDoc_ = async (collectionName, id, refreshFn) => {
  if (!confirm("Delete this item?")) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
    showAdminToast("🗑 Deleted.", "success");
    if (refreshFn) refreshFn();
    loadAdminStats();
  } catch (e) {
    showAdminToast("⚠️ Delete failed.", "error");
  }
};

// Public reload references for delete callbacks
window.loadAdminEventsPublic = loadAdminEvents;
window.loadAdminPastLivesPublic = loadAdminPastLives;
window.loadAdminGalleryPublic = loadAdminGallery;
window.loadAdminMembersPublic = loadAdminMembers;
window.loadAdminSundarkandPublic = loadAdminSundarkand;

// ── Admin Toast ───────────────────────────────
function showAdminToast(message, type = "success") {
  let toast = document.getElementById("admin-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "admin-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = type === "error" ? "#c0392b" : "#27ae60";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}