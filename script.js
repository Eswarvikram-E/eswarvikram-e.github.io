/* ════════════════════════════════════════════
   Eswarvikram E — shared site script
   Runs on every page; guards for missing nodes.
   ════════════════════════════════════════════ */

/* ── Hamburger menu ── */
function toggleMenu() {
  const nl = document.getElementById('navLinks');
  const btn = document.getElementById('menuBtn');
  if (!nl || !btn) return;
  const open = nl.classList.toggle('open');
  btn.textContent = open ? '✕' : '☰';
}

document.addEventListener('DOMContentLoaded', function () {

  /* ── Highlight the active nav link by current filename ── */
  let path = location.pathname.split('/').pop();
  if (!path || path === '') path = 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(function (a) {
    a.classList.toggle('active', a.dataset.page === path);
  });

  /* Close mobile menu after tapping a link */
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () {
      const nl = document.getElementById('navLinks');
      const btn = document.getElementById('menuBtn');
      if (nl) nl.classList.remove('open');
      if (btn) btn.textContent = '☰';
    });
  });

  /* ── Dark-mode toggle (persisted) ── */
  const themeToggle = document.querySelector('.theme-toggle');
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
  function syncThemeIcon() {
    if (!themeToggle) return;
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀' : '☾';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
      syncThemeIcon();
    });
    syncThemeIcon();
  }

  /* ── Profile photo zoom & crop (home page only) ── */
  initPhotoCrop();
});

function initPhotoCrop() {
  const frame = document.getElementById('photoFrame');
  if (!frame) return;
  const ctrls = document.getElementById('photoCtrls');
  const img = document.getElementById('photoImg');
  if (!img) { if (ctrls) ctrls.remove(); frame.style.cursor = 'default'; return; }

  function disable() { if (ctrls) ctrls.remove(); frame.style.cursor = 'default'; }
  img.addEventListener('error', disable);
  if (img.complete && img.naturalWidth === 0) { disable(); return; }

  let st = { scale: 1, x: 0, y: 0 };
  try { const s = JSON.parse(localStorage.getItem('photoCrop')); if (s && typeof s.scale === 'number') st = s; } catch (e) {}
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function apply() {
    st.scale = clamp(st.scale, 1, 4);
    if (st.scale === 1) { st.x = 0; st.y = 0; }
    img.style.transform = 'translate(' + st.x + 'px,' + st.y + 'px) scale(' + st.scale + ')';
  }
  const save = () => localStorage.setItem('photoCrop', JSON.stringify(st));
  apply();

  let drag = null;
  frame.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.photo-ctrls')) return;
    drag = { x: e.clientX, y: e.clientY, ox: st.x, oy: st.y };
    frame.setPointerCapture(e.pointerId);
    frame.classList.add('dragging');
  });
  frame.addEventListener('pointermove', function (e) {
    if (!drag) return;
    st.x = drag.ox + (e.clientX - drag.x);
    st.y = drag.oy + (e.clientY - drag.y);
    apply();
  });
  function endDrag() { if (drag) { drag = null; frame.classList.remove('dragging'); save(); } }
  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);

  frame.addEventListener('wheel', function (e) {
    e.preventDefault();
    st.scale = clamp(st.scale * (e.deltaY < 0 ? 1.08 : 0.92), 1, 4);
    apply(); save();
  }, { passive: false });

  if (ctrls) ctrls.addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b) return;
    const z = b.dataset.z;
    if (z === 'in') st.scale = clamp(st.scale * 1.15, 1, 4);
    else if (z === 'out') st.scale = clamp(st.scale / 1.15, 1, 4);
    else if (z === 'reset') st = { scale: 1, x: 0, y: 0 };
    apply(); save();
  });
}
