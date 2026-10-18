"""Build onet.js: O*NET data for each Bearing job.

Usage:
  python3 tools/onet/build_onet.py <O*NET 31.0 CSV folder> <O*NET 30.2 'Work Values.txt'> > onet.js

Downloads (CC BY 4.0, USDOL/ETA):
  https://www.onetcenter.org/dl_files/database/db_31_0_csv.zip
  https://www.onetcenter.org/dl_files/database/db_30_2_text/Work%20Values.txt

What it writes per job:
  ri   interests [R,I,A,S,E,C], 1-7 (O*NET 31.0 career_interest_types, OI scale)
  z    job zone 1-5 (job_zones)
  v    work values [achievement, independence, recognition, relationships, support,
       working conditions], 1-7 (O*NET 30.2 work values, EX scale; dropped from O*NET after 30.2).
       If an occupation has none, borrowed from its most related occupation that does (vsrc).
  c    working conditions in Bearing's COND order, -2..2: each is the occupation's percentile
       among all O*NET occupations on the listed work-context items, rescaled ((pct - 0.5) * 4).
  wfh  share of the matched occupations that can be done from home under Dingel & Neiman (2020)
       rules, applied to O*NET 31.0 (1 = yes, 0 = no, 0.5 = a blend of both).
Blends (tuples in mapping.py) and the '25-10xx' average take the mean of their occupations.
"""
import csv, json, sys, os
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))
from mapping import M, RATER

D, WV = sys.argv[1], sys.argv[2]
ORDER = 'RIASEC'
csvr = lambda name: csv.DictReader(open(os.path.join(D, name), encoding='utf-8'))

occ = {r['O*NET-SOC Code']: r['Title'] for r in csvr('occupation_data.csv')}
ri = defaultdict(dict)
for r in csvr('career_interest_types.csv'):
    if r['Scale ID'] == 'OI':
        ri[r['O*NET-SOC Code']][r['Element Name'][0]] = float(r['Data Value'])
jz = {r['O*NET-SOC Code']: int(r['Job Zone']) for r in csvr('job_zones.csv')}
wv = defaultdict(dict)
for r in csv.DictReader(open(WV, encoding='utf-8'), delimiter='\t'):
    if r['Scale ID'] == 'EX':
        wv[r['O*NET-SOC Code']][r['Element Name']] = float(r['Data Value'])
related = defaultdict(list)
for r in csvr('related_occupations.csv'):
    related[r['O*NET-SOC Code']].append(r['Related O*NET-SOC Code'])

cx, cxp = defaultdict(dict), defaultdict(dict)  # work context means, and category percentages
for r in csvr('work_context.csv'):
    if r['Scale ID'] == 'CX':
        cx[r['O*NET-SOC Code']][r['Element ID']] = float(r['Data Value'])
    elif r['Scale ID'] == 'CXP':
        cxp[r['O*NET-SOC Code']][(r['Element ID'], r['Category'])] = float(r['Data Value'])
im = defaultdict(dict)  # work activity importance
for r in csvr('work_activities.csv'):
    if r['Scale ID'] == 'IM':
        im[r['O*NET-SOC Code']][r['Element ID']] = float(r['Data Value'])

# Bearing's working conditions, each from one or two O*NET work-context items (-1 = reversed).
COND = {
    'var':  [('4.C.3.b.7', -1)],                          # importance of repeating the same tasks, reversed
    'ppl':  [('4.C.1.a.4', 1), ('4.C.1.b.1.e', 1)],       # contact with others; work in a group or team
    'out':  [('4.C.2.a.1.c', 1)],                         # outdoors, exposed to all weather
    'aut':  [('4.C.3.a.4', 1), ('4.C.3.b.8', 1)],         # freedom to make decisions; set own tasks and goals
    'stk':  [('4.C.3.a.1', 1), ('4.C.3.d.1', 1)],         # consequence of error; time pressure
    'vis':  [('4.C.1.b.1.f', 1), ('4.C.1.a.2.c', 1)],     # deal with the public; public speaking
    'phys': [('4.C.2.d.1.a', -1), ('4.C.2.d.1.b', 1)],    # time sitting, reversed; time standing
}
pct = {}
for items in COND.values():
    for el, _ in items:
        vals = sorted(v[el] for v in cx.values() if el in v)
        pct[el] = lambda x, vals=vals: (sum(1 for y in vals if y < x) + 0.5 * sum(1 for y in vals if y == x)) / len(vals)

