/* base.js — estado, armazenamento no aparelho, API, fila offline, sincronização, virada do dia e cálculo dos atributos. */
'use strict';

const CFG = Object.assign({ api: '', intervaloSincSeg: 30 }, window.RACHA_CONFIG || {});
const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const INSTALADO = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DIAS_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const hoje = () => N_iso(new Date());
const somaDias = N_somaDias, segunda = N_segunda;
const diaIdx = iso => (N_dataObj(iso).getDay() + 6) % 7;
const fmtData = iso => { const d = N_dataObj(iso); return `${DIAS_LONGO[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; };
const fmtCurta = iso => { const d = N_dataObj(iso); return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`; };
const rotuloDia = iso => { const h = hoje(); return iso === h ? 'Hoje' : iso === somaDias(h, -1) ? 'Ontem' : `${DIAS[diaIdx(iso)]} ${fmtCurta(iso)}`; };
const uidNovo = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function lsGet(k) { try { return localStorage.getItem('racha_' + k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v === null) localStorage.removeItem('racha_' + k); else localStorage.setItem('racha_' + k, v); } catch (e) { /* sem armazenamento */ } }

/* ============================== armazenamento (IndexedDB) ============================== */
const idb = {
  db: null, mem: { kv: new Map(), fotos: new Map() }, falhou: false,
  abrir() {
    if (this.db || this.falhou) return Promise.resolve(this.db);
    return new Promise(res => {
      try {
        const r = indexedDB.open('racha', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('fotos'); };
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => { this.falhou = true; res(null); };
      } catch (e) { this.falhou = true; res(null); }
    });
  },
  async op(store, modo, fn) {
    const db = await this.abrir();
    if (!db) return fn(null, this.mem[store]);
    return new Promise((res, rej) => {
      const tx = db.transaction(store, modo), q = fn(tx.objectStore(store));
      tx.oncomplete = () => res(q && q.result);
      tx.onerror = () => rej(tx.error);
    });
  },
  get(store, k) { return this.op(store, 'readonly', (os, mem) => mem ? mem.get(k) : os.get(k)); },
  set(store, k, v) { return this.op(store, 'readwrite', (os, mem) => mem ? mem.set(k, v) : os.put(v, k)); },
  del(store, k) { return this.op(store, 'readwrite', (os, mem) => mem ? mem.delete(k) : os.delete(k)); },
  async limpar() { for (const s of ['kv', 'fotos']) await this.op(s, 'readwrite', (os, mem) => mem ? mem.clear() : os.clear()); }
};

/* ============================== estado ============================== */
const HAB_PADRAO = [
  { id: 'agua', name: 'Água', ic: 'drop', type: 'count', target: 8 },
  { id: 'creat', name: 'Creatina 5 g', ic: 'pill', type: 'check' },
  { id: 'leit', name: 'Leitura · 20 min', ic: 'book', type: 'check' },
  { id: 'fio', name: 'Fio dental', ic: 'tooth', type: 'check' },
  { id: 'tela', name: 'Sem tela 30 min antes de dormir', ic: 'phone', type: 'check' },
  { id: 'sono', name: 'Dormir 7 h', ic: 'moon', type: 'check' },
];
function novosTreinos() {
  const w = JSON.parse(JSON.stringify(W_PADRAO));
  Object.values(w).forEach(t => t.ex.forEach(e => { e.m = (EX_EQUIP[e.anim] || [])[0] || ''; if (e.kg) e.kg = 0; }));
  return w;
}
function semanaVazia() { return DIAS.map(d => ({ d, type: 'rest', title: 'Descanso', det: 'Recuperação' })); }
function estadoPessoalNovo(nome) {
  return {
    v: 1, theme: 'c', start: hoje(), day: hoje(),
    user: { name: nome || '', lvl: 1, xp: 0, streak: 0, freezes: 1, base: null },
    goals: null, dietMeta: null, meals: [], log: [], logMeal: 'extra', flags: {},
    habits: HAB_PADRAO.map(h => ({ ...h, val: 0, streak: 0, wk: [0, 0, 0, 0, 0, 0], photo: null })),
    week: semanaVazia(), weekOrig: null, weekEdited: false, W: novosTreinos(), active: 'A', sess: {}, done: {}, sug: {}, rest: 90,
    sportsLog: [], runs: [], runGoal: '', customEquip: [], hist: {}, loads: {}, ana: null, steps: {}
  };
}
const CHAVES_PESSOAIS = Object.keys(estadoPessoalNovo());

