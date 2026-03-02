// ============================================
//  admin.js
//  Admin Login + Dashboard
//  Uses Cloudinary for image uploads
//  Bageshwar Bala Ji Sundarkand Mandal
// ============================================

import {
  auth,
  db,
  ADMIN_EMAIL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET
} from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
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
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─────────────────────────────────────────────
// Page Detection
// ─────────────────────────────────────────────
const isLoginPage = window.location.pathname.includes("admin-login.html");
const isDashboardPage = window.location.pathname.includes("admin-dashboard.html");

// ─────────────────────────────────────────────
// Cloudinary Upload Helper Function
// ─────────────────────────────────────────────
async function uploadImageToCloudinary(file) {
  // Show progress to user
  showAdminToast("📤 Uploading image... please wait", "info");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error("Cloudinary upload failed with status: " + response.status);
  }

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error("No URL returned from Cloudinary");
  }

  return data.secure_url;
}

// ─────────────────────────────────────────────
// Auth State Observer
// ─────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (isDashboardPage) {
    if (!user || user.email !== ADMIN_EMAIL) {
      // Not logged in — send to login page
      window.location.href = "admin-login.html";
    } else {
      // Logged in — show admin email and start dashboard
      const emailEl = document.getElementById("admin-email-display");
      if (emailEl) emailEl.textContent = user.email;
      initDashboard();
    }
  }

  if (isLoginPage && user && user.email === ADMIN_EMAIL) {
    // Already logged in — go to dashboard
    window.location.href = "admin-dashboard.html";
  }
});

// ─────────────────────────────────────────────
// LOGIN PAGE LOGIC
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Handle login form
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const errEl = document.getElementById("login-error");
      const btn = document.getElementById("login-submit-btn");

      // Reset error
      errEl.style.display = "none";
      btn.disabled = true;
      btn.textContent = "Logging in...";

      // Check if email is admin email
      if (email !== ADMIN_EMAIL) {
        errEl.textContent = "⚠️ You are not authorized as admin.";
        errEl.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Login";
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Success — redirect to dashboard
        window.location.href = "admin-dashboard.html";
      } catch (error) {
        console.error("Login error:", error);
        errEl.textContent = "❌ Wrong email or password. Try again.";
        errEl.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Login";
      }
    });
  }

  // Handle logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "admin-login.html";
      } catch (err) {
        console.error("Logout error:", err);
      }
    });
  }
});

// ─────────────────────────────────────────────
// DASHBOARD INIT
// ─────────────────────────────────────────────
function initDashboard() {
  // Load default tab data
  loadAdminStats();
  loadDonationsTab();

  // Setup all tab buttons
  setupTabs();

  // Attach tab click events to load data
  document.getElementById("tab-events-btn")
    ?.addEventListener("click", loadAdminEvents);
  document.getElementById("tab-pastlives-btn")
    ?.addEventListener("click", loadAdminPastLives);
  document.getElementById("tab-gallery-btn")
    ?.addEventListener("click", loadAdminGallery);
  document.getElementById("tab-members-btn")
    ?.addEventListener("click", loadAdminMembers);
  document.getElementById("tab-settings-btn")
    ?.addEventListener("click", loadAdminSettings);
  document.getElementById("tab-sundarkand-btn")
    ?.addEventListener("click", loadAdminSundarkand);

  // Attach form submit handlers
  document.getElementById("add-event-form")
    ?.addEventListener("submit", handleAddEvent);
  document.getElementById("add-pastlive-form")
    ?.addEventListener("submit", handleAddPastLive);
  document.getElementById("add-gallery-form")
    ?.addEventListener("submit", handleAddGallery);
  document.getElementById("add-member-form")
    ?.addEventListener("submit", handleAddMember);
  document.getElementById("save-settings-form")
    ?.addEventListener("submit", handleSaveSettings);
  document.getElementById("add-verse-form")
    ?.addEventListener("submit", handleAddVerse);
}

