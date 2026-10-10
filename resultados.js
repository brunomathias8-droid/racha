/* resultados.js — medidas do corpo (peso, % de gordura, massa muscular, cintura), tendência, gasto estimado
   e a ligação entre disciplina e resultado. Tudo fica no estado pessoal (S.body, S.adh): só a própria pessoa vê. */
'use strict';

const MED_FONTES = [['balanca', 'Balança'], ['bio', 'Bioimpedância'], ['nutri', 'Nutricionista']];
const KCAL_KG = 7700;            // energia aproximada de 1 kg de peso corporal
const ALFA_TEND = 0.1;           // suavização da tendência (média móvel exponencial diária)
const ADH_BOA = 80;              // semana "disciplinada": 80% ou mais do plano cumprido
const pnum = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : null; };
const sinal = (n, d = 1) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n), d);

/* ------------------------------ aderência do dia (0 a 100) ------------------------------ */
/* Treino (se era dia de treino), dieta (refeições do plano ou macros fechados) e hábitos, com o mesmo peso. */
function aderenciaDe(h) {
  const c = [];
  if (h.planned) c.push(h.trained ? 1 : 0); else if (h.trained) c.push(1);
  if (h.mealsPlan) c.push(h.macros ? 1 : Math.min(1, (h.meals || 0) / h.mealsPlan));
  if (h.habTot) c.push(Math.min(1, (h.hab || 0) / h.habTot));
  return c.length ? Math.round(c.reduce((a, x) => a + x, 0) / c.length * 100) : null;
}
function diaAoVivo() {
  const h = { ...(S.hist[S.day] || {}) }, w = S.week[diaIdx(S.day)];
  h.planned = !!(w && w.type !== 'rest'); h.hab = S.habits.filter(habDone).length; h.habTot = S.habits.length;
  h.meals = S.meals.filter(m => m.done && !m.skip).length; h.mealsPlan = S.meals.length; h.macros = !!S.flags.macros;
  return h;
}
function aderenciaDia(dia) {
  if (dia === S.day) return aderenciaDe(diaAoVivo());
  if (S.adh[dia]) return S.adh[dia][0];
  return S.hist[dia] ? aderenciaDe(S.hist[dia]) : null;
}
function kcalDia(dia) {
  if (dia === S.day) return null; // o dia de hoje ainda não acabou
  if (S.adh[dia]) return S.adh[dia][1] || null;
  return S.hist[dia] && S.hist[dia].kcal ? S.hist[dia].kcal : null;
}
/* Chamado na virada do dia (base.js): guarda um resumo compacto que dura 2 anos. */
function guardarResumoDia(dia) {
  const h = S.hist[dia] || {};
  S.adh[dia] = [aderenciaDe(h), Math.round(h.kcal || 0)];
  const lim = somaDias(dia, -730); Object.keys(S.adh).forEach(k => { if (k < lim) delete S.adh[k]; });
}

/* ------------------------------ medidas e tendência ------------------------------ */
const regsOrd = () => [...S.body.regs].sort((a, b) => a.d.localeCompare(b.d) || (a.id > b.id ? 1 : -1));
/* Peso diário com os buracos preenchidos (reta entre pesagens) e a tendência (média móvel exponencial).
   Depois da última pesagem a tendência fica parada: não inventa o futuro. */
function serieTendencia() {
  const pes = regsOrd().filter(r => r.w), raw = {};
  pes.forEach(r => { raw[r.d] = r.w; });
  const ds = Object.keys(raw).sort(); if (!ds.length) return null;
  const fim = ds[ds.length - 1] > S.day ? ds[ds.length - 1] : S.day, dias = [], tr = {}, xi = {};
  let t = null, k = 0;
  for (let d = ds[0]; d <= fim; d = somaDias(d, 1)) {
    while (k < ds.length - 1 && ds[k + 1] <= d) k++;
    let x;
    if (raw[d] != null) x = raw[d];
    else if (k < ds.length - 1) { const a = ds[k], b = ds[k + 1], f = N_diasEntre(a, d) / N_diasEntre(a, b); x = raw[a] + (raw[b] - raw[a]) * f; }
    else x = null;
    if (x != null) { t = t == null ? x : t + ALFA_TEND * (x - t); xi[d] = x; }
    dias.push(d); tr[d] = t;
  }
  /* Média centrada de 7 dias: para comparar semanas passadas. A tendência reage com atraso e jogaria o
     resultado de uma semana na seguinte; a média centrada não tem esse atraso (perto das pontas usa os dias que houver). */
  const cen = {};
  Object.keys(xi).forEach(d => { let sm = 0, n = 0; for (let j = -3; j <= 3; j++) { const v = xi[somaDias(d, j)]; if (v != null) { sm += v; n++; } } cen[d] = sm / n; });
  return { dias, raw, tr, cen, primeiro: ds[0], ultimo: ds[ds.length - 1], n: ds.length };
}
function ultimaCom(campo) { const r = regsOrd().filter(x => x[campo] != null); return r.length ? r[r.length - 1] : null; }
function primeiraCom(campo) { return regsOrd().find(x => x[campo] != null) || null; }