const S = {
  // pessoal (salvo no servidor e no aparelho) — preenchido em aplicarEstado()
  ...estadoPessoalNovo(),
  // compartilhado (vem da sincronização)
  eu: null, G: null, members: [], evMap: new Map(), events: [], feed: [], challenges: [],
  // sessão e controle
  sessao: null, fila: [], ultimaSinc: 0, sincronizando: false, online: navigator.onLine, estadoBase: 0, estadoEnviado: '',
  // tela
  tab: 'hoje', dv: 'hoje', tv: 'semana', rv: 'classico', sheet: null, q: [], overOpen: false,
  comboOpen: null, comboQ: '', editWk: false, rf: { q: '', meal: 'all', fit: false, x: false, sort: 'fit' }, rlim: 20, restT: null,
  carica: null, fotos: {}, iaOcupada: false, login: null
};
let W = S.W;

function estadoPessoal() { const o = {}; CHAVES_PESSOAIS.forEach(k => o[k] = S[k]); o.W = W; return o; }
function aplicarEstado(o) {
  const base = estadoPessoalNovo(S.user && S.user.name);
  CHAVES_PESSOAIS.forEach(k => { S[k] = o && o[k] !== undefined && o[k] !== null ? o[k] : base[k]; });
  if (!S.W || !Object.keys(S.W).length) S.W = novosTreinos();
  W = S.W;
  if (!W[S.active]) S.active = Object.keys(W)[0];
  S.habits.forEach(h => { if (!Array.isArray(h.wk)) h.wk = [0, 0, 0, 0, 0, 0]; });
  S.meals.forEach(m => { m.items = (m.items || []).map(normItem).filter(Boolean); });
}
/* Itens de refeição são objetos com macros. Texto solto (plano antigo ou digitado) passa pela tabela TACO. */
function normItem(q) {
  if (q && typeof q === 'object') return q;
  const it = parse1(String(q)); return it ? { ...it } : null;
}

/* ============================== API ============================== */
function erroApp(msg, codigo) { const e = new Error(msg); e.codigo = codigo || 'ERRO'; return e; }
function apiUrl() { return CFG.api || lsGet('api') || ''; }
async function api(acao, dados, opts) {
  const url = apiUrl();
  if (!url) throw erroApp('Endereço do servidor não configurado.', 'CONFIG');
  if (!navigator.onLine) throw erroApp('Sem internet agora.', 'OFFLINE');
  const corpo = Object.assign({ acao, token: S.sessao ? S.sessao.token : undefined }, dados || {});
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), (opts && opts.timeout) || 45000);
  let r;
  try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(corpo), signal: ctl.signal, redirect: 'follow' }); }
  catch (e) { throw erroApp(e.name === 'AbortError' ? 'O servidor demorou para responder.' : 'Sem conexão com o servidor.', 'OFFLINE'); }
  finally { clearTimeout(t); }
  let j;
  try { j = await r.json(); } catch (e) { throw erroApp('Resposta inesperada do servidor. Confira se a implantação do Apps Script está como "Qualquer pessoa".', 'SERVIDOR'); }
  if (!j.ok) {
    if (j.codigo === 'SESSAO' && S.sessao) { sairLocal('Sua sessão expirou. Entre de novo.'); }
    throw erroApp(j.erro || 'Erro no servidor.', j.codigo);
  }
  return j.dados;
}

/* ============================== fila offline ============================== */
/* Tudo o que muda dados do grupo passa pela fila: se a internet cair, sai quando voltar. */
const ERROS_DEFINITIVOS = ['VALIDACAO', 'PERMISSAO', 'VAR', 'LIMITE', 'NAOACHOU', 'ACAO'];
function enfileirar(acao, dados) {
  S.fila.push({ id: uidNovo(), acao, dados, tent: 0 });
  salvarFila(); processarFila();
}
function salvarFila() { idb.set('kv', 'fila', S.fila).catch(() => { }); }
let _filaRodando = false;
async function processarFila() {
  if (_filaRodando || !S.sessao || !navigator.onLine) return;
  _filaRodando = true;
  try {
    while (S.fila.length) {
      const item = S.fila[0];
      try {
        const r = await api(item.acao, item.dados, { timeout: 90000 });
        S.fila.shift(); salvarFila();
        aplicarResposta(item, r);
      } catch (e) {
        if (ERROS_DEFINITIVOS.includes(e.codigo)) { S.fila.shift(); salvarFila(); desfazerLocal(item); toast(e.message); render(); continue; }
        item.tent++; break;
      }
    }
  } finally { _filaRodando = false; renderTop(); }
}
function aplicarResposta(item, r) {
  if (!r) return;
  if (r.ev) mesclarEventos([r.ev]);
  if (r.post) mesclarPosts([r.post]);
  if (r.desafio) mesclarDesafios([r.desafio]);
  if (r.pessoas) mesclarPessoas(r.pessoas);
  if (r.grupo) { S.G = r.grupo; }
  if (r.foto && item.acao === 'fotoCard') { const m = S.members.find(x => x.id === 'u'); if (m) m.foto = r.foto; ['a', 'b', 'c'].forEach(k => S.carica && idb.set('fotos', r.foto[k], S.carica[k]).catch(() => { })); }
  salvarCache(); render(); if (S.sheet) renderSheet();
}
function desfazerLocal(item) {
  if (item.acao === 'lancar') { const id = S.eu + '-' + item.dados.ev.id, e = S.evMap.get(id); if (e && e.pending) { S.evMap.delete(id); reordenarEventos(); } }
  if (item.acao === 'postar') { S.feed = S.feed.filter(p => !(p.pending && p.id === S.eu + '-' + item.dados.id)); }
}

