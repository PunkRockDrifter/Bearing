/* ===== Bearing: question bank and occupation data ===== */
const TYPES = {
  R: { name: 'Maker',        blurb: 'hands, tools and physical results',      deg: 0 },
  I: { name: 'Investigator', blurb: 'working out why things are the way they are', deg: 60 },
  A: { name: 'Creator',      blurb: 'making something original',              deg: 120 },
  S: { name: 'Helper',       blurb: 'supporting, teaching and caring for people', deg: 180 },
  E: { name: 'Persuader',    blurb: 'leading, convincing and starting things', deg: 240 },
  C: { name: 'Organiser',    blurb: 'systems, order and getting it exactly right', deg: 300 }
};
const ORDER = ['R','I','A','S','E','C'];

/* Part 1: story questions (adapted from the themes of Savickas's Career Construction Interview) */
const STORIES = [
  { id:'s1', q:'Think of someone you looked up to growing up, real or fictional. What did you admire most about them?',
    none:'No one really comes to mind.',
    opts:{ R:'They could fix or build just about anything.', I:'They always knew the answer, or how to find it.', A:'They saw things differently and created things of their own.',
           S:'They made people feel looked after and understood.', E:'They took charge and made things happen.', C:'They were reliable and organised. You could always count on them.' } },
  { id:'s2', q:'You have a spare half hour to watch or read anything you like. What are you most likely to pick?',
    none:'None of these really appeal.',
    opts:{ R:'Someone restoring an old car, tool or piece of furniture.', I:'How something works, or an unsolved mystery explained.', A:'A musician, artist or chef showing how they create.',
           S:'Someone turning their life around, and the people who helped.', E:'How someone built a business from nothing.', C:'How a busy airport, port or warehouse runs like clockwork.' } },
  { id:'s3', q:'When you choose a film, show or book, which kind of story do you enjoy most?',
    none:'None of these. It depends on my mood.',
    opts:{ R:'Survival: someone getting by with their own hands and skills.', I:'A mystery or investigation, piecing the clues together.', A:'A creative outsider making something only they could make.',
           S:'A mentor or close group changing someone’s life for the better.', E:'An underdog building something big, or a crew pulling off a heist.', C:'A careful plan where every piece falls into place.' } },
  { id:'s4', q:'Which of these would you be most likely to write on a sticky note for yourself?',
    none:'None of these sound like me.',
    opts:{ R:'Get your hands on it and try it.', I:'Question everything.', A:'Make something that wasn’t there before.',
           S:'Leave people better than you found them.', E:'Fortune favours the bold.', C:'A place for everything, and everything in its place.' } },
  { id:'s5', q:'Think back to an early memory, around age five to eight, when you were completely absorbed in something. Which is closest?',
    none:'I can’t remember, or none of these fit.',
    opts:{ R:'Taking something apart, or building things outside.', I:'Watching bugs, collecting things and asking “why?”', A:'Drawing, or making up games, songs and plays.',
           S:'Looking after a younger kid or an animal.', E:'Running the game, or selling something to the neighbours.', C:'Sorting a collection, or lining everything up just right.' } },
  { id:'s6', q:'You have a free Saturday and nobody needs anything from you. By 3pm, what are you most likely doing?',
    none:'Resting and doing nothing much, and loving it.',
    opts:{ R:'Something active or hands-on: sport, a trail, the garden or the shed.', I:'Deep in an article, a documentary or a problem I can’t let go of.', A:'Making something: music, a meal without a recipe, or a sketch.',
           S:'Catching up with friends, or helping a mate move house.', E:'Planning something bigger, or working on a side project.', C:'Sorting out the house, the budget or next week’s plan.' } }
];

/* Part 2: forced choices. Every type meets every other type once. */
const PAIRS = [
  { id:'p1',  a:['R','Rebuild an old motorbike engine until it runs.'], b:['I','Work out why one town floods every summer and the next town doesn’t.'] },
  { id:'p2',  a:['R','Build a timber boat from a set of plans.'], b:['A','Design the poster and the whole look of a local music festival.'] },
  { id:'p3',  a:['R','Plant a thousand native trees on a burnt-out hillside.'], b:['S','Teach an adult to read over a few months.'] },
  { id:'p4',  a:['R','Rig the stage and lights for an outdoor concert.'], b:['E','Talk the council into approving that concert.'] },
  { id:'p5',  a:['R','Fix the fences on a cattle station.'], b:['C','Set up the station’s stock and paddock records so nothing gets lost.'] },
  { id:'p6',  a:['I','Trace the source of a food poisoning outbreak.'], b:['A','Write a short story that wins a local prize.'] },
  { id:'p7',  a:['I','Figure out why the bees vanished from one valley.'], b:['S','Coach an under-12s team through a losing season.'] },
  { id:'p8',  a:['I','Test which of three ideas actually works.'], b:['E','Pitch the winning idea to a room of investors.'] },
  { id:'p9',  a:['I','Decode a 100-year-old handwritten ship’s logbook.'], b:['C','Catalogue a museum archive so anyone can find anything.'] },
  { id:'p10', a:['A','Compose the music for a short film.'], b:['S','Help a family through a really hard week.'] },
  { id:'p11', a:['A','Invent a dish nobody has tasted before.'], b:['E','Turn a struggling café into the busiest one in town.'] },
  { id:'p12', a:['A','Paint a mural on the side of a building.'], b:['C','Build the minute-by-minute schedule for a three-day festival.'] },
  { id:'p13', a:['S','Settle a long-running fight between two neighbours.'], b:['E','Negotiate a better deal out of a stubborn supplier.'] },
  { id:'p14', a:['S','Sit with a nervous patient before their surgery.'], b:['C','Design the checklist that stops surgical mistakes.'] },
  { id:'p15', a:['E','Recruit and lead a crew for a big one-off job.'], b:['C','Keep the books for a small business so it never gets a nasty surprise.'] }
];
const PAIRS_REFINE = [
  { id:'q1',  a:['R','Service a light aircraft.'], b:['I','Predict tomorrow’s storm track from today’s data.'] },
  { id:'q2',  a:['R','Weld a steel gate that will last fifty years.'], b:['A','Photograph a country town for a book.'] },
  { id:'q3',  a:['R','Clear storm-damaged trees after a cyclone.'], b:['S','Help an elderly man get his affairs in order.'] },
  { id:'q4',  a:['R','Fit out a campervan from bare metal.'], b:['E','Sell fifty campervans.'] },
  { id:'q5',  a:['R','Lay a dry-stone wall by hand.'], b:['C','Reconcile a warehouse stock count to the last item.'] },
  { id:'q6',  a:['I','Identify a plant nobody else can name.'], b:['A','Design the look of a new board game.'] },
  { id:'q7',  a:['I','Reconstruct exactly how an accident happened.'], b:['S','Support the person it happened to.'] },
  { id:'q8',  a:['I','Find out why one shop outsells its twin across town.'], b:['E','Run a campaign that changes the result of a local vote.'] },
  { id:'q9',  a:['I','Investigate why a bridge keeps cracking.'], b:['C','Keep the maintenance records that prove it’s safe.'] },
  { id:'q10', a:['A','Choreograph a dance for a school concert.'], b:['S','Mentor an apprentice through their first year.'] },
  { id:'q11', a:['A','Design a shopfront people stop to look at.'], b:['E','Open a market stall and grow it into a shop.'] },
  { id:'q12', a:['A','Style a room for a theatre set.'], b:['C','Plan a road trip with every booking confirmed.'] },
  { id:'q13', a:['S','Run a support group for new parents.'], b:['E','Start a local club and grow it to 200 members.'] },
  { id:'q14', a:['S','Show a newcomer around and introduce them to everyone.'], b:['C','Set up a filing system an office will still use in ten years.'] },
  { id:'q15', a:['E','Close a deal on a handshake.'], b:['C','Read the contract line by line before anyone signs.'] }
];
const FRIEND_PAIRS = ['p1','p3','p5','p6','p8','p10','p12','p13','p15'];

