/**
 * nucleo.js — regras do placar, iguais no app e no servidor.
 * Fonte única: este arquivo. O servidor usa uma cópia idêntica em servidor/Nucleo.gs (rode build.sh depois de mudar).
 * Escrito em JavaScript simples (sem módulos) para rodar no navegador e no Apps Script.
 */
var N_PONTOS = {
  treino: 50,      // treino de musculação concluído
  pr: 10,          // recorde pessoal (até 3 por treino)
  esporte: 35,     // corrida ou outro esporte
  refeicao: 5,     // refeição dentro do plano (até 5 por dia)
  macros: 25,      // dia dentro dos macros
  habito: 5,       // cada hábito cumprido
  perfeito: 15     // bônus de dia perfeito de hábitos
};

/* Tetos de cada tipo de lance. */
var N_LIMITES = { pr: 3, refeicoesDia: 5, habitos: 10 };

/* Hábitos que vêm com o app. Outros hábitos criados pela pessoa usam a regra "outros". */
var N_HABITOS_PADRAO = ['agua', 'creat', 'leit', 'fio', 'tela', 'sono'];

function N_regras(r) {
  r = r || {};
  var hab = r.hab || {};
  return { photo: !!r.photo, hab: hab };
}

function N_gol(regras) { return N_regras(regras).photo ? 80 : 100; }

/* O hábito conta no placar do modo competitivo? */
function N_habConta(regras, id) {
  var h = N_regras(regras).hab;
  if (Object.prototype.hasOwnProperty.call(h, id)) return !!h[id];
  return !!h.outros;
}

/**
 * Pontos efetivos de um lance, com a memória de cálculo.
 * nomes: função opcional que devolve o nome de um hábito pelo id (para o texto das linhas).
 * Devolve { lines: [[texto, pontos, nota]], total, noev }.
 */
function N_calc(e, regras, nomes) {
  var comp = N_regras(regras).photo, nm = nomes || function (x) { return x; };
  if (e.var === 'anulado') return { lines: [['Anulado pelo VAR', 0, 'O grupo votou para anular']], total: 0 };
  if (e.kind === 'habitos') {
    var ids = N_habsLance(e.habs), hp = e.hp || [], ok = [], off = [], lines = [];
    ids.forEach(function (id) { if (!comp || (N_habConta(regras, id) && hp.indexOf(id) >= 0)) ok.push(id); else off.push(id); });
    if (ok.length) lines.push(['Hábito cumprido × ' + ok.length, ok.length * N_PONTOS.habito, comp ? ok.map(nm).join(', ') : '']);
    if (e.perfect) lines.push(['Bônus de dia perfeito', !comp || !off.length ? N_PONTOS.perfeito : 0, comp && off.length ? 'Só vale com todos os hábitos contando' : '']);
    if (comp && off.length) lines.push(['Não conta no placar: ' + off.map(nm).join(', '), 0, 'Fora da regra do grupo ou sem foto']);
    return { lines: lines, total: lines.reduce(function (a, l) { return a + l[1]; }, 0) };
  }
  var base = (e.calc && e.calc.length ? e.calc : [['Lance', Number(e.pts) || 0]]).map(function (l) { return [l[0], Number(l[1]) || 0, l[2] || '']; });
  if (comp && !e.ev) return { lines: base.map(function (l) { return [l[0], 0, '']; }).concat([['Sem evidência: não conta no modo competitivo', 0, '']]), total: 0, noev: true };
  return { lines: base, total: base.reduce(function (a, l) { return a + l[1]; }, 0) };
}
function N_pts(e, regras) { return N_calc(e, regras).total; }

/* Lista de hábitos de um lance: sem repetição, só texto, no máximo N_LIMITES.habitos. */
function N_habsLance(l) {
  var v = [];
  (Array.isArray(l) ? l : []).forEach(function (x) { x = String(x).slice(0, 40); if (x && v.indexOf(x) < 0 && v.length < N_LIMITES.habitos) v.push(x); });
  return v;
}

/**
 * Pontos oficiais de um lance, pelo tipo. O servidor grava isto e ignora os pontos que o aparelho manda.
 * Devolve a memória de cálculo ([[texto, pontos]]); tipo desconhecido não pontua.
 */
function N_oficial(e) {
  var P = N_PONTOS;
  switch (e.kind) {
    case 'treino':
      var pr = Math.max(0, Math.min(N_LIMITES.pr, Math.floor(Number(e.prs) || 0)));
      return [['Treino de musculação concluído', P.treino]].concat(pr ? [['Recorde pessoal × ' + pr, pr * P.pr]] : []);
    case 'esporte': case 'corrida': return [['Corrida ou outro esporte', P.esporte]];
    case 'refeicao': return [['Refeição dentro do plano × 1', P.refeicao]];
    case 'macros': return [['Dia dentro dos macros', P.macros]];
    case 'habitos':
      var n = N_habsLance(e.habs).length;
      return n ? [['Hábito cumprido × ' + n, n * P.habito]].concat(e.perfect ? [['Bônus de dia perfeito', P.perfeito]] : []) : [];
  }
  return [];
}

/* ---------- datas (sempre texto AAAA-MM-DD, no fuso do grupo) ---------- */
function N_dataObj(iso) { var p = String(iso).slice(0, 10).split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12); }
function N_iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function N_somaDias(iso, n) { var d = N_dataObj(iso); d.setDate(d.getDate() + n); return N_iso(d); }
function N_diasEntre(a, b) { return Math.round((N_dataObj(b) - N_dataObj(a)) / 864e5); }
/* Segunda-feira da semana do dia (a rodada vai de segunda a domingo). */
function N_segunda(iso) { var d = N_dataObj(iso), w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return N_iso(d); }
function N_rodada(iso, inicio) { return Math.floor(N_diasEntre(N_segunda(inicio || iso), N_segunda(iso)) / 7) + 1; }

/* Placar de uma rodada. eventos: lista com { day, team, ...lance }. */
function N_placar(eventos, regras, segunda) {
  var fim = N_somaDias(segunda, 6), pts = { A: 0, B: 0 };
  eventos.forEach(function (e) {
    if (e.excluido || e.day < segunda || e.day > fim) return;
    if (e.team === 'A' || e.team === 'B') pts[e.team] += N_pts(e, regras);
  });
  var g = N_gol(regras);
  return { pts: pts, A: Math.floor(pts.A / g), B: Math.floor(pts.B / g), gol: g };
}

if (typeof module !== 'undefined') module.exports = { N_PONTOS: N_PONTOS, N_LIMITES: N_LIMITES, N_habsLance: N_habsLance, N_oficial: N_oficial, N_HABITOS_PADRAO: N_HABITOS_PADRAO, N_regras: N_regras, N_gol: N_gol, N_habConta: N_habConta, N_calc: N_calc, N_pts: N_pts, N_dataObj: N_dataObj, N_iso: N_iso, N_somaDias: N_somaDias, N_diasEntre: N_diasEntre, N_segunda: N_segunda, N_rodada: N_rodada, N_placar: N_placar };