/* ============================== sincronização ============================== */
const uid = id => id === S.eu ? 'u' : id;
const realId = id => id === 'u' ? S.eu : id;
function mesclarPessoas(lista) {
  S.members = lista.filter(p => p.ativo !== false).map(p => ({ ...p, id: uid(p.id), realId: p.id, ovr: p.ovr || 0 }));
}
function mesclarEventos(lista) {
  lista.forEach(e => {
    const local = S.evMap.get(e.id);
    const ev = { ...e, who: uid(e.who) };
    if (local && local.photo && !ev.photo) ev.photo = local.photo;
    if (ev.excluido) S.evMap.delete(e.id); else S.evMap.set(e.id, ev);
  });
  reordenarEventos();
}
function reordenarEventos() {
  const corte = somaDias(segunda(hoje()), -70);
  S.events = [...S.evMap.values()].filter(e => e.day >= corte).sort((a, b) => (a.day + a.t).localeCompare(b.day + b.t));
}
function mesclarPosts(lista) {
  const m = new Map(S.feed.map(p => [p.id, p]));
  lista.forEach(p => { if (p.excluido) m.delete(p.id); else m.set(p.id, { ...p, who: uid(p.who) }); });
  S.feed = [...m.values()].sort((a, b) => b.ts - a.ts).slice(0, 120);
}
function mesclarDesafios(lista) {
  const m = new Map(S.challenges.map(d => [d.id, d]));
  lista.forEach(d => m.set(d.id, d));
  S.challenges = [...m.values()].filter(d => d.status !== 'cancelado').sort((a, b) => b.up - a.up);
}
function aplicarSinc(r) {
  S.G = r.grupo;
  mesclarPessoas(r.pessoas);
  if (r.completo) { S.evMap = new Map(); S.feed = []; S.challenges = []; }
  // lances ainda na fila continuam visíveis
  mesclarEventos(r.eventos);
  S.fila.filter(f => f.acao === 'lancar').forEach(f => { const id = S.eu + '-' + f.dados.ev.id; if (!S.evMap.has(id)) S.evMap.set(id, { ...f.dados.ev, id, who: 'u', team: myTeam(), pending: true, photo: f.dados.foto || null }); });
  reordenarEventos();
  mesclarPosts(r.posts);
  mesclarDesafios(r.desafios);
  S.ultimaSinc = r.agora;
  salvarCache();
  baixarFotosCards();
}
function salvarCache() {
  idb.set('kv', 'cache', { G: S.G, eu: S.eu, pessoas: S.members.map(m => ({ ...m, id: m.realId })), eventos: [...S.evMap.values()].filter(e => !e.pending).map(e => ({ ...e, who: realId(e.who), photo: undefined })),
    posts: S.feed.map(p => ({ ...p, who: realId(p.who) })), desafios: S.challenges, ultimaSinc: S.ultimaSinc }).catch(() => { });
}
async function sincronizar(completo) {
  if (S.sincronizando || !S.sessao || !navigator.onLine) return;
  S.sincronizando = true;
  try {
    const golAntes = placarAtual();
    const r = await api('sync', { desde: completo ? 0 : Math.max(0, S.ultimaSinc - 5000) });
    aplicarSinc(r);
    const golDepois = placarAtual();
    if (!completo && S.ultimaSinc && (golDepois.A > golAntes.A || golDepois.B > golAntes.B) && document.visibilityState === 'visible') {
      const t = golDepois.A > golAntes.A ? 'A' : 'B';
      queue({ type: 'goal', txt: `Gol do ${teamName(t)}. ${t === myTeam() ? 'Seu time marcou.' : 'O rival marcou. Hora de responder.'}` });
    }
    render(); if (S.sheet && !['photo', 'ana', 'upload'].includes(S.sheet.k)) renderSheet();
  } catch (e) { /* tenta de novo no próximo ciclo */ }
  finally { S.sincronizando = false; renderTop(); }
}