/* Part 2: O*NET Mini Interest Profiler (Mini-IP), 30 items, five per RIASEC type, in the published order
   (Rounds, Ming, Cao, Song & Lewis, 2016). From the O*NET Career Exploration Tools by the U.S. Department of Labor,
   Employment and Training Administration (USDOL/ETA), used under the O*NET Tools Developer License
   (https://www.onetcenter.org/license_tools.html). Bearing changed only spelling (organisation) and layout;
   USDOL/ETA has not approved, endorsed or tested these modifications.
   Answers: 0 strongly dislike, 1 dislike, 2 unsure, 3 like, 4 strongly like; each type sums to 0-20. */
const MINI_IP = [
  { id:'m1', k:'R', t:'Build kitchen cabinets' },
  { id:'m2', k:'I', t:'Develop a new medicine' },
  { id:'m3', k:'A', t:'Write books or plays' },
  { id:'m4', k:'S', t:'Help people with personal or emotional problems' },
  { id:'m5', k:'E', t:'Manage a department within a large company' },
  { id:'m6', k:'C', t:'Install software across computers on a large network' },
  { id:'m7', k:'R', t:'Repair household appliances' },
  { id:'m8', k:'I', t:'Study ways to reduce water pollution' },
  { id:'m9', k:'A', t:'Compose or arrange music' },
  { id:'m10', k:'S', t:'Give career guidance to people' },
  { id:'m11', k:'E', t:'Start your own business' },
  { id:'m12', k:'C', t:'Operate a calculator' },
  { id:'m13', k:'R', t:'Assemble electronic parts' },
  { id:'m14', k:'I', t:'Conduct chemical experiments' },
  { id:'m15', k:'A', t:'Create special effects for movies' },
  { id:'m16', k:'S', t:'Perform rehabilitation therapy' },
  { id:'m17', k:'E', t:'Negotiate business contracts' },
  { id:'m18', k:'C', t:'Keep shipping and receiving records' },
  { id:'m19', k:'R', t:'Drive a truck to deliver packages to offices and homes' },
  { id:'m20', k:'I', t:'Examine blood samples using a microscope' },
  { id:'m21', k:'A', t:'Paint sets for plays' },
  { id:'m22', k:'S', t:'Do volunteer work at a non-profit organisation' },
  { id:'m23', k:'E', t:'Market a new line of clothing' },
  { id:'m24', k:'C', t:'Inventory supplies using a hand-held computer' },
  { id:'m25', k:'R', t:'Test the quality of parts before shipment' },
  { id:'m26', k:'I', t:'Develop a way to better predict the weather' },
  { id:'m27', k:'A', t:'Write scripts for movies or television shows' },
  { id:'m28', k:'S', t:'Teach a high-school class' },
  { id:'m29', k:'E', t:'Sell merchandise at a department store' },
  { id:'m30', k:'C', t:'Stamp, sort, and distribute mail for an organisation' }
];
const MIP_SCALE = ['Strongly dislike','Dislike','Unsure','Like','Strongly like'];

/* Part 3: Mini-IPIP (Donnellan et al., 2006), public-domain items from the International Personality Item Pool.
   Traits shown in plain language: ex social energy, wa warmth, or order, st steadiness, cu curiosity. */
const IPIP = [
  { id:1,  t:'I am the life of the party.', k:'ex', r:0, f:'is the life of the party.' },
  { id:2,  t:'I feel for other people when they’re going through something.', k:'wa', r:0, f:'feels for other people when they’re going through something.' },
  { id:3,  t:'I get chores done right away.', k:'or', r:0 },
  { id:4,  t:'I have frequent mood swings.', k:'st', r:1 },
  { id:5,  t:'I have a vivid imagination.', k:'cu', r:0, f:'has a vivid imagination.' },
  { id:6,  t:'I don’t talk a lot.', k:'ex', r:1 },
  { id:7,  t:'I’m not interested in other people’s problems.', k:'wa', r:1 },
  { id:8,  t:'I often forget to put things back in their proper place.', k:'or', r:1 },
  { id:9,  t:'I am relaxed most of the time.', k:'st', r:0, f:'is relaxed most of the time.' },
  { id:10, t:'I’m not interested in abstract ideas.', k:'cu', r:1, f:'isn’t interested in abstract ideas.' },
  { id:11, t:'I talk to a lot of different people at parties.', k:'ex', r:0 },
  { id:12, t:'I feel other people’s emotions.', k:'wa', r:0 },
  { id:13, t:'I like order.', k:'or', r:0, f:'likes order.' },
  { id:14, t:'I get upset easily.', k:'st', r:1, f:'gets upset easily.' },
  { id:15, t:'I have difficulty understanding abstract ideas.', k:'cu', r:1 },
  { id:16, t:'I keep in the background.', k:'ex', r:1, f:'keeps in the background.' },
  { id:17, t:'I’m not really interested in others.', k:'wa', r:1, f:'isn’t really interested in others.' },
  { id:18, t:'I make a mess of things.', k:'or', r:1, f:'makes a mess of things.' },
  { id:19, t:'I seldom feel blue.', k:'st', r:0 },
  { id:20, t:'I don’t have a good imagination.', k:'cu', r:1 }
];
const TRAITS = {
  ex: { name:'Social energy',          lo:'Recharges alone, prefers fewer, deeper conversations', hi:'Energised by people and a busy room' },
  wa: { name:'Warmth toward others',   lo:'Direct and task-first; other people’s feelings come second', hi:'Tuned in to how other people are going' },
  or: { name:'Order and follow-through', lo:'Flexible, works in bursts, tolerates mess', hi:'Organised, finishes things, likes a system' },
  st: { name:'Steadiness under pressure', lo:'Feels things strongly; pressure lands hard', hi:'Even-keeled; stress rolls off more easily' },
  cu: { name:'Curiosity and imagination', lo:'Practical and concrete; prefers the proven', hi:'Drawn to ideas, possibilities and the new' }
};
const TRAIT_ORDER = ['ex','wa','or','st','cu'];

/* Part 4: working conditions. -2 = left pole, +2 = right pole */
const COND = [
  { k:'var', lo:'Steady, predictable days', hi:'Every day different' },
  { k:'ppl', lo:'Mostly on my own', hi:'Around people all day', flo:'Mostly on their own', fhi:'Around people all day' },
  { k:'out', lo:'Indoors', hi:'Outdoors, weather and all', flo:'Indoors', fhi:'Outdoors, weather and all' },
  { k:'aut', lo:'Clear instructions', hi:'Making my own calls', flo:'Following clear instructions', fhi:'Making their own calls' },
  { k:'brd', lo:'Master one thing deeply', hi:'Juggle lots of different things' },
  { k:'imm', lo:'Long projects, payoff later', hi:'See the result the same day' },
  { k:'stk', lo:'Calm and low stakes', hi:'High stakes, adrenaline', flo:'Calm and low stakes', fhi:'High stakes, adrenaline' },
  { k:'vis', lo:'Quietly behind the scenes', hi:'Out front and visible' },
  { k:'rsk', lo:'Secure, steady pay', hi:'Riskier, bigger upside' }
];
const COND_KEYS = COND.map(c => c.k);
const FRIEND_COND = ['ppl','out','aut','stk'];

/* Refining round */
const DEEP = [
  { id:'d1', q:'Describe a time you completely lost track of time. What were you doing?', tagq:'What made it so absorbing? Pick up to two.' },
  { id:'d2', q:'Think of a compliment that genuinely stuck with you, the kind you still remember.', tagq:'What was it really about? Pick up to two.' },
  { id:'d3', q:'What do people come to you for, even when it isn’t your job?', tagq:'Which of these is closest? Pick up to two.' }
];
const DEEP_TAGS = {
  R:'Working with my hands, tools or materials', I:'Cracking a puzzle or working something out', A:'Making something that was mine',
  S:'Helping, teaching or looking after someone', E:'Being in charge, persuading or winning', C:'Getting every detail exactly right'
};
const DRAIN = {
  R:'A full day of physical work with tools', I:'Weeks on one problem with no clear answer', A:'Coming up with original ideas on demand',
  S:'Listening to people’s problems all day', E:'Selling, pitching and chasing people for decisions', C:'Checking records line by line for errors'
};