// ─────────────────────────────────────────────
// TAB SWITCHING SYSTEM
// ─────────────────────────────────────────────
function setupTabs() {
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  const tabPanes = document.querySelectorAll(".admin-tab-pane");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active from all tabs and panes
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      // Add active to clicked tab and matching pane
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

// ─────────────────────────────────────────────
// STATS CARDS
// ─────────────────────────────────────────────
async function loadAdminStats() {
  try {
    // Get all donations
    const donSnap = await getDocs(collection(db, "donations"));
    let pending = 0;
    let verifiedTotal = 0;
    donSnap.forEach((d) => {
      const data = d.data();
      if (data.status === "pending") pending++;
      if (data.status === "verified") verifiedTotal += data.amount || 0;
    });

    // Get events count
    const evSnap = await getDocs(collection(db, "events"));
    // Get members count
    const memSnap = await getDocs(collection(db, "members"));

    // Update stat cards
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl("stat-pending", pending);
    setEl("stat-total", "₹" + verifiedTotal.toLocaleString("en-IN"));
    setEl("stat-events-count", evSnap.size);
    setEl("stat-members-count", memSnap.size);
  } catch (err) {
    console.error("Stats error:", err);
  }
}

// ─────────────────────────────────────────────
// DONATIONS TAB
// ─────────────────────────────────────────────
async function loadDonationsTab() {
  const tbody = document.getElementById("admin-donations-tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; padding:2rem;">
        <div class="spinner" style="margin:0 auto;"></div>
      </td>
    </tr>`;

  try {
    // Fetch all donations — sorted by date descending
    const q = query(collection(db, "donations"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.5rem;">No donations found.</td></tr>`;
      return;
    }

    let html = "";
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const id = docSnap.id;
      let dateStr = "N/A";
      if (d.date && d.date.toDate) {
        dateStr = d.date.toDate().toLocaleDateString("en-IN");
      }

      const statusBadge = d.status === "verified"
        ? `<span style="background:#27ae60; color:white; padding:2px 8px; border-radius:10px; font-size:0.8rem;">✔ Verified</span>`
        : `<span style="background:#f39c12; color:white; padding:2px 8px; border-radius:10px; font-size:0.8rem;">⏳ Pending</span>`;

      const actionBtn = d.status === "pending"
        ? `<button
             onclick="verifyDonation('${id}')"
             style="background:#27ae60; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; margin-right:4px;">
             ✔ Verify
           </button>`
        : `<span style="color:#27ae60; font-weight:bold;">✔ Done</span> `;

      html += `
        <tr>
          <td>${dateStr}</td>
          <td>${d.name || "N/A"} ${d.anonymous ? "<em style='color:#999;'>(Anon)</em>" : ""}</td>
          <td><strong>₹ ${(d.amount || 0).toLocaleString("en-IN")}</strong></td>
          <td>${d.note || "—"}</td>
          <td>${d.mode || "—"}</td>
          <td>${statusBadge}</td>
          <td>
            ${actionBtn}
            <button
              onclick="deleteDonationRow('${id}')"
              style="background:#e74c3c; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">
              🗑
            </button>
          </td>
        </tr>`;
    });

    tbody.innerHTML = html;
  } catch (err) {
    console.error("Donations tab error:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error loading donations. Check console.</td></tr>`;
  }
}

// Verify donation
window.verifyDonation = async function (id) {
  if (!confirm("Verify this donation?")) return;
  try {
    await updateDoc(doc(db, "donations", id), { status: "verified" });
    showAdminToast("✅ Donation verified!", "success");
    loadDonationsTab();
    loadAdminStats();
  } catch (err) {
    console.error(err);
    showAdminToast("❌ Error verifying.", "error");
  }
};

// Delete donation
window.deleteDonationRow = async function (id) {
  if (!confirm("Delete this donation record permanently?")) return;
  try {
    await deleteDoc(doc(db, "donations", id));
    showAdminToast("🗑 Deleted.", "success");
    loadDonationsTab();
    loadAdminStats();
  } catch (err) {
    console.error(err);
    showAdminToast("❌ Error deleting.", "error");
  }
};