/* Fotos dos cards: baixa só a versão do estilo em uso, uma vez, e guarda no aparelho. */
const _baixando = new Set();
async function fotoDrive(id) {
  if (!id) return null;
  if (S.fotos[id]) return S.fotos[id];
  const c = await idb.get('fotos', id).catch(() => null);
  if (c) { S.fotos[id] = c; return c; }
  if (_baixando.has(id) || !navigator.onLine) return null;
  _baixando.add(id);
  try { const r = await api('foto', { id }); const d = `data:${r.mime};base64,${r.b64}`; S.fotos[id] = d; idb.set('fotos', id, d).catch(() => { }); return d; }
  catch (e) { return null; } finally { _baixando.delete(id); }
}
async function baixarFotosCards() {
  let mudou = false;
  for (const m of S.members) {
    const id = m.foto && m.foto[S.theme];
    if (id && !S.fotos[id]) { if (await fotoDrive(id)) mudou = true; }
  }
  if (mudou) { render(); if (S.sheet && S.sheet.k !== 'photo') renderSheet(); }
}

/* ============================== estado pessoal: salvar ============================== */
let _locT = null, _srvT = null;
function marcarMudanca() {
  clearTimeout(_locT); _locT = setTimeout(() => idb.set('kv', 'estado', { estado: estadoPessoal(), base: S.estadoBase }).catch(() => { }), 300);
  clearTimeout(_srvT); _srvT = setTimeout(salvarNoServidor, 4000);
}
async function salvarNoServidor(forcar) {
  if (!S.sessao || !navigator.onLine) return;
  const json = JSON.stringify(estadoPessoal());
  if (json === S.estadoEnviado && !forcar) return;
  const u = me();
  try {
    const r = await api('salvarEstado', { json, base: S.estadoBase, pub: { pos: u.pos, lvl: u.lvl, ovr: u.ovr, attrs: u.attrs } });
    if (r.conflito) {
      // Outro aparelho salvou depois deste: fica valendo o mais novo
      const o = JSON.parse(r.servidor.json || 'null');
      if (o) { aplicarEstado(o); S.estadoBase = r.servidor.atualizado; S.estadoEnviado = r.servidor.json; virarDia(); toast('Seus dados foram atualizados com o que você fez em outro aparelho.'); render(); }
      return;
    }
    S.estadoBase = r.atualizado; S.estadoEnviado = json;
    idb.set('kv', 'estado', { estado: estadoPessoal(), base: S.estadoBase }).catch(() => { });
  } catch (e) { /* tenta de novo na próxima mudança */ }
}

/* ============================== login ============================== */
async function entrarCom(r) {
  S.sessao = { token: r.token, eu: r.eu };
  S.eu = r.eu;
  lsSet('sessao', JSON.stringify(S.sessao));
  const o = r.estado && r.estado.json ? JSON.parse(r.estado.json) : null;
  const eu = r.pessoas.find(p => p.id === r.eu);
  aplicarEstado(o || estadoPessoalNovo(eu ? eu.name : ''));
  if (eu) S.user.name = eu.name;
  S.estadoBase = r.estado ? r.estado.atualizado : 0;
  S.estadoEnviado = r.estado && r.estado.json ? r.estado.json : '';
  S.ultimaSinc = 0;
  aplicarSinc(r);
  S.carica = await carregarMinhaFoto();
  virarDia();
  if (!o) salvarNoServidor(true);
}
async function carregarMinhaFoto() {
  const m = S.members.find(x => x.id === 'u');
  if (!m || !m.foto || !m.foto.a) return null;
  const out = {};
  for (const k of ['a', 'b', 'c']) { out[k] = await fotoDrive(m.foto[k]); }
  return out.a && out.b && out.c ? out : null;
}
function sairLocal(msg) {
  S.sessao = null; S.eu = null; lsSet('sessao', null);
  idb.limpar().catch(() => { });
  S.fila = []; S.evMap = new Map(); S.events = []; S.feed = []; S.challenges = []; S.members = []; S.carica = null; S.fotos = {};
  aplicarEstado(null);
  S.login = { modo: 'entrar', erro: msg || '' };
  closeSheet(); render(false);
}

