const C = window.CAMPUSSYNC || {};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const G = {All:'✨', Tech:'💻', Arts:'🎨', Talks:'🎤', Science:'🔬', Business:'💼', Wellness:'🧘'};
// name, group, label, emoji, tagline  (edit the labels and taglines here any time)
const CL = [
['VClick','Arts','Photography','📸','Frame every moment'],['The Investment Forum','Business','Finance','📈','Make money work for you'],
['Zephyr','Arts','Dance','💃','Move like nobody is watching'],['Game Dev+','Tech','Gaming','🎮','Build the games you love'],
['SDP','Talks','Personal development','🌱','Grow a little every day'],['Indus Connect','Business','Industry experience','🏭','Meet the real world of work'],
['Ekasutram','Science','Maths','🧮','Numbers, patterns, puzzles'],['Aaroh','Arts','Singing','🎤','Find your voice'],
['MUN','Talks','Debate and critical thinking','🌍','Argue like a diplomat'],['IEEE Connect','Tech','Technology','⚡','Where engineers connect'],
['TEDxVITPUNE','Talks','Ideas worth spreading','💡','Big ideas, short talks'],['VishwaConclave','Talks','Conclave','🌐','Voices from across the world'],
['Yuj','Wellness','Yoga','🧘','Stretch, breathe, reset'],['Chesa','Science','Chemical engineering','⚗️','Where chemistry gets real'],
['Personality Development Club','Talks','Personal development','🌟','Become your best self'],['AR/VR','Tech','Immersive tech','🥽','Step into new worlds'],
['Viculp','Arts','Drama','🎭','Stories on stage'],['Griffin','Science','Aircraft','✈️','Built to fly'],
['Antariksha','Science','Space and astronomy','🔭','Look up'],['Speakers Club','Talks','Public speaking','🗣️','Speak with confidence'],
['DSC','Tech','Coding','💻','Code, build, ship'],['Light Hearted Lounge','Arts','Stand-up comedy','😂','Laugh out loud'],
['CSI','Tech','Coding','⌨️','Write code that matters'],['Eklavya','Arts','Theatre and street play','🎪','Theatre that hits the street'],
['Abhivriddhi','More','Club','🚀','Details coming soon'],['ISA','Tech','Automation and intelligence','🤖','Machines that think'],
['MLSC','Tech','Coding','🧠','Learn, code, share'],['Veloce Racing','Science','Motorsport','🏎️','Built for speed'],
['VRC','Talks','Reading','📚','One more chapter']];

