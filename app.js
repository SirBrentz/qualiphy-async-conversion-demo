/* Async conversion demo: app. Vanilla JS, no build step, no network calls.
   One in-browser store drives four product views (SuperAdmin, clinic, patient, provider),
   a guided walkthrough and the PRD context drawer. Icons adapted from Feather (MIT). */
(function () {
  'use strict';

  const D = window.DEMO;
  const KEY = 'qualiphy-async-demo-v1';
  const params = new URLSearchParams(location.search);
  if (params.has('static')) document.body.classList.add('static');

  const STATE_BY = Object.fromEntries(D.STATES.map((s) => [s.code, s]));
  const EXAM_BY = Object.fromEntries(D.EXAMS.map((e) => [e.id, e]));
  const CLINIC_BY = Object.fromEntries(D.CLINICS.map((c) => [c.id, c]));
  const STATUS_LABEL = { async: 'Async allowed', video: 'Video only', conditional: 'Conditional', unreviewed: 'Not reviewed' };
  const CHANNELS = { portal: 'Clinic portal', api: 'API', quidget: 'Quidget', instant: 'Connect Instantly' };
  const REC_STATUS = { invited: 'Invite sent', opened: 'Patient opened it', submitted: 'Waiting for a provider', 'in-review': 'Provider reviewing', completed: 'Completed', deferred: 'Deferred', 'waiting-video': 'Waiting for video visit' };
  const OPEN = ['invited', 'opened', 'submitted', 'in-review'];
  const OPEN_PT = ['invited', 'opened'];
  const WHATIF_DEFAULTS = { q1: 'small', q2: 'yes', q3: 'off', q4: 'no', q5: 'keep', q7: 'separate', q10: 'invite', q11: 'pending' };
  const YOU = 'You (SuperAdmin)';
  const AZ_NOTE = 'Reviewed by Compliance for the pilot (demo)';

  let S = null;
  let pendingTop = false;
  let lastScrolled = -1;

  /* ------------------------------------------------------------------ icons */
  const CLIP = '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>';
  const P = {
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userMd: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1z"/><path d="M12 16v3M10.5 17.5h3"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
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
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/>',
    flask: '<path d="M9 2h6"/><path d="M10 2v6L4.5 18.5A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.8-3L14 8V2"/><line x1="7" y1="15" x2="17" y2="15"/>',
    history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 16 14"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
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
    fastForward: '<polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>',
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
  function setPath(o, path, v) { const ks = path.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) { if (t[ks[i]] == null) t[ks[i]] = {}; t = t[ks[i]]; } t[ks[ks.length - 1]] = v; }
  let toastTimer = null;
  function toast(msg) { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3600); }

  /* ------------------------------------------------------------------ state */
  function inviteFromPatient(p, examId) {
    const ex = examId || 'wl-fu-sema';
    return { first: p.first, last: p.last, email: p.email, phone: p.phone, state: p.state, returning: !!p.returning, lastVisit: p.lastVisit || '', type: EXAM_BY[ex].type, examId: ex, clinicId: 'mock', sendAsVideo: false };
  }
  function emptyIntake() { return { location: '', ack: false, dose: D.DOSES[1], weight: '', fx: { nausea: false, constipation: false, fatigue: false, none: false }, note: '', confirm: false }; }

  function seedRecords(t0) {
    const mk = (o) => Object.assign({ channel: 'portal', clinicId: 'mock', converted: false, copy: false, clinicChoice: null, patientChoice: null, heldUntil: null, claimedBy: null, answers: null, seed: true, checks: null, rulesReason: null }, o);
    const a = t0 - 150 * 6e4, b = t0 - 185 * 6e4, c = t0 - 26 * 36e5;
    return [
      mk({ id: 16512171, patient: { first: 'Daniel', last: 'Okafor', state: 'TX', returning: false }, examId: 'wl-first-sema', createdAt: a, decidedAt: a, type: 'video', sentAs: 'video', reason: 'Sent before the pilot. First visits stay on video.', status: 'waiting-video', events: [{ at: a, text: 'Invite sent from the clinic portal. Video visit, as today.' }] }),
      mk({ id: 16512168, patient: { first: 'Maria', last: 'Chen', state: 'FL', returning: true }, examId: 'wl-copy', createdAt: b, decidedAt: b, submittedAt: b + 25 * 6e4, type: 'async', sentAs: 'async', copy: true, reason: "Today's async copy. It runs async as it does today and doesn't use the hub.", status: 'submitted', events: [{ at: b, text: "Invite sent from the clinic portal for today's async copy." }, { at: b + 25 * 6e4, text: 'Patient submitted the async answers.' }] }),
      mk({ id: 16512150, patient: { first: 'Jamie', last: 'Brooks', state: 'GA', returning: false }, examId: 'iv-gfe', createdAt: c, decidedAt: c, type: 'video', sentAs: 'video', reason: 'Sent before the pilot. Video visit, as today.', status: 'completed', events: [{ at: c, text: 'Invite sent from the clinic portal. Video visit, as today.' }, { at: c + 40 * 6e4, text: 'Video visit completed.' }] }),
    ];
  }

  function freshState() {
    const t0 = Date.now(); const day = 864e5; const tA = t0 - 6 * day;
    const states = {};
    D.STATES.forEach((s) => { states[s.code] = { status: 'unreviewed', note: '', at: null, by: null }; });
    const log = [{ at: tA, who: 'System', what: 'Hub switched on. Every state starts Not reviewed, which stays video.', from: '', to: '', note: "Question 3's default: states start off" }];
    D.STATE_START.async.forEach((c) => { states[c] = { status: 'async', note: 'Reviewed for the pilot (illustrative)', at: tA + 36e5, by: 'Compliance team' }; });
    log.push({ at: tA + 36e5, who: 'Compliance team', what: `${D.STATE_START.async.length} states set to Async allowed`, from: 'Not reviewed', to: 'Async allowed', note: 'Reviewed for the pilot (illustrative)' });
    let k = 2;
    Object.entries(D.STATE_START.video).forEach(([c, n]) => { const at = tA + (k++) * 36e5; states[c] = { status: 'video', note: n, at, by: 'Compliance team' }; log.push({ at, who: 'Compliance team', what: `${stateName(c)} set to Video only`, from: 'Not reviewed', to: 'Video only', note: n }); });
    Object.entries(D.STATE_START.conditional).forEach(([c, n]) => { const at = tA + day + (k++) * 36e5; states[c] = { status: 'conditional', note: n, at, by: 'Compliance team' }; log.push({ at, who: 'Compliance team', what: `${stateName(c)} set to Conditional`, from: 'Not reviewed', to: 'Conditional', note: n }); });
    log.sort((x, y) => y.at - x.at);
    const exams = {}; D.EXAMS.forEach((e) => { exams[e.id] = { on: false }; });
    const clinics = {}; const asyncToday = {};
    D.CLINICS.forEach((c) => { clinics[c.id] = { on: false }; asyncToday[c.id] = !!c.asyncToday; });
    return {
      v: 1, role: 'superadmin',
      view: { sa: 'settings', hubTab: 'states', mapMode: 'map', filter: 'all', stateEdit: null, clinic: 'results', provider: 'queue', providerAs: 'ft', reviewId: null, patientId: null, pscreen: 'sms' },
      states, exams, clinics, asyncToday, whatif: Object.assign({}, WHATIF_DEFAULTS), access: { holdHours: 4 },
      log, records: seedRecords(t0), nextId: 16512205,
      invite: inviteFromPatient(D.PATIENTS[0]),
      tester: { channel: 'portal', clinicId: 'mock', state: 'AZ', examId: 'wl-fu-sema', returning: 'yes' },
      intake: emptyIntake(), clockOffset: 0,
      wt: { on: false, step: 0 }, wtRecordId: null, welcomed: false, notes: true,
      modal: null, drawer: null, ctxTab: 'summary', affected: null,
    };
  }

  function load() {
    if (params.has('fresh') || params.has('step')) return null;
    try {
      const raw = localStorage.getItem(KEY); if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.v === 1 && s.states && s.records && s.view ? s : null;
    } catch (e) { return null; }
  }
  let saveTimer = null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: the demo still runs, it just won't remember */ } }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }

  function reset(preset) {
    try { localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ }
    S = freshState(); S.welcomed = preset !== 'fresh';
    if (preset === 'pilot') {
      saveStateChange('AZ', 'async', AZ_NOTE, 'Compliance team');
      setExam('wl-fu-sema', true, 'Compliance team');
      setExam('wl-fu-tirz', true, 'Compliance team');
      setClinic('mock', true, 'Compliance team');
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
      ? { allowed: true, label: 'Not reviewed, on at go-live', why: `${name} hasn't been reviewed, and states start on (question 3 preview)` }
      : { allowed: false, label: 'Not reviewed, stays video', why: `${name} hasn't been reviewed yet, so it stays video` };
  }
  function examRule(id) {
    const e = EXAM_BY[id];
    if (!e) return { eligible: false, lock: 'Unknown exam' };
    if (e.urgent) return { eligible: false, lock: 'Urgent care always runs as a video visit' };
    if (e.copy) return { eligible: false, lock: S.whatif.q5 === 'retire' ? 'Retired at launch (question 5 preview)' : "Today's async copy. It runs async already and doesn't use the hub (question 5)" };
    if (e.controlled) return { eligible: false, lock: 'Can lead to a controlled-substance prescription, so it stays video unless General Counsel clears it' };
    if (!e.ready) return { eligible: false, lock: 'Needs async questions before it can run async (question 6)' };
    if (e.visit === 'first' && !(S.whatif.q1 === 'returning' && e.category === 'Weight loss')) return { eligible: false, lock: S.whatif.q1 === 'returning' ? 'Returning patients on any exam is on the Later list' : 'First visits stay on video' };
    return { eligible: true, lock: null };
  }
  const examOn = (id) => examRule(id).eligible && !!(S.exams[id] && S.exams[id].on);
  const clinicOn = (id) => (S.whatif.q7 === 'reuse' ? !!S.asyncToday[id] : !!(S.clinics[id] && S.clinics[id].on));
  const selectable = (e) => !(e.copy && S.whatif.q5 === 'retire');

  function decide(o) {
    const e = EXAM_BY[o.examId]; const c = CLINIC_BY[o.clinicId];
    if (!e || !c) return null;
    const name = stateName(o.state); const channel = o.channel || 'portal';
    if (channel !== 'portal') return { type: 'today', title: 'Behaves as today', reason: `${CHANNELS[channel]} invites aren't checked in the first release. They run exactly as they do today.`, checks: [] };
    if (e.copy) {
      if (S.whatif.q5 === 'retire') return { type: 'video', title: 'Not offered', reason: 'Retired at launch (question 5 preview). This exam no longer appears on invites.', checks: [] };
      return { type: 'async', copy: true, title: 'Async review (async copy)', reason: "Today's async copy. It runs async as it does today and doesn't use the hub's checks.", checks: [] };
    }
    if (e.urgent) return { type: 'video', title: 'Video visit', reason: 'Urgent care always runs as a video visit.', checks: [] };
    const er = examRule(o.examId); const sr = stateRule(o.state); const con = clinicOn(o.clinicId);
    const checks = [
      { key: 'exam', label: 'Exam', value: er.eligible ? (S.exams[o.examId].on ? 'Switched on' : 'Switched off') : 'Locked', pass: examOn(o.examId), note: er.lock || '' },
      { key: 'state', label: `State: ${name}`, value: sr.label, pass: sr.allowed, note: '' },
      { key: 'clinic', label: `Clinic: ${c.name}`, value: con ? 'Switched on' : 'Switched off', pass: con, note: S.whatif.q7 === 'reuse' ? 'Uses the existing async setting (question 7 preview)' : '' },
    ];
    if (e.visit === 'first' && S.whatif.q1 === 'returning') checks.push({ key: 'returning', label: 'Returning patient', value: o.returning ? 'Yes' : 'New patient', pass: !!o.returning, note: 'First-visit check, needs patient matching' });
    const fail = checks.find((k) => !k.pass);
    if (!fail) return { type: 'async', converted: true, title: 'Async review', reason: `${name} allows async, this exam is switched on, and ${c.name} is switched on.`, checks };
    const why = {
      exam: er.lock ? `${er.lock}.` : 'This exam is not switched on for async.',
      state: `${sr.why}.`,
      clinic: `${c.name} is not switched on for async yet.`,
      returning: 'New patients start with a video visit.',
    }[fail.key];
    return { type: 'video', title: 'Video visit', reason: why, checks };
  }

  /* ------------------------------------------------------------------ mutations */
  const rec = (id) => S.records.find((r) => r.id === id);
  const wtRec = () => (S.wtRecordId ? rec(S.wtRecordId) : null);
  const curPtRec = () => rec(S.view.patientId) || S.records.find((r) => !r.seed) || null;
  function addLog(who, what, from, to, note) { S.log.unshift({ at: now(), who, what, from, to, note: note || '' }); }

  function saveStateChange(code, status, note, who) {
    const by = who || YOU; const prev = S.states[code]; const wasAllowed = stateRule(code).allowed;
    S.states[code] = { status, note, at: now(), by };
    addLog(by, `${stateName(code)} set to ${STATUS_LABEL[status]}`, STATUS_LABEL[prev.status], STATUS_LABEL[status], note);
    const isAllowed = stateRule(code).allowed;
    if (wasAllowed && !isAllowed) {
      const open = S.records.filter((r) => r.patient.state === code && r.type === 'async' && r.converted && OPEN.includes(r.status));
      S.affected = open.length ? { code, ids: open.map((r) => r.id) } : null;
    } else { S.affected = null; }
  }
  function setExam(id, on, who) {
    const e = EXAM_BY[id]; if (on && !examRule(id).eligible) return;
    if (!!S.exams[id].on === on) return;
    S.exams[id].on = on;
    addLog(who || YOU, `${e.name} switched ${on ? 'on' : 'off'}`, on ? 'Off' : 'On', on ? 'On' : 'Off', '');
  }
  function setClinic(id, on, who) {
    const c = CLINIC_BY[id];
    if (S.whatif.q7 === 'reuse') {
      if (!!S.asyncToday[id] === on) return;
      S.asyncToday[id] = on;
      addLog(who || YOU, `${c.name}: the existing async setting switched ${on ? 'on' : 'off'}`, on ? 'Off' : 'On', on ? 'On' : 'Off', 'Question 7 preview: the clinic switch is the existing async setting');
    } else {
      if (!!S.clinics[id].on === on) return;
      S.clinics[id].on = on;
      addLog(who || YOU, `${c.name} switched ${on ? 'on' : 'off'} for async`, on ? 'Off' : 'On', on ? 'On' : 'Off', '');
    }
  }
  function moveToVideo(id) {
    const r = rec(id); if (!r) return;
    const st = stateName(r.patient.state);
    r.type = 'video'; r.status = 'waiting-video'; r.heldUntil = null;
    r.reason = `Moved to a video visit by hand after ${st} was switched off.`;
    r.events.push({ at: now(), text: 'Moved to a video visit by hand (SuperAdmin).' });
    addLog(YOU, `Exam #${id} moved to a video visit by hand`, 'Async review', 'Video visit', `${st} was switched off`);
    if (S.affected) { S.affected.ids = S.affected.ids.filter((x) => x !== id); if (!S.affected.ids.length) S.affected = null; }
  }

  function sendInvite() {
    const v = S.invite;
    const d = decide({ channel: 'portal', clinicId: v.clinicId, state: v.state, examId: v.examId, returning: v.returning });
    let type = d.type === 'async' ? 'async' : 'video'; let reason = d.reason; let clinicChoice = null;
    if (d.type === 'async' && d.converted && S.whatif.q4 === 'yes' && v.sendAsVideo) { type = 'video'; reason = 'The clinic chose a video visit (question 4 preview).'; clinicChoice = 'video'; }
    const t = now();
    const r = {
      id: S.nextId++, patient: { first: v.first, last: v.last, email: v.email, phone: v.phone, state: v.state, returning: v.returning, lastVisit: v.lastVisit },
      clinicId: v.clinicId, examId: v.examId, channel: 'portal', createdAt: t, decidedAt: t, type, sentAs: type,
      converted: type === 'async' && !!d.converted, copy: !!d.copy, reason, rulesReason: d.reason, checks: d.checks || [],
      clinicChoice, patientChoice: null, status: type === 'async' ? 'invited' : 'waiting-video', heldUntil: null, claimedBy: null, answers: null, seed: false,
      events: [{ at: t, text: `Invite sent from the clinic portal. Created once, as ${type === 'async' ? 'an async review' : 'a video visit'}.` }],
    };
    S.records.unshift(r);
    S.modal = { kind: 'sent', id: r.id };
    S.view.clinic = 'results';
    S.view.patientId = r.id; S.view.pscreen = 'sms'; S.intake = emptyIntake();
    return r;
  }

  function patientOpen(r) {
    if (!r) return;
    if (r.status === 'invited') { r.status = 'opened'; r.events.push({ at: now(), text: 'Patient opened the invite.' }); }
    if (r.type !== 'async') { S.view.pscreen = 'video'; return; }
    S.view.pscreen = S.whatif.q10 === 'location' && !r.locationChecked ? 'location' : 'welcome';
  }
  function toVideo(r, reason, byPatient) {
    r.type = 'video'; r.status = 'waiting-video'; r.heldUntil = null; r.reason = reason;
    if (byPatient) r.patientChoice = 'video';
    r.events.push({ at: now(), text: byPatient ? 'Patient chose a video visit. The choice is recorded on the exam.' : reason });
    S.view.pscreen = 'video';
  }
  function patientChooseVideo(r) { if (r && r.type === 'async' && OPEN_PT.includes(r.status)) toVideo(r, 'The patient chose a video visit.', true); }
  function patientLocation(r) {
    if (!r) return;
    const loc = S.intake.location || r.patient.state; r.locationChecked = true; r.locationState = loc;
    const sr = stateRule(loc);
    if (!sr.allowed) { toVideo(r, `Moved to a video visit: during the exam the patient was in ${stateName(loc)}. ${sr.why} (question 10 preview).`, false); return; }
    S.view.pscreen = 'welcome';
  }
  function patientSubmit(r) {
    if (!r || r.type !== 'async' || !OPEN_PT.includes(r.status)) return;
    const t = now(); r.status = 'submitted'; r.submittedAt = t; r.answers = JSON.parse(JSON.stringify(S.intake));
    if (r.converted && S.whatif.q2 === 'yes') r.heldUntil = t + S.access.holdHours * 36e5;
    r.events.push({ at: t, text: 'Patient submitted the async answers.' });
    S.view.pscreen = 'done';
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
      blocked: S.records.filter((r) => r.type === 'async' && r.converted && OPEN.includes(r.status) && !stateRule(r.patient.state).allowed).length,
      converted: conv.length, convDone: done.length,
      ftDone: done.filter((r) => r.claimedBy === 'ft').length,
      deferred: done.filter((r) => r.status === 'deferred').length,
      choseVideo: live.filter((r) => r.patientChoice === 'video').length,
    };
  }
  const previewCount = () => Object.keys(WHATIF_DEFAULTS).filter((k) => S.whatif[k] !== WHATIF_DEFAULTS[k]).length;

  function inviteCopy(r) {
    const c = CLINIC_BY[r.clinicId].name; const e = EXAM_BY[r.examId]; const f = r.patient.first;
    if ((r.sentAs || r.type) === 'async') {
      return {
        sms: `${c}: Hi ${f}, your ${e.short} is ready. Answer a few questions and a licensed provider will review them. No video call needed, and you can choose a video visit instead. Start here: [secure link]`,
        subject: `Your ${e.short} with ${c}: no video call needed`,
        email: `Hi ${f},\n\n${c} has sent you a ${e.short}. It's an async review: you answer a few questions, add photos if asked, and a licensed provider reviews them. There's no video call to schedule.\n\nPrefer to talk to a provider? You can choose a video visit on the first screen.\n\n[Start my ${e.short}]`,
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
      if (r.converted) h += '<span class="badge b-conv">Converted</span>';
      if (r.copy) h += '<span class="badge b-copy">Async copy</span>';
    } else {
      h += '<span class="badge b-video">Video visit</span>';
      if (r.patientChoice === 'video') h += '<span class="badge b-choice">Patient chose video</span>';
      if (r.clinicChoice === 'video') h += '<span class="badge b-choice">Clinic chose video</span>';
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
    return `<div class="decision-card ${cls}"><div class="dc-head"><div class="dc-ico">${I(ico)}</div><h4>${esc(d.title)}</h4></div><p class="dc-reason">${esc(d.reason)}</p>${checksList(d.checks)}</div>`;
  }
  function auditCard(r, id) {
    const c = CLINIC_BY[r.clinicId]; const e = EXAM_BY[r.examId];
    return `<div class="card audit"${id ? ` id="${id}"` : ''}>
      <div class="audit-head">${I('shieldCheck')}<h3>Why this is ${r.type === 'async' ? 'an async review' : 'a video visit'}</h3></div>
      <div>${vtBadges(r)}</div>
      <p class="dc-reason" style="margin-top:4px">${esc(r.reason)}</p>
      ${r.rulesReason && r.rulesReason !== r.reason ? `<p class="small muted" style="margin:6px 0 0">When the invite was sent, the rules said: ${esc(r.rulesReason)}</p>` : ''}
      ${r.checks && r.checks.length ? `<div class="audit-sub">Checks when the invite was sent, ${fmtDT(r.decidedAt)}</div>${checksList(r.checks)}` : ''}
      <dl class="kv"><dt>Exam</dt><dd>${esc(e.name)}, #${r.id}</dd><dt>Sent from</dt><dd>${CHANNELS[r.channel]}</dd><dt>Clinic</dt><dd>${esc(c.name)}</dd><dt>Patient's state</dt><dd>${esc(stateName(r.patient.state))}</dd><dt>Patient's choice</dt><dd>${r.patientChoice === 'video' ? 'Chose a video visit' : 'None'}</dd></dl>
      <div class="audit-sub">History</div>
      <ul class="timeline">${r.events.map((ev) => `<li><time>${fmtDT(ev.at)}</time>${esc(ev.text)}</li>`).join('')}</ul>
    </div>`;
  }
  function topbar(title, icon, right, backAct) {
    const lead = backAct ? `<button class="back-ico" data-act="${backAct}" aria-label="Back">${I('arrowLeft')}</button>` : icon ? I(icon) : '';
    return `<header class="top"><h1>${lead}${esc(title)}</h1><div class="right">${right || ''}</div></header>`;
  }

  /* ------------------------------------------------------------------ SuperAdmin */
  const RAIL = ['menu', 'userMd', 'clipboardCheck', 'plusSquare', 'home', 'clipboardPlus', 'users', 'rx', 'layout', 'userPlus', 'signature', 'userLock', 'stethoscope', 'briefcase'];
  function rail() {
    return `<aside class="rail"><div class="mark">${I('stethoscope')}</div>${RAIL.map((n) => `<button data-act="noop" aria-label="Menu item">${I(n)}</button>`).join('')}<button class="on" data-act="sa-go" data-page="settings" aria-label="Settings">${I('cog')}</button></aside>`;
  }
  function viewSuperAdmin() {
    const pg = S.view.sa;
    const body = pg === 'hub' ? viewHub() : pg === 'access' ? viewAccess() : viewSettings();
    return `<div class="shell sa">${rail()}<main class="main">${topbar('Settings', 'cog', `<button class="btn btn-lav" data-act="noop">${I('logout')} Logout</button>`)}<div class="page">${body}</div></main></div>`;
  }
  function viewSettings() {
    return `<div class="settings-list">
      <button class="btn btn-lav wide" data-act="noop">${I('fileText')} Batch Download Exams</button>
      <button class="btn btn-lav wide" data-act="noop">${I('fileText')} Collaborating Physician Batch Download Exams</button>
      <button class="btn btn-lav wide" data-act="noop">${I('copy')} Export Logs</button>
      <button class="btn btn-lav wide" id="btn-access" data-act="sa-go" data-page="access">${I('hourglass')} Async Access Settings</button>
      <button class="btn btn-lav wide" id="btn-hub" data-act="sa-go" data-page="hub">${I('scale')} Async Compliance Hub <span class="chip chip-new">New</span></button>
    </div>
    ${dnote('Where it lives', 'The hub is a new button on SuperAdmin <b>Settings</b>, next to <b>Async Access Settings</b>. The hub decides <b>whether</b> an invite can run async. Async Access Settings already decides <b>when 1099 providers see</b> async exams. Only SuperAdmins can open either one.', 'style="max-width:640px;margin-top:22px"')}`;
  }
  function viewAccess() {
    const q2 = S.whatif.q2 === 'yes';
    return `<button class="back" data-act="sa-go" data-page="settings">${I('arrowLeft')} Back</button>
    <div class="hub-head"><div class="hub-icon" style="background:#6b7280">${I('hourglass')}</div><div><h1>Async Access Settings <span class="chip chip-lock">${I('lock')} SuperAdmin only</span></h1><p>Existing screen. It already controls when 1099 providers can see async exams.</p></div></div>
    ${dnote('Illustrative', "The real screen's fields aren't copied here. This shows the one setting the pilot relies on: converted exams go to full-time providers first (question 2).", 'style="max-width:760px"')}
    <div class="card" style="max-width:760px">
      <div class="row-between"><div><h3>Converted exams: full-time providers first</h3><p class="muted small" style="margin:2px 0 0">1099 providers see a converted exam only after this hold. Other async exams work as today.</p></div>
      <div class="row"><input type="number" min="0" max="48" class="num" data-bind="access.holdHours" data-num data-after="clampHold" data-rerender value="${esc(S.access.holdHours)}" ${q2 ? '' : 'disabled'}><span class="muted">hours</span></div></div>
      ${q2 ? '' : `<div class="banner warn">${I('alert')}<div>Question 2 is set to <b>No</b> in What if, so converted exams show to every provider at once.</div></div>`}
    </div>`;
  }
  function counts() {
    const c = { async: 0, video: 0, conditional: 0, unreviewed: 0 };
    Object.values(S.states).forEach((s) => { c[s.status]++; });
    return c;
  }
  function stat(cls, k, v, s) { return `<div class="tile-stat"><div class="k"><span class="sq ${cls}"></span>${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`; }
  function viewHub() {
    const c = counts();
    const eligible = D.EXAMS.filter((e) => examRule(e.id).eligible);
    const examsOn = eligible.filter((e) => S.exams[e.id].on).length;
    const clinicsOn = D.CLINICS.filter((cl) => clinicOn(cl.id)).length;
    const tab = S.view.hubTab;
    const tabs = [['states', 'map', 'States'], ['exams', 'fileText', 'Exams'], ['clinics', 'building', 'Clinics'], ['test', 'flask', 'Test an invite'], ['log', 'history', 'Change log'], ['pilot', 'activity', 'Pilot']];
    const body = tab === 'states' ? hubStates() : tab === 'exams' ? hubExams() : tab === 'clinics' ? hubClinics() : tab === 'test' ? hubTest() : tab === 'log' ? hubLog() : hubPilot();
    return `<button class="back" data-act="sa-go" data-page="settings">${I('arrowLeft')} Back</button>
    <div class="hub-head"><div class="hub-icon">${I('shield')}</div><div><h1>Async Compliance Hub <span class="chip chip-demo">Demo</span><span class="chip chip-lock">${I('lock')} SuperAdmin only</span></h1><p>Decide where an exam can run as an async review. Every new clinic-portal invite checks the exam, the patient's state and the clinic when it's created. All three on: async review. Anything off: video visit.</p></div></div>
    <div class="banner warn">${I('alert')}<div>Demo data. State settings, notes and clinics are illustrative, not legal guidance. In production, Compliance decides each state.</div></div>
    <div class="tiles">
      ${stat('async', 'Async allowed', c.async, 'states')}
      ${stat('video', 'Video only', c.video, 'states')}
      ${stat('conditional', 'Conditional', c.conditional, 'video for now')}
      ${stat('unreviewed', 'Not reviewed', c.unreviewed, S.whatif.q3 === 'on' ? 'allow async (question 3 preview)' : 'stay video')}
      <div class="tile-stat"><div class="k">${I('fileText')} Exams switched on</div><div class="v">${examsOn}</div><div class="s">of ${eligible.length} that can be</div></div>
      <div class="tile-stat"><div class="k">${I('building')} Clinics switched on</div><div class="v">${clinicsOn}</div><div class="s">of ${D.CLINICS.length} in this demo</div></div>
    </div>
    <div class="tabs" role="tablist">${tabs.map(([id, ic, label]) => `<button class="${tab === id ? 'on' : ''}" data-act="hub-tab" data-tab="${id}">${I(ic)} ${label}${id === 'log' ? ` <span class="count">${S.log.length}</span>` : ''}</button>`).join('')}</div>
    ${body}`;
  }
  function hubStates() {
    const c = counts(); const f = S.view.filter; const ed = S.view.stateEdit;
    const filters = [['all', 'All', 51], ['async', 'Async allowed', c.async], ['video', 'Video only', c.video], ['conditional', 'Conditional', c.conditional], ['unreviewed', 'Not reviewed', c.unreviewed]];
    const head = `<div class="card-head"><div class="filters">${filters.map(([id, l, n]) => `<button class="${f === id ? 'on' : ''}" data-act="st-filter" data-f="${id}">${l} <span class="n">${n}</span></button>`).join('')}</div><div class="seg"><button class="${S.view.mapMode === 'map' ? 'on' : ''}" data-act="map-mode" data-mode="map">${I('map')} Map</button><button class="${S.view.mapMode === 'list' ? 'on' : ''}" data-act="map-mode" data-mode="list">${I('list')} List</button></div></div>`;
    const panel = ed ? stateEditor(ed) : `<div class="placeholder"><div class="ph-ico">${I('map')}</div><h4>Select a state</h4><p class="small">Click a state to set it to Async allowed, Video only or Conditional. Every change needs a note and lands in the change log.</p></div>`;
    return `<div class="states-wrap"><div class="card">${head}${S.view.mapMode === 'map' ? stateMap() : stateList()}${legend()}</div><div class="card editor" id="state-editor">${panel}</div></div>${affectedCard()}`;
  }
  function stateMap() {
    const f = S.view.filter; const sel = S.view.stateEdit && S.view.stateEdit.code;
    return `<div class="map">${D.STATES.map((s) => {
      const st = S.states[s.code]; const cls = [st.status];
      if (st.status === 'unreviewed' && S.whatif.q3 === 'on') cls.push('default-on');
      if (f !== 'all' && st.status !== f) cls.push('dim');
      if (sel === s.code) cls.push('sel');
      return `<button class="st ${cls.join(' ')}" style="grid-column:${s.col + 1};grid-row:${s.row + 1}" data-act="st-open" data-code="${s.code}" title="${esc(s.name)}: ${esc(STATUS_LABEL[st.status])}">${s.code}</button>`;
    }).join('')}</div>`;
  }
  function stateList() {
    const f = S.view.filter;
    const rows = D.STATES.slice().sort((a, b) => a.name.localeCompare(b.name)).filter((s) => f === 'all' || S.states[s.code].status === f).map((s) => {
      const st = S.states[s.code];
      return `<tr class="click" data-act="st-open" data-code="${s.code}"><td><b>${esc(s.name)}</b></td><td class="nowrap"><span class="row" style="gap:6px"><span class="sq ${st.status}"></span>${STATUS_LABEL[st.status]}</span></td><td class="muted">${esc(st.note || '')}</td><td class="nowrap muted small">${st.at ? `${fmtDay(st.at)}<span class="sub">${esc(st.by)}</span>` : 'Never'}</td></tr>`;
    }).join('');
    return `<div style="max-height:520px;overflow:auto"><table class="tbl"><thead><tr><th>State</th><th>Setting</th><th>Note</th><th>Last change</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function legend() {
    return `<div class="legend"><span><i class="sq async"></i>Async allowed</span><span><i class="sq video"></i>Video only</span><span><i class="sq conditional"></i>Conditional (video for now)</span><span><i class="sq unreviewed"></i>Not reviewed (${S.whatif.q3 === 'on' ? 'async by default' : 'video'})</span></div>`;
  }
  function canSaveState() {
    const ed = S.view.stateEdit; if (!ed) return false;
    const st = S.states[ed.code]; const note = (ed.note || '').trim();
    return !!note && (ed.status !== st.status || note !== st.note);
  }
  function stateEditor(ed) {
    const st = S.states[ed.code];
    const opts = [
      ['async', 'Async allowed', 'Invites can run as an async review when the exam and the clinic are switched on.'],
      ['video', 'Video only', 'Every invite for a patient in this state is a video visit.'],
      ['conditional', 'Conditional', 'Allowed only under conditions, like a recent video visit. Counts as video for now.'],
    ];
    const nowNote = st.status === 'unreviewed' ? (S.whatif.q3 === 'on' ? ' (allows async under the question 3 preview)' : ' (stays video)') : '';
    return `<h3>${esc(stateName(ed.code))}</h3><div class="now">Now: <b>${STATUS_LABEL[st.status]}</b>${nowNote}</div>
    ${opts.map(([v, l, dsc]) => `<button class="rc ${ed.status === v ? 'sel' : ''}" data-act="st-pick" data-v="${v}"><span class="rd"></span><span><b><i class="sq ${v}"></i>${l}</b><small>${dsc}</small></span></button>`).join('')}
    <label class="field"><span>Note (required)</span><textarea id="st-note" data-bind="view.stateEdit.note" placeholder="Why, and what Compliance based it on">${esc(ed.note)}</textarea></label>
    <div class="actions"><button class="btn btn-cta" id="btn-save-state" data-act="st-save" ${canSaveState() ? '' : 'disabled'}>Save change</button><button class="btn btn-ghost" data-act="st-cancel">Close</button></div>
    <p class="small muted" style="margin:10px 0 0">Applies to new invites at once. Open async exams in a state switched off are moved by hand.</p>
    <div class="last">${st.at ? `Last change ${fmtDT(st.at)} by ${esc(st.by)}${st.note ? `: "${esc(st.note)}"` : ''}` : 'Never changed.'}</div>`;
  }
  function affectedCard() {
    const a = S.affected; if (!a || !a.ids.length) return '';
    const n = a.ids.length; const nm = esc(stateName(a.code));
    const rows = a.ids.map(rec).filter(Boolean).map((r) => `<li><span><b>#${r.id}</b> ${esc(r.patient.first)} ${esc(r.patient.last)}, ${esc(EXAM_BY[r.examId].name)} <span class="muted small">(${REC_STATUS[r.status]})</span></span><button class="btn btn-ghost sm" data-act="move-video" data-id="${r.id}">${I('video')} Move to video</button></li>`).join('');
    return `<div class="card affected"><div class="banner warn" style="margin-top:0">${I('alert')}<div><b>${n} open async exam${n > 1 ? 's' : ''} in ${nm}</b> stay${n > 1 ? '' : 's'} async until moved by hand. New invites in ${nm} are already video. Moving them automatically is on the Later list.</div></div><ul>${rows}</ul></div>`;
  }
  function hubExams() {
    const rows = D.EXAMS.map((e) => {
      const er = examRule(e.id); const on = S.exams[e.id].on && er.eligible;
      const ready = e.urgent || e.copy ? '<span class="muted">n/a</span>' : e.ready ? `<span class="ready yes">${I('check')} Ready</span>` : `<span class="ready no">${I('alert')} Not yet</span>`;
      const rule = er.lock ? `<span class="lock-note">${I('lock')}<span>${esc(er.lock)}</span></span>` : `<span class="muted small">${on ? 'Invites for this exam can run async.' : 'Can be switched on.'}</span>`;
      return `<tr data-row="${e.id}" class="${er.eligible ? '' : 'locked'}"><td><b>${esc(e.name)}</b><span class="sub">${esc(e.category)}</span></td><td class="nowrap">${e.visit === 'first' ? 'First visit' : 'Follow-up'}</td><td class="nowrap">${ready}</td><td>${rule}</td><td class="r"><button class="sw ${on ? 'on' : ''}" data-act="exam-toggle" data-id="${e.id}" ${er.eligible ? '' : 'disabled'} aria-label="Async for ${esc(e.name)}"></button></td></tr>`;
    }).join('');
    return `<div class="card" id="exam-card"><div class="card-head"><div><h3>Exams</h3><p class="muted small">First release: weight-loss follow-up exams on clinic-portal invites. Every switch starts off.</p></div></div>
    <table class="tbl"><thead><tr><th>Exam</th><th>Visit</th><th>Async-ready</th><th>Rule</th><th class="r">Async</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${dnote('Open question 6 (Engineering)', '"Async-ready" stands in for whatever an exam must have before it can run async, for example async questions. What that is exactly is question 6.')}`;
  }
  function hubClinics() {
    const reuse = S.whatif.q7 === 'reuse';
    const rows = D.CLINICS.map((c) => {
      const on = reuse ? !!S.asyncToday[c.id] : !!S.clinics[c.id].on;
      return `<tr data-row="${c.id}"><td><b>${esc(c.name)}</b>${c.you ? '<span class="sub">The clinic you use in this demo. It stands in for a pilot clinic.</span>' : ''}</td><td>${c.pilot ? '<span class="chip chip-ok">Pilot</span>' : '<span class="muted small">Not yet</span>'}</td><td>${S.asyncToday[c.id] ? 'Yes' : 'No'}<span class="sub">the existing async setting</span></td><td class="r"><button class="sw ${on ? 'on' : ''}" data-act="clinic-toggle" data-id="${c.id}" aria-label="${reuse ? 'the existing async setting' : 'Async conversion'} for ${esc(c.name)}"></button></td></tr>`;
    }).join('');
    const reusedOn = D.CLINICS.filter((c) => S.asyncToday[c.id]).length;
    return `${reuse ? `<div class="banner bad">${I('alert')}<div><b>Question 7 preview: reusing the existing async setting.</b> The ${reusedOn} clinics that already use async are switched on for conversion at once, with no pilot step.</div></div>` : ''}
    <div class="card" id="clinic-card"><div class="card-head"><div><h3>Clinics</h3><p class="muted small">${reuse ? 'The switch is the existing async setting itself.' : "A separate async conversion switch for each clinic, off by default. Clinics can't change it."}</p></div></div>
    <table class="tbl"><thead><tr><th>Clinic</th><th>Pilot</th><th>Uses async today</th><th class="r">${reuse ? 'Existing async setting' : 'Async conversion'}</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${dnote('The pilot (PRD)', 'Three portal clinics to start. The rows above are demo clinics.')}`;
  }
  function hubTest() {
    const t = S.tester; const e = EXAM_BY[t.examId];
    const d = decide({ channel: t.channel, clinicId: t.clinicId, state: t.state, examId: t.examId, returning: t.returning === 'yes' });
    const showRet = e && e.visit === 'first' && S.whatif.q1 === 'returning' && t.channel === 'portal';
    return `<div class="grid2"><div class="card"><h3>Test an invite</h3><p class="muted small" style="margin:0 0 14px">Same logic as the clinic's invite screen. Nothing is sent.</p>
      <div class="form-grid">
        <label class="field"><span>Sent from</span><select id="tester-channel" data-bind="tester.channel" data-rerender>${Object.entries(CHANNELS).map(([k, v]) => opt(k, v, t.channel)).join('')}</select></label>
        <label class="field"><span>Clinic</span><select data-bind="tester.clinicId" data-rerender>${D.CLINICS.map((c) => opt(c.id, c.name, t.clinicId)).join('')}</select></label>
        <label class="field"><span>Patient state</span><select data-bind="tester.state" data-rerender>${stateOptions(t.state)}</select></label>
        <label class="field"><span>Exam</span><select data-bind="tester.examId" data-rerender>${D.EXAMS.map((x) => opt(x.id, x.name, t.examId)).join('')}</select></label>
        ${showRet ? `<label class="field"><span>Patient</span><select data-bind="tester.returning" data-rerender>${opt('yes', 'Returning patient', t.returning)}${opt('no', 'New patient', t.returning)}</select></label>` : ''}
      </div></div>
      <div id="tester-result">${decisionCard(d)}</div></div>`;
  }
  function hubLog() {
    const rows = S.log.map((l) => `<tr><td class="nowrap">${fmtDT(l.at)}</td><td class="log-who">${esc(l.who)}</td><td>${esc(l.what)}${l.from || l.to ? `<span class="sub log-change"><span class="from">${esc(l.from)}</span>${I('arrowRight')}<span>${esc(l.to)}</span></span>` : ''}</td><td class="muted">${esc(l.note)}</td></tr>`).join('');
    return `<div class="card" id="log-table"><div class="card-head"><div><h3>Change log</h3><p class="muted small">Who changed what, when, the old and new value, and why. Nothing is edited in place.</p></div></div><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>Change</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
      [su[5], `${sc.converted}`],
      [su[6], `${sc.choseVideo} chose video`],
    ].map(([[m, t], v]) => `<tr><td>${esc(m)}</td><td class="muted">${esc(t)}</td><td>${v}</td></tr>`).join('');
    const items = [
      ['Decisions answered', '0 of 11. The demo builds to the defaults.'],
      ['Launch assets approved (requirement 9)', 'Support, MedOps and provider docs; a pilot clinic note; invite email and SMS. Invite copy is drafted in this demo.'],
      ['Both async bugs checked (question 9)', 'Two known async bugs fixed or cleared for portal exams'],
      ['Baselines measured', 'Full-time queue wait and deferral rate, in the two weeks before the pilot'],
      ['Pilot clinics told what their patients will see', 'The three pilot clinics'],
    ].map(([t, s]) => `<li><div><b>${esc(t)}</b><div class="small muted">${esc(s)}</div></div><span class="chip chip-open">Open</span></li>`).join('');
    return `<div class="grid2"><div class="card" id="scorecard"><h3>Pilot scorecard</h3><p class="muted small" style="margin:0 0 8px">The PRD's success measures after 30 days, counted live from this demo's exams.</p><table class="tbl score"><thead><tr><th>Measure</th><th>Target</th><th>Now</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="card"><h3>Before the pilot</h3><p class="muted small" style="margin:0">From the PRD's pilot plan.</p><ul class="checklist">${items}</ul><div class="row" style="margin-top:12px"><button class="btn btn-ghost sm" data-act="drawer" data-tab="decisions">${I('sliders')} Open the decisions</button></div></div></div>`;
  }

  /* ------------------------------------------------------------------ clinic */
  const CLINIC_MENU = [['Results', 'clipboard', 'results'], ['Clinics', 'home', ''], ['Managers', 'users', ''], ['Medication Management', 'pill', ''], ['Exams', 'plusSquare', ''], ['Knowledge Base', 'help', ''], ['Weight Loss Exam', 'edit', ''], ['Rewards', 'userPlus', ''], ['White Label', 'palette', ''], ['Settings', 'cog', 'settings']];
  function clinicSide() {
    const cur = S.view.clinic === 'invite' ? 'results' : S.view.clinic;
    const act = (pg) => (pg === 'results' ? 'clinic-go' : pg === 'settings' ? 'clinic-settings' : 'noop');
    return `<aside class="side"><div class="brand"><img src="assets/logo_white.png" alt="Qualiphy"></div><div class="dash">Dashboard ${I('x')}</div><nav>${CLINIC_MENU.map(([l, ic, pg]) => `<button class="${pg && pg === cur ? 'on' : ''}" data-act="${act(pg)}" data-page="${pg}">${I(ic)}${l}</button>`).join('')}<div class="gap"></div><button data-act="noop">${I('logout')}Logout</button></nav></aside>`;
  }
  function viewClinic() {
    if (S.view.clinic === 'invite') return `<div class="shell">${clinicSide()}<main class="main">${topbar('Invite Patient', null, '', 'clinic-back')}<div class="page">${inviteForm()}</div></main></div>`;
    return `<div class="shell">${clinicSide()}<main class="main">${topbar('Results', 'clipboard', `<button class="btn btn-cta" data-act="clinic-go" data-page="invite" id="btn-invite">${I('plus')} Invite Patient</button>`)}<div class="page">${results()}</div></main></div>`;
  }
  function results() {
    const rows = S.records.map((r) => `<tr class="click" data-act="rec-open" data-id="${r.id}" data-rec="${r.id}"><td class="nowrap">${r.id}</td><td>${esc(r.patient.first)} ${esc(r.patient.last)}</td><td>${esc(EXAM_BY[r.examId].name)}</td><td>${esc(stateName(r.patient.state))}</td><td>${vtBadges(r)}<span class="sub">${esc(r.reason)}</span></td><td class="nowrap">${REC_STATUS[r.status]}</td><td class="nowrap muted">${fmtDT(r.createdAt)}</td></tr>`).join('');
    return `${dnote('Where the clinic sees it', 'Results gets a <b>Visit type</b> column with the reason under it. Click any row to see the stored checks and history (requirement 8). Nothing here lets the clinic change async (requirement 4).')}
    <div class="card" id="results-card" style="padding:4px 8px"><table class="tbl"><thead><tr><th>ID</th><th>Patient</th><th>Exam</th><th>State</th><th>Visit type</th><th>Status</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function visitTypeBlock(d) {
    if (!d) return `<section class="vt" id="visit-type"><div class="vt-top"><div><h3>Visit type</h3><p>Pick an exam to see the visit type.</p></div></div></section>`;
    const canChoose = S.whatif.q4 === 'yes' && !!d.converted;
    const chose = canChoose && S.invite.sendAsVideo;
    const effAsync = d.type === 'async' && !chose;
    const reason = chose ? 'You chose a video visit for this invite (question 4 preview).' : d.reason;
    return `<section class="vt" id="visit-type">
      <div class="vt-top"><div><h3>Visit type</h3><p>Set by Qualiphy from the exam, the patient's state and your clinic.</p></div><span class="live-dot">Live from the Async Compliance Hub</span></div>
      <div class="vt-cards"><div class="vt-card ${effAsync ? 'on' : 'off'}"><span class="rd"></span><div><b>${I('fileText')} Async review</b><small>A licensed provider reviews the answers and photos. No live video.</small></div></div><div class="vt-card ${effAsync ? 'off' : 'on'}"><span class="rd"></span><div><b>${I('video')} Video visit</b><small>The patient meets a provider by live video.</small></div></div></div>
      <div class="vt-reason ${effAsync ? 'async' : 'video'}">${esc(reason)}</div>
      ${checksList(d.checks)}
      ${canChoose ? `<label class="chk"><input type="checkbox" data-bind="invite.sendAsVideo" data-rerender${S.invite.sendAsVideo ? ' checked' : ''}> Send as a video visit instead <span class="chip chip-prev">Question 4 preview</span></label>` : `<div class="vt-foot">${I('lock')}<span>Your clinic can't change the visit type. The patient can always choose a video visit.</span></div>`}
    </section>`;
  }
  function inviteForm() {
    const v = S.invite; const e = EXAM_BY[v.examId];
    const exams = D.EXAMS.filter((x) => x.type === v.type && selectable(x));
    const typeLabel = (D.CONSULT_TYPES.find((t) => t.id === v.type) || D.CONSULT_TYPES[0]).label.split(':')[0];
    const d = e && selectable(e) ? decide({ channel: 'portal', clinicId: v.clinicId, state: v.state, examId: v.examId, returning: v.returning }) : null;
    const hist = v.returning ? `returning patient${v.lastVisit ? `, first visit ${esc(v.lastVisit)}` : ''}` : 'new patient';
    return `${dnote('Demo patients', `Load a sample patient, or type your own details.<div class="sample-pts">${D.PATIENTS.map((p, i) => `<button data-act="load-patient" data-i="${i}">${esc(p.first)} ${esc(p.last)} · ${esc(p.tag)}</button>`).join('')}</div>`)}
    <div class="form-grid">
      <label class="field"><span>Clinic ${I('info')}</span><select data-bind="invite.clinicId" data-rerender>${D.CLINICS.filter((c) => c.you).map((c) => opt(c.id, c.name, v.clinicId)).join('')}</select></label>
      <label class="field"><span>Patient State ${I('info')}</span><select id="inv-state" data-bind="invite.state" data-rerender>${stateOptions(v.state)}</select></label>
      <div class="full field"><span>Consultation Type ${I('info')}</span><div class="ct-cards">${D.CONSULT_TYPES.map((t) => `<button class="ct ${v.type === t.id ? 'on' : ''}" data-act="ct-pick" data-type="${t.id}"><span class="rd2">${I('check')}</span>${esc(t.label)}</button>`).join('')}</div></div>
      <label class="full field"><span>${esc(typeLabel)} ${I('info')}</span><select id="inv-exam" data-bind="invite.examId" data-rerender>${exams.length ? exams.map((x) => opt(x.id, x.name, v.examId)).join('') : '<option value="">No demo exams under this type</option>'}</select></label>
    </div>
    ${visitTypeBlock(d)}
    <div class="sec-h">Patient Details</div>
    <div class="form-grid">
      <label class="field"><span>First Name</span><input data-bind="invite.first" value="${esc(v.first)}"></label>
      <label class="field"><span>Last Name</span><input data-bind="invite.last" value="${esc(v.last)}"></label>
      <label class="field"><span>Email</span><input data-bind="invite.email" value="${esc(v.email)}"></label>
      <label class="field"><span>Phone Number</span><input data-bind="invite.phone" value="${esc(v.phone)}"></label>
    </div>
    <p class="history-line" style="margin-top:14px">Patient history (demo): ${hist}.${S.whatif.q1 === 'returning' ? ` <label class="chk" style="margin:0 0 0 8px"><input type="checkbox" data-bind="invite.returning" data-rerender${v.returning ? ' checked' : ''}> Returning (found by patient matching)</label>` : ''}</p>
    <div class="send-row"><button class="btn btn-cta lg" id="btn-send" data-act="send-invite" ${d ? '' : 'disabled'}>${I('send')} Send Invite</button><span class="muted small">The demo creates the exam. Nothing is sent to anyone.</span></div>`;
  }

  /* ------------------------------------------------------------------ patient */
  function ptKey(r) {
    const s = S.view.pscreen || 'sms';
    if (s === 'sms') return 'sms';
    if (r.type === 'video') return 'video';
    if (!OPEN_PT.includes(r.status)) return 'done';
    return s;
  }
  function ptInfo(r) {
    const M = {
      sms: ['Patient › text message', 'The invite arrives', "The text says it's an async review, that no video call is needed, and that video is an option."],
      location: ['Patient › async intake › location', 'Where is the patient?', "Question 10 preview: the intake asks where the patient is, because that state's rules would apply."],
      welcome: ['Patient › async intake › first screen', 'Video is one tap away', 'The first screen explains the async review and offers a video visit in plain view (requirement 7).'],
      questions: ['Patient › async intake › questions', 'The follow-up questions', 'The patient answers and submits. The video option stays available until they submit.'],
      'video-confirm': ['Patient › async intake › switch to video', 'Switching to video', "Choosing video turns the exam into a video visit and records the choice. It's still one exam."],
      video: ['Patient › video visit', 'A video visit', r.patientChoice === 'video' ? 'The patient chose video. The clinic sees "Patient chose video" on the exam.' : 'This invite is a video visit, so the patient joins by video as today.'],
      done: ['Patient › async intake › submitted', 'Submitted for review', 'The exam goes to the async queue. Full-time providers see it first.'],
    };
    const m = M[ptKey(r)];
    return { where: m[0], title: m[1], desc: m[2] };
  }
  function ptScreen(r) {
    const c = CLINIC_BY[r.clinicId]; const e = EXAM_BY[r.examId]; const k = ptKey(r);
    const brand = `<div class="pw-brand"><b>${esc(c.name)}</b><span>Powered by Qualiphy</span></div>`;
    if (k === 'sms') {
      const copy = inviteCopy(r);
      return `<div class="sms-head"><div class="sms-av">${initials(c.name)}</div><b>${esc(c.name)}</b></div><div class="sms-time">Today ${fmtTime(r.createdAt)}</div><div class="bubble">${esc(copy.sms).replace('[secure link]', '<span class="lnk">[secure link]</span>')}</div><button class="pbtn primary" data-act="pt-open" id="pt-open" style="margin-top:18px">Open the link</button>`;
    }
    if (k === 'location') {
      return `${brand}<h2>Where are you right now?</h2><p>Async reviews depend on the state you're in during the exam.</p><div class="pq"><label>State<select data-bind="intake.location">${stateOptions(S.intake.location || r.patient.state)}</select></label></div><button class="pbtn primary" data-act="pt-location">Continue</button>${dnote('Question 10 preview', "Legal decides whether the invite's state or the patient's location governs. This screen exists only if it's location.", 'class="dnote p-demo"')}`;
    }
    if (k === 'welcome') {
      const own = S.whatif.q11 === 'own';
      const disc = own
        ? `<div class="pw-disc"><b>Why is this an async review?</b><p>Your clinic set up this follow-up so a licensed provider can review your answers without a live call. You can choose a video visit at any time before you submit.</p><label><input type="checkbox" data-bind="intake.ack" data-rerender${S.intake.ack ? ' checked' : ''}> I understand</label></div>`
        : dnote('Consent, question 11', "Today's async consent appears here. Whether converted exams need their own disclosure is open with General Counsel.");
      return `${brand}<h2>Your ${esc(e.short)}</h2>
        <div class="pw-mode"><span class="badge b-async">Async review</span><p>Answer a few questions and a licensed provider reviews them. No video call needed.</p></div>
        <ol class="pw-steps"><li>Answer a few questions</li><li>Add photos if asked</li><li>A provider reviews your answers and gets back to you</li></ol>
        ${disc}
        <button class="pbtn primary" data-act="pt-start" ${own && !S.intake.ack ? 'disabled' : ''}>Start my answers</button>
        <div class="pw-video" id="pt-video-option"><b>${I('video')} Prefer to talk to a provider?</b><p>You can have a video visit instead. It's the same exam.</p><button class="pbtn ghost" data-act="pt-video">Choose a video visit</button></div>`;
    }
    if (k === 'questions') {
      const fx = S.intake.fx || {};
      return `<div class="p-top"><button data-act="pt-screen" data-s="welcome" aria-label="Back">${I('chevronLeft')}</button>${esc(c.name)}</div>
        <h2>A few questions</h2>
        <div class="pq">
          <label>Current medication and dose<select data-bind="intake.dose">${D.DOSES.map((x) => opt(x, x, S.intake.dose)).join('')}</select></label>
          <label>Current weight (lb)<input type="number" data-bind="intake.weight" value="${esc(S.intake.weight)}" placeholder="For example, 184"></label>
          <div><div style="font-size:13.5px;font-weight:600;margin-bottom:6px">Any side effects since your last visit?</div><div class="opts">${[['nausea', 'Nausea'], ['constipation', 'Constipation'], ['fatigue', 'Fatigue'], ['none', 'None']].map(([key, l]) => `<label><input type="checkbox" data-bind="intake.fx.${key}"${fx[key] ? ' checked' : ''}> ${l}</label>`).join('')}</div></div>
          <label>Anything else for your provider?<textarea data-bind="intake.note" placeholder="Optional">${esc(S.intake.note)}</textarea></label>
          <div class="pphoto">${I('camera')} Add a progress photo (optional in this demo)</div>
          <label class="pchk"><input type="checkbox" data-bind="intake.confirm" data-rerender${S.intake.confirm ? ' checked' : ''}> My answers are accurate</label>
        </div>
        <button class="pbtn primary" id="pt-submit" data-act="pt-submit" ${S.intake.confirm ? '' : 'disabled'}>Submit for review</button>
        <button class="plink" data-act="pt-video">Switch to a video visit instead</button>`;
    }
    if (k === 'video-confirm') {
      return `<div class="p-center" style="padding-top:26px"><div class="p-bigico vid">${I('video')}</div><h2>Switch to a video visit?</h2><p>You'll meet a licensed provider by live video instead. It's the same exam, and your clinic will see that you chose video.</p></div><button class="pbtn primary" data-act="pt-video-yes">Yes, switch to video</button><button class="pbtn ghost" data-act="pt-screen" data-s="welcome">Keep the async review</button>`;
    }
    if (k === 'video') {
      const msg = r.patientChoice === 'video' ? 'You chose a video visit, and your clinic can see that.' : r.locationState ? esc(r.reason) : "You'll meet a licensed provider by live video.";
      return `<div class="p-center">${brand}<div class="p-bigico vid" style="margin-top:24px">${I('video')}</div><h2>Your video visit</h2><p>${msg}</p><button class="pbtn primary" data-act="noop">Join the waiting room</button><p class="small muted" style="margin-top:12px">Video visits work as they do today.</p></div>`;
    }
    return `<div class="p-center"><div class="p-bigico ok">${I('check')}</div><h2>Submitted</h2><p>A licensed provider will review your answers. We'll text you when there's an update.</p><div class="p-card"><div><span>Exam</span><b>#${r.id}</b></div><div><span>Clinic</span><b>${esc(c.name)}</b></div><div><span>Visit type</span><b>Async review</b></div></div></div>`;
  }
  function viewPatient() {
    const list = S.records.filter((r) => !r.seed);
    const r = curPtRec();
    const info = r ? ptInfo(r) : null;
    const picker = list.length
      ? `<label class="field"><span>Viewing invite</span><select data-bind="view.patientId" data-num data-after="ptPick" data-rerender>${list.map((x) => opt(x.id, `#${x.id} ${x.patient.first} ${x.patient.last}, ${x.type === 'async' ? 'Async review' : 'Video visit'}`, r && r.id)).join('')}</select></label>`
      : `<button class="btn btn-cta" data-act="clinic-go" data-page="invite">${I('send')} Go to Invite Patient</button>`;
    const screen = r ? ptScreen(r) : `<div class="p-center"><div class="p-bigico muted">${I('phone')}</div><h2>No invite yet</h2><p>Nothing has been sent to this patient.</p></div>`;
    return `<div class="pt-stage"><div class="pt-side">
      <span class="pt-where">${I('pin')} ${info ? esc(info.where) : 'Patient'}</span>
      <h2>${info ? esc(info.title) : 'No invite yet'}</h2>
      <p>${info ? esc(info.desc) : 'Send an invite from the clinic portal first. The patient sees it here.'}</p>
      ${picker}
      ${r ? dnote("What's recorded on the exam", `${r.type === 'async' ? 'Async review' : 'Video visit'}. ${esc(r.reason)}`) : ''}
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
      const sub = r.converted ? 'Converted by the hub. Worked like any async exam.' : r.copy ? "Today's async copy." : 'Async, as today.';
      return `<tr data-rec="${r.id}"><td>${r.id}</td><td>${esc(r.patient.first)} ${esc(r.patient.last)}</td><td>${esc(e.name)}</td><td>${esc(stateName(r.patient.state))}</td><td>${vtBadges(r)}<span class="sub">${esc(sub)}</span>${as === 'ft' && heldFor ? `<span class="held-chip">${I('clock')} Full-time only for ${fmtDur(r.heldUntil - now())}</span>` : ''}</td><td class="nowrap muted">${fmtDT(r.submittedAt || r.createdAt)}</td><td class="c">${action}</td></tr>`;
    }).join('');
    const soonest = q.held.length ? Math.min(...q.held.map((r) => r.heldUntil)) : 0;
    const held = as === '1099' && q.held.length ? `<div class="banner warn" id="held-note">${I('clock')}<div><b>${q.held.length} converted exam${q.held.length > 1 ? 's are' : ' is'} held for full-time providers.</b> You'll see ${q.held.length > 1 ? 'them' : 'it'} in ${fmtDur(soonest - now())} (Async Access Settings, question 2). <button class="link" data-act="fast-forward">Fast-forward ${S.access.holdHours} hours (demo)</button></div></div>` : '';
    return `${held}<div class="card" id="queue-card"><div class="row-between"><div><h3>Total Exams: ${q.shown.length}</h3><p class="muted small" style="margin:0">This list updates automatically, new exams appear as they become available to you.</p></div><span class="live-dot">LIVE</span></div>
    <table class="tbl" style="margin-top:12px"><thead><tr><th>ID</th><th>Patient Name</th><th>Exam Title</th><th>State</th><th>Visit type</th><th>Date Created</th><th class="c">Action</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="muted" style="text-align:center;padding:28px">No async exams waiting.</td></tr>'}</tbody></table></div>
    ${dnote('Placement', 'Converted exams join the existing <b>Asynchronous Exam</b> queue with a <b>Converted</b> tag. Nothing else about how providers work them changes: same exam, not a copy.')}`;
  }
  function provReview(r) {
    const e = EXAM_BY[r.examId]; const a = r.answers || {};
    const fx = a.fx ? Object.entries(a.fx).filter(([, on]) => on).map(([k]) => k[0].toUpperCase() + k.slice(1)).join(', ') : '';
    const mine = r.claimedBy === S.view.providerAs;
    let actions;
    if (r.status === 'submitted') actions = `<button class="btn btn-cta" data-act="pv-claim" data-id="${r.id}">Claim</button>`;
    else if (r.status === 'in-review' && mine) actions = `<button class="btn btn-cta" data-act="pv-approve" data-id="${r.id}">${I('check')} Approve</button><button class="btn btn-ghost" data-act="pv-defer" data-id="${r.id}">Defer (today's process)</button>`;
    else if (r.status === 'completed' || r.status === 'deferred') actions = `<span class="chip ${r.status === 'completed' ? 'chip-ok' : 'chip-def'}">${REC_STATUS[r.status]}</span>`;
    else actions = '<span class="muted small">Claimed by another provider.</span>';
    const answers = r.answers
      ? `<dl style="margin-top:10px"><dt>Medication and dose</dt><dd>${esc(a.dose)}</dd><dt>Current weight</dt><dd>${a.weight ? esc(a.weight) + ' lb' : 'Not given'}</dd><dt>Side effects</dt><dd>${esc(fx || 'None reported')}</dd><dt>Notes</dt><dd>${esc(a.note || 'None')}</dd></dl><div class="photo-ph"><div>Photo</div><div>Photo</div></div>`
      : '<p class="muted">No answers on this demo exam.</p>';
    return `<button class="back" data-act="pv-queue">${I('arrowLeft')} Back to Asynchronous Exams</button>
    <div class="rev-head"><div><h2>${esc(e.name)}</h2><div class="muted">Exam #${r.id} · ${esc(r.patient.first)} ${esc(r.patient.last)} · ${esc(stateName(r.patient.state))}</div></div><div>${vtBadges(r)}</div></div>
    <div class="rev-grid"><div><div class="card answers"><h3>Patient answers</h3>${answers}</div>
    <div class="card actions-card"><h3>Review</h3><div class="row">${actions}</div><p class="small muted" style="margin:12px 0 0">Later: a provider can switch an async exam to video, with a reason (PRD Later list).</p></div></div>
    ${auditCard(r, 'audit-card')}</div>`;
  }

  /* ------------------------------------------------------------------ overlays */
  function welcomeModal() {
    return `<div class="modal-wrap"><div class="welcome" role="dialog" aria-label="Welcome">
      <div class="kick">Qualiphy · Product demo · PRD ${esc(D.META.prd)} · ${esc(D.META.prdDate)}</div>
      <h1>Async conversion</h1>
      <p class="lede">One exam, two ways to run it. When the rules allow, a clinic's invite runs as an async review instead of a video visit, and the patient can always choose video.</p>
      <div class="w-cards">
        <div class="w-card"><div class="t">Why</div><p>A full-time provider reviewing async costs less than a 1099 provider on video, so every converted exam saves money.</p></div>
        <div class="w-card"><div class="t">What you'll see</div><ul><li>SuperAdmin: the Async Compliance Hub</li><li>Clinic: the visit type on Invite Patient</li><li>Patient: the async intake, with video one tap away</li><li>Provider: the async queue, full-time first</li></ul></div>
        <div class="w-card"><div class="t">What's open</div><p>11 questions for leadership, engineering and legal. The demo builds to each default, and you can flip any of them to preview the alternative.</p></div>
      </div>
      <div class="w-actions"><button class="btn btn-cta" data-act="start-wt" id="start-wt">${I('play')} Start the walkthrough (about 5 minutes)</button><button class="btn btn-ghost" data-act="start-explore" id="start-explore">Explore on my own</button></div>
      <div class="w-flow"><span class="n">SuperAdmin switches it on</span>${I('arrowRight')}<span class="n">Clinic sends the invite</span>${I('arrowRight')}<span class="n">Patient answers or picks video</span>${I('arrowRight')}<span class="n">Provider reviews</span></div>
      <p class="fine">All data is illustrative: state settings, exams, clinics, patients and providers are made up to show the flow, not legal guidance. Nothing is sent anywhere. Built from the PRD and the Sep 22 hub prototype.</p>
    </div></div>`;
  }
  function sentModal(r) {
    if (!r) return '';
    const copy = inviteCopy(r); const isA = (r.sentAs || r.type) === 'async';
    return `<div class="modal-wrap"><div class="modal" role="dialog" aria-label="Invite sent" id="sent-modal">
      <h2><span class="ok-dot">${I('check')}</span>Invite sent</h2>
      <p class="muted" style="margin:4px 0 0">Exam #${r.id} was created once, as ${isA ? 'an <b>async review</b>' : 'a <b>video visit</b>'}. No copy and no second exam. The visit type, reason and checks are stored on it.</p>
      <div style="margin-top:14px">${decisionCard({ type: isA ? 'async' : 'video', title: isA ? 'Async review' : 'Video visit', reason: r.reason, checks: r.checks })}</div>
      <h4>What the patient gets ${isA ? '<span class="chip chip-open">Draft copy, requirement 9</span>' : '<span class="chip chip-def">As today</span>'}</h4>
      <div class="msg-grid"><div class="msg"><div class="mh">${I('phone')} Text message</div>${esc(copy.sms)}</div><div class="msg"><div class="mh">${I('mail')} Email</div><div class="msubj">${esc(copy.subject)}</div>${esc(copy.email)}</div></div>
      <div class="foot"><button class="btn btn-ghost" data-act="modal-close">Done</button><button class="btn btn-cta" data-act="goto-patient" data-id="${r.id}">${I('phone')} See what the patient sees</button></div>
    </div></div>`;
  }
  function resetModal() {
    return `<div class="modal-wrap"><div class="modal" style="width:min(540px,100%)"><h2>Reset the demo</h2><p class="muted" style="margin:4px 0 0">Clears every change, invite and answer in this browser.</p>
      <div class="reset-opts"><button data-act="reset" data-preset="fresh"><b>Start over</b><span>Everything back to the first visit: the welcome screen, notes on, and every What if question at its default.</span></button><button data-act="reset" data-preset="before"><b>Before the pilot</b><span>Arizona not reviewed yet, and every exam and clinic switched off. The walkthrough opens on the right at step 1.</span></button><button data-act="reset" data-preset="pilot"><b>Pilot running</b><span>Arizona allowed, the two weight-loss follow-ups and Mock Wellness Clinic switched on.</span></button></div>
      <div class="foot"><button class="btn btn-ghost" data-act="modal-close">Cancel</button></div></div></div>`;
  }
  function kvt(rows) { return `<table class="kvt">${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`; }
  function ctxSummary() {
    return `${kvt(D.PRD.summary)}<h3>Who sees what</h3><table class="tbl"><thead><tr><th>Who</th><th>Where</th><th>What they see</th><th></th></tr></thead><tbody>${D.PRD.whoSees.map(([w, p, s, step]) => `<tr><td><b>${esc(w)}</b></td><td>${esc(p)}</td><td>${esc(s)}</td><td class="r"><button class="btn btn-ghost sm" data-act="wt-jump" data-step="${step}">See it</button></td></tr>`).join('')}</tbody></table>`;
  }
  function ctxHow() {
    return `<h3>How an invite is decided</h3><div class="flow"><div class="fs"><b>1. Exam</b>Switched on, and allowed to be</div><div class="fs"><b>2. State</b>Async allowed for the patient's state</div><div class="fs"><b>3. Clinic</b>Switched on</div><div class="fs out"><b>All three: async review</b>Any one off: video visit. The patient can always choose video.</div></div>${kvt(D.PRD.how)}`;
  }
  function ctxDecisions() {
    const pc = previewCount();
    let h = `<p>Everything else in the PRD is decided. The demo builds to each default. Flip a question to preview its alternative. Nothing here is decided until its owner answers.</p>${pc ? `<div class="banner warn">${I('alert')}<div>Previewing ${pc} alternative${pc > 1 ? 's' : ''}. <button class="link" data-act="whatif-reset">Put everything back to the defaults</button></div></div>` : ''}`;
    [['Leadership', 'Leadership'], ['Engineering', 'Engineering'], ['Legal', 'Legal (General Counsel)']].forEach(([who, label]) => {
      h += `<div class="q-group"><h3>${esc(label)}</h3>`;
      D.PRD.decisions.filter((q) => q.who === who).forEach((q) => {
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
    return `<p>Nine requirements, each with its test. <b>See it</b> jumps to the walkthrough step that shows it.</p>${D.PRD.requirements.map((r) => `<div class="req"><span class="n">R${r.n}</span><div><b>${esc(r.title)}</b><p>${esc(r.text)}</p><div class="pass"><b style="display:inline">Passes when:</b> ${esc(r.passes)}</div></div><button class="btn btn-ghost sm" data-act="wt-jump" data-step="${r.step}">See it</button></div>`).join('')}`;
  }
  function ctxNumbers() {
    return `<table class="tbl"><thead><tr><th>What</th><th>Per month</th><th>Saved</th></tr></thead><tbody>${D.PRD.numbers.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td class="nowrap">${esc(b)}</td><td class="nowrap">${esc(c)}</td></tr>`).join('')}</tbody></table><ul style="padding-left:18px">${D.PRD.numberNotes.map(([a, b]) => `<li style="margin:6px 0"><b>${esc(a)}</b> ${esc(b)}</li>`).join('')}</ul>`;
  }
  function ctxPilot() {
    return `${kvt(D.PRD.pilot)}<h3>Success after 30 days</h3><table class="tbl"><thead><tr><th>Measure</th><th>Target</th></tr></thead><tbody>${D.PRD.success.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table><div class="row" style="margin-top:12px"><button class="btn btn-ghost sm" data-act="wt-jump" data-step="pilot">See the live scorecard</button></div>`;
  }
  function ctxRisks() {
    return `<table class="tbl"><thead><tr><th>Risk</th><th>Response</th></tr></thead><tbody>${D.PRD.risks.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table><h3>Later: not in the first release, not in this demo</h3>${kvt(D.PRD.later)}`;
  }
  function ctxAbout() {
    return `<h3>What this is</h3><p>A clickable planning prototype for review and hand-off. Engineering builds the real thing from the PRD and its stories. Nothing here is production code or a spec for how to build it.</p>
    <h3>What's real and what's made up</h3><table class="kvt"><tr><th>From the PRD</th><td>The rules, the three checks, who sees what, the requirements, the decisions and their defaults, the pilot plan and the risks.</td></tr><tr><th>Illustrative</th><td>State settings and notes, exam names, demo clinics, patients, providers, times, the 4-hour hold, and the invite text (a draft for requirement 9).</td></tr><tr><th>Not built</th><td>Anything on the Later list, real sending, the real fields of Async Access Settings, and every integration.</td></tr></table>
    
    
    <h3>How to use it</h3><ul style="padding-left:18px"><li>The <b>bottom bar</b> switches between SuperAdmin, Clinic, Patient and Provider. They share one set of switches and exams.</li><li><b>Notes</b> hides the amber placement notes for a cleaner screen.</li><li><b>Reset</b> starts over, before the pilot or with it running. Changes are kept in this browser until then.</li><li>The arrow keys move through the walkthrough.</li></ul>`;
  }
  function drawer() {
    if (S.drawer.kind === 'record') {
      const r = rec(S.drawer.id); if (!r) return '';
      return `<div class="backdrop" data-act="drawer-bg"><div class="drawer" data-stop><div class="dr-head" style="padding-bottom:16px"><div class="row-between"><div><div class="dr-kicker">Exam record</div><h2>#${r.id} ${esc(r.patient.first)} ${esc(r.patient.last)}</h2><div class="sub">${esc(EXAM_BY[r.examId].name)}</div></div><button class="dr-x" data-act="drawer-close" aria-label="Close">${I('x')}</button></div></div><div class="dr-body">${auditCard(r, 'record-audit')}</div></div></div>`;
    }
    const tabs = [['summary', 'Summary'], ['how', 'How it works'], ['decisions', 'Decisions'], ['requirements', 'Requirements'], ['pilot', 'Pilot'], ['risks', 'Risks and later'], ['about', 'About the demo']];
    const t = S.ctxTab || 'summary'; const pc = previewCount();
    const body = { summary: ctxSummary, how: ctxHow, decisions: ctxDecisions, requirements: ctxRequirements, numbers: ctxNumbers, pilot: ctxPilot, risks: ctxRisks, about: ctxAbout }[t] || ctxSummary;
    return `<div class="backdrop" data-act="drawer-bg"><div class="drawer" data-stop id="ctx-drawer"><div class="dr-head"><div class="row-between"><div><div class="dr-kicker">PRD context</div><h2>Async Conversion</h2><div class="sub">${esc(D.META.prd)} · ${esc(D.META.prdDate)} · ${esc(D.META.owner)}</div></div><button class="dr-x" data-act="drawer-close" aria-label="Close">${I('x')}</button></div>
      <div class="dr-tabs">${tabs.map(([id, l]) => `<button class="${t === id ? 'on' : ''}" data-act="ctx-tab" data-tab="${id}">${l}${id === 'decisions' ? ` <span class="chip ${pc ? 'chip-prev' : 'chip-open'}" style="margin-left:4px">${pc ? pc + ' preview' : '11 open'}</span>` : ''}</button>`).join('')}</div></div>
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
    const roles = [['superadmin', 'shield', 'SuperAdmin'], ['clinic', 'building', 'Clinic'], ['patient', 'phone', 'Patient'], ['provider', 'stethoscope', 'Provider']];
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
  const intakeAnswers = () => Object.assign(emptyIntake(), { dose: D.DOSES[1], weight: '184', fx: { nausea: true, constipation: false, fatigue: false, none: false }, note: 'Mild nausea the first two days after each dose.', confirm: true, ack: true });

  const STEPS = [
    { id: 'intro', title: 'One exam, two ways to run it', where: `Async conversion · PRD ${D.META.prd} · ${D.META.prdDate}`, refs: [],
      body: `<p>When the rules allow it, a clinic's invite runs as an <b>async review</b> instead of a video visit. It's the same exam, with no separate async copy.</p>
        <ul><li><b>Why:</b> a full-time provider reviewing async costs less than a 1099 provider on video.</li>
        <li><b>How:</b> SuperAdmins switch on exams, states and clinics. With all three on, the invite is async. If any is off, it's a video visit.</li>
        <li><b>Always:</b> the patient can choose a video visit.</li>
        <li><b>First release:</b> clinic-portal invites for weight-loss follow-up exams, piloted at 3 clinics.</li></ul>
        <p class="wt-hint">You'll follow one invite from the SuperAdmin switches to the provider's review. Use Next or the arrow keys. The bottom bar switches views at any time.</p>`,
      run() { go('superadmin'); S.view.sa = 'settings'; } },
    { id: 'settings', title: 'Where it lives: SuperAdmin Settings', where: 'SuperAdmin portal › Settings', refs: ['R4', 'Q2'], target: '#btn-hub',
      body: `<p>The <b>Async Compliance Hub</b> is a new button next to <b>Async Access Settings</b>, which already exists.</p>
        <ul><li>The hub decides <b>whether</b> an invite can run async.</li><li>Async Access Settings decides <b>who sees it first</b>: it controls when 1099 providers see async exams.</li><li>Only a few SuperAdmins can open the hub, run by Compliance at first.</li></ul>`,
      run() { go('superadmin'); S.view.sa = 'settings'; } },
    { id: 'states', title: 'Compliance sets each state', where: 'SuperAdmin › Settings › Async Compliance Hub › States', refs: ['R2', 'R4', 'Q3'], target: '#state-editor',
      body: `<p>Every state (50 plus DC) is <b>Async allowed</b>, <b>Video only</b> or <b>Conditional</b>, with a note. Conditional counts as video for now.</p>
        <ul><li>States nobody has reviewed stay video. That's question 3's default for go-live.</li><li>A change applies to new invites at once. Open async exams in a state switched off are moved by hand.</li></ul>
        <p>Arizona hasn't been reviewed yet. Compliance sets it to Async allowed, with a note.</p>`,
      doLabel: 'Save Arizona as Async allowed',
      done: () => S.states.AZ.status === 'async',
      doIt() { if (S.states.AZ.status !== 'async') saveStateChange('AZ', 'async', AZ_NOTE); if (S.role === 'superadmin' && S.view.sa === 'hub') S.view.stateEdit = { code: 'AZ', status: 'async', note: '' }; },
      run() { go('superadmin'); Object.assign(S.view, { sa: 'hub', hubTab: 'states', mapMode: 'map', filter: 'all' }); S.view.stateEdit = S.states.AZ.status !== 'async' ? { code: 'AZ', status: 'async', note: AZ_NOTE } : { code: 'AZ', status: 'async', note: '' }; } },
    { id: 'exams', title: 'Only follow-up exams can be switched on', where: 'SuperAdmin › Async Compliance Hub › Exams', refs: ['R1', 'R3', 'Q6'], target: '#exam-card',
      body: `<ul><li><b>First visits stay on video.</b> Only exams used for follow-ups can be switched on.</li><li><b>Controlled substances stay video</b> unless General Counsel clears the exam.</li><li><b>An exam needs what async review needs</b>, like async questions, before it can go async. What that means exactly is question 6 for Engineering.</li><li>Every switch starts off.</li></ul><p>Switch on the two weight-loss follow-up exams for the pilot.</p>`,
      doLabel: 'Switch on the two follow-up exams',
      done: () => examOn('wl-fu-sema') && examOn('wl-fu-tirz'),
      doIt() { setExam('wl-fu-sema', true); setExam('wl-fu-tirz', true); },
      run() { go('superadmin'); S.view.sa = 'hub'; S.view.hubTab = 'exams'; } },
    { id: 'clinics', title: 'Each clinic has its own switch', where: 'SuperAdmin › Async Compliance Hub › Clinics', refs: ['R3', 'R4', 'Q7'], target: '#clinic-card',
      body: `<ul><li>The switch is off by default, and separate from the async setting clinics use today. Reusing that setting would switch on every clinic already using async at once (question 7).</li><li>Clinics can't turn async on themselves. Compliance decides where async is allowed.</li></ul><p>Switch on Mock Wellness Clinic. It stands in for one of the three pilot clinics.</p>`,
      doLabel: 'Switch on Mock Wellness Clinic',
      done: () => clinicOn('mock'),
      doIt() { setClinic('mock', true); },
      run() { go('superadmin'); S.view.sa = 'hub'; S.view.hubTab = 'clinics'; } },
    { id: 'log', title: 'Every change is logged', where: 'SuperAdmin › Async Compliance Hub › Change log', refs: ['R4'], target: '#log-table',
      body: `<p>Each change records <b>who</b>, <b>when</b>, the <b>old and new value</b>, and the note. Nothing is edited in place.</p><p>The changes you just made are at the top.</p>`,
      run() { go('superadmin'); S.view.sa = 'hub'; S.view.hubTab = 'log'; } },
    { id: 'invite-async', title: 'The clinic sees the visit type, and why', where: 'Clinic portal › Results › Invite Patient', refs: ['R6', 'Q4'], target: '#visit-type',
      body: `<p>A clinic invites a returning patient in Arizona to a weight-loss follow-up. Before sending, staff see <b>Async review</b> and the reason.</p><ul><li>All three checks pass: the exam, Arizona and the clinic are switched on.</li><li>There's no control to change it. Clinics can't choose video in the first release (question 4's default), but the patient can.</li></ul>`,
      run() { go('clinic'); S.view.clinic = 'invite'; S.invite = inviteFromPatient(D.PATIENTS[0]); } },
    { id: 'invite-video', title: 'Same exam, different state', where: 'Clinic portal › Invite Patient › Patient State', refs: ['R1', 'R2', 'R6'], target: '#visit-type',
      body: `<p>The patient's state is now <b>California</b>. California is Video only in this demo, so the same exam becomes a <b>video visit</b>, and the reason names California.</p><p class="wt-hint">Try other states in the Patient State list. States that nobody has reviewed stay video.</p>`,
      run() { go('clinic'); S.view.clinic = 'invite'; S.invite = inviteFromPatient(D.PATIENTS[0]); S.invite.state = 'CA'; } },
    { id: 'invite-send', title: 'Send it: one exam, created once', where: 'Clinic portal › Invite Patient › Send Invite', refs: ['R1', 'R8', 'R9'], target: '#btn-send', stayAfterDo: true,
      body: `<p>Back to Arizona. Sending creates the exam once, as an async review. The visit type, the reason and the three checks are stored on the exam.</p><p>The text and email tell the patient what happens next, and that video is available. That copy is one of the launch assets (requirement 9).</p>`,
      doLabel: 'Send the invite',
      done: () => !!wtRec(),
      doIt() { S.invite = inviteFromPatient(D.PATIENTS[0]); const r = sendInvite(); S.wtRecordId = r.id; },
      run() { go('clinic'); S.view.clinic = 'invite'; S.invite = inviteFromPatient(D.PATIENTS[0]); } },
    { id: 'results', title: 'Every invite shows its visit type', where: 'Clinic portal › Results', refs: ['R8', 'R4'], target: '#results-card',
      body: `<p>The new exam is at the top of Results with its visit type and reason. Click any row to see why it was async or video. That's the audit trail (requirement 8).</p><p>Nothing in the clinic portal can change async.</p>`,
      run() { go('clinic'); S.view.clinic = 'results'; } },
    { id: 'patient-sms', title: 'The patient gets the invite', where: 'Patient › text message', refs: ['R9'], target: '.phone',
      body: `<p>The text says it's an async review, that no video call is needed, and that video is an option.</p>`,
      doLabel: 'Open the link',
      done: () => { const r = wtRec(); return !!r && r.status !== 'invited'; },
      doIt() { const r = wtRec(); if (r) patientOpen(r); },
      run() { go('patient'); S.view.patientId = S.wtRecordId; S.view.pscreen = 'sms'; } },
    { id: 'patient-welcome', title: 'Video is one tap away', where: 'Patient › async intake › first screen', refs: ['R7', 'Q11'], target: '#pt-video-option',
      body: `<ul><li>The first screen explains the async review, and offers a <b>video visit instead</b> in plain view (requirement 7).</li><li>Choosing video turns the exam into a video visit and records the choice. It's still one exam.</li><li>The consent wording waits on Legal: is today's async consent enough, or do converted exams need their own disclosure (question 11)?</li></ul>`,
      run() { go('patient'); S.view.patientId = S.wtRecordId; const r = wtRec(); if (r && r.type === 'async' && OPEN_PT.includes(r.status)) S.view.pscreen = 'welcome'; } },
    { id: 'patient-submit', title: 'The patient answers and submits', where: 'Patient › async intake › questions', refs: ['R7'], target: '.phone',
      body: `<p>The patient answers the follow-up questions. The video option stays available until they submit.</p>`,
      doLabel: 'Answer and submit',
      done: () => { const r = wtRec(); return !!r && ['submitted', 'in-review', 'completed', 'deferred'].includes(r.status); },
      doIt() { const r = wtRec(); if (r && r.type === 'async' && OPEN_PT.includes(r.status)) { S.intake = intakeAnswers(); patientSubmit(r); } },
      run() { go('patient'); S.view.patientId = S.wtRecordId; const r = wtRec(); if (r && r.type === 'async' && OPEN_PT.includes(r.status)) { S.view.pscreen = 'questions'; if (!S.intake.weight) S.intake = intakeAnswers(); } } },
    { id: 'provider-ft', title: 'It lands in the async queue', where: 'Provider portal › Asynchronous Exam', refs: ['Q2'], target: '#queue-card',
      body: () => { const r = wtRec(); const lost = r && r.type !== 'async'; return `${lost ? '<p><b>The patient chose video</b>, so this exam is a video visit now and isn\'t in the async queue. Restart the walkthrough to follow the async path.</p>' : ''}<ul><li>A converted exam is worked like any async exam today, marked <b>Converted</b>.</li><li>Full-time providers see it first (question 2's default), because a converted exam only saves money when a full-time provider does it.</li></ul>`; },
      run() { go('provider'); S.view.providerAs = 'ft'; S.view.provider = 'queue'; } },
    { id: 'provider-1099', title: '1099 providers see it later', where: 'Provider portal › Asynchronous Exam, as a 1099 provider', refs: ['Q2'], target: () => (document.getElementById('held-note') ? '#held-note' : '#queue-card'),
      body: () => (S.whatif.q2 === 'yes'
        ? `<p>Signed in as a 1099 provider, the converted exam isn't in the list yet. <b>Async Access Settings</b> holds it for full-time providers first (${esc(S.access.holdHours)} hours in this demo).</p><p>That screen already exists in SuperAdmin, so this uses a setting we have rather than a new one.</p>`
        : '<p>Question 2 is set to <b>No</b> in What if, so the converted exam shows to 1099 providers at once.</p>'),
      run() { go('provider'); S.view.providerAs = '1099'; S.view.provider = 'queue'; } },
    { id: 'provider-review', title: "Why it's async, on the exam", where: 'Provider portal › Asynchronous Exam › exam review', refs: ['R8'], target: '#audit-card',
      body: `<p>The full-time provider claims the exam. The record shows why it was async: the three checks as they stood when the invite was sent. Any exam can be audited this way (requirement 8).</p><p class="wt-hint">Letting a provider switch an async exam to video, with a reason, is on the Later list.</p>`,
      doLabel: 'Approve the exam',
      done: () => { const r = wtRec(); return !!r && (r.status === 'completed' || r.status === 'deferred'); },
      doIt() { const r = wtRec(); if (!r) return; if (r.status === 'submitted') claim(r.id, 'ft'); if (r.status === 'in-review') finish(r.id, 'completed'); },
      run() { go('provider'); S.view.providerAs = 'ft'; const r = wtRec(); if (r && r.status === 'submitted') claim(r.id, 'ft'); if (r && r.type === 'async') { S.view.provider = 'review'; S.view.reviewId = r.id; } else S.view.provider = 'queue'; } },
    { id: 'channels', title: 'Only clinic-portal invites change', where: 'SuperAdmin › Async Compliance Hub › Test an invite', refs: ['R5'], target: '#tester-result',
      body: `<p>The same Arizona follow-up sent through the <b>API</b> behaves as today. API, Quidget and Connect Instantly invites aren't checked in the first release (requirement 5).</p><p>API invites come later, after API docs, a sandbox and notice to partners.</p><p class="wt-hint">Switch "Sent from" to Clinic portal to see the same invite convert.</p>`,
      run() { go('superadmin'); S.view.sa = 'hub'; S.view.hubTab = 'test'; S.tester = { channel: 'api', clinicId: 'mock', state: 'AZ', examId: 'wl-fu-sema', returning: 'yes' }; } },
    { id: 'pilot', title: 'The pilot measures itself', where: 'SuperAdmin › Async Compliance Hub › Pilot', refs: [], target: '#scorecard',
      body: `<ul><li><b>Start:</b> Compliance switches on the pilot states, the weight-loss follow-up exams and 3 portal clinics.</li><li><b>Week one:</b> Product and Compliance review every decision.</li><li><b>Grow:</b> add clinics each week while the full-time queue keeps up.</li></ul><p>The scorecard tracks the 30-day success measures from this demo's exams.</p>`,
      run() { go('superadmin'); S.view.sa = 'hub'; S.view.hubTab = 'pilot'; } },
    { id: 'decisions', title: 'Eleven open questions', where: 'PRD context › Decisions', refs: [], target: null,
      body: `<p>Everything else is decided. The demo builds to each default. Flip any question to preview its alternative:</p><ul><li><b>Leadership:</b> start small or add returning patients; full-time first; states start off or on; can clinics choose video; keep today's async copies.</li><li><b>Engineering:</b> how one exam runs either way; reuse the existing async setting; a staging date; two async bugs.</li><li><b>Legal:</b> which state's rules apply; whether today's consent is enough.</li></ul>`,
      run() { S.drawer = { kind: 'ctx' }; S.ctxTab = 'decisions'; } },
    { id: 'end', title: "That's the flow", where: 'Async conversion · explore freely', refs: [], target: null,
      body: `<p>One exam, three switches, a visible reason, and a patient who can always choose video.</p><ul><li><b>Explore:</b> use the bottom bar to switch views, and try other states, exams and patients.</li><li><b>What if:</b> preview any open question's alternative.</li><li><b>Reset:</b> start again before the pilot, or with it running.</li></ul>`,
      run() { go('superadmin'); S.view.sa = 'hub'; S.view.hubTab = 'states'; S.view.stateEdit = null; } },
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
  const refLabel = (r) => (r[0] === 'R' ? `Requirement ${r.slice(1)}` : r[0] === 'Q' ? `Question ${r.slice(1)}` : r);
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
    'sa-go'(d) { go('superadmin'); S.view.sa = d.page; S.view.stateEdit = null; },
    'hub-tab'(d) { S.view.hubTab = d.tab; },
    'map-mode'(d) { S.view.mapMode = d.mode; },
    'st-filter'(d) { S.view.filter = d.f; },
    'st-open'(d) { const st = S.states[d.code]; S.view.stateEdit = { code: d.code, status: st.status === 'unreviewed' ? 'async' : st.status, note: '' }; },
    'st-pick'(d) { if (S.view.stateEdit) S.view.stateEdit.status = d.v; },
    'st-save'() {
      const ed = S.view.stateEdit; if (!canSaveState()) return false;
      saveStateChange(ed.code, ed.status, ed.note.trim());
      toast(`${stateName(ed.code)} saved as ${STATUS_LABEL[ed.status]}. It's in the change log.`);
      S.view.stateEdit = { code: ed.code, status: ed.status, note: '' };
    },
    'st-cancel'() { S.view.stateEdit = null; },
    'move-video'(d) { moveToVideo(Number(d.id)); toast(`Exam #${d.id} moved to a video visit by hand.`); },
    'exam-toggle'(d) { const on = !S.exams[d.id].on; setExam(d.id, on); toast(`${EXAM_BY[d.id].name} switched ${on ? 'on' : 'off'}. Logged.`); },
    'clinic-toggle'(d) { const on = !(S.whatif.q7 === 'reuse' ? S.asyncToday[d.id] : S.clinics[d.id].on); setClinic(d.id, on); toast(`${CLINIC_BY[d.id].name} switched ${on ? 'on' : 'off'}. Logged.`); },
    'ct-pick'(d) { S.invite.type = d.type; const first = D.EXAMS.find((e) => e.type === d.type && selectable(e)); S.invite.examId = first ? first.id : ''; S.invite.sendAsVideo = false; },
    'load-patient'(d) { const p = D.PATIENTS[Number(d.i)]; Object.assign(S.invite, { first: p.first, last: p.last, email: p.email, phone: p.phone, state: p.state, returning: !!p.returning, lastVisit: p.lastVisit || '' }); },
    'send-invite'() { if (!S.invite.examId) { toast('Pick an exam first.'); return false; } sendInvite(); },
    'modal-close'() { S.modal = null; },
    'goto-patient'(d) { S.modal = null; go('patient'); S.view.patientId = Number(d.id); S.view.pscreen = 'sms'; },
    'clinic-go'(d) { go('clinic'); S.view.clinic = d.page || 'results'; },
    'clinic-back'() { S.view.clinic = 'results'; },
    'clinic-settings'() { toast("Clinic Settings don't change. Nothing in the clinic portal can change async (requirement 4)."); return false; },
    'rec-open'(d) { S.drawer = { kind: 'record', id: Number(d.id) }; },
    drawer(d) { S.drawer = { kind: 'ctx' }; S.ctxTab = d.tab || S.ctxTab || 'summary'; },
    'drawer-close'() { S.drawer = null; },
    'drawer-bg'() { S.drawer = null; },
    'ctx-tab'(d) { S.ctxTab = d.tab; },
    whatif(d) {
      const q = D.PRD.decisions.find((x) => x.key === d.k); if (!q || !q.opts) return false;
      S.whatif[d.k] = d.v;
      if (d.k === 'q5' && d.v === 'retire' && EXAM_BY[S.invite.examId] && EXAM_BY[S.invite.examId].copy) S.invite.examId = 'wl-fu-sema';
      toast(q.opts[0].v === d.v ? `Question ${q.n} is back to its default.` : `Previewing question ${q.n}: ${q.effect[d.v]}`);
    },
    'whatif-reset'() { S.whatif = Object.assign({}, WHATIF_DEFAULTS); toast('Every question is back to its default.'); },
    'pt-open'() { patientOpen(curPtRec()); },
    'pt-start'() { S.view.pscreen = 'questions'; },
    'pt-video'() { S.view.pscreen = 'video-confirm'; },
    'pt-video-yes'() { patientChooseVideo(curPtRec()); toast('The exam is now a video visit. The choice is recorded.'); },
    'pt-screen'(d) { S.view.pscreen = d.s; },
    'pt-location'() { patientLocation(curPtRec()); },
    'pt-submit'() { if (!S.intake.confirm) return false; patientSubmit(curPtRec()); },
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
    ref(d) { S.drawer = { kind: 'ctx' }; S.ctxTab = d.ref[0] === 'R' ? 'requirements' : 'decisions'; },
    'start-wt'() { startWalkthrough(0); },
    'start-explore'() { reset('pilot'); S.wt.on = false; go('superadmin'); S.view.sa = 'hub'; S.view.hubTab = 'states'; toast('The pilot is switched on: Arizona, the two follow-up exams and Mock Wellness Clinic.'); },
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
