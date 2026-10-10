/* acoes.js — o que cada toque faz, login, roteamento e a inicialização do app. */
'use strict';

const VERSAO_APP = '1.0.0';

/* ============ render ============ */
function renderTop() {
  const t = $('#top'); if (!t) return;
  if (!S.sessao) { t.innerHTML = `<p class="brand">RA<b>CHA</b></p>`; return; }
  const env = S.fila.length, off = !navigator.onLine;
  t.innerHTML = `<p class="brand">RA<b>CHA</b></p>${off || env ? `<span class="chip ${off ? '' : 'acc'}" style="padding:3px 8px;font-size:11px" title="${env} envio(s) na fila">${off ? 'sem internet' : 'enviando ' + env}</span>` : ''}<span class="sp"></span>
    <button class="ib" data-a="sheet" data-k="look" aria-label="Aparência">${ic('palette')}</button>
    <button class="ib" data-a="sheet" data-k="notif" aria-label="Notificações">${ic('bell')}${lsGet('pushToken') ? '' : '<span class="dot"></span>'}</button>
    <button class="ib me" data-a="sheet" data-k="profile" aria-label="Perfil">${av(me(), 44)}</button>`;
}
function renderNav() {
  const n = $('#nav');
  if (!S.sessao) { n.innerHTML = ''; n.hidden = true; return; }
  n.hidden = false;
  const T = [['hoje', 'Hoje', 'sun'], ['dieta', 'Dieta', 'bowl'], ['treino', 'Treino', 'dumbbell'], ['habitos', 'Hábitos', 'check'], ['racha', 'Racha', 'shield']];
  n.innerHTML = T.map(([k, l, i]) => `<button class="${S.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}" aria-current="${S.tab === k ? 'page' : 'false'}">${ic(i, 20)}${l}</button>`).join('');
}
const SCR = { hoje: scrHoje, dieta: scrDieta, treino: scrTreino, habitos: scrHabitos, racha: scrRacha };
/* A sincronização redesenha a tela a cada 30 s: o campo em que a pessoa está digitando volta com o texto, o cursor e o teclado. */
function campoEmFoco(root) {
  const a = document.activeElement;
  if (!a || !a.id || !root.contains(a) || !/^(INPUT|TEXTAREA)$/.test(a.tagName) || /^(file|checkbox|radio|range|button|submit)$/.test(a.type)) return null;
  let s = null, e = null; try { s = a.selectionStart; e = a.selectionEnd; } catch (x) { /* campo sem cursor */ }
  return { id: a.id, v: a.value, s, e };
}
function devolverFoco(root, c) {
  if (!c) return; const a = root.querySelector('#' + CSS.escape(c.id)); if (!a) return;
  a.value = c.v; a.focus({ preventScroll: true }); try { if (c.s != null) a.setSelectionRange(c.s, c.e); } catch (x) { /* campo sem cursor */ }
}
function render(keep = true) {
  const m = $('#main'); if (!m) return; const y = m.scrollTop, foco = campoEmFoco(m);
  try { m.innerHTML = S.sessao ? SCR[S.tab]() : telaLogin(); }
  catch (e) { console.error(e); m.innerHTML = `<div class="note warn"><span>Algo deu errado nesta tela: ${esc(e.message)}. Toque em outra aba ou feche e abra o app.</span></div>`; }
  m.scrollTop = keep ? y : 0; devolverFoco(m, foco); renderNav(); renderTop();
  if (S.comboOpen != null) { const q = $('#comboq'); if (q) { q.focus({ preventScroll: true }); q.setSelectionRange(q.value.length, q.value.length); q.closest('.panel').scrollIntoView({ block: 'nearest' }); } }
}
function renderSheet() {
  const L = $('#layer'); if (!S.sheet) { L.innerHTML = ''; return; }
  const k = S.sheet.k, prev = L.querySelector('.sheet'), same = prev && prev.dataset.k === k, y = same ? prev.scrollTop : 0, foco = same ? campoEmFoco(L) : null;
  let html;
  try { html = SH[k](S.sheet); } catch (e) { console.error(e); html = head('Ops', 'Algo deu errado') + `<div class="note warn"><span>${esc(e.message)}</span></div>`; }
  L.innerHTML = `<div class="scrim" data-a="close"></div><div class="sheet ${k === 'ana' ? 'full' : ''}" data-k="${k}" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  const nw = L.querySelector('.sheet'); if (y) nw.scrollTop = y; if (same) nw.style.animation = 'none'; devolverFoco(L, foco);
  if (k === 'photo' && S.sheet.stage === 'edit') bindCrop();
}
function openSheet(o) { S.sheet = o; renderSheet(); }
function closeSheet() { S.sheet = null; renderSheet(); }
let tT; function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.hidden = false; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; clearTimeout(tT); tT = setTimeout(() => t.hidden = true, ms || 2800); }
function startRest() {
  clearInterval(S.restT); const end = Date.now() + S.rest * 1000, el = $('#restbar'); el.hidden = false;
  const draw = () => { const r = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    el.innerHTML = `<b>${pace(r)}</b><div class="grow"><span class="tiny" style="font-weight:700">Descanso</span>${bar(S.rest - r, S.rest, 'var(--accent)')}</div><button class="btn sm" data-a="skiprest">Pular</button>`;
    if (r <= 0) { clearInterval(S.restT); el.hidden = true; toast('Bora pra próxima série'); try { navigator.vibrate && navigator.vibrate(200); } catch (e) { } } };
  draw(); S.restT = setInterval(draw, 500);
}
function setTheme(k) { S.theme = k; $('#app').dataset.theme = k; lsSet('theme', k); document.querySelector('meta[name=theme-color]').content = { a: '#F4EFF8', b: '#FFFDF4', c: '#0B1020' }[k]; render(); if (S.sheet) renderSheet(); baixarFotosCards(); }

/* ============ login ============ */
function telaLogin() {
  const L = S.login || { modo: 'entrar' }, novo = L.modo === 'novo';
  return `<div class="login">
    <div class="center" style="padding:18px 0 6px">${pcard({ id: 'x', name: L.nome || 'Você', team: 'A', pos: 'MEI', lvl: 1, ovr: '??', attrs: { RIT: '?', FOR: '?', RES: '?', CON: '?', NUT: '?', HAB: '?' } }, 'md')}</div>
    <h1 class="display" style="text-align:center">Treino, dieta e hábitos <span class="mark">valendo gol.</span></h1>
    <div class="seg" role="tablist"><button role="tab" class="${novo ? '' : 'on'}" aria-selected="${!novo}" data-a="loginmodo" data-v="entrar">Entrar</button><button role="tab" class="${novo ? 'on' : ''}" aria-selected="${novo}" data-a="loginmodo" data-v="novo">Primeiro acesso</button></div>
    <form data-f="login" class="stack" autocomplete="on">
      ${novo ? inp('lconvite', 'Código de convite do grupo', L.convite || '', 'autocapitalize="characters" autocomplete="off" placeholder="Ex.: K7X2QM"') : ''}
      ${inp('lnome', novo ? 'Seu nome (como o grupo vai te ver)' : 'Seu nome', L.nome || '', 'autocomplete="username" autocapitalize="words" maxlength="24"')}
      ${inp('lpin', novo ? 'Crie um PIN (4 a 8 números)' : 'PIN', '', `type="password" inputmode="numeric" autocomplete="${novo ? 'new-password' : 'current-password'}" maxlength="8"`)}
      ${L.erro ? `<div class="note warn"><span>${esc(L.erro)}</span></div>` : ''}
      <button class="btn block" type="submit" ${L.ocupado ? 'disabled' : ''}>${L.ocupado ? 'Entrando…' : novo ? 'Criar meu jogador' : 'Entrar'}</button>
    </form>
    ${novo ? '<p class="tiny muted">Seu PIN fica guardado de forma cifrada. Se esquecer, quem administra o grupo redefine.</p>' : ''}
    ${!CFG.api ? `<details class="small"><summary class="muted">Endereço do servidor</summary>${inp('lapi', 'URL /exec do Apps Script', apiUrl(), 'autocomplete="off"')}</details>` : ''}
  </div>`;
}
async function enviarLogin() {
  const L = S.login, novo = L.modo === 'novo', v = id => ($('#' + id) || {}).value || '';
  L.nome = v('lnome').trim(); L.convite = novo ? v('lconvite').trim() : L.convite;
  if ($('#lapi') && v('lapi').trim()) lsSet('api', v('lapi').trim());
  const pin = v('lpin').trim();
  if (!L.nome || !pin || (novo && !L.convite)) { L.erro = 'Preencha todos os campos.'; render(); return; }
  L.erro = ''; L.ocupado = true; render();
  try {
    const r = await api(novo ? 'cadastro' : 'login', { nome: L.nome, pin, convite: L.convite, aparelho: navigator.userAgent.slice(0, 110) }, { timeout: 60000 });
    await entrarCom(r);
    S.login = null; S.tab = 'hoje'; history.replaceState(null, '', location.pathname);
    render(false); baixarFotosCards(); carregarReceitas();
    if (novo) toast(`Bem-vindo ao ${(S.G || {}).nome || 'racha'}. Você está no ${teamName(myTeam())}.`, 4000);
  } catch (e) { L.ocupado = false; L.erro = e.message; render(); }
}

/* ============ fotos ============ */
function lerArquivo(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
async function comprimir(file, max = 1280, q = .74) {
  const url = await lerArquivo(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
function schedulePreviewsSafe() { if (typeof schedulePreviews === 'function') schedulePreviews(); }

/* ============ lances do dia ============ */
function doMeal(id, photo) { const m = S.meals.find(x => x.id === id); if (!m) return;
  m.items.forEach(it => S.log.push({ ...it, subs: undefined, meal: m.id })); m.done = true; m.photo = !!photo;
  mealEvent(m, photo); const nx = S.meals.find(x => !x.done); S.logMeal = nx ? nx.id : 'extra';
  toast(regras().photo && !photo ? `${m.name} registrado · sem foto não pontua` : `${m.name} registrado · +5 pts`); addXP(15); checkMacros(); render(); }
function evFinalize(photo) { const s = S.sheet; closeSheet();
  if (s.what === 'meal') { doMeal(s.id, photo); return; }
  const h = S.habits[s.i]; if (h.type !== 'count') { h.val = 1; addXP(10); } h.photo = !!photo; habitEvent(photo); render();
  toast(photo ? 'Hábito comprovado: conta no placar' : 'Marcado só para sua sequência'); }
/* Um lance por refeição por dia (chave ref-<id>): lançar de novo atualiza o mesmo lance; reabrir ou pular apaga. */
const idLanceRefeicao = m => S.eu + '-' + S.day + '-ref-' + m.id;
function mealEvent(m, photo) {
  const id = idLanceRefeicao(m), n = S.events.filter(e => e.who === 'u' && e.kind === 'refeicao' && e.day === S.day && e.id !== id).length; if (n >= 5) return;
  pushEvent(`${m.name} dentro do plano`, 5, 'ref-' + m.id, [['Refeição dentro do plano × 1', 5]], { kind: 'refeicao', ev: photo ? 'foto' : null, photo: photo || null }); }
function mealEventDel(m) {
  const id = idLanceRefeicao(m), cid = S.day + '-ref-' + m.id; if (!S.evMap.has(id)) return;
  S.evMap.delete(id); reordenarEventos();
  S.fila = S.fila.filter((f, i) => !(i > 0 && f.acao === 'lancar' && f.dados.ev.id === cid)); enfileirar('excluirEvento', { id });
}
/* Gramas de um item lançado: campo g ou o número antes de "g" no texto ("150 g · Frango", "Pão (50 g)"). */
function gramasItem(it) { if (+it.g > 0) return +it.g; const x = String(it.label).match(/(\d+(?:[.,]\d+)?)\s*g\b/); return x ? parseFloat(x[1].replace(',', '.')) : null; }
function proximaRefeicao() { const nx = S.meals.find(x => !x.done); S.logMeal = nx ? nx.id : 'extra'; }
/* foto: a foto que acabou de comprovar um hábito (vai junto com o lance; o servidor guarda a última). */
function habitEvent(foto) {
  const dn = S.habits.filter(habDone), perfect = S.habits.length > 0 && dn.length === S.habits.length, prev = S.flags.perfect;
  const id = S.eu + '-' + S.day + '-hab';
  if (!dn.length) {
    if (S.evMap.has(id)) { S.evMap.delete(id); reordenarEventos(); S.fila = S.fila.filter((f, i) => !(i > 0 && f.acao === 'lancar' && f.dados.ev.id === S.day + '-hab')); enfileirar('excluirEvento', { id }); }
    S.flags.perfect = false; marcarMudanca(); return;
  }
  const hn = {}; dn.forEach(h => hn[h.id] = h.name.split(' ·')[0]);
  pushEvent(perfect ? `Dia perfeito: ${dn.length} hábitos` : `${dn.length} hábito${dn.length === 1 ? '' : 's'} marcado${dn.length === 1 ? '' : 's'} hoje`, dn.length * 5 + (perfect ? 15 : 0), 'hab', null,
    { kind: 'habitos', habs: dn.map(h => h.id), hp: dn.filter(h => h.photo).map(h => h.id), perfect, hn, photo: foto || null });
  if (perfect && !prev) { S.flags.perfect = true; toast('Dia perfeito. +15 pts pro time'); addXP(40); }
  if (!perfect) S.flags.perfect = false;
}
function checkMacros() {
  if (!S.goals) return;
  const c = consumed(), g = S.goals, ok = Math.abs(c.kcal - g.kcal) <= g.kcal * .1 && c.p >= g.p * .9 && c.c <= g.c * 1.1 && c.f <= g.f * 1.1;
  if (ok && !S.flags.macros) { S.flags.macros = true; const dn = S.meals.filter(m => m.done && !m.skip);
    pushEvent('Fechou os macros do dia', 25, 'macros', [['Dia dentro dos macros', 25]], { kind: 'macros', ev: dn.length && dn.every(m => m.photo) ? 'foto' : null }); addXP(50); toast('Macros fechados. +25 pts'); }
}
function addItensLog(itens, meal) { itens.forEach(it => S.log.push({ label: it.label, food: it.food || it.label, kcal: +it.kcal || 0, p: +it.p || 0, c: +it.c || 0, f: +it.f || 0, meal })); }
async function lerComida(txt) {
  const { ok, miss } = parseFood(txt);
  if (!miss.length || !(S.G && S.G.ia) || !navigator.onLine) return { itens: ok, nao: miss };
  S.iaOcupada = true; render(); if (S.sheet) renderSheet();
  try { const r = await api('ia', { tipo: 'comida', texto: txt }, { timeout: 60000 }); return { itens: r.itens, nao: r.nao || [], ia: true }; }
  catch (e) { toast(e.message); return { itens: ok, nao: miss }; }
  finally { S.iaOcupada = false; }
}
function ehFotoValida(d) { return typeof d === 'string' && d.startsWith('data:image'); }

/* ============ ações ============ */
const A = {
  tab: d => { S.tab = d.v; S.editHab = false; render(false); },
  go: d => { S.tab = d.tab; if (d.dv) S.dv = d.dv; if (d.tv) S.tv = d.tv; if (d.rv) S.rv = d.rv; closeSheet(); render(false); },
  gotreino: d => { S.active = d.v; S.editWk = false; S.tab = 'treino'; S.tv = 'sessao'; render(false); },
  seg: d => { S[d.k] = d.v; render(false); },
  sheet: d => openSheet({ k: d.k, id: d.id, i: d.i != null ? +d.i : undefined, v: d.v }),
  close: () => { const k = S.sheet && S.sheet.k; closeSheet(); if (['day', 'addex', 'wklist', 'mealedit', 'mealog', 'goals'].includes(k)) render(); }, toast: d => toast(d.v), nextover: () => nextOver(),
  fecharpassos: () => { S.steps.fechado = true; render(); },
  settheme: d => { setTheme(d.v); toast(`Aparência ${d.v.toUpperCase()} · ${THEMES[d.v].name}`); },
  photo: () => { openSheet({ k: 'photo', stage: PH.src ? 'edit' : 'pick' }); initFD().then(() => initSeg()).catch(() => { }); },
  zoom: d => { zoomBy(+d.v); drawCrop(); schedulePreviewsSafe(); },
  autocrop: () => { autoCrop(); drawCrop(); schedulePreviewsSafe(); },
  savephoto: () => { if (!PH.prev.a) genPreviews(); S.carica = { ...PH.prev }; idb.set('kv', 'carica', S.carica).catch(() => { });
    enfileirar('fotoCard', { a: S.carica.a, b: S.carica.b, c: S.carica.c }); closeSheet(); render(); queue({ type: 'newcard' }); },
  // dieta
  logmeal: d => { S.logMeal = d.id; render(); },
  other: d => { S.logMeal = d.id; render(); const i = $('#logtxt'); i.focus(); i.scrollIntoView({ block: 'center' }); },
  ateplan: d => { if (regras().photo) openSheet({ k: 'evid', what: 'meal', id: d.id }); else doMeal(d.id, null); },
  mealdone: d => { const m = S.meals.find(x => x.id === d.id); m.done = true; const nx = S.meals.find(x => !x.done); S.logMeal = nx ? nx.id : 'extra'; toast(`${m.name} registrado fora do plano. Conta para o NUT, não para o placar.`); checkMacros(); render(); },
  mealskip: d => { const m = S.meals.find(x => x.id === d.id); if (!m) return;
    S.log = S.log.filter(i => i.meal !== m.id); m.done = true; m.skip = true; m.photo = null; mealEventDel(m); proximaRefeicao();
    toast(`${m.name}: marcada como pulada`); render(); },
  mealreopen: d => { const m = S.meals.find(x => x.id === (d.id || (S.sheet && S.sheet.id))); if (!m) return;
    S.log = S.log.filter(i => i.meal !== m.id); m.done = false; m.skip = false; m.photo = null; mealEventDel(m); S.logMeal = m.id;
    closeSheet(); toast(`${m.name} reaberta`); render(); },
  logdel: d => { const it = S.log[+d.li]; if (!it) return; S.log.splice(+d.li, 1); toast(`Removido: ${it.label}`); renderSheet(); },
  mealogok: () => { closeSheet(); checkMacros(); render(); },
  undolog: () => { const it = S.log.pop(); if (it) toast(`Desfeito: ${it.label}`); render(); },
  evskip: () => evFinalize(null),
  viewev: d => openSheet({ k: 'viewev', id: d.id }),
  rn: d => { const r = RECIPES.find(x => x.id === S.sheet.id), st = r.yieldN > 1 ? 1 : .5; S.sheet.n = clamp(+(S.sheet.n + +d.v).toFixed(1), st, r.yieldN * 2); renderSheet(); },
  rmeal: d => { S.sheet.meal = d.id; renderSheet(); },
  logrecipe: () => { const s = S.sheet, r = RECIPES.find(x => x.id === s.id), n = s.n;
    S.log.push({ label: `${fmt(n, n % 1 ? 1 : 0)} ${plu(r.portion, n)} · ${r.n}`, food: r.n, kcal: r.m.kcal * n, p: r.m.p * n, c: r.m.c * n, f: r.m.f * n, meal: s.meal });
    if (s.meal !== 'extra') { const m = S.meals.find(x => x.id === s.meal); if (m && !m.done) { m.done = true; mealEvent(m, null); } }
    closeSheet(); toast(regras().photo && s.meal !== 'extra' ? `${r.n} registrado · sem foto não pontua no modo competitivo` : `${r.n} registrado`); addXP(15); checkMacros(); S.tab = 'dieta'; S.dv = 'hoje'; render(false); },
  doswap: d => { const m = S.meals.find(x => x.id === S.sheet.id), i = S.sheet.i, cur = m.items[i], o = swapsFor(cur)[+d.i];
    const novo = { ...o.it, subs: [{ ...cur, subs: undefined }, ...(cur.subs || []).filter(x => x.label !== o.it.label)] }; m.items[i] = novo; closeSheet(); toast(`${cur.food || cur.label} trocado por ${novo.food || novo.label}`); render(); },
  altswap: d => { const m = S.meals.find(x => x.id === d.id), a = m.alts[+d.i], old = m.items; m.items = a.items; m.alts[+d.i] = { name: 'Opção anterior', items: old }; toast('Opção trocada'); render(); },
  dietok: () => { const s = S.sheet, p = s.plano, v = k => Math.max(0, Math.round(parseFloat(String(($('#pg-' + k) || {}).value || '').replace(',', '.')) || p.goals[k]));
    S.goals = { kcal: v('kcal'), p: v('p'), c: v('c'), f: v('f') };
    S.meals = p.meals.map((m, i) => ({ id: 'm' + i + uidNovo().slice(-3), name: m.name, time: m.time, items: m.items, alts: m.alts || [], done: false, photo: null }));
    S.dietMeta = { prof: p.prof, file: s.file, date: S.day, fonte: p.fonte, obs: p.obs };
    S.log.forEach(it => { if (it.meal !== 'extra') it.meal = 'extra'; });
    S.logMeal = S.meals[0] ? S.meals[0].id : 'extra'; closeSheet(); S.tab = 'dieta'; S.dv = 'plano'; toast('Plano salvo. Confira as refeições.'); render(false); },
  goalsok: () => { const v = id => Math.max(0, Math.round(parseFloat(String(($('#' + id) || {}).value || '').replace(',', '.')) || 0));
    const g = { kcal: v('gk'), p: v('gp'), c: v('gc'), f: v('gf') }; if (g.kcal < 800) { toast('Confira as calorias'); return; }
    S.goals = g; if (!S.dietMeta) S.dietMeta = { prof: '', date: S.day, fonte: 'manual', obs: [] }; closeSheet(); S.tab = 'dieta'; S.dv = 'plano'; render(false); toast(S.meals.length ? 'Metas atualizadas' : 'Metas salvas. Agora adicione as refeições.'); },
  newmeal: () => { const m = { id: 'm' + uidNovo(), name: 'Nova refeição', time: '12:00', items: [], alts: [], done: false }; S.meals.push(m); S.meals.sort((a, b) => a.time.localeCompare(b.time)); openSheet({ k: 'mealedit', id: m.id }); },
  mealdel: () => { const id = S.sheet.id; S.meals = S.meals.filter(m => m.id !== id); closeSheet(); render(); toast('Refeição excluída'); },
  itemdel: d => { const m = S.meals.find(x => x.id === S.sheet.id); m.items.splice(+d.i, 1); renderSheet(); },
  pmeal: d => { S.sheet.meal = d.id; renderSheet(); },
  platedel: d => { S.sheet.itens.splice(+d.i, 1); renderSheet(); },
  plateok: () => { const s = S.sheet, meal = s.meal; addItensLog(s.itens, meal);
    if (meal !== 'extra') { const m = S.meals.find(x => x.id === meal); if (m && !m.done) { m.done = true; m.photo = true; mealEvent(m, s.img); } }
    closeSheet(); toast(meal === 'extra' ? 'Prato registrado' : 'Prato registrado · a foto vale como evidência'); addXP(15); checkMacros(); render(); },
  // treino
  coach: d => { if (d.v === 'ok') { Object.entries(S.sug).forEach(([k, x]) => Object.entries(x).forEach(([n, kg]) => { const e = W[k] && W[k].ex.find(y => y.n === n); if (e) e.kg = kg; })); S.sess = {}; toast('Cargas atualizadas no plano'); } else toast('Plano mantido'); S.sug = {}; render(); },
  openday: d => openSheet({ k: 'day', i: +d.i }),
  daytype: d => { const w = S.week[S.sheet.i]; w.type = d.v; if (d.v === 'musc' && !W[w.key]) w.key = Object.keys(W)[0]; if (d.v === 'run' && !w.rt) w.rt = 'Rodagem'; if (d.v === 'sport' && !SPORTS.some(x => x.n === w.title)) w.title = SPORTS[0].n; refreshDay(w); renderSheet(); },
  daywk: d => { const w = S.week[S.sheet.i]; w.key = d.v; refreshDay(w); renderSheet(); },
  dayrun: d => { const w = S.week[S.sheet.i]; w.rt = d.v; refreshDay(w); renderSheet(); },
  daysport: d => { const w = S.week[S.sheet.i]; w.title = d.v; refreshDay(w); renderSheet(); },
  dayopen: () => { const w = S.week[S.sheet.i]; S.active = w.key; S.editWk = false; S.tv = 'sessao'; closeSheet(); render(false); },
  dayedit: () => { const w = S.week[S.sheet.i]; S.active = w.key; S.editWk = true; S.tv = 'sessao'; closeSheet(); render(false); },
  daynewwk: () => { const id = newWorkout(); const w = S.week[S.sheet.i]; w.key = id; refreshDay(w); S.active = id; S.editWk = true; S.tv = 'sessao'; closeSheet(); render(false); toast('Treino criado. Adicione os exercícios.'); },
  dayswap: d => { const a = S.week[S.sheet.i], b = S.week[+d.v], F = ['type', 'key', 'title', 'det', 'rt', 'km', 'zone', 'note'];
    F.forEach(f => { const t = a[f]; a[f] = b[f]; b[f] = t; }); S.weekEdited = true; toast(`${a.d} e ${b.d} trocados`); renderSheet(); },
  weekreset: () => { S.week = JSON.parse(JSON.stringify(S.weekOrig)); S.weekEdited = false; render(); toast('Plano sugerido restaurado'); },
  wkopen: d => { S.active = d.v; S.editWk = false; S.tv = 'sessao'; closeSheet(); render(false); },
  editwk: d => { S.editWk = d.v === '1'; S.comboOpen = null; if (!S.editWk) { syncSess(S.active); S.week.forEach(w => { if (w.type === 'musc' && w.key === S.active) refreshDay(w); }); toast('Treino salvo'); } render(false); },
  newwk: () => { const id = newWorkout(); S.active = id; S.editWk = true; S.tv = 'sessao'; S.tab = 'treino'; closeSheet(); render(false); toast('Treino criado. Adicione os exercícios.'); },
  delwk: () => { const k = S.active; delete W[k]; delete S.sess[k]; S.week.forEach(w => { if (w.type === 'musc' && w.key === k) { w.type = 'rest'; refreshDay(w); } }); S.active = Object.keys(W)[0]; S.editWk = false; render(false); toast('Treino excluído. Os dias que usavam ele viraram descanso.'); },
  exmove: d => { const ex = W[S.active].ex, i = +d.i, j = i + +d.v; if (j < 0 || j >= ex.length) return; [ex[i], ex[j]] = [ex[j], ex[i]]; render(); },
  exdel: d => { const e = W[S.active].ex.splice(+d.i, 1)[0]; toast(`${e.n} removido`); render(); },
  exsets: d => { const e = W[S.active].ex[+d.i]; e.sets = clamp(e.sets + +d.v, 1, 10); render(); },
  pickex: d => { const src = LIB.find(e => e.n === d.v); const e = JSON.parse(JSON.stringify(src)); e.kg = 0; e.m = (EX_EQUIP[e.anim] || [])[0] || e.m; W[S.active].ex.push(e); closeSheet(); render(); toast(`${src.n} adicionado`); },
  customex: () => { const n = (S.sheet.q || '').trim(); if (!n) return; const e = { n, anim: null, mus: 'Personalizado', m: '', sets: 3, reps: 12, kg: 0, cues: ['Combine a execução com seu professor.'], err: '', q: n + ' execução' };
    LIB.push(e); W[S.active].ex.push(JSON.parse(JSON.stringify(e))); closeSheet(); render(); toast(`${n} criado`); },
  combo: d => { S.comboOpen = +d.ex; S.comboQ = ''; render(); },
  pickeq: d => { setEquip(+d.ex, d.v); render(); },
  addeq: d => { const n = (S.comboQ || '').trim(); if (!n) return; if (!S.customEquip.includes(n)) S.customEquip.unshift(n); setEquip(+d.ex, n); render(); toast(`${n} adicionado à sua lista de aparelhos`); },
  animspeed: () => { animSpeed = animSpeed === 1 ? .45 : 1; renderSheet(); },
  animpause: () => { animPaused = !animPaused; renderSheet(); },
  rf: d => { S.rf[d.k] = d.v; S.rlim = 20; render(); },
  rft: d => { S.rf[d.k] = !S.rf[d.k]; S.rlim = 20; render(); },
  rfs: () => { S.rf.sort = S.rf.sort === 'p' ? 'fit' : 'p'; render(); },
  recmore: () => { S.rlim += 20; render(); },
  switchwk: d => { S.active = d.k; S.editWk = false; S.comboOpen = null; render(false); },
  setrest: d => { S.rest = +d.v; render(); },
  set: d => { const k = S.active, e = W[k].ex[+d.ex], st = ensureSess(k)[+d.ex], s = st.sets[+d.s]; s.done = !s.done;
    if (s.done) { const best = melhorDe(e.n), e1 = s.kg > 0 ? e1rm(s.kg, s.reps) : 0, pr = best > 0 && e1 > best * 1.001; s.pr = pr;
      if (pr) toast(`Recorde pessoal no ${e.n.toLowerCase()}: ${fmt(s.kg, s.kg % 1 ? 1 : 0)} kg × ${s.reps}`); startRest(); } else s.pr = false;
    st.prs = st.sets.some(x => x.pr) ? 1 : 0; render(); },
  skiprest: () => { clearInterval(S.restT); $('#restbar').hidden = true; },
  togpost: () => { S.sheet.post = S.sheet.post === false; renderSheet(); },
  fmin: d => { S.sheet.min = +d.v; renderSheet(); },
  finish: () => { const k = S.active, ss = ensureSess(k), w = W[k], s = S.sheet, r = resumoSessao(k), h = hd();
    const sug = {};
    w.ex.forEach((e, i) => { const st = ss[i], feitas = st.sets.filter(x => x.done && x.kg > 0);
      if (feitas.length) { const top = Math.max(...feitas.map(x => e1rm(x.kg, x.reps))); (S.loads[e.n] = S.loads[e.n] || []).push([S.day, Math.round(top * 10) / 10]);
        if (!e.kg) e.kg = Math.max(...feitas.map(x => x.kg));
        const tudo = st.sets.length && st.sets.every(x => x.done && x.reps >= e.reps && x.kg >= e.kg);
        if (tudo && e.kg) sug[e.n] = e.kg + (e.kg <= 20 ? 1 : e.kg <= 60 ? 2.5 : 5); } });
    if (Object.keys(sug).length) S.sug[k] = sug; else delete S.sug[k];
    S.done[k] = { sets: r.sets, vol: r.vol, prs: r.prs, photo: !!s.photo }; closeSheet(); clearInterval(S.restT); $('#restbar').hidden = true;
    h.trained = true; h.sets = (h.sets || 0) + r.sets; h.setsPlan = (h.setsPlan || 0) + ss.reduce((a, e) => a + e.sets.length, 0); h.prs = (h.prs || 0) + r.prs; h.min = (h.min || 0) + s.min; if (s.min >= 60) h.longas = (h.longas || 0) + 1;
    const txt = `${w.name} · ${w.sub} concluído${r.prs ? ` com ${r.prs} PR${r.prs > 1 ? 's' : ''}` : ''}`;
    if (s.post !== false) { const cid = uidNovo(), texto = `${w.name} · ${w.sub} concluído. ${fmt(r.vol)} kg de volume${r.prs ? `, ${r.prs} PR${r.prs > 1 ? 's' : ''}` : ''}.`;
      S.feed.unshift({ id: S.eu + '-' + cid, who: 'u', ts: Date.now(), text: texto, scene: 'dumbbell', photo: s.photo || null, reacoes: { like: [], fire: [] }, coments: [], pending: true });
      enfileirar('postar', { id: cid, texto, cena: 'dumbbell', foto: s.photo || null }); }
    pushEvent(txt, 50 + Math.min(r.prs, 3) * 10, null, [['Treino de musculação concluído', 50], ...(r.prs ? [['Recorde pessoal × ' + Math.min(r.prs, 3), Math.min(r.prs, 3) * 10]] : [])], { kind: 'treino', ev: s.photo ? 'foto' : null, photo: s.photo || null, vol: Math.round(r.vol), prs: r.prs, min: s.min });
    addXP(120 + r.prs * 30, r.prs ? 'Recorde pessoal conta para o FOR.' : ''); toast('Treino concluído'); render(); },
  sdur: d => { S.sheet.dur = +d.v; renderSheet(); },
  logsport: () => { const s = S.sheet, h = hd(); S.sportsLog.unshift({ sport: s.v, dur: s.dur, pse: s.pse, day: S.day });
    h.trained = true; h.sport = true; h.min = (h.min || 0) + s.dur; if (s.dur >= 60) h.longas = (h.longas || 0) + 1;
    closeSheet(); pushEvent(`${s.v} · ${s.dur} min`, 35, null, [['Corrida ou outro esporte', 35]], { kind: 'esporte', ev: s.photo ? 'foto' : null, photo: s.photo || null, min: s.dur }); addXP(60); toast(`${s.v} registrado. +35 pts`); render(); },
  runrt: d => { S.sheet.rt = d.v; renderSheet(); },
  logrun: () => { const s = S.sheet, km = parseFloat(String(s.km || ($('#runkm') || {}).value || '').replace(',', '.')), sec = parseTempo(s.tempo || ($('#runtempo') || {}).value);
    if (!(km > 0 && km < 300) || !(sec > 60)) { toast('Preencha distância e tempo'); return; }
    const fc = parseInt(s.fc, 10) || null, h = hd();
    S.runs.push({ day: S.day, ts: Date.now(), km, sec, fc, rt: s.rt, ev: !!s.photo });
    h.trained = true; h.runs = (h.runs || 0) + 1; h.km = (h.km || 0) + km; h.min = (h.min || 0) + Math.round(sec / 60); if (sec >= 3600) h.longas = (h.longas || 0) + 1;
    closeSheet(); pushEvent(`${s.rt} de ${fmt(km, 1)} km · ${pace(sec / km)}/km`, 35, null, [['Corrida ou outro esporte', 35]], { kind: 'corrida', ev: s.photo ? 'foto' : null, photo: s.photo || null, km, sec });
    addXP(60); toast(`Corrida registrada. +35 pts`); S.tab = 'treino'; S.tv = 'corrida'; render(false); },
  // hábitos
  hcheck: d => { const h = S.habits[+d.i]; if (!h.val && regras().photo && N_habConta(regras(), h.id)) { openSheet({ k: 'evid', what: 'habit', i: +d.i }); return; }
    h.val = h.val ? 0 : 1; if (!h.val) h.photo = null; if (h.val) addXP(10); habitEvent(); render(); },
  hcount: d => { const h = S.habits[+d.i], was = h.val >= h.target; h.val = clamp(h.val + +d.v, 0, 30); if (h.val < h.target) h.photo = null;
    if (!was && h.val >= h.target) { addXP(10); if (regras().photo && N_habConta(regras(), h.id)) { render(); openSheet({ k: 'evid', what: 'habit', i: +d.i }); return; } toast(`${h.name}: meta do dia batida`); }
    if (was !== (h.val >= h.target)) habitEvent(); render(); },
  greencard: () => toast('Cartão verde protege sua sequência num dia sem lance. Ganhe 1 a cada semana em que treinar todos os dias do plano (máximo 3).', 4500),
  hic: d => { S.sheet.ic = d.v; renderSheet(); }, htype: d => { S.sheet.type = d.v; renderSheet(); }, htarget: d => { S.sheet.target = clamp(S.sheet.target + +d.v, 1, 30); renderSheet(); },
  addhabit: () => { const s = S.sheet, n = (s.name || '').trim(); if (!n) { toast('Dê um nome ao hábito'); return; }
    if (S.habits.length >= N_LIMITES.habitos) { toast(`Máximo de ${N_LIMITES.habitos} hábitos. Apague um para criar outro.`); return; }
    S.habits.push({ id: 'h' + uidNovo(), name: n.slice(0, 40), ic: s.ic, type: s.type, target: s.target, val: 0, streak: 0, wk: [0, 0, 0, 0, 0, 0], photo: null }); closeSheet(); toast(`${n} adicionado`); render(); },
  edithab: () => { S.editHab = !S.editHab; render(); },
  delhabit: d => { const h = S.habits.splice(+d.i, 1)[0]; toast(`${h.name} removido`); if (habDone(h)) habitEvent(); render(); },
  // racha
  narrate: () => { const tl = $('#tl'); tl.classList.remove('play'); void tl.offsetWidth; tl.classList.add('play'); tl.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  var: d => { const e = S.evMap.get(d.id); if (!e) return; e.var = 'aberto'; e.votos = { _em: Date.now(), [S.eu]: 'anular' }; enfileirar('chamarVar', { id: d.id }); toast('VAR chamado. O grupo tem 24 h para votar.'); renderSheet(); render(); },
  vote: d => { const e = S.evMap.get(d.id); if (!e) return; e.votos = { ...(e.votos || {}), [S.eu]: d.v }; enfileirar('votar', { id: d.id, voto: d.v }); toast('Voto registrado'); renderSheet(); },
  like: d => reagir(d.id, 'like'), fire: d => reagir(d.id, 'fire'),
  delpost: d => { S.feed = S.feed.filter(p => p.id !== d.id); enfileirar('excluirPost', { id: d.id }); render(); },
  postfotox: () => { S.postFoto = null; render(); },
  togcomp: () => { const R = regras(); salvarRegras({ ...R, photo: !R.photo }); toast(!R.photo ? 'Modo competitivo: só vale lance com evidência' : 'Modo competitivo desligado'); },
  toghab: d => { const R = regras(), hab = { ...R.hab }; hab[d.v] = !N_habConta(R, d.v); salvarRegras({ ...R, hab }); },
  salvartimes: () => { const v = id => (($('#' + id) || {}).value || '').trim(), times = {};
    ['A', 'B'].forEach(t => { times[t] = { nome: v('tn' + t) || teamName(t), sigla: (v('ts' + t) || teamShort(t)).toUpperCase().slice(0, 3) }; S.G.times[t] = times[t]; });
    enfileirar('grupo', { times }); toast('Nomes salvos'); render(); renderSheet(); },
  draft: () => { const arr = S.members.map(m => ({ m, o: person(m.id).ovr || 50 })).sort((a, b) => b.o - a.o), pat = Math.random() > .5 ? 'ABBA' : 'BAAB', times = {};
    arr.forEach((x, i) => { x.m.team = pat[i % 4]; times[x.m.realId] = x.m.team; }); const avg = t => { const l = arr.filter(x => x.m.team === t); return l.reduce((a, x) => a + x.o, 0) / (l.length || 1); };
    enfileirar('sortear', { times }); toast(`Times sorteados · OVR médio ${fmt(avg('A'), 1)} × ${fmt(avg('B'), 1)}`); closeSheet(); render(); },
  novoconvite: () => { enfileirar('grupo', { novoConvite: true }); toast('Gerando código novo… o antigo deixa de valer.'); },
  convidar: async () => { const txt = `Bora pro ${(S.G || {}).nome || 'racha'}? Treino, dieta e hábitos valendo gol. Abre no celular: ${linkConvite()} (código ${S.G.convite})`;
    try { if (navigator.share) { await navigator.share({ title: 'RACHA', text: txt }); return; } } catch (e) { return; }
    try { await navigator.clipboard.writeText(txt); toast('Convite copiado. Cole no WhatsApp do grupo.'); } catch (e) { prompt('Copie o convite:', txt); } },
  challenge: d => openSheet({ k: 'newch', vs: d.id }),
  chvs: d => { S.sheet.vs = d.v; renderSheet(); }, chm: d => { S.sheet.metric = d.v; renderSheet(); }, chd: d => { S.sheet.dias = +d.v; renderSheet(); },
  createch: () => { const s = S.sheet; if (!s.vs) return; enfileirar('desafiar', { para: realId(s.vs), metrica: s.metric, dias: s.dias, aposta: (s.bet || '').trim() || 'Só pela resenha' });
    closeSheet(); toast(`Desafio enviado para ${mem(s.vs).name}`); S.tab = 'racha'; S.rv = 'mano'; render(false); },
  chresp: d => { const c = S.challenges.find(x => x.id === d.id); if (c) { c.status = d.v === '1' ? 'ativo' : 'recusado'; if (d.v === '1') { c.inicio = hoje(); c.fim = somaDias(hoje(), c.dias - 1); } }
    enfileirar('responderDesafio', { id: d.id, aceitar: d.v === '1' }); toast(d.v === '1' ? 'Desafio aceito. Começa hoje.' : 'Desafio recusado'); render(); },
  chcancel: d => { S.challenges = S.challenges.filter(x => x.id !== d.id); enfileirar('responderDesafio', { id: d.id, cancelar: true }); render(); },
  // perfil
  sair: async () => { if (!confirm('Sair deste aparelho? Seus dados continuam salvos no grupo.')) return; await salvarNoServidor(true); try { await api('sair', {}); } catch (e) { } sairLocal(); },
  pinok: async () => { const a = ($('#pinatual') || {}).value, n = ($('#pinnovo') || {}).value;
    try { await api('trocarPin', { atual: a, novo: n }); closeSheet(); toast('PIN trocado'); } catch (e) { S.sheet.erro = e.message; renderSheet(); } },
  instalar: () => openSheet({ k: 'instalar' }),
  instalarja: async () => { if (!S.instalarEvt) return; S.instalarEvt.prompt(); await S.instalarEvt.userChoice.catch(() => { }); S.instalarEvt = null; closeSheet(); },
  togself: (d, el) => el.classList.toggle('on'),
  loginmodo: d => { S.login.modo = d.v; S.login.erro = ''; render(); },
  // anamnese
  ana: () => { S.anaTmp = { step: 0, d: S.ana ? JSON.parse(JSON.stringify(S.ana)) : { goal: [], mods: [], days: null, time: null, lvl: null, run: null, where: [], parq: Array(7).fill(null), age: null, fcmax: null } }; openSheet({ k: 'ana' }); },
  am: d => { const a = S.anaTmp.d[d.k], i = a.indexOf(d.v); i > -1 ? a.splice(i, 1) : a.push(d.v); renderSheet(); },
  a1: d => { S.anaTmp.d[d.k] = isNaN(+d.v) ? d.v : +d.v; renderSheet(); },
  aq: d => { S.anaTmp.d.parq[+d.i] = +d.v; renderSheet(); },
  astep: d => { S.anaTmp.step = clamp(S.anaTmp.step + +d.v, 0, 7); renderSheet(); const n = $('#layer .sheet'); if (n) n.scrollTop = 0; },
  areveal: () => { const d = S.anaTmp.d;
    if (S.user.base) { A.useplan(); return; }
    const base = { 'Nunca treinei': 52, 'Até 1 ano': 58, '1 a 3 anos': 64, 'Mais de 3 anos': 70 }[d.lvl] || 58, rb = { 'Não corro': -8, 'Corro até 5 km': 0, 'Corro 10 km': 5, 'Já corri meia ou mais': 9 }[d.run] || 0;
    const at = { RIT: base + rb, FOR: base + (d.mods.includes('Musculação') ? 4 : -4), RES: base + (d.days >= 5 ? 4 : 0), CON: base - 2, NUT: base - 3, HAB: base - 1 }; KS.forEach(k => at[k] = clamp(at[k], 40, 85));
    S.user.base = at; if (!S.start || N_diasEntre(S.start, S.day) > 2) S.start = S.day;
    queue({ type: 'reveal', card: { ...me(), attrs: at, ovr: ovrOf(at), lvl: S.user.lvl, pos: posDe(at) } }); },
  useplan: () => { const d = S.anaTmp.d; ['A', 'B', 'C'].forEach(k => { if (!W[k]) W[k] = novosTreinos()[k]; });
    S.ana = d; S.week = genPlan(d); S.weekOrig = JSON.parse(JSON.stringify(S.week)); S.weekEdited = false;
    if (S.overOpen) nextOver(); closeSheet(); S.tab = 'treino'; S.tv = 'semana'; render(false); toast('Plano aplicado à semana. Mude o que quiser, dia a dia.'); },
};
function newWorkout() { const used = Object.keys(W); let id = 'D'; for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!used.includes(c)) { id = c; break; }
  W[id] = { name: 'Treino ' + id, sub: 'Novo', min: 45, ex: [] }; return id; }
function salvarRegras(R) { S.G.regras = R; enfileirar('grupo', { regras: R }); renderSheet(); render(); }
function reagir(id, tipo) { const p = S.feed.find(x => x.id === id); if (!p || p.pending) return; const l = p.reacoes[tipo] = p.reacoes[tipo] || [], i = l.indexOf(S.eu);
  if (i >= 0) l.splice(i, 1); else l.push(S.eu); enfileirar('reagir', { id, tipo }); render(); }

/* ============ eventos da tela ============ */
document.addEventListener('click', e => {
  if (S.comboOpen != null && !e.target.closest('.combo')) { S.comboOpen = null; S.comboQ = ''; render(); }
  const el = e.target.closest('[data-a]'); if (!el || el.tagName === 'A' || el.disabled) return;
  const fn = A[el.dataset.a]; if (!fn) return; e.preventDefault();
  try { const r = fn(el.dataset, el, e); if (r && r.catch) r.catch(x => toast(x.message)); } catch (x) { console.error(x); toast('Erro: ' + x.message); }
  if (S.sessao) marcarMudanca();
});
document.addEventListener('submit', async e => { e.preventDefault(); const f = e.target.dataset.f;
  if (f === 'login') { enviarLogin(); return; }
  if (f === 'log') { const inp = $('#logtxt'), v = inp.value.trim(); if (!v) { toast('Escreva o que comeu, com quantidade'); return; }
    const meal = S.logMeal, r = await lerComida(v);
    if (!r.itens.length) { toast(S.G && S.G.ia ? 'Não entendi. Tente "150g frango e 120g arroz"' : 'Não reconheci. Tente "150g frango e 120g arroz"'); render(); return; }
    inp.value = ''; inp.blur(); addItensLog(r.itens, meal); addXP(10);
    toast(`${r.itens.length} ${r.itens.length > 1 ? 'itens lançados' : 'item lançado'} · ${fmt(r.itens.reduce((a, i) => a + (+i.kcal || 0), 0))} kcal${r.nao.length ? ` · não entendi: ${r.nao.join(', ')}` : ''}`, 4000);
    checkMacros(); render(); marcarMudanca(); }
  if (f === 'mealadd') { const v = ($('#mealaddtxt') || {}).value.trim(); if (!v || !S.sheet) return; const id = S.sheet.id, r = await lerComida(v);
    if (!r.itens.length) { toast('Não reconheci esse alimento. Tente "150g frango".'); renderSheet(); return; }
    const ma = $('#mealaddtxt'); if (ma) { ma.value = ''; ma.blur(); } addItensLog(r.itens, id); if (r.nao.length) toast('Não entendi: ' + r.nao.join(', ')); renderSheet(); marcarMudanca(); }
  if (f === 'additem') { const v = ($('#itemtxt') || {}).value.trim(); if (!v) return; const m = S.meals.find(x => x.id === S.sheet.id), r = await lerComida(v);
    if (r.itens.length) { const ia = $('#itemtxt'); if (ia) { ia.value = ''; ia.blur(); } }
    r.itens.forEach(it => m.items.push({ label: it.label, food: it.food || it.label, kcal: +it.kcal || 0, p: +it.p || 0, c: +it.c || 0, f: +it.f || 0 }));
    if (!r.itens.length) toast('Não reconheci esse alimento.'); else if (r.nao.length) toast('Não entendi: ' + r.nao.join(', '));
    renderSheet(); marcarMudanca(); }
  if (f === 'post') { const v = $('#posttxt').value.trim(); if (!v && !S.postFoto) return; const cid = uidNovo();
    S.feed.unshift({ id: S.eu + '-' + cid, who: 'u', ts: Date.now(), text: v, photo: S.postFoto, reacoes: { like: [], fire: [] }, coments: [], pending: true });
    enfileirar('postar', { id: cid, texto: v, foto: S.postFoto || null }); S.postFoto = null; $('#posttxt').value = ''; $('#posttxt').blur(); render(); }
  if (f === 'coment') { const id = e.target.dataset.id, v = e.target.c.value.trim(); if (!v) return; const p = S.feed.find(x => x.id === id);
    e.target.c.value = ''; e.target.c.blur();
    if (p) p.coments = [...(p.coments || []), { who: S.eu, txt: v, ts: Date.now() }]; enfileirar('comentar', { id, texto: v }); render(); }
});
document.addEventListener('input', e => { const t = e.target, d = t.dataset; if (!d.i) return;
  const num = () => { const v = parseFloat(String(t.value).replace(',', '.')); return isNaN(v) ? 0 : v; };
  if (d.i === 'kg' || d.i === 'reps') ensureSess(S.active)[+d.ex].sets[+d.s][d.i] = num();
  else if (d.i === 'comboq') { S.comboQ = t.value; const L = $('#combolist'); if (L) L.innerHTML = comboItems(+d.ex); }
  else if (d.i === 'wkname') W[S.active].name = t.value || 'Treino'; else if (d.i === 'wksub') W[S.active].sub = t.value;
  else if (d.i === 'exreps' || d.i === 'exkg') W[S.active].ex[+d.ex][d.i === 'exreps' ? 'reps' : 'kg'] = num();
  else if (d.i === 'exq') { S.sheet.q = t.value; const L = $('#exlist'); if (L) L.innerHTML = exItems(t.value); }
  else if (d.i === 'recq') { S.rf.q = t.value; S.rlim = 20; const L = $('#reclist'); if (L) L.innerHTML = recList(); }
  else if (d.i === 'daykm' || d.i === 'dayzone' || d.i === 'daynote') { const w = S.week[S.sheet.i]; w[d.i.slice(3)] = t.value; refreshDay(w); }
  else if (d.i === 'pse') { S.sheet.pse = +t.value; const o = $('#pseval'); if (o) o.textContent = t.value; }
  else if (d.i === 'hname') S.sheet.name = t.value; else if (d.i === 'bet') S.sheet.bet = t.value;
  else if (d.i === 'runkm' || d.i === 'runtempo' || d.i === 'runfc') { S.sheet[d.i.slice(3)] = t.value; const km = parseFloat(String(S.sheet.km || '').replace(',', '.')), sec = parseTempo(S.sheet.tempo), o = $('#runpace'); if (o) o.innerHTML = km > 0 && sec > 0 ? `Pace: <b>${pace(sec / km)}/km</b>` : 'Preencha distância e tempo para ver o pace.'; }
  else if (d.i === 'logg') { const it = S.log[+t.dataset.li], g0 = it && gramasItem(it), g = parseFloat(String(t.value).replace(',', '.'));
    if (it && g0 && g > 0 && g <= 5000) { const k = g / g0; ['kcal', 'p', 'c', 'f'].forEach(x => it[x] = (+it[x] || 0) * k); it.g = g;
      it.label = /(\d+(?:[.,]\d+)?)\s*g\b/.test(it.label) ? it.label.replace(/(\d+(?:[.,]\d+)?)\s*g\b/, fmt(g) + ' g') : `${it.label} (${fmt(g)} g)`;
      const o = $('#mealtot'), its = S.log.filter(i => i.meal === S.sheet.id); if (o) o.textContent = `${fmt(its.reduce((a, i) => a + i.kcal, 0))} kcal · ${fmt(its.reduce((a, i) => a + i.p, 0))} g de proteína`; } }
  else if (d.i === 'rungoal') S.runGoal = t.value.slice(0, 80);
  else if (d.i === 'anaage') S.anaTmp.d.age = parseInt(t.value, 10) || null; else if (d.i === 'anafc') S.anaTmp.d.fcmax = parseInt(t.value, 10) || null;
  else if (d.i === 'mname' || d.i === 'mtime') { const m = S.meals.find(x => x.id === S.sheet.id); if (d.i === 'mname') m.name = t.value.slice(0, 40) || 'Refeição'; else { m.time = t.value || m.time; S.meals.sort((a, b) => a.time.localeCompare(b.time)); } }
  if (S.sessao) marcarMudanca();
});
document.addEventListener('change', async e => { const t = e.target, k = t.dataset.file; if (!k || !t.files || !t.files[0]) return; const file = t.files[0]; t.value = '';
  try {
    if (k === 'diet') {
      if (file.size > 15 * 1024 * 1024) { toast('Arquivo grande demais (máximo 15 MB).'); return; }
      // Alguns celulares entregam o PDF sem tipo: reconhece pela extensão
      const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const dados = pdf ? (await lerArquivo(file)).replace(/^data:[^;,]*/, 'data:application/pdf') : await comprimir(file, 2000, .85);
      openSheet({ k: 'upload', step: 'lendo', file: file.name, et: 0 });
      const timer = setInterval(() => { if (!S.sheet || S.sheet.k !== 'upload' || S.sheet.step !== 'lendo') { clearInterval(timer); return; } S.sheet.et++; renderSheet(); }, 7000);
      try { const r = await api('ia', { tipo: 'dieta', arquivo: dados }, { timeout: 330000 }); clearInterval(timer); if (S.sheet && S.sheet.k === 'upload') { S.sheet.step = 'ok'; S.sheet.plano = r.plano; renderSheet(); } }
      catch (x) { clearInterval(timer); if (S.sheet && S.sheet.k === 'upload') { S.sheet.step = 'erro'; S.sheet.erro = x.message; renderSheet(); } }
      return;
    }
    if (k === 'photo') { const url = await lerArquivo(file); openSheet({ k: 'photo', stage: 'busy' });
      loadPhoto(url).then(() => { genPreviews(); if (S.sheet && S.sheet.k === 'photo') openSheet({ k: 'photo', stage: 'edit' }); })
        .catch(() => { toast('Não consegui abrir essa foto. Tente um JPG ou PNG.'); if (S.sheet && S.sheet.k === 'photo') openSheet({ k: 'photo', stage: 'pick' }); });
      return; }
    const foto = await comprimir(file);
    if (k === 'wk' || k === 'sport' || k === 'run') { S.sheet.photo = foto; renderSheet(); }
    if (k === 'evid') evFinalize(foto);
    if (k === 'post') { S.postFoto = foto; render(); }
    if (k === 'plate') { openSheet({ k: 'plate', img: foto, step: 'lendo' });
      try { const r = await api('ia', { tipo: 'prato', arquivo: foto }, { timeout: 90000 }); if (S.sheet && S.sheet.k === 'plate') { S.sheet.step = 'ok'; S.sheet.itens = r.itens; S.sheet.conf = r.confianca; renderSheet(); } }
      catch (x) { if (S.sheet && S.sheet.k === 'plate') { S.sheet.erro = x.message; renderSheet(); } } }
  } catch (x) { toast('Não consegui abrir esse arquivo.'); }
  marcarMudanca();
});
document.addEventListener('keydown', e => {
  if (e.target.id === 'comboq') { if (e.key === 'Escape') { S.comboOpen = null; render(); return; } if (e.key === 'Enter') { e.preventDefault(); const b = $('#combolist .combo-it'); if (b) b.click(); return; } }
  if (e.key === 'Escape') { if (S.overOpen) nextOver(); else if (S.sheet) closeSheet(); } });

/* ============ rotas (links das notificações e do convite) ============ */
function aplicarRota() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (!h) return;
  const ap = h.match(/api=(https:\/\/script\.google\.com\/[^&]+)/);
  if (ap) lsSet('api', ap[1]);
  const cv = h.match(/convite=([A-Za-z0-9]+)/);
  if (cv) { if (!S.sessao) S.login = { modo: 'novo', convite: cv[1].toUpperCase() }; return; }
  const [tab, sub] = h.split('/');
  if (SCR[tab]) { S.tab = tab; if (tab === 'racha' && sub) S.rv = sub === 'liga' ? 'liga' : sub; if (tab === 'treino' && sub) S.tv = sub; if (tab === 'dieta' && sub) S.dv = sub; }
  history.replaceState(null, '', location.pathname);
}
window.addEventListener('hashchange', () => { aplicarRota(); render(false); });

/* ============ inicialização ============ */
async function tick() {
  if (!S.sessao || document.visibilityState !== 'visible') return;
  if (virarDia()) render();
  processarFila();
  sincronizar();
}
async function iniciar() {
  const th = lsGet('theme'); if (th && THEMES[th]) S.theme = th;
  $('#app').dataset.theme = S.theme;
  const sessao = JSON.parse(lsGet('sessao') || 'null');
  aplicarRota();
  if (!sessao) { S.login = S.login || { modo: 'entrar' }; render(false); requestAnimationFrame(animFrame); return; }
  S.sessao = sessao; S.eu = sessao.eu;
  const [cache, est, fila, carica] = await Promise.all(['cache', 'estado', 'fila', 'carica'].map(k => idb.get('kv', k).catch(() => null)));
  if (est && est.estado) { aplicarEstado(est.estado); S.estadoBase = est.base || 0; }
  S.fila = fila || []; S.carica = carica || null;
  if (cache) aplicarSinc({ completo: true, agora: cache.ultimaSinc, grupo: cache.G, pessoas: cache.pessoas || [], eventos: cache.eventos || [], posts: cache.posts || [], desafios: cache.desafios || [] });
  $('#app').dataset.theme = S.theme;
  virarDia(); aplicarRota(); render(false); requestAnimationFrame(animFrame);
  carregarReceitas();
  if (navigator.onLine) {
    try {
      const e = await api('estado', {});
      if (e.json && (!est || e.atualizado > (est.base || 0))) { aplicarEstado(JSON.parse(e.json)); S.estadoBase = e.atualizado; S.estadoEnviado = e.json; virarDia(); $('#app').dataset.theme = S.theme; }
      else if (!e.json) salvarNoServidor(true);
    } catch (x) { /* sem servidor agora: segue com o que tem */ }
    await sincronizar(!cache);
    processarFila();
    if (!S.carica) { S.carica = await carregarMinhaFoto(); if (S.carica) { idb.set('kv', 'carica', S.carica).catch(() => { }); render(); } }
    if (typeof revisarPush === 'function') revisarPush();
  }
  render();
}
setInterval(tick, (CFG.intervaloSincSeg || 30) * 1000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); else if (S.sessao) { idb.set('kv', 'estado', { estado: estadoPessoal(), base: S.estadoBase }).catch(() => { }); salvarNoServidor(); } });
window.addEventListener('online', () => { renderTop(); processarFila(); sincronizar(); });
window.addEventListener('offline', () => renderTop());
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.instalarEvt = e; });
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { w.postMessage('ativar'); } }); });
  }).catch(() => { });
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (recarregou) return; recarregou = true; if (!S.sheet) location.reload(); });
}
/* iniciar() é chamado no fim do index.html, depois de carregar todos os arquivos. */
