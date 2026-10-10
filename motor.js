/* motor.js — ícones, alimentos (TACO), temas, treinos-modelo, animação dos exercícios, aparelhos e o recorte da foto do card.
   Vindo do protótipo; quase tudo aqui é independente dos dados do grupo. */
'use strict';

/* ============ utils ============ */
const $ = s => document.querySelector(s);
const fmt = (n, d = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const pace = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');

const P = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  bowl: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M10 7c0-2 1.5-3 3-3"/>',
  dumbbell: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  check: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M8 12l3 3 5-6"/>',
  tick: '<path d="M5 12l5 5 9-10"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 7.6-8 9-4.6-1.4-8-4.5-8-9V6z"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>', back: '<path d="M15 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2 3 4 .5-3-.5-5 0-7z"/>',
  card: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6"/>',
  drop: '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>',
  book: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
  tooth: '<path d="M7 4c2 0 3 1 5 1s3-1 5-1c3 0 4 3 3 6-1 2-1 4-2 7-.5 2-2.5 2-3 0l-1-4h-4l-1 4c-.5 2-2.5 2-3 0-1-3-1-5-2-7-1-3 0-6 3-6z"/>',
  pill: '<path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z"/><path d="M7 7l7 7"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  shoe: '<path d="M3 16v-5l4-1 2 2 4-1 4 2 4 1v2H3z"/><path d="M3 19h18"/>',
  ball: '<circle cx="12" cy="12" r="8"/><path d="M5 9c4 1 10 1 14 0M5 15c4-1 10-1 14 0"/>',
  kettle: '<path d="M9 7a3 3 0 0 1 6 0"/><path d="M6 10h12l-1 9H7z"/>',
  sled: '<path d="M4 15h13l3-6"/><path d="M6 15v-5h8v5"/><path d="M3 19h16"/>',
  wave: '<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 2-1 3-1a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
  drum: '<path d="M14 4a6 6 0 0 1 6 6c0 4-4 6-7 6l-3 3a2 2 0 1 1-3-3l3-3c0-3 1-9 4-9z"/>',
  burger: '<path d="M4 11a8 6 0 0 1 16 0z"/><path d="M3 14h18"/><path d="M4 17h16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
  pancake: '<ellipse cx="12" cy="9" rx="8" ry="3"/><path d="M4 9v3c0 1.7 3.6 3 8 3s8-1.3 8-3V9M4 12v3c0 1.7 3.6 3 8 3s8-1.3 8-3v-3"/>',
  cup: '<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M12 13v4M8 20h8M5 5H3v2a3 3 0 0 0 3 3M19 5h2v2a3 3 0 0 1-3 3"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 14v5h14v-5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  wand: '<path d="M4 20L16 8"/><path d="M15 4v3M18 6h3M19 2v2M13 2h2"/>',
  play: '<path d="M7 5l12 7-12 7z"/>', watch: '<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2l1.5 1"/>', whistle: '<circle cx="9" cy="14" r="5"/><path d="M13 11l8-4v4l-6 2"/>', pause: '<path d="M8 5v14M16 5v14"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  chart: '<path d="M4 19h16"/><path d="M5 15l4-4 4 3 6-7"/><circle cx="19" cy="7" r="1.2"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>', search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
};
const ic = (n, s = 20, sw = 1.9) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.star}</svg>`;
const bar = (v, max, col) => `<div class="bar" role="img" aria-label="${Math.round(v / max * 100)}%"><i style="width:${clamp(v / max * 100, 0, 100)}%;background:${col}"></i></div>`;

/* color helpers */
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return '#' + [r, g, b].map(x => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join(''); }

/* ============ food data (Tabela TACO, valores aproximados) ============ */
const FOODS = [
  { k: ['pasta de amendoim'], n: 'Pasta de amendoim', h: { kcal: 600, p: 26.7, c: 20, f: 50 }, def: 15, grp: 'fat' },
  { k: ['batata doce', 'batata-doce'], n: 'Batata-doce cozida', h: { kcal: 77, p: 0.6, c: 18.4, f: 0.1 }, def: 150, grp: 'carb' },
  { k: ['café com leite', 'cafe com leite'], n: 'Café com leite', u: { g: 200, kcal: 60, p: 3, c: 5, f: 3 }, un: 'xíc.' },
  { k: ['pão integral', 'pao integral', 'pão de forma', 'pao de forma'], n: 'Pão de forma integral', u: { g: 25, kcal: 62, p: 3, c: 11, f: 0.9 }, un: 'fatia', grp: 'carb' },
  { k: ['pão francês', 'pao frances', 'pão', 'pao', 'pães', 'paes'], n: 'Pão francês', u: { g: 50, kcal: 150, p: 4, c: 29.3, f: 1.6 }, un: 'un', grp: 'carb' },
  { k: ['queijo coalho', 'coalho'], n: 'Queijo coalho', h: { kcal: 343, p: 24.6, c: 3, f: 25.3 }, def: 30, grp: 'dairy' },
  { k: ['queijo minas', 'queijo'], n: 'Queijo minas frescal', h: { kcal: 264, p: 17.4, c: 3.2, f: 20.2 }, def: 30, grp: 'dairy' },
  { k: ['ovos', 'ovo'], n: 'Ovo', u: { g: 50, kcal: 73, p: 6.7, c: 0.3, f: 4.8 }, un: 'un', grp: 'prot' },
  { k: ['bananas', 'banana'], n: 'Banana-prata', u: { g: 70, kcal: 69, p: 0.9, c: 18.2, f: 0.1 }, un: 'un', grp: 'fruit' },
  { k: ['maçã', 'maca', 'maçãs'], n: 'Maçã', u: { g: 130, kcal: 73, p: 0.4, c: 19.6, f: 0.2 }, un: 'un', grp: 'fruit' },
  { k: ['arroz'], n: 'Arroz branco cozido', h: { kcal: 128, p: 2.5, c: 28.1, f: 0.2 }, def: 120, grp: 'carb' },
  { k: ['feijão', 'feijao'], n: 'Feijão-carioca cozido', h: { kcal: 76, p: 4.8, c: 13.6, f: 0.5 }, def: 100 },
  { k: ['frango'], n: 'Peito de frango grelhado', h: { kcal: 159, p: 32, c: 0, f: 2.5 }, def: 150, grp: 'prot' },
  { k: ['patinho', 'carne moída', 'carne moida', 'carne'], n: 'Patinho moído', h: { kcal: 219, p: 35.9, c: 0, f: 7.3 }, def: 150, grp: 'prot' },
  { k: ['tilápia', 'tilapia', 'peixe'], n: 'Tilápia grelhada', h: { kcal: 128, p: 26, c: 0, f: 2.7 }, def: 150, grp: 'prot' },
  { k: ['cuscuz'], n: 'Cuscuz de milho', h: { kcal: 113, p: 2.2, c: 25.3, f: 0.7 }, def: 150, grp: 'carb' },
  { k: ['tapioca'], n: 'Tapioca (goma)', h: { kcal: 241, p: 0, c: 60, f: 0 }, def: 70, grp: 'carb' },
  { k: ['aveia'], n: 'Aveia em flocos', h: { kcal: 394, p: 13.9, c: 66.6, f: 8.5 }, def: 30 },
  { k: ['whey', 'scoop'], n: 'Whey protein', u: { g: 30, kcal: 120, p: 24, c: 3, f: 1.5 }, un: 'scoop' },
  { k: ['iogurte'], n: 'Iogurte natural', u: { g: 170, kcal: 100, p: 7, c: 9, f: 4 }, un: 'pote', grp: 'dairy' },
  { k: ['azeite'], n: 'Azeite', u: { g: 13, kcal: 117, p: 0, c: 0, f: 13 }, un: 'col.', grp: 'fat' },
  { k: ['salada'], n: 'Salada de folhas', u: { g: 80, kcal: 20, p: 1, c: 4, f: 0 }, un: 'porção' },
  { k: ['açaí', 'acai'], n: 'Açaí com guaraná', h: { kcal: 110, p: 0.8, c: 21, f: 2.6 }, def: 300 },
  { k: ['cerveja', 'latinha', 'lata', 'latas'], n: 'Cerveja', u: { g: 350, kcal: 147, p: 1.5, c: 11.6, f: 0 }, un: 'lata' },
  { k: ['pizza'], n: 'Pizza de muçarela', u: { g: 110, kcal: 280, p: 12, c: 30, f: 12 }, un: 'fatia' },
  { k: ['café', 'cafe'], n: 'Café sem açúcar', u: { g: 100, kcal: 2, p: 0.3, c: 0, f: 0 }, un: 'xíc.' },
];
const NUMW = { um: 1, uma: 1, dois: 2, duas: 2, 'três': 3, tres: 3, quatro: 4, cinco: 5, seis: 6, meia: 0.5, meio: 0.5 };
function findFood(t) { let best = null, bl = 0; for (const f of FOODS) for (const k of f.k) if (t.includes(k) && k.length > bl) { best = f; bl = k.length; } return best; }
function itemFrom(f, grams, units) {
  if (f.u) { const n = units != null ? units : grams != null ? grams / f.u.g : 1;
    return { label: `${fmt(n, n % 1 ? 1 : 0)} ${f.un} · ${f.n}`, food: f.n, kcal: f.u.kcal * n, p: f.u.p * n, c: f.u.c * n, f: f.u.f * n }; }
  const g = grams != null ? grams : units != null ? units * f.def : f.def, m = g / 100;
  return { label: `${fmt(g)} g · ${f.n}`, food: f.n, kcal: f.h.kcal * m, p: f.h.p * m, c: f.h.c * m, f: f.h.f * m };
}
function parseFood(text) {
  const t0 = text.toLowerCase().replace(/^(hoje\s+)?(eu\s+)?(comi|tomei|bebi)\s+/, '').trim();
  const parts = t0.split(/\s*(?:,|\+|;|\be\b)\s*/).filter(Boolean); const ok = [], miss = [];
  for (const p of parts) {
    const f = findFood(p); if (!f) { miss.push(p); continue; }
    let grams = null, units = null;
    const mg = p.match(/(\d+(?:[.,]\d+)?)\s*(g|gramas|grama|ml)\b/), mn = p.match(/(\d+(?:[.,]\d+)?)/), w = p.split(/\s+/).find(x => NUMW[x] != null);
    if (mg) grams = parseFloat(mg[1].replace(',', '.'));
    else if (mn) { const v = parseFloat(mn[1].replace(',', '.')); if (f.h && v >= 20) grams = v; else units = v; }
    else if (w) units = NUMW[w];
    ok.push(itemFrom(f, grams, units));
  }
  return { ok, miss };
}
const parse1 = q => parseFood(q).ok[0];

const THEMES = {
  a: { name: 'Monumento', desc: 'Leve e geométrico, em tons pastel. Sua foto em tons pastel.', sw: ['#F4EFF8', '#2A2240', '#E8705A', '#F2C46D', '#2FA39A'] },
  b: { name: 'Edição', desc: 'Divertido, com cara de revista e figurinha. Sua foto em preto e branco de jornal, com retícula.', sw: ['#FFFDF4', '#141414', '#FFD21F', '#3D5AFE', '#FF8FB1'] },
  c: { name: 'Estádio', desc: 'Escuro e premium, como um game de futebol. Sua foto recortada no card dourado.', sw: ['#0B1020', '#141B31', '#E9B949', '#F0555A', '#5B8CFF'] },
};

/* ============ workouts ============ */
const W_PADRAO = {
  B: { name: 'Treino B', sub: 'Inferiores', min: 55, ex: [
    { n: 'Agachamento livre', m: 'Rack 2 · barra olímpica', sets: 4, reps: 8, kg: 80, mus: 'Quadríceps, glúteos, core', cues: ['Pés na largura dos ombros, pontas levemente para fora', 'Desça levando o quadril para trás até a coxa passar da paralela', 'Joelhos acompanham a ponta dos pés e o tronco fica firme'], err: 'Tirar o calcanhar do chão ou deixar o joelho fechar para dentro.', q: 'agachamento livre execução' },
    { n: 'Leg press 45°', m: 'Leg press Hammer', sets: 4, reps: 10, kg: 200, mus: 'Quadríceps, glúteos', cues: ['Lombar colada no encosto o tempo todo', 'Desça até cerca de 90° de joelho', 'Não trave o joelho no topo'], err: 'Tirar o quadril do banco no fim da descida.', q: 'leg press 45 execução' },
    { n: 'Cadeira extensora', m: 'Extensora Matrix', sets: 3, reps: 12, kg: 55, mus: 'Quadríceps', cues: ['Eixo da máquina alinhado com o joelho', 'Suba e segure 1 s no topo', 'Desça em 2 a 3 s'], err: 'Usar impulso do quadril.', q: 'cadeira extensora execução' },
    { n: 'Mesa flexora', m: 'Flexora deitada', sets: 3, reps: 12, kg: 45, mus: 'Posteriores de coxa', cues: ['Quadril pressionado contra o banco', 'Puxe até o fim sem tirar o quadril', 'Volte devagar'], err: 'Levantar o quadril para completar o movimento.', q: 'mesa flexora execução' },
    { n: 'Stiff com halteres', m: 'Halteres 22 kg', sets: 3, reps: 10, kg: 44, mus: 'Posteriores, glúteos, lombar', cues: ['Joelhos levemente flexionados e fixos', 'Leve o quadril para trás com a coluna neutra', 'Halteres rentes à perna'], err: 'Arredondar a lombar para descer mais.', q: 'stiff com halteres execução' },
    { n: 'Panturrilha em pé', m: 'Máquina de panturrilha', sets: 4, reps: 15, kg: 60, mus: 'Panturrilhas', cues: ['Amplitude total, alongando embaixo', 'Pause 1 s no topo', 'Ritmo controlado'], err: 'Quicar no fundo do movimento.', q: 'panturrilha em pé execução' },
  ] },
  A: { name: 'Treino A', sub: 'Superiores', min: 55, ex: [
    { n: 'Supino reto', m: 'Banco 3 · barra', sets: 4, reps: 8, kg: 70, mus: 'Peitoral, tríceps, ombro', cues: ['Escápulas retraídas e pés firmes no chão', 'Barra desce na linha do mamilo', 'Empurre sem tirar o quadril do banco'], err: 'Quicar a barra no peito.', q: 'supino reto execução' },
    { n: 'Remada curvada', m: 'Barra W', sets: 4, reps: 10, kg: 60, mus: 'Dorsais, romboides, bíceps', cues: ['Tronco a cerca de 45°, coluna neutra', 'Puxe a barra até o umbigo', 'Cotovelos próximos ao corpo'], err: 'Dar impulso com o tronco.', q: 'remada curvada execução' },
    { n: 'Desenvolvimento com halteres', m: 'Halteres 18 kg', sets: 3, reps: 10, kg: 36, mus: 'Ombros, tríceps', cues: ['Sentado, lombar apoiada', 'Halteres sobem até quase se tocarem', 'Desça até a linha das orelhas'], err: 'Arquear a lombar.', q: 'desenvolvimento com halteres execução' },
    { n: 'Puxada frontal', m: 'Polia alta', sets: 3, reps: 10, kg: 60, mus: 'Dorsais, bíceps', cues: ['Pegada um pouco mais aberta que os ombros', 'Puxe até o alto do peito', 'Peito para cima, sem balançar'], err: 'Puxar atrás da nuca.', q: 'puxada frontal execução' },
    { n: 'Rosca direta', m: 'Barra W', sets: 3, reps: 12, kg: 30, mus: 'Bíceps', cues: ['Cotovelos colados ao corpo', 'Suba sem balançar o tronco', 'Desça controlando'], err: 'Jogar o quadril para frente.', q: 'rosca direta execução' },
    { n: 'Tríceps na corda', m: 'Polia alta · corda', sets: 3, reps: 12, kg: 25, mus: 'Tríceps', cues: ['Cotovelos fixos ao lado do corpo', 'Abra a corda no fim do movimento', 'Volte até 90°'], err: 'Levar os cotovelos para frente.', q: 'triceps corda execução' },
  ] },
  C: { name: 'Treino C', sub: 'Corpo inteiro', min: 50, ex: [
    { n: 'Levantamento terra', m: 'Barra olímpica', sets: 4, reps: 6, kg: 100, mus: 'Posteriores, glúteos, costas', cues: ['Barra encostada na canela', 'Coluna neutra, peito aberto', 'Empurre o chão com os pés'], err: 'Arredondar a lombar.', q: 'levantamento terra execução' },
    { n: 'Supino inclinado com halteres', m: 'Halteres 24 kg', sets: 3, reps: 10, kg: 48, mus: 'Peitoral superior', cues: ['Banco a 30°', 'Desça até a linha do peito', 'Suba sem bater os halteres'], err: 'Abrir demais os cotovelos.', q: 'supino inclinado halteres execução' },
    { n: 'Agachamento búlgaro', m: 'Halteres 12 kg', sets: 3, reps: 10, kg: 24, mus: 'Quadríceps, glúteos', cues: ['Pé de trás apoiado no banco', 'Desça em linha reta', 'Joelho da frente alinhado ao pé'], err: 'Inclinar o tronco demais.', q: 'agachamento bulgaro execução' },
    { n: 'Remada baixa', m: 'Polia baixa · triângulo', sets: 3, reps: 12, kg: 55, mus: 'Costas, bíceps', cues: ['Peito alto, sem balançar', 'Puxe até o abdome', 'Aperte as escápulas no fim'], err: 'Puxar com a lombar.', q: 'remada baixa execução' },
    { n: 'Prancha', m: 'Peso corporal', sets: 3, reps: 45, kg: 0, unit: 's', mus: 'Core', cues: ['Cotovelos abaixo dos ombros', 'Corpo em linha reta', 'Contraia glúteos e abdome'], err: 'Deixar o quadril cair.', q: 'prancha abdominal execução' },
  ] },
};
const SPORTS = [{ n: 'Beach tennis', ic: 'ball' }, { n: 'Crossfit', ic: 'kettle' }, { n: 'Hyrox', ic: 'sled' }, { n: 'Futebol', ic: 'ball' }, { n: 'Natação', ic: 'wave' }, { n: 'Outro', ic: 'star' }];
/* ============ exercise animation engine ============ */
const LEN = { tr: 50, th: 42, sh: 40, ua: 28, fa: 26, ft: 13, neck: 7, head: 8.5 };
const dirv = a => { const r = a * Math.PI / 180; return [Math.sin(r), Math.cos(r)]; };
const addv = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
function ik(P, T, a, b, sgn) {
  let dx = T[0] - P[0], dy = T[1] - P[1], d = Math.hypot(dx, dy) || .001; const dd = clamp(d, Math.abs(a - b) + .5, a + b - .3);
  const ux = dx / d, uy = dy / d, ca = clamp((a * a + dd * dd - b * b) / (2 * a * dd), -1, 1), al = Math.acos(ca) * sgn;
  const rx = ux * Math.cos(al) - uy * Math.sin(al), ry = ux * Math.sin(al) + uy * Math.cos(al);
  const J = [P[0] + rx * a, P[1] + ry * a], E = [J[0] + (T[0] - J[0]) / Math.hypot(T[0] - J[0], T[1] - J[1]) * b, J[1] + (T[1] - J[1]) / Math.hypot(T[0] - J[0], T[1] - J[1]) * b];
  return [J, E];
}
/* pose: hip, tr (hip→shoulder angle), ank (+kd knee sign), ank2/kd2 (second leg), wr (relative to shoulder) +ed elbow sign, ft foot angle, eq points */
function solve(p) {
  const hip = p.hip, sh = addv(hip, dirv(p.tr), LEN.tr), head = addv(sh, dirv(p.tr + (p.hd || 0)), LEN.neck + LEN.head);
  const [kn, an] = ik(hip, p.ank, LEN.th, LEN.sh, p.kd);
  const toe = addv(an, dirv(p.ft == null ? 90 : p.ft), LEN.ft);
  let kn2, an2, toe2; if (p.ank2) { [kn2, an2] = ik(hip, p.ank2, LEN.th, LEN.sh, p.kd2); toe2 = addv(an2, dirv(p.ft2 == null ? 90 : p.ft2), LEN.ft); }
  const W = addv(sh, p.wr), [el, wr] = ik(sh, W, LEN.ua, LEN.fa, p.ed);
  return { hip, sh, head, kn, an, toe, kn2, an2, toe2, el, wr };
}
const lerp = (a, b, t) => typeof a === 'number' ? a + (b - a) * t : Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], t)) : a;
function blend(A, B, t) { const o = {}; for (const k in A) o[k] = B[k] === undefined ? A[k] : lerp(A[k], B[k], t); return o; }
const EZ = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* Poses. Coordinates: ground y=0, figure faces right (+x), y negative is up. */
const ANIM = {
  squat: { hl: ['th', 'tr'], view: [-75, -175, 150, 190],
    A: { hip: [0, -82], tr: 172, ank: [0, 0], kd: -1, wr: [-9, 4], ed: -1, ft: 90 },
    B: { hip: [-22, -31], tr: 140, wr: [-9, 4] },
    p: [['Desça', 2, 'Quadril para trás, coxa abaixo da paralela'], ['Segure', .4], ['Suba', 1.2, 'Empurre o chão com o pé todo'], ['', .6]],
    eq: s => [['bar', addv(s.sh, [-5, -4]), 17]] },
  legpress: { hl: ['th'], view: [-75, -150, 190, 165],
    A: { hip: [0, -30], tr: -125, ank: [56, -86], kd: -1, wr: [33, 26], ed: 1, ft: 45 },
    B: { ank: [34, -64] },
    p: [['Desça', 2, 'Joelhos até cerca de 90°'], ['', .3], ['Empurre', 1.2, 'Lombar colada no encosto'], ['', .6]],
    eq: s => [['rail', [12, -42], [100, -130]], ['sled', s.an, 45], ['seatlp', [0, -30]]] },
  extensora: { hl: ['th'], view: [-70, -120, 170, 150],
    A: { hip: [0, -46], tr: 192, ank: [36, -7], kd: -1, wr: [16, 50], ed: 1, ft: 150 },
    B: { ank: [80, -44], ft: 80 },
    p: [['Estenda', 1.2, 'Segure 1 s no alto'], ['Segure', 1], ['Volte', 2, 'Desça devagar'], ['', .5]],
    eq: s => [['seat', [0, -46]], ['pad', addv(s.an, [4, 2])]] },
  flexora: { hl: ['sh'], view: [-85, -95, 190, 115],
    A: { hip: [0, -36], tr: -90, ank: [82, -38], kd: 1, wr: [-14, 18], ed: 1, ft: 180, hd: 15 },
    B: { ank: [64, -71], ft: 260 },
    p: [['Flexione', 1.2, 'Quadril colado no banco'], ['', .5], ['Volte', 2, 'Controle a descida'], ['', .5]],
    eq: s => [['bench', [-65, -30], [55, -30]], ['pad', addv(s.an, [2, -6])]] },
  stiff: { hl: ['th', 'tr'], view: [-75, -175, 150, 190],
    A: { hip: [-2, -81], tr: 178, ank: [0, 0], kd: -1, wr: [2, 52], ed: 1, ft: 90 },
    B: { hip: [-20, -78], tr: 96, wr: [0, 52] },
    p: [['Desça', 2, 'Quadril para trás, coluna neutra'], ['', .3], ['Suba', 1.2, 'Contraia o glúteo'], ['', .6]],
    eq: s => [['db', s.wr, 8]] },
  calf: { hl: ['sh'], view: [-70, -180, 140, 195],
    A: { hip: [0, -80], tr: 180, ank: [0, 2], kd: -1, wr: [12, -5], ed: 1, ft: 100 },
    B: { hip: [2, -88], ank: [2, -6], ft: 60 },
    p: [['Suba', 1, 'Até a ponta dos pés'], ['Segure', 1], ['Desça', 2, 'Alongue embaixo'], ['', .4]],
    eq: s => [['step', [4, 0]], ['yoke', s.sh]] },
  supino: { hl: ['ua'], view: [-75, -130, 160, 145],
    A: { hip: [32, -32], tr: -90, ank: [62, 0], kd: -1, wr: [0, -53], ed: 1, ft: 90, hd: 0 },
    B: { wr: [10, -13] },
    p: [['Desça', 2, 'Barra na linha do mamilo'], ['', .3], ['Empurre', 1.2, 'Escápulas retraídas'], ['', .6]],
    eq: s => [['bench', [-45, -26], [45, -26]], ['bar', s.wr, 17]] },
  remada: { hl: ['ua', 'tr'], view: [-70, -160, 150, 175],
    A: { hip: [-14, -76], tr: 125, ank: [0, 0], kd: -1, wr: [0, 52], ed: -1, ft: 90 },
    B: { wr: [-24, 22] },
    p: [['Puxe', 1.2, 'Barra até o umbigo'], ['Segure', .4], ['Desça', 2, 'Tronco imóvel'], ['', .5]],
    eq: s => [['bar', s.wr, 17]] },
  desenv: { hl: ['ua'], view: [-70, -185, 150, 200],
    A: { hip: [0, -46], tr: 185, ank: [42, 0], kd: -1, wr: [6, -12], ed: 1, ft: 90 },
    B: { wr: [3, -53] },
    p: [['Empurre', 1.2, 'Halteres quase se tocam'], ['', .3], ['Desça', 2, 'Até a linha das orelhas'], ['', .5]],
    eq: s => [['seatback', [0, -46]], ['db', s.wr, 8]] },
  puxada: { hl: ['ua'], view: [-70, -200, 150, 215],
    A: { hip: [0, -46], tr: 188, ank: [40, 0], kd: -1, wr: [8, -53], ed: 1, ft: 90 },
    B: { tr: 194, wr: [14, 3] },
    p: [['Puxe', 1.2, 'Barra até o alto do peito'], ['Segure', .4], ['Volte', 2, 'Braços quase estendidos'], ['', .5]],
    eq: s => [['cable', [s.wr[0] - 2, -195], s.wr], ['hbar', s.wr], ['seat', [0, -46]], ['kneepad', addv(s.kn, [0, -6])]] },
  rosca: { hl: ['fa'], view: [-60, -175, 130, 190],
    A: { hip: [0, -82], tr: 180, ank: [0, 0], kd: -1, wr: [4, 53], ed: 1, ft: 90 },
    B: { wr: [14, 6] },
    p: [['Suba', 1.2, 'Cotovelos colados ao corpo'], ['Segure', .4], ['Desça', 2, 'Sem balançar'], ['', .5]],
    eq: s => [['bar', s.wr, 13]] },
  triceps: { hl: ['fa'], view: [-60, -205, 160, 220],
    A: { hip: [0, -82], tr: 174, ank: [0, 0], kd: -1, wr: [20, 6], ed: -1, ft: 90 },
    B: { wr: [8, 53] },
    p: [['Estenda', 1.2, 'Abra a corda no fim'], ['Segure', .4], ['Volte', 2, 'Cotovelos fixos'], ['', .5]],
    eq: s => [['cable', addv(s.sh, [42, -70]), s.wr], ['rope', s.wr]] },
  terra: { hl: ['th', 'tr'], view: [-75, -175, 150, 190],
    A: { hip: [-33, -42], tr: 125, ank: [0, 0], kd: -1, wr: [0, 52], ed: 1, ft: 90 },
    B: { hip: [0, -82], tr: 180, wr: [2, 52] },
    p: [['Suba', 1.4, 'Barra rente à perna'], ['', .4], ['Desça', 1.8, 'Quadril para trás primeiro'], ['', .5]],
    eq: s => [['bar', s.wr, 17]] },
  inclinado: { hl: ['ua'], view: [-75, -150, 165, 165],
    A: { hip: [20, -30], tr: -120, ank: [55, 0], kd: -1, wr: [0, -53], ed: 1, ft: 90 },
    B: { wr: [10, -14] },
    p: [['Desça', 2, 'Até a linha do peito'], ['', .3], ['Empurre', 1.2, 'Sem bater os halteres'], ['', .5]],
    eq: s => [['incline', [20, -30]], ['db', s.wr, 8]] },
  bulgaro: { hl: ['th'], view: [-90, -175, 160, 190],
    A: { hip: [-24, -80], tr: 176, ank: [0, 0], kd: -1, ank2: [-64, -30], kd2: -1, ft2: 200, wr: [0, 52], ed: 1, ft: 90 },
    B: { hip: [-26, -46], tr: 166 },
    p: [['Desça', 2, 'Joelho da frente alinhado ao pé'], ['', .3], ['Suba', 1.2, 'Empurre com a perna da frente'], ['', .5]],
    eq: s => [['box', [-78, -30], [-48, 0]], ['db', s.wr, 8]] },
  remadabaixa: { hl: ['ua'], view: [-70, -120, 200, 135],
    A: { hip: [0, -30], tr: 152, ank: [72, -22], kd: -1, wr: [50, 10], ed: -1, ft: 170 },
    B: { tr: 182, wr: [12, 30] },
    p: [['Puxe', 1.2, 'Aperte as escápulas'], ['Segure', .4], ['Volte', 2, 'Peito alto'], ['', .5]],
    eq: s => [['cable', [118, -24], s.wr], ['plate', [80, -22]], ['bench', [-20, -24], [40, -24]]] },
  prancha: { hl: ['tr'], view: [-75, -80, 180, 95],
    A: { hip: [5, -21], tr: -94, ank: [86, -12], kd: 1, wr: [-22, 26], ed: -1, ft: 20, hd: 6 },
    B: { hip: [5, -23] },
    p: [['Segure', 2.5, 'Corpo em linha reta'], ['Respire', 2.5, 'Glúteo e abdome contraídos']],
    eq: s => [] },
};
const EX_ANIM = { 'Agachamento livre': 'squat', 'Leg press 45°': 'legpress', 'Cadeira extensora': 'extensora', 'Mesa flexora': 'flexora', 'Stiff com halteres': 'stiff', 'Panturrilha em pé': 'calf',
  'Supino reto': 'supino', 'Remada curvada': 'remada', 'Desenvolvimento com halteres': 'desenv', 'Puxada frontal': 'puxada', 'Rosca direta': 'rosca', 'Tríceps na corda': 'triceps',
  'Levantamento terra': 'terra', 'Supino inclinado com halteres': 'inclinado', 'Agachamento búlgaro': 'bulgaro', 'Remada baixa': 'remadabaixa', 'Prancha': 'prancha' };

const ASTY = {
  a: { bg: '#F6F1FA', ground: '#D9CFE8', far: '#B9B0CF', near: '#2A2240', hl: '#E8705A', eq: '#F2B544', eq2: '#2FA39A', ink: null, lw: 1, glow: false, deco: 'sun' },
  b: { bg: '#FFF7DA', ground: '#141414', far: '#FFFFFF', near: '#FFFFFF', hl: '#FF8FB1', eq: '#FFD21F', eq2: '#3D5AFE', ink: '#141414', lw: 1, glow: false, deco: 'dots' },
  c: { bg: '#0E1428', ground: '#263157', far: '#3A4677', near: '#E8ECFA', hl: '#E9B949', eq: '#97A3C7', eq2: '#5B8CFF', ink: null, lw: 1, glow: true, deco: 'grid' },
};
function animSVG(id, th, t, thumb) {
  const a = ANIM[id]; if (!a) return '';
  const P = blend(a.A, a.B, t), s = solve(P), st = ASTY[th], [vx, vy, vw, vh] = a.view;
  const W2 = { tr: 15, th: 12, sh: 10, ua: 9, fa: 8, ft: 7 };
  const seg = (p, q, w, col, hl) => {
    const c = hl ? st.hl : col;
    if (st.ink) return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${st.ink}" stroke-width="${w + 5}" stroke-linecap="round"/><line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${hl && st.glow ? 'filter="url(#gl)"' : ''}/>`;
  };
  const H = k => a.hl.includes(k);
  const far = [];
  const off = [-4, -2];
  const fs = { hip: addv(s.hip, off), sh: addv(s.sh, off), kn: addv(s.kn, off), an: addv(s.an, off), toe: addv(s.toe, off), el: addv(s.el, off), wr: addv(s.wr, off) };
  if (!s.an2) far.push(seg(fs.hip, fs.kn, W2.th, st.far, false), seg(fs.kn, fs.an, W2.sh, st.far, false), seg(fs.an, fs.toe, W2.ft, st.far, false));
  far.push(seg(fs.sh, fs.el, W2.ua, st.far, false), seg(fs.el, fs.wr, W2.fa, st.far, false));
  const legs2 = s.an2 ? [seg(s.hip, s.kn2, W2.th, st.far, false), seg(s.kn2, s.an2, W2.sh, st.far, false), seg(s.an2, s.toe2, W2.ft, st.far, false)] : [];
  const body = [seg(s.hip, s.sh, W2.tr, st.near, H('tr')), seg(s.hip, s.kn, W2.th, st.near, H('th')), seg(s.kn, s.an, W2.sh, st.near, H('sh')), seg(s.an, s.toe, W2.ft, st.near, false)];
  const arm = [seg(s.sh, s.el, W2.ua, st.near, H('ua')), seg(s.el, s.wr, W2.fa, st.near, H('fa'))];
  const headC = st.ink ? `<circle cx="${s.head[0]}" cy="${s.head[1]}" r="${LEN.head + 1.5}" fill="${st.near}" stroke="${st.ink}" stroke-width="2.5"/>` : `<circle cx="${s.head[0]}" cy="${s.head[1]}" r="${LEN.head + 1.5}" fill="${st.near}"/>`;
  const ink = st.ink || 'none', sw = st.ink ? 2.5 : 0;
  const E = (a.eq(s) || []).map(([k, p, q, r]) => {
    if (k === 'bar') { const R = q; return `<rect x="${p[0] - 2}" y="${p[1] - R}" width="4" height="${R * 2}" rx="2" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/><circle cx="${p[0]}" cy="${p[1]}" r="${R}" fill="${st.eq}" stroke="${ink}" stroke-width="${sw}"/><circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${st.eq2}"/>`; }
    if (k === 'db') { const R = q; return `<rect x="${p[0] - R}" y="${p[1] - R * .6}" width="${R * 2}" height="${R * 1.2}" rx="3" fill="${st.eq}" stroke="${ink}" stroke-width="${sw}"/>`; }
    if (k === 'bench') return `<rect x="${p[0]}" y="${p[1]}" width="${q[0] - p[0]}" height="7" rx="3" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/><rect x="${p[0] + 6}" y="${p[1] + 7}" width="5" height="${-p[1] - 7}" fill="${st.ground}"/><rect x="${q[0] - 11}" y="${p[1] + 7}" width="5" height="${-p[1] - 7}" fill="${st.ground}"/>`;
    if (k === 'seat') return `<rect x="${p[0] - 14}" y="${p[1] + 6}" width="52" height="8" rx="3" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/><rect x="${p[0] + 8}" y="${p[1] + 14}" width="6" height="${-p[1] - 14}" fill="${st.ground}"/>`;
    if (k === 'seatback') return `<rect x="${p[0] - 14}" y="${p[1] + 6}" width="52" height="8" rx="3" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/><rect x="${p[0] - 18}" y="${p[1] - 52}" width="7" height="60" rx="3" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/><rect x="${p[0] + 8}" y="${p[1] + 14}" width="6" height="${-p[1] - 14}" fill="${st.ground}"/>`;
    if (k === 'incline') return `<g transform="rotate(-30 ${p[0]} ${p[1] + 9})"><rect x="${p[0] - 62}" y="${p[1] + 6}" width="70" height="8" rx="3" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/></g><rect x="${p[0] - 4}" y="${p[1] + 12}" width="6" height="${-p[1] - 12}" fill="${st.ground}"/>`;
    if (k === 'pad') return `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${st.eq}" stroke="${ink}" stroke-width="${sw}"/>`;
    if (k === 'kneepad') return `<rect x="${p[0] - 8}" y="${p[1] - 6}" width="16" height="6" rx="3" fill="${st.eq}" stroke="${ink}" stroke-width="${sw}"/>`;
    if (k === 'rail') return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${st.ground}" stroke-width="4" stroke-linecap="round"/>`;
    if (k === 'sled') return `<g transform="rotate(${-q} ${p[0]} ${p[1]})"><rect x="${p[0] + 4}" y="${p[1] - 22}" width="8" height="44" rx="3" fill="${st.eq}" stroke="${ink}" stroke-width="${sw}"/></g>`;
    if (k === 'seatlp') return `<g transform="rotate(-35 ${p[0]} ${p[1]})"><rect x="${p[0] - 66}" y="${p[1] + 7}" width="78" height="9" rx="3" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/></g>`;
    if (k === 'step') return `<rect x="${p[0]}" y="0" width="26" height="9" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/>`;
    if (k === 'yoke') return `<rect x="${p[0] - 6}" y="${p[1] - 9}" width="20" height="7" rx="3" fill="${st.eq}" stroke="${ink}" stroke-width="${sw}"/><line x1="${p[0] + 20}" y1="${p[1] - 6}" x2="${p[0] + 20}" y2="10" stroke="${st.ground}" stroke-width="4"/>`;
    if (k === 'cable') return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${st.eq2}" stroke-width="1.6" stroke-dasharray="1 0"/><circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${st.ground}"/>`;
    if (k === 'hbar') return `<line x1="${p[0] - 12}" y1="${p[1] - 2}" x2="${p[0] + 12}" y2="${p[1] + 2}" stroke="${st.eq}" stroke-width="4" stroke-linecap="round"/>`;
    if (k === 'rope') return `<line x1="${p[0]}" y1="${p[1]}" x2="${p[0] - 4}" y2="${p[1] + 9}" stroke="${st.eq}" stroke-width="4" stroke-linecap="round"/><line x1="${p[0]}" y1="${p[1]}" x2="${p[0] + 5}" y2="${p[1] + 9}" stroke="${st.eq}" stroke-width="4" stroke-linecap="round"/>`;
    if (k === 'plate') return `<rect x="${p[0]}" y="${p[1] - 16}" width="7" height="32" rx="2" fill="${st.eq}" stroke="${ink}" stroke-width="${sw}"/>`;
    if (k === 'box') return `<rect x="${p[0]}" y="${p[1]}" width="${q[0] - p[0]}" height="${q[1] - p[1]}" rx="3" fill="${st.eq2}" stroke="${ink}" stroke-width="${sw}"/>`;
    return '';
  }).join('');
  let deco = '';
  if (st.deco === 'sun') deco = `<circle cx="${vx + vw * .78}" cy="${vy + vh * .26}" r="${vh * .2}" fill="#FBE3B8"/>`;
  if (st.deco === 'dots') deco = `<defs><pattern id="dt" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.1" fill="#141414" opacity=".18"/></pattern></defs><circle cx="${vx + vw * .78}" cy="${vy + vh * .3}" r="${vh * .24}" fill="url(#dt)"/>`;
  if (st.deco === 'grid') deco = Array.from({ length: 8 }, (_, i) => `<line x1="${vx + i * vw / 7}" y1="0" x2="${vx + vw / 2 + (i - 3.5) * vw / 3}" y2="${vy + vh}" stroke="#263157" stroke-width=".6"/>`).join('');
  const defs = st.glow ? `<defs><filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` : '';
  const sz = thumb ? 'width="100%" height="100%" preserveAspectRatio="xMidYMid meet"' : 'width="100%" style="display:block;max-width:100%"';
  return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" ${sz} role="img" aria-label="Demonstração do movimento">${defs}<rect x="${vx - 400}" y="${vy - 400}" width="${vw + 800}" height="${vh + 800}" fill="${st.bg}"/>${deco}
    <line x1="${vx}" y1="0.5" x2="${vx + vw}" y2="0.5" stroke="${st.ground}" stroke-width="${st.ink ? 3 : 2}"/>${far.join('')}${legs2.join('')}${E}${body.join('')}${headC}${arm.join('')}</svg>`;
}
/* timeline */
function animAt(id, time) { const a = ANIM[id], tot = a.p.reduce((x, p) => x + p[1], 0); let t = time % tot, acc = 0, prog = 0, k = 0;
  for (k = 0; k < a.p.length; k++) { const d = a.p[k][1]; if (t < acc + d) { prog = (t - acc) / d; break; } acc += d; }
  if (k >= a.p.length) k = a.p.length - 1;
  const first = a.p[0][1], up = a.p.length > 2 ? a.p[0][1] + a.p[1][1] : first;
  let pos;
  if (k === 0) pos = EZ(prog); else if (k === 1 && a.p.length > 2) pos = 1; else if (k === 2) pos = 1 - EZ(prog); else if (a.p.length === 2) pos = k === 0 ? EZ(prog) : 1 - EZ(prog); else pos = 0;
  return { pos, k, prog, label: a.p[k][0], cue: a.p[k][2] || '', dur: a.p[k][1] };
}

Object.values(W_PADRAO).forEach(w => w.ex.forEach(e => { e.anim = EX_ANIM[e.n] || null; }));


/* ============ equipment catalog ============ */
const EQUIP = ['Barra olímpica', 'Barra W', 'Barra reta', 'Halteres', 'Kettlebell', 'Anilha', 'Smith', 'Rack de agachamento', 'Banco reto', 'Banco inclinado', 'Banco declinado', 'Banco Scott',
  'Leg press 45°', 'Leg press horizontal', 'Hack', 'Cadeira extensora', 'Cadeira flexora', 'Mesa flexora', 'Cadeira adutora', 'Cadeira abdutora', 'Panturrilha em pé (máquina)', 'Panturrilha sentado',
  'Polia alta', 'Polia baixa', 'Crossover', 'Corda (polia)', 'Triângulo (polia)', 'Puxada frontal (máquina)', 'Remada baixa (máquina)', 'Remada cavalinho', 'Voador (peck deck)', 'Supino máquina',
  'Desenvolvimento máquina', 'Graviton', 'Paralelas', 'Barra fixa', 'Elástico', 'TRX', 'Step', 'Peso corporal'];
const EX_EQUIP = { squat: ['Rack de agachamento', 'Smith', 'Barra olímpica'], legpress: ['Leg press 45°', 'Leg press horizontal', 'Hack'], extensora: ['Cadeira extensora'], flexora: ['Mesa flexora', 'Cadeira flexora'],
  stiff: ['Halteres', 'Barra olímpica', 'Barra reta'], calf: ['Panturrilha em pé (máquina)', 'Smith', 'Leg press 45°', 'Step'], supino: ['Banco reto', 'Supino máquina', 'Smith'], remada: ['Barra W', 'Barra olímpica', 'Halteres'],
  desenv: ['Halteres', 'Desenvolvimento máquina', 'Smith'], puxada: ['Puxada frontal (máquina)', 'Polia alta', 'Barra fixa'], rosca: ['Barra W', 'Barra reta', 'Halteres', 'Polia baixa'], triceps: ['Polia alta', 'Corda (polia)', 'Crossover'],
  terra: ['Barra olímpica', 'Halteres', 'Kettlebell'], inclinado: ['Banco inclinado', 'Halteres', 'Smith'], bulgaro: ['Halteres', 'Banco reto', 'Smith'], remadabaixa: ['Remada baixa (máquina)', 'Polia baixa', 'Triângulo (polia)'], prancha: ['Peso corporal'] };
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const allEquip = () => [...S.customEquip, ...EQUIP.filter(e => !S.customEquip.includes(e))];
function comboItems(i) {
  const e = W[S.active].ex[i], cur = e.m, raw = (S.comboQ || '').trim(), q = norm(raw), sug = EX_EQUIP[e.anim] || [];
  const items = !q ? [...new Set([...sug, ...S.customEquip, cur].filter(Boolean))] : allEquip().filter(n => norm(n).includes(q)).slice(0, 8);
  const exact = q && allEquip().some(n => norm(n) === q);
  return `${!q ? '<p class="tiny muted" style="margin:2px 6px">Sugeridos para este exercício</p>' : ''}
    ${items.map(n => `<button class="combo-it ${n === cur ? 'on' : ''}" data-a="pickeq" data-ex="${i}" data-v="${esc(n)}">${esc(n)}${S.customEquip.includes(n) ? ' <span class="tiny muted">· seu</span>' : ''}</button>`).join('')}
    ${q && !items.length ? '<p class="tiny muted" style="margin:4px 6px">Nenhum aparelho com esse nome.</p>' : ''}
    ${q && !exact ? `<button class="combo-it add" data-a="addeq" data-ex="${i}">${ic('plus', 15)} Adicionar “${esc(raw)}”</button>` : ''}
    ${!q ? `<p class="tiny muted" style="margin:6px 6px 0">Digite para buscar entre ${allEquip().length} aparelhos ou criar um novo.</p>` : ''}`;
}
function comboHTML(i, st) {
  if (S.comboOpen === i) return `<div class="combo"><span class="tiny muted">Aparelho</span><div class="combo-pop">
    <div class="combo-search">${ic('search', 16)}<input id="comboq" class="in" placeholder="Buscar ou digitar um aparelho" value="${esc(S.comboQ || '')}" data-i="comboq" data-ex="${i}" autocomplete="off" aria-label="Buscar aparelho"></div>
    <div class="combo-list" id="combolist" role="listbox">${comboItems(i)}</div></div></div>`;
  return `<div class="combo"><span class="tiny muted">Aparelho</span><button class="in combo-btn" data-a="combo" data-ex="${i}" aria-haspopup="listbox"><span>${esc(st.m || 'Escolher aparelho')}</span><span class="chev">${ic('down', 16)}</span></button></div>`;
}
function setEquip(i, v) { W[S.active].ex[i].m = v; const ss = ensureSess(S.active); if (ss[i]) ss[i].m = v; S.comboOpen = null; S.comboQ = ''; }

/* ============ exercise library ============ */
const LIBX = [
  { n: 'Agachamento no Smith', anim: 'squat', mus: 'Quadríceps, glúteos', m: 'Smith', sets: 4, reps: 10, kg: 40, cues: ['Pés levemente à frente da barra', 'Desça até a coxa ficar paralela ao chão', 'Suba empurrando com o pé todo'], err: 'Deixar o joelho fechar para dentro.', q: 'agachamento smith execução' },
  { n: 'Hack', anim: 'squat', mus: 'Quadríceps', m: 'Hack', sets: 4, reps: 10, kg: 60, cues: ['Costas apoiadas no encosto', 'Desça controlando até cerca de 90°', 'Suba sem travar os joelhos'], err: 'Tirar o quadril do encosto.', q: 'hack machine execução' },
  { n: 'Afundo com halteres', anim: 'bulgaro', mus: 'Quadríceps, glúteos', m: 'Halteres', sets: 3, reps: 10, kg: 20, cues: ['Dê um passo longo à frente', 'Desça o joelho de trás em direção ao chão', 'Volte empurrando com a perna da frente'], err: 'Inclinar o tronco para a frente.', q: 'afundo halteres execução' },
  { n: 'Levantamento terra romeno', anim: 'stiff', mus: 'Posteriores, glúteos', m: 'Barra olímpica', sets: 3, reps: 8, kg: 60, cues: ['Joelhos levemente flexionados', 'Leve o quadril para trás com a barra rente às coxas', 'Suba contraindo o glúteo'], err: 'Arredondar a lombar.', q: 'terra romeno execução' },
  { n: 'Panturrilha no leg press', anim: 'calf', mus: 'Panturrilhas', m: 'Leg press 45°', sets: 4, reps: 15, kg: 120, cues: ['Ponta dos pés na borda da plataforma', 'Alongue bem embaixo', 'Empurre até a ponta dos pés'], err: 'Dobrar os joelhos durante o movimento.', q: 'panturrilha leg press execução' },
  { n: 'Supino reto com halteres', anim: 'supino', mus: 'Peitoral, tríceps', m: 'Halteres', sets: 4, reps: 10, kg: 52, cues: ['Escápulas retraídas', 'Desça até a linha do peito', 'Empurre sem bater os halteres'], err: 'Abrir demais os cotovelos.', q: 'supino halteres execução' },
  { n: 'Supino no Smith', anim: 'supino', mus: 'Peitoral, tríceps', m: 'Smith', sets: 4, reps: 8, kg: 50, cues: ['Barra alinhada com o meio do peito', 'Desça controlando', 'Empurre sem tirar o quadril do banco'], err: 'Quicar a barra no peito.', q: 'supino smith execução' },
  { n: 'Remada unilateral com halter', anim: 'remada', mus: 'Dorsais, bíceps', m: 'Halteres', sets: 3, reps: 10, kg: 26, cues: ['Mão e joelho apoiados no banco', 'Puxe o halter em direção ao quadril', 'Desça até alongar'], err: 'Girar o tronco para puxar.', q: 'remada unilateral execução' },
  { n: 'Remada cavalinho', anim: 'remada', mus: 'Dorsais, romboides', m: 'Remada cavalinho', sets: 4, reps: 10, kg: 40, cues: ['Peito apoiado ou tronco firme', 'Puxe até o abdome', 'Cotovelos próximos ao corpo'], err: 'Usar impulso das pernas.', q: 'remada cavalinho execução' },
  { n: 'Puxada com triângulo', anim: 'puxada', mus: 'Dorsais, bíceps', m: 'Triângulo (polia)', sets: 3, reps: 10, kg: 55, cues: ['Peito para cima', 'Puxe até o alto do peito', 'Volte com controle'], err: 'Balançar o tronco.', q: 'puxada triângulo execução' },
  { n: 'Barra fixa', anim: 'puxada', mus: 'Dorsais, bíceps', m: 'Barra fixa', sets: 3, reps: 6, kg: 0, cues: ['Pegada um pouco mais aberta que os ombros', 'Suba até o queixo passar a barra', 'Desça até estender os braços'], err: 'Balançar o corpo para subir.', q: 'barra fixa execução' },
  { n: 'Desenvolvimento no Smith', anim: 'desenv', mus: 'Ombros, tríceps', m: 'Smith', sets: 3, reps: 10, kg: 30, cues: ['Sentado, lombar apoiada', 'Barra desce até a altura do queixo', 'Empurre até quase estender'], err: 'Arquear a lombar.', q: 'desenvolvimento smith execução' },
  { n: 'Rosca alternada', anim: 'rosca', mus: 'Bíceps', m: 'Halteres', sets: 3, reps: 10, kg: 24, cues: ['Cotovelos colados ao corpo', 'Gire o punho ao subir', 'Alterne os braços'], err: 'Balançar o tronco.', q: 'rosca alternada execução' },
  { n: 'Rosca martelo', anim: 'rosca', mus: 'Bíceps, antebraço', m: 'Halteres', sets: 3, reps: 12, kg: 24, cues: ['Pegada neutra, palmas viradas para o corpo', 'Suba sem mexer os cotovelos', 'Desça devagar'], err: 'Jogar o halter para cima.', q: 'rosca martelo execução' },
  { n: 'Tríceps na polia com barra', anim: 'triceps', mus: 'Tríceps', m: 'Polia alta', sets: 3, reps: 12, kg: 30, cues: ['Cotovelos fixos ao lado do corpo', 'Estenda até o fim', 'Volte até 90°'], err: 'Levar os cotovelos para a frente.', q: 'triceps pulley barra execução' },
  { n: 'Prancha lateral', anim: 'prancha', mus: 'Oblíquos, core', m: 'Peso corporal', sets: 3, reps: 30, kg: 0, unit: 's', cues: ['Cotovelo abaixo do ombro', 'Quadril alto, corpo em linha', 'Respire sem soltar o abdome'], err: 'Deixar o quadril cair.', q: 'prancha lateral execução' },
  { n: 'Elevação lateral', anim: null, mus: 'Ombros', m: 'Halteres', sets: 3, reps: 12, kg: 16, cues: ['Cotovelos levemente flexionados', 'Suba até a linha dos ombros', 'Desça devagar'], err: 'Subir os ombros junto.', q: 'elevação lateral execução' },
  { n: 'Crucifixo', anim: null, mus: 'Peitoral', m: 'Halteres', sets: 3, reps: 12, kg: 24, cues: ['Cotovelos levemente dobrados e fixos', 'Abra até sentir alongar o peito', 'Feche como num abraço'], err: 'Descer demais e forçar o ombro.', q: 'crucifixo halteres execução' },
  { n: 'Elevação pélvica', anim: null, mus: 'Glúteos', m: 'Barra olímpica', sets: 4, reps: 10, kg: 60, cues: ['Escápulas apoiadas no banco', 'Suba o quadril até alinhar com o tronco', 'Contraia o glúteo no alto'], err: 'Arquear a lombar no topo.', q: 'elevação pélvica execução' },
  { n: 'Cadeira adutora', anim: null, mus: 'Adutores', m: 'Cadeira adutora', sets: 3, reps: 15, kg: 40, cues: ['Costas apoiadas', 'Feche as pernas controlando', 'Volte devagar'], err: 'Usar impulso.', q: 'cadeira adutora execução' },
  { n: 'Cadeira abdutora', anim: null, mus: 'Glúteo médio', m: 'Cadeira abdutora', sets: 3, reps: 15, kg: 40, cues: ['Costas apoiadas', 'Abra as pernas até o fim', 'Volte devagar'], err: 'Inclinar o tronco.', q: 'cadeira abdutora execução' },
  { n: 'Abdominal supra', anim: null, mus: 'Abdome', m: 'Peso corporal', sets: 3, reps: 20, kg: 0, cues: ['Joelhos dobrados, pés no chão', 'Suba tirando as escápulas do chão', 'Desça devagar'], err: 'Puxar o pescoço com as mãos.', q: 'abdominal supra execução' },
];
const LIB = (() => { const seen = new Set(), out = []; Object.values(W_PADRAO).forEach(w => w.ex.forEach(e => { if (!seen.has(e.n)) { seen.add(e.n); out.push(e); } })); LIBX.forEach(e => { if (!seen.has(e.n)) { seen.add(e.n); out.push(e); } }); return out; })();
function exItems(q) {
  const raw = (q || '').trim(), n = norm(raw), have = new Set(W[S.active].ex.map(e => e.n));
  const items = LIB.filter(e => !n || norm(e.n + ' ' + e.mus).includes(n)).slice(0, 40);
  return items.map(e => `<button class="row" data-a="pickex" data-v="${esc(e.n)}"><span class="exthumb sm">${e.anim ? animSVG(e.anim, S.theme, .55, true) : ic('dumbbell', 20)}</span>
    <span style="min-width:0"><span class="t">${esc(e.n)}</span><span class="s">${esc(e.mus)}${have.has(e.n) ? ' · já está no treino' : ''}${e.anim ? '' : ' · sem animação'}</span></span><span class="chev">${ic('plus', 18)}</span></button>`).join('')
    + (n && !LIB.some(e => norm(e.n) === n) ? `<button class="row" data-a="customex"><span class="tile">${ic('plus')}</span><span><span class="t">Criar “${esc(raw)}”</span><span class="s">Exercício personalizado</span></span><span></span></button>` : '')
    + (!items.length && !n ? '' : '');
}

/* ============ caricature engine ============ */
const MP_VER = '0.1.1675465747';
const MP_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@${MP_VER}/`;
const FD_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/';
let FD = null, fdLoading = null;
function initFD() {
  if (fdLoading) return fdLoading;
  fdLoading = (async () => {
    if (!window.FaceDetection) await loadScript(FD_CDN + 'face_detection.js');
    const fd = new window.FaceDetection({ locateFile: f => FD_CDN + f });
    fd.setOptions({ model: 'full', minDetectionConfidence: 0.45, selfieMode: false });
    await fd.initialize(); FD = fd; return fd;
  })();
  fdLoading.catch(() => { fdLoading = null; });
  return fdLoading;
}
async function detectFace(canvas) {
  const fd = await withTimeout(initFD(), 30000);
  const dets = await withTimeout(new Promise(res => { fd.onResults(r => res(r.detections || [])); fd.send({ image: canvas }); }), 15000);
  if (!dets.length) return null;
  const b = dets.map(d => d.boundingBox).sort((x, y) => y.width * y.height - x.width * x.height)[0];
  const w = canvas.width, h = canvas.height, fw = b.width * w, fh = b.height * h;
  return { cx: b.xCenter * w, top: b.yCenter * h - fh * .5 - fh * .5, m: fw * 1.4, hh: fh * 1.7, fy: b.yCenter * h };
}
const CW = 360, CH = 450, PV = 0.8;
const PH = { src: null, cut: null, iw: 0, ih: 0, head: null, segOK: false, prev: {}, crop: { z: 1, x: 0, y: 0 } };
let SEG = null, segLoading = null;
const hex3 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mk = (w = CW, h = CH) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.crossOrigin = 'anonymous'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
function initSeg() {
  if (segLoading) return segLoading;
  segLoading = (async () => {
    if (!window.SelfieSegmentation) await loadScript(MP_CDN + 'selfie_segmentation.js');
    const seg = new window.SelfieSegmentation({ locateFile: f => MP_CDN + f });
    seg.setOptions({ modelSelection: 0, selfieMode: false });
    await seg.initialize(); SEG = seg; return seg;
  })();
  segLoading.catch(() => { segLoading = null; });
  return segLoading;
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
async function segment(canvas) {
  const seg = await withTimeout(initSeg(), 30000);
  return withTimeout(new Promise(res => { seg.onResults(r => res(r.segmentationMask)); seg.send({ image: canvas }); }), 15000);
}
function makeCut(src, mask) {
  const w = src.width, h = src.height, c = mk(w, h), g = c.getContext('2d');
  if (mask) g.drawImage(mask, 0, 0, w, h);
  else { g.fillStyle = '#000'; g.beginPath(); g.ellipse(w / 2, h * .36, w * .21, h * .25, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(w / 2, h * 1.02, w * .44, h * .4, 0, 0, Math.PI * 2); g.fill(); }
  g.globalCompositeOperation = 'source-in'; g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-over';
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 3; i < d.length; i += 4) { const a = d[i] / 255, t = clamp((a - .35) / .3, 0, 1); d[i] = 255 * t * t * (3 - 2 * t); }
  g.putImageData(id, 0, 0); return c;
}
function faceSilhouette(w, h, f) { const c = mk(w, h), g = c.getContext('2d'); g.fillStyle = '#000';
  g.beginPath(); g.ellipse(f.cx, f.top + f.hh * .5, f.m * .55, f.hh * .58, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(f.cx, f.top + f.hh * 1.05 + f.m * 1.1, f.m * 1.5, f.m * 1.15, 0, 0, Math.PI * 2); g.fill(); return c; }
function headBox(cut) {
  const w = cut.width, h = cut.height, d = cut.getContext('2d').getImageData(0, 0, w, h).data, Wd = new Array(h).fill(0), Cx = new Array(h).fill(w / 2);
  for (let y = 0; y < h; y++) { let n = 0, sx = 0; for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) { n++; sx += x; } Wd[y] = n; if (n) Cx[y] = sx / n; }
  const top = Wd.findIndex(v => v > w * .02);
  if (top < 0) return { cx: w / 2, top: h * .15, m: w * .4, hh: w * .52 };
  let m = 0, chin = -1;
  for (let y = top; y < h; y++) { if (Wd[y] > m) m = Wd[y]; if (y > top + .6 * m && Wd[y] < .86 * m) { chin = y; break; } if (y > top + 2 * m) break; }
  if (chin < 0) { const seg = Wd.slice(top, top + Math.max(5, Math.round((h - top) * .3))).sort((a, b) => a - b); m = seg[Math.floor(seg.length / 2)] || w * .4; chin = Math.min(h - 1, Math.round(top + 1.25 * m)); }
  let cx = 0, n = 0; for (let y = top; y <= chin; y++) { cx += Cx[y]; n++; }
  return { cx: cx / n, top, m, hh: Math.max(chin - top, m * .9) };
}
const xform = crop => { const sr = Math.max(CW / PH.iw, CH / PH.ih) * crop.z; return { sr, left: (CW - PH.iw * sr) / 2 + crop.x * CW * .5, top: (CH - PH.ih * sr) / 2 + crop.y * CH * .5 }; };
function autoCrop() {
  const hb = PH.head, base = Math.max(CW / PH.iw, CH / PH.ih), z = clamp((CW * .44) / hb.m / base, .3, 5), sr = base * z;
  const left = CW / 2 - hb.cx * sr, top = CH * .12 - hb.top * sr;
  PH.crop = { z, x: (left - (CW - PH.iw * sr) / 2) / (CW * .5), y: (top - (CH - PH.ih * sr) / 2) / (CH * .5) };
}
function baseCut() {
  const c = mk(), g = c.getContext('2d'), t = xform(PH.crop), hb = PH.head;
  g.drawImage(PH.cut, t.left, t.top, PH.iw * t.sr, PH.ih * t.sr);
  return { c, fx: t.left + hb.cx * t.sr, fy: t.top + (hb.fy != null ? hb.fy : hb.top + .55 * hb.hh) * t.sr, R: Math.max(hb.m, hb.hh) * .85 * t.sr };
}
function smooth(c, px) { const o = mk(), g = o.getContext('2d'); if ('filter' in g) g.filter = `blur(${px}px)`; g.drawImage(c, 0, 0); return o; }
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function hsl2rgb(h, s, l) { if (!s) return [l * 255, l * 255, l * 255]; const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]; }
function quantize(d, k) {
  const px = []; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 110) px.push(i);
  const lab = new Int16Array(d.length / 4).fill(-1); if (!px.length) return { C: [], lab };
  const step = Math.max(1, Math.floor(px.length / 5000)), sm = []; for (let j = 0; j < px.length; j += step) sm.push(px[j]);
  sm.sort((a, b) => (d[a] + d[a + 1] + d[a + 2]) - (d[b] + d[b + 1] + d[b + 2]));
  let C = []; for (let j = 0; j < k; j++) { const i = sm[Math.floor((j + .5) / k * sm.length)]; C.push([d[i], d[i + 1], d[i + 2]]); }
  const near = i => { let b = 0, bd = 1e9; for (let j = 0; j < C.length; j++) { const c = C[j], dd = (d[i] - c[0]) ** 2 + (d[i + 1] - c[1]) ** 2 + (d[i + 2] - c[2]) ** 2; if (dd < bd) { bd = dd; b = j; } } return b; };
  for (let it = 0; it < 8; it++) { const S = C.map(() => [0, 0, 0, 0]); for (const i of sm) { const s = S[near(i)]; s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; s[3]++; } C = C.map((c, j) => S[j][3] ? [S[j][0] / S[j][3], S[j][1] / S[j][3], S[j][2] / S[j][3]] : c); }
  for (const i of px) lab[i / 4] = near(i);
  const L2 = lab.slice();
  for (let y = 1; y < CH - 1; y++) for (let x = 1; x < CW - 1; x++) { const p = y * CW + x; if (lab[p] < 0) continue; const cnt = {};
    for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { const v = lab[p + yy * CW + xx]; if (v >= 0) cnt[v] = (cnt[v] || 0) + 1; }
    let bv = lab[p], bc = 0; for (const v in cnt) if (cnt[v] > bc) { bc = cnt[v]; bv = +v; } L2[p] = bv; }
  return { C, lab: L2 };
}
function outlineMask(alpha, r) { const out = new Uint8Array(CW * CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const p = y * CW + x; if (alpha[p]) continue;
    search: for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { if (xx * xx + yy * yy > r * r) continue; const X = x + xx, Y = y + yy; if (X < 0 || Y < 0 || X >= CW || Y >= CH) continue; if (alpha[Y * CW + X]) { out[p] = 1; break search; } } }
  return out; }
function pix(fn) {
  const b = baseCut(), g = b.c.getContext('2d'), id = g.getImageData(0, 0, CW, CH), d = id.data;
  fn(d); g.putImageData(id, 0, 0); return b.c;
}
const lumOf = (d, i) => (.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]) / 255;
function levels(d) { const L = []; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) L.push(lumOf(d, i)); L.sort((x, y) => x - y);
  const lo = L[Math.floor(L.length * .02)] || 0, hi = L[Math.floor(L.length * .98)] || 1; return v => clamp((v - lo) / Math.max(hi - lo, .1), 0, 1); }
