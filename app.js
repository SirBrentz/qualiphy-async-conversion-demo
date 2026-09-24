/* Async conversion demo: app. Vanilla JS, no build step, no network calls.
   One in-browser store drives four product views (Async admin, clinic, patient, provider),
   a guided walkthrough and the PRD context drawer. Icons adapted from Feather (MIT).
   Names, figures, ticket keys and customers come from D.PRD in data.js, never from this file,
   so the public share build only has to swap the PRD block. */
(function () {
  'use strict';

  const D = window.DEMO;
  const F = D.PRD.facts || {};
  const T = D.PRD.terms || {};
  const KEY = 'qualiphy-async-demo-v2';
  const params = new URLSearchParams(location.search);
  if (params.has('static')) document.body.classList.add('static');

  const STATE_BY = Object.fromEntries(D.STATES.map((s) => [s.code, s]));
  const EXAM_BY = Object.fromEntries(D.EXAMS.map((e) => [e.id, e]));
  const CLINIC_BY = Object.fromEntries(D.CLINICS.map((c) => [c.id, c]));
  const MY = (D.CLINICS.find((c) => c.you) || D.CLINICS[0]).id;
  const STATUS_LABEL = { async: 'Async allowed', video: 'Video only', conditional: 'Conditional', unreviewed: 'Not reviewed' };
  const CHANNELS = { portal: 'Clinic portal', api: 'API', quidget: 'Quidget', instant: 'Connect Instantly' };
  const API_MODES = { none: 'No mode sent', force_sync: 'force_sync', force_async: 'force_async', patient_choice: 'patient_choice' };
  const REC_STATUS = { invited: 'Invite sent', opened: 'Patient opened it', 'waiting-video': 'Waiting for video visit', submitted: 'Waiting for a provider', 'in-review': 'Provider reviewing', completed: 'Completed', deferred: 'Deferred' };
  const OPEN = ['invited', 'opened', 'submitted', 'in-review'];
  const OPEN_PT = ['invited', 'opened'];
  const DONE_PT = ['submitted', 'in-review', 'completed', 'deferred'];
  const WHATIF_DEFAULTS = Object.fromEntries(D.PRD.decisions.filter((q) => q.opts).map((q) => [q.key, q.opts[0].v]));
  const YOU = 'You (Async admin)';
  const AZ_NOTE = 'Reviewed by Compliance for the pilot (demo)';
  const PILOT_EXAMS = ['wl-fu-sema', 'wl-fu-tirz', 'wl-first-sema', 'iv-gfe'];

  let S = null;
  let pendingTop = false;
  let lastScrolled = -1;
  let pendingRef = null;

  /* ------------------------------------------------------------------ icons */
  const CLIP = '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>';
  const P = {
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userMd: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1z"/><path d="M12 16v3M10.5 17.5h3"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
    userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
    userLock: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><rect x="15" y="15" width="7" height="6" rx="1"/><path d="M16.5 15v-1.5a2 2 0 0 1 4 0V15"/>',
    clipboard: CLIP,
    clipboardCheck: CLIP + '<polyline points="9 14 11 16 15 12"/>',
    clipboardPlus: CLIP + '<line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
    clipboardEdit: CLIP + '<path d="M10 17l1-3 4-4 2 2-4 4z"/>',
    clipboardList: CLIP + '<line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>',
    plusSquare: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    rx: '<path d="M6 20V4h5a4 4 0 0 1 0 8H6"/><path d="M10 12l9 9"/><path d="M19 13l-7 8"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    signature: '<path d="M3 17c3-6 5-9 7-9 3 0-2 9 1 9 2 0 3-4 5-4 1.5 0 1 2 2.5 2 1 0 2-1 2.5-1.5"/><line x1="3" y1="21" x2="21" y2="21"/>',
    stethoscope: '<path d="M5 3H4a1 1 0 0 0-1 1v5a5 5 0 0 0 10 0V4a1 1 0 0 0-1-1h-1"/><path d="M8 14v1a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    hourglass: '<path d="M6 2h12"/><path d="M6 22h12"/><path d="M7 2v3a5 5 0 0 0 10 0V2"/><path d="M7 22v-3a5 5 0 0 1 10 0v3"/>',
    scale: '<path d="M12 3v18"/><path d="M7 21h10"/><path d="M4 7h16"/><path d="M7 7l-3 7a3 3 0 0 0 6 0z"/><path d="M17 7l-3 7a3 3 0 0 0 6 0z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/>',
    flask: '<path d="M9 2h6"/><path d="M10 2v6L4.5 18.5A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.8-3L14 8V2"/><line x1="7" y1="15" x2="17" y2="15"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 16 14"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    refresh: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pill: '<path d="M10.5 20.5a4.95 4.95 0 1 1-7-7l10-10a4.95 4.95 0 1 1 7 7z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.6-.8 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.7-1.7h2a5.5 5.5 0 0 0 5.5-5.5C22 6 17.5 2 12 2z"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
  };
  const I = (n, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ------------------------------------------------------------------ utils */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => Date.now() + ((S && S.clockOffset) || 0);
  const fmtTime = (t) => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const fmtDay = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtDT = (t) => `${fmtDay(t)}, ${fmtTime(t)}`;
  const fmtDur = (ms) => { const m = Math.max(0, Math.ceil(ms / 60000)); const h = Math.floor(m / 60); return h ? (m % 60 ? `${h}h ${m % 60}m` : `${h}h`) : `${m}m`; };
  const stateName = (c) => (STATE_BY[c] ? STATE_BY[c].name : c);
  const initials = (n) => n.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const opt = (v, l, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`;
  const stateOptions = (cur) => D.STATES.slice().sort((a, b) => a.name.localeCompare(b.name)).map((s) => opt(s.code, s.name, cur)).join('');
  const dnote = (k, html, extra) => `<div class="dnote"${extra ? ' ' + extra : ''}>${I('info')}<div><span class="dn-k">${esc(k)}</span>${html}</div></div>`;
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
  const listJoin = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a.join(''));
  const qOf = (key) => D.PRD.decisions.find((q) => q.key === key);
  const qn = (key) => { const q = qOf(key); return q ? q.n : '?'; };
  const QW = (key) => `question ${qn(key)}`;
  const qWho = (key) => { const q = qOf(key); return q ? q.who : ''; };
  const typeLabel = (t) => (t === 'async' ? 'Async review' : 'Video visit');
  function setPath(o, path, v) { const ks = path.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) { if (t[ks[i]] == null) t[ks[i]] = {}; t = t[ks[i]]; } t[ks[ks.length - 1]] = v; }
  let toastTimer = null;
  function toast(msg) { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3600); }

  /* ------------------------------------------------------------------ state */
  const csetFor = (id) => (S && S.cset && S.cset[id]) || { defaultType: 'async', choice: true };
  function inviteFromPatient(p, examId) {
    const ex = examId || 'wl-fu-sema';
    return { first: p.first, last: p.last, email: p.email, phone: p.phone, state: p.state, returning: !!p.returning, lastVisit: p.lastVisit || '', type: EXAM_BY[ex].type, examId: ex, clinicId: MY, pick: null, letChoose: null };
  }
  function emptyIntake() { return { location: '', ack: false, dose: D.DOSES[1], weight: '', fx: { nausea: false, constipation: false, fatigue: false, none: false }, cond: { heart: false, kidney: false, pregnant: false, none: false }, allergies: '', note: '', confirm: false }; }
  const intakeKind = (e) => (e && e.category === 'Weight loss' && e.visit === 'follow-up' ? 'followup' : 'first');
  function intakeAnswers(kind) {
    if (kind === 'first') return Object.assign(emptyIntake(), { cond: { heart: false, kidney: false, pregnant: false, none: true }, allergies: 'None', note: 'Hoping to book a session next week.', confirm: true, ack: true });
    return Object.assign(emptyIntake(), { weight: '184', fx: { nausea: true, constipation: false, fatigue: false, none: false }, note: 'Mild nausea the first two days after each dose.', confirm: true, ack: true });
  }
  const testerDefaults = () => ({ channel: 'portal', apiMode: 'none', clinicId: MY, state: 'AZ', examId: 'wl-fu-sema', returning: 'yes', pick: 'default', choose: 'default' });

  function seedRecords(t0) {
    const mk = (o) => Object.assign({ channel: 'portal', clinicId: MY, converted: false, convertedBy: null, copy: false, allowed: null, clinicPick: null, pickSource: null, letChoose: null, canVideo: false, canAsync: false, choiceNote: '', patientChoice: null, heldUntil: null, claimedBy: null, answers: null, seed: true, checks: null, rulesReason: null }, o);
    const a = t0 - 150 * 6e4, b = t0 - 185 * 6e4, c = t0 - 26 * 36e5;
    return [
      mk({ id: 16512171, patient: { first: 'Daniel', last: 'Okafor', state: 'TX', returning: false }, examId: 'wl-first-sema', createdAt: a, decidedAt: a, type: 'video', sentAs: 'video', reason: 'Sent before the pilot. Video visit, as today.', status: 'waiting-video', events: [{ at: a, text: 'Invite sent from the clinic portal. Video visit, as today.' }] }),
      mk({ id: 16512168, patient: { first: 'Maria', last: 'Chen', state: 'FL', returning: true }, examId: 'wl-copy', createdAt: b, decidedAt: b, submittedAt: b + 25 * 6e4, type: 'async', sentAs: 'async', copy: true, reason: "Today's async copy. It runs async as it does today and doesn't use the hub.", status: 'submitted', events: [{ at: b, text: "Invite sent from the clinic portal for today's async copy." }, { at: b + 25 * 6e4, text: 'Patient submitted the async answers.' }] }),
      mk({ id: 16512150, patient: { first: 'Jamie', last: 'Brooks', state: 'GA', returning: false }, examId: 'iv-gfe', createdAt: c, decidedAt: c, type: 'video', sentAs: 'video', reason: 'Sent before the pilot. Video visit, as today.', status: 'completed', events: [{ at: c, text: 'Invite sent from the clinic portal. Video visit, as today.' }, { at: c + 40 * 6e4, text: 'Video visit completed.' }] }),
    ];
  }

  function freshState() {
    const t0 = Date.now(); const day = 864e5; const tA = t0 - 6 * day;
    const states = {};
    D.STATES.forEach((s) => { states[s.code] = { status: 'unreviewed', firstVideo: false, note: '', at: null, by: null }; });
    const log = [{ at: tA, who: 'System', what: 'Hub switched on. Every state starts Not reviewed, which stays video.', from: '', to: '', note: `${cap(QW('q3'))}'s default: states start off` }];
    const n0 = 'Reviewed for the pilot (illustrative)';
    D.STATE_START.async.forEach((c) => { states[c] = { status: 'async', firstVideo: false, note: n0, at: tA + 36e5, by: 'Compliance team' }; });
    log.push({ at: tA + 36e5, who: 'Compliance team', what: `${D.STATE_START.async.length} states set to Async allowed`, from: 'Not reviewed', to: 'Async allowed', note: n0 });
    let k = 2;
    Object.entries(D.STATE_START.video).forEach(([c, n]) => { const at = tA + (k++) * 36e5; states[c] = { status: 'video', firstVideo: false, note: n, at, by: 'Compliance team' }; log.push({ at, who: 'Compliance team', what: `${stateName(c)} set to Video only`, from: 'Not reviewed', to: 'Video only', note: n }); });
    Object.entries(D.STATE_START.conditional).forEach(([c, n]) => { const at = tA + day + (k++) * 36e5; states[c] = { status: 'conditional', firstVideo: false, note: n, at, by: 'Compliance team' }; log.push({ at, who: 'Compliance team', what: `${stateName(c)} set to Conditional`, from: 'Not reviewed', to: 'Conditional', note: n }); });
    const fv = D.STATE_START.firstVideo || [];
    if (fv.length) {
      const at = tA + day + (k++) * 36e5; const n = 'New patients start on video here (illustrative)';
      fv.forEach((c) => { Object.assign(states[c], { firstVideo: true, note: n, at }); });
      log.push({ at, who: 'Compliance team', what: `First visit must be video, switched on in ${listJoin(fv.map(stateName))}`, from: 'Off', to: 'On', note: n });
    }
    const exams = {}; D.EXAMS.forEach((e) => { exams[e.id] = { on: false, except: {} }; });
    Object.entries(D.EXAM_START || {}).forEach(([id, map]) => {
      if (!exams[id]) return;
      Object.entries(map).forEach(([code, x]) => {
        const at = tA + 2 * day + (k++) * 36e5;
        exams[id].except[code] = { mode: x.mode, note: x.note, at, by: 'Compliance team' };
        log.push({ at, who: 'Compliance team', what: `${EXAM_BY[id].name}: exam rule for ${stateName(code)}`, from: 'Follows the state', to: x.mode === 'video' ? 'Video here' : 'Async here', note: x.note });
      });
    });
    log.sort((x, y) => y.at - x.at);
    const rollout = {}; const asyncToday = {}; const cset = {};
    D.CLINICS.forEach((c) => { rollout[c.id] = false; asyncToday[c.id] = !!c.asyncToday; cset[c.id] = { defaultType: c.defaultType || 'async', choice: c.choice !== false }; });
    return {
      v: 2, role: 'superadmin',
      view: { sa: 'settings', area: 'async', hubTab: 'states', mapMode: 'map', filter: 'all', stateEdit: null, examEdit: null, clinic: 'results', provider: 'queue', providerAs: 'ft', reviewId: null, patientId: null, pscreen: 'sms' },
      states, exams, rollout, asyncToday, cset, whatif: Object.assign({}, WHATIF_DEFAULTS), access: { holdHours: 4 },
      log, records: seedRecords(t0), nextId: 16512205,
      invite: inviteFromPatient(D.PATIENTS[0]), tester: testerDefaults(),
      intake: emptyIntake(), clockOffset: 0,
      wt: { on: false, step: 0 }, wtRecordId: null, wtChoiceId: null, welcomed: false, notes: true,
      modal: null, drawer: null, ctxTab: 'summary', affected: null,
    };
  }

  function load() {
    if (params.has('fresh') || params.has('step')) return null;
    try {
      const raw = localStorage.getItem(KEY); if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.v === 2 && s.states && s.records && s.view && s.cset ? s : null;
    } catch (e) { return null; }
  }
  let saveTimer = null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: the demo still runs, it just won't remember */ } }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }

  function reset(preset) {
    try { localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ }
    S = freshState(); S.welcomed = preset !== 'fresh';
    if (preset === 'pilot') {
      saveStateChange('AZ', 'async', false, AZ_NOTE, 'Compliance team');
      PILOT_EXAMS.forEach((id) => setExam(id, true, 'Compliance team'));
      setRollout(MY, true, 'Compliance team');
      S.affected = null;
    }
    lastScrolled = -1; pendingTop = true;
  }

  /* ------------------------------------------------------------------ rules */
  function stateRule(code) {
    const st = S.states[code] || { status: 'unreviewed' }; const name = stateName(code);
    if (st.status === 'async') return { allowed: true, label: 'Async allowed', why: `${name} is Async allowed` };
    if (st.status === 'video') return { allowed: false, label: 'Video only', why: `${name} is Video only` };
    if (st.status === 'conditional') return { allowed: false, label: 'Conditional, video for now', why: `${name} is Conditional, which counts as video for now` };
    return S.whatif.q3 === 'on'
      ? { allowed: true, label: 'Not reviewed, on at go-live', why: `${name} hasn't been reviewed, and states start on (${QW('q3')} preview)` }
      : { allowed: false, label: 'Not reviewed, stays video', why: `${name} hasn't been reviewed yet, so it stays video` };
  }
  function examRule(id) {
    const e = EXAM_BY[id];
    if (!e) return { eligible: false, lock: 'Unknown exam' };
    if (e.urgent) return { eligible: false, lock: 'Urgent care always runs as a video visit' };
    if (e.copy) return { eligible: false, lock: S.whatif.q5 === 'retire' ? `Retired at launch (${QW('q5')} preview)` : `Today's async copy. It runs async already and doesn't use the hub (${QW('q5')})` };
    if (e.controlled) return { eligible: false, lock: 'Can lead to a controlled-substance prescription, so it stays video unless General Counsel clears it' };
    if (!e.ready) return { eligible: false, lock: `Needs async questions before it can run async (${QW('q6')})` };
    return { eligible: true, lock: null };
  }
  const examOn = (id) => examRule(id).eligible && !!(S.exams[id] && S.exams[id].on);
  function exceptionFor(examId, code) {
    const x = S.exams[examId] && S.exams[examId].except[code]; if (!x) return null;
    return x.mode === 'async' && S.whatif.qb !== 'widen' ? Object.assign({ inactive: true }, x) : x;
  }
  function rolloutOf(id) {
    if (S.whatif.qd === 'open') return { on: true, label: 'Open to all', note: `${cap(QW('qd'))} preview` };
    if (S.whatif.q7 === 'reuse') return { on: !!S.asyncToday[id], label: S.asyncToday[id] ? 'In, through the async setting' : 'Not yet', note: `The rollout flag is the existing async setting (${QW('q7')} preview)` };
    return { on: !!S.rollout[id], label: S.rollout[id] ? 'In the rollout' : 'Not yet', note: '' };
  }
  const inRollout = (id) => rolloutOf(id).on;
  const selectable = (e) => !(e.copy && S.whatif.q5 === 'retire');

  /* The compliance layer: every check must pass before a clinic or patient can pick async. */
  function rules(o) {
    const c = CLINIC_BY[o.clinicId]; const name = stateName(o.state);
    const er = examRule(o.examId); const sr = stateRule(o.state); const ex = exceptionFor(o.examId, o.state); const st = S.states[o.state] || {};
    const block = !!ex && !ex.inactive && ex.mode === 'video';
    const widen = !!ex && !ex.inactive && ex.mode === 'async';
    const checks = [{ key: 'exam', label: 'Exam', value: er.eligible ? (S.exams[o.examId].on ? 'Can run async' : "Can't run async") : 'Locked', pass: examOn(o.examId), note: er.lock || '' }];
    if (block) checks.push({ key: 'except', label: `Exam rule: ${name}`, value: 'Video here', pass: false, note: ex.note || '' });
    checks.push({ key: 'state', label: `State: ${name}`, value: widen && !sr.allowed ? 'Allowed for this exam' : sr.label, pass: sr.allowed || widen, note: widen && !sr.allowed ? `${sr.label}, but an exam rule allows async here (${QW('qb')} preview)` : '' });
    if (st.firstVideo) checks.push({ key: 'first', label: 'First visit', value: o.returning ? 'Returning patient' : 'New patient', pass: !!o.returning, note: `${name}: first visit must be video` });
    const ro = rolloutOf(o.clinicId);
    checks.push({ key: 'rollout', label: `Rollout: ${c.name}`, value: ro.label, pass: ro.on, note: ro.note });
    const fail = checks.find((k) => !k.pass);
    const why = !fail ? null : {
      exam: er.lock ? `${er.lock}.` : "This exam can't run async yet.",
      except: `This exam is video in ${name} (an exam rule).`,
      state: `${sr.why}.`,
      first: `${name} requires a video visit for a patient's first visit.`,
      rollout: `Async review isn't available for ${c.name} yet.`,
    }[fail.key];
    return { allowed: !fail, checks, why };
  }
  const recRules = (r) => rules({ examId: r.examId, clinicId: r.clinicId, state: r.patient.state, returning: r.patient.returning });

  /* Rules first, then the clinic's pick (or the API mode), then what the patient may choose. */
  function decide(o) {
    const e = EXAM_BY[o.examId]; const c = CLINIC_BY[o.clinicId];
    if (!e || !c) return null;
    const channel = o.channel || 'portal';
    if (channel === 'quidget' || channel === 'instant') return { type: 'today', title: 'Behaves as today', reason: `${CHANNELS[channel]} invites aren't part of this design. They run exactly as they do today.`, checks: [] };
    if (e.copy) {
      if (S.whatif.q5 === 'retire') return { type: 'video', title: 'Not offered', reason: `Retired at launch (${QW('q5')} preview). This exam no longer appears on invites.`, checks: [] };
      return { type: 'async', copy: true, title: 'Async review (async copy)', reason: "Today's async copy. It runs async as it does today and doesn't use the hub's rules.", checks: [], choiceNote: 'Runs as it does today.' };
    }
    if (e.urgent) return { type: 'video', title: 'Video visit', reason: 'Urgent care always runs as a video visit.', checks: [] };
    let mode = channel === 'api' ? (o.apiMode || 'none') : 'portal';
    if (mode === 'none') {
      if (S.whatif.qc !== 'choice') return { type: 'today', api: true, title: 'Behaves as today', reason: `No mode was sent, so this API invite runs as it does today (${QW('qc')}'s default).`, checks: [] };
      mode = 'patient_choice';
    }
    const R = rules(o); const cs = csetFor(o.clinicId);
    let pick; let source; let choose;
    if (mode === 'portal') { pick = o.pick || cs.defaultType; source = o.pick ? 'invite' : 'default'; choose = o.letChoose == null ? cs.choice : !!o.letChoose; }
    else if (mode === 'force_sync') { pick = 'video'; source = 'api'; choose = false; }
    else if (mode === 'force_async') { pick = 'async'; source = 'api'; choose = false; }
    else { pick = 'async'; source = 'api'; choose = true; }
    const type = R.allowed && pick === 'async' ? 'async' : 'video';
    const canVideo = type === 'async' && (choose || S.whatif.qa === 'keep');
    const canAsync = type === 'video' && R.allowed && choose;
    let reason;
    if (mode === 'force_sync') reason = 'The API asked for a video visit (force_sync).';
    else if (!R.allowed) reason = mode === 'force_async' ? `The API asked for async review, but the rules say video. ${R.why}` : R.why;
    else if (mode === 'force_async') reason = 'The API asked for async review (force_async), and the rules allow it.';
    else if (mode === 'patient_choice') reason = 'Async comes first under patient_choice, and the rules allow it.';
    else if (type === 'async') reason = source === 'default' ? "The rules allow it, and it's the clinic's default." : 'The rules allow it, and the clinic picked it on this invite.';
    else reason = source === 'default' ? "The rules allow async, but the clinic's default is a video visit." : 'The rules allow async, but the clinic picked a video visit on this invite.';
    let choiceNote;
    if (type === 'async') choiceNote = canVideo ? (choose ? 'The patient can switch to a video visit.' : `Patient choice is off, but the patient can still switch to video (${QW('qa')}'s default).`) : `The patient gets async review. Patient choice is off (${QW('qa')} preview).`;
    else choiceNote = canAsync ? 'The patient can submit for review instead, with no video call.' : !R.allowed ? "The patient can't pick async here: the rules say video." : 'The patient gets a video visit. Patient choice is off.';
    return { type, title: typeLabel(type), reason, rulesReason: R.allowed ? 'The rules allow async review here.' : R.why, checks: R.checks, allowed: R.allowed, pick, source, choose, canVideo, canAsync, choiceNote, mode, api: channel === 'api', converted: type === 'async' };
  }
  function inviteDecision() {
    const v = S.invite; const e = EXAM_BY[v.examId];
    return e && selectable(e) ? decide({ channel: 'portal', clinicId: v.clinicId, state: v.state, examId: v.examId, returning: v.returning, pick: v.pick, letChoose: v.letChoose }) : null;
  }

  /* ------------------------------------------------------------------ mutations */
  const rec = (id) => S.records.find((r) => r.id === id);
  const wtRec = () => (S.wtRecordId ? rec(S.wtRecordId) : null);
  const wtChoiceRec = () => (S.wtChoiceId ? rec(S.wtChoiceId) : null);
  const curPtRec = () => rec(S.view.patientId) || S.records.find((r) => !r.seed) || null;
  function addLog(who, what, from, to, note) { S.log.unshift({ at: now(), who, what, from, to, note: note || '' }); }
  function flagAffected() {
    const ids = S.records.filter((r) => r.type === 'async' && r.converted && OPEN.includes(r.status) && !recRules(r).allowed).map((r) => r.id);
    S.affected = ids.length ? { ids } : null;
  }

  function saveStateChange(code, status, firstVideo, note, who) {
    const by = who || YOU; const prev = S.states[code];
    const fvChanged = !!prev.firstVideo !== !!firstVideo;
    S.states[code] = { status, firstVideo: !!firstVideo, note, at: now(), by };
    if (prev.status !== status || !fvChanged) addLog(by, `${stateName(code)} set to ${STATUS_LABEL[status]}`, STATUS_LABEL[prev.status], STATUS_LABEL[status], note);
    if (fvChanged) addLog(by, `${stateName(code)}: first visit must be video, switched ${firstVideo ? 'on' : 'off'}`, firstVideo ? 'Off' : 'On', firstVideo ? 'On' : 'Off', note);
    flagAffected();
  }
  function setExam(id, on, who) {
    const e = EXAM_BY[id]; if (on && !examRule(id).eligible) return;
    if (!!S.exams[id].on === on) return;
    S.exams[id].on = on;
    addLog(who || YOU, `${e.name}: ${on ? 'can run async' : "can't run async"}`, on ? 'Off' : 'On', on ? 'On' : 'Off', '');
    flagAffected();
  }
  const exLabel = (m) => (m === 'video' ? 'Video here' : m === 'async' ? 'Async here' : 'Follows the state');
  function setException(examId, code, mode, note, who) {
    const e = EXAM_BY[examId]; const cur = S.exams[examId].except[code];
    if (mode) S.exams[examId].except[code] = { mode, note, at: now(), by: who || YOU };
    else delete S.exams[examId].except[code];
    addLog(who || YOU, `${e.name}: exam rule for ${stateName(code)}`, exLabel(cur && cur.mode), exLabel(mode), note || '');
    flagAffected();
  }
  function setRollout(id, on, who) {
    const c = CLINIC_BY[id];
    if (S.whatif.q7 === 'reuse') {
      if (!!S.asyncToday[id] === on) return;
      S.asyncToday[id] = on;
      addLog(who || YOU, `${c.name}: ${T.asyncFlag || 'the existing async setting'} switched ${on ? 'on' : 'off'}`, on ? 'Off' : 'On', on ? 'On' : 'Off', `${cap(QW('q7'))} preview: the rollout flag is the existing async setting`);
    } else {
      if (!!S.rollout[id] === on) return;
      S.rollout[id] = on;
      addLog(who || YOU, `${c.name} ${on ? 'added to' : 'removed from'} the async rollout`, on ? 'Not in' : 'In', on ? 'In' : 'Not in', '');
    }
    flagAffected();
  }
  function moveToVideo(id) {
    const r = rec(id); if (!r) return;
    const why = recRules(r).why || 'The rules changed.';
    r.type = 'video'; r.status = 'waiting-video'; r.heldUntil = null; r.converted = false;
    r.reason = `Moved to a video visit by hand after the rules changed. ${why}`;
    r.events.push({ at: now(), text: 'Moved to a video visit by hand (Async admin).' });
    addLog(YOU, `Exam #${id} moved to a video visit by hand`, 'Async review', 'Video visit', why);
    flagAffected();
  }

  function sendInvite() {
    const v = S.invite; const d = inviteDecision();
    const type = d.type === 'async' ? 'async' : 'video'; const engine = type === 'async' && !d.copy;
    const t = now();
    const r = {
      id: S.nextId++, patient: { first: v.first, last: v.last, email: v.email, phone: v.phone, state: v.state, returning: v.returning, lastVisit: v.lastVisit },
      clinicId: v.clinicId, examId: v.examId, channel: 'portal', createdAt: t, decidedAt: t, type, sentAs: type,
      converted: engine, convertedBy: engine ? 'clinic' : null, copy: !!d.copy,
      reason: d.reason, rulesReason: d.rulesReason || d.reason, checks: d.checks || [], allowed: !!d.allowed,
      clinicPick: d.pick || type, pickSource: d.source || null, letChoose: d.choose == null ? null : !!d.choose,
      canVideo: !!d.canVideo, canAsync: !!d.canAsync, choiceNote: d.choiceNote || '',
      patientChoice: null, status: 'invited', heldUntil: null, claimedBy: null, answers: null, seed: false,
      events: [{ at: t, text: `Invite sent from the clinic portal. Created once, as ${type === 'async' ? 'an async review' : 'a video visit'}.` }],
    };
    S.records.unshift(r);
    Object.assign(S.invite, { pick: null, letChoose: null });
    S.modal = { kind: 'sent', id: r.id };
    S.view.clinic = 'results';
    S.view.patientId = r.id; S.view.pscreen = 'sms'; S.intake = emptyIntake();
    return r;
  }

  function patientOpen(r) {
    if (!r) return;
    if (r.status === 'invited') { r.status = 'opened'; r.events.push({ at: now(), text: 'Patient opened the invite.' }); }
    if (!OPEN_PT.includes(r.status)) { S.view.pscreen = DONE_PT.includes(r.status) ? 'status' : 'video'; return; }
    if (r.type !== 'async') { S.view.pscreen = 'questions'; return; }
    S.view.pscreen = S.whatif.q10 === 'location' && !r.locationChecked ? 'location' : 'welcome';
  }
  function toVideo(r, reason, event, byPatient) {
    r.type = 'video'; r.status = 'waiting-video'; r.heldUntil = null; r.reason = reason; r.converted = false;
    if (byPatient) r.patientChoice = 'video';
    r.events.push({ at: now(), text: event });
    S.view.pscreen = 'video';
  }
  function patientChooseVideo(r) {
    if (r && r.type === 'async' && r.canVideo && OPEN_PT.includes(r.status)) toVideo(r, 'The patient chose a video visit.', 'Patient chose a video visit. The choice is recorded on the exam.', true);
  }
  function patientLocation(r) {
    if (!r) return;
    const loc = S.intake.location || r.patient.state; r.locationChecked = true; r.locationState = loc;
    const sr = stateRule(loc);
    if (!sr.allowed) { toVideo(r, `Moved to a video visit: during the exam the patient was in ${stateName(loc)}. ${sr.why} (${QW('q10')} preview).`, `Moved to a video visit: the patient was in ${stateName(loc)} (${QW('q10')} preview).`, false); return; }
    S.view.pscreen = 'welcome';
  }
  function keepAnswers(r) { r.answers = JSON.parse(JSON.stringify(S.intake)); r.answerKind = intakeKind(EXAM_BY[r.examId]); }
  function submitForReview(r) {
    if (!r || !OPEN_PT.includes(r.status)) return;
    const t = now();
    if (r.type === 'video') {
      if (!r.canAsync) return;
      Object.assign(r, { type: 'async', patientChoice: 'async', converted: true, convertedBy: 'patient', reason: 'The patient chose async review at submit, and the rules allow it.' });
      r.events.push({ at: t, text: 'Patient chose async review at submit. The choice is recorded on the exam.' });
    }
    r.status = 'submitted'; r.submittedAt = t; keepAnswers(r);
    if (r.converted && S.whatif.q2 === 'yes') r.heldUntil = t + S.access.holdHours * 36e5;
    r.events.push({ at: t, text: 'Patient submitted the answers for review.' });
    S.view.pscreen = 'done';
  }
  function submitForVideo(r) {
    if (!r || !OPEN_PT.includes(r.status)) return;
    keepAnswers(r);
    if (r.type === 'async') { if (r.canVideo) toVideo(r, 'The patient chose a video visit at submit.', 'Patient chose a video visit at submit. The choice is recorded on the exam.', true); return; }
    r.status = 'waiting-video';
    r.events.push({ at: now(), text: 'Patient submitted the answers and joined the video waiting room.' });
    S.view.pscreen = 'video';
  }
  function claim(id, who) {
    const r = rec(id); if (!r || r.status !== 'submitted') return;
    r.status = 'in-review'; r.claimedBy = who;
    r.events.push({ at: now(), text: `Claimed by ${who === 'ft' ? D.PROVIDERS.ft.name + ', full-time' : D.PROVIDERS.c1099.name + ', 1099'}.` });
  }
  function finish(id, outcome) {
    const r = rec(id); if (!r || r.status !== 'in-review') return;
    r.status = outcome;
    r.events.push({ at: now(), text: outcome === 'completed' ? 'Approved. Exam completed.' : "Deferred, using today's process." });
  }
  function queueFor(as) {
    const list = S.records.filter((r) => r.type === 'async' && (r.status === 'submitted' || r.status === 'in-review') && (!r.claimedBy || r.claimedBy === as));
    if (as === 'ft') return { shown: list, held: [] };
    const shown = []; const held = [];
    list.forEach((r) => { if (r.converted && r.heldUntil && now() < r.heldUntil && r.claimedBy !== as) held.push(r); else shown.push(r); });
    return { shown, held };
  }
  function scorecard() {
    const live = S.records.filter((r) => !r.seed);
    const conv = live.filter((r) => r.converted && r.type === 'async');
    const done = conv.filter((r) => r.status === 'completed' || r.status === 'deferred');
    return {
      total: live.length,
      withReason: live.filter((r) => r.reason && Array.isArray(r.checks)).length,
      blocked: S.records.filter((r) => r.type === 'async' && r.converted && OPEN.includes(r.status) && !recRules(r).allowed).length,
      converted: conv.length, byClinic: conv.filter((r) => r.convertedBy === 'clinic').length, byPatient: conv.filter((r) => r.convertedBy === 'patient').length,
      convDone: done.length, ftDone: done.filter((r) => r.claimedBy === 'ft').length, deferred: done.filter((r) => r.status === 'deferred').length,
      choseVideo: live.filter((r) => r.patientChoice === 'video').length, choseAsync: live.filter((r) => r.patientChoice === 'async').length,
    };
  }
  const previewCount = () => Object.keys(WHATIF_DEFAULTS).filter((k) => S.whatif[k] !== WHATIF_DEFAULTS[k]).length;

  function inviteCopy(r) {
    const c = CLINIC_BY[r.clinicId].name; const e = EXAM_BY[r.examId]; const f = r.patient.first;
    if ((r.sentAs || r.type) === 'async') {
      return {
        sms: `${c}: Hi ${f}, your ${e.short} is ready. Answer a few questions and a licensed provider will review them. No video call needed${r.canVideo ? ', and you can choose a video visit instead' : ''}. Start here: [secure link]`,
        subject: `Your ${e.short} with ${c}: no video call needed`,
        email: `Hi ${f},\n\n${c} has sent you a ${e.short}. It's an async review: you answer a few questions, add photos if asked, and a licensed provider reviews them. There's no video call to schedule.${r.canVideo ? '\n\nPrefer to talk to a provider? You can choose a video visit on the first screen.' : ''}\n\n[Start my ${e.short}]`,
      };
    }
    if (r.canAsync) {
      return {
        sms: `${c}: Hi ${f}, your ${e.short} is ready. Answer a few questions, then meet a licensed provider by video, or send your answers for review with no video call. Start here: [secure link]`,
        subject: `Your ${e.short} with ${c}`,
        email: `Hi ${f},\n\n${c} has sent you a ${e.short}. You'll answer a few questions, then meet a licensed provider by live video.\n\nNo time for a call? When you submit your answers, you can send them for review instead. A licensed provider reviews them, with no video call.\n\n[Start my visit]`,
      };
    }
    return {
      sms: `${c}: Hi ${f}, your ${e.short} is ready. You'll meet a licensed provider by video. Start here: [secure link]`,
      subject: `Your ${e.short} with ${c}`,
      email: `Hi ${f},\n\n${c} has sent you a ${e.short}. You'll meet a licensed provider by live video.\n\n[Start my visit]`,
    };
  }

  /* ------------------------------------------------------------------ shared components */
  function vtBadges(r) {
    let h = '';
    if (r.type === 'async') {
      h += '<span class="badge b-async">Async review</span>';
      if (r.copy) h += '<span class="badge b-copy">Async copy</span>';
      if (r.converted) h += '<span class="badge b-conv">Converted</span>';
      if (r.patientChoice === 'async') h += '<span class="badge b-choice">Patient chose async</span>';
    } else {
      h += '<span class="badge b-video">Video visit</span>';
      if (r.patientChoice === 'video') h += '<span class="badge b-choice">Patient chose video</span>';
      else if (r.allowed && r.clinicPick === 'video') h += '<span class="badge b-choice">Clinic picked video</span>';
    }
    return h;
  }
  function checksList(checks) {
    if (!checks || !checks.length) return '';
    return `<ul class="checks">${checks.map((k) => `<li class="${k.pass ? 'pass' : 'fail'}"><span class="ci">${I(k.pass ? 'check' : 'x')}</span><span class="cl">${esc(k.label)}${k.note ? `<small>${esc(k.note)}</small>` : ''}</span><span class="cv">${esc(k.value)}</span></li>`).join('')}</ul>`;
  }
  function decisionCard(d) {
    if (!d) return '';
    const cls = d.type === 'async' ? 'async' : d.type === 'today' ? 'today' : 'video';
    const ico = d.type === 'async' ? 'fileText' : d.type === 'today' ? 'arrowRight' : 'video';
    const api = d.api ? '<span class="chip chip-open">Designed now, built later</span>' : '';
    return `<div class="decision-card ${cls}"><div class="dc-head"><div class="dc-ico">${I(ico)}</div><h4>${esc(d.title)}</h4>${api}</div><p class="dc-reason">${esc(d.reason)}</p>${d.choiceNote ? `<p class="dc-choice">${I('repeat')}<span>${esc(d.choiceNote)}</span></p>` : ''}${checksList(d.checks)}</div>`;
  }
  function pickText(r) {
    if (r.clinicPick == null) return 'None';
    const src = r.pickSource === 'default' ? "the clinic's default" : r.pickSource === 'invite' ? 'picked on the invite' : r.pickSource === 'api' ? 'set by the API' : '';
    return `${typeLabel(r.clinicPick)}${src ? `, ${src}` : ''}`;
  }
  function auditCard(r, id) {
    const c = CLINIC_BY[r.clinicId]; const e = EXAM_BY[r.examId];
    const choice = r.patientChoice === 'video' ? 'Chose a video visit' : r.patientChoice === 'async' ? 'Chose async review at submit' : 'None';
    return `<div class="card audit"${id ? ` id="${id}"` : ''}>
      <div class="audit-head">${I('shieldCheck')}<h3>Why this is ${r.type === 'async' ? 'an async review' : 'a video visit'}</h3></div>
      <div>${vtBadges(r)}</div>
      <p class="dc-reason" style="margin-top:4px">${esc(r.reason)}</p>
      ${r.rulesReason && r.rulesReason !== r.reason ? `<p class="small muted" style="margin:6px 0 0">When the invite was sent, the rules said: ${esc(r.rulesReason)}</p>` : ''}
      ${r.checks && r.checks.length ? `<div class="audit-sub">Rules when the invite was sent, ${fmtDT(r.decidedAt)}</div>${checksList(r.checks)}` : ''}
      <dl class="kv"><dt>Exam</dt><dd>${esc(e.name)}, #${r.id}</dd><dt>Sent from</dt><dd>${CHANNELS[r.channel]}</dd><dt>Clinic</dt><dd>${esc(c.name)}</dd><dt>Patient's state</dt><dd>${esc(stateName(r.patient.state))}</dd><dt>Patient</dt><dd>${r.patient.returning ? 'Returning' : 'New'}</dd><dt>Clinic's pick</dt><dd>${esc(pickText(r))}</dd><dt>Patient choice</dt><dd>${r.letChoose == null ? 'n/a' : r.letChoose ? 'Allowed' : 'Off'}</dd><dt>Patient's choice</dt><dd>${choice}</dd></dl>
      <div class="audit-sub">History</div>
      <ul class="timeline">${r.events.map((ev) => `<li><time>${fmtDT(ev.at)}</time>${esc(ev.text)}</li>`).join('')}</ul>
    </div>`;
  }
  function topbar(title, icon, right, backAct) {
    const lead = backAct ? `<button class="back-ico" data-act="${backAct}" aria-label="Back">${I('arrowLeft')}</button>` : icon ? I(icon) : '';
    return `<header class="top"><h1>${lead}${esc(title)}</h1><div class="right">${right || ''}</div></header>`;
  }

  /* ------------------------------------------------------------------ Async admin (admin portal) */
  const RAIL = ['menu', 'userMd', 'clipboardCheck', 'plusSquare', 'home', 'clipboardPlus', 'users', 'rx', 'layout', 'userPlus', 'signature', 'userLock', 'stethoscope', 'briefcase'];
  function rail() {
    return `<aside class="rail"><div class="mark">${I('stethoscope')}</div>${RAIL.map((n) => `<button data-act="noop" aria-label="Menu item">${I(n)}</button>`).join('')}<button class="on" data-act="sa-go" data-page="settings" aria-label="Settings">${I('cog')}</button></aside>`;
  }
  function viewSuperAdmin() {
    const body = S.view.sa === 'hub' ? viewHub() : viewSettings();
    return `<div class="shell sa">${rail()}<main class="main">${topbar('Settings', 'cog', `<button class="btn btn-lav" data-act="noop">${I('logout')} Logout</button>`)}<div class="page">${body}</div></main></div>`;
  }
  function viewSettings() {
    return `<div class="settings-list">
      <button class="btn btn-lav wide" data-act="noop">${I('fileText')} Batch Download Exams</button>
      <button class="btn btn-lav wide" data-act="noop">${I('fileText')} Collaborating Physician Batch Download Exams</button>
      <button class="btn btn-lav wide" data-act="noop">${I('copy')} Export Logs</button>
      <button class="btn btn-lav wide" id="btn-hub" data-act="sa-go" data-page="hub">${I('shield')} Compliance Hub <span class="chip chip-new">New</span></button>
    </div>
    ${dnote('Where it lives', 'One <b>Compliance Hub</b> on Settings holds the async rules, instead of another SuperAdmin button. <b>Async Access Settings</b> moves into it, and roles and permissions join it later. Changing the rules needs the <b>Async admin</b> role, which a SuperAdmin grants.', 'style="max-width:640px;margin-top:22px"')}`;
  }
  function viewHub() {
    const area = S.view.area || 'async';
    const areas = [['async', 'scale', 'Async conversion'], ['access', 'hourglass', 'Async Access Settings'], ['roles', 'userLock', 'Roles and permissions']];
    const body = area === 'access' ? viewAccess() : area === 'roles' ? viewRoles() : viewAsyncRules();
    return `<button class="back" data-act="sa-go" data-page="settings">${I('arrowLeft')} Back</button>
    <div class="hub-head"><div class="hub-icon">${I('shield')}</div><div><h1>Compliance Hub <span class="chip chip-demo">Demo</span><span class="chip chip-lock">${I('key')} Async admin role</span></h1><p>One place for the rules. Async conversion lives here, Async Access Settings moves in, and roles and permissions join later.</p></div></div>
    <div class="areas" role="tablist">${areas.map(([id, ic, l]) => `<button class="${area === id ? 'on' : ''}" data-act="hub-area" data-area="${id}">${I(ic)} ${l}${id === 'roles' ? ' <span class="chip chip-def">Later</span>' : ''}</button>`).join('')}</div>
    ${body}`;
  }
  function counts() {
    const c = { async: 0, video: 0, conditional: 0, unreviewed: 0, fv: 0 };
    Object.values(S.states).forEach((s) => { c[s.status]++; if (s.firstVideo) c.fv++; });
    return c;
  }
  function stat(cls, k, v, s) { return `<div class="tile-stat"><div class="k"><span class="sq ${cls}"></span>${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`; }
  function viewAsyncRules() {
    const c = counts();
    const eligible = D.EXAMS.filter((e) => examRule(e.id).eligible);
    const examsOn = eligible.filter((e) => S.exams[e.id].on).length;
    const open = S.whatif.qd === 'open';
    const inRo = D.CLINICS.filter((cl) => inRollout(cl.id)).length;
    const tab = S.view.hubTab;
    const tabs = [['states', 'map', 'States'], ['exams', 'fileText', 'Exams'], ['rollout', 'flag', 'Rollout'], ['test', 'flask', 'Test an invite'], ['log', 'history', 'Change log'], ['pilot', 'activity', 'Pilot']];
    const body = { states: hubStates, exams: hubExams, rollout: hubRollout, test: hubTest, log: hubLog, pilot: hubPilot }[tab] || hubStates;
    return `<p class="area-lede">Where an exam can run as an async review. Each new invite is checked when it's created: the exam, the patient's state, the first-visit rule and the rollout. Within those rules, the clinic picks the visit type and the patient can choose.</p>
    <div class="banner warn">${I('alert')}<div>Demo data. State settings, first-visit rules, exam rules and clinics are illustrative, not legal guidance. In production, Compliance decides each one.</div></div>
    <div class="tiles">
      ${stat('async', 'Async allowed', c.async, 'states')}
      ${stat('video', 'Video only', c.video, 'states')}
      ${stat('conditional', 'Conditional', c.conditional, 'video for now')}
      ${stat('unreviewed', 'Not reviewed', c.unreviewed, S.whatif.q3 === 'on' ? `allow async (${QW('q3')} preview)` : 'stay video')}
      <div class="tile-stat"><div class="k"><i class="fvdot"></i>First visit video</div><div class="v">${c.fv}</div><div class="s">states with the rule</div></div>
      <div class="tile-stat"><div class="k">${I('fileText')} Exams on</div><div class="v">${examsOn}</div><div class="s">of ${eligible.length} that could be</div></div>
      <div class="tile-stat"><div class="k">${I('flag')} In the rollout</div><div class="v">${open ? 'All' : inRo}</div><div class="s">${open ? `open to all (${QW('qd')} preview)` : `of ${D.CLINICS.length} demo clinics`}</div></div>
    </div>
    <div class="tabs" role="tablist">${tabs.map(([id, ic, label]) => `<button class="${tab === id ? 'on' : ''}" data-act="hub-tab" data-tab="${id}">${I(ic)} ${label}${id === 'log' ? ` <span class="count">${S.log.length}</span>` : ''}</button>`).join('')}</div>
    ${affectedCard()}
    ${body()}`;
  }
  const matchFilter = (code) => { const st = S.states[code]; const f = S.view.filter; return f === 'all' || (f === 'fv' ? !!st.firstVideo : st.status === f); };
  function hubStates() {
    const c = counts(); const f = S.view.filter; const ed = S.view.stateEdit;
    const filters = [['all', 'All', 51], ['async', 'Async allowed', c.async], ['video', 'Video only', c.video], ['conditional', 'Conditional', c.conditional], ['unreviewed', 'Not reviewed', c.unreviewed], ['fv', 'First visit video', c.fv]];
    const head = `<div class="card-head"><div class="filters">${filters.map(([id, l, n]) => `<button class="${f === id ? 'on' : ''}" data-act="st-filter" data-f="${id}">${l} <span class="n">${n}</span></button>`).join('')}</div><div class="seg"><button class="${S.view.mapMode === 'map' ? 'on' : ''}" data-act="map-mode" data-mode="map">${I('map')} Map</button><button class="${S.view.mapMode === 'list' ? 'on' : ''}" data-act="map-mode" data-mode="list">${I('list')} List</button></div></div>`;
    const panel = ed ? stateEditor(ed) : `<div class="placeholder"><div class="ph-ico">${I('map')}</div><h4>Select a state</h4><p class="small">Click a state to set it to Async allowed, Video only or Conditional, and to set its first-visit rule. Every change needs a note and lands in the change log.</p></div>`;
    return `<div class="states-wrap"><div class="card">${head}${S.view.mapMode === 'map' ? stateMap() : stateList()}${legend()}</div><div class="card editor" id="state-editor">${panel}</div></div>`;
  }
  function stateMap() {
    const sel = S.view.stateEdit && S.view.stateEdit.code;
    return `<div class="map">${D.STATES.map((s) => {
      const st = S.states[s.code]; const cls = [st.status];
      if (st.status === 'unreviewed' && S.whatif.q3 === 'on') cls.push('default-on');
      if (st.firstVideo) cls.push('fv');
      if (!matchFilter(s.code)) cls.push('dim');
      if (sel === s.code) cls.push('sel');
      return `<button class="st ${cls.join(' ')}" style="grid-column:${s.col + 1};grid-row:${s.row + 1}" data-act="st-open" data-code="${s.code}" title="${esc(s.name)}: ${esc(STATUS_LABEL[st.status])}${st.firstVideo ? '. First visit must be video' : ''}">${s.code}</button>`;
    }).join('')}</div>`;
  }
  function stateList() {
    const rows = D.STATES.slice().sort((a, b) => a.name.localeCompare(b.name)).filter((s) => matchFilter(s.code)).map((s) => {
      const st = S.states[s.code];
      return `<tr class="click" data-act="st-open" data-code="${s.code}"><td><b>${esc(s.name)}</b></td><td class="nowrap"><span class="row" style="gap:6px"><span class="sq ${st.status}"></span>${STATUS_LABEL[st.status]}</span></td><td class="nowrap">${st.firstVideo ? '<span class="row" style="gap:6px"><i class="fvdot"></i>Must be video</span>' : '<span class="muted small">No rule</span>'}</td><td class="muted">${esc(st.note || '')}</td><td class="nowrap muted small">${st.at ? `${fmtDay(st.at)}<span class="sub">${esc(st.by)}</span>` : 'Never'}</td></tr>`;
    }).join('');
    return `<div style="max-height:520px;overflow:auto"><table class="tbl"><thead><tr><th>State</th><th>Setting</th><th>First visit</th><th>Note</th><th>Last change</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function legend() {
    return `<div class="legend"><span><i class="sq async"></i>Async allowed</span><span><i class="sq video"></i>Video only</span><span><i class="sq conditional"></i>Conditional (video for now)</span><span><i class="sq unreviewed"></i>Not reviewed (${S.whatif.q3 === 'on' ? 'async by default' : 'video'})</span><span><i class="fvdot"></i>First visit must be video</span></div>`;
  }
  const editFor = (code) => { const st = S.states[code]; return { code, status: st.status === 'unreviewed' ? 'async' : st.status, firstVideo: !!st.firstVideo, note: '' }; };
  function canSaveState() {
    const ed = S.view.stateEdit; if (!ed) return false;
    const st = S.states[ed.code]; const note = (ed.note || '').trim();
    return !!note && (ed.status !== st.status || !!ed.firstVideo !== !!st.firstVideo || note !== st.note);
  }
  function stateEditor(ed) {
    const st = S.states[ed.code];
    const opts = [
      ['async', 'Async allowed', 'Invites can run as an async review when the exam rules and the rollout allow it.'],
      ['video', 'Video only', 'Every invite for a patient in this state is a video visit.'],
      ['conditional', 'Conditional', 'Allowed only under conditions, like a recent video visit. Counts as video for now.'],
    ];
    const nowNote = st.status === 'unreviewed' ? (S.whatif.q3 === 'on' ? ` (allows async under the ${QW('q3')} preview)` : ' (stays video)') : '';
    return `<h3>${esc(stateName(ed.code))}</h3><div class="now">Now: <b>${STATUS_LABEL[st.status]}</b>${nowNote}${st.firstVideo ? ', first visit must be video' : ''}</div>
    ${opts.map(([v, l, dsc]) => `<button class="rc ${ed.status === v ? 'sel' : ''}" data-act="st-pick" data-v="${v}"><span class="rd"></span><span><b><i class="sq ${v}"></i>${l}</b><small>${dsc}</small></span></button>`).join('')}
    <div class="fv-row"><div><b><i class="fvdot"></i>First visit must be video</b><small>A new patient's first visit in this state is a video visit. Later visits follow the setting above.${ed.status !== 'async' ? ' It only matters while the state allows async.' : ''}</small></div><button class="sw ${ed.firstVideo ? 'on' : ''}" id="st-fv" data-act="st-fv" aria-label="First visit must be video"></button></div>
    <label class="field"><span>Note (required)</span><textarea id="st-note" data-bind="view.stateEdit.note" placeholder="Why, and what Compliance based it on">${esc(ed.note)}</textarea></label>
    <div class="actions"><button class="btn btn-cta" id="btn-save-state" data-act="st-save" ${canSaveState() ? '' : 'disabled'}>Save change</button><button class="btn btn-ghost" data-act="st-cancel">Close</button></div>
    <p class="small muted" style="margin:10px 0 0">Applies to new invites at once. Open async exams that no longer meet the rules are moved by hand.</p>
    <div class="last">${st.at ? `Last change ${fmtDT(st.at)} by ${esc(st.by)}${st.note ? `: "${esc(st.note)}"` : ''}` : 'Never changed.'}</div>`;
  }
  function affectedCard() {
    const a = S.affected; if (!a || !a.ids.length) return '';
    const n = a.ids.length;
    const rows = a.ids.map(rec).filter(Boolean).map((r) => `<li><span><b>#${r.id}</b> ${esc(r.patient.first)} ${esc(r.patient.last)}, ${esc(EXAM_BY[r.examId].name)} <span class="muted small">(${REC_STATUS[r.status]})</span><span class="sub">${esc(recRules(r).why || '')}</span></span><button class="btn btn-ghost sm" data-act="move-video" data-id="${r.id}">${I('video')} Move to video</button></li>`).join('');
    return `<div class="card affected"><div class="banner warn" style="margin-top:0">${I('alert')}<div><b>${n} open async exam${n > 1 ? 's' : ''} no longer meet${n > 1 ? '' : 's'} the rules.</b> ${n > 1 ? 'They stay' : 'It stays'} async until moved by hand. New invites already follow the rules. Moving them automatically is on the Later list.</div></div><ul>${rows}</ul></div>`;
  }
  function hubExams() {
    const ed = S.view.examEdit; const widen = S.whatif.qb === 'widen';
    const rows = D.EXAMS.map((e) => {
      const er = examRule(e.id); const on = S.exams[e.id].on && er.eligible;
      const ready = e.urgent || e.copy ? '<span class="muted">n/a</span>' : e.ready ? `<span class="ready yes">${I('check')} Ready</span>` : `<span class="ready no">${I('alert')} Not yet</span>`;
      const rule = er.lock ? `<span class="lock-note">${I('lock')}<span>${esc(er.lock)}</span></span>` : `<span class="muted small">${on ? 'Follows the state defaults, with any exceptions.' : "Can't run async. Video everywhere."}</span>`;
      const exs = Object.entries(S.exams[e.id].except);
      const chips = exs.map(([code, x]) => `<span class="ex-chip ${x.mode}${x.mode === 'async' && !widen ? ' inactive' : ''}" title="${esc(x.note || '')}">${esc(stateName(code))}: ${x.mode === 'video' ? 'video' : 'async'}</span>`).join('');
      const exc = er.eligible ? `${chips}<button class="link small" data-act="ex-open" data-id="${e.id}">${exs.length ? 'Edit' : 'Add'}</button>` : '<span class="muted small">n/a</span>';
      return `<tr data-row="${e.id}" class="${er.eligible ? '' : 'locked'}${ed && ed.id === e.id ? ' sel' : ''}"><td><b>${esc(e.name)}</b><span class="sub">${esc(e.category)}</span></td><td class="nowrap">${ready}</td><td>${rule}</td><td>${exc}</td><td class="r"><button class="sw ${on ? 'on' : ''}" data-act="exam-toggle" data-id="${e.id}" ${er.eligible ? '' : 'disabled'} aria-label="Async for ${esc(e.name)}"></button></td></tr>`;
    }).join('');
    return `<div class="card" id="exam-card"><div class="card-head"><div><h3>Exams</h3><p class="muted small">An exam that can run async follows the state defaults. Its exceptions by state supersede them. Every switch starts off.</p></div></div>
    <table class="tbl"><thead><tr><th>Exam</th><th>Async-ready</th><th>Rule</th><th>Exceptions by state</th><th class="r">Can run async</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${ed ? examEditor(ed) : ''}
    ${dnote(`Open ${QW('q6')} (${qWho('q6')})`, '"Async-ready" stands in for whatever an exam must have before it can run async, for example async questions.')}
    ${dnote(`Open ${QW('qb')} (${qWho('qb')})`, 'An exception can keep an exam on video in a state that allows async. Whether one can also allow async where the state says video is open. Until then, "Async here" is off.')}`;
  }
  function canAddException() {
    const ed = S.view.examEdit;
    return !!(ed && ed.code && ed.mode && (ed.note || '').trim() && (ed.mode !== 'async' || S.whatif.qb === 'widen'));
  }
  function examEditor(ed) {
    const e = EXAM_BY[ed.id]; const exs = Object.entries(S.exams[ed.id].except); const widen = S.whatif.qb === 'widen';
    const list = exs.length
      ? `<ul class="ex-list">${exs.map(([code, x]) => `<li><span><b>${esc(stateName(code))}</b>: ${exLabel(x.mode)}${x.mode === 'async' && !widen ? ` <span class="chip chip-def">Not applied, ${QW('qb')}'s default</span>` : ''}<span class="sub">${esc(x.note || '')}</span></span><button class="btn btn-ghost sm" data-act="ex-remove" data-id="${ed.id}" data-code="${code}">Remove</button></li>`).join('')}</ul>`
      : '<p class="muted small" style="margin:10px 0 0">No exceptions. This exam follows the state defaults everywhere.</p>';
    return `<div class="card" id="exam-editor"><div class="row-between"><div><h3>Exceptions: ${esc(e.name)}</h3><p class="muted small" style="margin:2px 0 0">Exam rules supersede the state defaults for this exam. Every change is logged.</p></div><button class="btn btn-ghost sm" data-act="ex-close">Close</button></div>
      ${list}
      <div class="ex-add">
        <label class="field"><span>State</span><select id="ex-state" data-bind="view.examEdit.code" data-rerender>${opt('', 'Pick a state', ed.code)}${stateOptions(ed.code)}</select></label>
        <div class="field"><span>Rule</span><div class="seg"><button class="${ed.mode === 'video' ? 'on' : ''}" data-act="ex-mode" data-v="video">${I('video')} Video here</button><button class="${ed.mode === 'async' ? 'on' : ''}" data-act="ex-mode" data-v="async" ${widen ? '' : 'disabled'} title="${widen ? '' : `Waits on ${QW('qb')}`}">${I('fileText')} Async here</button></div></div>
        <label class="field"><span>Note (required)</span><input id="ex-note" data-bind="view.examEdit.note" value="${esc(ed.note)}" placeholder="Why, and what Compliance based it on"></label>
        <button class="btn btn-cta" id="btn-add-ex" data-act="ex-add" ${canAddException() ? '' : 'disabled'}>Add exception</button>
      </div>
      ${widen ? `<p class="small muted" style="margin:8px 0 0">${cap(QW('qb'))} preview: "Async here" allows async in a state whose default says video.</p>` : `<p class="small muted" style="margin:8px 0 0">"Async here" waits on ${QW('qb')}. Its default: exam rules only restrict.</p>`}
    </div>`;
  }
  function hubRollout() {
    const reuse = S.whatif.q7 === 'reuse'; const open = S.whatif.qd === 'open';
    const rows = D.CLINICS.map((c) => {
      const cs = csetFor(c.id); const on = reuse ? !!S.asyncToday[c.id] : !!S.rollout[c.id];
      return `<tr data-row="${c.id}"><td><b>${esc(c.name)}</b>${c.you ? '<span class="sub">The clinic you use in this demo. It stands in for a pilot clinic.</span>' : ''}</td><td>${c.pilot ? '<span class="chip chip-ok">Pilot</span>' : '<span class="muted small">Not yet</span>'}</td><td>${S.asyncToday[c.id] ? 'Yes' : 'No'}${T.asyncFlag ? `<span class="sub">${esc(T.asyncFlag)}</span>` : ''}</td><td>${typeLabel(cs.defaultType)}<span class="sub">${cs.choice ? 'Patients can choose' : 'Patient choice off'}</span></td><td class="r"><button class="sw ${on || open ? 'on' : ''}" data-act="rollout-toggle" data-id="${c.id}" ${open ? 'disabled' : ''} aria-label="Rollout for ${esc(c.name)}"></button></td></tr>`;
    }).join('');
    const reusedOn = D.CLINICS.filter((c) => S.asyncToday[c.id]).length;
    return `${open ? `<div class="banner bad">${I('alert')}<div><b>${cap(QW('qd'))} preview: open to all.</b> Every clinic can send async invites where the rules allow it. The rollout switches don't apply.</div></div>` : ''}
    ${reuse && !open ? `<div class="banner bad">${I('alert')}<div><b>${cap(QW('q7'))} preview: reusing the existing async setting.</b> The ${reusedOn} clinics that already use async are in the rollout at once, with no pilot step.</div></div>` : ''}
    <div class="card" id="rollout-card"><div class="card-head"><div><h3>Rollout</h3><p class="muted small">An internal Qualiphy flag for each clinic, off by default. It decides which clinics can send async invites at all. Clinics don't see it or change it.</p></div></div>
    <table class="tbl"><thead><tr><th>Clinic</th><th>Pilot</th><th>Uses async today</th><th>Clinic's settings</th><th class="r">In the rollout</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${dnote('The pilot (PRD)', `${esc(cap(F.pilotClinics || 'the 3 pilot clinics'))}. The rows above are demo clinics.`)}`;
  }
  function hubTest() {
    const t = S.tester; const cs = csetFor(t.clinicId);
    const d = decide({ channel: t.channel, apiMode: t.apiMode, clinicId: t.clinicId, state: t.state, examId: t.examId, returning: t.returning === 'yes', pick: t.pick === 'default' ? null : t.pick, letChoose: t.choose === 'default' ? null : t.choose === 'yes' });
    const portal = t.channel === 'portal'; const api = t.channel === 'api';
    return `<div class="grid2"><div class="card"><h3>Test an invite</h3><p class="muted small" style="margin:0 0 14px">Same logic as the clinic's invite screen. Nothing is sent.</p>
      <div class="form-grid">
        <label class="field"><span>Sent from</span><select id="tester-channel" data-bind="tester.channel" data-rerender>${Object.entries(CHANNELS).map(([k, v]) => opt(k, v, t.channel)).join('')}</select></label>
        ${api ? `<label class="field"><span>API mode</span><select id="tester-mode" data-bind="tester.apiMode" data-rerender>${Object.entries(API_MODES).map(([k, v]) => opt(k, v, t.apiMode)).join('')}</select></label>` : ''}
        <label class="field"><span>Clinic</span><select id="tester-clinic" data-bind="tester.clinicId" data-rerender>${D.CLINICS.map((c) => opt(c.id, c.name, t.clinicId)).join('')}</select></label>
        <label class="field"><span>Patient state</span><select id="tester-state" data-bind="tester.state" data-rerender>${stateOptions(t.state)}</select></label>
        <label class="field"><span>Exam</span><select id="tester-exam" data-bind="tester.examId" data-rerender>${D.EXAMS.map((x) => opt(x.id, x.name, t.examId)).join('')}</select></label>
        <label class="field"><span>Patient</span><select id="tester-returning" data-bind="tester.returning" data-rerender>${opt('yes', 'Returning patient', t.returning)}${opt('no', 'New patient', t.returning)}</select></label>
        ${portal ? `<label class="field"><span>Clinic's pick</span><select id="tester-pick" data-bind="tester.pick" data-rerender>${opt('default', `Clinic default (${typeLabel(cs.defaultType)})`, t.pick)}${opt('async', 'Async review', t.pick)}${opt('video', 'Video visit', t.pick)}</select></label>
        <label class="field"><span>Let the patient choose</span><select id="tester-choose" data-bind="tester.choose" data-rerender>${opt('default', `Clinic setting (${cs.choice ? 'on' : 'off'})`, t.choose)}${opt('yes', 'Yes', t.choose)}${opt('no', 'No', t.choose)}</select></label>` : ''}
      </div>
      ${api ? `<p class="small muted api-note">${I('info')}<span>API modes are designed now and built with API invites, later. In the first release, API invites run as today. A mode never overrides the rules.</span></p>` : ''}
      </div>
      <div id="tester-result">${decisionCard(d)}</div></div>`;
  }
  function hubLog() {
    const rows = S.log.map((l) => `<tr><td class="nowrap">${fmtDT(l.at)}</td><td class="log-who">${esc(l.who)}</td><td>${esc(l.what)}${l.from || l.to ? `<span class="sub log-change"><span class="from">${esc(l.from)}</span>${I('arrowRight')}<span>${esc(l.to)}</span></span>` : ''}</td><td class="muted">${esc(l.note)}</td></tr>`).join('');
    return `<div class="card" id="log-table"><div class="card-head"><div><h3>Change log</h3><p class="muted small">Who changed what, when, the old and new value, and why. Only the Async admin role can change the rules, and nothing is edited in place.</p></div></div><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>Change</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function hubPilot() {
    const sc = scorecard(); const su = D.PRD.success;
    const none = '<span class="na">None reviewed yet</span>';
    const rows = [
      [su[0], sc.blocked === 0 ? '<span class="good">0</span>' : `<span class="bad">${sc.blocked}</span>`],
      [su[1], sc.total ? `<span class="${sc.withReason === sc.total ? 'good' : 'bad'}">${sc.withReason} of ${sc.total}</span>` : '<span class="na">No invites yet</span>'],
      [su[2], sc.convDone ? `${sc.ftDone} of ${sc.convDone}` : none],
      [su[3], '<span class="na">Needs the baseline</span>'],
      [su[4], sc.convDone ? `${sc.deferred} of ${sc.convDone}` : none],
      [su[5], `${sc.converted}${sc.converted ? `<span class="sub">${sc.byClinic} by the clinic, ${sc.byPatient} by the patient</span>` : ''}`],
      [su[6], `${sc.choseVideo} chose video<span class="sub">${sc.choseAsync} chose async</span>`],
    ].filter(([m]) => m).map(([[m, t], v]) => `<tr><td>${esc(m)}</td><td class="muted">${esc(t)}</td><td>${v}</td></tr>`).join('');
    const items = [['Decisions answered', `0 of ${D.PRD.decisions.length}. The demo builds to the defaults.`]].concat(D.PRD.checklist || [])
      .map(([t, s]) => `<li><div><b>${esc(t)}</b><div class="small muted">${esc(s)}</div></div><span class="chip chip-open">Open</span></li>`).join('');
    return `<div class="grid-fit"><div class="card" id="scorecard"><h3>Pilot scorecard</h3><p class="muted small" style="margin:0 0 8px">The PRD's success measures after 30 days, counted live from this demo's exams.</p><table class="tbl score"><thead><tr><th>Measure</th><th>Target</th><th>Now</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="card"><h3>Before the pilot</h3><p class="muted small" style="margin:0">From the PRD's pilot plan.</p><ul class="checklist">${items}</ul><div class="row" style="margin-top:12px"><button class="btn btn-ghost sm" data-act="drawer" data-tab="decisions">${I('sliders')} Open the decisions</button></div></div></div>`;
  }
  function viewAccess() {
    const q2 = S.whatif.q2 === 'yes';
    return `<div class="card" style="max-width:760px" id="access-card">
      <div class="row-between"><div><h3>Converted exams: full-time providers first</h3><p class="muted small" style="margin:2px 0 0">1099 providers see a converted exam only after this hold. Other async exams work as today.</p></div>
      <div class="row"><input type="number" min="0" max="48" class="num" data-bind="access.holdHours" data-num data-after="clampHold" data-rerender value="${esc(S.access.holdHours)}" ${q2 ? '' : 'disabled'}><span class="muted">hours</span></div></div>
      ${q2 ? '' : `<div class="banner warn">${I('alert')}<div>${cap(QW('q2'))} is set to <b>No</b> in What if, so converted exams show to every provider at once.</div></div>`}
    </div>
    ${dnote('Existing screen, moving in', `Async Access Settings already controls when 1099 providers can see async exams, and moves into the Compliance Hub. Its real fields aren't copied here. This shows the one setting the pilot relies on (${QW('q2')}).`, 'style="max-width:760px"')}`;
  }
  function viewRoles() {
    const rows = [
      ['Async admin', 'Changes states, first-visit rules, exam rules and the rollout. Compliance at launch.', 'Granted by a SuperAdmin'],
      ['SuperAdmin', 'Grants roles. Almost no one has it.', 'Existing'],
      ['Clinic admin', "Sets the clinic's default visit type and whether patients can choose.", 'Existing'],
      ['Clinic staff', 'Picks the visit type on each invite, within the rules.', 'Existing'],
    ];
    return `<div class="card" style="max-width:860px" id="roles-card"><div class="card-head"><div><h3>Roles and permissions <span class="chip chip-def">Later</span></h3><p class="muted small">Joins the hub later. Shown here only for the roles async conversion needs.</p></div></div>
      <table class="tbl"><thead><tr><th>Role</th><th>Can</th><th>How they get it</th></tr></thead><tbody>${rows.map(([a, b, c]) => `<tr><td class="nowrap"><b>${esc(a)}</b></td><td>${esc(b)}</td><td class="muted">${esc(c)}</td></tr>`).join('')}</tbody></table></div>
      ${dnote('Separate demo', 'The full roles and permissions design is its own demo. This tab only shows where it lands.', 'style="max-width:860px"')}`;
  }

  /* ------------------------------------------------------------------ clinic */
  const CLINIC_MENU = [['Results', 'clipboard', 'results'], ['Clinics', 'home', ''], ['Managers', 'users', ''], ['Medication Management', 'pill', ''], ['Exams', 'plusSquare', ''], ['Knowledge Base', 'help', ''], ['Weight Loss Exam', 'edit', ''], ['Rewards', 'userPlus', ''], ['White Label', 'palette', ''], ['Settings', 'cog', 'settings']];
  function clinicSide() {
    const cur = S.view.clinic === 'invite' ? 'results' : S.view.clinic;
    return `<aside class="side"><div class="brand"><img src="assets/logo_white.png" alt="Qualiphy"></div><div class="dash">Dashboard ${I('x')}</div><nav>${CLINIC_MENU.map(([l, ic, pg]) => `<button class="${pg && pg === cur ? 'on' : ''}" data-act="${pg ? 'clinic-go' : 'noop'}" data-page="${pg}"${pg === 'settings' ? ' id="nav-clinic-settings"' : ''}>${I(ic)}${l}</button>`).join('')}<div class="gap"></div><button data-act="noop">${I('logout')}Logout</button></nav></aside>`;
  }
  function viewClinic() {
    const pg = S.view.clinic;
    if (pg === 'invite') return `<div class="shell">${clinicSide()}<main class="main">${topbar('Invite Patient', null, '', 'clinic-back')}<div class="page">${inviteForm()}</div></main></div>`;
    if (pg === 'settings') return `<div class="shell">${clinicSide()}<main class="main">${topbar('Settings', 'cog')}<div class="page">${clinicSettings()}</div></main></div>`;
    return `<div class="shell">${clinicSide()}<main class="main">${topbar('Results', 'clipboard', `<button class="btn btn-cta" data-act="clinic-go" data-page="invite" id="btn-invite">${I('plus')} Invite Patient</button>`)}<div class="page">${results()}</div></main></div>`;
  }
  function clinicSettings() {
    const cs = csetFor(MY); const ro = rolloutOf(MY); const keep = S.whatif.qa === 'keep';
    const choiceText = cs.choice
      ? "Patients can switch an async review to a video visit, or send a video invite's answers for review instead, when the rules allow it."
      : keep ? `Patients get the visit type you pick. On an async review, video stays one tap away (${QW('qa')}'s default).` : `Patients get exactly the visit type you pick (${QW('qa')} preview).`;
    return `${dnote('Where the clinic controls it', "Two new settings in the clinic portal's <b>Settings</b>. Clinic admins set them, and staff can change the visit type on each invite. Other settings don't change.", 'style="max-width:820px"')}
    <div class="card cset" id="clinic-async" style="max-width:820px">
      <div class="card-head"><div><h3>Async review <span class="chip chip-new">New</span></h3><p class="muted small">How new invites run when Qualiphy's rules allow async review.</p></div></div>
      ${ro.on ? '' : `<div class="banner info">${I('info')}<div>Async review isn't on for your clinic yet. Qualiphy is turning it on clinic by clinic. These settings apply once it is.</div></div>`}
      <div class="set-row"><div><b>Default visit type</b><small>Picked on every new invite. Staff can change it for one invite.</small></div><div class="seg" id="cset-default"><button class="${cs.defaultType === 'async' ? 'on' : ''}" data-act="cset-default" data-v="async">${I('fileText')} Async review</button><button class="${cs.defaultType === 'video' ? 'on' : ''}" data-act="cset-default" data-v="video">${I('video')} Video visit</button></div></div>
      <div class="set-row"><div><b>Let patients choose the other visit type</b><small>${esc(choiceText)}</small></div><button class="sw ${cs.choice ? 'on' : ''}" id="cset-choice" data-act="cset-choice" aria-label="Let patients choose the other visit type"></button></div>
      <div class="vt-foot">${I('lock')}<span>Qualiphy's rules come first. Where a state or an exam requires video, invites are video whatever you pick here.</span></div>
    </div>
    <div class="card set-other" style="max-width:820px;margin-top:16px"><h3>Other settings</h3><p class="muted small" style="margin:0">Notifications, branding, payments and the rest work as today.</p></div>`;
  }
  function results() {
    const rows = S.records.map((r) => `<tr class="click" data-act="rec-open" data-id="${r.id}" data-rec="${r.id}"><td class="nowrap">${r.id}</td><td>${esc(r.patient.first)} ${esc(r.patient.last)}</td><td>${esc(EXAM_BY[r.examId].name)}</td><td>${esc(stateName(r.patient.state))}</td><td>${vtBadges(r)}<span class="sub">${esc(r.reason)}</span></td><td class="nowrap">${REC_STATUS[r.status]}</td><td class="nowrap muted">${fmtDT(r.createdAt)}</td></tr>`).join('');
    return `${dnote('Where the clinic sees it', 'Results gets a <b>Visit type</b> column with the reason under it, and tags when the clinic or the patient picked the other type. Click any row for the stored rules, picks and history (requirement 8).')}
    <div class="card" id="results-card" style="padding:4px 8px"><table class="tbl"><thead><tr><th>ID</th><th>Patient</th><th>Exam</th><th>State</th><th>Visit type</th><th>Status</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function visitTypeBlock(d) {
    if (!d) return `<section class="vt" id="visit-type"><div class="vt-top"><div><h3>Visit type</h3><p>Pick an exam to see the visit type.</p></div></div></section>`;
    const v = S.invite; const cs = csetFor(v.clinicId);
    const pickable = typeof d.allowed === 'boolean'; const allowed = !!d.allowed;
    const eff = d.type === 'async' ? 'async' : 'video';
    const defChip = (t) => (cs.defaultType === t ? ' <span class="chip chip-def">Your default</span>' : '');
    const card = (val, ic, title, sub) => {
      const locked = val === 'async' && !allowed;
      return pickable
        ? `<button class="vt-card pick ${eff === val ? 'on' : 'off'}${locked ? ' locked' : ''}" id="vt-${val}" data-act="vt-pick" data-v="${val}" ${locked ? 'disabled' : ''}><span class="rd"></span><div><b>${I(locked ? 'lock' : ic)} ${title}${defChip(val)}</b><small>${locked ? 'Not available for this invite. The reason is below.' : sub}</small></div></button>`
        : `<div class="vt-card ${eff === val ? 'on' : 'off'}"><span class="rd"></span><div><b>${I(ic)} ${title}</b><small>${sub}</small></div></div>`;
    };
    const choose = !pickable ? `<div class="vt-foot">${I('lock')}<span>Set by the exam. ${esc(d.choiceNote || '')}</span></div>`
      : allowed ? `<label class="chk" id="vt-choose"><input type="checkbox" data-bind="invite.letChoose" data-rerender${d.choose ? ' checked' : ''}> Let the patient choose the other visit type</label><p class="vt-sub">${esc(d.choiceNote)}${v.letChoose == null ? ' From your clinic settings.' : ' Changed for this invite.'}</p>`
        : `<div class="vt-foot">${I('lock')}<span>${esc(d.choiceNote)}</span></div>`;
    return `<section class="vt" id="visit-type">
      <div class="vt-top"><div><h3>Visit type</h3><p>${pickable ? "Pick how this exam runs. Qualiphy's rules decide what's available." : 'Set by the exam.'}</p></div><span class="live-dot">Live from the Compliance Hub</span></div>
      <div class="vt-cards">${card('async', 'fileText', 'Async review', 'A licensed provider reviews the answers and photos. No live video.')}${card('video', 'video', 'Video visit', 'The patient meets a provider by live video.')}</div>
      <div class="vt-reason ${eff}">${esc(d.reason)}</div>
      ${checksList(d.checks)}
      ${choose}
    </section>`;
  }
  function inviteForm() {
    const v = S.invite; const d = inviteDecision();
    const exams = D.EXAMS.filter((x) => x.type === v.type && selectable(x));
    const ctLabel = (D.CONSULT_TYPES.find((t) => t.id === v.type) || D.CONSULT_TYPES[0]).label.split(':')[0];
    const hist = v.returning ? `returning patient${v.lastVisit ? `, first visit ${esc(v.lastVisit)}` : ''}` : 'new patient, so their first visit';
    return `${dnote('Demo patients', `Load a sample patient, or type your own details.<div class="sample-pts">${D.PATIENTS.map((p, i) => `<button data-act="load-patient" data-i="${i}">${esc(p.first)} ${esc(p.last)} · ${esc(p.tag)}</button>`).join('')}</div>`)}
    <div class="form-grid">
      <label class="field"><span>Clinic ${I('info')}</span><select data-bind="invite.clinicId" data-rerender>${D.CLINICS.filter((c) => c.you).map((c) => opt(c.id, c.name, v.clinicId)).join('')}</select></label>
      <label class="field"><span>Patient State ${I('info')}</span><select id="inv-state" data-bind="invite.state" data-rerender>${stateOptions(v.state)}</select></label>
      <div class="full field"><span>Consultation Type ${I('info')}</span><div class="ct-cards">${D.CONSULT_TYPES.map((t) => `<button class="ct ${v.type === t.id ? 'on' : ''}" data-act="ct-pick" data-type="${t.id}"><span class="rd2">${I('check')}</span>${esc(t.label)}</button>`).join('')}</div></div>
      <label class="full field"><span>${esc(ctLabel)} ${I('info')}</span><select id="inv-exam" data-bind="invite.examId" data-rerender>${exams.length ? exams.map((x) => opt(x.id, x.name, v.examId)).join('') : '<option value="">No demo exams under this type</option>'}</select></label>
    </div>
    ${visitTypeBlock(d)}
    <div class="sec-h">Patient Details</div>
    <div class="form-grid">
      <label class="field"><span>First Name</span><input data-bind="invite.first" value="${esc(v.first)}"></label>
      <label class="field"><span>Last Name</span><input data-bind="invite.last" value="${esc(v.last)}"></label>
      <label class="field"><span>Email</span><input data-bind="invite.email" value="${esc(v.email)}"></label>
      <label class="field"><span>Phone Number</span><input data-bind="invite.phone" value="${esc(v.phone)}"></label>
    </div>
    <p class="history-line" style="margin-top:14px">Patient history (demo): ${hist}. <label class="chk" style="margin:0 0 0 8px"><input type="checkbox" id="inv-returning" data-bind="invite.returning" data-rerender${v.returning ? ' checked' : ''}> Existing patient, found in the patient search</label></p>
    <div class="send-row"><button class="btn btn-cta lg" id="btn-send" data-act="send-invite" ${d ? '' : 'disabled'}>${I('send')} Send Invite</button><span class="muted small">The demo creates the exam. Nothing is sent to anyone.</span></div>`;
  }

  /* ------------------------------------------------------------------ patient */
  function ptKey(r) {
    const s = S.view.pscreen || 'sms';
    if (s === 'sms') return 'sms';
    if (s === 'status' && DONE_PT.includes(r.status)) return 'status';
    if (!OPEN_PT.includes(r.status)) return r.type === 'async' ? 'done' : 'video';
    if (r.type === 'video') return 'questions';
    return ['location', 'welcome', 'questions', 'video-confirm'].includes(s) ? s : 'welcome';
  }
  function ptInfo(r) {
    const vid = r.type === 'video';
    const M = {
      sms: ['Patient › text message', 'The invite arrives', vid ? (r.canAsync ? 'The text offers the video visit, and says the answers can go for review instead.' : "The text says it's a video visit, as today.") : (r.canVideo ? "The text says it's an async review, that no video call is needed, and that video is an option." : "The text says it's an async review, and that no video call is needed.")],
      location: ['Patient › async intake › location', 'Where is the patient?', `${cap(QW('q10'))} preview: the intake asks where the patient is, because that state's rules would apply.`],
      welcome: ['Patient › async intake › first screen', 'Async first, video one tap away', r.canVideo ? 'Start my answers is the primary button. A smaller video option sits in plain view (requirement 5).' : 'Start my answers. Patient choice is off, so no video option shows.'],
      questions: vid
        ? ['Patient › video invite › questions', 'Questions before the video visit', r.canAsync ? 'Submit for review is the primary button, even on a video invite. Submit and start my video visit sits under it.' : `The patient answers, then joins the video visit. There's no async option: ${r.allowed ? 'patient choice is off.' : 'the rules say video.'}`]
        : ['Patient › async intake › questions', 'Submit for review', r.canVideo ? 'Submit for review is the primary button. Submit and start a video visit sits under it, smaller.' : 'Submit for review. Patient choice is off, so there is no video option.'],
      'video-confirm': ['Patient › async intake › switch to video', 'Switching to video', "Choosing video turns the exam into a video visit and records the choice. It's still one exam."],
      video: ['Patient › video visit', 'A video visit', r.patientChoice === 'video' ? 'The patient chose video. The clinic sees "Patient chose video" on the exam.' : 'The patient joins the video waiting room, as today.'],
      done: ['Patient › submitted', 'Your exam is complete', "The last screen says the exam is complete. There's no rating step on async exams (requirement 9)."],
      status: ['Patient › the link, opened again', 'Status only', 'Coming back to the link shows the status: under review, approved, or contact your clinic. Nothing identifying (requirement 9).'],
    };
    const m = M[ptKey(r)];
    return { where: m[0], title: m[1], desc: m[2] };
  }
  function followupQs() {
    const fx = S.intake.fx || {};
    return `<label>Current medication and dose<select data-bind="intake.dose">${D.DOSES.map((x) => opt(x, x, S.intake.dose)).join('')}</select></label>
      <label>Current weight (lb)<input type="number" data-bind="intake.weight" value="${esc(S.intake.weight)}" placeholder="For example, 184"></label>
      <div><div class="pq-h">Any side effects since your last visit?</div><div class="opts">${[['nausea', 'Nausea'], ['constipation', 'Constipation'], ['fatigue', 'Fatigue'], ['none', 'None']].map(([key, l]) => `<label><input type="checkbox" data-bind="intake.fx.${key}"${fx[key] ? ' checked' : ''}> ${l}</label>`).join('')}</div></div>
      <label>Anything else for your provider?<textarea data-bind="intake.note" placeholder="Optional">${esc(S.intake.note)}</textarea></label>
      <div class="pphoto">${I('camera')} Add a progress photo (optional in this demo)</div>`;
  }
  function firstQs(e) {
    const cond = S.intake.cond || {};
    return `${e.category === 'Weight loss' ? `<label>Current weight (lb)<input type="number" data-bind="intake.weight" value="${esc(S.intake.weight)}" placeholder="For example, 184"></label>` : ''}
      <div><div class="pq-h">Any of these?</div><div class="opts">${[['heart', 'Heart condition'], ['kidney', 'Kidney condition'], ['pregnant', 'Pregnant or nursing'], ['none', 'None of these']].map(([key, l]) => `<label><input type="checkbox" data-bind="intake.cond.${key}"${cond[key] ? ' checked' : ''}> ${l}</label>`).join('')}</div></div>
      <label>Allergies<input type="text" data-bind="intake.allergies" value="${esc(S.intake.allergies || '')}" placeholder="Optional"></label>
      <label>Anything else for your provider?<textarea data-bind="intake.note" placeholder="Optional">${esc(S.intake.note)}</textarea></label>`;
  }
  function ptScreen(r) {
    const c = CLINIC_BY[r.clinicId]; const e = EXAM_BY[r.examId]; const k = ptKey(r);
    const brand = `<div class="pw-brand"><b>${esc(c.name)}</b><span>Powered by Qualiphy</span></div>`;
    if (k === 'sms') {
      const copy = inviteCopy(r);
      return `<div class="sms-head"><div class="sms-av">${initials(c.name)}</div><b>${esc(c.name)}</b></div><div class="sms-time">Today ${fmtTime(r.createdAt)}</div><div class="bubble">${esc(copy.sms).replace('[secure link]', '<span class="lnk">[secure link]</span>')}</div><button class="pbtn primary" data-act="pt-open" id="pt-open" style="margin-top:18px">Open the link</button>`;
    }
    if (k === 'location') {
      return `${brand}<h2>Where are you right now?</h2><p>Async reviews depend on the state you're in during the exam.</p><div class="pq"><label>State<select data-bind="intake.location">${stateOptions(S.intake.location || r.patient.state)}</select></label></div><button class="pbtn primary" data-act="pt-location">Continue</button>${dnote(`${cap(QW('q10'))} preview`, `${esc(qWho('q10'))} decides whether the invite's state or the patient's location governs. This screen exists only if it's location.`, 'class="dnote p-demo"')}`;
    }
    if (k === 'welcome') {
      const own = S.whatif.q11 === 'own';
      const disc = own
        ? `<div class="pw-disc"><b>Why is this an async review?</b><p>Your clinic set up this visit so a licensed provider can review your answers without a live call.${r.canVideo ? ' You can choose a video visit at any time before you submit.' : ''}</p><label><input type="checkbox" data-bind="intake.ack" data-rerender${S.intake.ack ? ' checked' : ''}> I understand</label></div>`
        : dnote(`Consent, ${QW('q11')}`, "Today's async consent appears here. Whether converted exams need their own disclosure is open with General Counsel.");
      return `${brand}<h2>Your ${esc(e.short)}</h2>
        <div class="pw-mode"><span class="badge b-async">Async review</span><p>Answer a few questions and a licensed provider reviews them. No video call needed.</p></div>
        <ol class="pw-steps"><li>Answer a few questions</li><li>Add photos if asked</li><li>A provider reviews your answers and gets back to you</li></ol>
        ${disc}
        <button class="pbtn primary" id="pt-start" data-act="pt-start" ${own && !S.intake.ack ? 'disabled' : ''}>Start my answers</button>
        ${r.canVideo ? `<div class="pw-video" id="pt-video-option"><b>${I('video')} Prefer to talk to a provider?</b><p>You can have a video visit instead. It's the same exam.</p><button class="pbtn ghost sm" data-act="pt-video">Choose a video visit</button></div>` : ''}`;
    }
    if (k === 'questions') {
      const vid = r.type === 'video';
      const canA = vid ? r.canAsync : true; const canV = vid ? true : r.canVideo;
      const ok = !!S.intake.confirm;
      const head = vid
        ? `${brand}<h2>Your ${esc(e.short)}</h2><div class="pw-mode vid"><span class="badge b-video">Video visit</span><p>Answer a few questions, then meet a licensed provider by video.${canA ? ' Or send your answers for review, with no video call.' : ''}</p></div>`
        : `<div class="p-top"><button data-act="pt-screen" data-s="welcome" aria-label="Back">${I('chevronLeft')}</button>${esc(c.name)}</div><h2>A few questions</h2>`;
      const qs = intakeKind(e) === 'followup' ? followupQs() : firstQs(e);
      const btnA = canA ? `<button class="pbtn primary" id="pt-submit" data-act="pt-submit" ${ok ? '' : 'disabled'}>Submit for review</button><p class="pbtn-sub">No video call. A licensed provider reviews your answers.</p>` : '';
      const btnV = canV ? `<button class="pbtn ${canA ? 'ghost sm' : 'primary'}" id="pt-submit-video" data-act="pt-submit-video" ${ok ? '' : 'disabled'}>${canA ? (vid ? 'Submit and start my video visit' : 'Submit and start a video visit') : 'Submit and start my video visit'}</button>` : '';
      return `${head}<div class="pq">${qs}<label class="pchk"><input type="checkbox" data-bind="intake.confirm" data-rerender${ok ? ' checked' : ''}> My answers are accurate</label></div>${btnA}${btnV}`;
    }
    if (k === 'video-confirm') {
      return `<div class="p-center" style="padding-top:26px"><div class="p-bigico vid">${I('video')}</div><h2>Switch to a video visit?</h2><p>You'll meet a licensed provider by live video instead. It's the same exam, and your clinic will see that you chose video.</p></div><button class="pbtn primary" data-act="pt-video-yes">Yes, switch to video</button><button class="pbtn ghost" data-act="pt-screen" data-s="welcome">Keep the async review</button>`;
    }
    if (k === 'video') {
      const msg = r.patientChoice === 'video' ? 'You chose a video visit, and your clinic can see that.' : r.locationState ? esc(r.reason) : "You'll meet a licensed provider by live video.";
      return `<div class="p-center">${brand}<div class="p-bigico vid" style="margin-top:24px">${I('video')}</div><h2>Your video visit</h2><p>${msg}</p><button class="pbtn primary" data-act="noop">Join the waiting room</button><p class="small muted" style="margin-top:12px">Video visits work as they do today.</p></div>`;
    }
    if (k === 'status') {
      const m = { submitted: ['Under review', 'A licensed provider is reviewing your exam.', 'rev', 'clock'], 'in-review': ['Under review', 'A licensed provider is reviewing your exam.', 'rev', 'clock'], completed: ['Approved', 'Your provider approved your exam. Your clinic has the details.', 'ok', 'check'], deferred: ['Contact your clinic', 'Your provider needs more information. Please contact your clinic.', 'def', 'phone'] }[r.status];
      return `<div class="p-center">${brand}<div class="p-bigico ${m[2] === 'ok' ? 'ok' : 'muted'}" style="margin-top:20px">${I(m[3])}</div><h2>Your exam is complete</h2><div class="status-pill ${m[2]}" id="pt-status">${esc(m[0])}</div><p>${esc(m[1])}</p><p class="small muted">For your privacy, this page doesn't show your name, answers or medication.</p></div>`;
    }
    return `<div class="p-center"><div class="p-bigico ok">${I('check')}</div><h2>Your exam is complete</h2><p>A licensed provider will review your answers. We'll text you when there's an update.</p><div class="p-card"><div><span>Clinic</span><b>${esc(c.name)}</b></div><div><span>Visit type</span><b>Async review</b></div></div></div>`;
  }
  function viewPatient() {
    const list = S.records.filter((r) => !r.seed);
    const r = curPtRec();
    const info = r ? ptInfo(r) : null;
    const picker = list.length
      ? `<label class="field"><span>Viewing invite</span><select data-bind="view.patientId" data-num data-after="ptPick" data-rerender>${list.map((x) => opt(x.id, `#${x.id} ${x.patient.first} ${x.patient.last}, ${typeLabel(x.type)}`, r && r.id)).join('')}</select></label>`
      : `<button class="btn btn-cta" data-act="clinic-go" data-page="invite">${I('send')} Go to Invite Patient</button>`;
    const revisit = r && DONE_PT.includes(r.status)
      ? `<div class="row" style="margin-top:14px">${ptKey(r) === 'status' ? `<button class="btn btn-ghost sm" data-act="pt-screen" data-s="done">${I('arrowLeft')} Back to the last screen</button>` : `<button class="btn btn-ghost sm" id="pt-revisit" data-act="pt-revisit">${I('refresh')} Open the link again later</button>`}</div>` : '';
    const screen = r ? ptScreen(r) : `<div class="p-center"><div class="p-bigico muted">${I('phone')}</div><h2>No invite yet</h2><p>Nothing has been sent to this patient.</p></div>`;
    return `<div class="pt-stage"><div class="pt-side">
      <span class="pt-where">${I('pin')} ${info ? esc(info.where) : 'Patient'}</span>
      <h2>${info ? esc(info.title) : 'No invite yet'}</h2>
      <p>${info ? esc(info.desc) : 'Send an invite from the clinic portal first. The patient sees it here.'}</p>
      ${picker}
      ${revisit}
      ${r ? dnote("What's recorded on the exam", `${typeLabel(r.type)}. ${esc(r.reason)}${r.choiceNote && OPEN_PT.includes(r.status) ? ` ${esc(r.choiceNote)}` : ''}`) : ''}
    </div>
    <div class="phone"><div class="phone-screen"><div class="notch"></div><div class="ps-status"><span>9:41</span><span>${I('wifi')}</span></div><div class="ps-body">${screen}</div></div></div></div>`;
  }

  /* ------------------------------------------------------------------ provider */
  const PROV_MENU = [['Video Call', 'video', ''], ['Asynchronous Exam', 'clipboardEdit', 'queue'], ['Previous Exams', 'clipboardList', ''], ['Pending Exams', 'clipboardPlus', ''], ['My Patients', 'users', ''], ['Knowledge Base', 'help', ''], ['Rewards', 'userPlus', ''], ['Settings', 'cog', '']];
  function provSide() {
    return `<aside class="side"><div class="brand"><img src="assets/logo_white.png" alt="Qualiphy"></div><div class="dash">Dashboard ${I('x')}</div><nav>${PROV_MENU.map(([l, ic, pg]) => `<button class="${pg ? 'on' : ''}" data-act="${pg ? 'pv-queue' : 'noop'}">${I(ic)}${l}</button>`).join('')}<div class="gap"></div><button data-act="noop">${I('logout')}Logout</button></nav></aside>`;
  }
  function viewProvider() {
    const as = S.view.providerAs;
    const right = `<div class="as-seg"><span class="lbl">Demo: viewing as</span><div class="seg"><button class="${as === 'ft' ? 'on' : ''}" data-act="pv-as" data-as="ft" title="${esc(D.PROVIDERS.ft.name)}">${I('user')} Full-time provider</button><button class="${as === '1099' ? 'on' : ''}" data-act="pv-as" data-as="1099" title="${esc(D.PROVIDERS.c1099.name)}">${I('user')} 1099 provider</button></div></div>`;
    const r = rec(S.view.reviewId);
    const body = S.view.provider === 'review' && r ? provReview(r) : provQueue();
    return `<div class="shell">${provSide()}<main class="main">${topbar('Asynchronous Exams', 'clipboard', right)}<div class="avail">Not Available <span class="sw on" aria-hidden="true"></span> Available</div><div class="page">${body}</div></main></div>`;
  }
  function provQueue() {
    const as = S.view.providerAs; const q = queueFor(as);
    const rows = q.shown.map((r) => {
      const e = EXAM_BY[r.examId]; const heldFor = r.converted && r.heldUntil && now() < r.heldUntil;
      const action = r.status === 'in-review' ? `<button class="btn btn-lav sm" data-act="pv-open" data-id="${r.id}">Continue</button>` : `<button class="btn btn-lav sm" data-act="pv-claim" data-id="${r.id}">Claim</button>`;
      const sub = r.convertedBy === 'patient' ? 'The patient chose async at submit. Worked like any async exam.' : r.converted ? 'Converted. Worked like any async exam.' : r.copy ? "Today's async copy." : 'Async, as today.';
      return `<tr data-rec="${r.id}"><td>${r.id}</td><td>${esc(r.patient.first)} ${esc(r.patient.last)}</td><td>${esc(e.name)}</td><td>${esc(stateName(r.patient.state))}</td><td>${vtBadges(r)}<span class="sub">${esc(sub)}</span>${as === 'ft' && heldFor ? `<span class="held-chip">${I('clock')} Full-time only for ${fmtDur(r.heldUntil - now())}</span>` : ''}</td><td class="nowrap muted">${fmtDT(r.submittedAt || r.createdAt)}</td><td class="c">${action}</td></tr>`;
    }).join('');
    const soonest = q.held.length ? Math.min(...q.held.map((r) => r.heldUntil)) : 0;
    const held = as === '1099' && q.held.length ? `<div class="banner warn" id="held-note">${I('clock')}<div><b>${q.held.length} converted exam${q.held.length > 1 ? 's are' : ' is'} held for full-time providers.</b> You'll see ${q.held.length > 1 ? 'them' : 'it'} in ${fmtDur(soonest - now())} (Async Access Settings, ${QW('q2')}). <button class="link" data-act="fast-forward">Fast-forward ${S.access.holdHours} hours (demo)</button></div></div>` : '';
    return `${held}<div class="card" id="queue-card"><div class="row-between"><div><h3>Total Exams: ${q.shown.length}</h3><p class="muted small" style="margin:0">This list updates automatically, new exams appear as they become available to you.</p></div><span class="live-dot">LIVE</span></div>
    <table class="tbl" style="margin-top:12px"><thead><tr><th>ID</th><th>Patient Name</th><th>Exam Title</th><th>State</th><th>Visit type</th><th>Date Created</th><th class="c">Action</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="muted" style="text-align:center;padding:28px">No async exams waiting.</td></tr>'}</tbody></table></div>
    ${dnote('Placement', 'Converted exams join the existing <b>Asynchronous Exam</b> queue with a <b>Converted</b> tag, whether the clinic or the patient picked async. Nothing else about how providers work them changes: same exam, not a copy.')}`;
  }
  function provReview(r) {
    const e = EXAM_BY[r.examId]; const a = r.answers || {};
    const mine = r.claimedBy === S.view.providerAs;
    let actions;
    if (r.status === 'submitted') actions = `<button class="btn btn-cta" data-act="pv-claim" data-id="${r.id}">Claim</button>`;
    else if (r.status === 'in-review' && mine) actions = `<button class="btn btn-cta" data-act="pv-approve" data-id="${r.id}">${I('check')} Approve</button><button class="btn btn-ghost" data-act="pv-defer" data-id="${r.id}">Defer (today's process)</button>`;
    else if (r.status === 'completed' || r.status === 'deferred') actions = `<span class="chip ${r.status === 'completed' ? 'chip-ok' : 'chip-def'}">${REC_STATUS[r.status]}</span>`;
    else actions = '<span class="muted small">Claimed by another provider.</span>';
    let answers = '<p class="muted">No answers on this demo exam.</p>';
    if (r.answers && r.answerKind === 'first') {
      const cond = a.cond ? Object.entries(a.cond).filter(([, on]) => on).map(([key]) => ({ heart: 'Heart condition', kidney: 'Kidney condition', pregnant: 'Pregnant or nursing', none: 'None of these' }[key])).join(', ') : '';
      answers = `<dl style="margin-top:10px">${a.weight ? `<dt>Current weight</dt><dd>${esc(a.weight)} lb</dd>` : ''}<dt>Health history</dt><dd>${esc(cond || 'Not answered')}</dd><dt>Allergies</dt><dd>${esc(a.allergies || 'None given')}</dd><dt>Notes</dt><dd>${esc(a.note || 'None')}</dd></dl>`;
    } else if (r.answers) {
      const fx = a.fx ? Object.entries(a.fx).filter(([, on]) => on).map(([key]) => key[0].toUpperCase() + key.slice(1)).join(', ') : '';
      answers = `<dl style="margin-top:10px"><dt>Medication and dose</dt><dd>${esc(a.dose)}</dd><dt>Current weight</dt><dd>${a.weight ? esc(a.weight) + ' lb' : 'Not given'}</dd><dt>Side effects</dt><dd>${esc(fx || 'None reported')}</dd><dt>Notes</dt><dd>${esc(a.note || 'None')}</dd></dl><div class="photo-ph"><div>Photo</div><div>Photo</div></div>`;
    }
    return `<button class="back" data-act="pv-queue">${I('arrowLeft')} Back to Asynchronous Exams</button>
    <div class="rev-head"><div><h2>${esc(e.name)}</h2><div class="muted">Exam #${r.id} · ${esc(r.patient.first)} ${esc(r.patient.last)} · ${esc(stateName(r.patient.state))}</div></div><div>${vtBadges(r)}</div></div>
    <div class="rev-grid"><div><div class="card answers"><h3>Patient answers</h3>${answers}</div>
    <div class="card actions-card"><h3>Review</h3><div class="row">${actions}</div><p class="small muted" style="margin:12px 0 0">Later: a provider can switch an async exam to video, with a reason (PRD Later list).</p></div></div>
    ${auditCard(r, 'audit-card')}</div>`;
  }

  /* ------------------------------------------------------------------ overlays */
  function welcomeModal() {
    const owners = listJoin(D.PRD.owners.map(([w]) => w));
    return `<div class="modal-wrap"><div class="welcome" role="dialog" aria-label="Welcome">
      <div class="kick">Qualiphy · Product demo · PRD ${esc(D.META.prd)} · ${esc(D.META.prdDate)}</div>
      <h1>Async conversion</h1>
      <p class="lede">One exam, either way. Compliance sets the rules, the clinic picks the visit type on each invite, and the patient can choose the other way. Wherever the rules allow it, async comes first.</p>
      <div class="w-cards">
        <div class="w-card"><div class="t">Why</div><p>${esc(F.why || '')}</p></div>
        <div class="w-card"><div class="t">What you'll see</div><ul><li>Async admin: the Compliance Hub</li><li>Clinic: settings, and the visit type on each invite</li><li>Patient: async first, with a choice both ways</li><li>Provider: the async queue, full-time first</li></ul></div>
        <div class="w-card"><div class="t">What's open</div><p>${D.PRD.decisions.length} questions for ${esc(owners)}. The demo builds to each default, and you can flip any of them to preview the alternative.</p></div>
      </div>
      <div class="w-actions"><button class="btn btn-cta" data-act="start-wt" id="start-wt">${I('play')} Start the walkthrough (about 6 minutes)</button><button class="btn btn-ghost" data-act="start-explore" id="start-explore">Explore on my own</button></div>
      <div class="w-flow"><span class="n">Compliance sets the rules</span>${I('arrowRight')}<span class="n">Clinic picks the visit type</span>${I('arrowRight')}<span class="n">Patient chooses</span>${I('arrowRight')}<span class="n">Provider reviews</span></div>
      <p class="fine">All data is illustrative: state settings, exams, clinics, patients and providers are made up to show the flow, not legal guidance. Nothing is sent anywhere. ${esc(F.session || '')} ${esc(F.review || '')}</p>
    </div></div>`;
  }
  function sentModal(r) {
    if (!r) return '';
    const copy = inviteCopy(r); const isA = (r.sentAs || r.type) === 'async'; const draft = isA || r.canAsync;
    return `<div class="modal-wrap"><div class="modal" role="dialog" aria-label="Invite sent" id="sent-modal">
      <h2><span class="ok-dot">${I('check')}</span>Invite sent</h2>
      <p class="muted" style="margin:4px 0 0">Exam #${r.id} was created once, as ${isA ? 'an <b>async review</b>' : 'a <b>video visit</b>'}. No copy and no second exam. The visit type, the reason, the clinic's pick and the rules are stored on it.</p>
      <div style="margin-top:14px">${decisionCard({ type: isA ? 'async' : 'video', title: typeLabel(isA ? 'async' : 'video'), reason: r.reason, checks: r.checks, choiceNote: r.choiceNote })}</div>
      <h4>What the patient gets ${draft ? '<span class="chip chip-open">Draft copy, requirement 10</span>' : '<span class="chip chip-def">As today</span>'}</h4>
      <div class="msg-grid"><div class="msg"><div class="mh">${I('phone')} Text message</div>${esc(copy.sms)}</div><div class="msg"><div class="mh">${I('mail')} Email</div><div class="msubj">${esc(copy.subject)}</div>${esc(copy.email)}</div></div>
      <div class="foot"><button class="btn btn-ghost" data-act="modal-close">Done</button><button class="btn btn-cta" data-act="goto-patient" data-id="${r.id}">${I('phone')} See what the patient sees</button></div>
    </div></div>`;
  }
  function resetModal() {
    return `<div class="modal-wrap"><div class="modal" style="width:min(540px,100%)"><h2>Reset the demo</h2><p class="muted" style="margin:4px 0 0">Clears every change, invite and answer in this browser.</p>
      <div class="reset-opts"><button data-act="reset" data-preset="fresh"><b>Start over</b><span>Everything back to the first visit: the welcome screen, notes on, and every What if question at its default.</span></button><button data-act="reset" data-preset="before"><b>Before the pilot</b><span>Arizona not reviewed yet, every exam switched off and no clinic in the rollout. The walkthrough opens on the right at step 1.</span></button><button data-act="reset" data-preset="pilot"><b>Pilot running</b><span>Arizona allowed, the pilot exams switched on, and Mock Wellness Clinic in the rollout.</span></button></div>
      <div class="foot"><button class="btn btn-ghost" data-act="modal-close">Cancel</button></div></div></div>`;
  }
  function kvt(rows) { return `<table class="kvt">${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`; }
  function ctxSummary() {
    return `${kvt(D.PRD.summary)}<h3>Who sees what</h3><table class="tbl"><thead><tr><th>Who</th><th>Where</th><th>What they see</th><th></th></tr></thead><tbody>${D.PRD.whoSees.map(([w, p, s, step]) => `<tr><td><b>${esc(w)}</b></td><td>${esc(p)}</td><td>${esc(s)}</td><td class="r"><button class="btn btn-ghost sm" data-act="wt-jump" data-step="${step}">See it</button></td></tr>`).join('')}</tbody></table>`;
  }
  function ctxHow() {
    return `<h3>How an invite is decided</h3><div class="flow"><div class="fs"><b>1. State</b>Async allowed, plus the first-visit rule for new patients</div><div class="fs"><b>2. Exam</b>Can run async, with exceptions by state</div><div class="fs"><b>3. Rollout</b>The clinic is in the rollout</div><div class="fs"><b>4. Clinic</b>Picks async or video, and whether the patient can choose</div><div class="fs"><b>5. Patient</b>Can choose the other way, when allowed</div><div class="fs out"><b>Async first</b>Wherever the rules allow it, async is the default and the primary button.</div></div>${kvt(D.PRD.how)}`;
  }
  function ctxDecisions() {
    const pc = previewCount();
    let h = `<p>Everything else in the PRD is decided. The demo builds to each default. Flip a question to preview its alternative. Nothing here is decided until its owner answers.${F.review ? ` ${esc(F.review)}` : ''}</p>${pc ? `<div class="banner warn">${I('alert')}<div>Previewing ${pc} alternative${pc > 1 ? 's' : ''}. <button class="link" data-act="whatif-reset">Put everything back to the defaults</button></div></div>` : ''}`;
    D.PRD.owners.forEach(([who, label]) => {
      const qs = D.PRD.decisions.filter((q) => q.who === who); if (!qs.length) return;
      h += `<div class="q-group"><h3>${esc(label)}</h3>`;
      qs.forEach((q) => {
        const cur = S.whatif[q.key]; const isPrev = !!q.opts && cur !== q.opts[0].v;
        const ctl = q.opts ? `<div class="seg">${q.opts.map((o) => `<button class="${cur === o.v ? 'on' : ''}" data-act="whatif" data-k="${q.key}" data-v="${o.v}">${esc(o.label)}</button>`).join('')}</div>` : '';
        h += `<div class="q-card ${isPrev ? 'preview' : ''}" id="q-${q.key}"><div class="q-top"><span class="q-n">Q${q.n}</span><span class="q-q">${esc(q.q)}</span></div><div class="q-why">${esc(q.why)}</div>
          <div class="q-ctl"><span class="chip chip-def">Default: ${esc(q.def)}</span>${ctl}${isPrev ? '<span class="chip chip-prev">Previewing</span>' : ''}</div>
          <div class="q-eff">${I('info')}<span>${esc(q.opts ? q.effect[cur] : q.info)}</span></div></div>`;
      });
      h += '</div>';
    });
    return h;
  }
  function ctxRequirements() {
    return `<p>${D.PRD.requirements.length} requirements, each with its test. <b>See it</b> jumps to the walkthrough step that shows it.</p>${D.PRD.requirements.map((r) => `<div class="req" id="req-${r.n}"><span class="n">R${r.n}</span><div><b>${esc(r.title)}</b><p>${esc(r.text)}</p><div class="pass"><b style="display:inline">Passes when:</b> ${esc(r.passes)}</div></div><button class="btn btn-ghost sm" data-act="wt-jump" data-step="${r.step}">See it</button></div>`).join('')}`;
  }
  function ctxNumbers() {
    return `<p class="muted">Last 90 days of completed exams, per month.</p><table class="tbl"><thead><tr><th>What</th><th>Per month</th><th>Saved</th></tr></thead><tbody>${D.PRD.numbers.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td class="nowrap">${esc(b)}</td><td class="nowrap">${esc(c)}</td></tr>`).join('')}</tbody></table><ul style="padding-left:18px">${D.PRD.numberNotes.map(([a, b]) => `<li style="margin:6px 0"><b>${esc(a)}</b> ${esc(b)}</li>`).join('')}</ul>`;
  }
  function ctxPilot() {
    return `${kvt(D.PRD.pilot)}<h3>Success after 30 days</h3><table class="tbl"><thead><tr><th>Measure</th><th>Target</th></tr></thead><tbody>${D.PRD.success.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table><div class="row" style="margin-top:12px"><button class="btn btn-ghost sm" data-act="wt-jump" data-step="pilot">See the live scorecard</button></div>`;
  }
  function ctxRisks() {
    return `<table class="tbl"><thead><tr><th>Risk</th><th>Response</th></tr></thead><tbody>${D.PRD.risks.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table><h3>Later: not in the first release</h3>${kvt(D.PRD.later)}`;
  }
  function ctxAbout() {
    const refs = D.PRD.refs || [];
    const refCell = (k) => (D.PRD.refBase ? `<a href="${esc(D.PRD.refBase + k)}" target="_blank" rel="noopener">${esc(k)}</a>` : esc(k));
    return `<h3>What this is</h3><p>A clickable planning prototype for review and hand-off. Engineering builds the real thing from the PRD and its stories. Nothing here is production code or a spec for how to build it.</p>
    <h3>What's real and what's made up</h3><table class="kvt"><tr><th>From the PRD</th><td>The rules and their order, who sees what, the requirements, the decisions and their defaults,${D.PRD.numbers.length ? ' the numbers,' : ''} the pilot plan and the risks.</td></tr><tr><th>Illustrative</th><td>State settings, notes and first-visit rules, exam names and exceptions, demo clinics and their settings, patients, providers, times, the 4-hour hold, and the invite text (a draft for requirement 10).</td></tr><tr><th>Not built</th><td>Anything on the Later list, API invites (their modes show in Test an invite), real sending, the real fields of Async Access Settings, roles and permissions, and every integration.</td></tr></table>
    ${refs.length ? `<h3>References</h3><table class="kvt">${refs.map(([k, v]) => `<tr><th>${refCell(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>` : ''}
    ${D.PRD.sources ? `<h3>Sources</h3><p class="small muted">${esc(D.PRD.sources)}</p>` : ''}
    <h3>How to use it</h3><ul style="padding-left:18px"><li>The <b>bottom bar</b> switches between Async admin, Clinic, Patient and Provider. They share one set of rules, settings and exams.</li><li><b>Notes</b> hides the amber placement notes for a cleaner screen.</li><li><b>Reset</b> starts over, before the pilot or with it running. Changes are kept in this browser until then.</li><li>The arrow keys move through the walkthrough.</li></ul>`;
  }
  function drawer() {
    if (S.drawer.kind === 'record') {
      const r = rec(S.drawer.id); if (!r) return '';
      return `<div class="backdrop" data-act="drawer-bg"><div class="drawer" data-stop><div class="dr-head" style="padding-bottom:16px"><div class="row-between"><div><div class="dr-kicker">Exam record</div><h2>#${r.id} ${esc(r.patient.first)} ${esc(r.patient.last)}</h2><div class="sub">${esc(EXAM_BY[r.examId].name)}</div></div><button class="dr-x" data-act="drawer-close" aria-label="Close">${I('x')}</button></div></div><div class="dr-body">${auditCard(r, 'record-audit')}</div></div></div>`;
    }
    const tabs = [['summary', 'Summary'], ['how', 'How it works'], ['decisions', 'Decisions'], ['requirements', 'Requirements']].concat(D.PRD.numbers.length ? [['numbers', 'Numbers']] : [], [['pilot', 'Pilot'], ['risks', 'Risks and later'], ['about', 'About the demo']]);
    const t = tabs.some(([id]) => id === S.ctxTab) ? S.ctxTab : 'summary'; const pc = previewCount();
    const body = { summary: ctxSummary, how: ctxHow, decisions: ctxDecisions, requirements: ctxRequirements, numbers: ctxNumbers, pilot: ctxPilot, risks: ctxRisks, about: ctxAbout }[t];
    return `<div class="backdrop" data-act="drawer-bg"><div class="drawer" data-stop id="ctx-drawer"><div class="dr-head"><div class="row-between"><div><div class="dr-kicker">PRD context</div><h2>Async Conversion</h2><div class="sub">${esc(D.META.prd)} · ${esc(D.META.prdDate)} · ${esc(D.META.owner)}</div></div><button class="dr-x" data-act="drawer-close" aria-label="Close">${I('x')}</button></div>
      <div class="dr-tabs">${tabs.map(([id, l]) => `<button class="${t === id ? 'on' : ''}" data-act="ctx-tab" data-tab="${id}">${l}${id === 'decisions' ? ` <span class="chip ${pc ? 'chip-prev' : 'chip-open'}" style="margin-left:4px">${pc ? pc + ' preview' : D.PRD.decisions.length + ' open'}</span>` : ''}</button>`).join('')}</div></div>
      <div class="dr-body">${body()}</div></div></div>`;
  }
  function overlays() {
    let h = '';
    if (!S.welcomed) return welcomeModal();
    if (S.drawer) h += drawer();
    if (S.modal && S.modal.kind === 'sent') h += sentModal(rec(S.modal.id));
    else if (S.modal && S.modal.kind === 'reset') h += resetModal();
    return h;
  }
  function bar() {
    const roles = [['superadmin', 'shield', 'Async admin'], ['clinic', 'building', 'Clinic'], ['patient', 'phone', 'Patient'], ['provider', 'stethoscope', 'Provider']];
    const pc = previewCount();
    return `<div class="bar-inner"><span class="bar-tag">Demo</span>${roles.map(([r, ic, l]) => `<button class="bar-role ${S.role === r ? 'on' : ''}" data-act="role" data-role="${r}">${I(ic)}${l}</button>`).join('')}<span class="bar-sep"></span>
      <button class="bar-btn ${S.wt.on ? 'on' : ''}" data-act="wt-toggle">${I('play')}Walkthrough</button>
      <button class="bar-btn" data-act="drawer" data-tab="summary">${I('book')}PRD context</button>
      <button class="bar-btn" data-act="drawer" data-tab="decisions">${I('sliders')}What if${pc ? ` <span class="chip chip-prev">${pc}</span>` : ''}</button>
      <button class="bar-btn" data-act="notes" title="Show or hide the amber demo notes">${I(S.notes ? 'eye' : 'eyeOff')}Notes</button>
      <button class="bar-btn" data-act="reset-open">${I('refresh')}Reset</button></div>`;
  }

  /* ------------------------------------------------------------------ walkthrough */
  function go(role) { S.role = role; S.drawer = null; if (S.modal && S.modal.kind === 'sent') S.modal = null; pendingTop = true; }
  function hub(tab) { go('superadmin'); S.view.sa = 'hub'; S.view.area = 'async'; S.view.hubTab = tab; }
  function openInvite(p, examId) { go('clinic'); S.view.clinic = 'invite'; S.invite = inviteFromPatient(p, examId); }
  /* Point at the submit buttons while they're on screen, so the phone scrolls to them. */
  const submitTarget = () => (document.getElementById('pt-submit') ? '#pt-submit' : '.phone');
  /* The walkthrough's second invite: the clinic picks video, and the patient chooses async at submit. */
  function ensureChoiceRec() {
    const have = wtChoiceRec(); if (have) return have;
    const keep = S.invite; const keepView = Object.assign({}, S.view);
    S.invite = Object.assign(inviteFromPatient(D.PATIENTS[4], 'iv-gfe'), { pick: 'video', letChoose: true });
    const r = sendInvite();
    S.modal = null; S.invite = keep; S.view = keepView;
    S.wtChoiceId = r.id;
    return r;
  }

  const STEPS = [
    { id: 'intro', title: 'One exam, either way', where: `Async conversion · PRD ${D.META.prd} · ${D.META.prdDate}`, refs: [],
      body: () => `<p>When the rules allow it, an exam runs as an <b>async review</b> instead of a video visit. It's the same exam, with no separate async copy.</p>
        <ul><li><b>Why:</b> ${esc(F.why || '')}</li>
        <li><b>Who decides, in order:</b> Compliance's rules, then the clinic, then the patient. A clinic can never turn on async where the rules say video.</li>
        <li><b>Async first:</b> where the rules allow it, async review is the default and the primary button. Video stays an option.</li>
        <li><b>First release:</b> clinic-portal invites, piloted with 3 clinics. API modes are designed now and built later.</li></ul>
        <p class="wt-hint">You'll follow one invite from the rules to the provider's review, then watch a patient pick async on a video invite. Use Next or the arrow keys. The bottom bar switches views at any time.</p>`,
      run() { go('superadmin'); S.view.sa = 'settings'; } },
    { id: 'settings', title: 'Where it lives: the Compliance Hub', where: 'Admin portal › Settings', refs: ['R6'], target: '#btn-hub',
      body: `<ul><li>The rules live in one <b>Compliance Hub</b> on Settings, not in another SuperAdmin button.</li>
        <li>Changing them needs the <b>Async admin</b> role. A SuperAdmin grants it, and Compliance holds it at launch. Almost no one has SuperAdmin.</li>
        <li><b>Async Access Settings</b> moves into the hub. Roles and permissions join it later.</li></ul>`,
      run() { go('superadmin'); S.view.sa = 'settings'; } },
    { id: 'states', title: 'Compliance sets each state', where: 'Compliance Hub › Async conversion › States', refs: ['R2', 'q3'], target: '#state-editor',
      body: () => `<p>Every state (50 plus DC) is <b>Async allowed</b>, <b>Video only</b> or <b>Conditional</b>, with a note. Conditional counts as video for now, and states nobody has reviewed stay video (${QW('q3')}).</p>
        <p><b>New:</b> each state also has <b>First visit must be video</b>, instead of one hard rule that every first visit is video. ${esc(F.firstVisitExample || '')}</p>
        <p>Compliance sets Arizona to Async allowed, with no first-visit rule.</p>`,
      doLabel: 'Save Arizona as Async allowed',
      done: () => S.states.AZ.status === 'async',
      doIt() { if (S.states.AZ.status !== 'async') saveStateChange('AZ', 'async', false, AZ_NOTE); if (S.role === 'superadmin' && S.view.sa === 'hub') S.view.stateEdit = editFor('AZ'); },
      run() { hub('states'); Object.assign(S.view, { mapMode: 'map', filter: 'all' }); S.view.stateEdit = S.states.AZ.status !== 'async' ? { code: 'AZ', status: 'async', firstVideo: false, note: AZ_NOTE } : editFor('AZ'); } },
    { id: 'exams', title: 'Exam rules come next', where: 'Compliance Hub › Async conversion › Exams', refs: ['R3', 'qb', 'q6'], target: '#exam-card',
      body: () => `<ul><li>Each exam <b>can or can't run async</b>. Every switch starts off.</li>
        <li>Exam rules <b>supersede</b> the state defaults. An exception can keep an exam on video in a state that allows async. Whether one can also allow async where the state says video is ${QW('qb')}.</li>
        <li>Urgent care and controlled-substance exams stay video. An exam needs what async review needs, like async questions, before it can run async (${QW('q6')}).</li></ul>
        <p>Switch on the pilot exams: the GLP-1 follow-ups, the GLP-1 first exam and IV therapy. IV therapy already has one exception: video in Georgia.</p>`,
      doLabel: 'Switch on the pilot exams',
      done: () => PILOT_EXAMS.every(examOn),
      doIt() { PILOT_EXAMS.forEach((id) => setExam(id, true)); },
      run() { hub('exams'); S.view.examEdit = null; } },
    { id: 'rollout', title: 'Pilot clinics join the rollout', where: 'Compliance Hub › Async conversion › Rollout', refs: ['qd', 'q7'], target: '#rollout-card',
      body: () => `<ul><li>Clinics now pick the visit type themselves, so an internal <b>rollout flag</b> decides which clinics can send async invites at all (${QW('qd')}). It's a Qualiphy switch, not a clinic setting.</li>
        <li>It's separate from the async setting clinics use today${T.asyncFlag ? ` (<code>${esc(T.asyncFlag)}</code>)` : ''}. Reusing that would roll out to every clinic already using async at once (${QW('q7')}).</li></ul>
        <p>Add Mock Wellness Clinic to the rollout. It stands in for one of the 3 pilot clinics.</p>`,
      doLabel: 'Add Mock Wellness Clinic',
      done: () => inRollout(MY),
      doIt() { setRollout(MY, true); },
      run() { hub('rollout'); } },
    { id: 'log', title: 'Every change is logged', where: 'Compliance Hub › Async conversion › Change log', refs: ['R6'], target: '#log-table',
      body: `<p>Each change records <b>who</b>, <b>when</b>, the <b>old and new value</b>, and the note. Only the Async admin role can make one, and nothing is edited in place.</p><p>Your changes are at the top.</p>`,
      run() { hub('log'); } },
    { id: 'clinic-settings', title: 'The clinic sets its defaults', where: 'Clinic portal › Settings › Async review', refs: ['R4', 'qa'], target: '#clinic-async',
      body: () => `<p>Inside the rules, the clinic is in control. Two new settings:</p>
        <ul><li><b>Default visit type</b> for new invites. It starts as <b>Async review</b>: it costs less and frees provider time.</li>
        <li><b>Let patients choose</b> the other visit type. It starts on. A clinic that wants its pick to stick turns it off.</li></ul>
        <p>If a clinic turns patient choice off, does the patient keep video on an async review? That's ${QW('qa')}. The demo keeps video one tap away.</p>`,
      run() { go('clinic'); S.view.clinic = 'settings'; } },
    { id: 'invite-async', title: 'The clinic picks the visit type on each invite', where: 'Clinic portal › Results › Invite Patient', refs: ['R1', 'R4'], target: '#visit-type',
      body: `<p>A returning patient in Arizona, invited to a weight-loss follow-up. The rules allow async, so both visit types are open, and <b>Async review</b> is picked from the clinic's default.</p>
        <ul><li>Staff can pick <b>Video visit</b> for this invite instead.</li><li>The reason and the checks behind it are right there.</li><li><b>Let the patient choose</b> comes from Settings, and can be changed for one invite.</li></ul>`,
      run() { openInvite(D.PATIENTS[0]); } },
    { id: 'invite-video', title: 'The rules set the limits', where: 'Clinic portal › Invite Patient › Patient State', refs: ['R2', 'R4'], target: '#visit-type',
      body: `<p>Same exam, but the patient is in <b>California</b>, Video only in this demo. Async review is locked, and the reason names California.</p><p>A clinic can never pick async where the rules say video.</p><p class="wt-hint">Try other states. States nobody has reviewed stay video.</p>`,
      run() { openInvite(D.PATIENTS[0]); S.invite.state = 'CA'; } },
    { id: 'first-visit', title: 'First visits follow each state', where: 'Clinic portal › Invite Patient › a new patient', refs: ['R2'], target: '#visit-type',
      body: () => `<p>A <b>new patient in Texas</b>. Texas allows async, but its first-visit rule is on, so this first visit is a video visit.</p>
        <p>Now load <b>Jordan Reyes</b>, a new patient in Arizona. Arizona has no first-visit rule, so the first visit can be async.</p>
        <p class="wt-hint">Knowing who's new needs a returning-patient signal: ${esc(T.returningSignal || 'picking an existing patient in the patient search first, then automatic patient matching')}.</p>`,
      run() { openInvite(D.PATIENTS[2], 'wl-first-sema'); } },
    { id: 'invite-send', title: 'Send it: one exam, created once', where: 'Clinic portal › Invite Patient › Send Invite', refs: ['R1', 'R8', 'R10'], target: '#btn-send', stayAfterDo: true,
      body: `<p>Back to the returning patient in Arizona. Sending creates the exam once, as an async review. The visit type, the reason, the clinic's pick and the rules are stored on it.</p><p>The text and email say what happens next, and that video is an option. That copy is a launch asset (requirement 10).</p>`,
      doLabel: 'Send the invite',
      done: () => !!wtRec(),
      doIt() { S.invite = inviteFromPatient(D.PATIENTS[0]); const r = sendInvite(); S.wtRecordId = r.id; },
      run() { openInvite(D.PATIENTS[0]); } },
    { id: 'results', title: 'Every invite shows its visit type', where: 'Clinic portal › Results', refs: ['R8'], target: '#results-card',
      body: `<p>The new exam is at the top of Results, with its visit type and the reason. Click any row for the stored rules, the clinic's pick, the patient's choice and the history (requirement 8).</p>`,
      run() { go('clinic'); S.view.clinic = 'results'; } },
    { id: 'patient-welcome', title: 'Async first, video one tap away', where: 'Patient › async intake › first screen', refs: ['R5', 'q11'], target: '#pt-video-option',
      body: () => `<ul><li>The patient opens the link. <b>Start my answers</b> is the primary button.</li><li>A smaller <b>video visit</b> option sits in plain view, because the clinic lets patients choose.</li><li>Choosing video turns the same exam into a video visit and records the choice.</li><li>Consent waits on ${QW('q11')}: is today's async consent enough for converted exams?</li></ul>`,
      run() { go('patient'); S.view.patientId = S.wtRecordId; const r = wtRec(); if (r && r.status === 'invited') patientOpen(r); if (r && r.type === 'async' && OPEN_PT.includes(r.status)) S.view.pscreen = 'welcome'; } },
    { id: 'patient-submit', title: 'Submit, and the exam is complete', where: 'Patient › async intake › questions', refs: ['R5', 'R9'], target: submitTarget,
      body: `<p>The patient answers the questions. At the end, <b>Submit for review</b> is the primary button, with <b>Submit and start a video visit</b> smaller under it.</p><p>After submitting, the last screen says the exam is complete. There's no rating step on async exams.</p>`,
      doLabel: 'Answer and submit for review',
      done: () => { const r = wtRec(); return !!r && DONE_PT.includes(r.status); },
      doIt() { const r = wtRec(); if (r && r.type === 'async' && OPEN_PT.includes(r.status)) { if (r.status === 'invited') patientOpen(r); S.intake = intakeAnswers('followup'); submitForReview(r); } },
      run() { go('patient'); S.view.patientId = S.wtRecordId; const r = wtRec(); if (r && r.status === 'invited') patientOpen(r); if (r && r.type === 'async' && OPEN_PT.includes(r.status)) { S.view.pscreen = 'questions'; if (!S.intake.weight) S.intake = intakeAnswers('followup'); } } },
    { id: 'provider-ft', title: 'It lands in the async queue', where: 'Provider portal › Asynchronous Exam', refs: ['q2'], target: '#queue-card',
      body: () => { const r = wtRec(); const lost = r && r.type !== 'async'; return `${lost ? '<p><b>The patient chose video</b>, so this exam is a video visit now and isn\'t in the async queue. Restart the walkthrough to follow the async path.</p>' : ''}<ul><li>A converted exam is worked like any async exam today, marked <b>Converted</b>.</li><li>Full-time providers see it first (${QW('q2')}'s default). A converted exam only saves money when a full-time provider does it.</li>${F.share1099 || F.bigVolume ? `<li>${esc([F.share1099, F.bigVolume].filter(Boolean).join(' '))}</li>` : ''}</ul>`; },
      run() { go('provider'); S.view.providerAs = 'ft'; S.view.provider = 'queue'; } },
    { id: 'provider-1099', title: '1099 providers see it later', where: 'Provider portal › Asynchronous Exam, as a 1099 provider', refs: ['q2'], target: () => (document.getElementById('held-note') ? '#held-note' : '#queue-card'),
      body: () => (S.whatif.q2 === 'yes'
        ? `<p>Signed in as a 1099 provider, the converted exam isn't in the list yet. <b>Async Access Settings</b> holds it for full-time providers first (${esc(S.access.holdHours)} hours in this demo).</p><p>That setting already exists, and moves into the Compliance Hub, so this uses a setting we have rather than a new one.</p>`
        : `<p>${cap(QW('q2'))} is set to <b>No</b> in What if, so the converted exam shows to 1099 providers at once.</p>`),
      run() { go('provider'); S.view.providerAs = '1099'; S.view.provider = 'queue'; } },
    { id: 'provider-review', title: "Why it's async, on the exam", where: 'Provider portal › Asynchronous Exam › exam review', refs: ['R8'], target: '#audit-card',
      body: `<p>The full-time provider claims the exam. The record shows why it's async: the rules as they stood when the invite was sent, the clinic's pick and the patient's choice. Any exam can be audited this way (requirement 8).</p><p class="wt-hint">Letting a provider switch an async exam to video, with a reason, is on the Later list.</p>`,
      doLabel: 'Approve the exam',
      done: () => { const r = wtRec(); return !!r && (r.status === 'completed' || r.status === 'deferred'); },
      doIt() { const r = wtRec(); if (!r) return; if (r.status === 'submitted') claim(r.id, 'ft'); if (r.status === 'in-review') finish(r.id, 'completed'); },
      run() { go('provider'); S.view.providerAs = 'ft'; const r = wtRec(); if (r && r.status === 'submitted') claim(r.id, 'ft'); if (r && r.type === 'async') { S.view.provider = 'review'; S.view.reviewId = r.id; } else S.view.provider = 'queue'; } },
    { id: 'patient-status', title: 'Coming back to the link', where: 'Patient › the invite link, opened again', refs: ['R9'], target: '.phone',
      body: `<p>When the patient opens the link again, they see the <b>status only</b>: under review, approved, or contact your clinic.</p><ul><li>Nothing identifying: no name, answers or medication.</li><li>Shipment tracking waits for identity checks (Later list).</li></ul>`,
      run() { go('patient'); S.view.patientId = S.wtRecordId; const r = wtRec(); if (r && DONE_PT.includes(r.status)) S.view.pscreen = 'status'; } },
    { id: 'patient-choice', title: 'The patient can choose async too', where: 'Patient › a video invite › questions', refs: ['R5', 'qa'], target: submitTarget,
      body: `<p>A second invite. The clinic picked <b>Video visit</b> for Jordan Reyes, a new patient in Arizona, for an IV therapy exam. The rules allow async, and the clinic lets patients choose.</p>
        <ul><li>At the end, <b>Submit for review</b> is still the primary button. <b>Submit and start my video visit</b> sits under it.</li><li>Submitting for review makes the same exam an async review, marked <b>Patient chose async</b>.</li><li>With patient choice off, the patient gets exactly the video visit the clinic picked.</li></ul>`,
      doLabel: 'Submit for review instead',
      done: () => { const r = wtChoiceRec(); return !!r && r.patientChoice === 'async'; },
      doIt() { const r = ensureChoiceRec(); if (r.type === 'video' && OPEN_PT.includes(r.status)) { if (r.status === 'invited') patientOpen(r); S.intake = intakeAnswers('first'); submitForReview(r); } },
      run() { const r = ensureChoiceRec(); go('patient'); S.view.patientId = r.id; if (OPEN_PT.includes(r.status)) { patientOpen(r); if (!S.intake.confirm) S.intake = intakeAnswers('first'); } } },
    { id: 'channels', title: 'API modes, designed now', where: 'Compliance Hub › Async conversion › Test an invite', refs: ['R7', 'qc'], target: '#tester-result',
      body: () => `<p>API invites get three modes: <code>force_sync</code>, <code>force_async</code> and <code>patient_choice</code>. The rules still come first: <code>force_async</code> can't make an exam async where the rules say video.</p>
        <ul><li>Built later. ${esc(F.apiLater || '')}</li><li>An API invite that sends no mode keeps today's behaviour (${QW('qc')}'s default).</li><li>Quidget and Connect Instantly behave as today.</li></ul>
        <p class="wt-hint">Change the mode, the state or "Sent from" to see the result change.</p>`,
      run() { hub('test'); S.tester = Object.assign(testerDefaults(), { channel: 'api', apiMode: 'force_async' }); } },
    { id: 'pilot', title: 'The pilot measures itself', where: 'Compliance Hub › Async conversion › Pilot', refs: [], target: '#scorecard',
      body: () => `<ul><li><b>Start:</b> Compliance sets the pilot states and exam rules, and ${esc(F.pilotClinics || 'the 3 pilot clinics')} join the rollout.</li><li><b>Week one:</b> Product and Compliance review every decision, including the clinics' picks.</li><li><b>Grow:</b> add clinics each week while the full-time queue keeps up.</li></ul><p>The scorecard counts the 30-day success measures live from this demo's exams.</p>`,
      run() { hub('pilot'); } },
    { id: 'decisions', title: `${D.PRD.decisions.length} open questions`, where: 'PRD context › Decisions', refs: [], target: null,
      body: () => `<p>${F.review ? `${esc(F.review)} ` : ''}The demo builds to each default. Flip any question to preview its alternative:</p><ul>${D.PRD.owners.map(([w]) => { const qs = D.PRD.decisions.filter((q) => q.who === w); return qs.length ? `<li><b>${esc(w)}:</b> ${esc(qs.map((q) => q.short).join('; '))}.</li>` : ''; }).join('')}</ul>`,
      run() { S.drawer = { kind: 'ctx' }; S.ctxTab = 'decisions'; } },
    { id: 'end', title: "That's the flow", where: 'Async conversion · explore freely', refs: [], target: null,
      body: `<p>Rules first, then the clinic, then the patient, with async first wherever it's allowed.</p><ul><li><b>Explore:</b> the bottom bar switches views. Try other states, exams, patients and clinic settings.</li><li><b>What if:</b> preview any open question's alternative.</li><li><b>Reset:</b> start again before the pilot, or with it running.</li></ul>`,
      run() { hub('states'); S.view.stateEdit = null; } },
  ];

  function ensure(i) { for (let k = 0; k < i; k++) { const st = STEPS[k]; if (st.doIt && !(st.done && st.done())) st.doIt(); } }
  function goStep(i) {
    const n = Math.max(0, Math.min(STEPS.length - 1, i));
    S.wt.step = n; S.wt.on = true;
    ensure(n);
    if (S.modal && S.modal.kind === 'sent') S.modal = null;
    STEPS[n].run();
    lastScrolled = -1;
  }
  function startWalkthrough(at) { reset('before'); S.wt = { on: true, step: 0 }; goStep(at || 0); }
  const refLabel = (r) => (/^R\d+$/.test(r) ? `Requirement ${r.slice(1)}` : `Question ${qn(r)}`);
  function wtPanel() {
    const i = S.wt.step; const st = STEPS[i]; const n = STEPS.length;
    const done = st.done ? !!st.done() : false;
    const body = typeof st.body === 'function' ? st.body() : st.body;
    const doBtn = st.doIt ? `<button class="wt-do ${done ? 'done' : ''}" data-act="wt-do" ${done ? 'disabled' : ''}>${done ? I('check') + ' Done' : I('play') + ' ' + esc(st.doLabel)}</button>${done ? '' : '<p class="wt-or">Or do it yourself on the page. Next also does it for you.</p>'}` : '';
    return `<div class="wt-top"><span class="wt-kicker">Walkthrough</span><span class="wt-count">${String(i + 1).padStart(2, '0')} / ${n}</span><button class="wt-x" data-act="wt-close" aria-label="Close the walkthrough">${I('x')}</button></div>
      <div class="wt-progress"><i style="width:${((i + 1) / n) * 100}%"></i></div>
      <div class="wt-dots">${STEPS.map((s, k) => `<button class="${k === i ? 'cur' : k < i ? 'done' : ''}" data-act="wt-goto" data-i="${k}" title="${esc(s.title)}" aria-label="Step ${k + 1}"></button>`).join('')}</div>
      <div class="wt-scroll">
        <div class="wt-where">${I('pin')}<span>${esc(st.where)}</span></div>
        <h2 class="wt-title">${esc(st.title)}</h2>
        <div class="wt-body">${body}</div>
        ${st.refs && st.refs.length ? `<div class="wt-refs">${st.refs.map((r) => `<button class="wt-ref" data-act="ref" data-ref="${r}">${refLabel(r)}</button>`).join('')}</div>` : ''}
        ${doBtn}
      </div>
      <div class="wt-nav"><button data-act="wt-back" ${i === 0 ? 'disabled' : ''}>${I('arrowLeft')} Back</button><button class="primary" data-act="wt-next" id="wt-next" ${i === n - 1 ? 'disabled' : ''}>Next ${I('arrowRight')}</button></div>
      <div class="wt-foot"><button data-act="wt-restart">Restart from the beginning</button><button data-act="drawer" data-tab="summary">PRD context</button><button data-act="wt-close">Explore freely</button></div>`;
  }

  /* ------------------------------------------------------------------ actions */
  const AFTER = {
    ptPick() { S.view.pscreen = 'sms'; S.intake = emptyIntake(); },
    clampHold() { const v = Number(S.access.holdHours); S.access.holdHours = Number.isFinite(v) ? Math.max(0, Math.min(48, Math.round(v))) : 4; },
  };
  const ACT = {
    noop() { toast('Not part of this demo.'); return false; },
    role(d) { go(d.role); if (d.role === 'patient' && !rec(S.view.patientId)) { const r = S.records.find((x) => !x.seed); S.view.patientId = r ? r.id : null; } },
    'sa-go'(d) { go('superadmin'); S.view.sa = d.page; if (d.page === 'hub') S.view.area = 'async'; S.view.stateEdit = null; S.view.examEdit = null; },
    'hub-area'(d) { S.view.area = d.area; },
    'hub-tab'(d) { S.view.hubTab = d.tab; },
    'map-mode'(d) { S.view.mapMode = d.mode; },
    'st-filter'(d) { S.view.filter = d.f; },
    'st-open'(d) { S.view.stateEdit = editFor(d.code); },
    'st-pick'(d) { if (S.view.stateEdit) S.view.stateEdit.status = d.v; },
    'st-fv'() { if (S.view.stateEdit) S.view.stateEdit.firstVideo = !S.view.stateEdit.firstVideo; },
    'st-save'() {
      const ed = S.view.stateEdit; if (!canSaveState()) return false;
      saveStateChange(ed.code, ed.status, ed.firstVideo, ed.note.trim());
      toast(`${stateName(ed.code)} saved as ${STATUS_LABEL[ed.status]}${ed.firstVideo ? ', first visit must be video' : ''}. It's in the change log.`);
      S.view.stateEdit = editFor(ed.code);
    },
    'st-cancel'() { S.view.stateEdit = null; },
    'move-video'(d) { moveToVideo(Number(d.id)); toast(`Exam #${d.id} moved to a video visit by hand.`); },
    'exam-toggle'(d) { const on = !S.exams[d.id].on; setExam(d.id, on); toast(`${EXAM_BY[d.id].name} ${on ? 'can' : "can't"} run async now. Logged.`); },
    'ex-open'(d) { S.view.examEdit = { id: d.id, code: '', mode: 'video', note: '' }; },
    'ex-close'() { S.view.examEdit = null; },
    'ex-mode'(d) { if (!S.view.examEdit || (d.v === 'async' && S.whatif.qb !== 'widen')) return false; S.view.examEdit.mode = d.v; },
    'ex-add'() {
      if (!canAddException()) return false;
      const ed = S.view.examEdit; setException(ed.id, ed.code, ed.mode, ed.note.trim());
      toast(`${EXAM_BY[ed.id].name}: ${exLabel(ed.mode).toLowerCase()} in ${stateName(ed.code)}. Logged.`);
      S.view.examEdit = { id: ed.id, code: '', mode: 'video', note: '' };
    },
    'ex-remove'(d) { setException(d.id, d.code, null, 'Exception removed'); toast(`${EXAM_BY[d.id].name} follows the state in ${stateName(d.code)} again. Logged.`); },
    'rollout-toggle'(d) {
      if (S.whatif.qd === 'open') return false;
      const on = !(S.whatif.q7 === 'reuse' ? S.asyncToday[d.id] : S.rollout[d.id]);
      setRollout(d.id, on); toast(`${CLINIC_BY[d.id].name} ${on ? 'added to' : 'removed from'} the rollout. Logged.`);
    },
    'cset-default'(d) { S.cset[MY].defaultType = d.v; toast(`New invites now start as ${d.v === 'async' ? 'an async review' : 'a video visit'}, where the rules allow it.`); },
    'cset-choice'() { S.cset[MY].choice = !S.cset[MY].choice; toast(S.cset[MY].choice ? 'Patients can choose the other visit type again.' : 'Patient choice is off for new invites.'); },
    'vt-pick'(d) { const dd = inviteDecision(); if (!dd || typeof dd.allowed !== 'boolean' || (d.v === 'async' && !dd.allowed)) return false; S.invite.pick = d.v; },
    'ct-pick'(d) { S.invite.type = d.type; const first = D.EXAMS.find((e) => e.type === d.type && selectable(e)); S.invite.examId = first ? first.id : ''; },
    'load-patient'(d) { const p = D.PATIENTS[Number(d.i)]; Object.assign(S.invite, { first: p.first, last: p.last, email: p.email, phone: p.phone, state: p.state, returning: !!p.returning, lastVisit: p.lastVisit || '' }); },
    'send-invite'() { if (!S.invite.examId || !inviteDecision()) { toast('Pick an exam first.'); return false; } sendInvite(); },
    'modal-close'() { S.modal = null; },
    'goto-patient'(d) { S.modal = null; go('patient'); S.view.patientId = Number(d.id); S.view.pscreen = 'sms'; },
    'clinic-go'(d) { go('clinic'); S.view.clinic = d.page || 'results'; if (d.page === 'invite') Object.assign(S.invite, { pick: null, letChoose: null }); },
    'clinic-back'() { S.view.clinic = 'results'; },
    'rec-open'(d) { S.drawer = { kind: 'record', id: Number(d.id) }; },
    drawer(d) { S.drawer = { kind: 'ctx' }; S.ctxTab = d.tab || S.ctxTab || 'summary'; },
    'drawer-close'() { S.drawer = null; },
    'drawer-bg'() { S.drawer = null; },
    'ctx-tab'(d) { S.ctxTab = d.tab; },
    whatif(d) {
      const q = qOf(d.k); if (!q || !q.opts) return false;
      S.whatif[d.k] = d.v;
      if (d.k === 'q5' && d.v === 'retire' && EXAM_BY[S.invite.examId] && EXAM_BY[S.invite.examId].copy) S.invite.examId = 'wl-fu-sema';
      if (d.k === 'qb' && d.v !== 'widen' && S.view.examEdit && S.view.examEdit.mode === 'async') S.view.examEdit.mode = 'video';
      flagAffected();
      toast(q.opts[0].v === d.v ? `Question ${q.n} is back to its default.` : `Previewing question ${q.n}: ${q.effect[d.v]}`);
    },
    'whatif-reset'() { S.whatif = Object.assign({}, WHATIF_DEFAULTS); flagAffected(); toast('Every question is back to its default.'); },
    'pt-open'() { patientOpen(curPtRec()); },
    'pt-start'() { S.view.pscreen = 'questions'; },
    'pt-video'() { S.view.pscreen = 'video-confirm'; },
    'pt-video-yes'() { patientChooseVideo(curPtRec()); toast('The exam is now a video visit. The choice is recorded.'); },
    'pt-screen'(d) { S.view.pscreen = d.s; },
    'pt-location'() { patientLocation(curPtRec()); },
    'pt-submit'() { if (!S.intake.confirm) return false; const r = curPtRec(); const was = r && r.type; submitForReview(r); if (was === 'video' && r.type === 'async') toast('Submitted for review. The exam is now an async review, and the choice is recorded.'); },
    'pt-submit-video'() { if (!S.intake.confirm) return false; const r = curPtRec(); const was = r && r.type; submitForVideo(r); if (was === 'async' && r.type === 'video') toast('The exam is now a video visit. The choice is recorded.'); },
    'pt-revisit'() { S.view.pscreen = 'status'; },
    'pv-as'(d) { S.view.providerAs = d.as; S.view.provider = 'queue'; },
    'pv-claim'(d) { claim(Number(d.id), S.view.providerAs); S.view.provider = 'review'; S.view.reviewId = Number(d.id); },
    'pv-open'(d) { S.view.provider = 'review'; S.view.reviewId = Number(d.id); },
    'pv-queue'() { go('provider'); S.view.provider = 'queue'; },
    'pv-approve'(d) { finish(Number(d.id), 'completed'); toast('Approved. The exam is completed.'); },
    'pv-defer'(d) { finish(Number(d.id), 'deferred'); toast("Deferred, using today's process."); },
    'fast-forward'() { S.clockOffset = (S.clockOffset || 0) + S.access.holdHours * 36e5 + 60000; toast(`The demo clock moved ahead ${S.access.holdHours} hours.`); },
    'wt-toggle'() { if (S.wt.on) { S.wt.on = false; } else { goStep(S.wt.step || 0); } },
    'wt-next'() { const st = STEPS[S.wt.step]; if (st.stayAfterDo && st.doIt && !(st.done && st.done())) { st.doIt(); return; } if (S.wt.step < STEPS.length - 1) goStep(S.wt.step + 1); },
    'wt-back'() { if (S.wt.step > 0) goStep(S.wt.step - 1); },
    'wt-goto'(d) { goStep(Number(d.i)); },
    'wt-do'() { const st = STEPS[S.wt.step]; if (st.doIt && !(st.done && st.done())) st.doIt(); },
    'wt-close'() { S.wt.on = false; toast('Walkthrough hidden. The Walkthrough button in the bottom bar brings it back.'); },
    'wt-restart'() { startWalkthrough(0); },
    'wt-jump'(d) { const i = STEPS.findIndex((s) => s.id === d.step); if (i < 0) return false; S.drawer = null; goStep(i); },
    ref(d) { const req = /^R\d+$/.test(d.ref); S.drawer = { kind: 'ctx' }; S.ctxTab = req ? 'requirements' : 'decisions'; pendingRef = req ? `req-${d.ref.slice(1)}` : `q-${d.ref}`; },
    'start-wt'() { startWalkthrough(0); },
    'start-explore'() { reset('pilot'); S.wt.on = false; hub('states'); toast('The pilot is running: Arizona, the pilot exams and Mock Wellness Clinic in the rollout.'); },
    'reset-open'() { S.modal = { kind: 'reset' }; },
    reset(d) {
      if (d.preset === 'fresh') { reset('fresh'); toast('Everything is back to the first visit.'); return; }
      if (d.preset === 'before') { startWalkthrough(0); toast('Reset to before the pilot. The walkthrough is open on the right.'); return; }
      reset(d.preset); S.wt.on = false;
      toast('Reset with the pilot running. The Walkthrough button in the bottom bar opens the guide.');
    },
    notes() { S.notes = !S.notes; },
  };

  /* ------------------------------------------------------------------ render + events */
  const $app = document.getElementById('app');
  const $overlay = document.getElementById('overlay');
  const $wt = document.getElementById('wt');
  const $bar = document.getElementById('bar');

  function afterRender() {
    if (pendingRef) {
      const el = document.getElementById(pendingRef); pendingRef = null;
      if (el) { el.classList.add('flash'); el.scrollIntoView({ block: 'center' }); }
    }
    if (!S.wt.on || !S.welcomed) return;
    const st = STEPS[S.wt.step]; if (!st || !st.target) return;
    const sel = typeof st.target === 'function' ? st.target() : st.target;
    const el = sel ? document.querySelector(sel) : null; if (!el) return;
    el.classList.add('wt-hl');
    if (lastScrolled !== S.wt.step) {
      lastScrolled = S.wt.step;
      requestAnimationFrame(() => el.scrollIntoView({ block: 'center', behavior: document.body.classList.contains('static') ? 'auto' : 'smooth' }));
    }
  }
  function render() {
    const wtOn = !!(S.wt.on && S.welcomed);
    document.body.classList.toggle('wt-open', wtOn);
    document.body.classList.toggle('notes-off', !S.notes);
    $app.innerHTML = S.role === 'clinic' ? viewClinic() : S.role === 'patient' ? viewPatient() : S.role === 'provider' ? viewProvider() : viewSuperAdmin();
    $overlay.innerHTML = overlays();
    $wt.innerHTML = wtOn ? wtPanel() : '';
    $bar.innerHTML = S.welcomed ? bar() : '';
    if (pendingTop) { pendingTop = false; window.scrollTo(0, 0); }
    afterRender();
    saveSoon();
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.dataset.act === 'drawer-bg' && e.target.closest('[data-stop]')) return;
    const fn = ACT[el.dataset.act]; if (!fn) return;
    e.preventDefault();
    if (fn(el.dataset, el, e) !== false) render();
  });
  document.addEventListener('input', (e) => {
    const el = e.target; const path = el.dataset && el.dataset.bind; if (!path) return;
    if (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') return;
    setPath(S, path, el.dataset.num !== undefined ? Number(el.value) : el.value);
    if (path === 'view.stateEdit.note') { const b = document.getElementById('btn-save-state'); if (b) b.disabled = !canSaveState(); }
    if (path === 'view.examEdit.note') { const b = document.getElementById('btn-add-ex'); if (b) b.disabled = !canAddException(); }
    saveSoon();
  });
  document.addEventListener('change', (e) => {
    const el = e.target; const path = el.dataset && el.dataset.bind; if (!path) return;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.num !== undefined) v = Number(v);
    setPath(S, path, v);
    if (el.dataset.after && AFTER[el.dataset.after]) AFTER[el.dataset.after](v, el);
    if (el.dataset.rerender !== undefined) render(); else saveSoon();
  });
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.key === 'Escape') {
      if (S.modal && S.welcomed) { S.modal = null; render(); } else if (S.drawer) { S.drawer = null; render(); }
      return;
    }
    if (!S.wt.on || !S.welcomed) return;
    if (e.key === 'ArrowRight') { ACT['wt-next']({}); render(); }
    else if (e.key === 'ArrowLeft') { ACT['wt-back']({}); render(); }
  });
  window.addEventListener('beforeunload', save);

  /* ------------------------------------------------------------------ init */
  S = load() || freshState();
  if (params.get('preset') === 'pilot') { reset('pilot'); }
  if (params.has('step')) { S.welcomed = true; startWalkthrough(Number(params.get('step')) || 0); }
  else if (params.has('role')) { S.welcomed = true; S.role = params.get('role'); }
  render();

  /* Test hook for the smoke script: read-only snapshot of the store. */
  window.__demo = { get state() { return JSON.parse(JSON.stringify(S)); }, steps: STEPS.map((s) => s.id) };
})();
