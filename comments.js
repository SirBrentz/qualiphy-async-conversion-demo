/* Review comments for demo pages.
   Pin a comment on any part of the page, keep it in this browser, and pass it on as text or as a link.
   There is no server: comments live in localStorage, and "Copy link with comments" puts them in the URL
   after the #, which browsers never send to the web server. Opening such a link loads the comments.
   A page can say which screen a comment belongs to with window.__commentContext(el) -> { key, label, snap },
   and take the reviewer back to it with window.__commentGoto(snap). Without them, comments are page-wide. */
(function () {
  'use strict';
  const KEY = 'demo-comments:' + location.pathname;
  const NAME_KEY = 'demo-commenter';
  const HASH = 'comments=';
  const Z = 2147483000;

  let list = read(KEY, []);
  let name = read(NAME_KEY, '');
  let mode = false;
  let panel = false;
  let draft = null;
  let open = null;
  let frame = 0;

  function read(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: comments last for this visit only */ } }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const when = (t) => new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const save = () => write(KEY, list);
  const nextN = () => list.reduce((m, c) => Math.max(m, c.n || 0), 0) + 1;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function context(el) {
    try { const c = window.__commentContext && window.__commentContext(el); if (c && c.key) return c; } catch (e) { /* page hook failed: fall back */ }
    return { key: 'page', label: document.title, snap: null };
  }
  function anchorOf(el) { let a = el; while (a && a !== document.body && !a.id) a = a.parentElement; return a && a.id && a !== document.body ? a : null; }
  function describe(el) {
    const t = (el.closest('button, a, label, th, td, li, h1, h2, h3, h4, p, b, span') || el).textContent || '';
    const s = t.trim().replace(/\s+/g, ' ');
    return s.length > 70 ? s.slice(0, 67) + '...' : s;
  }

  /* ---------------------------------------------------------------- styles */
  const css = `
  #cmt-root, #cmt-root * { box-sizing: border-box; font-family: "Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
  .cmt-dock { position: fixed; left: 16px; bottom: 16px; z-index: ${Z}; display: flex; background: #0b1b26; border: 1px solid #ffffff26; border-radius: 12px; box-shadow: 0 10px 28px #0b1b2659; overflow: hidden; }
  .cmt-dock button { border: 0; background: transparent; color: #e6eef4; font-weight: 600; font-size: 13.5px; padding: 9px 13px; display: inline-flex; gap: 7px; align-items: center; cursor: pointer; }
  .cmt-dock button:hover { background: #ffffff14; }
  .cmt-dock button.on { background: #f5b041; color: #0b1b26; }
  .cmt-dock .cmt-count { border-left: 1px solid #ffffff26; }
  .cmt-dock svg { width: 16px; height: 16px; }
  .cmt-banner { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: ${Z}; background: #f5b041; color: #0b1b26; font-weight: 600; font-size: 13.5px; padding: 8px 14px; border-radius: 999px; box-shadow: 0 8px 20px #0003; pointer-events: none; }
  body.cmt-mode, body.cmt-mode * { cursor: crosshair !important; }
  body.cmt-mode #cmt-root, body.cmt-mode #cmt-root * { cursor: auto !important; }
  body.cmt-mode #cmt-root button { cursor: pointer !important; }
  .cmt-pin { position: fixed; z-index: ${Z - 2}; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50% 50% 50% 4px; background: #f5b041; color: #0b1b26; border: 2px solid #fff; font-weight: 800; font-size: 12px; display: grid; place-items: center; box-shadow: 0 4px 12px #0005; cursor: pointer; padding: 0; }
  .cmt-pin.draft { background: #7a73f7; color: #fff; }
  .cmt-pop { position: fixed; z-index: ${Z - 1}; width: 300px; background: #fff; color: #1c1c1c; border-radius: 12px; box-shadow: 0 18px 40px #0004, 0 0 0 1px #0000001a; padding: 12px; font-size: 14px; }
  .cmt-pop .cmt-on { font-size: 12px; color: #6b7280; margin-bottom: 6px; line-height: 1.35; }
  .cmt-pop textarea { width: 100%; min-height: 84px; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; font-size: 14px; resize: vertical; }
  .cmt-pop input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 7px 10px; font-size: 13.5px; margin-top: 6px; }
  .cmt-pop textarea:focus, .cmt-pop input:focus { outline: 2px solid #cfc9ff; border-color: #7a73f7; }
  .cmt-row { display: flex; gap: 8px; justify-content: flex-end; align-items: center; margin-top: 8px; }
  .cmt-row .cmt-as { margin-right: auto; font-size: 12px; color: #6b7280; }
  .cmt-btn { border: 1px solid #d1d5db; background: #fff; color: #1c1c1c; border-radius: 8px; padding: 6px 12px; font-weight: 600; font-size: 13px; cursor: pointer; }
  .cmt-btn.primary { background: #7a73f7; border-color: #7a73f7; color: #fff; }
  .cmt-btn.danger { color: #b91c1c; }
  .cmt-btn[disabled] { opacity: .5; cursor: default; }
  .cmt-link { border: 0; background: none; padding: 0; color: #4d48b4; font-weight: 600; font-size: 12px; text-decoration: underline; cursor: pointer; }
  .cmt-body { white-space: pre-wrap; line-height: 1.45; }
  .cmt-meta { font-size: 12px; color: #6b7280; margin-top: 6px; }
  .cmt-panel { position: fixed; left: 16px; bottom: 64px; z-index: ${Z}; width: min(420px, calc(100vw - 32px)); max-height: min(70vh, 640px); display: flex; flex-direction: column; background: #fff; color: #1c1c1c; border-radius: 14px; box-shadow: 0 24px 50px #0005, 0 0 0 1px #0000001a; }
  .cmt-ph { background: #0b1b26; color: #fff; border-radius: 14px 14px 0 0; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
  .cmt-ph b { font-size: 15px; }
  .cmt-ph small { display: block; color: #9fb3c3; font-size: 12px; }
  .cmt-ph button { background: #ffffff1f; border: 0; color: #fff; border-radius: 8px; width: 28px; height: 28px; cursor: pointer; }
  .cmt-list { overflow: auto; padding: 6px 14px; flex: 1; }
  .cmt-item { border-bottom: 1px solid #e5e7eb; padding: 10px 0; font-size: 13.5px; }
  .cmt-item:last-child { border-bottom: 0; }
  .cmt-item .cmt-top { display: flex; gap: 8px; align-items: baseline; }
  .cmt-n { background: #f5b041; color: #0b1b26; font-weight: 800; font-size: 11px; border-radius: 999px; padding: 1px 7px; }
  .cmt-where { font-weight: 600; }
  .cmt-item .cmt-on { font-size: 12px; color: #6b7280; margin: 3px 0; }
  .cmt-item .cmt-row { justify-content: flex-start; margin-top: 6px; }
  .cmt-empty { color: #6b7280; font-size: 13.5px; padding: 14px 0; }
  .cmt-pf { border-top: 1px solid #e5e7eb; padding: 10px 14px; display: flex; gap: 8px; flex-wrap: wrap; }
  .cmt-note { position: fixed; top: 52px; left: 50%; transform: translateX(-50%); z-index: ${Z}; background: #0b1b26; color: #e6eef4; font-size: 13.5px; padding: 9px 13px; border-radius: 10px; box-shadow: 0 10px 24px #0005; max-width: calc(100vw - 32px); }
  `;
  const style = document.createElement('style'); style.id = 'cmt-style'; style.textContent = css; document.head.appendChild(style);
  const root = document.createElement('div'); root.id = 'cmt-root'; document.body.appendChild(root);

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  /* ---------------------------------------------------------------- positions */
  function where(c) {
    if (!c.anchor) return null;
    const a = document.getElementById(c.anchor.id); if (!a) return null;
    const r = a.getBoundingClientRect(); if (!r.width && !r.height) return null;
    if (context(a).key !== c.key) return null;
    const x = r.left + c.anchor.dx * r.width; const y = r.top + c.anchor.dy * r.height;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return null;
    return { x, y };
  }
  /* Scroll the pinned spot, not the whole anchor, into view: a tall card centred can leave the pin off screen. */
  function reveal(c) {
    const a = c.anchor && document.getElementById(c.anchor.id); if (!a) { later(); return; }
    let r = a.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) { a.scrollIntoView({ block: 'start' }); r = a.getBoundingClientRect(); }
    const y = r.top + c.anchor.dy * r.height;
    if (y < 90 || y > window.innerHeight - 90) window.scrollBy({ top: y - window.innerHeight / 3, behavior: 'auto' });
    later();
  }
  function popAt(x, y) {
    const w = 300; const h = 220;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 14));
    const top = Math.max(8, Math.min(window.innerHeight - h - 8, y + 14));
    return `left:${left}px;top:${top}px`;
  }

  /* ---------------------------------------------------------------- render */
  function draw() {
    frame = 0;
    const active = document.activeElement;
    const focusId = active && root.contains(active) ? active.id : null;
    const caret = focusId && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    const taNow = document.getElementById('cmt-text'); if (taNow && draft) draft.text = taNow.value;
    const nmNow = document.getElementById('cmt-name'); if (nmNow && draft) draft.nameVal = nmNow.value;
    let h =`<div class="cmt-dock" data-cmt-ui><button class="${mode ? 'on' : ''}" data-cmt="mode" id="cmt-mode" aria-pressed="${mode}">${ICON}${mode ? 'Done commenting' : 'Add comments'}</button><button class="cmt-count" data-cmt="panel" id="cmt-open" aria-label="Show all comments">${list.length}</button></div>`;
    if (mode) h += '<div class="cmt-banner">Click anything to pin a comment. Press Esc when you\'re done.</div>';
    list.forEach((c) => {
      const p = where(c); if (!p) return;
      h += `<button class="cmt-pin" style="left:${p.x}px;top:${p.y}px" data-cmt="pin" data-id="${c.id}" title="${esc(c.text)}" aria-label="Comment ${c.n}">${c.n}</button>`;
    });
    if (draft) {
      h += `<span class="cmt-pin draft" style="left:${draft.x}px;top:${draft.y}px">+</span>
        <div class="cmt-pop" style="${popAt(draft.x, draft.y)}" data-cmt-ui id="cmt-draft"><div class="cmt-on">${esc(draft.label)}${draft.target ? `, on "${esc(draft.target)}"` : ''}</div>
        <textarea id="cmt-text" placeholder="Your comment">${esc(draft.text || '')}</textarea>
        ${name ? '' : '<input id="cmt-name" placeholder="Your name (saved for next time)">'}
        <div class="cmt-row">${name ? `<span class="cmt-as">as ${esc(name)} <button class="cmt-link" data-cmt="rename">change</button></span>` : ''}<button class="cmt-btn" data-cmt="cancel">Cancel</button><button class="cmt-btn primary" data-cmt="save" id="cmt-save">Save</button></div></div>`;
    }
    if (open) {
      const c = list.find((x) => x.id === open.id);
      if (c) h += `<div class="cmt-pop" style="${popAt(open.x, open.y)}" data-cmt-ui id="cmt-view"><div class="cmt-on">#${c.n} · ${esc(c.label)}${c.target ? `, on "${esc(c.target)}"` : ''}</div><div class="cmt-body">${esc(c.text)}</div><div class="cmt-meta">${esc(c.name || 'Anonymous')} · ${when(c.at)}</div><div class="cmt-row"><button class="cmt-btn danger" data-cmt="delete" data-id="${c.id}">Delete</button><button class="cmt-btn" data-cmt="close">Close</button></div></div>`;
    }
    if (panel) {
      const items = list.slice().sort((a, b) => a.n - b.n).map((c) => `<div class="cmt-item"><div class="cmt-top"><span class="cmt-n">${c.n}</span><span class="cmt-where">${esc(c.label)}</span></div>${c.target ? `<div class="cmt-on">On "${esc(c.target)}"</div>` : ''}<div class="cmt-body">${esc(c.text)}</div><div class="cmt-meta">${esc(c.name || 'Anonymous')} · ${when(c.at)}</div><div class="cmt-row">${c.snap && window.__commentGoto ? `<button class="cmt-btn" data-cmt="goto" data-id="${c.id}">Show on the page</button>` : ''}<button class="cmt-btn danger" data-cmt="delete" data-id="${c.id}">Delete</button></div></div>`).join('');
      h += `<div class="cmt-panel" data-cmt-ui id="cmt-panel"><div class="cmt-ph"><div><b>Comments (${list.length})</b><small>Saved in this browser only. Share them with a link or as text.</small></div><button data-cmt="panel" aria-label="Close">&times;</button></div>
        <div class="cmt-list">${items || '<div class="cmt-empty">No comments yet. Choose Add comments, then click anything on the page.</div>'}</div>
        <div class="cmt-pf"><button class="cmt-btn primary" data-cmt="copy-link" id="cmt-copy-link" ${list.length ? '' : 'disabled'}>Copy link with comments</button><button class="cmt-btn" data-cmt="copy-text" id="cmt-copy-text" ${list.length ? '' : 'disabled'}>Copy as text</button><button class="cmt-btn danger" data-cmt="clear" ${list.length ? '' : 'disabled'}>Clear all</button></div></div>`;
    }
    root.innerHTML = h;
    const nm = document.getElementById('cmt-name'); if (nm && draft && draft.nameVal) nm.value = draft.nameVal;
    const back = focusId && document.getElementById(focusId);
    if (back) { back.focus(); if (caret != null && back.setSelectionRange) { try { back.setSelectionRange(caret, caret); } catch (e) { /* not a text field */ } } }
    else { const ta = document.getElementById('cmt-text'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } }
  }
  const later = () => { if (!frame) frame = requestAnimationFrame(draw); };
  function note(msg) {
    const el = document.createElement('div'); el.className = 'cmt-note'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el); setTimeout(() => el.remove(), 3200);
  }

  /* ---------------------------------------------------------------- sharing */
  const pack = (arr) => btoa(unescape(encodeURIComponent(JSON.stringify(arr)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unpack = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  function shareLink() {
    const u = new URL(location.href); u.hash = '';
    ['fresh', 'static', 'step'].forEach((k) => u.searchParams.delete(k));
    return u.toString() + '#' + HASH + pack(list);
  }
  function asText() {
    const lines = [`Comments on "${document.title}" (${list.length})`, location.href.split('#')[0], ''];
    list.slice().sort((a, b) => a.n - b.n).forEach((c) => {
      lines.push(`#${c.n}  ${c.label}${c.target ? `, on "${c.target}"` : ''}`);
      lines.push(`    ${c.name || 'Anonymous'}, ${when(c.at)}: ${c.text.replace(/\n/g, '\n    ')}`);
      lines.push('');
    });
    return lines.join('\n');
  }
  function copy(text, done) {
    const fallback = () => {
      const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e) { /* nothing more to try */ }
      t.remove(); note(done);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => note(done), fallback); else fallback();
  }
  function importFromHash() {
    const i = location.hash.indexOf(HASH); if (i < 0) return;
    try {
      const incoming = unpack(location.hash.slice(i + HASH.length));
      let added = 0;
      (Array.isArray(incoming) ? incoming : []).forEach((c) => { if (c && c.id && c.text && !list.some((x) => x.id === c.id)) { list.push(c); added++; } });
      save();
      note(added ? `Loaded ${added} comment${added === 1 ? '' : 's'} from the link.` : 'The comments in this link are already here.');
    } catch (e) { note('That comment link could not be read.'); }
    history.replaceState(null, '', location.href.split('#')[0]);
  }

  /* ---------------------------------------------------------------- events */
  const ACT = {
    mode() { mode = !mode; draft = null; open = null; document.body.classList.toggle('cmt-mode', mode); },
    panel() { panel = !panel; open = null; },
    pin(d) { const c = list.find((x) => x.id === d.id); const p = c && where(c); open = c && p ? { id: c.id, x: p.x, y: p.y } : null; },
    close() { open = null; },
    cancel() { draft = null; },
    rename() { name = ''; write(NAME_KEY, ''); if (draft) draft.text = (document.getElementById('cmt-text') || {}).value || draft.text; },
    save() {
      const text = ((document.getElementById('cmt-text') || {}).value || '').trim(); if (!text || !draft) return;
      const nm = document.getElementById('cmt-name'); if (nm && nm.value.trim()) { name = nm.value.trim(); write(NAME_KEY, name); }
      list.push({ id: uid(), n: nextN(), text, name, at: Date.now(), key: draft.key, label: draft.label, snap: draft.snap, target: draft.target, anchor: draft.anchor });
      save(); draft = null; note('Comment saved.');
    },
    delete(d) { list = list.filter((c) => c.id !== d.id); save(); open = null; },
    goto(d) { const c = list.find((x) => x.id === d.id); if (c && c.snap && window.__commentGoto) { window.__commentGoto(c.snap); panel = false; setTimeout(() => reveal(c), 60); } },
    'copy-link'() { copy(shareLink(), 'Link copied. Anyone who opens it sees these comments.'); },
    'copy-text'() { copy(asText(), 'Comments copied as text.'); },
    clear() { list = []; save(); open = null; },
  };
  function onUi(e) {
    const b = e.target.closest('[data-cmt]'); if (!b) return false;
    const fn = ACT[b.dataset.cmt]; if (fn) { fn(b.dataset); draw(); }
    return true;
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#cmt-root')) { onUi(e); return; }
    if (!mode) { if (open) { open = null; draw(); } return; }
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const typed = draft && ((document.getElementById('cmt-text') || {}).value || '').trim();
    if (typed) return;
    const el = e.target; const a = anchorOf(el); const r = a ? a.getBoundingClientRect() : null;
    const c = context(el);
    draft = { x: e.clientX, y: e.clientY, key: c.key, label: c.label, snap: c.snap || null, target: describe(el), text: '',
      anchor: a && r ? { id: a.id, dx: r.width ? (e.clientX - r.left) / r.width : 0, dy: r.height ? (e.clientY - r.top) / r.height : 0 } : null };
    open = null; draw();
  }, true);
  ['mousedown', 'pointerdown', 'mouseup', 'pointerup'].forEach((t) => document.addEventListener(t, (e) => {
    if (mode && !e.target.closest('#cmt-root')) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
  }, true));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (draft) { draft = null; } else if (open) { open = null; } else if (panel) { panel = false; } else if (mode) { ACT.mode(); } else return;
    e.stopImmediatePropagation(); draw();
  }, true);
  document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && draft) { ACT.save(); draw(); } });
  window.addEventListener('scroll', later, true);
  window.addEventListener('resize', later);
  new MutationObserver((ms) => { if (ms.some((m) => !root.contains(m.target))) later(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

  importFromHash();
  draw();
  window.__comments = { get list() { return JSON.parse(JSON.stringify(list)); }, shareLink };
})();