/* ============================== a virada do dia ============================== */
const habDone = h => h.type === 'count' ? h.val >= h.target : !!h.val;
function hd(dia) { dia = dia || S.day; return S.hist[dia] || (S.hist[dia] = {}); }
function fecharDia(dia) {
  const h = hd(dia), act = S.habits, dn = act.filter(habDone).length, c = consumed();
  h.hab = dn; h.habTot = act.length; h.perfect = act.length > 0 && dn === act.length;
  h.meals = S.meals.filter(m => m.done && !m.skip).length; h.mealsPlan = S.meals.length;
  h.diet = !!S.goals; h.macros = !!S.flags.macros; h.prot = !!(S.goals && c.p >= S.goals.p * .9); h.kcal = Math.round(c.kcal);
  const w = S.week[diaIdx(dia)];
  h.planned = !!(w && w.type !== 'rest');
  if (w && w.type === 'musc' && W[w.key]) h.setsPlan = h.setsPlan || W[w.key].ex.reduce((a, e) => a + e.sets, 0);
  if (w && w.type === 'run') h.runsPlan = 1;
  act.forEach(x => { const ok = habDone(x); x.streak = ok ? (x.streak || 0) + 1 : 0; x.wk = [...(x.wk || []).slice(-5), ok ? 1 : 0]; });
  h.active = !!(h.trained || h.perfect || h.macros || h.meals);
}
function fecharDiaVazio(dia) {
  const h = hd(dia), w = S.week[diaIdx(dia)];
  h.hab = 0; h.habTot = S.habits.length; h.perfect = false; h.meals = 0; h.mealsPlan = S.meals.length; h.diet = !!S.goals; h.planned = !!(w && w.type !== 'rest');
  if (w && w.type === 'musc' && W[w.key]) h.setsPlan = W[w.key].ex.reduce((a, e) => a + e.sets, 0);
  S.habits.forEach(x => { x.streak = 0; x.wk = [...(x.wk || []).slice(-5), 0]; });
}
function sequencia(dia) {
  const u = S.user, h = S.hist[dia] || {};
  if (h.active) u.streak = (u.streak || 0) + 1;
  else if (u.freezes > 0 && u.streak > 0) { u.freezes--; h.freeze = true; }
  else u.streak = 0;
  if (diaIdx(dia) === 6) { // domingo: semana completa ganha cartão verde
    let tr = 0, pl = 0; for (let i = 0; i < 7; i++) { const x = S.hist[somaDias(dia, -i)] || {}; if (x.trained) tr++; if (x.planned) pl++; }
    if (pl && tr >= pl) u.freezes = Math.min(3, (u.freezes || 0) + 1);
  }
}
function virarDia() {
  const h = hoje();
  if (!S.day) S.day = h;
  if (S.day === h) return false;
  if (S.day > h) { S.day = h; return false; } // relógio do aparelho voltou
  fecharDia(S.day); sequencia(S.day);
  let d = somaDias(S.day, 1), n = 0;
  while (d < h && n < 40) { fecharDiaVazio(d); sequencia(d); d = somaDias(d, 1); n++; }
  S.habits.forEach(x => { x.val = 0; x.photo = null; });
  S.meals.forEach(m => { m.done = false; m.skip = false; m.photo = null; });
  S.log = []; S.flags = {}; S.sess = {}; S.done = {};
  S.logMeal = S.meals.length ? S.meals[0].id : 'extra';
  S.day = h;
  const lim = somaDias(h, -70);
  Object.keys(S.hist).forEach(k => { if (k < lim) delete S.hist[k]; });
  Object.keys(S.loads).forEach(k => { S.loads[k] = S.loads[k].filter(x => x[0] >= lim); if (!S.loads[k].length) delete S.loads[k]; });
  S.runs = S.runs.filter(r => r.day >= lim);
  S.sportsLog = S.sportsLog.slice(0, 40);
  marcarMudanca();
  return true;
}

/* ============================== derivados ============================== */
const consumed = () => S.log.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 });
const rem = () => { const c = consumed(), g = S.goals || { kcal: 0, p: 0, c: 0, f: 0 }; return { kcal: g.kcal - c.kcal, p: g.p - c.p, c: g.c - c.c, f: g.f - c.f }; };
const ovrOf = a => Math.round(Object.values(a).reduce((x, y) => x + y, 0) / 6);
const tierOf = l => l >= 35 ? 'especial' : l >= 20 ? 'ouro' : l >= 10 ? 'prata' : 'bronze';
const TIERN = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', especial: 'Especial' };
const xpNext = lvl => 600 + 40 * lvl;
const mem = id => S.members.find(m => m.id === id) || { id, name: 'Ex-jogador', team: 'A', pos: 'MEI', lvl: 1, ovr: 0, foto: {} };
const regras = () => (S.G && S.G.regras) || { photo: false, hab: {} };
const GOAL = () => N_gol(regras());
const teamName = t => (S.G && S.G.times[t] ? S.G.times[t].nome : 'Time ' + t);
const teamShort = t => (S.G && S.G.times[t] ? S.G.times[t].sigla : t);
const myTeam = () => (S.members.find(m => m.id === 'u') || { team: 'A' }).team;
const habName = id => { const h = S.habits.find(x => x.id === id); return h ? h.name.split(' ·')[0] : ({ agua: 'Água', creat: 'Creatina', leit: 'Leitura', fio: 'Fio dental', tela: 'Sem tela', sono: 'Sono' }[id] || 'hábito'); };
const evHabName = e => id => (e.hn && e.hn[id]) || habName(id);
function effCalc(e) { return N_calc(e, regras(), evHabName(e)); }
const effPts = e => effCalc(e).total;
const semanaAtual = () => segunda(hoje());
const rodadaN = (dia) => N_rodada(dia || hoje(), S.G ? S.G.inicio : hoje());
const evRodada = (seg) => { seg = seg || semanaAtual(); const fim = somaDias(seg, 6); return S.events.filter(e => e.day >= seg && e.day <= fim); };
const ptsOf = (id, seg) => evRodada(seg).filter(e => e.who === id).reduce((a, e) => a + effPts(e), 0);
const teamPts = (t, seg) => evRodada(seg).filter(e => e.team === t).reduce((a, e) => a + effPts(e), 0);
function placarAtual(seg) { return N_placar(S.events.map(e => e), regras(), seg || semanaAtual()); }
const score = () => placarAtual();
const habitsPending = () => S.habits.filter(h => !habDone(h));
const temDieta = () => !!(S.goals && S.meals.length);