def conditions(code):
    out = []
    for k, items in COND.items():
        ps = [(pct[el](cx[code][el]) if s > 0 else 1 - pct[el](cx[code][el])) for el, s in items if el in cx[code]]
        if not ps:
            return None
        out.append(round((sum(ps) / len(ps) - 0.5) * 4, 1))
    return out

# Dingel & Neiman (2020), "How many jobs can be done at home?": an occupation cannot be done
# at home if any of these hold.
def can_wfh(code):
    c, p, a = cx[code], cxp[code], im[code]
    if not c or not a:
        return None
    majority_daily = lambda el: p.get((el, '5'), 0) > 50
    rules = [
        c.get('4.C.1.a.2.h', 5) < 3,                          # email less than once a month
        c.get('4.C.1.d.3', 0) >= 4,                           # violent people at least weekly
        majority_daily('4.C.2.a.1.c') or majority_daily('4.C.2.a.1.d'),  # outdoors every day
        c.get('4.C.2.c.1.b', 0) >= 4,                         # disease or infection at least weekly
        c.get('4.C.2.c.1.f', 0) >= 4,                         # minor burns, cuts, bites or stings at least weekly
        c.get('4.C.2.d.1.d', 0) >= 4,                         # majority of time walking or running
        c.get('4.C.2.e.1.d', 0) >= 4 or c.get('4.C.2.e.1.e', 0) >= 4,  # majority of time in protective equipment
    ] + [a.get(el, 0) >= 4 for el in (
        '4.A.3.a.1',   # performing general physical activities
        '4.A.3.a.2',   # handling and moving objects
        '4.A.3.a.3',   # controlling machines and processes
        '4.A.3.a.4',   # operating vehicles, mechanized devices or equipment
        '4.A.4.a.8',   # performing for or working directly with the public
        '4.A.3.b.4',   # repairing and maintaining mechanical equipment
        '4.A.3.b.5',   # repairing and maintaining electronic equipment
        '4.A.1.b.2',   # inspecting equipment, structures or materials
    )]
    return 0 if any(rules) else 1

VALUE_NAMES = ['Achievement', 'Independence', 'Recognition', 'Relationships', 'Support', 'Working Conditions']
mean = lambda xs: sum(xs) / len(xs)

def one(code):
    """All data for one O*NET occupation (values may be borrowed)."""
    d = {}
    if code in ri:
        d['ri'] = [ri[code][t] for t in ORDER]
    d['z'] = jz.get(code)
    src = code if code in wv else next((r for r in related.get(code, []) if r in wv), None)
    d['v'] = [wv[src][n] for n in VALUE_NAMES] if src else None
    d['vsrc'] = None if src == code else (f'{src} {occ.get(src, "")}' if src else None)
    csrc = code if cx.get(code) and im.get(code) else next((r for r in related.get(code, []) if cx.get(r) and im.get(r)), None)
    d['c'] = conditions(csrc) if csrc else None
    d['wfh'] = can_wfh(csrc) if csrc else None
    if csrc and csrc != code:
        d['csrc'] = f'{csrc} {occ.get(csrc, "")}'
    return d

def combine(codes):
    parts = [one(c) for c in codes]
    out = {}
    for k in ('ri', 'v', 'c'):
        xs = [p[k] for p in parts if p.get(k)]
        out[k] = [round(mean(col), 2) for col in zip(*xs)] if xs else None
    zs = [p['z'] for p in parts if p['z']]
    out['z'] = round(mean(zs)) if zs else None
    ws = [p['wfh'] for p in parts if p['wfh'] is not None]
    out['wfh'] = round(mean(ws), 2) if ws else None
    out['vsrc'] = None
    return out

