// spmb-check.js
// Gunakan bersama cek_spmb.html

(function () {

  const npInput = document.getElementById('npInput');
  const btnCek = document.getElementById('btnCek');

  // Waktu pembukaan
  const openAt = new Date('2026-05-29T05:00:00+07:00').getTime();

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function setLocked(lock) {
    if (npInput) npInput.disabled = lock;
    if (btnCek) btnCek.disabled = lock;
  }

  let timer;

  function tick() {

    const now = Date.now();
    const diff = openAt - now;

    const dayEl = document.getElementById("days");
    const hourEl = document.getElementById("hours");
    const minuteEl = document.getElementById("minutes");
    const secondEl = document.getElementById("seconds");
    const subEl = document.getElementById("countdownSub");

    if (diff <= 0) {

      setLocked(false);

      const wrap = document.getElementById("countdownWrap");

      if (wrap) {
        wrap.style.transition = "all .7s ease";
        wrap.style.opacity = "0";
        wrap.style.transform = "translateY(-15px)";

        setTimeout(() => {
          wrap.style.display = "none";
        }, 700);
      }

      clearInterval(timer);
      return;
    }

    setLocked(true);

    const totalSeconds = Math.floor(diff / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (dayEl) dayEl.textContent = days;
    if (hourEl) hourEl.textContent = pad2(hours);
    if (minuteEl) minuteEl.textContent = pad2(minutes);
    if (secondEl) secondEl.textContent = pad2(seconds);

    if (subEl) {
      subEl.textContent = "Menu Cek akan dibuka pada waktu yang ditentukan";
    }
  }

  setLocked(true);

  tick();
  timer = setInterval(tick, 1000);

})();

(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function setNote(msg) {
    const el = $('note');
    if (el) el.textContent = msg;
  }

  function injectPopupStyles() {
    if (document.getElementById('spmb-popup-styles')) return;
    const style = document.createElement('style');
    style.id = 'spmb-popup-styles';
    style.textContent = `
      @keyframes spmb-popup-scale {
        0% { transform: scale(0.92); opacity: 0; }
        70% { transform: scale(1.04); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }

      .popup-card {
        animation: spmb-popup-scale 0.35s ease-out forwards;
        border-radius: 14px;
        border: 1px solid #72b88b;
        background: #f7fffb;
        box-shadow: 0 18px 45px rgba(14, 96, 75, 0.14);
        padding: 18px;
      }

      .popup-card .popup-title {
        display: inline-block;
        background: #1e8b5e;
        color: #fff;
        padding: 8px 12px;
        border-radius: 999px;
        margin-bottom: 12px;
        font-weight: 700;
      }

      .popup-card .popup-meta {
        margin-top: 12px;
        background: #e6fff2;
        border-radius: 12px;
        padding: 12px 14px;
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  function renderResult(row) {
    const result = $('result');
    if (!result) return;

    result.innerHTML = '';

    const card1 = document.createElement('div');
    card1.className = 'meta-item';
    card1.innerHTML = `
      <span class="label">Status</span>
      <span class="value">Lulus</span>
    `;

    const card2 = document.createElement('div');
    card2.className = 'meta-item';
    card2.innerHTML = `
      <span class="label">Lulus di:</span>
      <span class="value">${escapeHtml(row.sekolahLulusDi)}</span>
      <div class="note" style="margin-top:10px">${escapeHtml(row.alasan)}</div>
    `;

    const card3 = document.createElement('div');
    card3.className = 'meta-item';
    card3.innerHTML = `
      <span class="label">Nama Siswa</span>
      <span class="value">${escapeHtml(row.nama)}</span>
    `;

    const card4 = document.createElement('div');
    card4.className = 'meta-item';
    card4.innerHTML = `
      <span class="label">Tindakan Selanjutnya</span>
      <span class="value">Ikuti instruksi sekolah tujuan</span>
    `;

    result.style.gridTemplateColumns = '1fr 1fr';
    result.appendChild(card1);
    result.appendChild(card2);
    result.appendChild(card3);
    result.appendChild(card4);
  }

  function initSpmbChecker() {
    const input = $('npInput');
    const btn = $('btnCek');

    if (!input || !btn) return;

    const excelPath = 'data_spmb/data_spmb_2026.xlsx';

    let data = null; // map: { "001": { nama, asalsekolah, alasan, jalur } }
    let loading = false;

    async function loadExcelData() {
      if (data) return data;
      if (loading) return new Promise((resolve) => {
        const t = setInterval(() => {
          if (data) {
            clearInterval(t);
            resolve(data);
          }
        }, 100);
      });

      loading = true;
      const res = $('result');
      if (res) {
        res.innerHTML = '';
        res.style.gridTemplateColumns = '1fr';
        res.innerHTML = `<div class="meta-item"><span class="label">Memuat data...</span><span class="value">Mohon tunggu</span></div>`;
      }

      try {
        const resp = await fetch(excelPath, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();

        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        // Ambil semua baris sebagai array (header = baris pertama)
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

        // Normalisasi lebih longgar untuk handle header berbeda-beda
        const norm = (s) => String(s ?? '')
          .toLowerCase()
          .replaceAll(/\s+/g, ' ')
          .replaceAll(/[^a-z0-9 ]/g, '')
          .trim();
        if (!rows || rows.length < 2) {
          throw new Error('Excel kosong / format tidak dikenali');
        }

        const headerRow = rows[0] || [];

        const findIndexByAny = (needles) => {
          const h = headerRow.map(norm);
          for (const nd of needles) {
            const ndn = norm(nd);
            const idx = h.findIndex((x) => x === ndn);
            if (idx !== -1) return idx;
          }
          // fallback: substring match
          for (const nd of needles) {
            const ndn = norm(nd);
            const idx = h.findIndex((x) => x.includes(ndn) || ndn.includes(x));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        // Cari kolom berdasarkan header agar tidak bergeser
        const idxNo = findIndexByAny(['no', 'nomor', 'no pendaftaran', 'nomor pendaftaran', 'nopendaftaran']);
        const idxAsalSekolah = findIndexByAny(['asal sekolah', 'asalsekolah', 'asal']);
        const idxJalur = findIndexByAny(['jalur', 'jalur pendaftaran', 'jalur masuk']);
        const idxAlasan = findIndexByAny(['alasan', 'keterangan alasan', 'keterangan']);
        const idxNama = findIndexByAny(['nama', 'nama siswa', 'nama peserta']);

        // fallback jika header tidak ketemu: gunakan indeks lama
        const fallbackIdx = { no: 0, asal: 1, jalur: 2, alasan: 3, nama: -1 };
        const finalIdxNo = idxNo !== -1 ? idxNo : fallbackIdx.no;
        const finalIdxAsalSekolah = idxAsalSekolah !== -1 ? idxAsalSekolah : fallbackIdx.asal;
        const finalIdxJalur = idxJalur !== -1 ? idxJalur : fallbackIdx.jalur;
        const finalIdxAlasan = idxAlasan !== -1 ? idxAlasan : fallbackIdx.alasan;
        const finalIdxNama = idxNama !== -1 ? idxNama : fallbackIdx.nama;

        const map = {};

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0) continue;

          const no = String(r[finalIdxNo] ?? '').trim();
          if (!no) continue;

          const asalsekolah = String(r[finalIdxAsalSekolah] ?? '').trim();
          const jalur = String(r[finalIdxJalur] ?? '').trim();
          const alasan = String(r[finalIdxAlasan] ?? '').trim();
          const nama = finalIdxNama !== -1 ? String(r[finalIdxNama] ?? '').trim() : '';

          map[no] = {
            nama,
            asalsekolah,
            jalur,
            alasan,
          };
        }

        data = map;
        return data;
      } catch (err) {
        console.error(err);
        if (res) {
          res.innerHTML = `<div class="meta-item"><span class="label">Gagal memuat data</span><span class="value">${escapeHtml(err.message || String(err))}</span></div>`;
        }
        throw err;
      } finally {
        loading = false;
      }
    }

    btn.addEventListener('click', async () => {
      // Jika XLSX belum termuat, tampilkan error jelas.
      if (typeof XLSX === 'undefined') {
        setNote('Gagal memuat data: XLSX tidak ter-load (cek script XLSX di cek_spmb.html).');
        const res = $('result');
        if (res) res.innerHTML = '';
        return;
      }

      const np = (input.value || '').trim();


      if (!data) {
        btn.disabled = true;
        try {
          await loadExcelData();
        } catch {
          // note already rendered
          btn.disabled = false;
          return;
        }
        btn.disabled = false;
      }

      const row = data && data[np];

      if (!row) {
        setNote('Nomor Pendaftaran tidak ditemukan pada data.');
        const res = $('result');
        if (res) res.innerHTML = '';
        return;
      }

      setNote('');

      const result = $('result');
      if (result) {
        result.innerHTML = `
          <div class="meta-item" style="grid-column:1 / -1;">
            <span class="label">🎉 Congrats, kamu lolos!</span>
            <div class="note0" style="margin-top:10px">
              <strong>${escapeHtml(row.nama || '')}</strong>
            </div>
            <div class="note1" style="margin-top:10px">
              Asal Sekolah <strong>${escapeHtml(row.asalsekolah)}</strong>
            </div>
            <div class="note2 " style="margin-top:10px">
              Jalur Masuk: <strong>${escapeHtml(row.jalur)}</strong>
            </div>
            <div class="note3" style="margin-top:10px">
              <strong>${escapeHtml(row.alasan)}</strong>
            </div>
            <div class="value" style="line-height:1.7; font-size:16px; margin-top:10px; align:center; text-align:center;">
              Sekarang kamu resmi jadi bagian dari SMANDEL TJT.</br>
              Semoga tiga tahun ke depan dipenuhi pengalaman seru, teman hebat, dan prestasi yang membanggakan.</br>
              Let's grow together! 🚀💙<br />
              INGAT!!! Daftar Ulang Wajib yaaaa<br />
            </div>
          </div>
        `;
      }
    });

    // (nonaktifkan logic lama berbasis window.DATA_SPMB)
    // const data = window.DATA_SPMB || {};
  }




  document.addEventListener('DOMContentLoaded', initSpmbChecker);
})();

