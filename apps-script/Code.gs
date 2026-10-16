/**
 * Bearing feedback receiver.
 * Paste into Extensions > Apps Script of a new Google Sheet, run setup() once,
 * then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 */

const SHEET = 'Responses';
const MAX_BYTES = 30000;       // ignore anything bigger than a real submission
const MAX_PER_MINUTE = 30;     // simple flood guard across all senders

const HEADERS = [
  'received_at', 'id', 'version', 'fit', 'useful', 'explore', 'comment', 'age', 'state',
  'answers_included', 'direction', 'bearing', 'lean',
  'R', 'I', 'A', 'S', 'E', 'C',
  'social_energy', 'warmth', 'order', 'steadiness', 'curiosity',
  'tier_S', 'tier_A', 'refined', 'friends_added', 'history_used', 'answers_json'
];

const ALLOWED = {
  fit: ['spot', 'mostly', 'partly', 'no'],
  useful: ['new', 'confirmed', 'not'],
  age: ['16–17', '18–24', '25–34', '35–44', '45–54', '55+'],
  state: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'Outside Australia']
};

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > MAX_BYTES) return reply_({ ok: false, error: 'size' });
    if (!underRateLimit_()) return reply_({ ok: false, error: 'busy' });

    const d = JSON.parse(raw);
    const id = String(d.id || '');
    if (!/^B-[A-Z0-9]{6,12}$/.test(id)) return reply_({ ok: false, error: 'id' });
    if (ALLOWED.fit.indexOf(d.fit) < 0) return reply_({ ok: false, error: 'fit' });

    const a = d.answers && typeof d.answers === 'object' ? d.answers : null;
    const num = x => (typeof x === 'number' && isFinite(x)) ? x : '';
    const pick = (v, list) => list.indexOf(v) >= 0 ? v : '';
    const clean = s => String(s || '').replace(/[\u0000-\u001f]/g, ' ').replace(/^[=+\-@]/, "'$&").slice(0, 500);
    const list = (arr, n) => Array.isArray(arr) ? arr.slice(0, n).map(x => clean(x).slice(0, 60)).join('; ') : '';

    const row = [
      new Date(), id, clean(d.v).slice(0, 10), d.fit, pick(d.useful, ALLOWED.useful), list(d.explore, 25),
      clean(d.comment), pick(d.age, ALLOWED.age), pick(d.state, ALLOWED.state),
      a ? 'yes' : 'no',
      a ? clean(a.direction).slice(0, 4) : '', a ? num(a.bearing) : '', a ? num(a.lean) : '',
      ...['R', 'I', 'A', 'S', 'E', 'C'].map(t => a && a.interests ? num(a.interests[t]) : ''),
      ...['ex', 'wa', 'or', 'st', 'cu'].map(k => a && a.traits ? num(a.traits[k]) : ''),
      a && a.tiers ? list(a.tiers.S, 10) : '', a && a.tiers ? list(a.tiers.A, 25) : '',
      a ? (a.refine ? 'yes' : 'no') : '', a ? num(a.friends_added) : '', a ? (a.history_used ? 'yes' : 'no') : '',
      a ? JSON.stringify(a).slice(0, 45000) : ''
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try { sheet_().appendRow(row); } finally { lock.releaseLock(); }
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: 'bad request' });
  }
}

/** Run once from the editor: creates the Responses tab with headers and a Summary tab. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = sheet_();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);

  let sum = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  sum.clear();
  const r = `${SHEET}!`;
  const rows = [
    ['Bearing feedback summary', ''],
    ['Total responses', `=COUNTA(${r}B2:B)`],
    ['With anonymous answers', `=COUNTIF(${r}J2:J,"yes")`],
    ['', ''],
    ['Did the direction feel like you?', 'Count'],
    ['Spot on', `=COUNTIF(${r}D2:D,"spot")`],
    ['Mostly', `=COUNTIF(${r}D2:D,"mostly")`],
    ['Partly', `=COUNTIF(${r}D2:D,"partly")`],
    ['Not at all', `=COUNTIF(${r}D2:D,"no")`],
    ['Hit rate (spot on + mostly)', `=IFERROR((B6+B7)/B2,"")`],
    ['', ''],
    ['Were the jobs useful?', 'Count'],
    ['Gave me new ideas', `=COUNTIF(${r}E2:E,"new")`],
    ['Confirmed what I thought', `=COUNTIF(${r}E2:E,"confirmed")`],
    ['Not useful', `=COUNTIF(${r}E2:E,"not")`],
    ['', ''],
  ];
  sum.getRange(1, 1, rows.length, 2).setValues(rows);
  // Hit rate by direction (only rows that included anonymous answers have a direction)
  const dirs = ['RI','RA','RS','RE','RC','IA','IS','IE','IC','AS','AE','AC','SE','SC','EC','ALL'];
  const start = rows.length + 2;
  sum.getRange(start, 1, 1, 4).setValues([['Hit rate by direction', 'Responses', 'Spot on or mostly', 'Hit rate']]).setFontWeight('bold');
  dirs.forEach((k, i) => {
    const n = start + 1 + i;
    sum.getRange(n, 1, 1, 4).setValues([[k,
      `=COUNTIF(${r}K2:K,A${n})`,
      `=COUNTIFS(${r}K2:K,A${n},${r}D2:D,"spot")+COUNTIFS(${r}K2:K,A${n},${r}D2:D,"mostly")`,
      `=IFERROR(C${n}/B${n},"")`]]);
    sum.getRange(n, 4).setNumberFormat('0%');
  });
  sum.getRange('A1').setFontWeight('bold').setFontSize(14);
  [5, 12].forEach(i => sum.getRange(i, 1, 1, 2).setFontWeight('bold'));
  sum.getRange('B10').setNumberFormat('0%');
  sum.autoResizeColumn(1);
}

/** Delete a submission when someone asks: set the ID below, then run it from the editor. */
function deleteSubmission() {
  const ID = 'B-XXXXXXXXXX';   // <- paste the ID here
  const sh = sheet_();
  const ids = sh.getRange(2, 2, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (ids[i][0] === ID) { sh.deleteRow(i + 2); Logger.log('Deleted ' + ID); return; }
  }
  Logger.log('No submission with ID ' + ID);
}

/** Visiting the web app address in a browser shows this, so you can check it's live. */
function doGet() {
  return ContentService.createTextOutput('Bearing feedback receiver is running.');
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function underRateLimit_() {
  const cache = CacheService.getScriptCache();
  const key = 'rate_' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(key) || 0);
  if (n >= MAX_PER_MINUTE) return false;
  cache.put(key, String(n + 1), 120);
  return true;
}