/* ============================== atributos ============================== */
/* Nota = 40 + 59 × índice (0 a 1). O índice é a média ponderada de 3 itens medidos nas últimas 4 semanas, sempre contra você mesmo.
   Nas primeiras 4 semanas a nota mistura o card inicial da anamnese com o cálculo, para ninguém começar com 40 em tudo. */
const ATTR = {
  RIT: { n: 'Ritmo', what: 'Quanto seu pace e seu volume de corrida evoluíram em relação a você mesmo.', up: ['Corra pelo menos 2 vezes por semana para o app medir sua evolução de pace.', 'Rodagens leves (Z2) melhoram o pace sem custar recuperação.'] },
  FOR: { n: 'Força', what: 'Quanto suas cargas progrediram, comparadas com o seu próprio histórico.', up: ['Registre todas as séries com carga e repetições: série não registrada não conta.', 'Subir 2,5 kg quando completar todas as repetições já gera progressão.'] },
  RES: { n: 'Resistência', what: 'Quanto volume de treino você sustenta por semana.', up: ['Beach tennis, futebol e corrida também contam minutos.', 'Uma sessão longa (60 min ou mais) por semana já sobe este atributo.'] },
  CON: { n: 'Consistência', what: 'Quanto você cumpre o plano de treino, sem olhar para carga ou velocidade.', up: ['Assiduidade vale mais que performance.', 'Cartões verdes protegem a sequência num dia ruim. Semana completa dá um cartão.'] },
  NUT: { n: 'Nutrição', what: 'Quanto você segue o plano alimentar da sua nutricionista.', up: ['Envie a dieta em PDF: sem plano, este atributo não sobe.', 'Registrar até o que saiu do plano conta para "refeições registradas".'] },
  HAB: { n: 'Hábitos', what: 'Quanto dos hábitos que você escolheu você realmente cumpre.', up: ['Dia perfeito vale +15 pts para o time.', 'Hábitos pequenos (2 minutos) são os mais fáceis de manter.'] },
};
const KS = ['RIT', 'FOR', 'RES', 'CON', 'NUT', 'HAB'];
const pc = (a, b) => b > 0 ? clamp(a / b, 0, 1) : 0;
const e1rm = (kg, reps) => kg * (1 + Math.min(reps, 15) / 30);
function janela() {
  const h = hoje(), ini = S.start || h, n = clamp(N_diasEntre(ini, h) + 1, 1, 28), dias = [];
  for (let i = 0; i < n; i++) dias.push(somaDias(h, -i));
  return { dias, n, semanas: Math.max(1, n / 7), h };
}
function calcAttrs() {
  const J = janela(), H = d => S.hist[d] || {}, soma = f => J.dias.reduce((a, d) => a + (Number(f(H(d))) || 0), 0);
  const P = {};
  // RIT
  const runs = S.runs, r14 = runs.filter(r => r.day > somaDias(J.h, -14)), rOld = runs.filter(r => r.day <= somaDias(J.h, -14) && r.day > somaDias(J.h, -56));
  const avgPace = l => { const km = l.reduce((a, r) => a + r.km, 0), s = l.reduce((a, r) => a + r.sec, 0); return km ? s / km : 0; };
  const pN = avgPace(r14), pO = avgPace(rOld), chg = pN && pO ? (pO - pN) / pO : null;
  const planKm = S.week.filter(w => w.type === 'run').reduce((a, w) => a + (parseFloat(String(w.km || '').replace(',', '.')) || 5), 0) || 10;
  const km7 = runs.filter(r => r.day > somaDias(J.h, -7)).reduce((a, r) => a + r.km, 0);
  const qual = runs.filter(r => J.dias.includes(r.day) && /Intervalado|Ritmo|Tiro/.test(r.rt || '')).length, qualPlan = Math.max(1, Math.round(S.week.filter(w => w.type === 'run' && /Intervalado|Ritmo/.test(w.rt || w.title || '')).length * J.semanas));
  P.RIT = [
    ['Evolução do pace', chg === null ? (runs.length ? 'Precisa de corridas em semanas diferentes para comparar' : 'Nenhuma corrida registrada') : `${pace(pO)} → ${pace(pN)}/km (${chg >= 0 ? '−' : '+'}${fmt(Math.abs(chg * 100), 1)}%)`, chg === null ? (runs.length ? .4 : 0) : clamp(.5 + chg * 8, 0, 1), .5],
    ['Volume de corrida nos últimos 7 dias', `${fmt(km7, 1)} de ${fmt(planKm, 0)} km do plano`, pc(km7, planKm), .3],
    ['Treinos de qualidade', `${qual} de ${qualPlan} tiros ou ritmo no período`, pc(qual, qualPlan), .2]];
  // FOR
  const lim14 = somaDias(J.h, -14), lim56 = somaDias(J.h, -56); let chs = [];
  Object.values(S.loads).forEach(l => { const nw = l.filter(x => x[0] > lim14).map(x => x[1]), od = l.filter(x => x[0] <= lim14 && x[0] > lim56).map(x => x[1]); if (nw.length && od.length) chs.push(Math.max(...nw) / Math.max(...od) - 1); });
  const fch = chs.length ? chs.reduce((a, x) => a + x, 0) / chs.length : null, temMusc = Object.keys(S.loads).length > 0;
  const sets = soma(h => h.sets), setsPlan = soma(h => h.setsPlan), prs = soma(h => h.prs);
  P.FOR = [
    ['Progressão de carga', fch === null ? (temMusc ? 'Precisa de 2 semanas de registros para comparar' : 'Nenhuma carga registrada') : `${fch >= 0 ? '+' : ''}${fmt(fch * 100, 1)}% de força estimada em ${chs.length} exercício${chs.length > 1 ? 's' : ''}`, fch === null ? (temMusc ? .4 : 0) : clamp(.4 + fch * 6, 0, 1), .5],
    ['Séries feitas vs. planejadas', `${sets} de ${setsPlan} séries`, pc(sets, setsPlan), .3],
    ['Recordes pessoais no período', `${prs} recorde${prs === 1 ? '' : 's'} (máximo considerado: 5)`, pc(prs, 5), .2]];
  // RES
  const min = soma(h => h.min), metaMin = S.ana && S.ana.days && S.ana.time ? S.ana.days * S.ana.time : 180, minSem = min / J.semanas;
  const longas = soma(h => h.longas), longasMeta = Math.max(1, Math.round(J.semanas));
  P.RES = [
    ['Minutos de treino por semana', `${fmt(minSem)} de ${metaMin} min da meta`, pc(minSem, metaMin), .6],
    ['Sessões longas (60 min ou mais)', `${longas} de ${longasMeta} (1 por semana)`, pc(longas, longasMeta), .4]];
  // CON
  const tr = soma(h => h.trained && h.planned ? 1 : 0) + soma(h => h.trained && !h.planned ? 1 : 0), pl = soma(h => h.planned ? 1 : 0);
  let semOk = 0, semTot = 0;
  for (let w = 0; w < Math.floor(J.n / 7); w++) { let t = 0, p = 0; for (let i = 0; i < 7; i++) { const x = H(somaDias(J.h, -(w * 7 + i))); if (x.trained) t++; if (x.planned) p++; } semTot++; if (p && t >= p) semOk++; }
  P.CON = [
    ['Dias treinados vs. planejados', `${tr} de ${pl} dias`, pc(tr, pl), .6],
    ['Sequência atual', `${S.user.streak} de 14 dias`, pc(S.user.streak, 14), .25],
    ['Semanas completas', semTot ? `${semOk} de ${semTot} semanas sem faltar treino` : 'Conta a partir da primeira semana fechada', semTot ? pc(semOk, semTot) : .5, .15]];
  // NUT
  const dDiet = J.dias.filter(d => H(d).diet || (d === J.h && temDieta())).length, mac = soma(h => h.macros) + (S.flags.macros && !H(J.h).macros ? 1 : 0), prot = soma(h => h.prot);
  const ml = soma(h => h.meals) + (H(J.h).meals == null ? S.meals.filter(m => m.done && !m.skip).length : 0), mlP = soma(h => h.mealsPlan) + (H(J.h).mealsPlan == null ? S.meals.length : 0);
  P.NUT = !dDiet ? [['Dias dentro dos macros (±10%)', 'Sem plano alimentar: envie sua dieta em PDF', 0, .5], ['Dias com a proteína batida', 'Sem plano alimentar', 0, .3], ['Refeições registradas', 'Sem plano alimentar', 0, .2]] : [
    ['Dias dentro dos macros (±10%)', `${mac} de ${dDiet} dias`, pc(mac, dDiet), .5],
    ['Dias com a proteína batida', `${prot} de ${dDiet} dias`, pc(prot, dDiet), .3],
    ['Refeições registradas', `${ml} de ${mlP} refeições do plano`, pc(ml, mlP), .2]];
  // HAB
  const hb = soma(h => h.hab) + (H(J.h).hab == null ? S.habits.filter(habDone).length : 0), hbT = soma(h => h.habTot) + (H(J.h).habTot == null ? S.habits.length : 0);
  const perf = soma(h => h.perfect), seq = S.habits.filter(x => (x.streak || 0) >= 7).length;
  P.HAB = [
    ['Hábitos cumpridos', `${hb} de ${hbT}`, pc(hb, hbT), .6],
    ['Dias perfeitos', `${perf} de ${J.n} dias com todos os hábitos`, pc(perf, J.n), .25],
    ['Hábitos em sequência', `${seq} de ${S.habits.length} com 7 dias ou mais seguidos`, pc(seq, S.habits.length), .15]];
  const peso = clamp((N_diasEntre(S.start || J.h, J.h) + 1) / 28, 0, 1), base = S.user.base || {};
  const out = {};
  KS.forEach(k => {
    const idx = P[k].reduce((a, p) => a + p[2] * p[3], 0), calc = 40 + 59 * idx, b = base[k] || 55;
    out[k] = { parts: P[k], idx, calc: Math.round(calc), base: b, peso, nota: clamp(Math.round(b * (1 - peso) + calc * peso), 40, 99) };
  });
  return out;
}
let _attrMemo = { k: '', v: null };
function attrsAgora() {
  const k = S.day + '|' + Object.keys(S.hist).length + '|' + JSON.stringify(S.hist[S.day] || {}) + '|' + S.habits.map(h => h.val).join('') + S.log.length + S.runs.length + Object.keys(S.loads).length + S.user.streak + (S.ana ? 1 : 0);
  if (_attrMemo.k !== k) _attrMemo = { k, v: calcAttrs() };
  return _attrMemo.v;
}
function posDe(a) { const mx = Math.max(a.RIT, a.FOR, a.CON); if (a.RIT === mx && a.RIT >= a.FOR + 4) return 'PON'; if (a.FOR === mx && a.FOR >= a.RIT + 4) return 'ZAG'; if (a.CON === mx && a.CON >= Math.max(a.RIT, a.FOR) + 4) return 'VOL'; return 'MEI'; }
function me() {
  const A = attrsAgora(), attrs = {}; KS.forEach(k => attrs[k] = A[k].nota);
  const m = S.members.find(x => x.id === 'u') || { team: 'A', foto: {} };
  return { ...m, id: 'u', name: S.user.name || m.name || 'Você', lvl: S.user.lvl, xp: S.user.xp, xpNext: xpNext(S.user.lvl), streak: S.user.streak, freezes: S.user.freezes, attrs, ovr: ovrOf(attrs), pos: posDe(attrs) };
}
function memberAttrs(m) { if (m.id === 'u') return me().attrs; if (m.attrs) return m.attrs; const o = m.ovr || 55; const r = {}; KS.forEach(k => r[k] = o); return r; }
const person = id => id === 'u' ? me() : { ...mem(id), attrs: memberAttrs(mem(id)), ovr: mem(id).ovr || ovrOf(memberAttrs(mem(id))) };