entries = {}
for title, (code, fit) in M.items():
    if code is None:
        r = RATER[title]
        entries[title] = {'soc': None, 'fit': fit, 'ri': r['ri'], 'z': r['z'], 'v': r['v'], 'c': r['c'], 'wfh': r['wfh'], 'src': r['src']}
        continue
    codes = list(code) if isinstance(code, tuple) else [c for c in ri if c.startswith('25-10')] if code == '25-10xx' else [code]
    d = combine(codes) if len(codes) > 1 else one(codes[0])
    e = {'soc': ' + '.join(code) if isinstance(code, tuple) else code, 'fit': fit}
    if d.get('ri'): e['ri'] = [round(x, 2) for x in d['ri']]
    if d.get('z'): e['z'] = d['z']
    if d.get('v'): e['v'] = [round(x, 2) for x in d['v']]
    if d.get('vsrc'): e['vsrc'] = d['vsrc']
    if d.get('c'): e['c'] = d['c']
    if d.get('wfh') is not None: e['wfh'] = d['wfh']
    if d.get('csrc'): e['csrc'] = d['csrc']
    entries[title] = e

print('''/* Job data from O*NET, matched by hand to Bearing's Australian jobs. Generated by tools/onet/build_onet.py.
   Source: O*NET 31.0 Database (August 2026): interests (1-7), job zones (1-5), work context and work activities;
   O*NET 30.2 Database (February 2026): work values (1-7), last published there, dated 2008-2020.
   U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), used under CC BY 4.0.
   Work from home: rules of Dingel & Neiman (2020), "How many jobs can be done at home?", applied to O*NET 31.0.
   Bearing matched and blended these occupations; USDOL/ETA has not approved, endorsed or tested these changes.
   soc = O*NET-SOC code (or blend); fit = good | close | loose | rater (no O*NET data, see src);
   ri = interests [R,I,A,S,E,C]; z = job zone; v = work values [achievement, independence, recognition,
   relationships, support, working conditions]; vsrc = values borrowed from this related occupation;
   c = working conditions in COND order, -2..2 (percentile among O*NET occupations); wfh = can be done from home (0-1);
   csrc = conditions borrowed from this related occupation. */
const ONET = {''')
print(',\n'.join('  ' + json.dumps(t) + ': ' + json.dumps(e, separators=(',', ':')) for t, e in entries.items()))
print('''};

/* Use O*NET's data for each job; keep the old hand-set code as code0. */
JOBS.forEach(j => {
  const o = ONET[j.t]; if (!o) return;
  j.soc = o.soc; j.fit = o.fit; j.zone = o.z || null; j.values = o.v || null;
  j.wfh = (o.wfh === undefined) ? null : o.wfh;
  if (o.c) j.c = o.c;
  if (!o.ri) return;
  j.ri = { R:o.ri[0], I:o.ri[1], A:o.ri[2], S:o.ri[3], E:o.ri[4], C:o.ri[5] };
  j.code0 = j.code;
  // A close or loose match is a stand-in for the real job, so its interests are blended with the hand-set
  // code (close: half each; loose: three quarters hand-set). Both are standardised first, then put back
  // on O*NET's 1-7 scale.
  const wh = { close: 0.5, loose: 0.75 }[o.fit] || 0;
  if (wh) {
    const K = 'RIASEC'.split(''), hand = {}; K.forEach(t => hand[t] = 0); [3, 2, 1].forEach((w, i) => { if (j.code0[i]) hand[j.code0[i]] = w; });
    const st = v => { const xs = K.map(t => v[t]), m = xs.reduce((a, b) => a + b) / 6, sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / 6) || 1; return { m, sd, z: xs.map(x => (x - m) / sd) }; };
    const a = st(j.ri), h = st(hand);
    j.riOnet = j.ri; j.ri = {}; K.forEach((t, i) => j.ri[t] = +(a.m + a.sd * ((1 - wh) * a.z[i] + wh * h.z[i])).toFixed(2));
  }
  j.code = Object.keys(j.ri).sort((a, b) => j.ri[b] - j.ri[a]).slice(0, 3).join('');
});''')
