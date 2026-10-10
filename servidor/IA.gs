/**
 * IA.gs — leitura do plano alimentar em PDF, de texto livre de comida e de foto do prato.
 * Provedor na aba Config: ia_provedor = claude (API da Anthropic, paga por uso) ou gemini (Google AI Studio, tem cota grátis).
 * A chave (ia_chave) vai para as Propriedades do script no primeiro uso e a célula é limpa.
 * Para conferir a configuração, rode testarIA() no editor.
 */
var IA_PADRAO = {
  claude: { modelo: 'claude-haiku-5-5', rapido: 'claude-haiku-5-5' },
  gemini: { modelo: 'gemini-2.5-flash', rapido: 'gemini-2.5-flash' }
};

function iaChave_() {
  var props = PropertiesService.getScriptProperties(), c = cfg_();
  if (c.ia_chave && c.ia_chave.indexOf('(guardada') !== 0) {
    props.setProperty('IA_CHAVE', c.ia_chave.trim());
    cfgSet_('ia_chave', '(guardada nas Propriedades do script)');
  }
  return props.getProperty('IA_CHAVE') || '';
}
function iaProvedor_() { var p = String(cfg_().ia_provedor || '').trim().toLowerCase(); return IA_PADRAO[p] ? p : ''; }
function iaAtiva_() { try { return !!(iaProvedor_() && iaChave_()); } catch (e) { return false; } }

function iaApi_(s, req) {
  if (!iaAtiva_()) throw apiErro_('A leitura por IA ainda não foi ligada no servidor (Config › ia_provedor e ia_chave).', 'CONFIG');
  var cache = CacheService.getScriptCache(), k = 'racha_ia_' + s.pessoa + '_' + hoje_(), n = Number(cache.get(k) || 0);
  if (n >= (Number(cfg_().ia_limite_dia) || 40)) throw apiErro_('Limite de leituras por IA de hoje atingido. Amanhã libera de novo.', 'LIMITE');
  var f = { dieta: iaDieta_, comida: iaComida_, prato: iaPrato_ }[req.tipo];
  if (!f) throw apiErro_('Tipo de leitura desconhecido.', 'ACAO');
  var t0 = Date.now(), r;
  try { r = f(req); }
  catch (e) { iaRegistrar_(s, req, t0, 'erro: ' + (e.message || e)); throw e; }
  iaRegistrar_(s, req, t0, r.plano ? 'ok: ' + r.plano.meals.length + ' refeições' + (r.plano.faltou ? ', faltou ' + r.plano.faltou : '') : 'ok');
  cache.put(k, String(n + 1), 6 * 3600); // só conta leitura que deu certo
  return r;
}
/* Aba LogIA: uma linha por leitura, para entender os erros que as pessoas relatam. */
function iaRegistrar_(s, req, t0, resultado) {
  try {
    if (!ABAS.LogIA) ABAS.LogIA = ['Quando', 'Pessoa', 'Tipo', 'KB', 'Segundos', 'Resultado']; // funciona mesmo com um Dados.gs antigo
    inserir_('LogIA', { Quando: new Date().toISOString(), Pessoa: s.pessoa, Tipo: req.tipo, KB: Math.round(String(req.arquivo || req.texto || '').length * 0.75 / 1024),
      Segundos: Math.round((Date.now() - t0) / 1000), Resultado: String(resultado).slice(0, 300) });
  } catch (e) { Logger.log('LogIA: ' + e); }
}

/* Chaves curtas para a resposta sair rápida: t = texto com quantidade, a = alimento, g = gramas, k = kcal, p/c/f = macros em g, s = substituições */
var IA_ITEM = '{"t":"2 ovos mexidos (100 g)","a":"Ovo mexido","g":100,"k":146,"p":12.4,"c":1.2,"f":9.6}';

/* O plano é lido em duas etapas para cada chamada à IA ser curta (planos com muitas substituições estouravam o tamanho e o tempo de uma resposta só):
   1) a estrutura (refeições, horários, metas); 2) cada refeição com seus itens, todas ao mesmo tempo. O PDF fica em cache na IA entre as chamadas. */