function edgeAlpha(d) { const a = new Uint8Array(CW * CH); for (let p = 0; p < a.length; p++) a[p] = d[p * 4 + 3] > 128 ? 1 : 0; return a; }
function addOutline(c, col, r) {
  const g = c.getContext('2d'), id = g.getImageData(0, 0, CW, CH), d = id.data, ol = outlineMask(edgeAlpha(d), r), k = hex3(col);
  for (let p = 0; p < ol.length; p++) if (ol[p]) { const i = p * 4; d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
}
function fadeBottom(c, frac) { const g = c.getContext('2d'), id = g.getImageData(0, 0, CW, CH), d = id.data;
  for (let y = 0; y < CH; y++) { const f = clamp((CH - y) / (CH * frac), 0, 1); if (f >= 1) continue; for (let x = 0; x < CW; x++) d[(y * CW + x) * 4 + 3] *= f; }
  g.putImageData(id, 0, 0); return c; }
/* A · Monumento: foto real em tritom pastel */
function styleA() {
  const stops = [[0, hex3('#3B2F5C')], [.45, hex3('#C9604E')], [.75, hex3('#F2A88E')], [1, hex3('#FFF2DA')]];
  const ramp = v => { for (let j = 1; j < stops.length; j++) if (v <= stops[j][0]) { const [p0, c0] = stops[j - 1], [p1, c1] = stops[j], t = (v - p0) / (p1 - p0); return [0, 1, 2].map(k => c0[k] + (c1[k] - c0[k]) * t); } return stops[stops.length - 1][1]; };
  const c = pix(d => { const lv = levels(d); for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const t = ramp(lv(lumOf(d, i)));
    d[i] = t[0] * .82 + d[i] * .18; d[i + 1] = t[1] * .82 + d[i + 1] * .18; d[i + 2] = t[2] * .82 + d[i + 2] * .18; } });
  return addOutline(c, '#FFFFFF', 3).toDataURL('image/png');
}
/* B · Edição: foto P&B de jornal, retícula nas sombras, contorno preto */
function styleB() {
  const c = pix(d => { const lv = levels(d); for (let p = 0, i = 0; i < d.length; i += 4, p++) { if (!d[i + 3]) continue;
    let v = lv(lumOf(d, i)); v = v < .5 ? 2 * v * v : 1 - 2 * (1 - v) * (1 - v);
    const x = p % CW, y = (p / CW) | 0, cx = ((x + y) % 5) - 2, cy = ((x - y + 500) % 5) - 2, rr = (1 - v) * 2.6;
    let o = v * 255; if (v < .62 && cx * cx + cy * cy < rr * rr) o = Math.min(o, 20);
    d[i] = 20 + 235 * o / 255; d[i + 1] = 20 + 233 * o / 255; d[i + 2] = 20 + 224 * o / 255; } });
  return addOutline(c, '#141414', 3).toDataURL('image/png');
}
/* C · Estádio: foto colorida de carta de jogador, com luz de contorno dourada */
function styleC() {
  const c = pix(d => { const alpha = edgeAlpha(d), R = 6;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const p = y * CW + x, i = p * 4; if (!alpha[p]) continue;
      let best = R + 1; for (let yy = -R; yy <= R; yy += 2) for (let xx = -R; xx <= R; xx += 2) { const X = x + xx, Y = y + yy; if (X < 0 || Y < 0 || X >= CW || Y >= CH || !alpha[Y * CW + X]) { const dd = Math.hypot(xx, yy); if (dd < best) best = dd; } }
      let r = d[i], g = d[i + 1], b = d[i + 2]; const l = .299 * r + .587 * g + .114 * b;
      r = l + (r - l) * 1.12; g = l + (g - l) * 1.12; b = l + (b - l) * 1.12;
      r = (r - 128) * 1.14 + 133; g = (g - 128) * 1.14 + 128; b = (b - 128) * 1.14 + 118;
      const rim = best <= R ? (1 - best / R) * .45 : 0; r += (255 - r) * rim; g += (226 - g) * rim; b += (150 - b) * rim;
      d[i] = clamp(r, 0, 255); d[i + 1] = clamp(g, 0, 255); d[i + 2] = clamp(b, 0, 255); } });
  return fadeBottom(c, .16).toDataURL('image/png');
}
const STYLE = { a: styleA, b: styleB, c: styleC };
async function loadPhoto(dataURL) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataURL; });
  const sc = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight)), src = mk(Math.round(img.naturalWidth * sc), Math.round(img.naturalHeight * sc));
  src.getContext('2d').drawImage(img, 0, 0, src.width, src.height);
  let face = null, mask = null;
  try { face = await detectFace(src); } catch (e) { face = null; }
  try { mask = await segment(src); } catch (e) { mask = null; }
  PH.src = src; PH.iw = src.width; PH.ih = src.height; PH.segOK = !!mask; PH.faceOK = !!face;
  if (!mask && face) mask = faceSilhouette(src.width, src.height, face);
  PH.cut = makeCut(src, mask); PH.head = face || headBox(PH.cut); PH.prev = {}; autoCrop();
}
function genPreviews() { ['a', 'b', 'c'].forEach(k => PH.prev[k] = STYLE[k]()); }
function drawCrop() {
  const cv = $('#cropcv'); if (!cv || !PH.src) return; const g = cv.getContext('2d'), t = xform(PH.crop), W2 = cv.width, H2 = cv.height, f = W2 / CW;
  g.fillStyle = '#2B2840'; g.fillRect(0, 0, W2, H2);
  g.drawImage(PH.src, t.left * f, t.top * f, PH.iw * t.sr * f, PH.ih * t.sr * f);
  const hw = CW * .44 * f, hh = hw * 1.25, cx = W2 / 2, top = CH * .12 * f;
  g.save(); g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.rect(0, 0, W2, H2); g.ellipse(cx, top + hh / 2, hw / 2 + 6, hh / 2 + 6, 0, 0, Math.PI * 2); g.fill('evenodd');
  g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeStyle = '#FFFFFF'; g.beginPath(); g.ellipse(cx, top + hh / 2, hw / 2 + 6, hh / 2 + 6, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(W2 * .08, H2); g.quadraticCurveTo(W2 * .1, top + hh + 26 * f, cx, top + hh + 22 * f); g.quadraticCurveTo(W2 * .9, top + hh + 26 * f, W2 * .92, H2); g.stroke(); g.restore();
}
let pvT;
function schedulePreviews() { clearTimeout(pvT); const row = $('#pvrow'); if (row) row.style.opacity = '.45'; pvT = setTimeout(() => { if (!PH.src || !S.sheet || S.sheet.k !== 'photo') return; genPreviews(); const r = $('#pvrow'); if (r) { r.innerHTML = pvCards(); r.style.opacity = '1'; } }, 260); }
function pvCards() { const u = me(), tmp = S.carica; S.carica = PH.prev; const h = ['a', 'b', 'c'].map(k => `<div class="center" style="gap:6px">${pcard(u, 'sm', k)}<span class="tiny muted">${k.toUpperCase()} · ${THEMES[k].name}</span></div>`).join(''); S.carica = tmp; return h; }
function bindCrop() {
  const cv = $('#cropcv'); if (!cv) return; drawCrop(); const pts = new Map(); let pinch = 0;
  const f = () => cv.getBoundingClientRect().width / CW;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  cv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { PH.crop.x += (e.clientX - prev[0]) / f() / (CW * .5); PH.crop.y += (e.clientY - prev[1]) / f() / (CH * .5); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoomBy(dd / pinch); pinch = dd; }
    drawCrop(); });
  const up = e => { pts.delete(e.pointerId); pinch = 0; schedulePreviews(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * .0015)); drawCrop(); schedulePreviews(); }, { passive: false });
}
function zoomBy(k) { const t0 = xform(PH.crop), cx = (CW / 2 - t0.left) / t0.sr, cy = (CH * .4 - t0.top) / t0.sr; PH.crop.z = clamp(PH.crop.z * k, .25, 6);
  const sr = Math.max(CW / PH.iw, CH / PH.ih) * PH.crop.z, left = CW / 2 - cx * sr, top = CH * .4 - cy * sr;
  PH.crop.x = (left - (CW - PH.iw * sr) / 2) / (CW * .5); PH.crop.y = (top - (CH - PH.ih * sr) / 2) / (CH * .5); }
