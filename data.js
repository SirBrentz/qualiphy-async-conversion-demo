/* Async conversion demo: data.
   Demo data (state settings, exams, clinics, patients, providers, invite copy) is illustrative.
   The PRD block mirrors "PRD: Async Conversion", Draft v0.17, Sep 23, 2026. */
(function () {
  const D = (window.DEMO = {});

  D.META = { prd: 'Draft v0.17', prdDate: 'Sep 23, 2026', owner: 'Product' };

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
     Every other state starts "Not reviewed", which stays video under question 3's default. */
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
  };

  /* Labels match the clinic portal's Invite Patient page. */
  D.CONSULT_TYPES = [
    { id: 'gfe', label: 'Good Faith Exam & Orders' },
    { id: 'rx', label: 'QualiphyRx Packages: Consultation + Medication Delivery Made Easy' },
    { id: 'urgent', label: 'Urgent Care Visit: Consultation + Prescription Sent to Your Pharmacy' },
    { id: 'pharmacy', label: 'Choose Your Pharmacy (Consultation and Prescription Only)' },
  ];

  /* Illustrative exam catalog. visit: 'follow-up' or 'first'. ready = has what async review needs. */
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
  ];

  /* Demo clinics. asyncToday = the clinic already uses async today. */
  D.CLINICS = [
    { id: 'mock', name: 'Mock Wellness Clinic', you: true, pilot: true, asyncToday: false },
    { id: 'ex-aes', name: 'Example Aesthetics', pilot: false, asyncToday: true },
    { id: 'ex-iv', name: 'Example IV Lounge', pilot: false, asyncToday: true },
    { id: 'ex-wl', name: 'Example Weight Clinic', pilot: false, asyncToday: true },
    { id: 'ex-spa', name: 'Example Med Spa', pilot: false, asyncToday: false },
  ];
  D.PILOT_CLINICS = [];

  D.PATIENTS = [
    { first: 'Alex', last: 'Morgan', email: 'alex.morgan@example.com', phone: '(202) 555-0148', state: 'AZ', returning: true, lastVisit: 'Jun 2, 2026', tag: 'Arizona, returning' },
    { first: 'Priya', last: 'Natarajan', email: 'priya.n@example.com', phone: '(415) 555-0162', state: 'CA', returning: true, lastVisit: 'Jul 14, 2026', tag: 'California, returning' },
    { first: 'Daniel', last: 'Okafor', email: 'daniel.okafor@example.com', phone: '(512) 555-0199', state: 'TX', returning: false, lastVisit: '', tag: 'Texas, new patient' },
    { first: 'Maya', last: 'Brennan', email: 'maya.b@example.com', phone: '(717) 555-0107', state: 'PA', returning: true, lastVisit: 'Aug 20, 2026', tag: 'Pennsylvania, returning' },
  ];

  D.PROVIDERS = {
    ft: { name: 'Dr. Jordan Lee', kind: 'Full-time provider' },
    c1099: { name: 'Dr. Sam Rivera', kind: '1099 provider' },
  };

  D.DOSES = ['Semaglutide 0.25 mg weekly', 'Semaglutide 0.5 mg weekly', 'Semaglutide 1 mg weekly', 'Semaglutide 1.7 mg weekly', 'Semaglutide 2.4 mg weekly', 'Tirzepatide 2.5 mg weekly', 'Tirzepatide 5 mg weekly', 'Tirzepatide 7.5 mg weekly'];

  /* ---------------------------------------------------------------- PRD (public share build)
     Same structure as the private PRD block in v1/data.js, with customer names, volumes, savings
     figures, ticket keys and colleague names removed. Edit both when the PRD changes. */
  D.PRD = {};

  D.PRD.summary = [
    ['Goal', 'Convert an exam from a video visit to async review when the rules allow it. Same exam, no separate async copies.'],
    ['Why', 'A full-time provider reviewing an exam async costs less than a 1099 provider on video.'],
    ['How', 'SuperAdmins switch on exams, states and clinics. An invite goes async only when all three are on; otherwise it\'s a video visit. The patient can always choose video.'],
    ['First release', 'Clinic-portal invites for weight-loss follow-up exams, piloted at 3 clinics.'],
    ['Later', 'Returning patients on any exam, API invites, and retiring today\'s async copies.'],
    ['Build', 'To be confirmed by Engineering (questions 6 and 8).'],
    ['Status', 'Discovery. Waiting on the decisions.'],
  ];

  D.PRD.how = [
    ['Who changes the switches', 'Only a few SuperAdmins, run by Compliance at first. Clinics can\'t turn async on, because state rules decide where async is allowed.'],
    ['Patient choice', 'The patient can always choose a video visit instead.'],
    ['Same exam', 'A converted exam is not a copy. Providers work it like any async exam today.'],
    ['Which exams', 'Only exams used for follow-ups, so first visits stay on video. Exams that can lead to a controlled-substance prescription stay video unless General Counsel clears them.'],
    ['Which states', 'Conditional states count as video for now. A state change applies to new invites at once; open async exams in a state switched off are moved by hand.'],
    ['Which invites', 'Clinic-portal invites only. API, Quidget and Connect Instantly invites don\'t change yet.'],
  ];

  D.PRD.whoSees = [
    ['SuperAdmin', 'Async Compliance Hub', 'State map and list, exam and clinic switches, change log', 'states'],
    ['Clinic staff', 'Send invite', 'Async review or Video visit, and why', 'invite-async'],
    ['Patient', 'Async intake', 'A clear option to choose a video visit instead', 'patient-welcome'],
    ['Provider (shown in the demo)', 'Asynchronous Exam queue', 'Converted exams, full-time providers first (question 2)', 'provider-ft'],
  ];

  D.PRD.decisions = [
    { n: 1, who: 'Leadership', key: 'q1',
      q: 'Start with follow-up exams on portal invites, or also convert returning patients now?',
      why: 'Most returning patients come back on their first-visit exam, so that is where most of the saving is. Converting them needs a first-visit check, which relies on patient matching and Clinical sign-off.',
      def: 'Start small, add returning patients next',
      opts: [{ v: 'small', label: 'Start small' }, { v: 'returning', label: 'Add returning patients now' }],
      effect: { small: 'Only follow-up exams can be switched on. First visits stay video.', returning: 'The first-visit weight-loss exam can be switched on too, and a returning-patient check joins the three checks. New patients stay video.' } },
    { n: 2, who: 'Leadership', key: 'q2',
      q: 'Should converted exams go to full-time providers first, even if patients wait a little longer?',
      why: 'A converted exam only saves money when a full-time provider does it. Async Access Settings in SuperAdmin already control when 1099 providers see async exams.',
      def: 'Yes',
      opts: [{ v: 'yes', label: 'Yes' }, { v: 'no', label: 'No' }],
      effect: { yes: '1099 providers see a converted exam only after the hold in Async Access Settings.', no: 'Converted exams show to every provider at once.' } },
    { n: 3, who: 'Leadership', key: 'q3',
      q: 'At go-live, do states start off (Compliance turns on the ones it has reviewed) or on (Compliance turns off the ones that don\'t allow async)?',
      why: 'Starting off means an unreviewed state never goes async by mistake. Starting all on was also floated.',
      def: 'Off',
      opts: [{ v: 'off', label: 'Off' }, { v: 'on', label: 'On' }],
      effect: { off: 'States nobody has reviewed stay video.', on: 'States nobody has reviewed allow async until Compliance switches them off.' } },
    { n: 4, who: 'Leadership', key: 'q4',
      q: 'Can clinics send an invite as video instead? The original brief lets clinics move an exam toward video, never toward async.',
      why: 'No legal risk, but clinics aren\'t sold on async yet, so it could undo part of the saving. The patient can choose video either way.',
      def: 'No',
      opts: [{ v: 'no', label: 'No' }, { v: 'yes', label: 'Yes' }],
      effect: { no: 'The invite shows the visit type with no control to change it.', yes: 'When an invite would be async, the clinic gets a "Send as a video visit instead" option.' } },
    { n: 5, who: 'Leadership', key: 'q5',
      q: 'Keep today\'s separate async copies of exams until API invites convert, or retire them at launch?',
      why: 'The goal is no copies, but API partners still send exams to those copies.',
      def: 'Keep for now',
      opts: [{ v: 'keep', label: 'Keep for now' }, { v: 'retire', label: 'Retire at launch' }],
      effect: { keep: 'The demo\'s async copy stays in the exam list and runs async as it does today.', retire: 'The async copy leaves the invite list.' } },
    { n: 6, who: 'Engineering', key: 'q6',
      q: 'How do we run one exam as either a video visit or async review, decided per invite, with no separate copy? What must an exam have before it can be switched on (for example, async questions)?',
      why: 'The core ask. It sets the build size, and what each exam needs before it goes async.',
      def: 'Needs an answer',
      info: 'The demo marks each exam Async-ready or not. Only ready exams can be switched on.' },
    { n: 7, who: 'Engineering', key: 'q7',
      q: 'Can the clinic switch reuse the existing async setting?',
      why: 'Clinics already using async have it on, so reusing it would switch all of them on at once.',
      def: 'A separate switch',
      opts: [{ v: 'separate', label: 'A separate switch' }, { v: 'reuse', label: 'Reuse the existing setting' }],
      effect: { separate: 'Each clinic has its own conversion switch, off by default.', reuse: 'The clinic switch is the existing async setting, so every clinic already using async is switched on at once.' } },
    { n: 8, who: 'Engineering', key: 'q8',
      q: 'What date can this reach staging, with a third of each sprint on features?',
      why: 'Gives leadership a real date.',
      def: 'Needs an answer',
      info: 'Not shown in the demo.' },
    { n: 9, who: 'Engineering', key: 'q9',
      q: 'Are the two known async bugs fixed for portal exams before the pilot?',
      why: 'Converted exams are async exams, so both bugs would hit pilot clinics.',
      def: 'Fix both first',
      info: 'On the pilot checklist in the hub\'s Pilot tab.' },
    { n: 10, who: 'Legal', key: 'q10',
      q: 'If the patient\'s state on the invite differs from where they are during the exam, which state\'s rules apply?',
      why: 'The rules decide by state. If location during the exam governs, the async intake must ask where the patient is.',
      def: 'The invite\'s state',
      opts: [{ v: 'invite', label: 'The invite\'s state' }, { v: 'location', label: 'Where the patient is' }],
      effect: { invite: 'The state on the invite decides.', location: 'The async intake asks where the patient is. A state that doesn\'t allow async turns the exam into a video visit.' } },
    { n: 11, who: 'Legal', key: 'q11',
      q: 'Is today\'s async consent enough for converted exams, or do they need their own disclosure (why it\'s async, and that video is available)?',
      why: 'Whatever is required goes into the async intake before the pilot.',
      def: 'Needs an answer',
      opts: [{ v: 'pending', label: 'Today\'s consent' }, { v: 'own', label: 'Own disclosure' }],
      effect: { pending: 'The intake shows today\'s consent, marked as waiting on question 11.', own: 'The intake shows a short disclosure the patient acknowledges before starting.' } },
  ];

  D.PRD.numbers = [];
  D.PRD.numberNotes = [];

  D.PRD.requirements = [
    { n: 1, title: 'One exam, either way', text: 'A switched-on exam runs as async review with no separate async copy.', passes: 'The same exam runs async when all three checks pass, and as video when any fails.', step: 'invite-video' },
    { n: 2, title: 'States', text: 'SuperAdmin sets each state (50 plus DC) to Async allowed, Video only or Conditional, with a note.', passes: 'With the exam and clinic on, an Arizona invite is async only when Arizona is Async allowed, and the reason names Arizona.', step: 'states' },
    { n: 3, title: 'Switches', text: 'Each exam and each clinic has an async switch, off by default.', passes: 'With either switch off, invites are video in every state.', step: 'exams' },
    { n: 4, title: 'Control and log', text: 'Only SuperAdmin changes switches, and every change records who, when, and the old and new value.', passes: 'Nothing in the clinic portal can change async, and each change shows in the log.', step: 'log' },
    { n: 5, title: 'Portal only', text: 'Only clinic-portal invites are checked.', passes: 'API, Quidget and Connect Instantly invites behave as today.', step: 'channels' },
    { n: 6, title: 'Clinic sees why', text: 'The invite shows the visit type and the reason before sending.', passes: 'Staff see Async review or Video visit, with the reason.', step: 'invite-async' },
    { n: 7, title: 'Patient choice', text: 'The patient can choose video before submitting.', passes: 'The exam becomes a video visit and the choice is recorded.', step: 'patient-welcome' },
    { n: 8, title: 'Audit', text: 'Each exam stores its visit type and reason.', passes: 'Any exam can be audited for why it was async or video.', step: 'provider-review' },
    { n: 9, title: 'Launch assets', text: 'Docs for Support, MedOps and providers; a note for pilot clinics; invite email and SMS that fit an async visit.', passes: 'All approved before the pilot.', step: 'invite-send' },
  ];

  D.PRD.pilot = [
    ['Before', 'Decisions answered, launch assets ready, both bugs checked (question 9), baselines measured, and pilot clinics told what their patients will see.'],
    ['Start', 'Compliance switches on the pilot states, the weight-loss follow-up exams, and 3 portal clinics. Product and Compliance review every decision in week one.'],
    ['Grow', 'Add clinics each week while the full-time queue keeps up.'],
  ];

  D.PRD.success = [
    ['Async exams in Video only or Conditional states', 'Zero'],
    ['Invites with a stored visit type and reason', 'All'],
    ['Converted exams done by full-time providers', 'Most'],
    ['Full-time async queue wait', 'No worse than the two weeks before the pilot'],
    ['Converted exams deferred, denied or escalated', 'No higher than the same exams on video'],
    ['Exams converted', 'A monthly target set before the pilot'],
    ['Patients choosing video, and complaints', 'Tracked; each complaint reviewed'],
  ];

  D.PRD.risks = [
    ['Full-time providers can\'t keep up, so converted work goes to 1099 providers and saves nothing', 'Full-time first (question 2), and grow only while their queue keeps up'],
    ['A converted exam doesn\'t collect enough for an async review, so providers defer it', 'Switch an exam on only once it has what async review needs (question 6)'],
    ['The first release saves little on its own', 'Treat it as the proof; returning patients and API invites come next'],
    ['State rules change', 'Compliance keeps states current; the log shows who changed what'],
  ];

  D.PRD.later = [
    ['Returning patients on any exam', 'Needs a first-visit check once patient matching is fixed and Clinical signs off.'],
    ['API and Quidget invites', 'After API docs, a sandbox and notice to partners. Settle async pricing first.'],
    ['Retire today\'s async copies', 'Once API invites convert.'],
    ['Provider convert', 'A provider can switch an async exam to video, with a reason.'],
    ['Automatic moves', 'Open exams move when a state is switched off.'],
    ['Also later', 'Async pricing, automatic condition checks, and rules by provider credential.'],
  ];

  D.PRD.refs = [];
  D.PRD.sources = '';
})();