/* Optional experience step */
const SKILLS = [
  ['hands','Physical, hands-on work'], ['mach','Driving or operating machinery'], ['trade','A trade qualification'], ['lead','Leading a team'],
  ['cust','Dealing with customers or the public'], ['care','Caring for people'], ['teach','Teaching or training others'], ['write','Writing reports or documents'],
  ['data','Spreadsheets and numbers'], ['it','Software, computers or IT'], ['money','Budgets and money'], ['sales','Selling or negotiating'],
  ['proj','Planning projects and schedules'], ['safety','Safety, rules and compliance'], ['research','Research and analysis'], ['design','Design or creative tools'],
  ['remote','Remote or regional locations, out in the field (not working from home)'], ['events','Events, hospitality or tourism']
];
const QUALS = ['No post-school qualification', 'Certificate III or IV / trade', 'Diploma', 'Bachelor degree', 'Postgraduate'];

const FIELDS = {
  admin:   { name:'Administration and office support', blurb:'Keeping an office, a front desk or a team\u2019s paperwork running smoothly.' },
  service: { name:'Customer service and call centre', blurb:'Helping people sort out problems, one conversation at a time.' },
  retail:  { name:'Retail and consumer products', blurb:'Shops, stock and the people who come through the door.' },
  hosp:    { name:'Hospitality, food and tourism', blurb:'Food, drinks, stays and experiences, usually at a fast pace.' },
  sales:   { name:'Sales, marketing and property', blurb:'Persuading, promoting and closing the deal.' },
  biz:     { name:'Management, HR and consulting', blurb:'Running teams and organisations, and finding the people for them.' },
  fin:     { name:'Accounting, banking and insurance', blurb:'Keeping money and records accurate and useful.' },
  creative:{ name:'Arts, media and design', blurb:'Making things people see, hear, read or use.' },
  tech:    { name:'IT and digital', blurb:'Building, running and supporting software and systems.' },
  eng:     { name:'Engineering', blurb:'Designing, building and maintaining technical things that have to work.' },
  sci:     { name:'Science and research', blurb:'Finding out what\u2019s really going on, with evidence.' },
  health:  { name:'Healthcare and medical', blurb:'Looking after people\u2019s bodies and minds, often when it matters most.' },
  comm:    { name:'Community services', blurb:'Supporting people through hard times and everyday life.' },
  edu:     { name:'Education and training', blurb:'Teaching, coaching and helping people learn.' },
  gov:     { name:'Government, defence, legal and emergency', blurb:'Protecting people and making the rules work.' },
  trade:   { name:'Trades, construction and services', blurb:'Skilled hands-on work with a finished job you can point at.' },
  ops:     { name:'Manufacturing, transport and logistics', blurb:'Making things and moving them where they need to go.' },
  mine:    { name:'Mining, resources and energy', blurb:'Big sites, big machines and the power grid.' },
  land:    { name:'Farming, animals and conservation', blurb:'Work where the paddock, the bush or the animals come first.' },
  sport:   { name:'Sport and recreation', blurb:'Keeping people active, safe and having fun.' }
};

const DIRECTIONS = {
  RI:{ n:'The Field Investigator', d:'You want to understand how things work and then get your hands on them. Real, physical problems hold your attention more than theory on its own.' },
  RA:{ n:'The Craftsperson', d:'You like making real things that look and feel right: materials, tools, and a finished object you can stand back from.' },
  RS:{ n:'The Hands-on Helper', d:'You help people by doing rather than talking about it: practical care, coaching, fixing what’s in front of you.' },
  RE:{ n:'The Crew Leader', d:'You like getting physical work done and being the one who keeps the crew moving. Momentum and a visible finish matter to you.' },
  RC:{ n:'The Precision Operator', d:'You like technical or physical work done exactly right, to a standard, with machines, systems or procedures you can trust.' },
  IA:{ n:'The Inventor', d:'Ideas are your raw material. You want to figure something out and then make something new from it.' },
  IS:{ n:'The Diagnostician', d:'You want to understand people’s problems properly, then use that understanding to actually help.' },
  IE:{ n:'The Strategist', d:'You like working out what’s really going on, then acting on it: making the call and bringing others with you.' },
  IC:{ n:'The Analyst', d:'Patterns, evidence and getting it right. You want work where careful thinking is the product.' },
  AS:{ n:'The Storyteller', d:'You connect with people through things you create: words, images, music or experiences.' },
  AE:{ n:'The Showrunner', d:'You want to make things and put them in front of an audience. Pitch it, make it, launch it.' },
  AC:{ n:'The Detail Designer', d:'You like making things that look good and work well, with real craft in the details.' },
  SE:{ n:'The Community Leader', d:'You like bringing people together and moving them somewhere better.' },
  SC:{ n:'The Steady Hand', d:'You make sure people are looked after reliably and nothing falls through the cracks.' },
  EC:{ n:'The Operator', d:'You like running things: setting goals, organising resources and making the numbers work.' }
};

/* Occupations. code = top RIASEC letters (based on O*NET equivalents);
   c = working conditions in COND order [var,ppl,out,aut,brd,imm,stk,vis,rsk], -2..2;
   t = personality leanings; pay = indicative full-time range, $k AUD; q = typical entry qualification (index into QUALS). */