function msg(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(msg.t);msg.t=setTimeout(()=>e.hidden=true,3500)}
function photo(file,max=700){return new Promise(res=>{if(!file)return res('');const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/i.width),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.7))};i.onerror=()=>res('');i.src=r.result};r.onerror=()=>res('');r.readAsDataURL(file)})}
async function rest(p, o = {}) {
  const r = await fetch(C.url + '/rest/v1/' + p, {...o, headers: {apikey: C.key, 'Content-Type': 'application/json', ...o.headers}});
  if (!r.ok) { const e = new Error('http'); e.status = r.status; throw e; }
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
const post = (t, row) => rest(t, {method: 'POST', body: JSON.stringify(row), headers: {Prefer: 'return=minimal'}});
let D = {clubs: [], sessions: [], promos: []}, ML = [], M = {}, S = {campus: '', group: 'All', q: ''};
async function load() {
  if (!C.url || !C.key) { $('#setup').hidden = false; return; }
  try { [D.clubs, D.sessions, D.promos] = await Promise.all([rest('clubs?select=*&order=name'), rest('sessions?select=*&order=starts'), rest('promos?select=*&order=created_at.desc')]); }
  catch (e) { msg('Could not load data. Check your connection.'); }
}
const mk = (c, i, db) => { const h = (i * 137.5) % 360; return {name: db ? db.name : c[0], group: c[1], label: c[2], emoji: c[3], tag: c[4], a: `hsl(${h} 78% 46%)`, b: `hsl(${(h + 40) % 360} 80% 26%)`, db}; };
function merge() {
  const seen = new Set();
  ML = CL.map((c, i) => { const db = D.clubs.find(x => (x.name || '').toLowerCase() === c[0].toLowerCase()); if (db) seen.add(db.id); return mk(c, i, db); });
  D.clubs.filter(x => !seen.has(x.id)).forEach((x, j) => ML.push(mk(['', 'More', 'Club', '✨', ''], CL.length + j, x)));
  M = {}; ML.forEach(c => c.db && (M[c.db.id] = c));
}
const up = () => D.sessions.filter(s => s.starts && new Date(s.starts) >= Date.now() - 72e5).sort((a, b) => a.starts.localeCompare(b.starts));
const dt = t => { const d = new Date(t); return {day: d.getDate(), mon: d.toLocaleString([], {month: 'short'}), full: d.toLocaleString([], {weekday: 'short', hour: 'numeric', minute: '2-digit'})}; };
const free = s => s.mode === 'Free' || !+s.fee;
const pay = s => free(s) ? 'Free entry' : `₹${+s.fee} by ${esc(s.mode)}`;
const ses = (s, c) => { const d = dt(s.starts); return `<div class="ses" style="--a:${c.a};--b:${c.b}"><div class="dt"><b>${d.day}</b>${d.mon}</div><div class="si"><b>${esc(s.title)}</b><div class="mut">${esc(c.name)}</div><div class="mut">${d.full}${s.venue ? ' at ' + esc(s.venue) : ''}</div><span class="pill">${pay(s)}</span>${!free(s) && s.info ? `<div class="mut">${esc(s.info)}</div>` : ''}
  <details><summary class="btn sm">Join</summary><form data-act="join" data-sid="${s.id}"><input name="name" placeholder="Your name" value="${esc(localStorage.cs_name || '')}" required><input name="email" type="email" placeholder="Email" value="${esc(localStorage.cs_email || '')}" required><button class="btn">Confirm</button></form></details></div></div>`; };
function vid(u) {
  u = (u || '').trim(); if (!/^https:\/\//.test(u)) return '';
  const y = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  if (y) return `<iframe class="vid" src="https://www.youtube.com/embed/${y[1]}" allowfullscreen loading="lazy"></iframe>`;
  if (/\.(mp4|webm)(\?|$)/i.test(u)) return `<video class="vid" controls playsinline src="${esc(u)}"></video>`;
  return `<a class="btn" href="${esc(u)}" target="_blank" rel="noopener">Watch video</a>`;
}
function draw() {
  merge(); const q = S.q.toLowerCase();
  $('#count').textContent = `${ML.length} clubs. Pick the one that feels like you.`;
  $('#campus').innerHTML = [['', 'Both campuses'], ['Kondhwa', 'Kondhwa'], ['Bibwewadi', 'Bibwewadi']].map(([v, t]) => `<button class="chip ${S.campus === v ? 'on' : ''}" data-campus="${v}">${t}</button>`).join('');
  $('#groups').innerHTML = Object.keys(G).map(g => `<button class="chip ${S.group === g ? 'on' : ''}" data-group="${g}">${G[g]} ${g}</button>`).join('');
  const list = ML.filter(c => (S.group === 'All' || c.group === S.group) && (!S.campus || !c.db || !c.db.campus || c.db.campus === 'Both' || c.db.campus === S.campus) && (c.name + ' ' + c.label + ' ' + c.tag).toLowerCase().includes(q));
  const U = up().filter(s => M[s.club_id]);
  $('#clubs').innerHTML = list.map((c, i) => { const n = c.db ? U.filter(s => s.club_id === c.db.id).length : 0;
    return `<button class="club" data-club="${ML.indexOf(c)}" style="--a:${c.a};--b:${c.b};animation-delay:${Math.min(i, 14) * 30}ms">${c.db && c.db.photo ? `<img class="cov" src="${c.db.photo}" alt="">` : `<span class="em">${c.emoji}</span>`}<span class="shade"></span>${n ? `<span class="badge">${n} upcoming</span>` : ''}<h3>${esc(c.name)}</h3><small>${esc(c.label)}</small></button>`; }).join('') || '<p class="mut">No clubs match your search.</p>';
  $('#next').innerHTML = U.length ? `<h2 class="h">Coming up</h2><div class="chips strip">${U.slice(0, 10).map(s => { const c = M[s.club_id], d = dt(s.starts);
    return `<button class="nx" data-club="${ML.indexOf(c)}" style="--a:${c.a};--b:${c.b}"><span>${c.emoji}</span><b>${esc(s.title)}</b><small>${esc(c.name)}</small><small>${d.mon} ${d.day}, ${d.full}</small></button>`; }).join('')}</div>` : '';
  $('#events').innerHTML = U.map(s => ses(s, M[s.club_id])).join('') || '<p class="mut">No events yet. Check back soon.</p>';
  $('#promos').innerHTML = D.promos.map(p => `<div class="card" style="display:block"><img src="${p.photo}" alt="${esc(p.caption)}"><div style="padding-top:8px">${esc(p.caption)} <span class="pill">${p.campus}</span></div></div>`).join('') || '<p class="mut">No promos yet. Be the first to post one.</p>';
}
function openClub(c) {
  const ss = c.db ? up().filter(s => s.club_id === c.db.id) : [];
  $('#sheet').innerHTML = `<button class="x" data-close aria-label="Close">✕</button><div class="sh" style="--a:${c.a};--b:${c.b}">${c.db && c.db.photo ? `<img class="cov" src="${c.db.photo}" alt=""><span class="shade"></span>` : `<div class="big">${c.emoji}</div>`}<span class="pill">${esc(c.label)}</span>${c.db && c.db.campus ? ` <span class="pill">${esc(c.db.campus)}</span>` : ''}<h2>${esc(c.name)}</h2><p>${esc(c.tag)}</p></div>
  <div class="sb"><h3>About</h3><p>${esc(c.db && c.db.descr || 'More details coming soon. Check the sessions below.')}</p>${c.db ? vid(c.db.video) : ''}
  <h3>Upcoming sessions</h3>${ss.map(s => ses(s, c)).join('') || '<p class="mut">No sessions announced yet. Check back soon.</p>'}</div>`;
  $('#sheet').hidden = false; $('#sheet').scrollTop = 0; document.body.style.overflow = 'hidden';
}
const closeSheet = () => { $('#sheet').hidden = true; document.body.style.overflow = ''; };
const tab = v => { ['clubs', 'events', 'feed', 'my'].forEach(t => $('#v-' + t).hidden = t !== v); document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === v)); scrollTo(0, 0); };
async function showMy(email) {
  email = (email || '').trim().toLowerCase(); $('#myemail').value = email;
  if (!email || !C.url) { $('#my').innerHTML = '<p class="mut">Enter your email to see your events.</p>'; return; }
  let rows = []; try { rows = await rest('rpc/my_regs', {method: 'POST', body: JSON.stringify({p_email: email})}); } catch (e) { msg('Could not load your events.'); }
  $('#my').innerHTML = rows.map(r => `<div class="ses"><div class="si"><b>${esc(r.club)}: ${esc(r.title)}</b><div class="mut">${dt(r.starts).mon} ${dt(r.starts).day}, ${dt(r.starts).full}</div><span class="pill">${pay(r)}</span> <span class="st ${r.status}">${r.status}</span>${r.note ? `<div>${esc(r.note)}</div>` : ''}</div></div>`).join('') || '<p class="mut">No events yet. Join a session from a club page.</p>';
}
document.addEventListener('click', e => {
  const t = e.target; let b;
  if (b = t.closest('[data-tab]')) { closeSheet(); tab(b.dataset.tab); }
  else if (b = t.closest('[data-club]')) openClub(ML[+b.dataset.club]);
  else if (t.closest('[data-close]')) closeSheet();
  else if (b = t.closest('[data-group]')) { S.group = b.dataset.group; draw(); }
  else if (b = t.closest('[data-campus]')) { S.campus = b.dataset.campus; draw(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
document.addEventListener('input', e => { if (e.target.id === 'q') { S.q = e.target.value; draw(); } });
document.addEventListener('submit', async e => {
  const f = e.target, a = f.dataset.act; if (!a) return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f));
  if (a === 'join') {
    const email = v.email.trim().toLowerCase(), name = v.name.trim(); localStorage.cs_name = name; localStorage.cs_email = email;
    try { await post('regs', {session_id: f.dataset.sid, name, email}); msg('You are in! Track your status here.'); }
    catch (x) { msg(x.status === 409 ? 'You already joined this session.' : 'Could not join. Try again.'); }
    closeSheet(); tab('my'); showMy(email);
  }
  if (a === 'my') showMy(v.email);
  if (a === 'promo') {
    const p = await photo(f.elements.photo.files[0]); if (!p) return msg('Choose a PNG, JPG, WEBP or GIF image.');
    try { await post('promos', {caption: v.caption, campus: v.campus, photo: p}); f.reset(); await load(); draw(); msg('Promo posted.'); }
    catch (x) { msg('Could not post. Try a smaller image.'); }
  }
});
load().then(() => { draw(); showMy(localStorage.cs_email); });
