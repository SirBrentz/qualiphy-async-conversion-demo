/* Async conversion demo: data.
   Demo data (state settings, exams, clinics, patients, providers, invite copy) is illustrative.
   The PRD block mirrors "PRD: Async Conversion", Draft v0.18, updated for the Sep 24 design session.
   Everything sensitive (names, figures, ticket keys, customers) lives in the PRD block, so the public
   share build only has to swap that block. app.js stays free of it. */
(function () {
  const D = (window.DEMO = {});

  D.META = { prd: 'Draft v0.18', prdDate: 'Sep 24, 2026', owner: 'Product' };

  /* Square tile map, 11 columns by 8 rows, roughly geographic. */
  D.STATES = [
    { code: 'AK', name: 'Alaska', col: 0, row: 0 }, { code: 'ME', name: 'Maine', col: 10, row: 0 },
    { code: 'WI', name: 'Wisconsin', col: 5, row: 1 }, { code: 'VT', name: 'Vermont', col: 9, row: 1 },
    { code: 'NH', name: 'New Hampshire', col: 10, row: 1 }, { code: 'WA', name: 'Washington', col: 0, row: 2 },
    { code: 'ID', name: 'Idaho', col: 1, row: 2 }, { code: 'MT', name: 'Montana', col: 2, row: 2 },
    { code: 'ND', name: 'North Dakota', col: 3, row: 2 }, { code: 'MN', name: 'Minnesota', col: 4, row: 2 },
    { code: 'IL', name: 'Illinois', col: 5, row: 2 }, { code: 'MI', name: 'Michigan', col: 6, row: 2 },
    { code: 'NY', name: 'New York', col: 8, row: 2 }, { code: 'MA', name: 'Massachusetts', col: 9, row: 2 },
    { code: 'OR', name: 'Oregon', col: 0, row: 3 }, { code: 'NV', name: 'Nevada', col: 1, row: 3 },
    { code: 'WY', name: 'Wyoming', col: 2, row: 3 }, { code: 'SD', name: 'South Dakota', col: 3, row: 3 },
    { code: 'IA', name: 'Iowa', col: 4, row: 3 }, { code: 'IN', name: 'Indiana', col: 5, row: 3 },
    { code: 'OH', name: 'Ohio', col: 6, row: 3 }, { code: 'PA', name: 'Pennsylvania', col: 7, row: 3 },
    { code: 'NJ', name: 'New Jersey', col: 8, row: 3 }, { code: 'CT', name: 'Connecticut', col: 9, row: 3 },
    { code: 'RI', name: 'Rhode Island', col: 10, row: 3 }, { code: 'CA', name: 'California', col: 0, row: 4 },
    { code: 'UT', name: 'Utah', col: 1, row: 4 }, { code: 'CO', name: 'Colorado', col: 2, row: 4 },
    { code: 'NE', name: 'Nebraska', col: 3, row: 4 }, { code: 'MO', name: 'Missouri', col: 4, row: 4 },
    { code: 'KY', name: 'Kentucky', col: 5, row: 4 }, { code: 'WV', name: 'West Virginia', col: 6, row: 4 },
    { code: 'VA', name: 'Virginia', col: 7, row: 4 }, { code: 'MD', name: 'Maryland', col: 8, row: 4 },
    { code: 'DE', name: 'Delaware', col: 9, row: 4 }, { code: 'AZ', name: 'Arizona', col: 1, row: 5 },
    { code: 'NM', name: 'New Mexico', col: 2, row: 5 }, { code: 'KS', name: 'Kansas', col: 3, row: 5 },
    { code: 'AR', name: 'Arkansas', col: 4, row: 5 }, { code: 'TN', name: 'Tennessee', col: 5, row: 5 },
    { code: 'NC', name: 'North Carolina', col: 6, row: 5 }, { code: 'SC', name: 'South Carolina', col: 7, row: 5 },
    { code: 'DC', name: 'District of Columbia', col: 8, row: 5 }, { code: 'OK', name: 'Oklahoma', col: 3, row: 6 },
    { code: 'LA', name: 'Louisiana', col: 4, row: 6 }, { code: 'MS', name: 'Mississippi', col: 5, row: 6 },
    { code: 'AL', name: 'Alabama', col: 6, row: 6 }, { code: 'GA', name: 'Georgia', col: 7, row: 6 },
    { code: 'HI', name: 'Hawaii', col: 0, row: 7 }, { code: 'TX', name: 'Texas', col: 3, row: 7 },
    { code: 'FL', name: 'Florida', col: 8, row: 7 },
  ];

  /* Illustrative Compliance settings on the day the demo starts. Not legal guidance.
     Every other state starts "Not reviewed", which stays video under question 2's default.
     firstVideo: states where a patient's first visit must be a video visit (a per-state rule). */
  D.STATE_START = {
    async: ['TX', 'FL', 'GA', 'NC', 'TN', 'OH', 'MI', 'IL', 'CO', 'WA', 'OR', 'NV', 'UT', 'MO', 'IN', 'VA', 'MN', 'WI'],
    video: {
      CA: 'Live visit required (illustrative)',
      AL: 'Live visit required (illustrative)',
      AR: 'Live visit required (illustrative)',
      DE: 'Live visit required (illustrative)',
    },
    conditional: {
      PA: 'Needs a video visit in the last 6 months (example)',
      SC: 'Async allowed except ED medications (example)',
    },
    firstVideo: ['TX', 'FL', 'OH', 'MI'],
  };

  /* Labels match the clinic portal's Invite Patient page. */
  D.CONSULT_TYPES = [
    { id: 'gfe', label: 'Good Faith Exam & Orders' },
    { id: 'rx', label: 'QualiphyRx Packages: Consultation + Medication Delivery Made Easy' },
    { id: 'urgent', label: 'Urgent Care Visit: Consultation + Prescription Sent to Your Pharmacy' },
    { id: 'pharmacy', label: 'Choose Your Pharmacy (Consultation and Prescription Only)' },
  ];

  /* Illustrative exam catalog. visit: what the exam is used for. ready = has what async review needs. */
  D.EXAMS = [
    { id: 'wl-fu-sema', name: 'GLP-1 Weight Loss Follow-Up (Semaglutide)', short: 'weight-loss follow-up', type: 'rx', visit: 'follow-up', category: 'Weight loss', ready: true },
    { id: 'wl-fu-tirz', name: 'GLP-1 Weight Loss Follow-Up (Tirzepatide)', short: 'weight-loss follow-up', type: 'rx', visit: 'follow-up', category: 'Weight loss', ready: true },
    { id: 'wl-fu-oral', name: 'Weight Loss Follow-Up (Oral Semaglutide)', short: 'weight-loss follow-up', type: 'rx', visit: 'follow-up', category: 'Weight loss', ready: false },
    { id: 'wl-first-sema', name: 'GLP-1 Weight Loss Exam (Semaglutide)', short: 'weight-loss exam', type: 'rx', visit: 'first', category: 'Weight loss', ready: true },
    { id: 'wl-copy', name: 'GLP-1 Weight Loss Follow-Up, Async (90-day)', short: 'weight-loss follow-up', type: 'rx', visit: 'follow-up', category: 'Weight loss', copy: true, ready: true },
    { id: 'iv-gfe', name: 'IV Therapy Good Faith Exam', short: 'IV therapy exam', type: 'gfe', visit: 'first', category: 'IV therapy', ready: true },
    { id: 'botox-gfe', name: 'Botox & Filler Good Faith Exam', short: 'Botox and filler exam', type: 'gfe', visit: 'first', category: 'Aesthetics', ready: true },
    { id: 'urgent', name: 'Urgent Care Visit', short: 'urgent care visit', type: 'urgent', visit: 'first', category: 'Urgent care', urgent: true, ready: false },
    { id: 'trt', name: 'Testosterone Therapy Follow-Up', short: 'testosterone follow-up', type: 'pharmacy', visit: 'follow-up', category: 'Hormones', controlled: true, ready: true },
    /* Custom exams: built by one clinic (owner) and only sendable by it. The SuperAdmin exam list covers both kinds. */
    { id: 'c-wl-checkin', name: 'Weight Loss Monthly Check-In', short: 'weight-loss check-in', type: 'rx', visit: 'follow-up', category: 'Weight loss', custom: true, owner: 'mock', ready: true },
    { id: 'c-iv-menu', name: 'IV Hydration Menu Screening', short: 'IV screening', type: 'gfe', visit: 'first', category: 'IV therapy', custom: true, owner: 'ex-iv', ready: false },
  ];

  /* Exam types, as the SuperAdmin exam list filters them. */
  D.EXAM_TYPES = { gfe: 'Good Faith Exam', rx: 'QualiphyRx', urgent: 'Urgent Care', pharmacy: 'Choose Your Pharmacy' };

  /* Illustrative exam rules that supersede the state defaults, set before the demo starts. */
  D.EXAM_START = {
    'iv-gfe': { GA: { mode: 'video', note: 'Illustrative: IV exams need a live visit in this state' } },
  };

  /* Demo clinics. asyncToday = the clinic already uses async today. */
  /* defaultType and choice are the clinic's own settings: default visit type, and let patients choose. */
  D.CLINICS = [
    { id: 'mock', name: 'Mock Wellness Clinic', you: true, pilot: true, asyncToday: false },
    { id: 'ex-aes', name: 'Example Aesthetics', pilot: false, asyncToday: true },
    { id: 'ex-iv', name: 'Example IV Lounge', pilot: false, asyncToday: true, defaultType: 'video' },
    { id: 'ex-wl', name: 'Example Weight Clinic', pilot: false, asyncToday: true },
    { id: 'ex-spa', name: 'Example Med Spa', pilot: false, asyncToday: false, choice: false },
  ];
  D.PILOT_CLINICS = [];

  D.PATIENTS = [
    { first: 'Alex', last: 'Morgan', email: 'alex.morgan@example.com', phone: '(202) 555-0148', state: 'AZ', returning: true, lastVisit: 'Jun 2, 2026', tag: 'Arizona, returning' },
    { first: 'Priya', last: 'Natarajan', email: 'priya.n@example.com', phone: '(415) 555-0162', state: 'CA', returning: true, lastVisit: 'Jul 14, 2026', tag: 'California, returning' },
    { first: 'Daniel', last: 'Okafor', email: 'daniel.okafor@example.com', phone: '(512) 555-0199', state: 'TX', returning: false, lastVisit: '', tag: 'Texas, new patient' },
    { first: 'Maya', last: 'Brennan', email: 'maya.b@example.com', phone: '(717) 555-0107', state: 'PA', returning: true, lastVisit: 'Aug 20, 2026', tag: 'Pennsylvania, returning' },
    { first: 'Jordan', last: 'Reyes', email: 'jordan.reyes@example.com', phone: '(602) 555-0131', state: 'AZ', returning: false, lastVisit: '', tag: 'Arizona, new patient' },
  ];

  D.PROVIDERS = {
    ft: { name: 'Dr. Jordan Lee', kind: 'Full-time provider' },
    c1099: { name: 'Dr. Sam Rivera', kind: '1099 provider' },
  };

  D.DOSES = ['Semaglutide 0.25 mg weekly', 'Semaglutide 0.5 mg weekly', 'Semaglutide 1 mg weekly', 'Semaglutide 1.7 mg weekly', 'Semaglutide 2.4 mg weekly', 'Tirzepatide 2.5 mg weekly', 'Tirzepatide 5 mg weekly', 'Tirzepatide 7.5 mg weekly'];

  /* ---------------------------------------------------------------- PRD (public share build)
     Same structure as the private PRD block in v2/data.js, with customer names, volumes, savings
     figures, ticket keys, internal names and colleague names removed. Edit both when the PRD changes. */
  D.PRD = {};

  D.PRD.owners = [['Leadership', 'Leadership'], ['Engineering', 'Engineering'], ['Legal', 'Legal (General Counsel)']];

  D.PRD.facts = {
    why: 'A full-time provider reviewing async costs less than a 1099 provider on video, so every converted exam saves money.',
    share1099: '',
    bigVolume: '',
    pilotClinics: 'the 3 pilot clinics',
    firstVisitExample: 'For example, a state may allow first-time IV therapy and GLP-1 exams async.',
    apiLater: 'API invites come later, after API docs, a sandbox and notice to partners.',
    session: 'Updated Sep 24, 2026.',
    review: '',
  };

  D.PRD.terms = {
    asyncFlag: '',
    returningSignal: 'picking an existing patient in the patient search first, then automatic patient matching',
  };
  D.PRD.refBase = '';

  D.PRD.checklist = [
    ['Launch assets approved (requirement 10)', 'Support, MedOps and provider docs; a pilot clinic note; invite email and SMS. Invite copy is drafted in this demo.'],
    ['Both async bugs checked (question 11)', 'Two known async bugs fixed or cleared for portal exams'],
    ['Baselines measured', 'Full-time queue wait and deferral rate, in the two weeks before the pilot'],
    ['Clinic settings agreed with each pilot clinic', 'Default visit type and patient choice, before their first async invite'],
    ['Pilot clinics told what their patients will see', 'The three pilot clinics'],
  ];

  D.PRD.summary = [
    ['Goal', 'Let an exam run as an async review instead of a video visit, by choice: the clinic picks it when sending, or the patient picks it at submit. Nothing converts on its own; the rules decide where the choice is offered. Same exam, no separate async copies.'],
    ['Why', 'A full-time provider reviewing an exam async costs less than a 1099 provider on video.'],
    ['How', 'Compliance rules come first: a default for each state, a first-visit rule per state, and exam rules. Within them, the clinic picks async or video on each invite, and the patient can choose the other way unless the clinic turns that off. Nothing converts on its own: where async is allowed, it is offered first.'],
    ['First release', 'Clinic-portal invites, rolled out to 3 pilot clinics. API modes are designed now and built later.'],
    ['Later', 'API invites with modes, Quidget and Connect Instantly, and retiring today\'s async copies.'],
    ['Build', 'To be confirmed by Engineering (questions 8 and 10).'],
    ['Status', 'In design review.'],
  ];

  D.PRD.how = [
    ['Order of control', 'State rules, then the clinic, then the patient. A clinic can never turn on async where the rules say video.'],
    ['Who sets the rules', 'The Async admin role, Compliance at launch, granted by SuperAdmin. Almost no one has SuperAdmin.'],
    ['States', 'Async allowed, Video only or Conditional (video for now), with a note. Plus a per-state rule: first visit must be video.'],
    ['Exams', 'Each exam can or can\'t run async, with exceptions by state. Question 4 asks whether an exception can also allow async where the state says video. Controlled-substance exams stay video unless General Counsel clears them.'],
    ['Clinic', 'A default visit type in Settings, a pick on every invite, and a switch for whether patients can choose.'],
    ['Patient', 'Can switch an async exam to video, or submit a video visit for review instead, when the clinic allows it. Async is the primary button.'],
    ['API', 'Modes: force_sync, force_async and patient_choice, still bounded by the rules. Designed now, built with API invites.'],
    ['Same exam', 'A converted exam is not a copy. Providers work it like any async exam today.'],
    ['Rollout', 'Pilot clinics are switched on with an internal rollout flag (question 6), not a clinic setting.'],
    ['Time to 1099', 'A converted exam waits for full-time providers for the Qualiphy standard time (Async Access Settings) before 1099 providers see it. An exam can set its own time, which overrides the standard.'],
  ];

  D.PRD.whoSees = [
    ['Async admin', 'Compliance hub', 'States with the first-visit rule, exam rules, rollout, change log', 'states'],
    ['Clinic admin', 'Settings', 'Default visit type, and whether patients can choose', 'clinic-settings'],
    ['Clinic staff', 'Send invite', 'Async review or Video visit to pick from, and why', 'invite-async'],
    ['Patient', 'Intake', 'The other visit type in plain view, when allowed', 'patient-welcome'],
    ['Provider (shown in the demo)', 'Asynchronous Exam queue', 'Converted exams, full-time providers first (question 1)', 'provider-ft'],
  ];

  D.PRD.decisions = [
    { n: 1, who: 'Leadership', key: 'q2', short: 'full-time first',
      q: 'Should converted exams go to full-time providers first, even if patients wait a little longer?',
      why: 'A converted exam only saves money when a full-time provider does it, and async volume is growing. Async Access Settings already control when 1099 providers see async exams.',
      def: 'Yes',
      opts: [{ v: 'yes', label: 'Yes' }, { v: 'no', label: 'No' }],
      effect: { yes: '1099 providers see a converted exam only after its time to 1099: the Qualiphy standard, or the exam\'s own.', no: 'Converted exams show to every provider at once.' } },
    { n: 2, who: 'Leadership', key: 'q3', short: 'states start off or on',
      q: 'At go-live, do states start off (Compliance turns on the ones it has reviewed) or on (Compliance turns off the ones that don\'t allow async)?',
      why: 'Each state gets a default: some allow async conversion, some do not. Starting off means an unreviewed state never goes async by mistake.',
      def: 'Off',
      opts: [{ v: 'off', label: 'Off' }, { v: 'on', label: 'On' }],
      effect: { off: 'States nobody has reviewed stay video.', on: 'States nobody has reviewed allow async until Compliance switches them off.' } },
    { n: 3, who: 'Leadership', key: 'qa', short: 'does video stay when patient choice is off',
      q: 'If a clinic turns patient choice off, can the patient still switch an async exam to video?',
      why: 'Clinics get full control of patient choice, but an earlier requirement said the patient always keeps video.',
      def: 'Yes, video stays',
      opts: [{ v: 'keep', label: 'Yes, video stays' }, { v: 'remove', label: 'No, the clinic decides' }],
      effect: { keep: 'Turning patient choice off stops patients choosing async. Video stays one tap away on every async exam.', remove: 'Turning patient choice off removes both options. The patient gets exactly the visit type the clinic picked.' } },
    { n: 4, who: 'Leadership', key: 'qb', short: 'can exam rules allow async',
      q: 'Can an exam\'s rules allow async where the state default says video, or only restrict it?',
      why: 'Exam rules supersede the state defaults. Restricting is always safe; allowing needs Compliance to review each exception.',
      def: 'Only restrict',
      opts: [{ v: 'restrict', label: 'Only restrict' }, { v: 'widen', label: 'Can also allow' }],
      effect: { restrict: 'Exam exceptions can only block async in a state. "Async here" is off.', widen: 'An exam exception can also allow async in a state whose default is video. Each one is logged with a note.' } },
    { n: 5, who: 'Leadership', key: 'qc', short: 'API invites that send no mode',
      q: 'API invites that send no mode: keep today\'s behaviour, or treat them as patient_choice?',
      why: 'The API gets three modes: force_sync, force_async and patient_choice. Partners need notice before behaviour changes.',
      def: 'Today\'s behaviour',
      opts: [{ v: 'today', label: 'Today\'s behaviour' }, { v: 'choice', label: 'patient_choice' }],
      effect: { today: 'An API invite with no mode runs as it does today. Modes are opt-in.', choice: 'An API invite with no mode is treated as patient_choice, within the rules.' } },
    { n: 6, who: 'Leadership', key: 'qd', short: 'how the pilot is gated',
      q: 'Now that clinics pick the visit type, how is the pilot gated: an internal rollout flag per clinic, or open to every clinic at launch?',
      why: 'Without a gate every clinic can send async invites on day one. A rollout flag keeps the first weeks to the 3 pilot clinics.',
      def: 'Rollout flag',
      opts: [{ v: 'flag', label: 'Rollout flag' }, { v: 'open', label: 'Open to all' }],
      effect: { flag: 'Only clinics in the rollout can send async invites.', open: 'Every clinic can send async invites where the rules allow it.' } },
    { n: 7, who: 'Leadership', key: 'q5', short: 'keep today\'s async copies',
      q: 'Keep today\'s separate async copies of exams until API invites convert, or retire them at launch?',
      why: 'The goal is no copies, but API partners still send exams to those copies.',
      def: 'Keep for now',
      opts: [{ v: 'keep', label: 'Keep for now' }, { v: 'retire', label: 'Retire at launch' }],
      effect: { keep: 'The demo\'s async copy stays in the exam list and runs async as it does today.', retire: 'The async copy leaves the invite list.' } },
    { n: 8, who: 'Engineering', key: 'q6', short: 'how one exam runs either way',
      q: 'How do we run one exam as either a video visit or async review, decided per invite, with no separate copy? What must an exam have before it can run async (for example, async questions)?',
      why: 'The core ask. It sets the build size, and what each exam needs before it goes async.',
      def: 'Needs an answer',
      info: 'The demo marks each exam Async-ready or not. Only ready exams can run async.' },
    { n: 9, who: 'Engineering', key: 'q7', short: 'reuse the existing async setting as the rollout flag',
      q: 'Can the rollout flag reuse the existing async setting?',
      why: 'Clinics already using async have it on, so reusing it would roll out to all of them at once.',
      def: 'A separate flag',
      opts: [{ v: 'separate', label: 'A separate flag' }, { v: 'reuse', label: 'Reuse the existing setting' }],
      effect: { separate: 'Each clinic has its own rollout flag, off by default.', reuse: 'The rollout flag is the existing async setting, so every clinic already using async is rolled out at once.' } },
    { n: 10, who: 'Engineering', key: 'q8', short: 'a staging date',
      q: 'What date can this reach staging, with a third of each sprint on features?',
      why: 'Gives leadership a real date.',
      def: 'Needs an answer',
      info: 'Not shown in the demo.' },
    { n: 11, who: 'Engineering', key: 'q9', short: 'two async bugs',
      q: 'Are the two known async bugs fixed for portal exams before the pilot?',
      why: 'Converted exams are async exams, so both bugs would hit pilot clinics.',
      def: 'Fix both first',
      info: 'On the pilot checklist in the hub\'s Pilot tab.' },
    { n: 12, who: 'Legal', key: 'q10', short: 'which state\'s rules apply',
      q: 'If the patient\'s state on the invite differs from where they are during the exam, which state\'s rules apply?',
      why: 'The rules decide by state. If location during the exam governs, the async intake must ask where the patient is.',
      def: 'The invite\'s state',
      opts: [{ v: 'invite', label: 'The invite\'s state' }, { v: 'location', label: 'Where the patient is' }],
      effect: { invite: 'The state on the invite decides.', location: 'The async intake asks where the patient is. A state that doesn\'t allow async turns the exam into a video visit.' } },
    { n: 13, who: 'Legal', key: 'q11', short: 'whether today\'s consent is enough',
      q: 'Is today\'s async consent enough for converted exams, or do they need their own disclosure (why it\'s async, and that video is available)?',
      why: 'Whatever is required goes into the async intake before the pilot.',
      def: 'Needs an answer',
      opts: [{ v: 'pending', label: 'Today\'s consent' }, { v: 'own', label: 'Own disclosure' }],
      effect: { pending: 'The intake shows today\'s consent, marked as waiting on question 13.', own: 'The intake shows a short disclosure the patient acknowledges before starting.' } },
  ];

  D.PRD.numbers = [];
  D.PRD.numberNotes = [];

  D.PRD.requirements = [
    { n: 1, title: 'One exam, either way', text: 'An exam runs as async review or a video visit with no separate async copy.', passes: 'The same exam runs async only when the clinic picks async at send or the patient picks it at submit, and the rules allow it. Otherwise it is a video visit.', step: 'invite-async' },
    { n: 2, title: 'States and first visits', text: 'The Async admin sets each state (50 plus DC) to Async allowed, Video only or Conditional, with a note, plus a "first visit must be video" rule.', passes: 'A new patient in a state with the first-visit rule gets a video visit, and the reason names the rule.', step: 'first-visit' },
    { n: 3, title: 'Exam rules', text: 'Each exam can or can\'t run async, with exceptions by state, and can override the Qualiphy standard time to 1099.', passes: 'An exam blocked in a state is video there, even when the state allows async. An exam with its own time to 1099 uses it instead of the standard.', step: 'exams' },
    { n: 4, title: 'Clinic control', text: 'Clinic Settings hold a default visit type and whether patients can choose. Each invite offers Async review or Video visit when the rules allow it.', passes: 'The clinic can pick video on any invite, but can\'t pick async where the rules say video.', step: 'clinic-settings' },
    { n: 5, title: 'Patient choice', text: 'When the clinic allows it, the patient can switch to the other visit type. Async is the primary button.', passes: 'A video invite can be submitted for review instead, an async exam can switch to video, and the choice is recorded.', step: 'patient-choice' },
    { n: 6, title: 'Control and log', text: 'Only the Async admin role changes the rules, and every change records who, when, and the old and new value.', passes: 'Each change shows in the log.', step: 'log' },
    { n: 7, title: 'Channels', text: 'Clinic-portal invites first. API modes are designed now: force_sync, force_async and patient_choice.', passes: 'An API invite follows its mode within the rules. Quidget and Connect Instantly behave as today.', step: 'channels' },
    { n: 8, title: 'Audit', text: 'Each exam stores its visit type, the reason, and the clinic\'s and patient\'s choices.', passes: 'Any exam can be audited for why it was async or video.', step: 'provider-review' },
    { n: 9, title: 'After the exam', text: 'The last screen says the exam is complete, with no rating step on async. Coming back to the link shows the status only.', passes: 'Revisiting the link shows under review, approved, or contact your clinic, and nothing identifying.', step: 'patient-status' },
    { n: 10, title: 'Launch assets', text: 'Docs for Support, MedOps and providers; a note for pilot clinics; invite email and SMS that fit an async visit.', passes: 'All approved before the pilot.', step: 'invite-send' },
  ];

  D.PRD.pilot = [
    ['Before', 'Decisions answered, launch assets ready, both bugs checked (question 11), baselines measured, and pilot clinics told what their patients will see.'],
    ['Start', 'Compliance sets the pilot states and exam rules, and the 3 pilot clinics join the rollout. Product and Compliance review every decision in week one.'],
    ['Grow', 'Add clinics to the rollout each week while the full-time queue keeps up.'],
  ];

  D.PRD.success = [
    ['Async exams where the rules say video', 'Zero'],
    ['Invites with a stored visit type and reason', 'All'],
    ['Converted exams done by full-time providers', 'Most'],
    ['Full-time async queue wait', 'No worse than the two weeks before the pilot'],
    ['Converted exams deferred, denied or escalated', 'No higher than the same exams on video'],
    ['Exams converted', 'Counted by clinic pick and by patient choice'],
    ['Patients choosing the other visit type, and complaints', 'Tracked; each complaint reviewed'],
  ];

  D.PRD.risks = [
    ['Full-time providers can\'t keep up, so converted work goes to 1099 providers and saves nothing', 'Full-time first (question 1), and grow the rollout only while their queue keeps up'],
    ['Clinics set everything to video, so little converts', 'The default is async review; Product reviews clinic picks in week one'],
    ['A converted exam doesn\'t collect enough for an async review, so providers defer it', 'Only async-ready exams can run async (question 8)'],
    ['State rules change', 'Compliance keeps states current; the log shows who changed what'],
  ];

  D.PRD.later = [
    ['API invites with modes', 'After API docs, a sandbox and notice to partners. Settle async pricing first.'],
    ['Quidget and Connect Instantly', 'Likely to follow the clinic\'s settings.'],
    ['Retire today\'s async copies', 'Once API invites convert.'],
    ['Provider convert', 'A provider can switch an async exam to video, with a reason.'],
    ['Automatic moves', 'Open exams move when a state is switched off.'],
    ['Status page with tracking', 'Shipment tracking on the exam link needs identity checks first.'],
    ['Also later', 'Async pricing, automatic condition checks, and rules by provider credential.'],
  ];

  D.PRD.refs = [];
  D.PRD.sources = '';
})();
