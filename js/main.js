// === Redirect ke index.html jika halaman ini direload ===
(function () {
  const navEntries = performance.getEntriesByType("navigation");
  const isReload = navEntries.length > 0
    ? navEntries[0].type === "reload"
    : performance.navigation.type === 1; // fallback lama

  if (isReload && window.location.pathname.includes("undangan.html")) {
    const params = new URLSearchParams(window.location.search);
    const guest = params.get("to") || "";
    window.location.href = `index.html?to=${encodeURIComponent(guest)}&playmusic=1`;
  }
})();


// === Firebase Config ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Ganti dengan konfigurasi dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDVH5ysueARTV3vfGJajYiZB0CAn5Iny4M",
  authDomain: "undangan-iqbal-febri.firebaseapp.com",
  projectId: "undangan-iqbal-febri",
  storageBucket: "undangan-iqbal-febri.firebasestorage.app",
  messagingSenderId: "630150810479",
  appId: "1:630150810479:web:936154879a590273f2b69a"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);


// === DOM Elements ===
const loginBtn = document.getElementById("login-btn");
const rsvpForm = document.getElementById("rsvp-form");
const emailInput = rsvpForm?.querySelector('input[name="email"]');
const loginStatus = document.getElementById("login-status");
const formResponse = document.getElementById("form-response");
const loadMoreBtn = document.getElementById("load-more-btn");

let currentUser = null;

// === Firebase Auth ===
loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Login error:", error.message);
  }
});

function checkLogin() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      emailInput.value = currentUser.email;
      loginBtn.style.display = "none";
      loginStatus.innerHTML = `✅ Login sebagai: <strong>${currentUser.email}</strong>`;

    } else {
      loginStatus.innerHTML = "⚠️ Silakan login terlebih dahulu untuk mengisi RSVP.";
    }
  });
}


// === RSVP ===
rsvpForm?.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!currentUser) return alert("⚠️ Harus login dahulu!");

  const submitBtn = this.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = "Mengirim...";

  const data = Object.fromEntries(new FormData(this).entries());

  try {
    await addDoc(collection(db, "rsvp_login"), data);
    formResponse.innerText = "✅ Terima kasih!";
    this.reset();
    emailInput.value = currentUser.email;
    showComments(true);
    updateFooterStats();
  } catch (err) {
    formResponse.innerText = "❌ Gagal mengirim.";
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit";
  }
});


// === Komentar ===
let allComments = [], commentsShown = 0, commentsPerLoad = 5;

function renderComments() {
  const container = document.getElementById("comments-container");
  const nextBatch = allComments.slice(commentsShown, commentsShown + commentsPerLoad);
  nextBatch.forEach(item => {
    if (item.name && item.message) {
      container.innerHTML += `<div class="mb-3 border-bottom pb-2">
        <strong>${item.name}</strong><br><span class="text-muted">${item.message}</span>
      </div>`;
    }
  });
  commentsShown += commentsPerLoad;
  loadMoreBtn.style.display = commentsShown >= allComments.length ? "none" : "inline-block";
}

async function showComments(initial = false) {
  const q = query(collection(db, "rsvp_login"), orderBy("name"));
const snapshot = await getDocs(q);
allComments = [];
snapshot.forEach(doc => {
  const d = doc.data();
  if (d.name && d.message) allComments.push(d);
});
  commentsShown = 0;
  document.getElementById("comments-container").innerHTML = "";
  renderComments();
  if (initial && allComments.length > commentsPerLoad) {
    loadMoreBtn.style.display = "inline-block";
  }
}

loadMoreBtn?.addEventListener("click", renderComments);

// === Statistik (Final) ===
async function updateFooterStats() {
  try {
    // Ambil semua dokumen RSVP
    const snapshotStats = await getDocs(collection(db, "rsvp_login"));

    let rsvp = 0, hadir = 0, msg = 0;

    snapshotStats.forEach(doc => {
      const item = doc.data();

      // Hitung total RSVP (nama & email terisi)
      if (item.name?.trim() && item.email?.trim()) rsvp++;

      // Hitung total komentar
      if (item.message?.trim()) msg++;

      // Hitung total hadir
      if (item.attendance?.toLowerCase() === "hadir") hadir++;
    });

    // Tampilkan hasil
    document.getElementById("guest-count-number").textContent = hadir;
    document.getElementById("rsvp-count-number").textContent = rsvp;
    document.getElementById("comment-count-number").textContent = msg;

  } catch (err) {
    console.error("Gagal memuat statistik:", err);
  }
}