const JOBS = [
 // Land
 { t:'Park Ranger', f:'land', code:'RSI', c:[1,0,2,1,1,0,0,0,-1], tr:{cu:.5}, pay:[65,90], q:2, sk:['remote','hands','cust','safety'],
   day:'You check a walking track after overnight rain and clear a fallen tree. At midday you explain to a school group why the creek is closed. The afternoon is a feral-animal survey, then logging what you found.',
   path:'Cert IV or Diploma in Conservation and Ecosystem Management, or an environmental science degree. State parks services often hire seasonally first.', sq:'park ranger' },
 { t:'Bush Regenerator', f:'land', code:'RI', c:[0,-1,2,0,0,0,-1,-2,-1], tr:{}, pay:[55,78], q:1, sk:['hands','remote','safety'],
   day:'You’re out with a small crew on a creek bank pulling lantana and planting tube stock, then recording which plots are recovering. You go home dirty and tired, and the site looks different every season.',
   path:'Cert III in Conservation and Ecosystem Management. Many start as trainees.', sq:'bush regenerator' },
 { t:'Agronomist', f:'land', code:'IRE', c:[1,1,1,1,1,-1,0,0,0], tr:{cu:.5,ex:.3}, pay:[80,120], q:3, sk:['research','remote','sales','cust'],
   day:'You walk a farmer’s paddock checking crop stress and taking soil samples. Then a kitchen-table conversation about what to sow and when, and back in the ute writing up the recommendation.',
   path:'Bachelor of Agriculture or Agricultural Science.', sq:'agronomist' },
 { t:'Farm or Station Manager', f:'land', code:'REC', c:[1,0,2,2,2,0,1,0,1], tr:{st:.5,or:.3}, pay:[70,120], q:1, sk:['hands','mach','lead','money','remote'],
   day:'Up before light checking water and stock, then fixing a pump, then on the phone to the stock agent about prices. The afternoon goes on the books and next season’s plan.',
   path:'Experience on the land plus a Cert IV or Diploma in Agriculture. Many work up from station hand.', sq:'farm manager' },
 { t:'Environmental Scientist', f:'land', code:'IRC', c:[0,0,1,1,0,-2,0,-1,-1], tr:{cu:.6,or:.3}, pay:[75,115], q:3, sk:['research','data','write','remote'],
   day:'Two days a fortnight you’re out sampling groundwater bores. The rest is at a desk turning results into a report that decides whether a development goes ahead.',
   path:'Bachelor of Environmental Science. Consultancies and state agencies take graduates.', sq:'environmental scientist' },
 { t:'Arborist', f:'land', code:'RC', c:[1,0,2,1,0,2,2,0,0], tr:{st:.4}, pay:[65,100], q:1, sk:['hands','mach','safety','trade'],
   day:'You climb a 25-metre gum on ropes to take a dead limb off over someone’s roof while the ground crew chips the debris. Then you quote a removal down the road.',
   path:'Cert III in Arboriculture, or Cert V for consulting arborists.', sq:'arborist' },
 { t:'Landscape Gardener', f:'land', code:'RAC', c:[0,-1,2,1,0,1,-1,-1,0], tr:{}, pay:[55,80], q:1, sk:['hands','design'],
   day:'You lay out a native garden from a plan, shift rock, set the irrigation and plant. By knock-off you can see the difference.',
   path:'Cert III in Horticulture or Landscape Construction.', sq:'landscaper' },
 // Trades
 { t:'Electrician', f:'trade', code:'RIC', c:[1,0,0,1,0,1,1,-1,0], tr:{or:.5}, pay:[80,130], q:1, sk:['trade','hands','safety'],
   day:'You fault-find why a café’s circuits keep tripping, rough-in wiring on a new build, then upgrade a switchboard. Each job is a small puzzle with a clear finish.',
   path:'Four-year apprenticeship (Cert III Electrotechnology). Adult apprenticeships exist.', sq:'electrician' },
 { t:'Carpenter', f:'trade', code:'RCE', c:[0,0,1,1,0,2,0,-1,1], tr:{}, pay:[70,120], q:1, sk:['trade','hands','proj'],
   day:'You frame walls on a house where yesterday there was only a slab: reading plans, measuring, cutting, and watching the structure go up.',
   path:'Cert III Carpentry apprenticeship, with a builder’s licence later.', sq:'carpenter' },
 { t:'Diesel Mechanic', f:'trade', code:'RIC', c:[0,-1,0,0,0,1,0,-2,0], tr:{}, pay:[80,140], q:1, sk:['trade','mach','hands','remote'],
   day:'You diagnose why a haul truck is losing power, pull the component and get it back on the road before the next shift needs it. FIFO rosters are common in mining.',
   path:'Cert III Heavy Commercial Vehicle Mechanical Technology apprenticeship.', sq:'diesel mechanic' },
 { t:'Plumber', f:'trade', code:'RC', c:[1,0,0,1,0,2,0,-1,1], tr:{}, pay:[75,125], q:1, sk:['trade','hands','cust'],
   day:'A burst pipe at 7am, a bathroom rough-in by lunch and a gas compliance check in the afternoon, mostly in other people’s homes.',
   path:'Cert III Plumbing apprenticeship.', sq:'plumber' },
 { t:'Cabinetmaker', f:'trade', code:'RAC', c:[-1,-2,-1,0,-1,0,-1,-2,0], tr:{or:.3}, pay:[60,85], q:1, sk:['trade','hands','design'],
   day:'You work a slab of spotted gum into a dining table: half joinery, half judgement about the grain.',
   path:'Cert III Cabinet Making or Furniture Making apprenticeship.', sq:'cabinet maker' },
 { t:'Metal Fabricator', f:'trade', code:'RC', c:[-1,-1,0,0,-1,1,0,-2,0], tr:{}, pay:[65,110], q:1, sk:['trade','hands','mach'],
   day:'You read a drawing, cut and tack the steel, then run the welds on a trailer frame that has to pass inspection.',
   path:'Cert III Engineering (Fabrication Trade).', sq:'boilermaker' },
 { t:'Building Surveyor', f:'trade', code:'CRI', c:[0,0,1,0,-1,1,1,0,-1], tr:{or:.6,st:.3}, pay:[90,140], q:3, sk:['safety','trade','write'],
   day:'Three site inspections checking footings and fire separation against the building code, then the hard conversation with a builder whose work doesn’t pass.',
   path:'Diploma or degree in Building Surveying plus state accreditation. Former tradies are common.', sq:'building surveyor' },
 // Health
 { t:'Registered Nurse', f:'health', code:'SIC', c:[1,2,-1,0,1,1,1,0,-2], tr:{wa:.7,st:.5}, pay:[75,115], q:3, sk:['care','cust','safety'],
   day:'Handover at seven, then medications, wound care and watching for the patient who is quietly getting worse. Later you sit with a family who just got bad news.',
   path:'Bachelor of Nursing, then a hospital graduate program.', sq:'registered nurse' },
 { t:'Paramedic', f:'health', code:'SRI', c:[2,1,1,1,1,2,2,0,-1], tr:{st:.8,wa:.3}, pay:[80,120], q:3, sk:['care','safety','mach'],
   day:'A cardiac arrest at a footy oval, a fall at a nursing home, a rollover on the highway. Long stretches of waiting, broken by minutes where everything matters.',
   path:'Bachelor of Paramedicine, then a state ambulance service.', sq:'paramedic' },
 { t:'Physiotherapist', f:'health', code:'SIR', c:[0,1,-1,1,0,0,-1,0,0], tr:{wa:.5}, pay:[75,115], q:3, sk:['care','cust','teach'],
   day:'Eight sessions: a tradie’s shoulder, a runner’s knee, an older woman relearning to walk after a hip replacement. Each is part hands-on work, part coaching.',
   path:'Bachelor or Master of Physiotherapy.', sq:'physiotherapist' },
 { t:'Occupational Therapist', f:'health', code:'SIA', c:[1,1,-1,1,1,-1,-1,0,-1], tr:{wa:.6,cu:.3}, pay:[75,110], q:3, sk:['care','teach','design','cust'],
   day:'You visit a home to work out how a man with a new spinal injury can cook and shower on his own, then design the equipment and routines to make it work.',
   path:'Bachelor or Master of Occupational Therapy.', sq:'occupational therapist' },
 { t:'Disability Support Worker', f:'health', code:'SR', c:[1,1,0,-1,1,1,0,-1,-1], tr:{wa:.8,st:.4}, pay:[55,75], q:1, sk:['care','hands'],
   day:'You help a young man get to work, shop for the week and cook dinner. The job is his independence, so you support rather than do it for him.',
   path:'Cert III or IV in Individual Support. You can start quickly.', sq:'disability support worker' },
 { t:'Medical Laboratory Scientist', f:'health', code:'IRC', c:[-1,-2,-2,0,-1,0,1,-2,-1], tr:{or:.6}, pay:[75,105], q:3, sk:['research','data','safety'],
   day:'You run blood cultures and check the analysers flag the right results. Doctors act on what you report but rarely meet you.',
   path:'Bachelor of Medical Laboratory Science.', sq:'medical scientist' },
 { t:'Counsellor', f:'health', code:'SAI', c:[0,1,-2,1,0,-2,1,-1,-1], tr:{wa:.8,cu:.4,st:.5}, pay:[70,100], q:3, sk:['care','write'],
   day:'Five sessions back to back, each person bringing something heavy. Between them, notes, and your own supervision to keep you steady.',
   path:'Degree in Counselling, Social Work or Psychology. Registration requirements vary.', sq:'counsellor' },
 // Community
 { t:'Primary School Teacher', f:'comm', code:'SAE', c:[1,2,-1,0,2,0,0,1,-2], tr:{ex:.5,wa:.5,or:.3}, pay:[75,115], q:3, sk:['teach','care','proj'],
   day:'Twenty-five eight-year-olds, a maths lesson that lands for some and not others, a playground dispute, then marking and planning in the evening.',
   path:'Bachelor or Master of Teaching. Most states have career-changer pathways.', sq:'primary teacher' },
 { t:'TAFE Teacher or Trainer', f:'comm', code:'SRE', c:[0,1,0,1,0,0,-1,1,-1], tr:{ex:.4,wa:.3}, pay:[80,110], q:1, sk:['teach','trade','hands'],
   day:'You run a workshop for apprentices on a skill you’ve done for years, then assess their work against the standard.',
   path:'Your industry or trade experience plus a Cert IV in Training and Assessment.', sq:'tafe teacher' },
 { t:'Social Worker', f:'comm', code:'SEA', c:[1,2,0,1,1,-1,1,0,-1], tr:{wa:.7,st:.5}, pay:[75,105], q:3, sk:['care','write','cust'],
   day:'A home visit to a family at risk, then calls to housing, Centrelink and a school to pull help together, then case notes.',
   path:'Bachelor or Master of Social Work.', sq:'social worker' },
 { t:'Youth Worker', f:'comm', code:'SEA', c:[2,2,0,1,1,0,1,0,-1], tr:{ex:.5,wa:.6}, pay:[60,85], q:1, sk:['care','teach','events'],
   day:'An afternoon drop-in at a youth centre: basketball, a kid who needs help with a job application, another who needs a safe place tonight.',
   path:'Cert IV or Diploma of Youth Work.', sq:'youth worker' },
 { t:'Personal Trainer or Coach', f:'comm', code:'SRE', c:[1,2,1,1,0,1,0,1,0], tr:{ex:.7}, pay:[50,85], q:1, sk:['teach','cust','hands'],
   day:'A 6am bootcamp in the park, one-on-one clients through the day, an evening junior squad session.',
   path:'Cert III and IV in Fitness, or coaching accreditation through a sport.', sq:'personal trainer' },
 { t:'Community Development Officer', f:'comm', code:'SEA', c:[1,2,0,1,2,-1,0,1,-1], tr:{ex:.5,wa:.5}, pay:[75,105], q:2, sk:['events','proj','write','cust'],
   day:'A meeting with a residents’ group, a grant application to fix the town hall, an evening consultation about the new park.',
   path:'Degree or Diploma in Community Services. Local councils hire for these roles.', sq:'community development officer' },
 { t:'Librarian', f:'comm', code:'CSI', c:[0,1,-2,0,1,0,-2,-1,-2], tr:{or:.5,cu:.5}, pay:[70,95], q:3, sk:['cust','research','teach'],
   day:'Helping someone trace their family history, running a kids’ story session, then cataloguing new stock.',
   path:'A degree plus postgraduate study in Information Studies.', sq:'librarian' },
 // Creative
 { t:'Graphic Designer', f:'creative', code:'AER', c:[0,0,-2,1,0,0,0,-1,0], tr:{cu:.6}, pay:[60,95], q:2, sk:['design','it'],
   day:'A briefing with a client who knows what they don’t want, an afternoon drafting logo concepts, revisions on a festival poster.',
   path:'Diploma or degree in Visual Communication. A portfolio matters more than the paper.', sq:'graphic designer' },
 { t:'Photographer or Videographer', f:'creative', code:'ARE', c:[1,0,1,2,1,0,0,0,2], tr:{cu:.5}, pay:[50,95], q:1, sk:['design','events','sales'],
   day:'You shoot a winery’s new release at golden hour, then spend hours editing, then chase invoices and the next booking.',
   path:'Mostly portfolio and freelancing. A Cert IV or Diploma helps.', sq:'videographer' },
 { t:'Chef', f:'creative', code:'RAE', c:[1,1,-2,0,0,2,2,0,0], tr:{st:.4}, pay:[60,90], q:1, sk:['hands','events','lead'],
   day:'Prep from 2pm, then a 200-cover dinner service where every plate leaves on time and to standard, then clean-down and ordering.',
   path:'Cert III or IV in Commercial Cookery apprenticeship.', sq:'chef' },
 { t:'Copywriter or Content Writer', f:'creative', code:'AEC', c:[0,-1,-2,1,1,0,-1,-1,0], tr:{cu:.7}, pay:[65,100], q:2, sk:['write','research'],
   day:'You interview an engineer to understand a product, then turn it into a page people actually read. Three drafts, two rounds of feedback.',
   path:'Portfolio-led. A degree in Communications helps.', sq:'copywriter' },
 { t:'Interior Designer', f:'creative', code:'AER', c:[1,1,-1,1,1,-1,0,0,1], tr:{}, pay:[65,100], q:2, sk:['design','proj','cust'],
   day:'A site measure for a café fit-out, sourcing tiles and lighting, then redrawing the plan after the budget shrinks.',
   path:'Diploma or degree in Interior Design.', sq:'interior designer' },
 { t:'Live Events Technician', f:'creative', code:'RAE', c:[2,0,0,0,0,2,2,-2,1], tr:{}, pay:[55,95], q:1, sk:['hands','events','mach','it'],
   day:'Load-in at noon, rigging and focusing lights, soundcheck, running the desk through the show, bump-out after midnight.',
   path:'Cert IV or Diploma in Live Production, or learn on crew.', sq:'audio visual technician' },
 { t:'UX Designer', f:'creative', code:'AIE', c:[0,0,-2,1,0,-1,0,-1,0], tr:{cu:.6}, pay:[90,140], q:2, sk:['design','it','research'],
   day:'You watch five people struggle with the same screen, sketch three ways to fix it, then convince the engineers which one to build.',
   path:'Short courses plus a portfolio. Many come from design, psychology or IT.', sq:'ux designer' },
 // Science
 { t:'Geologist', f:'sci', code:'IRC', c:[0,-1,2,1,0,-1,0,-1,1], tr:{cu:.6}, pay:[100,170], q:3, sk:['research','remote','data'],
   day:'Logging drill core in 40-degree heat at a remote camp and working out where the ore body goes next, then flying home at the end of a two-week swing.',
   path:'Bachelor of Science majoring in Geology.', sq:'geologist' },
 { t:'Data Analyst', f:'sci', code:'CIE', c:[-1,-1,-2,0,0,0,-1,-1,-1], tr:{or:.5,cu:.4}, pay:[80,125], q:2, sk:['data','it','research'],
   day:'A manager asks why sales dropped in Queensland. You pull the data, find it’s one product in one region, and explain it in a chart they’ll actually read.',
   path:'A degree in a quantitative field, or a short course plus a portfolio.', sq:'data analyst' },
 { t:'Field Ecologist', f:'sci', code:'IR', c:[1,-1,2,1,0,-2,0,-1,0], tr:{cu:.7}, pay:[70,105], q:3, sk:['research','remote','data'],
   day:'Setting camera traps at dawn, checking which quolls came through, and months later analysing what it all means.',
   path:'Bachelor of Science. Honours or a PhD for research roles.', sq:'ecologist' },
 { t:'Food Technologist', f:'sci', code:'IRC', c:[0,0,-2,0,0,0,0,-1,-1], tr:{}, pay:[75,110], q:3, sk:['research','safety','data'],
   day:'You run a trial batch of a new muesli bar, test its shelf life, then work out why the factory version tastes different from the kitchen one.',
   path:'Bachelor of Food Science.', sq:'food technologist' },
 { t:'Meteorologist', f:'sci', code:'IRC', c:[0,0,-1,0,-1,1,1,0,-2], tr:{cu:.5}, pay:[85,125], q:4, sk:['research','data'],
   day:'An overnight shift watching a cyclone’s track and updating warnings for the communities in its path.',
   path:'A science degree, then the Bureau of Meteorology’s graduate training.', sq:'meteorologist' },
 { t:'Forensic Scientist', f:'sci', code:'IRC', c:[0,-1,-1,0,-1,-1,1,-1,-1], tr:{or:.6,st:.4}, pay:[80,115], q:3, sk:['research','safety','write'],
   day:'Examining fibres from a crime scene, documenting every step so it holds up in court, then giving evidence.',
   path:'Bachelor of Forensic Science or Chemistry.', sq:'forensic scientist' },
 // Tech
 { t:'Civil Engineer', f:'tech', code:'RIC', c:[0,0,1,1,1,-1,1,0,-1], tr:{or:.5}, pay:[90,150], q:3, sk:['proj','research','safety'],
   day:'The morning on site checking a culvert pour against the design, the afternoon modelling stormwater for a new estate.',
   path:'Bachelor of Engineering (Civil).', sq:'civil engineer' },
 { t:'Software Developer', f:'tech', code:'ICR', c:[0,-1,-2,1,0,0,0,-1,0], tr:{cu:.5}, pay:[95,160], q:2, sk:['it','research','data'],
   day:'A stand-up, then four hours tracking down why a feature breaks for one customer, a code review and a design chat about what’s next.',
   path:'A degree, or self-taught with a portfolio.', sq:'software developer' },
 { t:'Cyber Security Analyst', f:'tech', code:'ICR', c:[1,-1,-2,0,0,1,2,-1,0], tr:{st:.4,cu:.4}, pay:[100,160], q:2, sk:['it','research','safety'],
   day:'Triaging alerts, chasing the one that looks like a real intrusion, then writing up how it happened and how to stop it.',
   path:'An IT background plus security certifications.', sq:'cyber security analyst' },
 { t:'Surveyor', f:'tech', code:'RCI', c:[0,-1,2,0,0,0,0,-1,0], tr:{or:.5}, pay:[75,120], q:2, sk:['remote','data','mach','it'],
   day:'Setting up a GPS base on a new subdivision, flying a drone over it, then turning the points into a plan.',
   path:'Diploma or Bachelor of Surveying. Licensed surveyors need registration.', sq:'surveyor' },
 { t:'Instrument Technician', f:'tech', code:'RIC', c:[0,-1,0,0,0,1,1,-2,0], tr:{}, pay:[80,130], q:1, sk:['trade','hands','it','remote'],
   day:'Calibrating sensors at a water treatment plant and chasing an intermittent fault in a control loop.',
   path:'Cert III or IV in Instrumentation or Electrotechnology apprenticeship.', sq:'instrument technician' },
 { t:'Aircraft Maintenance Engineer', f:'tech', code:'RIC', c:[0,-1,0,-1,-1,1,2,-2,-1], tr:{or:.7}, pay:[85,140], q:1, sk:['trade','mach','safety'],
   day:'A night shift inspecting a turboprop against a checklist where nothing gets skipped, signing it off so it flies at 6am.',
   path:'Cert IV Aeroskills apprenticeship and CASA licensing.', sq:'aircraft maintenance engineer' },
 { t:'Systems Administrator', f:'tech', code:'RCI', c:[1,1,-2,0,1,1,0,-1,-1], tr:{}, pay:[65,110], q:1, sk:['it','cust'],
   day:'Fixing a failed laptop and a network drop, then quietly rebuilding a server overnight so nobody notices.',
   path:'Cert IV in IT plus vendor certifications.', sq:'systems administrator' },
 // Business
 { t:'Small Business Owner', f:'biz', code:'ECR', c:[2,1,0,2,2,0,1,1,2], tr:{ex:.4,st:.4}, pay:[40,150], q:0, sk:['money','sales','lead','cust'],
   day:'Opening up, chasing a supplier, serving customers, then doing the books and planning next month at night.',
   path:'No set path. State small business programs offer courses and mentoring.', sq:'business manager' },
 { t:'Field Sales Representative', f:'biz', code:'ERS', c:[1,2,1,1,1,1,1,1,1], tr:{ex:.8}, pay:[75,150], q:1, sk:['sales','cust','mach'],
   day:'Driving between farms or sites, demonstrating equipment, solving a customer’s problem, closing a deal by Friday.',
   path:'Industry knowledge plus sales experience.', sq:'sales representative' },
 { t:'Project Manager', f:'biz', code:'ECS', c:[1,2,-1,1,2,-1,1,1,0], tr:{or:.6,ex:.3}, pay:[100,160], q:2, sk:['proj','lead','money'],
   day:'Running a meeting where three teams want different things, updating the schedule, flagging a risk before it costs money.',
   path:'Experience plus a Diploma of Project Management or PMP certification.', sq:'project manager' },
 { t:'Real Estate Agent', f:'biz', code:'ECS', c:[1,2,1,2,1,1,1,2,2], tr:{ex:.8}, pay:[50,180], q:1, sk:['sales','cust'],
   day:'Open homes on Saturday, appraisals during the week, negotiating between a buyer and a seller who are both nervous.',
   path:'A state Certificate of Registration.', sq:'real estate agent' },
 { t:'Marketing Manager', f:'biz', code:'EAC', c:[1,1,-2,1,1,0,1,1,0], tr:{ex:.5,cu:.4}, pay:[100,160], q:3, sk:['design','data','write','lead'],
   day:'Reviewing the last campaign’s numbers, briefing a designer on the next one, convincing the boss to spend more on what worked.',
   path:'A marketing or business degree, or work up through coordinator roles.', sq:'marketing manager' },
 { t:'Recruitment Consultant', f:'biz', code:'ESC', c:[1,2,-2,1,1,1,1,1,1], tr:{ex:.8}, pay:[65,130], q:1, sk:['sales','cust'],
   day:'Thirty calls to candidates, clients and referees, and one placement that changes someone’s year.',
   path:'No formal requirement. Sales or industry experience helps.', sq:'recruitment consultant' },
 // Gov / safety / law
 { t:'Police Officer', f:'gov', code:'SER', c:[2,2,1,-1,2,1,2,1,-1], tr:{st:.7,ex:.3}, pay:[75,110], q:1, sk:['safety','cust'],
   day:'A domestic call, a traffic crash, then hours of statements. You never know what the next job will be.',
   path:'State police academy. Entry requirements vary by state.', sq:'police officer' },
 { t:'Firefighter', f:'gov', code:'RSE', c:[1,1,2,-1,1,2,2,0,-2], tr:{st:.7}, pay:[80,115], q:0, sk:['hands','safety','mach'],
   day:'Truck checks, a community fire-safety visit, then a call to a crash with someone trapped.',
   path:'Competitive state recruitment with fitness and aptitude testing.', sq:'firefighter' },
 { t:'WHS Advisor', f:'gov', code:'CRS', c:[0,1,1,0,1,0,0,0,-1], tr:{or:.5}, pay:[90,140], q:2, sk:['safety','write','teach'],
   day:'A site walk with a supervisor, investigating a near miss, rewriting a procedure so people actually follow it.',
   path:'Cert IV or Diploma in Work Health and Safety.', sq:'whs advisor' },
 { t:'Policy Officer', f:'gov', code:'CIS', c:[-1,0,-2,0,0,-2,-1,-1,-2], tr:{cu:.5,or:.3}, pay:[80,125], q:3, sk:['write','research'],
   day:'Reading submissions, drafting a briefing for a minister, rewriting it after feedback, meeting the people affected.',
   path:'A degree in any field, then a public service graduate program or lateral entry.', sq:'policy officer' },
 { t:'Lawyer', f:'gov', code:'EIC', c:[0,1,-2,1,0,-1,2,1,0], tr:{or:.5,st:.4}, pay:[85,200], q:4, sk:['write','research','sales'],
   day:'Drafting a contract, a call with a client whose deal is falling apart, then preparing for a hearing.',
   path:'Law degree, practical legal training, then admission.', sq:'lawyer' },
 { t:'Emergency Management Coordinator', f:'gov', code:'ECS', c:[2,1,0,1,2,1,2,1,-1], tr:{st:.7}, pay:[85,125], q:2, sk:['proj','lead','safety'],
   day:'Quiet months planning and running exercises, then a flood week coordinating evacuation centres for days straight.',
   path:'Diploma or degree in Emergency Management. SES volunteering helps.', sq:'emergency management' },
 // Ops
 { t:'Truck Driver', f:'ops', code:'RC', c:[-1,-2,1,0,-1,0,0,-2,0], tr:{st:.5}, pay:[70,110], q:0, sk:['mach','remote'],
   day:'Brisbane to Townsville overnight, alone with the road, your logbook hours and your own playlist.',
   path:'Licence progression through HR, HC and MC classes.', sq:'truck driver' },
 { t:'Logistics Coordinator', f:'ops', code:'CER', c:[1,1,-1,0,1,1,1,0,-1], tr:{or:.7}, pay:[70,110], q:1, sk:['proj','data','money'],
   day:'A shipment stuck in port, a warehouse short of stock, a truck that didn’t turn up. You juggle it until everything arrives.',
   path:'Cert IV or Diploma in Logistics, or work up from the warehouse.', sq:'logistics coordinator' },
 { t:'Commercial Pilot', f:'ops', code:'RIE', c:[0,-1,0,-1,-1,1,1,0,0], tr:{st:.7,or:.5}, pay:[80,200], q:2, sk:['mach','safety'],
   day:'Pre-flight briefing, a weather check, three sectors through regional Queensland and a crosswind landing to finish.',
   path:'Commercial Pilot Licence training (around one to two years), then regional flying.', sq:'pilot' },
 { t:'Heavy Plant Operator', f:'ops', code:'RC', c:[-1,-1,2,-1,-1,1,1,-2,0], tr:{}, pay:[100,150], q:0, sk:['mach','remote','safety'],
   day:'A twelve-hour shift in a haul truck or excavator on a FIFO roster: dust, big machines and a lot of concentration.',
   path:'Tickets and site inductions. Traineeships are available.', sq:'plant operator' },
 { t:'Deckhand or Vessel Master', f:'ops', code:'RCE', c:[1,0,2,0,1,1,1,-1,0], tr:{}, pay:[60,110], q:1, sk:['hands','mach','remote'],
   day:'Ropes, mooring, maintenance and watchkeeping on a tug or ferry, with the weather deciding the day.',
   path:'AMSA certificates: General Purpose Hand, Coxswain, then Master <24m.', sq:'deckhand' },
 // Hospitality
 { t:'Outdoor Tour Guide', f:'hosp', code:'SER', c:[1,2,2,1,1,1,1,2,0], tr:{ex:.8}, pay:[50,80], q:1, sk:['cust','events','remote'],
   day:'Leading a group up a gorge, telling the story of the country, keeping everyone safe and making sure they have a good time.',
   path:'Cert III or IV in Guiding, first aid, and local knowledge.', sq:'tour guide' },
 { t:'Event Manager', f:'hosp', code:'ECS', c:[2,2,0,1,2,1,2,1,1], tr:{ex:.6,or:.5}, pay:[70,110], q:2, sk:['events','proj','money','cust'],
   day:'Months of bookings and spreadsheets, then a 16-hour event day fixing everything that goes wrong without anyone noticing.',
   path:'Diploma of Events, or work up through hospitality.', sq:'event manager' },
 { t:'Hospitality Venue Manager', f:'hosp', code:'ESC', c:[2,2,-1,1,2,2,1,1,0], tr:{ex:.6,st:.4}, pay:[65,100], q:1, sk:['events','lead','money','cust'],
   day:'Rosters, stock, a staff member calling in sick, the Friday night rush, closing the till at 1am.',
   path:'Work up from floor roles. Diploma of Hospitality Management helps.', sq:'venue manager' },
 // Finance
 { t:'Accountant', f:'fin', code:'CEI', c:[-1,0,-2,0,0,0,-1,-1,-2], tr:{or:.7}, pay:[75,130], q:3, sk:['money','data'],
   day:'Tax season returns for small businesses, then advising a café owner whether they can afford to hire.',
   path:'Bachelor of Accounting plus CA or CPA.', sq:'accountant' },
 { t:'Bookkeeper', f:'fin', code:'CE', c:[-2,-1,-2,0,0,1,-2,-2,-1], tr:{or:.7}, pay:[55,85], q:1, sk:['money','data'],
   day:'Reconciling three clients’ accounts, chasing a missing receipt and lodging a BAS.',
   path:'Cert IV Accounting and Bookkeeping, then BAS agent registration.', sq:'bookkeeper' },
 { t:'Financial Adviser', f:'fin', code:'ESC', c:[0,2,-2,1,0,-1,1,1,0], tr:{}, pay:[85,150], q:3, sk:['money','sales','cust'],
   day:'Meeting a couple about retiring in five years, modelling scenarios, explaining the options in plain language.',
   path:'An approved degree, the national exam and a professional year.', sq:'financial adviser' },
 { t:'Loss Adjuster', f:'fin', code:'CER', c:[1,1,1,0,1,0,1,0,-1], tr:{}, pay:[70,110], q:1, sk:['cust','write','safety'],
   day:'Inspecting a storm-damaged roof, interviewing the homeowner, and deciding what the policy covers.',
   path:'Cert IV in Loss Adjusting. A trades background helps.', sq:'loss adjuster' },
 // Digital and hybrid roles
 { t:'Learning Designer', f:'comm', code:'AIS', c:[0,0,-2,1,1,-1,-1,-1,-1], tr:{cu:.5,wa:.3}, pay:[85,125], q:2, sk:['teach','design','write','it'],
   day:'You turn a subject expert’s brain dump into a short online course: storyboard it, build the interactive activities, test it on a few learners and fix whatever confused them.',
   path:'Cert IV in Training and Assessment or a Graduate Certificate in Learning Design, plus a portfolio of sample modules.', sq:'learning designer', cq:'learning design' },
 { t:'Technical Writer', f:'creative', code:'AIC', c:[-1,-1,-2,1,0,-1,-1,-1,-1], tr:{or:.4,cu:.4}, pay:[85,125], q:2, sk:['write','it','research'],
   day:'You use a new system until you understand it better than its users, then write the guides, diagrams and help pages that make it make sense.',
   path:'Portfolio-led. A communications or technical background plus short courses in technical writing.', sq:'technical writer', cq:'technical writing' },
 { t:'Business Analyst', f:'biz', code:'CIE', c:[0,1,-2,0,1,-1,0,0,-1], tr:{or:.4,cu:.3}, pay:[95,145], q:2, sk:['research','data','write','proj'],
   day:'You sit with a team to map how a process really works, find where it breaks, and write up exactly what the new system needs to do.',
   path:'Experience in a business area plus a business analysis certification or degree.', sq:'business analyst', cq:'business analysis' },
 { t:'Automation Specialist', f:'eng', code:'RIC', c:[1,-1,0,1,0,1,1,-1,0], tr:{cu:.5,or:.3}, pay:[95,150], q:2, sk:['trade','it','mach','safety'],
   day:'Programming the PLC for a new packaging line, then working out why a robot cell keeps stopping every few hours and getting it running again.',
   path:'Usually an electrical trade plus PLC and automation training (Cert IV or Diploma), or a degree in mechatronics or electrical engineering.', sq:'automation engineer', cq:'PLC automation' },
 { t:'Product Manager', f:'biz', code:'EIC', c:[1,2,-2,2,2,-1,1,1,0], tr:{ex:.4,cu:.4}, pay:[120,180], q:2, sk:['proj','lead','research','it'],
   day:'You talk to customers about what’s annoying them, decide what the team builds next and what it doesn’t, then defend that call.',
   path:'Usually from design, engineering, analysis or customer-facing roles. Product management courses help.', sq:'product manager', cq:'product management' },
 { t:'Solutions Architect', f:'tech', code:'IEC', c:[1,1,-2,1,1,-1,1,0,0], tr:{cu:.5}, pay:[140,200], q:3, sk:['it','research','sales','proj'],
   day:'You whiteboard how a client’s systems should fit together, weigh cost against risk, then guide the team that builds it.',
   path:'Several years in IT or engineering plus cloud architecture certifications.', sq:'solutions architect', cq:'cloud architecture' },
 { t:'Technical Trainer', f:'comm', code:'SIE', c:[0,1,-1,1,0,1,0,1,-1], tr:{ex:.3,wa:.4}, pay:[75,110], q:1, sk:['teach','it','cust'],
   day:'You run a hands-on lab teaching a group a new system, then stay with the one person who’s stuck until it clicks.',
   path:'Subject knowledge plus a Cert IV in Training and Assessment.', sq:'technical trainer', cq:'training and assessment' }
];
const COURSE_Q = {"Park Ranger": "conservation and ecosystem management", "Bush Regenerator": "conservation and ecosystem management", "Agronomist": "agricultural science", "Farm or Station Manager": "agriculture diploma", "Environmental Scientist": "environmental science", "Arborist": "arboriculture", "Landscape Gardener": "landscape construction", "Electrician": "electrotechnology apprenticeship", "Carpenter": "carpentry apprenticeship", "Diesel Mechanic": "heavy commercial vehicle mechanical technology", "Plumber": "plumbing apprenticeship", "Cabinetmaker": "cabinet making", "Metal Fabricator": "engineering fabrication trade", "Building Surveyor": "building surveying", "Registered Nurse": "bachelor of nursing", "Paramedic": "bachelor of paramedicine", "Physiotherapist": "physiotherapy", "Occupational Therapist": "occupational therapy", "Disability Support Worker": "individual support", "Medical Laboratory Scientist": "medical laboratory science", "Counsellor": "counselling", "Primary School Teacher": "primary teaching", "TAFE Teacher or Trainer": "training and assessment", "Social Worker": "social work", "Youth Worker": "youth work", "Personal Trainer or Coach": "fitness", "Community Development Officer": "community services", "Librarian": "information studies", "Graphic Designer": "graphic design", "Photographer or Videographer": "photography and photo imaging", "Chef": "commercial cookery", "Copywriter or Content Writer": "professional writing", "Interior Designer": "interior design", "Live Events Technician": "live production", "UX Designer": "UX design", "Geologist": "geology", "Data Analyst": "data analytics", "Field Ecologist": "ecology", "Food Technologist": "food science", "Meteorologist": "meteorology", "Forensic Scientist": "forensic science", "Civil Engineer": "civil engineering", "Software Developer": "software development", "Cyber Security Analyst": "cyber security", "Surveyor": "surveying", "Instrument Technician": "instrumentation and control", "Aircraft Maintenance Engineer": "aeroskills", "Systems Administrator": "information technology networking", "Small Business Owner": "small business management", "Field Sales Representative": "sales", "Project Manager": "project management", "Real Estate Agent": "real estate certificate of registration", "Marketing Manager": "marketing", "Recruitment Consultant": "recruitment", "Police Officer": "police recruitment", "Firefighter": "firefighter recruitment", "WHS Advisor": "work health and safety", "Policy Officer": "public policy", "Lawyer": "law", "Emergency Management Coordinator": "emergency management", "Truck Driver": "heavy rigid licence", "Logistics Coordinator": "supply chain operations", "Commercial Pilot": "commercial pilot licence", "Heavy Plant Operator": "resources and infrastructure operations", "Deckhand or Vessel Master": "maritime operations", "Outdoor Tour Guide": "guiding", "Event Manager": "events", "Hospitality Venue Manager": "hospitality management", "Accountant": "accounting", "Bookkeeper": "accounting and bookkeeping", "Financial Adviser": "financial planning", "Loss Adjuster": "loss adjusting"};
const GOOD = ['Not really','Okay','Very good'];
const ENJOY = ['Not really','Mixed','Loved it'];

