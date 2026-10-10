/* telas.js — telas principais, cards e painéis (sheets). */
'use strict';

const capital = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const iniciais = n => String(n || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
const nomeDe = id => id === 'u' ? 'Você' : esc(mem(id).name);

/* ============ retratos e cards ============ */
function ghostSVG(p, th, crop) {
  const vb = crop ? '20 18 60 60' : '0 0 100 120';
  const shirt = th === 'a' ? (p.team === 'B' ? '#7DB9E0' : '#E8705A') : th === 'b' ? (p.team === 'B' ? '#3D5AFE' : '#FF8FB1') : (p.team === 'B' ? '#5B8CFF' : '#F0555A');
  const head = th === 'a' ? '#E2D6EE' : th === 'b' ? '#EFE7CC' : '#2A3558', ink = th === 'a' ? '#7A6E99' : th === 'b' ? '#141414' : '#8FA0D6';
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M8 120 C8 96 26 86 50 86 C74 86 92 96 92 120 Z" fill="${shirt}"/>
    <ellipse cx="50" cy="51" rx="23" ry="26" fill="${head}"${th === 'b' ? ' stroke="#141414" stroke-width="2.4"' : ''}/>
    <text x="50" y="59" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="19" fill="${ink}">${esc(iniciais(p.name))}</text></svg>`;
}
function photoOf(p, th) {
  if (p.id === 'u') return S.carica ? S.carica[th] : null;
  const id = p.foto && p.foto[th]; return id ? S.fotos[id] || null : null;
}
function portrait(p, th) { const src = photoOf(p, th); return src ? `<img src="${src}" alt="">` : ghostSVG(p, th, false); }
function av(p, s = 32) {
  const src = photoOf(p, S.theme);
  const bg = S.theme === 'a' ? '#E9E1F2' : S.theme === 'b' ? '#FFF7DA' : '#1C2541';
  return `<span class="av" style="width:${s}px;height:${s}px;background:${bg}">${src ? `<img src="${src}" alt="">` : ghostSVG(p, S.theme, true)}</span>`;
}
function pcard(p, size = 'md', th = S.theme, extra = '') {
  const t = tierOf(p.lvl), a = p.attrs || memberAttrs(p), K = KS;
  const lab = `aria-label="Card de ${esc(p.name)}, geral ${p.ovr}, ${TIERN[t]}" role="img"`;
  if (th === 'a') return `<div class="pc pc-a ${size} t-${t} ${extra}" ${lab}><div class="sun"></div><div class="steps"><i style="height:45%"></i><i style="height:75%"></i><i style="height:0"></i><i style="height:65%"></i><i style="height:38%"></i></div>
    <div class="ph">${portrait(p, 'a')}</div><div class="ovr"><b>${p.ovr}</b><span>${p.pos}</span></div><div class="lv">NV ${p.lvl}</div>
    <div class="low"><div class="nm">${esc(p.name)}</div><div class="at">${['RIT', 'CON', 'FOR', 'NUT', 'RES', 'HAB'].map(k => `<span>${k}<b>${a[k]}</b></span>`).join('')}</div></div></div>`;
  if (th === 'b') return `<div class="pc pc-b ${size} t-${t} ${extra}" ${lab}><div class="pin"><div class="top"><div class="dots"></div><div class="ovr"><b>${p.ovr}</b><span>${p.pos}</span><small>nível ${p.lvl}</small></div><div class="ph ${photoOf(p, 'b') ? 'cut' : ''}">${portrait(p, 'b')}</div></div>
    <div class="nm">${esc(p.name)}</div><div class="at">${K.map(k => `<div><b>${a[k]}</b><span>${k}</span></div>`).join('')}</div></div><div class="stamp">${TIERN[t]}</div></div>`;
  return `<div class="pc pc-c ${size} t-${t} ${extra}" ${lab} style="--team:${p.team === 'B' ? '#5B8CFF' : '#F0555A'}"><div class="pin"><div class="rays"></div>
    <div class="ovr"><b>${p.ovr}</b><span>${p.pos}</span><i>${esc(teamShort(p.team || 'A'))}</i></div><div class="ph">${portrait(p, 'c')}</div>
    <div class="nm"><span>${esc(p.name)}</span></div><div class="at">${['RIT', 'CON', 'FOR', 'NUT', 'RES', 'HAB'].map(k => `<span><b>${a[k]}</b> ${k}</span>`).join('')}</div><div class="gl"></div></div></div>`;
}
function board(foot = true) {
  const s = score(), my = myTeam(), th = S.theme, r = rodadaN(), dom = diaIdx(hoje()) === 6;
  const fecha = dom ? 'fecha hoje às 23:59' : 'fecha domingo';
  const ftxt = `Clássico · rodada ${r} · ${fecha} · você fez ${ptsOf('u')} pts`;
  if (th === 'a') return `<button class="board bd-a" data-a="go" data-tab="racha" data-rv="classico" aria-label="Ver o clássico">
    <div class="tm"><span class="crest-tri" style="background:#E8705A"></span>${esc(teamName('A'))}${my === 'A' ? '<span class="chip acc" style="padding:3px 8px">seu time</span>' : ''}</div>
    <div class="sc">${s.A}<i>—</i>${s.B}</div>
    <div class="tm"><span class="crest-cir" style="background:#7DB9E0"></span>${esc(teamName('B'))}${my === 'B' ? '<span class="chip acc" style="padding:3px 8px">seu time</span>' : ''}</div>
    ${foot ? `<div class="ft">${ftxt}</div>` : ''}</button>`;
  if (th === 'b') return `<button class="board bd-b" data-a="go" data-tab="racha" data-rv="classico" aria-label="Ver o clássico">
    <div class="tm">${esc(teamName('A'))}<small>${teamPts('A')} pts${my === 'A' ? ' · seu time' : ''}</small></div><div class="sc">${s.A}×${s.B}</div>
    <div class="tm r">${esc(teamName('B'))}<small>${teamPts('B')} pts${my === 'B' ? ' · seu time' : ''}</small></div>
    ${foot ? `<div class="ft">Rodada ${r}, ${fecha}. ${GOAL() - teamPts(my) % GOAL()} pts para o próximo gol do seu time.</div>` : ''}</button>`;
  return `<button class="board bd-c" data-a="go" data-tab="racha" data-rv="classico" aria-label="Ver o clássico">
    <div class="bar1"><div class="tm l"><b>${esc(teamShort('A'))}</b><small>${esc(teamName('A'))}</small></div><div class="sc">${s.A}–${s.B}</div><div class="tm r"><b>${esc(teamShort('B'))}</b><small>${esc(teamName('B'))}</small></div></div>
    ${foot ? `<div class="ft"><span class="live">Rodada ${r} · ao vivo</span><span>Você: ${ptsOf('u')} pts</span></div>` : ''}</button>`;
}
function macroRows(withKcal = false) {
  const c = consumed(), g = S.goals;
  const M = [['Proteína', 'p', 'var(--p)', 'c-p'], ['Carboidrato', 'c', 'var(--c)', 'c-c'], ['Gordura', 'f', 'var(--f)', 'c-f']];
  if (withKcal) M.unshift(['Calorias', 'kcal', 'var(--kcal)', 'c-k']);
  return `<div class="mac">${M.map(([l, k, col, cls]) => { const r = g[k] - c[k], u = k === 'kcal' ? 'kcal' : 'g';
    const txt = r >= 0 ? `faltam <b>${fmt(r)}</b> ${u}` : `<b class="c-bad">${fmt(-r)} ${u} acima</b>`;
    return `<div class="mac-r"><div class="mac-h"><span class="lb ${cls}">${l}</span><span class="v">${txt} · ${fmt(c[k])}/${fmt(g[k])}</span></div>${bar(c[k], g[k], col)}</div>`; }).join('')}</div>`;
}
function seg(key, opts) { return `<div class="seg" role="tablist">${opts.map(([v, l]) => `<button role="tab" aria-selected="${S[key] === v}" class="${S[key] === v ? 'on' : ''}" data-a="seg" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`; }
const sec = t => `<div class="sec"><h2 class="h2">${t}</h2></div>`;
const mealName = id => id === 'extra' ? 'Fora do plano' : ((S.meals.find(m => m.id === id) || {}).name || 'Refeição');

/* ============ HOJE ============ */
function passos() {
  const P = [
    ['foto', !!S.carica, 'Colocar sua foto no card', 'photo', 'camera'],
    ['plano', !!S.ana, 'Montar seu plano de treino (2 min)', 'ana', 'dumbbell'],
    ['dieta', !!S.goals, 'Enviar sua dieta em PDF', 'dietup', 'bowl'],
    ['push', !!lsGet('pushToken'), 'Ligar as notificações', 'notif', 'bell'],
  ];
  if (!INSTALADO()) P.push(['inst', false, IOS ? 'Instalar na tela de início do iPhone' : 'Instalar o app no celular', 'instalar', 'phone']);
  return P;
}
function scrHoje() {
  const u = me(), hp = habitsPending(), w = S.week[diaIdx(S.day)] || { type: 'rest' }, k = w.key, done = w.type === 'musc' && S.done[k];
  const hd0 = S.hist[S.day] || {}, ran = hd0.runs, nome = esc(u.name.split(' ')[0]);
  let head;
  if (done || ran || hd0.sport) head = `Treino pago. Agora é <span class="mark">fechar o dia.</span>`;
  else if (w.type === 'musc') head = S.theme === 'c' ? `Dia de ${esc((w.title.split(' · ')[1] || 'treino').toLowerCase())}, <span class="mark">${nome}.</span>` : `Bora, ${nome}. Hoje é <span class="mark">${esc((w.title.split(' · ')[1] || 'treino').toLowerCase())}.</span>`;
  else if (w.type === 'run') head = `Hoje tem corrida, <span class="mark">${nome}.</span>`;
  else if (w.type === 'sport') head = `Hoje é dia de <span class="mark">${esc(w.title.toLowerCase())}.</span>`;
  else head = S.ana ? `Dia de descanso. <span class="mark">Recupera, ${nome}.</span>` : `Bem-vindo ao racha, <span class="mark">${nome}.</span>`;
  const ps = passos(), pend = ps.filter(p => !p[1]);
  const r = rem(), bp = temDieta() ? bestPick() : null, prox = S.meals.find(m => !m.done);
  let treinoRow = '';
  if (w.type === 'musc' && W[k]) treinoRow = `<button class="row ${done ? 'done' : ''}" data-a="gotreino" data-v="${k}"><span class="tile">${ic('dumbbell')}</span>
      <span><span class="t">${done ? esc(W[k].name) + ' concluído' : esc(W[k].name + ' · ' + W[k].sub)}</span><span class="s">${done ? '+50 pts pro ' + esc(teamName(myTeam())) : `${W[k].ex.length} exercícios · vale +50 pts pro time`}</span></span><span class="chev">${ic(done ? 'tick' : 'chev', 18)}</span></button>`;
  else if (w.type === 'run') treinoRow = `<button class="row ${ran ? 'done' : ''}" data-a="sheet" data-k="run"><span class="tile">${ic('shoe')}</span><span><span class="t">${ran ? 'Corrida registrada' : esc(w.title)}</span><span class="s">${ran ? '+35 pts pro time' : esc(w.det || '') + ' · vale +35 pts'}</span></span><span class="chev">${ic(ran ? 'tick' : 'chev', 18)}</span></button>`;
  else if (w.type === 'sport') treinoRow = `<button class="row ${hd0.sport ? 'done' : ''}" data-a="sheet" data-k="sport" data-v="${esc(SPORTS.some(x => x.n === w.title) ? w.title : 'Outro')}"><span class="tile">${ic('ball')}</span><span><span class="t">${esc(w.title)}</span><span class="s">${hd0.sport ? 'Registrado' : 'Registre a duração · vale +35 pts'}</span></span><span class="chev">${ic('chev', 18)}</span></button>`;
  else if (!S.ana) treinoRow = `<button class="row" data-a="ana"><span class="tile">${ic('dumbbell')}</span><span><span class="t">Monte seu plano de treino</span><span class="s">6 perguntas e o coach sugere a semana</span></span><span class="chev">${ic('chev', 18)}</span></button>`;
  return `
  <section class="hello"><p class="eb">${capital(fmtData(S.day))} · rodada ${rodadaN()}</p><h1 class="display">${head}</h1></section>
  ${pend.length && !S.steps.fechado ? `<div class="panel soft"><div class="between"><p class="eb">Primeiros passos · ${ps.length - pend.length} de ${ps.length}</p>${pend.length <= 2 ? '<button class="link" data-a="fecharpassos" style="font-size:12px">Ocultar</button>' : ''}</div>
    <div class="stack" style="gap:6px">${ps.map(([id, ok, t, a, i]) => `<button class="row ${ok ? 'done' : ''}" ${ok ? 'disabled' : `data-a="${a === 'photo' || a === 'ana' || a === 'instalar' ? a : 'sheet'}" data-k="${a === 'dietup' ? 'upload' : a}"`}><span class="tile" style="width:36px;height:36px">${ic(ok ? 'tick' : i, 18)}</span><span><span class="t">${t}</span></span><span class="chev">${ok ? '' : ic('chev', 18)}</span></button>`).join('')}</div></div>` : ''}
  <div class="panel me">
    <button class="cardbtn" data-a="sheet" data-k="card" aria-label="Abrir meu card e o cálculo dos atributos">${pcard(u, 'sm')}</button>
    <div class="me-info">
      <p class="eb">Nível ${u.lvl} · ${TIERN[tierOf(u.lvl)]}</p>
      <div class="stack" style="gap:4px">${bar(u.xp, u.xpNext, 'var(--accent)')}<span class="tiny muted num">${u.xp}/${u.xpNext} XP</span></div>
      <div class="me-stats"><span class="c-bad">${ic('flame', 16)}<b>${u.streak}</b>&nbsp;dia${u.streak === 1 ? '' : 's'}</span><span class="c-good">${ic('card', 16)}<b>${u.freezes}</b>&nbsp;${u.freezes === 1 ? 'cartão verde' : 'cartões verdes'}</span></div>
      ${S.carica ? `<button class="link" data-a="sheet" data-k="card">Ver meu card</button>` : `<button class="link" data-a="photo">${ic('camera', 15)} Colocar minha foto no card</button>`}
    </div>
  </div>
  ${board()}
  ${sec('Lances de hoje')}
  <div class="stack">
    ${treinoRow}
    ${temDieta() ? `<button class="row" data-a="go" data-tab="dieta" data-dv="receitas"><span class="tile t-p">${ic('drum')}</span>
      <span><span class="t">${r.p > 0 ? `Faltam ${fmt(r.p)} g de proteína` : 'Proteína do dia fechada'}</span><span class="s">${r.p > 0 ? (bp ? `${esc(bp.r.n)}: ${fmt(bp.f.ideal, bp.f.ideal % 1 ? 1 : 0)} ${plu(bp.r.portion, bp.f.ideal)}` : 'Veja receitas que cabem no seu dia') : 'Agora é segurar as calorias'}</span></span><span class="chev">${ic('chev', 18)}</span></button>` : ''}
    <button class="row ${hp.length ? '' : 'done'}" data-a="go" data-tab="habitos"><span class="tile t-f">${ic('check')}</span>
      <span><span class="t">${hp.length ? `${hp.length} hábito${hp.length > 1 ? 's' : ''} pendente${hp.length > 1 ? 's' : ''}` : 'Dia perfeito nos hábitos'}</span><span class="s">${hp.length ? hp.map(h => esc(h.name.split(' ·')[0])).join(', ') : '+15 pts de bônus garantidos'}</span></span><span class="chev">${ic('chev', 18)}</span></button>
    ${prox ? `<button class="row" data-a="go" data-tab="dieta" data-dv="hoje"><span class="tile">${ic('bowl')}</span>
      <span><span class="t">${esc(prox.name)} · ${prox.time}</span><span class="s">${prox.items.map(i => esc(i.food || i.label)).join(', ')}</span></span><span class="chev">${ic('chev', 18)}</span></button>` : ''}
  </div>
  ${S.goals ? `${sec('Macros de hoje')}<div class="panel">${macroRows(true)}</div>` : ''}`;
}

/* ============ DIETA ============ */
function scrDieta() { return `${seg('dv', [['hoje', 'Hoje'], ['receitas', 'Receitas'], ['plano', 'Plano']])}${S.dv === 'hoje' ? dietaHoje() : S.dv === 'receitas' ? dietaRec() : dietaPlano()}`; }
function semDieta() {
  return `<div class="panel soft"><p class="eb">Plano alimentar</p><p class="h1">Envie a dieta da sua nutricionista em PDF.</p>
    <p class="small muted">A gente lê refeições, horários, quantidades, substituições e metas, calcula os macros e você confere antes de salvar.</p>
    <div class="qa"><button class="btn" data-a="sheet" data-k="upload">${ic('book', 16)} Enviar PDF</button><button class="btn ghost" data-a="sheet" data-k="goals">Montar à mão</button></div></div>`;
}
function itemLinha(i, kcal) { return `<div class="between small"><span>${esc(i.label)}</span><span class="muted num">${kcal ? fmt(i.kcal) + ' kcal' : `${fmt(i.p)}P · ${fmt(i.c)}C · ${fmt(i.f)}G`}</span></div>`; }
function dietaHoje() {
  const r = rem(), extra = S.log.filter(i => i.meal === 'extra' || !S.meals.some(m => m.id === i.meal));
  const pend = S.meals.filter(m => !m.done), ia = S.G && S.G.ia;
  return `
  ${S.goals ? `<div class="panel">
    <div class="between"><div><p class="eb">Faltam hoje</p><div class="big ${r.kcal < 0 ? 'c-bad' : ''}">${fmt(Math.abs(r.kcal))}<span class="small muted" style="font-family:var(--fb);font-style:normal"> kcal${r.kcal < 0 ? ' acima' : ''}</span></div></div>
    <div style="text-align:right" class="small muted num">Meta ${fmt(S.goals.kcal)}<br>Consumido ${fmt(consumed().kcal)}</div></div>
    ${macroRows(false)}
  </div>` : semDieta()}
  <div class="panel soft">
    <p class="eb">O que você comeu?</p>
    <form data-f="log" class="inrow"><input id="logtxt" class="in" placeholder="Ex.: comi 2 ovos e um pão francês" autocomplete="off" aria-label="Descreva o que você comeu"><button class="btn" type="submit" ${S.iaOcupada ? 'disabled' : ''}>${S.iaOcupada ? 'Lendo…' : 'Lançar'}</button></form>
    <div class="chips"><span class="tiny muted" style="align-self:center">Em:</span>${[...pend, { id: 'extra', name: 'Fora do plano' }].map(m => `<button class="chip ${S.logMeal === m.id ? 'on' : ''}" data-a="logmeal" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>
    ${ia ? `<div class="qa"><label class="btn ghost sm" for="platefile">${ic('camera', 16)} Foto do prato</label><input type="file" id="platefile" class="hidefile" accept="image/*" data-file="plate"></div>` : ''}
    <p class="tiny muted">${ia ? 'Texto livre e foto do prato são lidos por IA. ' : ''}Alimentos simples saem da Tabela TACO na hora.</p>
  </div>
  ${S.meals.length ? sec('Refeições') : ''}
  <div class="stack">
  ${S.meals.map(m => { const items = S.log.filter(i => i.meal === m.id); return `<div class="panel">
    <div class="between"><div><p class="eb">${m.time}</p><p class="h3">${esc(m.name)}</p></div>${m.skip ? `<span class="chip">pulada</span>` : m.done ? `<span class="chip good">feito · ${fmt(items.reduce((a, i) => a + i.kcal, 0))} kcal${m.photo ? ' · 📷' : ''}</span>` : `<span class="chip">pendente</span>`}</div>
    ${m.skip ? `<p class="small muted">Você pulou esta refeição hoje.</p><div class="qa"><button class="btn ghost sm" data-a="mealreopen" data-id="${m.id}">Desfazer</button></div>`
      : m.done ? `${items.map(i => itemLinha(i)).join('') || '<p class="small muted">Nenhum alimento lançado.</p>'}
         <div class="qa"><button class="btn ghost sm" data-a="sheet" data-k="mealog" data-id="${m.id}">${ic('edit', 14)} Editar</button></div>`
      : `<p class="small muted">Plano: ${m.items.map(i => esc(i.label)).join(' · ')}</p>
         ${items.map(i => itemLinha(i, true)).join('')}
         <div class="qa"><button class="btn sm" data-a="ateplan" data-id="${m.id}">Comi conforme o plano</button><button class="btn ghost sm" data-a="other" data-id="${m.id}">Comi outra coisa</button>${items.length ? `<button class="btn ghost sm" data-a="mealdone" data-id="${m.id}">Fechar refeição</button>` : `<button class="btn ghost sm" data-a="mealskip" data-id="${m.id}">Pulei</button>`}</div>`}
  </div>`; }).join('')}
  ${extra.length ? `<div class="panel"><div class="between"><p class="h3">Fora do plano</p><span class="chip">${fmt(extra.reduce((a, i) => a + i.kcal, 0))} kcal</span></div>${extra.map(i => itemLinha(i)).join('')}</div>` : ''}
  </div>
  ${S.log.length ? `<button class="btn ghost sm" data-a="undolog" style="align-self:flex-start">Desfazer último lançamento</button>` : ''}
  <p class="tiny muted">Valores aproximados pela Tabela TACO.</p>`;
}
function recipeCard(r) {
  const f = recipeFit(r);
  return `<button class="panel recipe-card" data-a="sheet" data-k="recipe" data-id="${r.id}"><span class="rtile">${ic(r.ic, 30, 1.7)}</span>
    <span style="display:flex;flex-direction:column;gap:6px;min-width:0"><span class="h3">${esc(r.n)}</span>
    <span class="mini-mac num"><span class="c-k">${fmt(r.m.kcal)} kcal</span><span class="c-p">${fmt(r.m.p)} P</span><span class="c-c">${fmt(r.m.c)} C</span><span class="c-f">${fmt(r.m.f)} G</span><span class="muted">/ ${r.portion}</span></span>
    <span class="hrow" style="gap:6px">${S.goals ? `<span class="small ${f.fit > 0 ? 'c-good' : 'c-bad'}" style="font-weight:700">${f.fit > 0 ? `Cabe no seu dia: ${fmt(f.ideal, f.ideal % 1 ? 1 : 0)} ${plu(r.portion, f.ideal)}` : 'Não cabe no que sobrou hoje'}</span>` : ''}${r.x ? '<span class="chip" style="padding:3px 8px">Express</span>' : ''}</span></span></button>`;
}
function recipeFit(r) {
  if (!S.goals) return { fit: 0, ideal: r.yieldN > 1 ? 1 : .5 };
  const x = rem(), half = r.yieldN > 1 ? 1 : 2;
  const fit = Math.max(0, Math.floor(Math.min(x.kcal / r.m.kcal, x.c / Math.max(r.m.c, .1), x.f / Math.max(r.m.f, .1)) * half) / half);
  const byP = Math.round(x.p / r.m.p * half) / half;
  return { fit, ideal: Math.max(1 / half, Math.min(fit, byP || fit)) };
}
function bestPick() { let best = null, bs = -1;
  for (const r of RECIPES) { const f = recipeFit(r); if (f.fit <= 0 || r.m.p < 12) continue; const sc = r.m.p / r.m.kcal; if (sc > bs) { bs = sc; best = { r, f }; } } return best; }
function dietaRec() {
  return `
  <div class="between">${sec('Receitas')}${S.goals ? `<span class="chip">${fmt(Math.max(0, rem().p))} g de proteína livres</span>` : ''}</div>
  ${!S.goals ? `<div class="note"><span>Envie sua dieta para o app mostrar quais receitas cabem no que falta do seu dia.</span></div>` : ''}
  <div class="combo-search">${ic('search', 16)}<input id="recq" class="in" placeholder="Buscar receita ou ingrediente" value="${esc(S.rf.q)}" data-i="recq" autocomplete="off" aria-label="Buscar receita"></div>
  <div class="chips">${[['all', 'Todas'], ['cafe', 'Café'], ['almoco', 'Almoço'], ['lanche', 'Lanche'], ['jantar', 'Jantar']].map(([v, l]) => `<button class="chip ${S.rf.meal === v ? 'on' : ''}" data-a="rf" data-k="meal" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="chips">${S.goals ? `<button class="chip ${S.rf.fit ? 'on' : ''}" data-a="rft" data-k="fit" aria-pressed="${S.rf.fit}">Cabe no meu dia</button>` : ''}<button class="chip ${S.rf.x ? 'on' : ''}" data-a="rft" data-k="x" aria-pressed="${S.rf.x}">Express</button><button class="chip ${S.rf.sort === 'p' ? 'on' : ''}" data-a="rfs" aria-pressed="${S.rf.sort === 'p'}">Mais proteína por caloria</button></div>
  <div class="stack" id="reclist">${recList()}</div>
  <p class="tiny muted">Base de receitas: livro “200 Receitas pra Secar”, da nutricionista Patrícia Stênico. Ingredientes e macros por porção vêm do livro; o modo de preparo foi resumido.</p>`;
}
function recList() {
  const f = S.rf, q = norm(f.q.trim());
  let L = RECIPES.filter(r => (f.meal === 'all' || r.meal === f.meal) && (!f.x || r.x) && (!q || norm(r.n + ' ' + (r.ing || []).flat().join(' ')).includes(q)));
  const fits = new Map(L.map(r => [r.id, recipeFit(r)]));
  if (f.fit && S.goals) L = L.filter(r => fits.get(r.id).fit > 0);
  const dens = r => r.m.p / Math.max(r.m.kcal, 1);
  L.sort(f.sort === 'p' || !S.goals ? (a, b) => dens(b) - dens(a) : (a, b) => ((fits.get(b.id).fit > 0) - (fits.get(a.id).fit > 0)) || dens(b) - dens(a));
  const shown = L.slice(0, S.rlim);
  return `<p class="tiny muted">${L.length} receita${L.length === 1 ? '' : 's'}</p>${shown.map(recipeCard).join('')}
    ${L.length > shown.length ? `<button class="btn ghost block" data-a="recmore">Ver mais ${Math.min(20, L.length - shown.length)}</button>` : ''}
    ${!L.length ? `<div class="note"><span>Nenhuma receita com esses filtros.</span></div>` : ''}`;
}
function dietaPlano() {
  const g = S.goals, dm = S.dietMeta || {};
  if (!g) return semDieta();
  return `
  <div class="panel">
    <div><p class="eb">Plano alimentar ativo</p><p class="h3">${esc(dm.prof || (dm.file ? 'Plano enviado em PDF' : 'Plano montado por você'))}</p><p class="small muted">${dm.file ? `${esc(dm.file)} · ` : ''}${dm.date ? 'atualizado em ' + fmtCurta(dm.date) + ' · ' : ''}${S.meals.length} refeições${dm.fonte === 'calculada' ? ' · metas somadas das refeições' : ''}</p></div>
    <div class="grid2 num"><div class="stat"><span class="eb">Calorias</span><b>${fmt(g.kcal)}</b></div><div class="stat"><span class="eb">Proteína</span><b class="c-p">${fmt(g.p)} g</b></div><div class="stat"><span class="eb">Carboidrato</span><b class="c-c">${fmt(g.c)} g</b></div><div class="stat"><span class="eb">Gordura</span><b class="c-f">${fmt(g.f)} g</b></div></div>
    <div class="qa"><button class="btn ghost sm" data-a="sheet" data-k="upload">Enviar novo PDF</button><button class="btn ghost sm" data-a="sheet" data-k="goals">${ic('edit', 14)} Ajustar metas</button></div>
  </div>
  ${(dm.obs || []).length ? `<div class="note"><span><b>Orientações do plano:</b> ${dm.obs.map(esc).join(' · ')}</span></div>` : ''}
  ${sec('Refeições do plano')}
  <p class="small muted">Toque em Trocar para ver as substituições do seu plano e equivalentes com os mesmos macros.</p>
  <div class="stack">${S.meals.map(m => `<div class="panel"><div class="between"><p class="h3">${esc(m.name)}</p><span class="hrow" style="gap:6px"><span class="eb">${m.time}</span><button class="sq" data-a="sheet" data-k="mealedit" data-id="${m.id}" aria-label="Editar ${esc(m.name)}">${ic('edit', 15)}</button></span></div>
    ${m.items.map((it, i) => `<div class="between small"><span>${esc(it.label)} <span class="muted num">· ${fmt(it.kcal)} kcal</span></span>${swapsFor(it).length && !m.done ? `<button class="chip" data-a="sheet" data-k="swap" data-id="${m.id}" data-i="${i}">Trocar</button>` : ''}</div>`).join('')}
    ${(m.alts || []).map((a, j) => `<details class="small"><summary class="muted">${esc(a.name)} · ${fmt(a.items.reduce((s, x) => s + x.kcal, 0))} kcal</summary>${a.items.map(x => `<div class="between small"><span>${esc(x.label)}</span><span class="muted num">${fmt(x.kcal)} kcal</span></div>`).join('')}<button class="btn ghost sm" data-a="altswap" data-id="${m.id}" data-i="${j}" style="margin-top:6px">Usar esta opção como principal</button></details>`).join('')}
  </div>`).join('')}</div>
  <button class="btn ghost block" data-a="newmeal">${ic('plus', 16)} Nova refeição</button>`;
}
const SWAPG = { prot: ['frango', 'patinho', 'tilápia', 'ovos'], carb: ['arroz', 'batata doce', 'cuscuz', 'tapioca', 'pão francês'], fruit: ['banana', 'maçã'], fat: ['pasta de amendoim', 'azeite'], dairy: ['iogurte', 'queijo minas', 'queijo coalho'] };
const GKEY = { prot: 'p', carb: 'c', fruit: 'c', fat: 'f', dairy: 'p' };
function swapsFor(it) {
  const out = (it.subs || []).map(s => ({ it: s, plano: true }));
  const f = findFood(norm(it.food || it.label).replace(/[^a-z ]/g, ' ')) || findFood(String(it.label).toLowerCase());
  if (f && f.grp) {
    const k = GKEY[f.grp], target = it[k];
    SWAPG[f.grp].map(kw => findFood(kw)).filter(x => x && x.n !== f.n).forEach(x => {
      let nq, n = 1; if (x.u) { n = Math.max(1, Math.round(target / x.u[k])); nq = `${n} ${x.k[0]}`; }
      else { const g = Math.max(10, Math.round(target / (x.h[k] / 100) / 5) * 5); nq = `${g}g ${x.k[0]}`; }
      if (n <= 4 && target > 0) out.push({ it: parse1(nq), plano: false });
    });
  }
  return out.filter(o => o.it);
}

/* ============ TREINO ============ */
function scrTreino() { return `${seg('tv', [['semana', 'Semana'], ['sessao', 'Musculação'], ['corrida', 'Corrida'], ['outros', 'Outros']])}${({ semana: treinoSemana, sessao: treinoSessao, corrida: treinoCorrida, outros: treinoOutros })[S.tv]()}`; }
function ensureSess(k) { if (S.sess[k]) return S.sess[k]; return S.sess[k] = W[k].ex.map(e => ({ n: e.n, m: e.m, prs: 0, sets: Array.from({ length: e.sets }, () => ({ kg: e.kg, reps: e.reps, done: false, pr: false })) })); }
function syncSess(k) { const old = S.sess[k] || [];
  S.sess[k] = W[k].ex.map(e => { const o = old.find(x => x.n === e.n);
    const sets = Array.from({ length: e.sets }, (_, j) => o && o.sets[j] ? o.sets[j] : ({ kg: e.kg, reps: e.reps, done: false, pr: false }));
    return { n: e.n, m: e.m, prs: o ? o.prs : 0, sets }; }); }
const thumb = (e, i) => e.anim ? `<div data-anim="${e.anim}" data-off="${i * .9}"></div>` : `<span class="muted">${ic('dumbbell', 20)}</span>`;
const melhorDe = n => { const l = S.loads[n]; return l && l.length ? Math.max(...l.map(x => x[1])) : 0; };
function treinoSessao() {
  const k = S.active, w = W[k];
  if (!w) { S.active = Object.keys(W)[0]; if (!W[S.active]) { W.A = { name: 'Treino A', sub: 'Novo', min: 45, ex: [] }; S.active = 'A'; } return treinoSessao(); }
  if (S.editWk) return treinoEditor();
  const ss = ensureSess(k), tot = ss.reduce((a, e) => a + e.sets.length, 0), dn = ss.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const hojeK = (S.week[diaIdx(S.day)] || {}).key === k && (S.week[diaIdx(S.day)] || {}).type === 'musc';
  if (S.done[k]) { const d = S.done[k];
    return `<div class="panel center"><p class="eb">${esc(w.name)} · ${esc(w.sub)}</p><p class="display c-good">Treino concluído</p>
      ${d.photo ? `<span class="chip good">${ic('camera', 14)} foto enviada como evidência</span>` : ''}
      <div class="grid3 num" style="width:100%"><div class="stat"><span class="eb">Volume</span><b>${fmt(d.vol)}</b><span class="tiny muted">kg</span></div><div class="stat"><span class="eb">Séries</span><b>${d.sets}</b></div><div class="stat"><span class="eb">PRs</span><b class="c-acc">${d.prs}</b></div></div>
      <div class="qa" style="justify-content:center"><button class="btn ghost" data-a="go" data-tab="racha" data-rv="resenha">Ver na resenha</button><button class="btn ghost" data-a="sheet" data-k="wklist">Outro treino</button></div></div>`; }
  const sug = S.sug[k] || {};
  return `
  <div class="panel">
    <div class="between"><div style="min-width:0"><p class="eb">${esc(w.name)}${hojeK ? ' · hoje' : ''}</p><p class="h1">${esc(w.sub)}</p></div><button class="btn ghost sm" data-a="editwk" data-v="1">${ic('edit', 15)} Editar</button></div>
    ${tot ? bar(dn, tot, 'var(--good)') : ''}
    <p class="small muted">${w.ex.length} exercícios · ${dn}/${tot} séries · descanso ${S.rest} s</p>
    <div class="chips">${Object.keys(W).filter(x => x !== k).map(o => `<button class="chip" data-a="switchwk" data-k="${o}">${esc(W[o].name)} · ${esc(W[o].sub)}</button>`).join('')}<button class="chip" data-a="newwk">${ic('plus', 14)} Novo treino</button></div>
    <div class="chips"><span class="tiny muted" style="align-self:center">Descanso:</span>${[60, 90, 120, 180].map(v => `<button class="chip ${S.rest === v ? 'on' : ''}" data-a="setrest" data-v="${v}">${v} s</button>`).join('')}</div>
  </div>
  ${!w.ex.length ? `<div class="note"><span>Treino vazio. Toque em <b>Editar</b> para adicionar exercícios.</span></div>` : ''}
  ${w.ex.some(e => !e.kg && e.unit !== 's' && !/corporal/i.test(e.m)) ? `<div class="note"><span><b>Primeiro treino?</b> Escreva a carga que você usou em cada série. A partir dela o app acompanha sua evolução e sugere quando subir.</span></div>` : ''}
  ${w.ex.map((e, i) => { const st = ss[i], u = e.unit === 's' ? 'Seg' : 'Reps', best = melhorDe(e.n); return `
  <div class="panel">
    <div class="exh"><button class="exthumb" data-a="sheet" data-k="ex" data-i="${i}" aria-label="Ver execução de ${esc(e.n)}">${thumb(e, i)}</button>
      <div style="min-width:0;display:flex;flex-direction:column;gap:3px"><p class="h3">${i + 1}. ${esc(e.n)}</p><p class="tiny muted">Meta: ${e.sets} × ${e.reps}${e.unit === 's' ? ' s' : ''}${e.kg ? ' · ' + fmt(e.kg, e.kg % 1 ? 1 : 0) + ' kg' : ''} · ${esc(e.mus)}${best ? ` · recorde ${fmt(best, 0)} kg estimados` : ''}</p>
      ${sug[e.n] ? `<span class="chip acc" style="align-self:flex-start;padding:3px 8px">Coach: suba para ${fmt(sug[e.n], sug[e.n] % 1 ? 1 : 0)} kg</span>` : ''}
      <button class="link" data-a="sheet" data-k="ex" data-i="${i}" style="font-size:12px">${e.anim ? 'Ver execução' : 'Ver dicas de execução'}</button></div><span></span></div>
    ${comboHTML(i, st)}
    <div class="setgrid h"><span>Série</span><span>kg</span><span>${u}</span><span></span></div>
    ${st.sets.map((s, j) => `<div class="setgrid ${s.done ? 'done' : ''}"><span class="n">${j + 1}</span>
      <input class="in" id="kg-${i}-${j}" inputmode="decimal" value="${s.kg || ''}" placeholder="0" data-i="kg" data-ex="${i}" data-s="${j}" aria-label="Carga série ${j + 1}">
      <input class="in" id="rp-${i}-${j}" inputmode="numeric" value="${s.reps}" data-i="reps" data-ex="${i}" data-s="${j}" aria-label="${u} série ${j + 1}">
      <button class="ck ${s.done ? 'on' : ''} ${s.pr ? 'pr' : ''}" data-a="set" data-ex="${i}" data-s="${j}" aria-label="Concluir série ${j + 1}">${s.pr ? 'PR' : ic('tick', 18, 2.4)}</button></div>`).join('')}
    ${st.prs ? `<span class="chip acc" style="align-self:flex-start">Recorde pessoal · +FOR</span>` : ''}
  </div>`; }).join('')}
  ${w.ex.length ? `<button class="btn block" data-a="sheet" data-k="finish">Encerrar treino</button>` : ''}`;
}
function treinoEditor() {
  const k = S.active, w = W[k];
  return `<div class="panel">
    <div class="between"><p class="eb">Editando treino</p><button class="btn sm" data-a="editwk" data-v="0">Concluir edição</button></div>
    <div class="grid2"><label class="stack" style="gap:4px"><span class="tiny muted">Nome</span><input id="wkname" class="in" value="${esc(w.name)}" data-i="wkname"></label>
    <label class="stack" style="gap:4px"><span class="tiny muted">Foco</span><input id="wksub" class="in" value="${esc(w.sub)}" data-i="wksub" placeholder="Ex.: Inferiores"></label></div>
    <p class="tiny muted">Tudo aqui é seu: troque, remova, reordene. O coach só sugere.</p>
  </div>
  <div class="stack">${w.ex.map((e, i) => `<div class="panel" style="gap:10px">
    <div class="exh"><span class="exthumb sm">${e.anim ? animSVG(e.anim, S.theme, .55, true) : ic('dumbbell', 20)}</span>
      <div style="min-width:0"><p class="h3">${i + 1}. ${esc(e.n)}</p><p class="tiny muted">${esc(e.m || 'Sem aparelho')}</p></div>
      <div class="qa" style="flex-wrap:nowrap;gap:4px"><button class="sq" data-a="exmove" data-i="${i}" data-v="-1" aria-label="Mover para cima" ${i === 0 ? 'disabled' : ''}>${ic('up', 16)}</button><button class="sq" data-a="exmove" data-i="${i}" data-v="1" aria-label="Mover para baixo" ${i === w.ex.length - 1 ? 'disabled' : ''}>${ic('down', 16)}</button><button class="sq" data-a="exdel" data-i="${i}" aria-label="Remover ${esc(e.n)}">${ic('trash', 16)}</button></div></div>
    <div class="edgrid"><div class="stack" style="gap:4px"><span class="tiny muted">Séries</span><div class="ctr"><button class="sq" data-a="exsets" data-i="${i}" data-v="-1" aria-label="Menos séries">${ic('minus', 14)}</button><b>${e.sets}</b><button class="sq" data-a="exsets" data-i="${i}" data-v="1" aria-label="Mais séries">${ic('plus', 14)}</button></div></div>
      <label class="stack" style="gap:4px"><span class="tiny muted">${e.unit === 's' ? 'Segundos' : 'Repetições'}</span><input class="in" id="exreps-${i}" inputmode="numeric" value="${e.reps}" data-i="exreps" data-ex="${i}"></label>
      <label class="stack" style="gap:4px"><span class="tiny muted">Carga (kg)</span><input class="in" id="exkg-${i}" inputmode="decimal" value="${e.kg || ''}" placeholder="0" data-i="exkg" data-ex="${i}"></label></div>
  </div>`).join('')}</div>
  ${!w.ex.length ? `<div class="note"><span>Nenhum exercício ainda.</span></div>` : ''}
  <button class="btn block" data-a="sheet" data-k="addex">${ic('plus', 16)} Adicionar exercício</button>
  <div class="qa">${Object.keys(W).length > 1 ? `<button class="btn ghost sm" data-a="delwk">${ic('trash', 15)} Excluir este treino</button>` : ''}</div>`;
}
const RUNT = ['Rodagem', 'Intervalado', 'Longão', 'Regenerativo', 'Ritmo de prova', 'Corrida livre'];
function refreshDay(w) {
  if (w.type === 'musc') { const x = W[w.key]; if (x) { w.title = `${x.name} · ${x.sub}`; w.det = `${x.ex.length} exercícios`; } }
  else if (w.type === 'run') { w.title = `${w.rt || 'Corrida'}${w.km ? ' ' + String(w.km).replace('.', ',') + ' km' : ''}`; w.det = w.zone || 'Registre o tempo e a distância'; }
  else if (w.type === 'sport') { w.det = 'Livre · registre duração e intensidade'; }
  else { w.title = 'Descanso'; w.det = 'Recuperação'; }
  S.weekEdited = true;
}
const dataDaSemana = i => somaDias(segunda(S.day), i);
function treinoSemana() {
  const seg0 = segunda(S.day), sugN = Object.values(S.sug).reduce((a, x) => a + Object.keys(x).length, 0);
  const coach = sugN ? `<div class="panel soft">
      <div class="hrow"><span class="tile">${ic('dumbbell')}</span><div style="flex:1;min-width:0"><p class="eb">Coach · progressão de carga</p><p class="h3">Você completou todas as repetições em ${sugN} exercício${sugN > 1 ? 's' : ''}.</p></div></div>
      <p class="small">${Object.entries(S.sug).flatMap(([k, x]) => Object.entries(x).map(([n, kg]) => `${esc(n)}: ${fmt(kg, kg % 1 ? 1 : 0)} kg`)).slice(0, 6).join(' · ')}. Sugiro subir a meta no próximo treino. Você decide.</p>
      <div class="qa"><button class="btn sm" data-a="coach" data-v="ok">Subir as cargas</button><button class="btn ghost sm" data-a="coach" data-v="keep">Manter como está</button></div></div>` : '';
  const plano = S.week.some(w => w.type !== 'rest');
  return `
  <div class="between"><div><p class="eb">Semana de ${fmtCurta(seg0)} a ${fmtCurta(somaDias(seg0, 6))}</p><p class="h1">Plano da semana</p></div>${S.weekEdited ? '<span class="chip acc">Editado por você</span>' : plano ? '<span class="chip good">Sugerido pelo coach</span>' : ''}</div>
  ${!plano ? `<div class="panel soft"><p class="h3">Ainda sem plano.</p><p class="small muted">Responda 6 perguntas e o coach sugere a semana. Depois você muda o que quiser, dia a dia.</p><button class="btn" data-a="ana">Montar meu plano</button></div>` : ''}
  ${coach}
  <p class="small muted">Toque em um dia para mudar o treino, trocar de dia ou deixar livre.</p>
  <div class="stack">${S.week.map((w, i) => { const icn = { musc: 'dumbbell', run: 'shoe', sport: 'ball', rest: 'moon' }[w.type], dia = dataDaSemana(i), h = S.hist[dia] || {}, done = h.trained || (dia === S.day && w.type === 'musc' && S.done[w.key]);
    return `<button class="row ${dia === S.day ? 'today' : ''} ${done ? 'done' : ''}" data-a="openday" data-i="${i}"><span class="day"><small>${w.d}</small><b>${N_dataObj(dia).getDate()}</b></span>
      <span style="min-width:0"><span class="t">${esc(w.title)}</span><span class="s">${done ? 'Feito' : esc(w.det || '')}${w.note ? ' · ' + esc(w.note) : ''}</span></span><span class="tile" style="width:36px;height:36px">${ic(done ? 'tick' : icn, 18)}</span></button>`; }).join('')}</div>
  <div class="hrow"><button class="btn ghost sm" data-a="sheet" data-k="wklist">${ic('dumbbell', 15)} Meus treinos</button><button class="btn ghost sm" data-a="ana">${S.ana ? 'Refazer anamnese' : 'Anamnese'}</button>${S.weekEdited && S.weekOrig ? `<button class="btn ghost sm" data-a="weekreset">Restaurar sugestão</button>` : ''}</div>`;
}
function fcMax() { const a = S.ana || {}; return Number(a.fcmax) || (a.age ? Math.round(208 - .7 * a.age) : 0); }
function treinoCorrida() {
  const runs = [...S.runs].sort((a, b) => b.day.localeCompare(a.day) || b.ts - a.ts), last = runs[0], ult = runs.slice(0, 12).reverse();
  const H = 120, bw = 20, gap = 6.4;
  let chart = '';
  if (ult.length >= 2) {
    const ps = ult.map(r => r.sec / r.km), mx = Math.max(...ps), mn = Math.min(...ps), rng = Math.max(mx - mn, 10);
    chart = `<p class="eb">Pace das últimas corridas (mais alto = mais rápido)</p><svg viewBox="0 0 330 ${H}" width="100%" style="max-width:100%;display:block" role="img" aria-label="Pace das últimas corridas">${ps.map((p, i) => { const h = 30 + (mx - p) / rng * 60, x = 8 + i * (bw + gap), best = p === mn;
      return `<rect x="${x}" y="${H - 18 - h}" width="${bw}" height="${h}" rx="3" style="fill:${best ? 'var(--accent)' : 'var(--s3)'}"/><text x="${x + bw / 2}" y="${H - 5}" text-anchor="middle" style="fill:var(--mut);font:600 8px var(--fb)">${fmtCurta(ult[i].day)}</text>${i === ps.length - 1 || best ? `<text x="${x + bw / 2}" y="${H - 23 - h}" text-anchor="middle" style="fill:var(--fg);font:700 9px var(--fb)">${pace(p)}</text>` : ''}`; }).join('')}</svg>`;
  }
  const fm = fcMax(), Z = [[1, 'Regenerativo', .5, .6], [2, 'Base aeróbica', .6, .7], [3, 'Moderado', .7, .8], [4, 'Limiar', .8, .9], [5, 'Máximo', .9, 1]];
  const km30 = S.runs.filter(r => r.day > somaDias(S.day, -30)).reduce((a, r) => a + r.km, 0);
  return `
  <div class="panel soft"><p class="eb">Objetivo de corrida</p>
    <input class="in" id="rungoal" data-i="rungoal" value="${esc(S.runGoal || '')}" placeholder="Ex.: meia maratona abaixo de 1h55">
    <div class="grid3 num"><div class="stat"><span class="eb">30 dias</span><b>${fmt(km30, 1)}</b><span class="tiny muted">km</span></div><div class="stat"><span class="eb">Corridas</span><b>${S.runs.filter(r => r.day > somaDias(S.day, -30)).length}</b><span class="tiny muted">em 30 dias</span></div><div class="stat"><span class="eb">RIT</span><b class="c-acc">${me().attrs.RIT}</b><span class="tiny muted">no card</span></div></div></div>
  <button class="btn block" data-a="sheet" data-k="run">${ic('shoe', 16)} Registrar corrida</button>
  ${last ? `<div class="panel">
    <div class="between"><div><p class="eb">Última corrida · ${rotuloDia(last.day)}</p><p class="h3">${esc(last.rt || 'Corrida')} de ${fmt(last.km, 1)} km</p></div>${last.photo || last.ev ? '<span class="chip good">com evidência</span>' : ''}</div>
    <div class="grid3 num"><div class="stat"><span class="eb">Ritmo</span><b>${pace(last.sec / last.km)}</b></div><div class="stat"><span class="eb">Tempo</span><b>${tempoFmt(last.sec)}</b></div><div class="stat"><span class="eb">FC média</span><b>${last.fc || '—'}</b></div></div>
    ${chart}
  </div>` : '<div class="note"><span>Nenhuma corrida registrada ainda. Registre distância e tempo (o print do relógio vale como evidência).</span></div>'}
  ${sec('Corridas da semana no plano')}
  <div class="stack">${S.week.map((w, i) => ({ w, i })).filter(x => x.w.type === 'run').map(({ w, i }) => `<button class="row" data-a="openday" data-i="${i}"><span class="day"><small>${w.d}</small><b>${N_dataObj(dataDaSemana(i)).getDate()}</b></span><span><span class="t">${esc(w.title)}</span><span class="s">${esc(w.det || '')}</span></span><span class="chev">${ic('chev', 18)}</span></button>`).join('') || '<p class="small muted">Nenhuma corrida no plano desta semana.</p>'}</div>
  ${sec('Suas zonas de frequência cardíaca')}
  ${fm ? `<div class="panel tbwrap"><table class="tb"><thead><tr><th></th><th>Zona</th><th>FC (bpm)</th></tr></thead><tbody>
    ${Z.map(([n, l, a, b]) => `<tr><td>${n}</td><td>${l}</td><td>${Math.round(fm * a)}–${Math.round(fm * b)}</td></tr>`).join('')}</tbody></table>
    <p class="tiny muted">FC máxima de ${fm} bpm ${S.ana && S.ana.fcmax ? 'informada por você' : 'estimada pela idade (208 − 0,7 × idade)'}. Se você tem um teste, informe na anamnese.</p></div>`
    : `<div class="note"><span>Informe sua idade na anamnese para calcular as zonas.</span></div>`}`;
}
const tempoFmt = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
function treinoOutros() {
  return `<div><p class="eb">Outros esportes</p><p class="h1">Jogou, registrou, pontuou.</p></div>
  <div class="grid3">${SPORTS.map(s => `<button class="panel center" data-a="sheet" data-k="sport" data-v="${s.n}" style="padding:16px 8px"><span class="tile">${ic(s.ic, 22)}</span><span class="small" style="font-weight:700">${s.n}</span></button>`).join('')}</div>
  <p class="small muted">Registre duração e intensidade. No modo competitivo, a foto na quadra ou o print do relógio é a evidência.</p>
  ${S.sportsLog.length ? sec('Recentes') : ''}
  <div class="stack">${S.sportsLog.slice(0, 15).map(l => `<div class="row" style="cursor:default"><span class="tile">${ic((SPORTS.find(s => s.n === l.sport) || SPORTS[5]).ic)}</span><span><span class="t">${esc(l.sport)}</span><span class="s">${l.dur} min · intensidade ${l.pse}/10</span></span><span class="tiny muted">${l.day ? rotuloDia(l.day) : ''}</span></div>`).join('')}</div>`;
}

/* ============ HÁBITOS ============ */
function scrHabitos() {
  const act = S.habits, dn = act.filter(habDone).length, comp = regras().photo;
  return `
  <div class="panel">
    <div class="between"><div><p class="eb">Hoje</p><div class="big">${dn}<span class="muted" style="font-size:24px">/${act.length}</span></div></div>
    <div class="stack" style="align-items:flex-end"><span class="chip">${ic('flame', 14)} ${S.user.streak} dia${S.user.streak === 1 ? '' : 's'} seguidos</span><button class="chip" data-a="greencard">${ic('card', 14)} ${S.user.freezes} ${S.user.freezes === 1 ? 'cartão verde' : 'cartões verdes'}</button></div></div>
    ${bar(dn, act.length || 1, 'var(--good)')}
    <p class="small muted">${act.length && dn === act.length ? 'Dia perfeito. +15 pts pro time.' : 'Dia perfeito vale +15 pts pro time e sobe o HAB do seu card.'}</p>
  </div>
  <div class="stack">${S.habits.map((h, i) => { const done = habDone(h);
    const wk = [...(h.wk || []), done ? 1 : 0].slice(-7).map((v, j, a) => `<i class="${v ? 'on' : ''} ${j === a.length - 1 ? 'td' : ''}"></i>`).join('');
    const ctl = S.editHab ? `<button class="sq" data-a="delhabit" data-i="${i}" aria-label="Remover ${esc(h.name)}">${ic('trash', 16)}</button>`
      : h.type === 'count' ? `<div class="ctr"><button class="sq" data-a="hcount" data-i="${i}" data-v="-1" aria-label="Menos">${ic('minus', 16)}</button><b>${h.val}/${h.target}</b><button class="sq" data-a="hcount" data-i="${i}" data-v="1" aria-label="Mais">${ic('plus', 16)}</button></div>`
      : `<button class="ck ${done ? 'on' : ''}" data-a="hcheck" data-i="${i}" aria-label="Marcar ${esc(h.name)}">${ic('tick', 18, 2.4)}</button>`;
    const conta = comp ? (N_habConta(regras(), h.id) ? ` · conta no placar com foto${h.photo ? ' ✓' : ''}` : ' · só para sua sequência') : '';
    return `<div class="row" style="cursor:default"><span class="tile">${ic(h.ic)}</span><span style="min-width:0"><span class="t">${esc(h.name)}</span><span class="s">${h.streak ? `Sequência de ${h.streak + (done ? 1 : 0)} dias` : done ? 'Sequência de 1 dia' : 'Sequência zerada · recomeça hoje'}${conta}</span><span class="wk" aria-label="Últimos 7 dias">${wk}</span></span>${ctl}</div>`; }).join('')}</div>
  ${!S.habits.length ? '<div class="note"><span>Nenhum hábito. Comece com um pequeno.</span></div>' : ''}
  <div class="qa"><button class="btn ghost" style="flex:1" data-a="sheet" data-k="newhabit">${ic('plus', 16)} Novo hábito</button><button class="btn ghost" data-a="edithab">${S.editHab ? 'Pronto' : ic('edit', 16) + ' Editar'}</button></div>`;
}

/* ============ RACHA ============ */
function scrRacha() {
  const g = S.G || { nome: 'Racha' };
  return `<div class="between"><div><p class="eb">Grupo · ${S.members.length} jogador${S.members.length === 1 ? '' : 'es'}</p><p class="h1">${esc(g.nome)}</p></div><button class="ib" data-a="sheet" data-k="group" aria-label="Regras do grupo">${ic('gear')}</button></div>
  ${seg('rv', [['classico', 'Clássico'], ['liga', 'Liga'], ['mano', 'Mano a mano'], ['resenha', 'Resenha']])}
  ${({ classico: rachaClassico, liga: rachaTemporada, mano: rachaMano, resenha: rachaResenha })[S.rv]()}`;
}
function timeline() {
  let tA = 0, tB = 0; const G = GOAL();
  return evRodada().map(e => { const t = e.team, bA = Math.floor(tA / G), bB = Math.floor(tB / G), ep = effPts(e);
    if (t === 'A') tA += ep; else if (t === 'B') tB += ep;
    return { e, ep, goal: Math.floor(tA / G) > bA || Math.floor(tB / G) > bB, sc: `${Math.floor(tA / G)} × ${Math.floor(tB / G)}` }; });
}
function evChip(e) {
  if (e.kind === 'habitos') { if (!regras().photo) return ''; const n = (e.hp || []).length; return n ? `<span class="evc">${ic('camera', 12)} ${n} foto${n > 1 ? 's' : ''}</span>` : ''; }
  if (e.ev === 'foto') return e.foto || e.photo ? `<button class="evc" data-a="viewev" data-id="${esc(e.id)}">${ic('camera', 12)} Ver foto</button>` : `<span class="evc">${ic('camera', 12)} Foto</span>`;
  return regras().photo ? `<span class="evc bad">Sem evidência</span>` : '';
}
function rachaClassico() {
  if (S.members.length < 2) return `${board(false)}<div class="panel soft"><p class="h3">Chame a galera.</p><p class="small muted">O clássico começa quando tiver gente nos dois times. Mande o convite pelo WhatsApp.</p><button class="btn" data-a="convidar">Convidar amigos</button></div>`;
  const tl = timeline().reverse();
  const col = t => S.members.filter(m => m.team === t).sort((a, b) => ptsOf(b.id) - ptsOf(a.id)).map(m => `<div class="mem ${m.id === 'u' ? 'you' : ''}"><button class="mem-main" data-a="sheet" data-k="member" data-id="${m.id}" aria-label="Ver card de ${nomeDe(m.id)}">${av(person(m.id), 30)}<span class="nm">${nomeDe(m.id)}</span></button><span class="pt">${ptsOf(m.id)}</span><button class="info" data-a="sheet" data-k="pts" data-id="${m.id}" aria-label="Como ${m.id === 'u' ? 'você fez' : esc(m.name) + ' fez'} ${ptsOf(m.id)} pontos">i</button></div>`).join('') || '<p class="tiny muted">Ninguém ainda.</p>';
  const G = GOAL(), nA = G - teamPts('A') % G, nB = G - teamPts('B') % G;
  let dia = '';
  return `${board(false)}
  <div class="grid2"><div class="stack" style="gap:5px">${bar(G - nA, G, 'var(--tA)')}<span class="tiny muted"><b class="num" style="color:var(--fg)">${teamPts('A')}</b> pts · faltam ${nA} pro gol</span></div>
  <div class="stack" style="gap:5px">${bar(G - nB, G, 'var(--tB)')}<span class="tiny muted"><b class="num" style="color:var(--fg)">${teamPts('B')}</b> pts · faltam ${nB} pro gol</span></div></div>
  <div class="teams"><div class="col">${col('A')}</div><div class="col">${col('B')}</div></div>
  <div class="between">${sec('Lance a lance')}${tl.length ? `<button class="btn ghost sm" data-a="narrate">${ic('play', 14)} Narrar</button>` : ''}</div>
  <div class="tl" id="tl">${tl.map(({ e, ep, goal, sc }, i) => { const cab = e.day !== dia ? `<p class="eb" style="margin:6px 0 0">${rotuloDia(e.day)}</p>` : ''; dia = e.day;
    return `${cab}<div class="ev ${goal ? 'goal' : ''} ${e.pending ? 'pend' : ''}" style="--i:${tl.length - 1 - i}"><span class="tm">${e.t}</span>${av(person(e.who), 28)}<span>${goal ? `<span class="goaltag">GOL ${sc}</span>` : ''}<b>${nomeDe(e.who)}</b> ${esc(e.txt)} ${evChip(e)}${e.var === 'aberto' ? ' <span class="evc var">VAR</span>' : e.var === 'anulado' ? ' <span class="evc bad">anulado</span>' : ''}</span><span class="pp ${ep ? '' : 'zero'}">+${ep}</span></div>`; }).join('') || '<div class="note"><span>Nenhum lance nesta rodada ainda. O primeiro treino abre o placar.</span></div>'}</div>
  <button class="btn ghost block" data-a="sheet" data-k="rules">Como os pontos viram gols</button>`;
}
function rachaTemporada() {
  const atual = semanaAtual(), ini = segunda(S.G ? S.G.inicio : atual), rods = [];
  for (let s = atual, n = 0; s >= ini && n < 10; s = somaDias(s, -7), n++) rods.push(s);
  const res = rods.map(s => ({ s, p: placarAtual(s), r: rodadaN(s) }));
  const fechadas = res.filter(x => x.s < atual), vit = { A: 0, B: 0, E: 0 };
  fechadas.forEach(x => { if (x.p.A > x.p.B) vit.A++; else if (x.p.B > x.p.A) vit.B++; else vit.E++; });
  const art = S.members.map(m => ({ m, pts: rods.reduce((a, s) => a + ptsOf(m.id, s), 0), gols: 0 })).sort((a, b) => b.pts - a.pts);
  const ult = fechadas[0], mvp = ult ? S.members.map(m => ({ m, p: ptsOf(m.id, ult.s) })).sort((a, b) => b.p - a.p)[0] : null;
  return `<p class="small muted">Cada rodada vai de segunda a domingo. Os times podem ser sorteados de novo a qualquer momento; cada lance conta para o time em que a pessoa estava quando fez.</p>
  <div class="panel hero"><p class="eb" style="color:var(--hero-mut)">Temporada · ${fechadas.length} rodada${fechadas.length === 1 ? '' : 's'} fechada${fechadas.length === 1 ? '' : 's'}</p>
    <div class="between"><div><p class="h3">${esc(teamName('A'))}</p><p class="big" style="font-size:36px">${vit.A}</p></div><span class="tiny" style="color:var(--hero-mut)">vitórias · ${vit.E} empate${vit.E === 1 ? '' : 's'}</span><div style="text-align:right"><p class="h3">${esc(teamName('B'))}</p><p class="big" style="font-size:36px">${vit.B}</p></div></div></div>
  ${mvp && mvp.p ? `<div class="row" style="cursor:default">${av(person(mvp.m.id), 44)}<span><span class="t">Craque da rodada ${ult.r}: ${nomeDe(mvp.m.id)}</span><span class="s">${mvp.p} pts na rodada passada</span></span><span class="tile">${ic('trophy', 18)}</span></div>` : ''}
  ${sec('Rodadas')}
  <div class="panel tbwrap"><table class="tb"><thead><tr><th>#</th><th>Semana</th><th>${esc(teamShort('A'))}</th><th>${esc(teamShort('B'))}</th><th></th></tr></thead><tbody>
  ${res.map(x => `<tr class="${x.s === atual ? 'us' : ''}"><td>${x.r}</td><td>${fmtCurta(x.s)}–${fmtCurta(somaDias(x.s, 6))}</td><td><b>${x.p.A}</b></td><td><b>${x.p.B}</b></td><td class="tiny">${x.s === atual ? 'ao vivo' : x.p.A > x.p.B ? esc(teamShort('A')) : x.p.B > x.p.A ? esc(teamShort('B')) : 'empate'}</td></tr>`).join('')}</tbody></table></div>
  ${sec('Artilharia da temporada')}
  <div class="panel tbwrap"><table class="tb"><thead><tr><th>#</th><th>Jogador</th><th>Time</th><th>Pts</th></tr></thead><tbody>
  ${art.map((x, i) => `<tr class="${x.m.id === 'u' ? 'us' : ''}"><td>${i + 1}</td><td>${nomeDe(x.m.id)}</td><td>${esc(teamShort(x.m.team))}</td><td><b>${x.pts}</b></td></tr>`).join('')}</tbody></table>
  <p class="tiny muted">Soma das últimas ${rods.length} rodadas.</p></div>`;
}
function metricaDe(c, who) {
  const evs = S.events.filter(e => e.who === who && e.day >= c.inicio && e.day <= c.fim);
  switch (c.metric) {
    case 'Dias de treino': return new Set(evs.filter(e => ['treino', 'esporte', 'corrida'].includes(e.kind) && effPts(e) > 0).map(e => e.day)).size;
    case 'Km corridos': return evs.filter(e => e.kind === 'corrida' && effPts(e) > 0).reduce((a, e) => a + (Number(e.km) || 0), 0);
    case 'Pontos no racha': return evs.reduce((a, e) => a + effPts(e), 0);
    case 'Dias nos macros': return evs.filter(e => e.kind === 'macros' && effPts(e) > 0).length;
    case 'Dias perfeitos de hábitos': return evs.filter(e => e.kind === 'habitos' && e.perfect && effPts(e) > 0).length;
    case 'Volume levantado': return evs.filter(e => e.kind === 'treino' && effPts(e) > 0).reduce((a, e) => a + (Number(e.vol) || 0), 0) / 1000;
  }
  return 0;
}
const unidadeDe = m => ({ 'Km corridos': 'km', 'Volume levantado': 't', 'Pontos no racha': 'pts' }[m] || 'dias');
function rachaMano() {
  const meus = S.challenges.filter(c => c.de === S.eu || c.para === S.eu), outros = S.challenges.filter(c => c.status === 'ativo' && c.de !== S.eu && c.para !== S.eu);
  const h = hoje();
  const card = c => { const euDe = c.de === S.eu, outroId = uid(euDe ? c.para : c.de), o = person(outroId), u = me();
    if (c.status === 'pendente') return `<div class="panel"><div class="between"><span class="eb">${esc(c.metric)} · ${c.dias} dias</span><span class="chip">${euDe ? 'aguardando' : 'novo desafio'}</span></div>
      <div class="hrow">${av(o, 40)}<p class="small" style="flex:1">${euDe ? `Você desafiou <b>${esc(o.name)}</b>.` : `<b>${esc(o.name)}</b> te desafiou.`} Aposta: ${esc(c.bet)}</p></div>
      <div class="qa">${euDe ? `<button class="btn ghost sm" data-a="chcancel" data-id="${c.id}">Cancelar</button>` : `<button class="btn sm" data-a="chresp" data-id="${c.id}" data-v="1">Topo</button><button class="btn ghost sm" data-a="chresp" data-id="${c.id}" data-v="0">Agora não</button>`}</div></div>`;
    if (c.status === 'recusado') return `<div class="panel"><p class="small muted">${euDe ? `${esc(o.name)} recusou seu desafio de ${esc(c.metric.toLowerCase())}.` : `Você recusou o desafio de ${esc(o.name)}.`}</p></div>`;
    const a = metricaDe(c, 'u'), b = metricaDe(c, outroId), fim = h > c.fim, dec = c.metric === 'Km corridos' || c.metric === 'Volume levantado' ? 1 : 0, faltam = N_diasEntre(h, c.fim) + 1;
    const lead = a > b ? (fim ? 'Você venceu' : 'Você na frente') : a < b ? (fim ? `${esc(o.name)} venceu` : `${esc(o.name)} na frente`) : fim ? 'Empate' : 'Empatado';
    return `<div class="panel"><div class="between"><span class="eb">${esc(c.metric)} (${unidadeDe(c.metric)}) · ${fim ? 'encerrado em ' + fmtCurta(c.fim) : faltam === 1 ? 'último dia' : faltam + ' dias'}</span><span class="chip ${a >= b ? 'good' : ''}">${lead}</span></div>
    <div class="between"><div class="hrow">${av(u, 44)}<div><p class="h3">Você</p><p class="big" style="font-size:30px">${fmt(a, dec)}</p></div></div><span class="eb">vs</span>
    <div class="hrow" style="flex-direction:row-reverse;text-align:right">${av(o, 44)}<div><p class="h3">${esc(o.name)}</p><p class="big" style="font-size:30px">${fmt(b, dec)}</p></div></div></div>
    ${bar(a, (a + b) || 1, 'var(--accent)')}<p class="small muted">Aposta: ${esc(c.bet)}</p></div>`; };
  const ord = { pendente: 0, ativo: 1, recusado: 3 }, L = meus.sort((x, y) => (ord[x.status] - ord[y.status]) || ((y.fim < h) - (x.fim < h)) * -1);
  return `<p class="small muted">Desafio direto entre dois jogadores, com uma métrica só. Os números saem dos lances de cada um.</p>
  <div class="stack">${L.map(card).join('') || '<div class="note"><span>Nenhum desafio ainda.</span></div>'}</div>
  <button class="btn block" data-a="sheet" data-k="newch" ${S.members.length < 2 ? 'disabled' : ''}>Novo desafio</button>
  ${outros.length ? `${sec('Rolando no grupo')}<div class="stack">${outros.map(c => { const a = uid(c.de), b = uid(c.para), va = metricaDe(c, a), vb = metricaDe(c, b);
    return `<div class="row" style="cursor:default">${av(person(a), 32)}<span><span class="t">${nomeDe(a)} ${fmt(va, 0)} × ${fmt(vb, 0)} ${nomeDe(b)}</span><span class="s">${esc(c.metric)} · até ${fmtCurta(c.fim)}</span></span>${av(person(b), 32)}</div>`; }).join('')}</div>` : ''}`;
}
function quando(ts) { const d = new Date(ts), dia = N_iso(d); return `${rotuloDia(dia)} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function rachaResenha() {
  return `<form class="panel soft" data-f="post"><label class="eb" for="posttxt">Resenha do grupo</label><div class="inrow"><input id="posttxt" class="in" placeholder="Solte a resenha…" autocomplete="off" maxlength="500"><button class="btn" type="submit">Postar</button></div>
    <div class="qa"><label class="btn ghost sm" for="postfile">${ic('camera', 15)} ${S.postFoto ? 'Foto pronta ✓' : 'Foto'}</label><input type="file" id="postfile" class="hidefile" accept="image/*" data-file="post">${S.postFoto ? '<button class="btn ghost sm" type="button" data-a="postfotox">Tirar foto</button>' : ''}</div></form>
  <div class="stack">${S.feed.map(p => { const m = person(p.who), re = p.reacoes || { like: [], fire: [] }, src = p.photo || (p.foto ? S.fotos[p.foto] : null);
    if (p.foto && !src) fotoDrive(p.foto).then(d => d && S.tab === 'racha' && S.rv === 'resenha' && render());
    return `<div class="panel post"><div class="who">${av(m, 40)}<div style="flex:1;min-width:0"><p class="h3">${nomeDe(p.who)}</p><p class="tiny muted">${quando(p.ts)} · ${esc(teamName(m.team))}</p></div><span class="chip">${m.ovr}</span>${p.who === 'u' && !p.pending ? `<button class="sq" data-a="delpost" data-id="${esc(p.id)}" aria-label="Apagar post">${ic('trash', 14)}</button>` : ''}</div>
    ${p.text ? `<p>${esc(p.text)}</p>` : ''}${src ? `<div class="ph-box"><img src="${src}" alt="Foto do post"></div>` : p.foto ? `<div class="ph-box"><span class="tiny muted">Carregando foto…</span></div>` : p.scene ? `<div class="ph-box">${ic(p.scene, 56, 1.4)}</div>` : ''}
    <div class="react"><button class="${re.like.includes(S.eu) ? 'on' : ''}" data-a="like" data-id="${esc(p.id)}">💪 ${re.like.length}</button><button class="${(re.fire || []).includes(S.eu) ? 'on' : ''}" data-a="fire" data-id="${esc(p.id)}">🔥 ${(re.fire || []).length}</button></div>
    ${(p.coments || []).map(c => `<p class="small"><b>${nomeDe(uid(c.who))}:</b> ${esc(c.txt)}</p>`).join('')}
    ${p.pending ? '<p class="tiny muted">Enviando…</p>' : `<form class="inrow" data-f="coment" data-id="${esc(p.id)}"><input class="in" name="c" id="c-${esc(p.id)}" placeholder="Comentar" autocomplete="off" maxlength="300" style="height:38px"><button class="btn ghost sm" type="submit">Enviar</button></form>`}</div>`; }).join('') || '<div class="note"><span>A resenha está vazia. Treinos concluídos aparecem aqui automaticamente (dá para desligar ao encerrar o treino).</span></div>'}</div>`;
}
