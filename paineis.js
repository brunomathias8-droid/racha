/* paineis.js — painéis que sobem de baixo (sheets) e os avisos de tela cheia. */
'use strict';

const SH = {};
const head = (eb, title, extra = '') => `<div class="sh-h"><div style="min-width:0">${eb ? `<p class="eb">${eb}</p>` : ''}<p class="h1">${title}</p>${extra}</div><button class="x" data-a="close" aria-label="Fechar">${ic('x', 18)}</button></div>`;
const inp = (id, lab, val, extra = '') => `<label class="stack" style="gap:4px"><span class="tiny muted">${lab}</span><input class="in" id="${id}" data-i="${id}" value="${esc(val == null ? '' : val)}" ${extra}></label>`;

/* ---------- card e atributos ---------- */
SH.card = () => {
  const u = me(), t = tierOf(u.lvl);
  return `${head('Seu card', `${TIERN[t]} · nível ${u.lvl}`)}
  <div class="center" style="padding:6px 0 10px">${pcard(u, 'lg', S.theme, 'spin')}</div>
  <div class="qa" style="justify-content:center"><button class="btn sm" data-a="photo">${ic('camera', 16)} ${S.carica ? 'Trocar foto' : 'Colocar minha foto'}</button><button class="btn ghost sm" data-a="sheet" data-k="look">${ic('palette', 16)} Estilo</button></div>
  <div class="stack" style="gap:4px">${bar(u.xp, u.xpNext, 'var(--accent)')}<span class="tiny muted num">${u.xp}/${u.xpNext} XP para o nível ${u.lvl + 1}</span></div>
  <p class="eb">Toque num atributo para ver o cálculo</p>
  <div class="stack">${KS.map(k => `<button class="row" data-a="sheet" data-k="attr" data-v="${k}"><span class="big" style="font-size:26px;min-width:1.6em">${u.attrs[k]}</span><span><span class="t">${k} · ${ATTR[k].n}</span><span class="s">${ATTR[k].what}</span></span><span class="chev">${ic('chev', 18)}</span></button>`).join('')}
  <button class="row" data-a="sheet" data-k="ovr"><span class="big" style="font-size:26px;min-width:1.6em">${u.ovr}</span><span><span class="t">OVR · Nota geral</span><span class="s">Média dos 6 atributos, posição e cor do card</span></span><span class="chev">${ic('chev', 18)}</span></button></div>
  <div class="note"><span><b>Atributos medem evolução, não nível absoluto.</b> Quem começou agora e treina toda semana sobe tão rápido quanto quem já é forte.</span></div>
  <p class="eb">Escada de cards</p>
  <div class="between" style="align-items:flex-end">${[['bronze', 1], ['prata', 10], ['ouro', 20], ['especial', 35]].map(([tt, l]) => `<div class="center" style="gap:8px">${pcard({ ...u, lvl: l }, 'xs')}<span class="tiny muted">${TIERN[tt]} · ${l}+</span></div>`).join('')}</div>`;
};
SH.attr = s => {
  const k = s.v, A = ATTR[k], X = attrsAgora()[k], idx = X.idx;
  const mist = X.peso < 1;
  return `${head(`${k} · ${A.n}`, `Sua nota: ${X.nota}`)}
  <p class="small muted">${A.what}</p>
  <div class="panel soft">
    <p class="eb">Como o número é calculado</p>
    <p class="small"><b>Nota = 40 + 59 × índice</b>. A escala vai de 40 a 99, como nos cards de jogador. O índice é a média ponderada dos itens abaixo, medidos nas últimas 4 semanas${mist ? ' (ou desde que você entrou)' : ''}.</p>
  </div>
  <div class="stack" style="gap:14px">${X.parts.map(([lab, det, sc, w]) => `<div class="stack" style="gap:5px">
    <div class="between small"><b>${lab}</b><span class="muted num">peso ${Math.round(w * 100)}%</span></div>
    ${bar(sc, 1, 'var(--accent)')}
    <div class="between tiny"><span class="muted">${esc(det)}</span><span class="num" style="white-space:nowrap"><b>${Math.round(sc * 100)}%</b> · +${fmt(59 * w * sc, 1)} pts</span></div></div>`).join('')}</div>
  <div class="panel tbwrap"><table class="tb"><tbody>
    <tr><td></td><td>Piso da escala</td><td>40</td></tr>
    <tr><td></td><td>Índice ${fmt(idx * 100, 1)}% × 59</td><td>+${fmt(59 * idx, 1)}</td></tr>
    <tr><td></td><td>Nota calculada</td><td>${X.calc}</td></tr>
    ${mist ? `<tr><td></td><td>Card inicial da anamnese (peso ${Math.round((1 - X.peso) * 100)}%)</td><td>${X.base}</td></tr>` : ''}
    <tr class="us"><td></td><td>Nota ${k}${mist ? ` = ${X.base} × ${fmt(1 - X.peso, 2)} + ${X.calc} × ${fmt(X.peso, 2)}` : ''}</td><td>${X.nota}</td></tr></tbody></table></div>
  ${mist ? `<div class="note"><span><b>Primeiras 4 semanas:</b> a nota mistura o card inicial com o cálculo. A cada dia o cálculo pesa mais; no dia 28 ele vale 100%.</span></div>` : ''}
  <p class="eb">Como subir</p>
  <ul class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">${A.up.map(t => `<li>${t}</li>`).join('')}</ul>`;
};
SH.ovr = () => { const u = me(), a = u.attrs, sum = KS.reduce((x, k) => x + a[k], 0);
  return `${head('Nota geral', `OVR ${u.ovr}`)}
  <p class="small muted">A nota geral é a média simples dos 6 atributos. Nenhum atributo pesa mais que outro.</p>
  <div class="panel tbwrap"><table class="tb"><tbody>${KS.map(k => `<tr><td></td><td>${k} · ${ATTR[k].n}</td><td>${a[k]}</td></tr>`).join('')}
    <tr><td></td><td>Soma</td><td>${sum}</td></tr><tr class="us"><td></td><td>OVR = ${sum} ÷ 6</td><td>${u.ovr}</td></tr></tbody></table></div>
  <p class="eb">Posição no campo</p>
  <p class="small muted">Vem do formato dos seus atributos: <b>PON</b> (ponta) quando RIT se destaca, <b>ZAG</b> (zagueiro) quando FOR se destaca, <b>VOL</b> (volante) quando CON lidera e <b>MEI</b> (meia) quando está tudo equilibrado.</p>
  <p class="eb">Cor do card</p>
  <p class="small muted">Vem do nível, que sobe com XP: Bronze a partir do nível 1, Prata no 10, Ouro no 20 e Especial no 35. Treino vale 120 XP, corrida e esporte 60, cada refeição 15, cada hábito 10, dia nos macros 50.</p>`; };
