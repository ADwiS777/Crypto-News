/* admin.js */
(() => {
    'use strict';
  
    // ===== Util DOM =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
  
    // Set tahun footer
    const yearEl = $('#y');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
    // ===== Toast Utils =====
    const TOAST_DURATION = 3000; // ms
  
    function showToast(message, type = 'success', duration = TOAST_DURATION) {
      const container = $('#toastContainer');
      if (!container) return null;
  
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.setAttribute('role', 'status');
  
      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.textContent =
        type === 'success' ? '✔' :
        type === 'error'   ? '✖' :
        type === 'warn'    ? '⚠' : 'ℹ';
  
      const msg = document.createElement('div');
      msg.className = 'msg';
      msg.textContent = message;
  
      const close = document.createElement('button');
      close.className = 'close';
      close.setAttribute('aria-label', 'Tutup notifikasi');
      close.textContent = '×';
  
      const barWrap = document.createElement('div');
      barWrap.className = 'bar';
      const bar = document.createElement('span');
      bar.style.animationDuration = `${duration}ms`;
      barWrap.appendChild(bar);
  
      toast.append(icon, msg, close, barWrap);
      container.appendChild(toast);
  
      // Auto remove
      let hideTimeout;
      const remove = () => {
        toast.style.animation = 'toast-out 180ms ease forwards';
        setTimeout(() => toast.remove(), 170);
      };
      hideTimeout = setTimeout(remove, duration);
  
      // Pause/resume saat hover
      let remaining = duration;
      let startAt = Date.now();
  
      toast.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        bar.style.animationPlayState = 'paused';
        remaining -= (Date.now() - startAt);
      });
  
      toast.addEventListener('mouseleave', () => {
        startAt = Date.now();
        bar.style.animationDuration = `${remaining}ms`;
        bar.style.animationPlayState = 'running';
        hideTimeout = setTimeout(remove, remaining);
      });
  
      // Close manual
      close.addEventListener('click', remove);
  
      return toast;
    }
  
    // ===== Data Layer (localStorage) =====
    const STORAGE_KEY = 'newsItems_admin';
  
    const seed = [
      { title: 'Bitcoin Menembus Resistensi',
        desc: 'Volume meningkat mendorong peluang breakout di sesi Asia.' },
      { title: 'DEX Cetak ATH Volume',
        desc: 'Likuiditas bergeser ke DEX seiring biaya L2 yang makin murah.' },
      { title: 'Audit DeFi Temukan Bug Kritis',
        desc: 'Patch dirilis cepat dan program bug bounty diperluas.' },
      { title: 'Stablecoin Dipakai Pembayaran Ritel',
        desc: 'Uji coba dengan merchant besar membuka adopsi lebih luas.' },
    ];
  
    const safeParse = (str, fallback) => {
      try { return JSON.parse(str); } catch { return fallback; }
    };
  
    const readData = () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = safeParse(raw, null);
      return (parsed ?? seed);
    };
  
    const writeData = (arr) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    };
  
    // Inisialisasi seed pertama kali
    if (localStorage.getItem(STORAGE_KEY) === null) {
      writeData(seed);
    }
  
    // ===== DOM refs =====
    const tbody       = $('#newsTbody');
    const emptyState  = $('#emptyState');
    const modal       = $('#modalBackdrop');
    const modalTitle  = $('#modalTitle');
    const form        = $('#newsForm');
    const fTitle      = $('#fTitle');
    const fDesc       = $('#fDesc');
    const btnCreate   = $('#btnCreate');
    const btnCancel   = $('#btnCancel');
    const btnClose    = $('#modalClose');
  
    let editIndex = null;
  
    // ===== Render =====
    function render() {
      const data = readData();
      if (!tbody) return;
      tbody.innerHTML = '';
  
      if (!data.length) {
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      if (emptyState) emptyState.style.display = 'none';
  
      data.forEach((item, idx) => {
        const tr = document.createElement('tr');
  
        const td1 = document.createElement('td');
        td1.className = 'td-title';
        td1.textContent = item.title;
  
        const td2 = document.createElement('td');
        td2.className = 'td-desc';
        td2.textContent = item.desc;
  
        const td3 = document.createElement('td');
        td3.className = 'td-actions';
        const wrap = document.createElement('div');
        wrap.className = 'actions';
  
        const bEdit = document.createElement('button');
        bEdit.className = 'btn-sm edit';
        bEdit.type = 'button';
        bEdit.textContent = 'Edit';
        bEdit.addEventListener('click', () => openModal('edit', idx));
  
        const bDel = document.createElement('button');
        bDel.className = 'btn-sm delete';
        bDel.type = 'button';
        bDel.textContent = 'Delete';
        bDel.addEventListener('click', () => deleteItem(idx));
  
        wrap.append(bEdit, bDel);
        td3.append(wrap);
  
        tr.append(td1, td2, td3);
        tbody.append(tr);
      });
    }
  
    // ===== Modal helpers =====
    function openModal(mode = 'create', idx = null) {
      editIndex = (mode === 'edit') ? idx : null;
      if (modalTitle) modalTitle.textContent = (mode === 'edit') ? 'Edit Berita' : 'Buat Berita';
  
      if (mode === 'edit') {
        const item = readData()[idx];
        if (fTitle) fTitle.value = item?.title ?? '';
        if (fDesc)  fDesc.value  = item?.desc  ?? '';
      } else if (form) {
        form.reset();
      }
  
      if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
      }
      if (fTitle) fTitle.focus();
    }
  
    function closeModal() {
      if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
      if (form) form.reset();
      editIndex = null;
    }
  
    // ===== CRUD =====
    function deleteItem(idx) {
      const data = readData();
      const deletedTitle = data[idx]?.title || 'Berita';
      // Konfirmasi
      // eslint-disable-next-line no-alert
      const ok = confirm('Hapus berita ini?');
      if (!ok) return;
  
      data.splice(idx, 1);
      writeData(data);
      render();
      showToast(`"${deletedTitle}" berhasil dihapus.`, 'success');
    }
  
    function handleSubmit(e) {
      e.preventDefault();
      if (!fTitle || !fDesc) return;
  
      const title = fTitle.value.trim();
      const desc  = fDesc.value.trim();
      if (!title || !desc) return;
  
      const data = readData();
      const isEdit = (editIndex !== null);
  
      if (!isEdit) {
        data.unshift({ title, desc });
        writeData(data);
        render();
        closeModal();
        showToast('Berita baru berhasil dibuat.', 'success');
      } else {
        data[editIndex] = { title, desc };
        writeData(data);
        render();
        closeModal();
        showToast('Perubahan berhasil disimpan.', 'success');
      }
    }
  
    // ===== Wiring Events =====
    if (form) form.addEventListener('submit', handleSubmit);
    if (btnCreate) btnCreate.addEventListener('click', () => openModal('create'));
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnClose)  btnClose.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  
    // Opsional: tutup semua toast aktif dengan ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $$('.toast').forEach((t) => {
          t.style.animation = 'toast-out 180ms ease forwards';
          setTimeout(() => t.remove(), 170);
        });
      }
    });
  
    // ===== First render =====
    render();
  })();
  