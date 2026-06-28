// ============================================
// KONFIGURASI WAKTU PEMBUKAAN
// ============================================
const OPEN_TIME = new Date("2027-06-27T10:41:00+07:00");

// ============================================
// DOM ELEMENTS
// ============================================
const lockDiv = document.getElementById("lock");
const appDiv = document.getElementById("app");
const countdownContainer = document.getElementById("countdown-container");

const searchForm = document.getElementById("searchForm");
const nisnInput = document.getElementById("nisnInput");
const btnCek = document.getElementById("btnCek");

const resultDiv = document.getElementById("result");
const finalMessage = document.getElementById("final-message");
const countdownSub = document.getElementById("countdownSub");

// Navbar (hamburger) mobile toggle
const navMenu = document.getElementById("nav-menu");
const hamburger = document.getElementById("hamburger");

let countdownInterval = null;

// ============================================
// UTILITAS
// ============================================
function setLocked(lock) {
    if (nisnInput) nisnInput.disabled = lock;
    if (btnCek) btnCek.disabled = lock;
}

function updateTimeDisplay(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value.toString().padStart(2, "0");
    }
}

// ============================================
// NAVBAR (HAMBURGER) MOBILE TOGGLE
// ============================================
function initNavbarToggle() {
    if (!navMenu || !hamburger) return;

    const toggleMenu = () => {
        navMenu.classList.toggle("active");
    };

    hamburger.addEventListener("click", toggleMenu);

    // Tutup menu saat klik link navigasi
    navMenu.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
            navMenu.classList.remove("active");
        });
    });

    // Pastikan menu tidak "nyangkut" saat pindah ke desktop
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            navMenu.classList.remove("active");
        }
    });
}


// ============================================
// INISIALISASI
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 App initialized");
    console.log(
        "📅 Target:",
        OPEN_TIME.toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
        })
    );

    initNavbarToggle();
    initCountdown();
    initSearchForm();
});

// ============================================
// COUNTDOWN
// ============================================
function initCountdown() {
    const now = new Date();

    if (now < OPEN_TIME) {
        setLocked(true);

        if (countdownSub) {
            countdownSub.textContent =
                "Menu Cek akan dibuka pada waktu yang ditentukan";
        }

        countdownContainer.style.display = "block";

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    } else {
        setLocked(false);
        showApp();
    }
}

function updateCountdown() {
    const now = Date.now();
    const diff = OPEN_TIME.getTime() - now;

    if (diff <= 0) {
        stopCountdown();

        setLocked(false);

        if (countdownSub) {
            countdownSub.textContent = "";
        }

        countdownContainer.style.transition = "all .7s ease";
        countdownContainer.style.opacity = "0";
        countdownContainer.style.transform = "translateY(-15px)";

        setTimeout(() => {
            countdownContainer.style.display = "none";
            showApp();
        }, 700);

        return;
    }

    const totalSeconds = Math.floor(diff / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    updateTimeDisplay("days", days);
    updateTimeDisplay("hours", hours);
    updateTimeDisplay("minutes", minutes);
    updateTimeDisplay("seconds", seconds);

    if (countdownSub) {
        countdownSub.textContent =
            "Menu Cek akan dibuka pada waktu yang ditentukan";
    }

    if (diff < 5 * 60 * 1000) {
        addUrgentEffect();
    }

    if (
        days === 0 &&
        hours === 0 &&
        minutes === 0 &&
        seconds < 60
    ) {
        addFlashEffect();
    }
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// ============================================
// EFEK COUNTDOWN
// ============================================
function addUrgentEffect() {
    document.querySelectorAll(".time-box").forEach((box) => {
        box.style.animation = "pulse .8s infinite";
        box.style.background = "rgba(255,107,107,.9)";
        box.style.transform = "scale(1.05)";
        box.style.transition = "all .3s ease";
    });
}

function addFlashEffect() {
    document.querySelectorAll(".time-box").forEach((box) => {
        box.style.animation = "pulse .3s infinite alternate";
        box.style.boxShadow = "0 0 20px rgba(255,0,0,.8)";
    });
}

// ============================================
// TAMPILKAN APLIKASI
// ============================================
function showApp() {
    if (lockDiv) {
        lockDiv.style.display = "none";
    }

    appDiv.style.display = "block";
    appDiv.style.opacity = "1";
    appDiv.style.transform = "scale(1)";

    setLocked(false);

    if (nisnInput) {
        nisnInput.focus();
    }
}

// ============================================
// FORM PENCARIAN
// ============================================
function initSearchForm() {
    if (!searchForm) return;

    searchForm.addEventListener("submit", handleSearch);

    nisnInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            handleSearch(e);
        }
    });
}

function handleSearch(e) {
    e.preventDefault();

    const nisn = nisnInput.value.trim();

    if (!SiswaDB.isValidNISN(nisn)) {
        showResult(
            "❌ NISN tidak valid. Harus terdiri dari 10 digit angka.",
            "not-found"
        );
        return;
    }

    showResult("🔍 Mencari data siswa...", "loading");

    setTimeout(() => {
        const siswa = SiswaDB.findSiswa(nisn);

        if (siswa) {
            const message =
                siswa.status === "LULUS"
                    ? `
<div class="result-title">🎉 SELAMAT!</div>
<div class="result-name"><strong>${siswa.nama}</strong></div>
<div class="result-status">STATUS KELULUSAN :</div>
<div class="result-status-text">${siswa.status}</div>
`
                    : `
<div class="result-title">😔 MOHON MAAF</div>
<div class="result-name"><strong>${siswa.nama}</strong></div>
<div class="result-status">STATUS KELULUSAN :</div>
<div class="result-status-text">${siswa.status}</div>
`;

            showResult(
                message,
                siswa.status.toLowerCase().replace(" ", "-")
            );
        } else {
            showResult(
                "❌ NISN tidak ditemukan.</br>Periksa kembali atau hubungi pihak sekolah.",
                "not-found"
            );
        }
    }, 2000);
}

function showResult(message, className) {
    resultDiv.innerHTML = message;
    resultDiv.className = `result ${className}`;
}

// ============================================
// CLEANUP
// ============================================
window.addEventListener("beforeunload", () => {
    stopCountdown();
});
