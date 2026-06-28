const teks = (window.PENGUMUMAN_TEKS || `🎉 Congrats, kamu lolos!\nSekarang kamu resmi jadi bagian dari SMANDEL TJT. Semoga tiga tahun ke depan dipenuhi pengalaman seru, teman hebat, dan prestasi yang membanggakan. Let's grow together! 🚀💙 Ingat Daftar Ulang Wajib ya`);

function $(id){
  return document.getElementById(id);
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch{
    // Fallback manual
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

function initMobileNavbar(){
  const navMenu = document.getElementById('nav-menu');
  const hamburger = document.getElementById('hamburger');

  if (!navMenu || !hamburger) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu when tapping any link inside menu
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });
}

function init(){
  // Year
  const y = $('year');
  if (y) y.textContent = new Date().getFullYear();

  // Copy button
  const btn = $('btnCopy');
  const note = $('note');
  if (btn && note){
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      note.textContent = 'Menyalin...';
      const ok = await copyToClipboard(teks);
      note.textContent = ok ? 'Teks berhasil disalin.' : 'Gagal menyalin teks.';
      btn.disabled = false;
      setTimeout(() => { note.textContent = ''; }, 2200);
    });
  }

  initMobileNavbar();
}

document.addEventListener('DOMContentLoaded', init);