var IA_REGRAS_PLANO = [
  'Você recebe o plano alimentar de uma pessoa, feito por nutricionista, e extrai dados dele em JSON, em português do Brasil.',
  'Responda só JSON minificado, sem texto fora do JSON. Os números dos exemplos são só ilustração.',
  'Regras:',
  '- Metas e macros: p = proteína, c = carboidrato, f = gordura, em gramas; k ou kcal em quilocalorias. Números, não texto.',
  '- Se o documento traz os macros de um alimento, use os do documento. Senão, calcule pela Tabela TACO (alimento como servido: cozido, grelhado etc.).',
  '- Medidas caseiras viram gramas aproximados (1 colher de sopa de arroz ≈ 25 g; 1 concha de feijão ≈ 100 g; 1 fatia de pão de forma ≈ 25 g).',
  '- Chaves dos itens: t = texto como a pessoa lê, com quantidade; a = nome curto do alimento; g = gramas; k = kcal; p, c, f = gramas de proteína, carboidrato e gordura.',
  '- "s" são substituições do próprio plano para aquele item ("ou", "substituir por", lista de equivalentes), no máximo 8. Sem substituição: lista vazia.',
  '- Se a refeição tem opções completas (Opção 1, Opção 2), a primeira vai em "itens" e as demais em "alternativas".',
  '- Itens "à vontade" (salada de folhas, legumes) entram com uma porção típica de 80 g.',
  '- Hora no formato HH:MM; se não houver, estime pela ordem (café 07:00, lanche 10:00, almoço 12:30, lanche 16:00, jantar 20:00, ceia 22:00).',
  '- Não invente refeições nem alimentos que não estão no documento.'
].join('\n');

function iaDieta_(req) {
  var arq = iaArquivo_(req.arquivo, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 15);
  arq.cache = true;
  var e1 = iaJson_(iaChamar_(false, IA_REGRAS_PLANO, [arq, { texto: 'Etapa 1, só a estrutura do plano. Formato: ' +
    '{"plano":true,"profissional":"nome e registro (CRN), se houver, senão vazio","metas":{"kcal":n,"p":n,"c":n,"f":n},' +
    '"refeicoes":[{"nome":"Café da manhã","hora":"07:00"}],"observacoes":["orientações gerais curtas, no máximo 6"]}. ' +
    'metas = null se o documento não traz metas diárias. plano = false se o documento não é um plano alimentar.' }], 3000));
  if (!e1 || e1.plano === false || !Array.isArray(e1.refeicoes) || !e1.refeicoes.length)
    throw apiErro_('Não consegui achar as refeições neste arquivo. Ele é mesmo um plano alimentar? Se for foto ou escaneado, tente um PDF mais nítido.', 'IA');
  var refs = e1.refeicoes.slice(0, 10), item = IA_ITEM.replace(/\}$/, ',"s":[' + IA_ITEM + ']}');
  var pedidos = refs.map(function (r, i) {
    return iaPedido_(false, IA_REGRAS_PLANO, [arq, { texto: 'Etapa 2, só a refeição "' + String(r.nome || '').slice(0, 40) + '" (' + (i + 1) + 'ª de ' + refs.length +
      ' do plano' + (r.hora ? ', ' + r.hora : '') + '). Formato: {"itens":[' + item + '],"alternativas":[{"nome":"Opção 2","itens":[' + IA_ITEM + ']}]}' }], 8000);
  });
  var resps = UrlFetchApp.fetchAll(pedidos.map(function (p) { return p.req; })), falhas = [], primeiroErro = null;
  var refeicoes = refs.map(function (r, i) {
    var o = null;
    try { o = iaJson_(iaResposta_(resps[i], pedidos[i].modelo)); } catch (e) { primeiroErro = primeiroErro || e; }
    if (!o || !Array.isArray(o.itens) || !o.itens.length) { falhas.push(String(r.nome || 'Refeição ' + (i + 1))); return null; }
    return { nome: r.nome, hora: r.hora, itens: o.itens, alternativas: o.alternativas || [] };
  }).filter(Boolean);
  if (!refeicoes.length) throw primeiroErro || apiErro_('Não consegui ler os itens das refeições. Tente de novo ou monte o plano à mão.', 'IA');
  var plano = iaLimparPlano_({ profissional: e1.profissional, metas: e1.metas ? Object.assign({ fonte: 'pdf' }, e1.metas) : { fonte: 'calculada' },
    refeicoes: refeicoes, observacoes: (falhas.length ? ['Não consegui ler: ' + falhas.join(', ') + '. Confira no PDF e complete à mão.'] : []).concat(e1.observacoes || []) });
  if (falhas.length) plano.faltou = falhas.join(', ');
  return { plano: plano };
}