// === Countdown ===
function updateCountdownAll() {
  const weddingDate = new Date("2025-08-25T00:00:00").getTime();
  const now = new Date().getTime();
  const distance = weddingDate - now;

  let html = "";

  if (distance <= 0) {
    html = `<div class="text-center w-100 text-white">💍 Hari Bahagia Telah Tiba!</div>`;
  } else {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    html = `
      <div class="countdown-box"><div class="count">${days}</div><div class="label">Hari</div></div>
      <div class="countdown-box"><div class="count">${hours}</div><div class="label">Jam</div></div>
      <div class="countdown-box"><div class="count">${minutes}</div><div class="label">Menit</div></div>
      <div class="countdown-box"><div class="count">${seconds}</div><div class="label">Detik</div></div>
    `;
  }

  document.querySelectorAll(".countdown-box-wrapper").forEach(el => {
    el.innerHTML = html;
  });
}

// === Video Intro & Loop ===
function initVideoIntro() {
  const introVideo = document.getElementById("video-intro-about");
  const loopVideo = document.getElementById("video-loop-about");

  if (!introVideo || !loopVideo) return;

  // Pastikan intro autoplay
  introVideo.muted = true;
  introVideo.playsInline = true;

  introVideo.play().then(() => {
    console.log("✅ Intro berhasil dimulai");
  }).catch((err) => {
    console.warn("⚠️ Gagal autoplay video intro:", err);
  });

  // Saat intro selesai → ganti ke loop
  introVideo.onended = () => {
    introVideo.style.display = "none";
    loopVideo.style.display = "block";

    // Pastikan loop autoplay
    loopVideo.loop = true;
    loopVideo.muted = true;
    loopVideo.playsInline = true;

    loopVideo.play().then(() => {
      console.log("🔁 Video loop mulai diputar");
    }).catch((err) => {
      console.warn("⚠️ Gagal autoplay video loop:", err);
    });
  };
}



// === Musik Otomatis + Dukungan playmusic=1 ===
function initInvitationMusic() {
  const audio = document.getElementById("bg-music");
  if (!audio) return;

  audio.loop = true;
  audio.volume = 1;

  const urlParams = new URLSearchParams(window.location.search);
  const shouldPlay = urlParams.get("playmusic") === "1";

  // Fungsi unmute langsung
  const unmuteNow = () => {
    audio.muted = false;
    console.log("🔊 Musik di-unmute.");
  };

  if (shouldPlay) {
    audio.muted = false;
    audio.play().then(() => {
      console.log("🎵 Musik diputar karena playmusic=1");
    }).catch(err => {
      console.warn("🔇 Autoplay gagal walau playmusic=1:", err);
    });
  } else {
    // Mulai muted dari HTML
    audio.muted = true;
    audio.play().then(() => {
      // Coba langsung unmute kalau sudah main
      setTimeout(() => {
        unmuteNow();
      }, 300);
    }).catch(err => {
      console.warn("🔇 Autoplay gagal di mode normal:", err);
    });

    // Fallback: unmute setelah klik/scroll
    const unmuteOnUserAction = () => {
      unmuteNow();
      document.removeEventListener("click", unmuteOnUserAction);
      document.removeEventListener("scroll", unmuteOnUserAction);
    };
    document.addEventListener("click", unmuteOnUserAction);
    document.addEventListener("scroll", unmuteOnUserAction);
  }
}




// === Guest Name ===
function updateGuestName() {
  const guest = new URLSearchParams(window.location.search).get("to");
  if (guest) {
    const name = guest.replace(/\b\w/g, l => l.toUpperCase());
    document.querySelectorAll(".guest-name-text").forEach(el => {
      el.textContent = name;
    });
  }
}

// === Fungsi salin nomor rekening ===
window.copyToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("✅ Nomor berhasil disalin!");
  }).catch(err => {
    console.error("❌ Gagal menyalin:", err);
  });
}

// === Init All ===
document.addEventListener("DOMContentLoaded", () => {

    // Supabase
  checkLogin();
  showComments(true);
  updateFooterStats();

  // Timer & Video
  updateCountdownAll();
  setInterval(updateCountdownAll, 1000);
  initVideoIntro();

  // Musik & Guest name
  initInvitationMusic();
  updateGuestName();

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // === Gallery Carousel ===
  $(".gallery-carousel").owlCarousel({
    autoplay: false,
    smartSpeed: 1500,
    dots: false,
    loop: true,
    nav : true,
    navText : [
      '<i class="fa fa-angle-left" aria-hidden="true"></i>',
      '<i class="fa fa-angle-right" aria-hidden="true"></i>'
    ],
    responsive: {
      0:{ items:1 },
      576:{ items:2 },
      768:{ items:3 },
      992:{ items:4 },
      1200:{ items:5 }
    }
  });
});