/* Objetivo: perder ou ganhar peso. Usa a meta; sem meta, a anamnese. */
function objetivoPeso(atual) {
  const m = S.body.meta;
  if (m && atual) return m < atual - 0.3 ? 'perder' : m > atual + 0.3 ? 'ganhar' : 'manter';
  const g = (S.ana && S.ana.goal) || [];
  return g.includes('Perder gordura') ? 'perder' : g.includes('Ganhar massa') ? 'ganhar' : 'perder';
}
const imcCat = v => v < 18.5 ? 'abaixo do peso' : v < 25 ? 'faixa saudável' : v < 30 ? 'sobrepeso' : 'obesidade';

/* Semanas de segunda a domingo: aderência média e quanto a tendência do peso mudou. */
function semanasRes(T) {
  const out = []; if (!T) return out;
  for (let seg = N_segunda(T.primeiro); seg <= S.day; seg = somaDias(seg, 7)) {
    const dom = somaDias(seg, 6), ate = dom < S.day ? dom : S.day, ad = [];
    for (let d = seg; d <= ate; d = somaDias(d, 1)) { const a = aderenciaDia(d); if (a != null) ad.push(a); }
    const ini = somaDias(seg, -1), t0 = T.cen[ini] != null ? T.cen[ini] : null, t1 = T.cen[ate] != null ? T.cen[ate] : null;
    out.push({ seg, ate, parcial: ate < dom, adh: ad.length ? Math.round(ad.reduce((a, x) => a + x, 0) / ad.length) : null, nAdh: ad.length,
      dw: t0 != null && t1 != null ? t1 - t0 : null });
  }
  return out;
}
/* A frase que fecha o ciclo: só com 4 semanas completas e pelo menos uma de cada lado. */
function insightDisciplina(sem, obj) {
  const ok = sem.filter(s => !s.parcial && s.adh != null && s.nAdh >= 4 && s.dw != null);
  const boas = ok.filter(s => s.adh >= ADH_BOA), outras = ok.filter(s => s.adh < ADH_BOA);
  if (ok.length < 4 || !boas.length || !outras.length) return { falta: Math.max(0, 4 - ok.length), ok: ok.length };
  const med = l => l.reduce((a, s) => a + s.dw, 0) / l.length, mb = med(boas), mo = med(outras);
  const verbo = v => obj === 'ganhar' ? (v >= 0 ? `ganhou ${fmt(v, 1)} kg` : `perdeu ${fmt(-v, 1)} kg`) : (v <= 0 ? `perdeu ${fmt(-v, 1)} kg` : `ganhou ${fmt(v, 1)} kg`);
  return { texto: `Nas semanas em que você cumpriu ${ADH_BOA}% ou mais do plano, ${verbo(mb)} por semana, em média. Nas outras, ${verbo(mo)}.`, nb: boas.length, no: outras.length };
}
/* Gasto real estimado: o que comeu menos (ou mais) o que o corpo guardou, nas últimas 3 semanas. */
function gastoEstimado(T) {
  const N = 21, fim = somaDias(S.day, -1), ini = somaDias(fim, -(N - 1)), kc = [];
  for (let d = ini; d <= fim; d = somaDias(d, 1)) { const k = kcalDia(d); if (k && k > 400) kc.push(k); }
  const pronto = T && T.primeiro <= somaDias(ini, -1) && T.ultimo >= somaDias(fim, -6) && kc.length >= 14;
  if (!pronto) return { pronto: false, dias: kc.length, pesoOk: !!(T && T.primeiro <= somaDias(ini, -1)) };
  const media = kc.reduce((a, x) => a + x, 0) / kc.length, dw = T.tr[fim] - T.tr[somaDias(ini, -1)];
  return { pronto: true, comeu: Math.round(media), gasto: Math.round((media - dw * KCAL_KG / N) / 10) * 10, dias: kc.length };
}