function iaComida_(req) {
  var t = String(req.texto || '').trim().slice(0, 600);
  if (!t) throw apiErro_('Escreva o que comeu.', 'VALIDACAO');
  var instr = 'A pessoa descreve o que comeu, em português. Liste os alimentos com quantidade estimada e macros pela Tabela TACO. ' +
    'Se a quantidade não foi dita, use uma porção típica brasileira e diga qual no texto. Responda só JSON: {"itens":[' + IA_ITEM + '],"nao_entendi":["trechos que não são comida ou não deu para entender"]}';
  var o = iaJson_(iaChamar_(true, instr, [{ texto: t }], 2000)) || {};
  return { itens: iaItens_(o.itens), nao: (o.nao_entendi || []).slice(0, 5).map(String) };
}

function iaPrato_(req) {
  var arq = iaArquivo_(req.arquivo, ['image/jpeg', 'image/png', 'image/webp'], 5);
  var instr = 'Foto de um prato de comida. Identifique cada alimento, estime a quantidade em gramas pelo tamanho no prato e calcule os macros pela Tabela TACO. ' +
    'Responda só JSON: {"itens":[' + IA_ITEM + '],"confianca":"alta, media ou baixa","nao_e_comida":false}';
  var o = iaJson_(iaChamar_(false, instr, [arq, { texto: 'Estime este prato.' }], 2000)) || {};
  if (o.nao_e_comida) throw apiErro_('Não parece uma foto de comida.', 'IA');
  return { itens: iaItens_(o.itens), confianca: o.confianca || 'media' };
}

/* ------------------------------ limpeza do que a IA devolve ------------------------------ */
function iaNum_(v) { var n = Number(String(v === undefined ? '' : v).replace(',', '.')); return isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0; }
function iaItem_(x) {
  x = x || {};
  var t = x.t || x.texto || x.a || x.alimento || '', a = x.a || x.alimento || t;
  return { label: String(t).slice(0, 120), food: String(a).slice(0, 60), g: iaNum_(x.g),
    kcal: iaNum_(x.k !== undefined ? x.k : x.kcal), p: iaNum_(x.p), c: iaNum_(x.c), f: iaNum_(x.f) };
}
function iaItens_(l) { return (Array.isArray(l) ? l : []).slice(0, 25).map(iaItem_).filter(function (i) { return i.label; }); }
function iaLimparPlano_(o) {
  var hora = function (h, nome, i) {
    var m = String(h || '').match(/(\d{1,2})[:hH](\d{2})?/);
    if (m) return ('0' + m[1]).slice(-2) + ':' + (m[2] || '00');
    var n = String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); // sem hora no PDF: estima pelo nome da refeição
    var porNome = [[/ceia/, '22:00'], [/jantar/, '20:00'], [/almoco/, '12:30'], [/tarde/, '16:00'], [/cafe|desjejum/, '07:00'], [/lanche|manha/, '10:00'], [/pre.?treino/, '17:00'], [/pos.?treino/, '19:00']];
    for (var k = 0; k < porNome.length; k++) if (porNome[k][0].test(n)) return porNome[k][1];
    return ['07:00', '10:00', '12:30', '16:00', '20:00', '22:00'][i] || '12:00';
  };
  var refeicoes = o.refeicoes.slice(0, 10).map(function (r, i) {
    return { name: String(r.nome || 'Refeição ' + (i + 1)).slice(0, 40), time: hora(r.hora, r.nome, i),
      items: (r.itens || []).slice(0, 25).map(function (x) { var it = iaItem_(x); it.subs = iaItens_(x.s || x.subs).slice(0, 8); return it; }).filter(function (i) { return i.label; }),
      alts: (r.alternativas || []).slice(0, 4).map(function (a, j) { return { name: String(a.nome || 'Opção ' + (j + 2)).slice(0, 30), items: iaItens_(a.itens) }; }).filter(function (a) { return a.items.length; }) };
  }).filter(function (r) { return r.items.length; });
  var m = o.metas || {}, soma = { kcal: 0, p: 0, c: 0, f: 0 };
  refeicoes.forEach(function (r) { r.items.forEach(function (i) { soma.kcal += i.kcal; soma.p += i.p; soma.c += i.c; soma.f += i.f; }); });
  var temMetas = iaNum_(m.kcal) > 300;
  return {
    prof: String(o.profissional || '').slice(0, 80),
    goals: temMetas ? { kcal: Math.round(iaNum_(m.kcal)), p: Math.round(iaNum_(m.p)), c: Math.round(iaNum_(m.c)), f: Math.round(iaNum_(m.f)) }
      : { kcal: Math.round(soma.kcal), p: Math.round(soma.p), c: Math.round(soma.c), f: Math.round(soma.f) },
    fonte: temMetas && m.fonte !== 'calculada' ? 'pdf' : 'calculada',
    meals: refeicoes,
    obs: (o.observacoes || []).slice(0, 6).map(function (x) { return String(x).slice(0, 200); })
  };
}

