const C = window.CAMPUSSYNC || {};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when = t => t ? new Date(t).toLocaleString([], {dateStyle:'medium', timeStyle:'short'}) : '';
const pay = s => s.mode === 'Free' ? 'Free entry' : `Fee ₹${s.fee || 0}. Pay by ${esc(s.mode)}${s.info ? ': ' + esc(s.info) : ''}`;
function msg(t){const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(msg.t);msg.t=setTimeout(()=>e.hidden=true,3500)}
function photo(file,max=700){return new Promise(res=>{if(!file)return res('');const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/i.width),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.7))};i.onerror=()=>res('');i.src=r.result};r.onerror=()=>res('');r.readAsDataURL(file)})}
async function rest(p, o = {}) {
  const r = await fetch(C.url + '/rest/v1/' + p, {...o, headers: {apikey: C.key, 'Content-Type': 'application/json', ...o.headers}});
  if (!r.ok) { const e = new Error('http'); e.status = r.status; throw e; }
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
const post = (t, row) => rest(t, {method: 'POST', body: JSON.stringify(row), headers: {Prefer: 'return=minimal'}});
let D = {clubs: [], sessions: [], promos: []};
async function load() {
  if (!C.url || !C.key) { $('#setup').hidden = false; return; }
  try { [D.clubs, D.sessions, D.promos] = await Promise.all([rest('clubs?select=*&order=name'), rest('sessions?select=*&order=starts'), rest('promos?select=*&order=created_at.desc')]); }
  catch (e) { msg('Could not load data. Check config.js and the setup steps.'); }
}
function draw() {
  const c = $('#campus').value, q = $('#q').value.toLowerCase();
  const cl = D.clubs.filter(x => (!c || x.campus === c || x.campus === 'Both') && x.name.toLowerCase().includes(q));
  $('#clubs').innerHTML = cl.map(x => `<div class="card">${x.photo ? `<img src="${x.photo}" alt="${esc(x.name)}">` : ''}<div class="pad"><span class="tag ${x.campus}">${x.campus}</span><h3>${esc(x.name)}</h3><p>${esc(x.descr)}</p></div></div>`).join('') || '<p>No clubs match your search.</p>';
  const ids = new Set(cl.map(x => x.id)), nm = localStorage.cs_name || '', em = localStorage.cs_email || '';
  $('#sessions').innerHTML = D.sessions.filter(s => ids.has(s.club_id)).map(s => {
    const k = D.clubs.find(x => x.id === s.club_id);
    return `<div class="card pad"><span class="tag ${k.campus}">${k.campus}</span> <b>${esc(k.name)}: ${esc(s.title)}</b><br>Starts ${when(s.starts)}${s.venue ? ', ' + esc(s.venue) : ''}<br>${pay(s)}
    <form class="row" data-act="join" data-sid="${s.id}" style="margin-top:8px"><input name="name" placeholder="Your name" value="${esc(nm)}" required><input name="email" type="email" placeholder="Email" value="${esc(em)}" required><button>Join session</button></form></div>`;
  }).join('') || '<p>No sessions yet. Check back soon.</p>';
  $('#promos').innerHTML = D.promos.map(p => `<div class="card"><img src="${p.photo}" alt="${esc(p.caption)}"><div class="pad"><span class="tag ${p.campus}">${p.campus}</span> ${esc(p.caption)}</div></div>`).join('') || '<p>No promos yet. Be the first to post one.</p>';
}
async function showMy(email) {
  email = (email || '').trim().toLowerCase(); $('#myemail').value = email;
  if (!email || !C.url) { $('#my').innerHTML = '<p>Enter your email to see your events.</p>'; return; }
  let rows = []; try { rows = await rest('rpc/my_regs', {method: 'POST', body: JSON.stringify({p_email: email})}); } catch (e) { msg('Could not load your events.'); }
  $('#my').innerHTML = rows.length ? `<table><tr><th>Session</th><th>Starts</th><th>Payment</th><th>Status</th></tr>${rows.map(r => `<tr><td>${esc(r.club)}: ${esc(r.title)}</td><td>${when(r.starts)}</td><td>${pay(r)}</td><td><span class="st ${r.status}">${r.status}</span>${r.note ? '<br>' + esc(r.note) : ''}</td></tr>`).join('')}</table>` : '<p>No events yet. Join a session from the list above.</p>';
}
document.addEventListener('submit', async e => {
  const f = e.target, a = f.dataset.act; if (!a) return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f));
  if (a === 'join') {
    const email = v.email.trim().toLowerCase(), name = v.name.trim(); localStorage.cs_name = name; localStorage.cs_email = email;
    try { await post('regs', {session_id: f.dataset.sid, name, email}); msg('You joined. Track your status under My events.'); }
    catch (x) { msg(x.status === 409 ? 'You already joined this session.' : 'Could not join. Try again.'); }
    showMy(email);
  }
  if (a === 'my') showMy(v.email);
  if (a === 'promo') {
    const p = await photo(f.elements.photo.files[0]); if (!p) return msg('Choose a PNG, JPG, WEBP or GIF image.');
    try { await post('promos', {caption: v.caption, campus: v.campus, photo: p}); f.reset(); await load(); draw(); msg('Promo posted.'); }
    catch (x) { msg('Could not post. Try a smaller image.'); }
  }
});
document.addEventListener('change', e => { if (e.target.id === 'campus') draw(); });
document.addEventListener('input', e => { if (e.target.id === 'q') draw(); });
load().then(() => { draw(); showMy(localStorage.cs_email); });