/* ------------------------------ gráficos (SVG) ------------------------------ */
/* Um valor por posição no eixo X. A dica (tooltip) mostra todas as séries daquela posição. */
const GRAF = {}, GW = 340;
function passoBonito(faixa, alvo) { const c = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]; return c.find(s => faixa / s <= alvo) || c[c.length - 1]; }
function escalaY(vals, ref, zero) {
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (ref != null) { lo = Math.min(lo, ref); hi = Math.max(hi, ref); }
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const st = passoBonito(hi - lo, 4); lo = Math.floor(lo / st) * st; hi = Math.ceil(hi / st) * st;
  const ticks = []; for (let v = lo; v <= hi + st / 2; v += st) ticks.push(+v.toFixed(4));
  return { lo, hi, ticks, st };
}
function fmtTick(v, st) { return fmt(v, st % 1 === 0 ? 0 : st % 0.5 === 0 || st % 0.1 < 1e-9 ? 1 : 2); }
function moldura(id, H, y, sy, xr, labelsX, corpo) {
  const ax = sy.ticks.map(v => `<line x1="34" x2="${GW - 6}" y1="${y(v)}" y2="${y(v)}" class="ch-grid"/><text x="30" y="${y(v) + 3.5}" text-anchor="end" class="ch-t">${fmtTick(v, sy.st)}</text>`).join('');
  const lx = labelsX.map(([x, t, an]) => `<text x="${x}" y="${H - 6}" text-anchor="${an || 'middle'}" class="ch-t">${t}</text>`).join('');
  return `<div class="ch" data-ch="${id}"><svg viewBox="0 0 ${GW} ${H}" role="img" aria-label="${esc(GRAF[id].titulo)}">${ax}${lx}${corpo}
    <line class="ch-cross" x1="0" x2="0" y1="8" y2="${H - 22}" style="display:none"/><rect class="ch-hit" x="34" y="0" width="${GW - 40}" height="${H - 18}" fill="transparent"/></svg><div class="ch-tip" hidden></div></div>`;
}
/* Linhas e pontos. series: [{nome, cor, v: [valor ou null por posição], pontos: só pontos (sem linha), fim: rótulo no fim}] */
function grafLinha(id, o) {
  const H = 172, n = o.n, xs = i => 40 + (n > 1 ? i * (GW - 40 - 44) / (n - 1) : (GW - 84) / 2);
  const todos = o.series.flatMap(s => s.v.filter(v => v != null)); if (!todos.length) return '';
  const sy = escalaY(todos, o.ref ? o.ref.v : null), y = v => 10 + (sy.hi - v) / (sy.hi - sy.lo) * (H - 10 - 26);
  let corpo = '';
  if (o.ref) corpo += `<line x1="34" x2="${GW - 44}" y1="${y(o.ref.v)}" y2="${y(o.ref.v)}" class="ch-ref"/><text x="${GW - 40}" y="${y(o.ref.v) + 3.5}" class="ch-t">${o.ref.rot}</text>`;
  o.series.forEach(s => {
    if (s.pontos) { corpo += s.v.map((v, i) => v == null ? '' : `<circle cx="${xs(i)}" cy="${y(v)}" r="3" fill="${s.cor}" opacity=".45"/>`).join(''); return; }
    let d = '', on = false; s.v.forEach((v, i) => { if (v == null) { on = false; return; } d += (on ? 'L' : 'M') + xs(i).toFixed(1) + ',' + y(v).toFixed(1); on = true; });
    corpo += `<path d="${d}" fill="none" stroke="${s.cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const li = s.v.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).pop();
    if (li != null && li >= 0) corpo += `<circle cx="${xs(li)}" cy="${y(s.v[li])}" r="4.5" fill="${s.cor}" stroke="var(--s1)" stroke-width="2"/>` +
      (s.fim ? `<text x="${xs(li) + 8}" y="${y(s.v[li]) + 4}" class="ch-t ch-strong">${s.fim}</text>` : '');
  });
  GRAF[id] = { titulo: o.titulo, x: xs, n, rows: i => [o.rotX(i), ...o.series.filter(s => s.v[i] != null).map(s => [s.cor, s.nome, o.fmtV(s.v[i])])] };
  const lab = n > 1 ? [[xs(0), o.rotX(0), 'start'], [xs(n - 1), o.rotX(n - 1), 'end']] : [[xs(0), o.rotX(0)]];
  return moldura(id, H, y, sy, xs, lab, corpo);
}
/* Colunas a partir do zero; com valores negativos vira divergente. cor(v, i) escolhe a cor de cada coluna. */
function grafColunas(id, o) {
  const H = 150, n = o.vals.length, slot = (GW - 44) / Math.max(n, 1), bw = Math.min(24, slot * 0.62), xs = i => 40 + slot * i + slot / 2;
  const vs = o.vals.filter(v => v != null); if (!vs.length) return '';
  const sy = o.fixo ? { lo: o.fixo[0], hi: o.fixo[1], ticks: o.fixo[2], st: o.fixo[2][1] - o.fixo[2][0] } : escalaY(vs, null, true);
  const y = v => 10 + (sy.hi - v) / (sy.hi - sy.lo) * (H - 10 - 26), y0 = y(Math.max(sy.lo, 0));
  const barra = (x, v) => { const y1 = y(v), h = Math.abs(y1 - y0), r = Math.min(4, h), l = x - bw / 2, rr = x + bw / 2;
    if (h < 0.5) return `M${l},${y0 - 1}H${rr}V${y0}H${l}Z`;
    return v >= 0 ? `M${l},${y0}V${y1 + r}Q${l},${y1} ${l + r},${y1}H${rr - r}Q${rr},${y1} ${rr},${y1 + r}V${y0}Z`
      : `M${l},${y0}V${y1 - r}Q${l},${y1} ${l + r},${y1}H${rr - r}Q${rr},${y1} ${rr},${y1 - r}V${y0}Z`; };
  let corpo = `<line x1="34" x2="${GW - 6}" y1="${y0}" y2="${y0}" class="ch-base"/>`;
  corpo += o.vals.map((v, i) => v == null ? '' : `<path d="${barra(xs(i), v)}" fill="${o.cor(v, i)}" ${o.parcial && o.parcial(i) ? 'opacity=".5"' : ''}/>`).join('');
  const li = o.vals.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).pop();
  if (li >= 0 && o.rotFim) corpo += `<text x="${xs(li)}" y="${o.vals[li] >= 0 ? y(o.vals[li]) - 5 : y(o.vals[li]) + 12}" text-anchor="middle" class="ch-t ch-strong">${o.rotFim(o.vals[li])}</text>`;
  GRAF[id] = { titulo: o.titulo, x: xs, n, rows: i => [o.rotX(i), ...(o.vals[i] == null ? [] : [[o.cor(o.vals[i], i), o.nome, o.fmtV(o.vals[i])]])] };
  const lab = n > 1 ? [[xs(0), o.rotX(0)], [xs(n - 1), o.rotX(n - 1)]] : [[xs(0), o.rotX(0)]];
  return moldura(id, H, y, sy, xs, lab, corpo);
}
/* Dica: a linha vertical acha a posição mais próxima do dedo; mostra a data e cada série. */
function dicaGraf(e) {
  const box = e.target.closest('.ch'); if (!box) return; const c = GRAF[box.dataset.ch]; if (!c) return;
  const svg = box.querySelector('svg'), r = svg.getBoundingClientRect(), xv = (e.clientX - r.left) * GW / r.width;
  let i = 0, best = 1e9; for (let k = 0; k < c.n; k++) { const dd = Math.abs(c.x(k) - xv); if (dd < best) { best = dd; i = k; } }
  const ln = svg.querySelector('.ch-cross'), x = c.x(i); ln.setAttribute('x1', x); ln.setAttribute('x2', x); ln.style.display = '';
  const tip = box.querySelector('.ch-tip'), [rot, ...rows] = c.rows(i); tip.textContent = '';
  const t = document.createElement('div'); t.className = 'ch-tip-h'; t.textContent = rot; tip.appendChild(t);
  rows.forEach(([cor, nome, val]) => { const l = document.createElement('div'); l.className = 'ch-tip-r';
    const k = document.createElement('i'); k.style.background = cor; const b = document.createElement('b'); b.textContent = val; const s = document.createElement('span'); s.textContent = nome;
    l.append(k, b, s); tip.appendChild(l); });
  tip.hidden = false; const pct = x / GW; tip.style.left = pct > 0.6 ? '' : `calc(${pct * 100}% + 8px)`; tip.style.right = pct > 0.6 ? `calc(${(1 - pct) * 100}% + 8px)` : '';
}
document.addEventListener('pointermove', e => { if (e.target.closest && e.target.closest('.ch')) dicaGraf(e); });
document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.ch')) dicaGraf(e); });
document.addEventListener('pointerout', e => { const b = e.target.closest && e.target.closest('.ch'); if (b && !b.contains(e.relatedTarget)) { b.querySelector('.ch-tip').hidden = true; b.querySelector('.ch-cross').style.display = 'none'; } });

/* ------------------------------ telas ------------------------------ */
function resumoRes() {
  const T = serieTendencia(), uw = ultimaCom('w'), atual = T ? T.tr[T.ultimo] : null;
  const ritmo = T && N_diasEntre(T.primeiro, T.ultimo) >= 7 ? T.tr[T.ultimo] - T.tr[somaDias(T.ultimo, -7)] : null;
  return { T, uw, atual, ritmo, obj: objetivoPeso(atual) };
}
/* Cartão na tela Hoje */
function cardResultados() {
  const R = resumoRes();
  if (!R.uw) return `<button class="row" data-a="sheet" data-k="res"><span class="tile">${ic('chart')}</span><span><span class="t">Seus resultados</span><span class="s">Registre o peso para acompanhar a evolução · só você vê</span></span><span class="chev">${ic('chev', 18)}</span></button>`;
  const bom = R.ritmo == null ? null : R.obj === 'ganhar' ? R.ritmo > 0.05 : R.obj === 'perder' ? R.ritmo < -0.05 : Math.abs(R.ritmo) <= 0.2;
  return `<button class="row" data-a="sheet" data-k="res"><span class="tile">${ic('chart')}</span><span><span class="t">Peso ${fmt(R.atual, 1)} kg <span class="muted" style="font-weight:500">(tendência)</span></span><span class="s">${R.ritmo == null ? `Última pesagem ${rotuloDia(R.uw.d).toLowerCase()}` : `<span class="${bom ? 'c-good' : ''}">${sinal(R.ritmo)} kg na última semana</span>`} · ver evolução</span></span><span class="chev">${ic('chev', 18)}</span></button>`;
}
function tile(rot, val, sub) { return `<div class="panel" style="gap:2px;padding:12px 14px"><span class="tiny muted">${rot}</span><span class="h3 num">${val}</span>${sub ? `<span class="tiny muted">${sub}</span>` : ''}</div>`; }

SH.res = () => {
  const R = resumoRes(), T = R.T, B = S.body;
  const topo = `${head('Resultados', 'Sua evolução')}<p class="tiny muted">${ic('lock', 13)} Só você vê estes dados. O grupo não tem acesso.</p>`;
  const botoes = `<div class="qa"><button class="btn" data-a="sheet" data-k="medida">${ic('plus', 16)} Registrar medidas</button><button class="btn ghost sm" data-a="sheet" data-k="medcfg">Altura e meta</button></div>`;
  if (!B.regs.length) return `${topo}<div class="note"><span>Registre seu peso (e, se tiver, % de gordura, massa muscular e cintura) para ver a evolução. Com algumas semanas de pesagens e do dia a dia no app, aparece aqui a relação entre a sua disciplina e o seu resultado.</span></div>${botoes}`;

  // números do momento
  const tiles = [];
  if (R.atual != null) { const p0 = primeiraCom('w'); tiles.push(tile('Peso (tendência)', `${fmt(R.atual, 1)} kg`, p0 && p0.d < R.uw.d ? `${sinal(R.atual - p0.w)} kg desde ${fmtCurta(p0.d)}` : `pesagem de ${fmtCurta(R.uw.d)}: ${fmt(R.uw.w, 1)} kg`)); }
  if (R.ritmo != null) tiles.push(tile('Ritmo', `${sinal(R.ritmo, 2)} kg/sem`, B.meta && R.atual != null && Math.abs(R.ritmo) > 0.05 && Math.sign(B.meta - R.atual) === Math.sign(R.ritmo) ? `meta em ~${Math.ceil(Math.abs(B.meta - R.atual) / Math.abs(R.ritmo))} semanas` : B.meta ? `meta ${fmt(B.meta, 1)} kg` : 'última semana'));
  if (R.atual != null && B.h) { const imc = R.atual / Math.pow(B.h / 100, 2); tiles.push(tile('IMC', fmt(imc, 1), imcCat(imc))); }
  [['bf', '% de gordura', '%', 1], ['mm', 'Massa muscular', ' kg', 1], ['cin', 'Cintura', ' cm', 1]].forEach(([k, rot, u, d]) => {
    const a = ultimaCom(k), p = primeiraCom(k); if (!a) return;
    tiles.push(tile(rot, `${fmt(a[k], d)}${u}`, p && p.d < a.d ? `${sinal(a[k] - p[k], d)}${u.trim() === '%' ? ' p.p.' : u} desde ${fmtCurta(p.d)}` : `em ${fmtCurta(a.d)}`)); });

  // disciplina × resultado
  const sem = semanasRes(T).slice(-12), ins = insightDisciplina(semanasRes(T), R.obj);
  const rotS = i => fmtCurta(sem[i].seg);
  const cAdh = sem.length ? grafColunas('gadh', { titulo: 'Disciplina por semana', nome: 'Plano cumprido', vals: sem.map(s => s.adh), fixo: [0, 100, [0, 50, 100]],
    cor: () => 'var(--ch1)', parcial: i => sem[i].parcial, rotX: rotS, fmtV: v => `${v}%`, rotFim: v => `${v}%` }) : '';
  const bomDw = v => R.obj === 'ganhar' ? v > 0 : v < 0;
  const cDw = sem.some(s => s.dw != null) ? grafColunas('gdw', { titulo: 'Variação do peso por semana', nome: 'Variação da tendência', vals: sem.map(s => s.dw == null ? null : +s.dw.toFixed(2)),
    cor: v => bomDw(v) ? 'var(--ch1)' : 'var(--mut)', parcial: i => sem[i].parcial, rotX: rotS, fmtV: v => `${sinal(v, 2)} kg`, rotFim: v => `${sinal(v, 1)}` }) : '';

  // peso no período escolhido
  const per = S.resP || '90', ini = per === 'tudo' ? T && T.primeiro : somaDias(S.day, -(+per - 1));
  let cPeso = '';
  if (T) { const dias = T.dias.filter(d => d >= ini); if (dias.length) cPeso = grafLinha('gpeso', { titulo: 'Peso e tendência', n: dias.length, rotX: i => fmtCurta(dias[i]), fmtV: v => `${fmt(v, 1)} kg`,
    ref: B.meta ? { v: B.meta, rot: 'meta' } : null,
    series: [{ nome: 'Pesagem', cor: 'var(--mut)', pontos: true, v: dias.map(d => T.raw[d] != null ? T.raw[d] : null) },
      { nome: 'Tendência', cor: 'var(--ch1)', v: dias.map(d => d <= T.ultimo ? +T.tr[d].toFixed(2) : null), fim: fmt(T.tr[T.ultimo], 1) }] }); }

  // composição
  const comp = regsOrd().filter(r => r.bf != null && (r.w != null || T));
  let cComp = '';
  /* Mudança desde a primeira medição: massa gorda (uns 20 kg) e magra (uns 65 kg) no mesmo eixo achatariam as duas linhas. */
  if (comp.length >= 2) { const pw = r => r.w != null ? r.w : T.tr[r.d] != null ? T.tr[r.d] : T.tr[T.ultimo];
    const g = comp.map(r => pw(r) * r.bf / 100), m = comp.map(r => pw(r) * (1 - r.bf / 100));
    cComp = grafLinha('gcomp', { titulo: 'Composição corporal', n: comp.length, rotX: i => fmtCurta(comp[i].d), fmtV: v => `${sinal(v, 1)} kg`,
      series: [{ nome: 'Massa gorda', cor: 'var(--ch2)', v: g.map(x => +(x - g[0]).toFixed(1)), fim: sinal(g[g.length - 1] - g[0], 1) },
        { nome: 'Massa magra', cor: 'var(--ch1)', v: m.map(x => +(x - m[0]).toFixed(1)), fim: sinal(m[m.length - 1] - m[0], 1) }] }); }

  const G = gastoEstimado(T);
  const hist = regsOrd().reverse();
  return `${topo}
  <div class="grid2">${tiles.join('')}</div>
  ${R.atual != null && B.h ? '<p class="tiny muted">O IMC não separa músculo de gordura: para quem treina, a % de gordura e a cintura dizem mais.</p>' : ''}
  ${botoes}

  <p class="eb">Disciplina × resultado</p>
  ${ins.texto ? `<div class="note good"><span>${ins.texto}</span></div><p class="tiny muted">Base: ${ins.nb} semana${ins.nb > 1 ? 's' : ''} com ${ADH_BOA}% ou mais e ${ins.no} abaixo. É uma comparação, não uma garantia: sono, estresse e água também mexem no peso.</p>`
    : `<div class="note"><span>Com 4 semanas completas de pesagens e do seu dia a dia no app, aqui aparece quanto o seu resultado muda nas semanas mais disciplinadas.${ins.ok != null ? ` Faltam ${ins.falta} semana${ins.falta === 1 ? '' : 's'} (ou semanas dos dois lados: acima e abaixo de ${ADH_BOA}%).` : ''} Pese-se pelo menos 1 vez por semana.</span></div>`}
  ${cAdh ? `<p class="small"><b>Plano cumprido por semana</b> <span class="muted">· treino, dieta e hábitos</span></p>${cAdh}` : ''}
  ${cDw ? `<p class="small"><b>Variação do peso na semana</b> <span class="muted">· média de 7 dias; ${R.obj === 'ganhar' ? 'subir' : 'descer'} na cor de destaque</span></p>${cDw}` : ''}
  ${sem.length ? `<details class="small"><summary class="muted">Ver em tabela</summary><div class="panel tbwrap" style="padding:8px 14px"><table class="tb"><tbody><tr><td></td><td><b>Semana de</b></td><td><b>Plano · peso</b></td></tr>${sem.map(s => `<tr><td></td><td>${fmtCurta(s.seg)}${s.parcial ? ' (em curso)' : ''}</td><td>${s.adh == null ? '–' : s.adh + '%'} · ${s.dw == null ? '–' : sinal(s.dw, 2) + ' kg'}</td></tr>`).join('')}</tbody></table></div></details>` : ''}

  ${cPeso ? `<p class="eb">Peso</p><div class="chips">${[['30', '30 dias'], ['90', '90 dias'], ['365', '1 ano'], ['tudo', 'Tudo']].map(([v, t]) => `<button class="chip ${per === v ? 'on' : ''}" data-a="resp" data-v="${v}">${t}</button>`).join('')}</div>
  <p class="tiny muted"><span class="lk" style="background:var(--ch1)"></span>Tendência <span class="lk dot" style="background:var(--mut)"></span>Pesagem. O peso do dia oscila 1 a 2 kg com água e sal; a tendência mostra o que está mudando de verdade.</p>${cPeso}` : ''}

  <p class="eb">Comeu × gastou</p>
  ${G.pronto ? `<div class="grid2">${tile('Comeu (média)', `${fmt(G.comeu)} kcal`, `${G.dias} dias registrados`)}${tile('Gasto estimado', `~${fmt(G.gasto)} kcal`, 'por dia, últimas 3 semanas')}</div>
    <div class="note"><span>${G.comeu < G.gasto - 100 ? `Você está comendo cerca de <b>${fmt(G.gasto - G.comeu)} kcal</b> a menos do que gasta.` : G.comeu > G.gasto + 100 ? `Você está comendo cerca de <b>${fmt(G.comeu - G.gasto)} kcal</b> a mais do que gasta.` : 'Você está comendo perto do que gasta: o peso tende a ficar estável.'} ${S.goals ? `Sua meta é ${fmt(S.goals.kcal)} kcal.` : ''}</span></div>
    <p class="tiny muted">Estimativa pelo que você registrou na dieta e pela tendência do peso. Quanto mais completo o registro, mais certa ela fica.</p>`
    : `<div class="note"><span>Calculamos quanto você gasta de verdade cruzando o que você come com a tendência do peso. Precisa de 3 semanas de pesagens e de pelo menos 14 dias com a dieta registrada (você tem ${G.dias} nas últimas 3 semanas).</span></div>`}

  ${cComp ? `<p class="eb">Composição corporal</p><p class="tiny muted"><span class="lk" style="background:var(--ch1)"></span>Massa magra <span class="lk" style="background:var(--ch2)"></span>Massa gorda: quanto cada uma mudou, em kg, desde ${fmtCurta(comp[0].d)}. Calculado pelo peso e pela % de gordura; compare medições da mesma fonte.</p>${cComp}` : ''}

  <p class="eb">Histórico</p>
  <div class="stack" style="gap:6px">${hist.map(r => `<button class="row" data-a="sheet" data-k="medida" data-id="${r.id}"><span class="tile">${ic('chart', 18)}</span><span><span class="t num">${[r.w != null && `${fmt(r.w, 1)} kg`, r.bf != null && `${fmt(r.bf, 1)}% gordura`, r.mm != null && `${fmt(r.mm, 1)} kg músculo`, r.cin != null && `cintura ${fmt(r.cin, 1)} cm`].filter(Boolean).join(' · ')}</span><span class="s">${fmtCurta(r.d)}${r.src ? ' · ' + (MED_FONTES.find(f => f[0] === r.src) || [, ''])[1] : ''}</span></span><span class="chev">${ic('edit', 16)}</span></button>`).join('')}</div>`;
};

SH.medida = s => {
  const r = s.id ? S.body.regs.find(x => x.id === s.id) : null;
  if (!s.init) { Object.assign(s, { init: true, d: r ? r.d : S.day, w: r && r.w != null ? fmt(r.w, 1) : '', bf: r && r.bf != null ? fmt(r.bf, 1) : '', mm: r && r.mm != null ? fmt(r.mm, 1) : '',
    cin: r && r.cin != null ? fmt(r.cin, 1) : '', src: r ? r.src : (S.body.src || 'balanca'), h: S.body.h ? String(S.body.h) : '' }); }
  const campo = (k, rot, ph) => `<label class="stack" style="gap:4px"><span class="tiny muted">${rot}</span><input class="in num" id="med-${k}" data-med="${k}" inputmode="decimal" placeholder="${ph}" value="${esc(s[k])}"></label>`;
  return `${head('Resultados', r ? 'Editar medidas' : 'Registrar medidas')}
  <label class="stack" style="gap:4px"><span class="tiny muted">Data</span><input class="in" type="date" id="med-d" data-med="d" max="${S.day}" value="${esc(s.d)}"></label>
  <div class="grid2">${campo('w', 'Peso (kg)', 'Ex.: 82,4')}${campo('bf', '% de gordura', 'opcional')}${campo('mm', 'Massa muscular (kg)', 'opcional')}${campo('cin', 'Cintura (cm)', 'opcional')}</div>
  ${S.body.h ? '' : campo('h', 'Sua altura (cm), para o IMC', 'Ex.: 178')}
  <p class="eb">De onde veio</p><div class="chips">${MED_FONTES.map(([v, t]) => `<button class="chip ${s.src === v ? 'on' : ''}" data-a="medsrc" data-v="${v}">${t}</button>`).join('')}</div>
  <p class="tiny muted">Cada método mede a % de gordura de um jeito; para comparar, use sempre a mesma fonte. Pese-se de manhã, em jejum, depois de ir ao banheiro.</p>
  <div class="qa">${r ? `<button class="btn ghost sm" data-a="meddel">${ic('trash', 14)} Apagar</button>` : ''}<button class="btn" data-a="medok" style="margin-left:auto">Salvar</button></div>`;
};
SH.medcfg = s => {
  if (!s.init) Object.assign(s, { init: true, h: S.body.h ? String(S.body.h) : '', meta: S.body.meta ? fmt(S.body.meta, 1) : '' });
  return `${head('Resultados', 'Altura e meta')}
  <div class="grid2"><label class="stack" style="gap:4px"><span class="tiny muted">Altura (cm)</span><input class="in num" id="med-h" data-med="h" inputmode="numeric" value="${esc(s.h)}" placeholder="Ex.: 178"></label>
  <label class="stack" style="gap:4px"><span class="tiny muted">Meta de peso (kg)</span><input class="in num" id="med-meta" data-med="meta" inputmode="decimal" value="${esc(s.meta)}" placeholder="opcional"></label></div>
  <p class="tiny muted">A meta aparece no gráfico do peso e permite estimar em quantas semanas você chega lá.</p>
  <button class="btn block" data-a="medcfgok">Salvar</button>`;
};

/* Guarda o que a pessoa digita (a sincronização redesenha o painel e os outros campos não podem voltar vazios). */
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.med; if (k && S.sheet) S.sheet[k] = e.target.value; });

Object.assign(A, {
  resp: d => { S.resP = d.v; renderSheet(); },
  medsrc: d => { S.sheet.src = d.v; renderSheet(); },
  medok: () => {
    const s = S.sheet, lim = (v, a, b, nome) => { if (v == null) return null; if (v < a || v > b) throw new Error(`Confira ${nome}: entre ${a} e ${b}.`); return Math.round(v * 10) / 10; };
    let r;
    try { r = { w: lim(pnum(s.w), 25, 350, 'o peso'), bf: lim(pnum(s.bf), 2, 75, 'a % de gordura'), mm: lim(pnum(s.mm), 5, 150, 'a massa muscular'), cin: lim(pnum(s.cin), 35, 250, 'a cintura') }; }
    catch (x) { toast(x.message); return; }
    if (r.w == null && r.bf == null && r.mm == null && r.cin == null) { toast('Preencha pelo menos uma medida'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.d || '') || s.d > S.day) { toast('Confira a data'); return; }
    const h = pnum(s.h); if (!S.body.h && h) { if (h < 100 || h > 250) { toast('Confira a altura, em centímetros'); return; } S.body.h = Math.round(h); }
    const novo = { id: s.id || 'r' + uidNovo(), d: s.d, src: s.src, ...Object.fromEntries(Object.entries(r).filter(([, v]) => v != null)) };
    S.body.regs = S.body.regs.filter(x => x.id !== novo.id).concat(novo); S.body.src = s.src;
    closeSheet(); openSheet({ k: 'res' });
    if (!s.id && !S.flags.medXP) { S.flags.medXP = true; addXP(10); toast('Medidas registradas · +10 XP'); } else toast('Medidas salvas');
    render();
  },
  meddel: () => { const id = S.sheet.id; S.body.regs = S.body.regs.filter(x => x.id !== id); closeSheet(); openSheet({ k: 'res' }); toast('Registro apagado'); render(); },
  medcfgok: () => {
    const s = S.sheet, h = pnum(s.h), m = pnum(s.meta);
    if (h != null && (h < 100 || h > 250)) { toast('Confira a altura, em centímetros'); return; }
    if (m != null && (m < 25 || m > 350)) { toast('Confira a meta de peso'); return; }
    S.body.h = h ? Math.round(h) : null; S.body.meta = m ? Math.round(m * 10) / 10 : null;
    closeSheet(); openSheet({ k: 'res' }); toast('Salvo'); render();
  }
});