/* ------------------------------ chamada ao provedor ------------------------------ */
function iaArquivo_(dataUrl, tipos, limiteMb) {
  var m = String(dataUrl || '').match(/^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m || tipos.indexOf(m[1]) < 0) throw apiErro_('Arquivo em formato não suportado. Use PDF ou foto (JPG, PNG).', 'VALIDACAO');
  if (m[2].length * 0.75 > limiteMb * 1024 * 1024) throw apiErro_('Arquivo grande demais (máximo ' + limiteMb + ' MB).', 'VALIDACAO');
  return { mime: m[1], b64: m[2] };
}

/** partes: lista de { mime, b64, cache } (arquivo) ou { texto }. Devolve o texto da resposta. */
function iaChamar_(rapido, instrucao, partes, maxTokens) {
  var p = iaPedido_(rapido, instrucao, partes, maxTokens);
  return iaResposta_(UrlFetchApp.fetchAll([p.req])[0], p.modelo);
}

/** Monta o pedido: req no formato de UrlFetchApp.fetchAll, modelo para as mensagens de erro. arquivo.cache = true guarda o arquivo em cache na IA (várias perguntas sobre o mesmo PDF). */
function iaPedido_(rapido, instrucao, partes, maxTokens) {
  var prov = iaProvedor_(), chave = iaChave_(), c = cfg_();
  var modelo = (rapido ? c.ia_modelo_rapido : c.ia_modelo) || IA_PADRAO[prov][rapido ? 'rapido' : 'modelo'];
  if (prov === 'claude') {
    var content = partes.map(function (p) {
      if (p.texto) return { type: 'text', text: p.texto };
      var b = { type: p.mime === 'application/pdf' ? 'document' : 'image', source: { type: 'base64', media_type: p.mime, data: p.b64 } };
      if (p.cache) b.cache_control = { type: 'ephemeral' };
      return b;
    });
    var corpo = { model: modelo, max_tokens: maxTokens, system: instrucao, messages: [{ role: 'user', content: content }] };
    // Modelos da geração 5 pensam antes de responder; extração de dados não precisa de muito: esforço baixo é mais rápido e barato
    if (/^claude-[a-z]+-5/.test(modelo)) corpo.output_config = { effort: 'low' };
    return { modelo: modelo, req: { url: 'https://api.anthropic.com/v1/messages', method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify(corpo) } };
  }
  return { modelo: modelo, req: { url: 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent',
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-goog-api-key': chave },
    payload: JSON.stringify({ systemInstruction: { parts: [{ text: instrucao }] },
      contents: [{ role: 'user', parts: partes.map(function (p) { return p.texto ? { text: p.texto } : { inline_data: { mime_type: p.mime, data: p.b64 } }; }) }],
      generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens, responseMimeType: 'application/json' } }) } };
}