SH.look = () => `${head('Aparência', 'Escolha o estilo do app')}
  <p class="small muted">Muda cores, tipografia, o formato do card e o tratamento da sua foto. Cada amigo escolhe o seu.</p>
  <div class="stack">${Object.entries(THEMES).map(([k, t]) => `<button class="look ${S.theme === k ? 'on' : ''}" data-a="settheme" data-v="${k}" aria-pressed="${S.theme === k}">
    ${pcard(me(), 'sm', k)}<span style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="h3">${k.toUpperCase()} · ${t.name}${S.theme === k ? ' · em uso' : ''}</span><span class="small muted">${t.desc}</span><span class="sw">${t.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span></span></button>`).join('')}</div>`;
SH.photo = s => {
  if (s.stage === 'busy') return `${head('Seu card', 'Preparando sua foto…')}
    <div class="stage-list"><div class="stg ok"><i></i>Foto recebida</div><div class="stg run"><i></i>Recortando você do fundo</div><div class="stg"><i></i>Encontrando seu rosto e enquadrando</div><div class="stg"><i></i>Aplicando o estilo de cada aparência</div></div>
    <p class="tiny muted">Na primeira vez pode levar alguns segundos: o recorte roda aqui no seu aparelho.</p>`;
  if (s.stage === 'saving') return `${head('Seu card', 'Enviando para o grupo…')}<div class="stage-list"><div class="stg ok"><i></i>Foto pronta nas 3 aparências</div><div class="stg run"><i></i>Enviando para o grupo ver</div></div>`;
  if (s.stage !== 'edit') return `${head('Seu card', 'Sua foto no card')}
    <p class="small muted">Escolha uma foto sua. A gente recorta você do fundo, encontra o rosto e enquadra sozinho. Depois é só conferir.</p>
    <label class="drop" for="photofile">${ic('camera', 34, 1.5)}<span class="h3">Escolher foto</span><span class="small muted">Da galeria ou a foto do seu perfil</span></label>
    <input type="file" id="photofile" class="hidefile" accept="image/*" data-file="photo">
    <div class="note"><span><b>Dica:</b> rosto de frente, com boa luz, do peito para cima. Fundo liso ajuda o recorte.</span></div>
    <div class="center" style="flex-direction:row;justify-content:center;gap:18px;padding-top:4px">${['a', 'b', 'c'].map(k => pcard(me(), 'sm', k)).join('')}</div>
    <p class="tiny muted">O recorte acontece no seu aparelho. Só a foto final do card vai para o grupo.</p>`;
  return `${head('Seu card', 'Confira o enquadramento')}
  <div class="cropwrap"><canvas id="cropcv" width="300" height="375" aria-label="Foto: arraste para mover, pinça ou roda do mouse para zoom"></canvas></div>
  <p class="tiny muted" style="text-align:center">Já enquadramos automaticamente. Se precisar, arraste a foto para encaixar o rosto no oval e use a pinça ou os botões para o zoom.</p>
  <div class="qa" style="justify-content:center"><button class="btn ghost sm" data-a="zoom" data-v="0.9" aria-label="Diminuir zoom">${ic('minus', 16)}</button><button class="btn ghost sm" data-a="zoom" data-v="1.1" aria-label="Aumentar zoom">${ic('plus', 16)}</button><button class="btn ghost sm" data-a="autocrop">${ic('wand', 16)} Enquadrar de novo</button></div>
  ${PH.faceOK ? '' : `<div class="note warn"><span>Não encontrei um rosto com segurança nesta foto. Ajuste o enquadramento à mão ou tente uma foto de frente.</span></div>`}
  ${PH.segOK ? '' : `<div class="note warn"><span>Não consegui recortar o fundo. Usei uma moldura no formato de cabeça e ombros.</span></div>`}
  <p class="eb">Prévia nos 3 estilos</p>
  <div class="pvrow" id="pvrow">${pvCards()}</div>
  <div class="qa" style="flex-wrap:nowrap"><label class="btn ghost" for="photofile2">Outra foto</label><input type="file" id="photofile2" class="hidefile" accept="image/*" data-file="photo"><button class="btn" style="flex:1" data-a="savephoto">Usar no meu card</button></div>`;
};

/* ---------- pontos, VAR e evidências ---------- */
SH.pts = s => {
  const m = mem(s.id), name = s.id === 'u' ? 'Você' : m.name, evs = evRodada().filter(e => e.who === s.id).sort((x, y) => (x.day + x.t).localeCompare(y.day + y.t)), tot = ptsOf(s.id), tp = teamPts(m.team) || 1, G = GOAL(), comp = regras().photo;
  const cats = {}; evs.forEach(e => effCalc(e).lines.forEach(([l, p]) => { if (!p) return; const k = l.replace(/ × \d+$/, ''); cats[k] = (cats[k] || 0) + p; }));
  const nVot = Math.max(1, S.members.length - 1);
  return `${head(`${esc(teamName(m.team))} · rodada ${rodadaN()}${comp ? ' · modo competitivo' : ''}`, `${esc(name)}: ${tot} pts`)}
  <div class="grid3 num"><div class="stat"><span class="eb">Lances</span><b>${evs.length}</b></div><div class="stat"><span class="eb">Do time</span><b>${Math.round(tot / tp * 100)}%</b></div><div class="stat"><span class="eb">Gol em</span><b>${tot >= G ? 'já fez' : G - tot + ' pts'}</b></div></div>
  <p class="eb">Lance a lance</p>
  <div class="stack">${evs.length ? evs.map(e => { const c = effCalc(e), v = e.votos || {}, votos = Object.keys(v).filter(k => k[0] !== '_'), meu = v[S.eu];
    const podeVar = s.id !== 'u' && !e.var && !e.pending && e.day >= semanaAtual();
    return `<div class="calc ${c.total ? '' : 'off'}"><div class="between"><span class="small"><b>${rotuloDia(e.day)} ${e.t}</b> · ${esc(e.txt)}</span><b class="${c.total ? 'c-good' : 'muted'} num">+${c.total}</b></div>
    ${c.lines.map(([l, p, n]) => `<div class="cl"><span>${esc(l)}${n ? `<br><span class="tiny">${esc(n)}</span>` : ''}</span><b>${p ? '+' + p : '0'}</b></div>`).join('')}
    <div class="hrow" style="gap:6px">${evChip(e)}${e.var === 'aberto' ? `<span class="evc var">${ic('whistle', 12)} VAR em análise</span>` : e.var === 'mantido' ? '<span class="evc">VAR: lance mantido</span>' : e.var === 'anulado' ? '<span class="evc bad">VAR: anulado</span>' : ''}${e.pending ? '<span class="evc">enviando…</span>' : ''}</div>
    ${podeVar ? `<button class="link" data-a="var" data-id="${esc(e.id)}" style="font-size:12px">${ic('whistle', 13)} Chamar o VAR</button>` : ''}
    ${e.var === 'aberto' ? `<div class="note"><span><b>Votação aberta por 24 h.</b> ${votos.length} de ${nVot} já votaram. Precisa de mais da metade para anular.${s.id === 'u' ? ' Quem fez o lance não vota.' : meu ? ` Seu voto: <b>${meu === 'vale' ? 'vale' : 'anular'}</b>.` : ''}</span></div>${s.id !== 'u' ? `<div class="qa"><button class="btn sm ${meu === 'vale' ? '' : 'ghost'}" data-a="vote" data-id="${esc(e.id)}" data-v="vale">Vale</button><button class="btn sm ${meu === 'anular' ? '' : 'ghost'}" data-a="vote" data-id="${esc(e.id)}" data-v="anular">Anular</button></div>` : ''}` : ''}
  </div>`; }).join('') : '<div class="note"><span>Nenhum lance nesta rodada ainda.</span></div>'}</div>
  ${Object.keys(cats).length ? `<p class="eb">Resumo por regra</p>
  <div class="panel tbwrap" style="padding:8px 14px"><table class="tb"><tbody>${Object.entries(cats).map(([k, v]) => `<tr><td></td><td>${esc(k)}</td><td>${v}</td></tr>`).join('')}<tr class="us"><td></td><td>Total na rodada</td><td>${tot}</td></tr></tbody></table></div>` : ''}
  <div class="note"><span>Cada ${G} pontos do time viram 1 gol${comp ? ' no modo competitivo' : ''}. A rodada fecha domingo às 23:59.</span></div>
  <button class="btn ghost block" data-a="sheet" data-k="rules">Ver tabela de pontos</button>`; };
SH.viewev = s => { const e = S.evMap.get(s.id); if (!e) return head('Evidência', 'Lance não encontrado');
  const src = e.photo || (e.foto ? S.fotos[e.foto] : null);
  if (!src && e.foto) fotoDrive(e.foto).then(() => { if (S.sheet && S.sheet.k === 'viewev') renderSheet(); });
  return `${head(`${rotuloDia(e.day)} ${e.t} · evidência`, esc(e.txt))}<div class="ph-box" style="aspect-ratio:auto;min-height:120px">${src ? `<img src="${src}" alt="Foto enviada como evidência">` : '<span class="tiny muted">Carregando a foto…</span>'}</div><p class="tiny muted">Foto enviada por ${nomeDe(e.who)} junto com o lance.</p>`; };
SH.evid = s => { const isMeal = s.what === 'meal', h = isMeal ? null : S.habits[s.i], m = isMeal ? S.meals.find(x => x.id === s.id) : null;
  return `${head('Modo competitivo', isMeal ? `Foto: ${esc(m.name.toLowerCase())}` : `Prova: ${esc(h.name)}`)}
  <p class="small muted">${isMeal ? 'No modo competitivo, refeição só pontua para o time com a foto do prato.' : 'O grupo decidiu que este hábito conta no placar, mas só com foto.'} A foto vai junto com o lance e o grupo pode ver.</p>
  <label class="drop" for="evfile">${ic('camera', 34, 1.5)}<span class="h3">Tirar foto</span><span class="small muted">${isMeal ? 'Mostre o prato inteiro' : 'Ex.: a página do livro aberta'}</span></label>
  <input type="file" id="evfile" class="hidefile" accept="image/*" capture="environment" data-file="evid">
  <button class="btn ghost block" data-a="evskip">${isMeal ? 'Registrar sem foto (não pontua)' : 'Marcar sem foto (só vale para sua sequência)'}</button>`; };
SH.member = s => { const p = person(s.id), m = mem(s.id);
  return `${head(esc(teamName(m.team)), nomeDe(s.id))}<div class="center">${pcard(p, 'md')}</div>
  <div class="grid3 num"><div class="stat"><span class="eb">Pts rodada</span><b>${ptsOf(m.id)}</b></div><div class="stat"><span class="eb">Nível</span><b>${p.lvl}</b></div><div class="stat"><span class="eb">Card</span><b style="font-size:16px">${TIERN[tierOf(p.lvl)]}</b></div></div>
  ${m.id !== 'u' ? `<div class="qa"><button class="btn sm" data-a="challenge" data-id="${m.id}">Desafiar</button><button class="btn ghost sm" data-a="sheet" data-k="pts" data-id="${m.id}">Ver lances</button></div>` : ''}`; };

/* ---------- dieta ---------- */
SH.recipe = s => {
  const r = RECIPES.find(x => x.id === s.id), f = recipeFit(r); if (s.n == null) s.n = f.ideal || (r.yieldN > 1 ? 1 : .5);
  const n = s.n, step = r.yieldN > 1 ? 1 : .5, T = { kcal: r.m.kcal * n, p: r.m.p * n, c: r.m.c * n, f: r.m.f * n }, x = rem();
  const after = { kcal: x.kcal - T.kcal, p: x.p - T.p, c: x.c - T.c, f: x.f - T.f }, pend = S.meals.filter(m => !m.done);
  s.meal = s.meal || (pend[pend.length - 1] || { id: 'extra' }).id;
  const st = (lab, val, cls, a, unit) => `<div class="stat"><span class="eb">${lab}</span><b class="${cls}">${fmt(val)}${unit}</b>${S.goals ? `<span class="tiny ${a >= 0 ? 'muted' : 'c-bad'}">${a >= 0 ? 'sobram ' + fmt(a) + unit : fmt(-a) + unit + ' acima'}</span>` : ''}</div>`;
  return `<div class="sh-h"><div class="hrow" style="flex-wrap:nowrap;min-width:0"><span class="rtile">${ic(r.ic, 30, 1.7)}</span><div style="min-width:0"><p class="eb">${esc(r.src)}</p><p class="h1">${esc(r.n)}</p></div></div><button class="x" data-a="close" aria-label="Fechar">${ic('x', 18)}</button></div>
  <div class="mini-mac num"><span class="c-k">${fmt(r.m.kcal)} kcal</span><span class="c-p">${fmt(r.m.p, 1)} P</span><span class="c-c">${fmt(r.m.c, 1)} C</span><span class="c-f">${fmt(r.m.f, 1)} G</span><span class="muted">por ${r.portion} · rende ${r.y ? r.y.toLowerCase() : r.yieldN}${r.time ? ' · ' + r.time : ''}</span></div>
  <div class="panel">
    <p class="eb">${S.goals ? 'Ajustado ao que falta hoje' : 'Quanto você vai comer'}</p>
    <div class="between"><div class="ctr"><button class="sq" data-a="rn" data-v="-${step}" aria-label="Menos">${ic('minus', 16)}</button><b>${fmt(n, n % 1 ? 1 : 0)}</b><button class="sq" data-a="rn" data-v="${step}" aria-label="Mais">${ic('plus', 16)}</button></div><span class="small">${plu(r.portion, n)} · <b class="num">${fmt(T.kcal)} kcal</b></span></div>
    <div class="grid2 num small">
      <div class="stat"><span class="eb">Proteína</span><b class="c-p">${fmt(T.p)} g</b>${S.goals ? `<span class="tiny ${after.p > 0 ? 'muted' : 'c-good'}">${after.p > 0 ? 'ainda faltam ' + fmt(after.p) + ' g' : 'meta batida'}</span>` : ''}</div>
      ${st('Calorias', T.kcal, 'c-k', after.kcal, '')}${st('Carbo', T.c, 'c-c', after.c, ' g')}${st('Gordura', T.f, 'c-f', after.f, ' g')}
    </div>
    ${S.goals ? (f.fit > 0 ? `<p class="small muted">Cabem até ${fmt(f.fit, f.fit % 1 ? 1 : 0)} ${plu(r.portion, f.fit)} no que sobrou do dia. Sugerimos ${fmt(f.ideal, f.ideal % 1 ? 1 : 0)} para fechar a proteína.</p>` : `<p class="small c-bad">Hoje não cabe inteira. Guarde para amanhã ou faça meia porção.</p>`) : ''}
    <div class="chips"><span class="tiny muted" style="align-self:center">Registrar em:</span>${[...pend, { id: 'extra', name: 'Fora do plano' }].map(m => `<button class="chip ${s.meal === m.id ? 'on' : ''}" data-a="rmeal" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>
    <button class="btn block" data-a="logrecipe">Registrar ${fmt(n, n % 1 ? 1 : 0)} ${plu(r.portion, n)}</button>
  </div>
  <p class="eb">Ingredientes · receita inteira</p><div>${r.ing.map(it => Array.isArray(it) ? `<div class="ing"><b>${it[0]}</b><span>${it[1]}</span></div>` : `<div class="ing ing1"><span>${esc(it)}</span></div>`).join('')}</div>
  <p class="eb">Modo de preparo</p><ol class="steps">${r.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
  ${r.pg ? `<p class="tiny muted">Fonte: livro “200 Receitas pra Secar”, nutricionista Patrícia Stênico, p. ${r.pg}. Macros por porção sugerida.</p>` : ''}`;
};
const ETAPAS_PDF = ['Enviando o arquivo', 'Lendo o PDF', 'Identificando refeições e horários', 'Calculando os macros de cada alimento', 'Somando as metas do dia'];
SH.upload = s => {
  const ia = S.G && S.G.ia;
  if (!s.step) return `${head('Dieta', 'Enviar plano alimentar')}
    ${ia ? `<label class="drop" for="dietfile">${ic('book', 34, 1.5)}<span class="h3">Escolher o PDF</span><span class="small muted">O plano que a nutricionista enviou. Também serve foto ou print das páginas.</span></label>
    <input type="file" id="dietfile" class="hidefile" accept="application/pdf,image/*" data-file="diet">
    <p class="tiny muted">O arquivo vai para o servidor do grupo e é lido por IA. Só os dados extraídos ficam guardados.</p>`
    : `<div class="note warn"><span>A leitura de PDF ainda não foi ligada no servidor do grupo. Peça para quem administra preencher <b>ia_provedor</b> e <b>ia_chave</b> na planilha.</span></div>`}
    <button class="btn ghost block" data-a="sheet" data-k="goals">Montar à mão</button>`;
  if (s.step === 'lendo') { const k = Math.min(ETAPAS_PDF.length - 1, s.et || 0);
    return `${head(esc(s.file || 'Plano alimentar'), 'Lendo seu plano…')}<div class="stage-list">${ETAPAS_PDF.map((t, i) => `<div class="stg ${i < k ? 'ok' : i === k ? 'run' : ''}"><i></i>${t}</div>`).join('')}</div>
    <p class="tiny muted">Leva de 20 segundos a 1 minuto. Pode deixar o app aberto aqui.</p>`; }
  if (s.step === 'erro') return `${head('Dieta', 'Não deu certo')}<div class="note warn"><span>${esc(s.erro)}</span></div><button class="btn block" data-a="sheet" data-k="upload">Tentar de novo</button><button class="btn ghost block" data-a="sheet" data-k="goals">Montar à mão</button>`;
  const p = s.plano, g = p.goals, soma = p.meals.reduce((a, m) => a + m.items.reduce((b, i) => b + i.kcal, 0), 0);
  return `${head(esc(s.file || 'Plano alimentar'), 'Confira antes de salvar')}
    ${p.prof ? `<p class="small"><b>${esc(p.prof)}</b></p>` : ''}
    <p class="eb">Metas do dia ${p.fonte === 'calculada' ? '· somadas das refeições (o PDF não trazia)' : '· do PDF'}</p>
    <div class="grid2 num">${[['kcal', 'Calorias', ''], ['p', 'Proteína (g)', 'c-p'], ['c', 'Carboidrato (g)', 'c-c'], ['f', 'Gordura (g)', 'c-f']].map(([k, l]) => inp('pg-' + k, l, g[k], 'inputmode="numeric"')).join('')}</div>
    <p class="eb">${p.meals.length} refeições · ${fmt(soma)} kcal somando a primeira opção</p>
    <div class="stack">${p.meals.map(m => `<div class="panel" style="gap:6px"><div class="between"><b>${esc(m.name)}</b><span class="eb">${m.time}</span></div>${m.items.map(i => `<div class="between tiny"><span>${esc(i.label)}${i.subs && i.subs.length ? ` <span class="muted">· ${i.subs.length} troca${i.subs.length > 1 ? 's' : ''}</span>` : ''}</span><span class="muted num">${fmt(i.kcal)} kcal · ${fmt(i.p)}P</span></div>`).join('')}${(m.alts || []).length ? `<span class="tiny muted">+ ${m.alts.length} opção${m.alts.length > 1 ? 'ões' : ''} alternativa${m.alts.length > 1 ? 's' : ''}</span>` : ''}</div>`).join('')}</div>
    ${p.obs.length ? `<div class="note"><span>${p.obs.map(esc).join(' · ')}</span></div>` : ''}
    <div class="note"><span>A leitura por IA pode errar, principalmente em PDFs escaneados. Depois de salvar, dá para editar cada refeição na aba Plano.</span></div>
    <button class="btn block" data-a="dietok">Salvar este plano</button>`;
};
SH.goals = () => { const g = S.goals || { kcal: 2000, p: 150, c: 200, f: 65 };
  return `${head('Dieta', 'Metas do dia')}
  <div class="grid2 num">${inp('gk', 'Calorias', g.kcal, 'inputmode="numeric"')}${inp('gp', 'Proteína (g)', g.p, 'inputmode="numeric"')}${inp('gc', 'Carboidrato (g)', g.c, 'inputmode="numeric"')}${inp('gf', 'Gordura (g)', g.f, 'inputmode="numeric"')}</div>
  <p class="small muted">Use os números da sua nutricionista. ${S.meals.length ? '' : 'Depois de salvar, adicione as refeições na aba Plano.'}</p>
  <button class="btn block" data-a="goalsok">Salvar metas</button>`; };
SH.mealedit = s => { const m = S.meals.find(x => x.id === s.id); if (!m) return head('Dieta', 'Refeição não encontrada');
  return `${head('Plano alimentar', 'Editar refeição')}
  <div class="grid2">${inp('mname', 'Nome', m.name)}${inp('mtime', 'Horário', m.time, 'type="time"')}</div>
  <p class="eb">Itens</p>
  <div class="stack" style="gap:6px">${m.items.map((i, j) => `<div class="between small"><span>${esc(i.label)} <span class="muted num">· ${fmt(i.kcal)} kcal · ${fmt(i.p)}P ${fmt(i.c)}C ${fmt(i.f)}G</span></span><button class="sq" data-a="itemdel" data-i="${j}" aria-label="Remover ${esc(i.label)}">${ic('trash', 14)}</button></div>`).join('') || '<p class="small muted">Nenhum item.</p>'}</div>
  <form data-f="additem" class="inrow"><input id="itemtxt" class="in" placeholder="Ex.: 150g frango, 120g arroz" autocomplete="off"><button class="btn" type="submit" ${S.iaOcupada ? 'disabled' : ''}>${S.iaOcupada ? 'Lendo…' : 'Adicionar'}</button></form>
  <p class="tiny muted">Escreva com quantidade. ${S.G && S.G.ia ? 'O que a tabela não reconhecer é lido por IA.' : ''}</p>
  <div class="qa"><button class="btn ghost sm" data-a="mealdel">${ic('trash', 14)} Excluir refeição</button><button class="btn sm" data-a="close" style="margin-left:auto">Pronto</button></div>`; };
SH.plate = s => { const pend = S.meals.filter(m => !m.done); s.meal = s.meal || S.logMeal || (pend[0] || { id: 'extra' }).id;
  if (s.step !== 'ok') return `${head('Foto do prato', s.erro ? 'Não deu certo' : 'Analisando…')}<div class="ph-box"><img src="${s.img}" alt="Foto enviada"></div>
    ${s.erro ? `<div class="note warn"><span>${esc(s.erro)}</span></div>` : `<div class="stage-list"><div class="stg run"><i></i>Identificando alimentos e estimando porções</div></div>`}`;
  const tot = s.itens.reduce((a, i) => a + i.kcal, 0);
  return `${head('Foto do prato', 'Estimativa')}<div class="ph-box"><img src="${s.img}" alt="Foto enviada"></div>
  <div class="stack">${s.itens.map((i, j) => `<div class="between small"><span>${esc(i.label)} <span class="muted num">· ${fmt(i.kcal)} kcal</span></span><button class="sq" data-a="platedel" data-i="${j}" aria-label="Tirar ${esc(i.label)}">${ic('x', 14)}</button></div>`).join('')}</div>
  <div class="between"><span class="eb">Total · confiança ${esc(s.conf || 'média')}</span><b class="num">${fmt(tot)} kcal</b></div>
  <div class="chips">${[...pend, { id: 'extra', name: 'Fora do plano' }].map(m => `<button class="chip ${s.meal === m.id ? 'on' : ''}" data-a="pmeal" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>
  <p class="tiny muted">Estimativa por IA. Tire o que não comeu antes de salvar. A foto vale como evidência da refeição.</p><button class="btn block" data-a="plateok" ${s.itens.length ? '' : 'disabled'}>Adicionar</button>`; };
SH.swap = s => { const m = S.meals.find(x => x.id === s.id), cur = m.items[s.i], L = swapsFor(cur);
  return `${head(esc(m.name), 'Trocar ' + esc((cur.food || cur.label).toLowerCase()))}<div class="note"><span>Atual: <b>${esc(cur.label)}</b> · ${fmt(cur.kcal)} kcal · ${fmt(cur.p)}P ${fmt(cur.c)}C ${fmt(cur.f)}G</span></div>
  <div class="stack">${L.map((o, j) => `<button class="row" data-a="doswap" data-i="${j}"><span class="tile">${ic('bowl', 18)}</span><span><span class="t">${esc(o.it.label)}</span><span class="s num">${o.plano ? 'Do seu plano · ' : ''}${fmt(o.it.kcal)} kcal · ${fmt(o.it.p)}P ${fmt(o.it.c)}C ${fmt(o.it.f)}G</span></span><span class="chev">${ic('chev', 18)}</span></button>`).join('')}</div>
  <p class="tiny muted">As trocas "do seu plano" vieram do PDF. As outras são equivalências pelo macro principal (Tabela TACO).</p>`; };

/* ---------- treino ---------- */
SH.day = s => { const w = S.week[s.i], dia = dataDaSemana(s.i);
  const T = [['musc', 'Musculação', 'dumbbell'], ['run', 'Corrida', 'shoe'], ['sport', 'Outro esporte', 'ball'], ['rest', 'Descanso', 'moon']];
  return `${head(capital(fmtData(dia)), esc(w.title))}
  <p class="eb">O que você vai fazer</p><div class="chips">${T.map(([v, l, i]) => `<button class="chip ${w.type === v ? 'on' : ''}" data-a="daytype" data-v="${v}">${ic(i, 14)} ${l}</button>`).join('')}</div>
  ${w.type === 'musc' ? `<p class="eb">Qual treino</p><div class="chips">${Object.entries(W).map(([k, x]) => `<button class="chip ${w.key === k ? 'on' : ''}" data-a="daywk" data-v="${k}">${esc(x.name)} · ${esc(x.sub)}</button>`).join('')}<button class="chip" data-a="daynewwk">${ic('plus', 14)} Criar treino</button></div>
    <div class="qa"><button class="btn sm" data-a="dayopen">Abrir treino</button><button class="btn ghost sm" data-a="dayedit">${ic('edit', 14)} Editar exercícios</button></div>` : ''}
  ${w.type === 'run' ? `<p class="eb">Tipo de corrida</p><div class="chips">${RUNT.map(t => `<button class="chip ${w.rt === t ? 'on' : ''}" data-a="dayrun" data-v="${t}">${t}</button>`).join('')}</div>
    <div class="grid2">${inp('daykm', 'Distância (km)', w.km || '', 'inputmode="decimal" placeholder="Ex.: 8"')}${inp('dayzone', 'Ritmo ou zona', w.zone || '', 'placeholder="Ex.: Z2 · 6:10/km"')}</div>` : ''}
  ${w.type === 'sport' ? `<p class="eb">Esporte</p><div class="chips">${SPORTS.map(x => `<button class="chip ${w.title === x.n ? 'on' : ''}" data-a="daysport" data-v="${x.n}">${x.n}</button>`).join('')}</div>` : ''}
  ${w.type === 'rest' ? `<p class="small muted">Dia livre para recuperar. Se jogar alguma coisa, registre em Treino › Outros.</p>` : ''}
  ${inp('daynote', 'Observação', w.note || '', 'placeholder="Ex.: treinar com o Léo às 6h"')}
  <p class="eb">Trocar com outro dia</p><div class="chips">${S.week.map((x, j) => j === s.i ? '' : `<button class="chip" data-a="dayswap" data-v="${j}">${x.d} · ${esc(x.title.split(' ·')[0])}</button>`).join('')}</div>
  <button class="btn block" data-a="close">Pronto</button>`; };
SH.wklist = () => `${head('Musculação', 'Meus treinos')}
  <div class="stack">${Object.entries(W).map(([k, x]) => `<button class="row" data-a="wkopen" data-v="${k}"><span class="tile">${ic('dumbbell')}</span><span><span class="t">${esc(x.name)} · ${esc(x.sub)}</span><span class="s">${x.ex.length} exercícios · usado em ${S.week.filter(d => d.type === 'musc' && d.key === k).map(d => d.d).join(', ') || 'nenhum dia'}</span></span><span class="chev">${ic('chev', 18)}</span></button>`).join('')}</div>
  <button class="btn block" data-a="newwk">${ic('plus', 16)} Criar treino do zero</button>`;
SH.addex = s => `${head(esc(W[S.active].name), 'Adicionar exercício')}
  <div class="combo-search">${ic('search', 16)}<input id="exq" class="in" placeholder="Buscar exercício ou músculo" value="${esc(s.q || '')}" data-i="exq" autocomplete="off" aria-label="Buscar exercício"></div>
  <div class="stack" id="exlist">${exItems(s.q || '')}</div>`;
let animSpeed = 1, animPaused = false, animClock = 0, animLast = 0, animDrawn = 0;
const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
SH.ex = s => { const e = W[S.active].ex[s.i], a = ANIM[e.anim];
  const tempo = a ? a.p.filter(x => x[0]).map(x => `<span><b>${x[0]}</b> ${fmt(x[1], x[1] % 1 ? 1 : 0)} s</span>`).join('') : '';
  return `${head(esc(e.mus), esc(e.n))}
  ${a ? `<div class="animbox"><div data-anim="${e.anim}" data-big="1">${animSVG(e.anim, S.theme, 0)}</div></div>
    <div class="animctl"><div style="flex:1;min-width:0"><p class="h3" id="animlab">Preparar</p><p class="tiny muted" id="animcue">${esc(a.p[0][2] || '')}</p></div>
      <button class="btn ghost sm" data-a="animspeed">${animSpeed === 1 ? 'Câmera lenta' : 'Velocidade normal'}</button><button class="sq" data-a="animpause" aria-label="${animPaused ? 'Continuar' : 'Pausar'}">${ic(animPaused ? 'play' : 'pause', 16)}</button></div>
    <div class="phases" id="animph">${a.p.map((x, j) => `<i style="flex:${x[1]}" data-ph="${j}"></i>`).join('')}</div>
    <div class="tempo">${tempo}</div>
    <p class="tiny muted">Em destaque, a musculatura que mais trabalha. Visão lateral.</p>`
    : `<div class="note">${ic('dumbbell', 18)}<span>Exercício sem animação. Siga as dicas abaixo ou confira os vídeos.</span></div>`}
  <a class="btn ghost sm" style="align-self:flex-start" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.q || e.n + ' execução')}" target="_blank" rel="noopener">${ic('play', 14)} Ver vídeos de execução</a>
  <p class="eb">Como fazer</p><ol class="steps">${(e.cues || []).map(c => `<li>${esc(c)}</li>`).join('')}</ol>${e.err ? `<div class="note warn"><span><b>Erro comum:</b> ${esc(e.err)}</span></div>` : ''}`; };
function animFrame(now) {
  const dt = Math.min(.1, (now - (animLast || now)) / 1000); animLast = now;
  if (!animPaused) animClock += dt * animSpeed;
  if (now - animDrawn > 33) {
    animDrawn = now;
    document.querySelectorAll('[data-anim]').forEach(el => {
      const id = el.dataset.anim, big = !!el.dataset.big, a = ANIM[id]; if (!a) return;
      if (reduceMotion && !big) { if (!el.firstChild) el.innerHTML = animSVG(id, S.theme, .55, true); return; }
      const t = animAt(id, animClock + (big ? 0 : +el.dataset.off || 0));
      el.innerHTML = animSVG(id, S.theme, t.pos, !big);
      if (big) { const L = $('#animlab'), C = $('#animcue'), PHb = $('#animph');
        if (L) L.textContent = t.label || 'Pausa'; if (C) C.textContent = t.cue || '';
        if (PHb) PHb.querySelectorAll('i').forEach((b, j) => { b.style.setProperty('--f', j < t.k ? '100%' : j === t.k ? (t.prog * 100).toFixed(0) + '%' : '0%'); }); }
    });
  }
  requestAnimationFrame(animFrame);
}
function resumoSessao(k) { const ss = ensureSess(k);
  return { sets: ss.reduce((a, e) => a + e.sets.filter(x => x.done).length, 0), vol: ss.reduce((a, e) => a + e.sets.filter(x => x.done).reduce((b, x) => b + (x.kg || 0) * (x.reps || 0), 0), 0), prs: ss.reduce((a, e) => a + e.prs, 0) }; }
SH.finish = s => { const k = S.active, w = W[k], r = resumoSessao(k), need = regras().photo && !s.photo;
  s.min = s.min || W[k].min || 50;
  return `${head(esc(w.name + ' · ' + w.sub), 'Fechar o treino')}
  <div class="grid3 num"><div class="stat"><span class="eb">Séries</span><b>${r.sets}</b></div><div class="stat"><span class="eb">Volume</span><b>${fmt(r.vol)}</b><span class="tiny muted">kg</span></div><div class="stat"><span class="eb">PRs</span><b class="c-acc">${r.prs}</b></div></div>
  ${r.sets === 0 ? `<div class="note warn"><span>Nenhuma série marcada. Marque as séries feitas para o treino contar.</span></div>` : ''}
  <p class="eb">Duração</p><div class="chips">${[30, 45, 60, 75, 90].map(d => `<button class="chip ${s.min === d ? 'on' : ''}" data-a="fmin" data-v="${d}">${d} min</button>`).join('')}</div>
  <label class="drop" for="wkphoto">${s.photo ? `<div class="ph-box"><img src="${s.photo}" alt="Foto do treino"></div><span class="small muted">Toque para trocar</span>` : `${ic('camera', 34, 1.5)}<span class="h3">Foto do treino</span><span class="small muted">${regras().photo ? 'Obrigatória: o grupo está no modo competitivo.' : 'Opcional. Vale como evidência e vai para a resenha.'}</span>`}</label>
  <input type="file" id="wkphoto" class="hidefile" accept="image/*" capture="environment" data-file="wk">
  <div class="between"><span class="small">Postar na resenha</span><button class="tog ${s.post !== false ? 'on' : ''}" data-a="togpost" aria-label="Postar na resenha" aria-pressed="${s.post !== false}"></button></div>
  <div class="note"><span>Vale <b>+50 pts</b> pro ${esc(teamName(myTeam()))}${r.prs ? ` e <b>+${Math.min(r.prs, 3) * 10}</b> pelos PRs` : ''}. XP: <b>+${120 + r.prs * 30}</b>.</span></div>
  <button class="btn block" data-a="finish" ${need || r.sets === 0 ? 'disabled' : ''}>${need ? 'Envie a foto para concluir' : 'Concluir treino'}</button>`; };
SH.sport = s => { const sp = SPORTS.find(x => x.n === s.v) || SPORTS[5]; s.dur = s.dur || 60; s.pse = s.pse || 6; const need = regras().photo && !s.photo;
  return `${head('Registrar', sp.n)}<p class="eb">Duração</p><div class="chips">${[30, 45, 60, 90, 120].map(d => `<button class="chip ${s.dur === d ? 'on' : ''}" data-a="sdur" data-v="${d}">${d} min</button>`).join('')}</div>
  <label class="eb" for="pse">Intensidade percebida · <span id="pseval">${s.pse}</span>/10</label><input type="range" id="pse" min="1" max="10" value="${s.pse}" data-i="pse">
  <div class="between tiny muted"><span>Leve</span><span>Moderado</span><span>Máximo</span></div>
  <p class="eb">Evidência${regras().photo ? ' · obrigatória no modo competitivo' : ' · opcional'}</p>
  <label class="drop" for="sportfile" style="padding:14px">${s.photo ? `<div class="ph-box"><img src="${s.photo}" alt="Foto do jogo"></div><span class="small muted">Toque para trocar</span>` : `${ic('camera', 26, 1.5)}<span class="small"><b>Foto na quadra ou print do relógio</b></span>`}</label><input type="file" id="sportfile" class="hidefile" accept="image/*" data-file="sport">
  <div class="note"><span>Vale <b>+35 pts</b> pro time e <b>+60 XP</b>. Sessões de 60 min ou mais sobem RES.</span></div>
  <button class="btn block" data-a="logsport" ${need ? 'disabled' : ''}>${need ? 'Envie a evidência para registrar' : 'Registrar'}</button>`; };
SH.run = s => { const w = S.week[diaIdx(S.day)] || {}; s.rt = s.rt || (w.type === 'run' && w.rt) || 'Rodagem'; const need = regras().photo && !s.photo;
  const km = parseFloat(String(s.km || '').replace(',', '.')), sec = parseTempo(s.tempo), ok = km > 0 && sec > 0;
  return `${head('Corrida', 'Registrar corrida')}
  <p class="eb">Tipo</p><div class="chips">${RUNT.map(t => `<button class="chip ${s.rt === t ? 'on' : ''}" data-a="runrt" data-v="${t}">${t}</button>`).join('')}</div>
  <div class="grid2">${inp('runkm', 'Distância (km)', s.km || (w.type === 'run' && w.km) || '', 'inputmode="decimal" placeholder="Ex.: 8,2"')}${inp('runtempo', 'Tempo (h:mm:ss ou mm:ss)', s.tempo || '', 'inputmode="numeric" placeholder="Ex.: 47:30"')}</div>
  ${inp('runfc', 'FC média (opcional)', s.fc || '', 'inputmode="numeric" placeholder="Ex.: 148"')}
  <p class="small muted" id="runpace">${ok ? `Pace: <b>${pace(sec / km)}/km</b>` : 'Preencha distância e tempo para ver o pace.'}</p>
  <p class="eb">Evidência${regras().photo ? ' · obrigatória no modo competitivo' : ' · opcional'}</p>
  <label class="drop" for="runfile" style="padding:14px">${s.photo ? `<div class="ph-box"><img src="${s.photo}" alt="Print da corrida"></div><span class="small muted">Toque para trocar</span>` : `${ic('watch', 26, 1.5)}<span class="small"><b>Print do relógio ou do Strava</b></span>`}</label><input type="file" id="runfile" class="hidefile" accept="image/*" data-file="run">
  <div class="note"><span>Vale <b>+35 pts</b> pro time e <b>+60 XP</b>. O pace alimenta o RIT do seu card.</span></div>
  <button class="btn block" data-a="logrun" ${need ? 'disabled' : ''}>${need ? 'Envie a evidência para registrar' : 'Registrar corrida'}</button>`; };
function parseTempo(t) { const p = String(t || '').trim().split(/[:h'.]/).map(x => parseInt(x, 10)).filter(x => !isNaN(x)); if (!p.length) return 0; if (p.length === 1) return p[0] * 60; if (p.length === 2) return p[0] * 60 + p[1]; return p[0] * 3600 + p[1] * 60 + p[2]; }

/* ---------- hábitos ---------- */
SH.newhabit = s => { s.ic = s.ic || 'star'; s.type = s.type || 'check'; s.target = s.target || 3;
  return `${head('Hábitos', 'Novo hábito')}<label class="eb" for="hname">Nome</label><input id="hname" class="in" placeholder="Ex.: Alongar 10 min" value="${esc(s.name || '')}" data-i="hname">
  <p class="eb">Ícone</p><div class="chips">${['star', 'drop', 'book', 'tooth', 'pill', 'phone', 'moon', 'bowl', 'shoe'].map(i => `<button class="chip ${s.ic === i ? 'on' : ''}" data-a="hic" data-v="${i}" aria-label="${i}">${ic(i, 18)}</button>`).join('')}</div>
  <p class="eb">Tipo</p><div class="chips"><button class="chip ${s.type === 'check' ? 'on' : ''}" data-a="htype" data-v="check">Feito / não feito</button><button class="chip ${s.type === 'count' ? 'on' : ''}" data-a="htype" data-v="count">Contador</button></div>
  ${s.type === 'count' ? `<div class="between"><span class="small">Meta diária</span><div class="ctr"><button class="sq" data-a="htarget" data-v="-1">${ic('minus', 16)}</button><b>${s.target}</b><button class="sq" data-a="htarget" data-v="1">${ic('plus', 16)}</button></div></div>` : ''}
  ${regras().photo ? `<div class="note"><span>No modo competitivo, hábitos criados por você ${N_habConta(regras(), 'outros') ? 'contam no placar com foto' : 'valem só para a sua sequência (regra do grupo)'}.</span></div>` : ''}
  <div class="note"><span>Comece pequeno. Hábitos que levam menos de 2 minutos têm muito mais chance de virar rotina.</span></div><button class="btn block" data-a="addhabit">Adicionar hábito</button>`; };

/* ---------- grupo ---------- */
function linkConvite() { const base = location.origin + location.pathname; return `${base}#convite=${encodeURIComponent((S.G && S.G.convite) || '')}${CFG.api ? '' : '&api=' + encodeURIComponent(apiUrl())}`; }
SH.group = () => { const g = S.G || {}, R = regras(), adm = me().admin, dis = adm ? '' : 'disabled';
  return `${head(esc(g.nome || 'Racha'), 'Regras do grupo')}
  ${adm ? '' : `<div class="note"><span>Só quem administra o grupo muda as regras. Você pode ver tudo aqui.</span></div>`}
  <div class="between"><span><b>Modo competitivo</b><br><span class="small muted">Só pontua lance com evidência: foto enviada junto. Gol a cada 80 pts.</span></span><button class="tog ${R.photo ? 'on' : ''}" data-a="togcomp" aria-pressed="${R.photo}" aria-label="Modo competitivo" ${dis}></button></div>
  ${R.photo ? `<p class="eb">Hábitos que contam no placar</p>
  <p class="small muted">O grupo escolhe. Hábito fora da lista continua valendo para a sequência pessoal e para o HAB, só não soma pontos para o time.</p>
  <div class="stack">${[...HAB_PADRAO.map(h => [h.id, h.name, h.ic]), ['outros', 'Hábitos criados por cada um', 'star']].map(([id, n, i]) => `<div class="between"><span class="hrow" style="gap:10px;flex-wrap:nowrap;min-width:0"><span class="tile" style="width:36px;height:36px">${ic(i, 16)}</span><span style="min-width:0"><b class="small">${esc(n)}</b><br><span class="tiny muted">Prova: foto</span></span></span><button class="tog ${N_habConta(R, id) ? 'on' : ''}" data-a="toghab" data-v="${id}" aria-pressed="${N_habConta(R, id)}" aria-label="Contar ${esc(n)} no placar" ${dis}></button></div>`).join('')}</div>
  <div class="note">${ic('whistle', 18)}<span><b>Chamar o VAR:</b> qualquer pessoa pode contestar um lance da rodada, pela memória de cálculo de cada jogador. O grupo vota em até 24 h.</span></div>` : ''}
  <p class="eb">Times do clássico</p>
  ${['A', 'B'].map(t => `<div class="grid2">${inp('tn' + t, 'Nome do time ' + t, teamName(t), dis + ' maxlength="24"')}${inp('ts' + t, 'Sigla', teamShort(t), dis + ' maxlength="3"')}</div>`).join('')}
  ${adm ? `<button class="btn ghost block" data-a="salvartimes">Salvar nomes</button>` : ''}
  <p class="small muted">${S.members.length} jogadores ÷ 2 = 2 times, equilibrados pelo OVR quando sorteados.</p>
  ${adm ? `<button class="btn ghost block" data-a="draft">Sortear times de novo</button>` : ''}
  <div><b>Rodada</b><br><span class="small muted">Segunda 00:00 a domingo 23:59.</span></div>
  <p class="eb">Convite</p>
  <div class="panel soft"><p class="small">Código: <b style="font-size:20px;letter-spacing:.08em">${esc(g.convite || '—')}</b></p><p class="tiny muted">Quem abrir o link entra direto na tela de primeiro acesso, com o código preenchido.</p>
  <div class="qa"><button class="btn sm" data-a="convidar">Mandar convite</button>${adm ? `<button class="btn ghost sm" data-a="novoconvite">Gerar código novo</button>` : ''}</div></div>`; };
SH.rules = () => `${head('Clássico', 'Como os pontos viram gols')}
  <div class="panel tbwrap"><table class="tb"><thead><tr><th></th><th>Lance</th><th>Pts</th></tr></thead><tbody>
  <tr><td></td><td>Treino de musculação concluído</td><td>50</td></tr><tr><td></td><td>Recorde pessoal (até 3 por treino)</td><td>10</td></tr><tr><td></td><td>Corrida ou outro esporte</td><td>35</td></tr>
  <tr><td></td><td>Refeição dentro do plano (até 5 por dia)</td><td>5</td></tr><tr><td></td><td>Dia dentro dos macros</td><td>25</td></tr><tr><td></td><td>Cada hábito cumprido</td><td>5</td></tr><tr><td></td><td>Dia perfeito de hábitos</td><td>15</td></tr></tbody></table></div>
  <div class="stack small"><p><b>Cada 100 pontos do time = 1 gol.</b> O placar fecha domingo às 23:59.</p>
  <p><b>Modo competitivo:</b> só pontua lance com evidência (foto enviada junto). Hábitos só contam se o grupo escolher e houver foto. O gol cai para 80 pontos.</p>
  <p><b>VAR:</b> qualquer jogador contesta um lance da rodada; se mais da metade do grupo votar para anular, os pontos saem.</p>
  <p><b>Atributos medem evolução.</b> Um iniciante que treina toda semana sobe tão rápido quanto um veterano.</p>
  <p><b>Sem punição pesada:</b> perder um dia não zera nada. Cartões verdes protegem sua sequência.</p></div>`;
SH.newch = s => { const outros = S.members.filter(m => m.id !== 'u'); s.vs = s.vs || (outros[0] || {}).id; s.metric = s.metric || 'Dias de treino'; s.dias = s.dias || 7;
  return `${head('Mano a mano', 'Novo desafio')}<p class="eb">Contra quem</p><div class="chips">${outros.map(m => `<button class="chip ${s.vs === m.id ? 'on' : ''}" data-a="chvs" data-v="${m.id}">${esc(m.name)}</button>`).join('')}</div>
  <p class="eb">Métrica</p><div class="chips">${['Dias de treino', 'Km corridos', 'Pontos no racha', 'Dias nos macros', 'Dias perfeitos de hábitos', 'Volume levantado'].map(x => `<button class="chip ${s.metric === x ? 'on' : ''}" data-a="chm" data-v="${x}">${x}</button>`).join('')}</div>
  <p class="eb">Duração</p><div class="chips">${[[7, '1 semana'], [14, '2 semanas'], [30, '1 mês']].map(([v, l]) => `<button class="chip ${s.dias === v ? 'on' : ''}" data-a="chd" data-v="${v}">${l}</button>`).join('')}</div>
  <label class="eb" for="bet">Aposta</label><input id="bet" class="in" placeholder="Ex.: quem perder paga o açaí" value="${esc(s.bet || '')}" data-i="bet" maxlength="120">
  <p class="tiny muted">Começa quando a pessoa aceitar. Os números saem dos lances de cada um.</p><button class="btn block" data-a="createch">Lançar desafio</button>`; };

/* ---------- perfil, notificações e instalação ---------- */
SH.profile = () => { const u = me();
  return `${head('Perfil', esc(u.name))}<div class="hrow" style="flex-wrap:nowrap">${pcard(u, 'sm')}<div class="stack small" style="min-width:0"><span><b>${esc(teamName(myTeam()))}</b> · ${esc((S.G || {}).nome || '')}</span><span class="muted">${S.ana && S.ana.mods ? esc(S.ana.mods.join(', ')) : 'Sem anamnese ainda'}</span>${S.runGoal ? `<span class="muted">Objetivo: ${esc(S.runGoal)}</span>` : ''}${u.admin ? '<span class="chip acc" style="align-self:flex-start">administra o grupo</span>' : ''}</div></div>
  <div class="stack">
    <button class="row" data-a="sheet" data-k="look"><span class="tile">${ic('palette')}</span><span><span class="t">Aparência</span><span class="s">${S.theme.toUpperCase()} · ${THEMES[S.theme].name}</span></span><span class="chev">${ic('chev', 18)}</span></button>
    <button class="row" data-a="photo"><span class="tile">${ic('camera')}</span><span><span class="t">Foto do card</span><span class="s">${S.carica ? 'Foto aplicada' : 'Ainda sem foto'}</span></span><span class="chev">${ic('chev', 18)}</span></button>
    <button class="row" data-a="sheet" data-k="notif"><span class="tile">${ic('bell')}</span><span><span class="t">Notificações</span><span class="s">${lsGet('pushToken') ? 'Ligadas neste aparelho' : 'Desligadas'}</span></span><span class="chev">${ic('chev', 18)}</span></button>
    ${INSTALADO() ? '' : `<button class="row" data-a="instalar"><span class="tile">${ic('phone')}</span><span><span class="t">Instalar o app</span><span class="s">Ícone na tela de início, tela cheia e notificações</span></span><span class="chev">${ic('chev', 18)}</span></button>`}
    <button class="row" data-a="sheet" data-k="conn"><span class="tile">${ic('watch')}</span><span><span class="t">Relógio e apps</span><span class="s">Garmin, Apple Watch e Strava</span></span><span class="chev">${ic('chev', 18)}</span></button>
    <button class="row" data-a="ana"><span class="tile">${ic('check')}</span><span><span class="t">${S.ana ? 'Refazer anamnese' : 'Anamnese'}</span><span class="s">Objetivos, disponibilidade e saúde</span></span><span class="chev">${ic('chev', 18)}</span></button>
    <button class="row" data-a="sheet" data-k="pin"><span class="tile">${ic('shield')}</span><span><span class="t">Trocar PIN</span><span class="s">Seu código de entrada</span></span><span class="chev">${ic('chev', 18)}</span></button>
    <button class="row" data-a="sheet" data-k="about"><span class="tile">${ic('star')}</span><span><span class="t">Sobre o RACHA</span><span class="s">Versão, dados e o que vem a seguir</span></span><span class="chev">${ic('chev', 18)}</span></button>
    <button class="row" data-a="sair"><span class="tile">${ic('back')}</span><span><span class="t">Sair deste aparelho</span><span class="s">Seus dados continuam salvos no grupo</span></span><span></span></button>
  </div>`; };
SH.pin = s => `${head('Perfil', 'Trocar PIN')}${inp('pinatual', 'PIN atual', '', 'type="password" inputmode="numeric" autocomplete="current-password"')}${inp('pinnovo', 'PIN novo (4 a 8 números)', '', 'type="password" inputmode="numeric" autocomplete="new-password"')}
  ${s.erro ? `<div class="note warn"><span>${esc(s.erro)}</span></div>` : ''}<button class="btn block" data-a="pinok">Trocar</button>`;
SH.conn = () => `${head('Integrações', 'Relógio e apps')}
  <div class="note"><span><b>Ainda não há ligação direta</b> com Garmin, Apple Watch ou Strava. Para isso o RACHA precisa virar app de loja (a ligação com o Apple Saúde só existe em app nativo).</span></div>
  <p class="small">Enquanto isso: registre a corrida ou o esporte e anexe o <b>print do relógio</b>. No modo competitivo, o print vale como evidência.</p>`;
SH.notif = () => `${head('Notificações', 'Poucas e certeiras')}${typeof secaoPush === 'function' ? secaoPush() : ''}
  <div class="note"><span>Avisos programados saem no máximo uma vez por dia cada. Entre 23h e 7h nada é enviado.</span></div>`;
SH.instalar = () => `${head('Instalar', 'RACHA na tela de início')}
  ${IOS ? `<ol class="steps"><li>Abra este endereço no <b>Safari</b> (no Chrome do iPhone não aparece a opção).</li><li>Toque no botão <b>Compartilhar</b> (quadrado com seta para cima).</li><li>Role e toque em <b>Adicionar à Tela de Início</b>, depois em <b>Adicionar</b>.</li><li>Abra o RACHA pelo ícone novo. Você vai precisar entrar de novo uma vez.</li></ol>
    <div class="note"><span>No iPhone, as notificações só funcionam com o app aberto pelo ícone (iOS 16.4 ou mais novo).</span></div>`
  : `<ol class="steps"><li>No Chrome, toque no menu <b>⋮</b>.</li><li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li><li>Abra o RACHA pelo ícone novo.</li></ol>${S.instalarEvt ? `<button class="btn block" data-a="instalarja">Instalar agora</button>` : ''}`}`;
SH.about = () => `${head('RACHA · v' + VERSAO_APP, 'Sobre o app')}<div class="stack small">
  <p><b>Como funciona:</b> o app fica no GitHub Pages; os dados do grupo ficam numa planilha Google de quem administra, acessada por um Apps Script. Fotos ficam numa pasta do Google Drive dessa mesma conta.</p>
  <p><b>Seus dados pessoais</b> (plano, treinos, refeições, hábitos) ficam salvos no servidor do grupo e neste aparelho. Os outros jogadores veem só seu card, seus lances e seus posts.</p>
  <p><b>Sem internet:</b> o app abre com o que já estava salvo e manda os lances quando a conexão voltar.</p>
  <p><b>Ainda não tem:</b> ligação direta com relógio, leitura de links do Instagram e TikTok, liga entre grupos.</p>
  <p class="tiny muted">Receitas: livro “200 Receitas pra Secar”, da nutricionista Patrícia Stênico.${S.fila.length ? ` · ${S.fila.length} envio${S.fila.length > 1 ? 's' : ''} na fila` : ''}${S.ultimaSinc ? ` · sincronizado às ${new Date(S.ultimaSinc).toTimeString().slice(0, 5)}` : ''}</p></div>`;

/* ---------- anamnese ---------- */
const PARQ = ['Algum médico já disse que você tem problema no coração e só deve fazer atividade física com recomendação dele?', 'Você sente dor no peito quando faz atividade física?', 'No último mês, sentiu dor no peito sem estar fazendo atividade física?', 'Você perde o equilíbrio por tontura ou já perdeu a consciência?', 'Tem algum problema nos ossos ou articulações que pode piorar com exercício?', 'Toma remédio para pressão ou para o coração?', 'Sabe de algum outro motivo para não fazer atividade física?'];
SH.ana = () => {
  const a = S.anaTmp, d = a.d, N = 7;
  const top = `<div class="sh-h"><div style="flex:1"><p class="eb">Anamnese · ${a.step === 0 ? 'início' : a.step < N ? `passo ${a.step} de ${N - 1}` : 'resultado'}</p><div style="margin-top:8px">${bar(a.step, N, 'var(--accent)')}</div></div><button class="x" data-a="close" aria-label="Fechar">${ic('x', 18)}</button></div>`;
  const multi = (key, opts) => `<div class="chips">${opts.map(o => `<button class="chip ${d[key].includes(o) ? 'on' : ''}" data-a="am" data-k="${key}" data-v="${o}">${o}</button>`).join('')}</div>`;
  const one = (key, opts) => `<div class="chips">${opts.map(o => `<button class="chip ${d[key] == o ? 'on' : ''}" data-a="a1" data-k="${key}" data-v="${o}">${o}</button>`).join('')}</div>`;
  const nav = (ok = true) => `<div class="hrow" style="margin-top:auto;flex-wrap:nowrap">${a.step > 0 ? `<button class="btn ghost" data-a="astep" data-v="-1">Voltar</button>` : ''}<button class="btn" style="flex:1" data-a="astep" data-v="1" ${ok ? '' : 'disabled'}>${a.step === N - 1 ? 'Montar meu plano' : 'Continuar'}</button></div>`;
  let body = '';
  if (a.step === 0) body = `<div class="center" style="padding:16px 0">${pcard({ ...me(), ovr: '??', attrs: { RIT: '?', FOR: '?', RES: '?', CON: '?', NUT: '?', HAB: '?' } }, 'md')}<p class="display">Antes de escalar, o técnico precisa te conhecer.</p><p class="muted">6 perguntas rápidas. Leva uns 2 minutos e define seu plano e seu card inicial.</p></div>${nav()}`;
  if (a.step === 1) body = `<p class="h1">Qual é o seu objetivo?</p><p class="small muted">Pode marcar mais de um.</p>${multi('goal', ['Perder gordura', 'Ganhar massa', 'Melhorar na corrida', 'Saúde e disposição', 'Performance no esporte'])}${nav(d.goal.length > 0)}`;
  if (a.step === 2) body = `<p class="h1">O que você pratica ou quer praticar?</p>${multi('mods', ['Musculação', 'Corrida', 'Beach tennis', 'Crossfit', 'Hyrox', 'Futebol', 'Natação'])}${nav(d.mods.length > 0)}`;
  if (a.step === 3) body = `<p class="h1">Quanto tempo você tem?</p><p class="eb">Dias por semana</p>${one('days', [2, 3, 4, 5, 6, 7])}<p class="eb">Minutos por sessão</p>${one('time', [30, 45, 60, 90])}${nav(d.days && d.time)}`;
  if (a.step === 4) body = `<p class="h1">Qual sua experiência?</p><p class="eb">Musculação</p>${one('lvl', ['Nunca treinei', 'Até 1 ano', '1 a 3 anos', 'Mais de 3 anos'])}<p class="eb">Corrida</p>${one('run', ['Não corro', 'Corro até 5 km', 'Corro 10 km', 'Já corri meia ou mais'])}
    <div class="grid2">${inp('anaage', 'Idade', d.age || '', 'inputmode="numeric" placeholder="Para as zonas de FC"')}${inp('anafc', 'FC máxima (se souber)', d.fcmax || '', 'inputmode="numeric" placeholder="Opcional"')}</div>${nav(d.lvl && d.run)}`;
  if (a.step === 5) body = `<p class="h1">Onde você treina?</p>${multi('where', ['Academia completa', 'Academia do prédio', 'Em casa', 'Ao ar livre'])}${nav(d.where.length > 0)}`;
  if (a.step === 6) body = `<p class="h1">Triagem de saúde</p><p class="small muted">Questionário PAR-Q. Responda com sinceridade: ele define a intensidade inicial. As respostas ficam só no seu perfil.</p>
    <div class="stack">${PARQ.map((q, i) => `<div class="panel" style="gap:8px"><p class="small">${q}</p><div class="chips"><button class="chip ${d.parq[i] === 1 ? 'on' : ''}" data-a="aq" data-i="${i}" data-v="1">Sim</button><button class="chip ${d.parq[i] === 0 ? 'on' : ''}" data-a="aq" data-i="${i}" data-v="0">Não</button></div></div>`).join('')}</div>${nav(d.parq.every(x => x === 0 || x === 1))}`;
  if (a.step === 7) { const plan = genPlan(d), risk = d.parq.includes(1);
    body = `<p class="h1">Seu plano de ${d.days} dias</p>${risk ? `<div class="note warn"><span><b>Procure liberação médica antes de treinos intensos.</b> Você respondeu sim na triagem. O plano começa em intensidade leve e o coach não sugere tiros até você confirmar a liberação.</span></div>` : ''}
    <div class="stack">${plan.map(w => `<div class="row" style="cursor:default"><span class="day"><small>${w.d}</small><b>${N_dataObj(dataDaSemana(DIAS.indexOf(w.d))).getDate()}</b></span><span><span class="t">${esc(w.title)}</span><span class="s">${esc(w.det)}</span></span><span></span></div>`).join('')}</div>
    <div class="hrow" style="margin-top:auto;flex-wrap:nowrap"><button class="btn ghost" data-a="astep" data-v="-1">Voltar</button><button class="btn" style="flex:1" data-a="areveal">${S.ana ? 'Usar este plano' : 'Revelar meu card inicial'}</button></div>`; }
  return top + body;
};
function genPlan(d) {
  const days = +d.days, short = +d.time <= 30, mods = d.mods, musc = mods.includes('Musculação'), run = mods.includes('Corrida'), others = mods.filter(m => !['Musculação', 'Corrida'].includes(m));
  const sess = []; let nM = musc ? (run ? Math.ceil(days / 2) : days) : 0, nR = run ? (musc ? Math.floor(days / 2) : days) : 0, nO = 0;
  if (!musc && !run) nO = days; else if (others.length && days >= 3) { if (nM > 1) nM--; else if (nR > 1) nR--; nO = 1; }
  const split = { 1: ['C'], 2: ['A', 'B'], 3: ['A', 'B', 'C'], 4: ['A', 'B', 'A', 'B'], 5: ['A', 'B', 'C', 'A', 'B'], 6: ['A', 'B', 'C', 'A', 'B', 'C'], 7: ['A', 'B', 'C', 'A', 'B', 'C', 'C'] }[nM] || [];
  split.forEach(k => { const x = W[k] || W_PADRAO[k]; sess.push({ type: 'musc', key: k, title: `${x.name} · ${x.sub}`, det: short ? 'Versão express · 30 min · 2 séries' : `${x.ex.length} exercícios · ~${Math.min(+d.time, x.min)} min` }); });
  const R = [['Rodagem', 'Z2 · 30 a 40 min'], ['Intervalado', 'Tiros curtos em Z4 · 2 min de trote'], ['Longão', 'Z2 · o mais longo da semana'], ['Regenerativo', 'Z1 · 25 min'], ['Ritmo de prova', 'Blocos no ritmo alvo'], ['Rodagem', 'Z2'], ['Rodagem', 'Z2']];
  const ro = nR === 1 ? [0] : nR === 2 ? [1, 2] : nR === 3 ? [1, 0, 2] : [1, 0, 3, 2, 4, 5, 6].slice(0, nR);
  if (d.parq.includes(1)) ro.forEach((v, i) => { if (v === 1 || v === 4) ro[i] = 0; });
  ro.forEach(i => sess.push({ type: 'run', rt: R[i][0], title: R[i][0], det: R[i][1], zone: R[i][1] }));
  for (let i = 0; i < nO; i++) sess.push({ type: 'sport', title: others[i % Math.max(others.length, 1)] || 'Outro', det: 'Livre · registre duração e intensidade' });
  const pat = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 2, 3, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] }[days];
  const ms = sess.filter(s => s.type === 'musc'), rs = sess.filter(s => s.type !== 'musc'), order = [];
  while (ms.length || rs.length) { if (ms.length) order.push(ms.shift()); if (rs.length) order.push(rs.shift()); }
  const li = order.findIndex(s => s.title === 'Longão'); if (li > -1 && pat.includes(5)) { const L = order.splice(li, 1)[0]; order.splice(pat.indexOf(5), 0, L); }
  return DIAS.map((dn, i) => { const pi = pat.indexOf(i), s = pi > -1 ? order[pi] : null;
    return s ? { d: dn, ...s } : { d: dn, type: 'rest', title: 'Descanso', det: 'Recuperação' }; });
}

/* ============ avisos de tela cheia ============ */
function queue(o) { S.q.push(o); if (!S.overOpen) nextOver(); }
function nextOver() {
  const o = S.q.shift(), el = $('#over'); if (!o) { el.innerHTML = ''; S.overOpen = false; return; } S.overOpen = true;
  if (o.type === 'goal') el.innerHTML = `<div class="ov"><div class="ov-in"><div class="gol">GOOOL!</div>${board(false)}<p>${esc(o.txt)}</p><button class="btn" data-a="nextover">Comemorar</button></div></div>`;
  else if (o.type === 'level') el.innerHTML = `<div class="ov"><div class="ov-in"><p class="eb" style="color:#FFFFFF">Subiu de nível</p><div class="lvl">NÍVEL ${o.lvl}</div>${pcard(me(), 'md', S.theme, 'spin')}<p class="small" style="opacity:.8">${esc(o.txt || 'Continue assim: a cor do card muda nos níveis 10, 20 e 35.')}</p><button class="btn" data-a="nextover">Continuar</button></div></div>`;
  else if (o.type === 'reveal') el.innerHTML = `<div class="ov"><div class="ov-in"><p class="eb" style="color:#FFFFFF">Card inicial</p>${pcard(o.card, 'lg', S.theme, 'spin')}<p class="h1">${o.card.pos} · ${TIERN[tierOf(o.card.lvl)]}</p><p class="small" style="opacity:.8">Seus atributos sobem conforme você evolui em relação a você mesmo. Treine com constância e o card muda de cor.</p><button class="btn" data-a="useplan">Usar este plano</button></div></div>`;
  else if (o.type === 'newcard') el.innerHTML = `<div class="ov"><div class="ov-in"><p class="eb" style="color:#FFFFFF">Seu card novo</p>${pcard(me(), 'lg', S.theme, 'spin')}<p class="small" style="opacity:.85">Sua foto já está pronta nas 3 aparências e o grupo vai ver no próximo sincronismo.</p><button class="btn" data-a="nextover">Bora</button></div></div>`;
}