/* Field moves and 'also advertised as' titles for the original roles */
const MOVE = {"Primary School Teacher": "edu", "TAFE Teacher or Trainer": "edu", "Librarian": "edu", "Learning Designer": "edu", "Technical Trainer": "edu", "Personal Trainer or Coach": "sport", "Real Estate Agent": "sales", "Field Sales Representative": "sales", "Marketing Manager": "sales", "Civil Engineer": "eng", "Surveyor": "eng", "Instrument Technician": "eng", "Aircraft Maintenance Engineer": "eng", "Heavy Plant Operator": "mine", "Geologist": "mine", "Chef": "hosp", "Disability Support Worker": "comm", "Data Analyst": "tech"};
const AKA = {"Park Ranger": ["Ranger", "Field Officer (Parks)"], "Bush Regenerator": ["Conservation Worker", "Natural Area Restoration"], "Agronomist": ["Agronomy Consultant"], "Farm or Station Manager": ["Farm Manager", "Station Manager", "Property Manager (Rural)"], "Environmental Scientist": ["Environmental Consultant", "Environmental Officer"], "Arborist": ["Tree Surgeon", "Climbing Arborist"], "Landscape Gardener": ["Landscaper", "Horticulturist"], "Electrician": ["Sparky", "Electrical Fitter"], "Carpenter": ["Chippy", "Builder"], "Diesel Mechanic": ["Heavy Vehicle Mechanic", "HD Fitter"], "Plumber": ["Gasfitter", "Drainer"], "Cabinetmaker": ["Joiner", "Furniture Maker"], "Metal Fabricator": ["Boilermaker", "Welder"], "Building Surveyor": ["Building Certifier", "Building Inspector"], "Registered Nurse": ["RN"], "Paramedic": ["Ambulance Officer"], "Physiotherapist": ["Physio"], "Occupational Therapist": ["OT"], "Disability Support Worker": ["Support Worker", "NDIS Support Worker"], "Medical Laboratory Scientist": ["Medical Scientist", "Pathology Scientist"], "Counsellor": ["Mental Health Counsellor", "AOD Counsellor"], "Primary School Teacher": ["Primary Teacher", "Classroom Teacher"], "TAFE Teacher or Trainer": ["Trainer and Assessor", "VET Trainer"], "Social Worker": ["Case Manager", "Child Protection Practitioner"], "Youth Worker": ["Youth Support Worker"], "Personal Trainer or Coach": ["PT", "Fitness Instructor", "Strength Coach"], "Community Development Officer": ["Community Engagement Officer"], "Librarian": ["Library Officer", "Archivist"], "Graphic Designer": ["Visual Designer", "Brand Designer"], "Photographer or Videographer": ["Photographer", "Video Editor", "Content Producer"], "Chef": ["Cook", "Sous Chef", "Chef de Partie"], "Copywriter or Content Writer": ["Content Writer", "Copywriter", "Content Marketer"], "Interior Designer": ["Interior Stylist", "Fit-out Designer"], "Live Events Technician": ["AV Technician", "Lighting Technician", "Sound Engineer"], "UX Designer": ["Product Designer", "UX/UI Designer", "Service Designer"], "Geologist": ["Exploration Geologist", "Mine Geologist"], "Data Analyst": ["Reporting Analyst", "BI Analyst", "Insights Analyst"], "Field Ecologist": ["Ecologist", "Wildlife Biologist"], "Food Technologist": ["Food Scientist", "QA Food Technologist"], "Meteorologist": ["Forecaster"], "Forensic Scientist": ["Crime Scene Examiner"], "Civil Engineer": ["Structural Engineer", "Design Engineer"], "Software Developer": ["Software Engineer", "Full Stack Developer", "Programmer"], "Cyber Security Analyst": ["SOC Analyst", "Security Engineer"], "Surveyor": ["Land Surveyor", "Survey Technician", "Drone Surveyor"], "Instrument Technician": ["Instrument Electrician", "E&I Technician"], "Aircraft Maintenance Engineer": ["LAME", "AME", "Avionics Technician"], "Systems Administrator": ["Sysadmin", "Infrastructure Engineer"], "Small Business Owner": ["Self Employed", "Franchisee"], "Field Sales Representative": ["Territory Manager", "Sales Rep"], "Project Manager": ["Project Coordinator", "Program Manager"], "Real Estate Agent": ["Sales Agent", "Property Consultant"], "Marketing Manager": ["Marketing Coordinator", "Brand Manager", "Digital Marketing Manager"], "Recruitment Consultant": ["Recruiter", "Talent Acquisition"], "Police Officer": ["Constable"], "Firefighter": ["Fire Fighter"], "WHS Advisor": ["Safety Advisor", "HSE Advisor"], "Policy Officer": ["Policy Adviser", "Policy Analyst"], "Lawyer": ["Solicitor", "Barrister"], "Emergency Management Coordinator": ["Disaster Management Officer"], "Truck Driver": ["HR Driver", "HC Driver", "MC Driver"], "Logistics Coordinator": ["Supply Chain Coordinator", "Freight Coordinator"], "Commercial Pilot": ["Pilot", "First Officer"], "Heavy Plant Operator": ["Haul Truck Operator", "Excavator Operator", "Dozer Operator"], "Deckhand or Vessel Master": ["Deckhand", "Coxswain", "Marine Crew"], "Outdoor Tour Guide": ["Tour Guide", "Adventure Guide"], "Event Manager": ["Event Coordinator", "Event Producer"], "Hospitality Venue Manager": ["Venue Manager", "Restaurant Manager", "Bar Manager"], "Accountant": ["Tax Accountant", "Management Accountant"], "Bookkeeper": ["BAS Agent", "Accounts Clerk"], "Financial Adviser": ["Financial Planner", "Wealth Adviser"], "Loss Adjuster": ["Claims Assessor", "Insurance Assessor"], "Learning Designer": ["Instructional Designer", "eLearning Developer"], "Technical Writer": ["Documentation Specialist"], "Business Analyst": ["Process Analyst", "Systems Analyst"], "Automation Specialist": ["Power Platform Developer", "RPA Developer", "Low-code Developer"], "Product Manager": ["Product Owner"], "Solutions Architect": ["AI Solutions Architect", "Cloud Architect", "Enterprise Architect"], "Technical Trainer": ["IT Trainer", "Software Trainer"]};
JOBS.forEach(j=>{ if(MOVE[j.t]) j.f=MOVE[j.t]; if(!j.aka && AKA[j.t]) j.aka=AKA[j.t]; });