/** Lê a resposta da IA: devolve o texto ou lança um erro com a explicação para a pessoa. */
function iaResposta_(r, modelo) {
  var prov = iaProvedor_(), code = r.getResponseCode(), txt = r.getContentText();
  if (code !== 200) {
    Logger.log('IA ' + prov + ' ' + code + ': ' + txt.slice(0, 500));
    var det = '';
    try { var e = JSON.parse(txt).error || {}; det = String(e.message || '').slice(0, 200); } catch (x) { /* corpo não é JSON */ }
    if (/credit balance/i.test(det)) throw apiErro_('A conta da IA está sem créditos. Coloque créditos em console.anthropic.com › Billing.', 'IA');
    if (code === 401 || code === 403) throw apiErro_('A chave da IA foi recusada. Confira ia_chave na planilha.', 'IA');
    if (code === 429) throw apiErro_('A IA está sem cota agora. Tente de novo em alguns minutos.', 'IA');
    if (code === 404) throw apiErro_('Modelo de IA não encontrado (' + modelo + '). Ajuste ia_modelo na planilha.', 'IA');
    if (code === 413) throw apiErro_('Arquivo grande demais para a IA. Tente um PDF menor ou só as páginas do plano.', 'IA');
    if (code >= 500) throw apiErro_('A IA está sobrecarregada agora. Tente de novo em alguns minutos.', 'IA');
    throw apiErro_('A IA recusou o pedido (' + code + (det ? ': ' + det : '') + ').', 'IA');
  }
  var o = JSON.parse(txt);
  if (prov === 'claude') {
    if (o.stop_reason === 'max_tokens') throw apiErro_('O plano é longo demais para ler de uma vez. Tente enviar só as páginas das refeições.', 'IA');
    if (o.stop_reason === 'refusal') throw apiErro_('A IA não quis ler este arquivo. Tente outro PDF ou monte o plano à mão.', 'IA');
    return (o.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('');
  }
  var cand = (o.candidates || [])[0];
  if (cand && cand.finishReason === 'MAX_TOKENS') throw apiErro_('O plano é longo demais para ler de uma vez. Tente enviar só as páginas das refeições.', 'IA');
  return cand && cand.content ? (cand.content.parts || []).map(function (p) { return p.text || ''; }).join('') : '';
}

function iaJson_(t) {
  t = String(t || '').replace(/```(?:json)?/g, '');
  var a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
}

/** Rodar no editor para conferir se a IA está configurada. Testa o texto de comida e a leitura de um PDF de exemplo. */
function testarIA() {
  if (!iaAtiva_()) { Logger.log('Falta preencher ia_provedor (claude ou gemini) e ia_chave na aba Config.'); return; }
  var r = iaComida_({ texto: '2 ovos mexidos e 1 pão francês' });
  Logger.log('Texto ok (' + iaProvedor_() + '): ' + JSON.stringify(r));
  var html = '<h2>Plano alimentar</h2><p>Meta diária: 2000 kcal · 150 g proteína · 200 g carboidrato · 60 g gordura</p>' +
    '<h3>Café da manhã (07:00)</h3><ul><li>2 ovos mexidos</li><li>1 fatia de pão integral</li><li>1 banana</li></ul>' +
    '<h3>Almoço (12:30)</h3><ul><li>150 g de frango grelhado ou 150 g de peixe</li><li>4 colheres de sopa de arroz</li><li>1 concha de feijão</li><li>Salada à vontade</li></ul>' +
    '<h3>Jantar (20:00)</h3><ul><li>Omelete de 3 ovos</li><li>Legumes refogados</li></ul>';
  var pdf = Utilities.newBlob(html, 'text/html', 'teste.html').getAs('application/pdf');
  var p = iaDieta_({ arquivo: 'data:application/pdf;base64,' + Utilities.base64Encode(pdf.getBytes()) }).plano;
  Logger.log('PDF ok: ' + p.meals.length + ' refeições, metas ' + JSON.stringify(p.goals));
  Logger.log('IA ok. A leitura de PDF está ligada no app.');
  return p;
}