// ─────────────────────────────────────────────
// EVENTS TAB
// ─────────────────────────────────────────────
async function loadAdminEvents() {
  const listEl = document.getElementById("admin-events-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="spinner"></div>`;

  try {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.innerHTML = `<p style="text-align:center; color:#999;">No events added yet.</p>`;
      return;
    }

    let html = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Time</th>
              <th>Venue</th>
              <th>Organizer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>`;

    snap.forEach((d) => {
      const ev = d.data();
      let dateStr = "N/A";
      if (ev.date && ev.date.toDate) {
        dateStr = ev.date.toDate().toLocaleDateString("en-IN");
      } else if (ev.date && ev.date.seconds) {
        dateStr = new Date(ev.date.seconds * 1000).toLocaleDateString("en-IN");
      }

      html += `
        <tr>
          <td>${ev.title || "—"}</td>
          <td>${dateStr}</td>
          <td>${ev.time || "—"}</td>
          <td>${ev.templeName || "—"}</td>
          <td>${ev.organizer || "—"}</td>
          <td>
            <button
              onclick="deleteItem('events', '${d.id}', loadAdminEventsPublic)"
              style="background:#e74c3c; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">
              🗑 Delete
            </button>
          </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    listEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p style="color:red;">Error loading events.</p>`;
  }
}

async function handleAddEvent(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    const dateVal = document.getElementById("ev-date").value;

    await addDoc(collection(db, "events"), {
      title: document.getElementById("ev-title").value.trim(),
      date: new Date(dateVal),
      time: document.getElementById("ev-time").value,
      templeName: document.getElementById("ev-temple").value.trim(),
      locationText: document.getElementById("ev-location").value.trim(),
      googleMapLink: document.getElementById("ev-map").value.trim(),
      organizer: document.getElementById("ev-organizer").value.trim()
    });

    e.target.reset();
    showAdminToast("✅ Event added!", "success");
    loadAdminEvents();
    loadAdminStats();
  } catch (err) {
    console.error(err);
    showAdminToast("❌ Failed to add event.", "error");
  }

  btn.disabled = false;
  btn.textContent = "➕ Add Event";
}

// ─────────────────────────────────────────────
// PAST LIVES TAB
// ─────────────────────────────────────────────
async function loadAdminPastLives() {
  const listEl = document.getElementById("admin-pastlives-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="spinner"></div>`;

  try {
    const q = query(collection(db, "pastLives"), orderBy("date", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.innerHTML = `<p style="text-align:center; color:#999;">No recordings added yet.</p>`;
      return;
    }

    let html = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Title</th><th>Date</th><th>Link</th><th>Action</th></tr></thead>
          <tbody>`;

    snap.forEach((d) => {
      const pl = d.data();
      let dateStr = pl.date && pl.date.toDate
        ? pl.date.toDate().toLocaleDateString("en-IN")
        : "N/A";

      html += `
        <tr>
          <td>${pl.title || "—"}</td>
          <td>${dateStr}</td>
          <td>
            <a href="${pl.youtubeLink}" target="_blank"
               style="color:var(--saffron-dark); font-weight:600;">
              ▶ Watch
            </a>
          </td>
          <td>
            <button
              onclick="deleteItem('pastLives', '${d.id}', loadAdminPastLivesPublic)"
              style="background:#e74c3c; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">
              🗑 Delete
            </button>
          </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    listEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p style="color:red;">Error loading recordings.</p>`;
  }
}

async function handleAddPastLive(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    await addDoc(collection(db, "pastLives"), {
      title: document.getElementById("pl-title").value.trim(),
      youtubeLink: document.getElementById("pl-link").value.trim(),
      date: new Date(document.getElementById("pl-date").value)
    });

    e.target.reset();
    showAdminToast("✅ Recording added!", "success");
    loadAdminPastLives();
  } catch (err) {
    console.error(err);
    showAdminToast("❌ Failed to add recording.", "error");
  }

  btn.disabled = false;
  btn.textContent = "➕ Add Recording";
}

// ─────────────────────────────────────────────
// GALLERY TAB — Uses Cloudinary
// ─────────────────────────────────────────────
async function loadAdminGallery() {
  const listEl = document.getElementById("admin-gallery-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="spinner"></div>`;

  try {
    const q = query(collection(db, "gallery"), orderBy("date", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.innerHTML = `<p style="text-align:center; color:#999;">No images uploaded yet.</p>`;
      return;
    }

    let html = `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:1rem; margin-top:1rem;">`;

    snap.forEach((d) => {
      const g = d.data();
      html += `
        <div style="background:#fff; border:2px solid var(--saffron-light); border-radius:8px; overflow:hidden; text-align:center;">
          <img
            src="${g.imageUrl}"
            alt="${g.caption || ''}"
            style="width:100%; height:130px; object-fit:cover;"
            loading="lazy"
          />
          <div style="padding:0.5rem;">
            <p style="font-size:0.82rem; color:var(--text-main); margin-bottom:0.5rem;">${g.caption || "No caption"}</p>
            <button
              onclick="deleteItem('gallery', '${d.id}', loadAdminGalleryPublic)"
              style="background:#e74c3c; color:white; border:none; padding:3px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;">
              🗑 Delete
            </button>
          </div>
        </div>`;
    });

    html += `</div>`;
    listEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p style="color:red;">Error loading gallery.</p>`;
  }
}

async function handleAddGallery(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const fileInput = document.getElementById("gallery-file");
  const caption = document.getElementById("gallery-caption").value.trim();

  if (!fileInput.files.length) {
    showAdminToast("⚠️ Please select an image file.", "error");
    return;
  }

  const file = fileInput.files[0];

  // Check file is an image
  if (!file.type.startsWith("image/")) {
    showAdminToast("⚠️ Only image files are allowed.", "error");
    return;
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAdminToast("⚠️ Image must be smaller than 5MB.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Uploading...";

  try {
    // Step 1: Upload to Cloudinary
    const imageUrl = await uploadImageToCloudinary(file);

    // Step 2: Save URL and caption to Firestore
    await addDoc(collection(db, "gallery"), {
      imageUrl,
      caption,
      date: serverTimestamp()
    });

    e.target.reset();
    showAdminToast("✅ Image uploaded successfully!", "success");
    loadAdminGallery();
  } catch (err) {
    console.error("Gallery upload error:", err);
    showAdminToast("❌ Upload failed. Check Cloudinary settings.", "error");
  }

  btn.disabled = false;
  btn.textContent = "📤 Upload Image";
}

// ─────────────────────────────────────────────
// MEMBERS TAB — Uses Cloudinary
// ─────────────────────────────────────────────
async function loadAdminMembers() {
  const listEl = document.getElementById("admin-members-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="spinner"></div>`;

  try {
    const snap = await getDocs(collection(db, "members"));

    if (snap.empty) {
      listEl.innerHTML = `<p style="text-align:center; color:#999;">No members added yet.</p>`;
      return;
    }

    let html = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Photo</th><th>Name</th><th>Position</th><th>Contact</th><th>Action</th></tr></thead>
          <tbody>`;

    snap.forEach((d) => {
      const m = d.data();
      const photoHtml = m.photoUrl
        ? `<img src="${m.photoUrl}" style="width:45px; height:45px; border-radius:50%; object-fit:cover;">`
        : `<div style="width:45px; height:45px; border-radius:50%; background:var(--saffron-light); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">👤</div>`;

      html += `
        <tr>
          <td>${photoHtml}</td>
          <td>${m.name || "—"}</td>
          <td>${m.position || "—"}</td>
          <td>${m.contact || "—"}</td>
          <td>
            <button
              onclick="deleteItem('members', '${d.id}', loadAdminMembersPublic)"
              style="background:#e74c3c; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">
              🗑 Delete
            </button>
          </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    listEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p style="color:red;">Error loading members.</p>`;
  }
}

async function handleAddMember(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const fileInput = document.getElementById("member-photo");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    let photoUrl = "";

    // Upload photo to Cloudinary if one was selected
    if (fileInput.files.length) {
      const file = fileInput.files[0];
      if (file.type.startsWith("image/")) {
        photoUrl = await uploadImageToCloudinary(file);
      }
    }

    await addDoc(collection(db, "members"), {
      name: document.getElementById("member-name").value.trim(),
      position: document.getElementById("member-position").value.trim(),
      contact: document.getElementById("member-contact").value.trim(),
      photoUrl
    });

    e.target.reset();
    showAdminToast("✅ Member added!", "success");
    loadAdminMembers();
    loadAdminStats();
  } catch (err) {
    console.error(err);
    showAdminToast("❌ Failed to add member.", "error");
  }

  btn.disabled = false;
  btn.textContent = "➕ Add Member";
}

// ─────────────────────────────────────────────
// SETTINGS TAB
// ─────────────────────────────────────────────
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
  } catch (err) {
    console.error("Settings load error:", err);
  }
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const msg = document.getElementById("settings-announcement").value.trim();
    const liveLink = document.getElementById("settings-live-link").value.trim();

    await setDoc(doc(db, "settings", "announcement"), { message: msg });
    await setDoc(doc(db, "settings", "live"), { currentLiveLink: liveLink });

    showAdminToast("✅ Settings saved successfully!", "success");
  } catch (err) {
    console.error(err);
    showAdminToast("❌ Failed to save settings.", "error");
  }

  btn.disabled = false;
  btn.textContent = "💾 Save Settings";
}

// ─────────────────────────────────────────────
// SUNDARKAND TEXT TAB
// ─────────────────────────────────────────────
async function loadAdminSundarkand() {
  const listEl = document.getElementById("admin-sundarkand-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="spinner"></div>`;

  try {
    const q = query(collection(db, "sundarkandText"), orderBy("order", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.innerHTML = `<p style="text-align:center; color:#999;">No verses added yet.</p>`;
      return;
    }

    let html = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Order #</th><th>Sanskrit (Preview)</th><th>Action</th></tr></thead>
          <tbody>`;

    snap.forEach((d) => {
      const v = d.data();
      const preview = (v.sanskrit || "").substring(0, 80) + "...";

      html += `
        <tr>
          <td style="text-align:center; font-weight:bold;">${v.order}</td>
          <td style="font-size:0.85rem;" title="${v.sanskrit || ""}">${preview}</td>
          <td>
            <button
              onclick="deleteItem('sundarkandText', '${d.id}', loadAdminSundarkandPublic)"
              style="background:#e74c3c; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">
              🗑 Delete
            </button>
          </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    listEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p style="color:red;">Error loading verses.</p>`;
  }
}

async function handleAddVerse(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    await addDoc(collection(db, "sundarkandText"), {
      order: parseInt(document.getElementById("verse-order").value),
      sanskrit: document.getElementById("verse-sanskrit").value.trim(),
      hindiMeaning: document.getElementById("verse-hindi").value.trim()
    });

    e.target.reset();
    showAdminToast("✅ Verse added!", "success");
    loadAdminSundarkand();
  } catch (err) {
    console.error(err);
    showAdminToast("❌ Failed to add verse.", "error");
  }

  btn.disabled = false;
  btn.textContent = "➕ Add Verse";
}

// ─────────────────────────────────────────────
// GENERIC DELETE HELPER
// ─────────────────────────────────────────────
window.deleteItem = async function (collectionName, docId, refreshCallback) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  try {
    await deleteDoc(doc(db, collectionName, docId));
    showAdminToast("🗑 Item deleted.", "success");
    if (refreshCallback) refreshCallback();
    loadAdminStats();
  } catch (err) {
    console.error("Delete error:", err);
    showAdminToast("❌ Failed to delete.", "error");
  }
};

// Expose refresh functions globally so delete buttons can call them
window.loadAdminEventsPublic = loadAdminEvents;
window.loadAdminPastLivesPublic = loadAdminPastLives;
window.loadAdminGalleryPublic = loadAdminGallery;
window.loadAdminMembersPublic = loadAdminMembers;
window.loadAdminSundarkandPublic = loadAdminSundarkand;

// ─────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────
function showAdminToast(message, type = "success") {
  let toast = document.getElementById("admin-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "admin-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      font-size: 0.95rem;
      z-index: 9999;
      max-width: 320px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.3);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.background =
    type === "error" ? "#e74c3c" :
    type === "info" ? "#2980b9" : "#27ae60";

  // Show
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  }, 10);

  // Hide after 4 seconds
  setTimeout(() => {
    toast.style.transform = "translateY(100px)";
    toast.style.opacity = "0";
  }, 4000);
}