/* ============================== XP e lances ============================== */
function addXP(n, txt) {
  const u = S.user; u.xp += n;
  while (u.xp >= xpNext(u.lvl)) { u.xp -= xpNext(u.lvl); u.lvl++; queue({ type: 'level', lvl: u.lvl, txt }); }
}
/* Cria (ou atualiza, se tiver chave) um lance do dia e manda para o servidor pela fila. */
function pushEvent(txt, pts, key, calc, extra) {
  extra = Object.assign({}, extra || {});
  calc = calc || [['Lance', pts]];
  const antes = score(), t = myTeam();
  const cid = key ? `${S.day}-${key}` : uidNovo(), id = S.eu + '-' + cid, foto = extra.photo || null;
  delete extra.photo;
  const ev = { id: cid, day: S.day, t: nowHM(), kind: extra.kind || 'lance', txt, pts, calc, key: key || null, ...extra };
  const old = S.evMap.get(id);
  S.evMap.set(id, { ...ev, id, who: 'u', team: old ? old.team : t, pending: true, photo: foto || (old && old.photo) || null, ev: ev.ev || null, foto: old && old.foto });
  reordenarEventos();
  const depois = score(), gol = depois[t] > antes[t];
  if (gol) queue({ type: 'goal', txt: `${txt}. Seu lance colocou o ${teamName(t)} ${depois[t] > depois[t === 'A' ? 'B' : 'A'] ? 'na frente' : 'no jogo'}.` });
  // remove da fila uma versão anterior do mesmo lance ainda não enviada
  S.fila = S.fila.filter((f, i) => !(i > 0 && f.acao === 'lancar' && f.dados.ev.id === cid && !f.dados.foto));
  enfileirar('lancar', { ev, foto, gol: gol ? { time: t, placar: { A: depois.A, B: depois.B } } : null });
  marcarMudanca();
}
