/**
 * Dados.gs — planilha, configuração e as regras de gravação do RACHA.
 * Uma planilha = um grupo. Cada aba guarda um assunto; tudo como texto puro (o Sheets não converte nada).
 *
 * Primeiro uso: rode configurar() uma vez no editor. Ela cria as abas, a pasta de fotos no Drive
 * e mostra o código de convite no registro de execução.
 */
var ABAS = {
  Config: ['Chave', 'Valor', 'Para que serve'],
  Pessoas: ['ID', 'Nome', 'PinHash', 'Time', 'Pos', 'Nivel', 'Ovr', 'Attrs', 'FotoA', 'FotoB', 'FotoC', 'Admin', 'Ativo', 'CriadoEm', 'Atualizado'],
  Sessoes: ['ID', 'TokenHash', 'Pessoa', 'CriadoEm', 'ExpiraEmMs', 'Aparelho', 'UltimoUso', 'Ativa'],
  Eventos: ['ID', 'Pessoa', 'Time', 'Dia', 'Hora', 'Tipo', 'Texto', 'Pts', 'Calc', 'Ev', 'Foto', 'Extra', 'Chave', 'Var', 'Votos', 'Excluido', 'Atualizado'],
  Posts: ['ID', 'Pessoa', 'Ts', 'Texto', 'Cena', 'Foto', 'Reacoes', 'Comentarios', 'Excluido', 'Atualizado'],
  Desafios: ['ID', 'De', 'Para', 'Metrica', 'Dias', 'Inicio', 'Fim', 'Aposta', 'Status', 'CriadoEm', 'Atualizado'],
  Estado: ['Pessoa', 'Atualizado', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12'],
  Push: ['Token', 'Pessoa', 'Plataforma', 'Tipos', 'CriadoEm', 'AtualizadoEm', 'Ativo', 'UltimoErro']
};

var CONFIG_PADRAO = [
  ['nome_grupo', 'Racha', 'Nome do grupo, aparece no app'],
  ['convite', '', 'Código que os amigos digitam no primeiro acesso. Troque quando quiser fechar a entrada'],
  ['time_A_nome', 'Leg Day FC', 'Nome do time A'],
  ['time_A_sigla', 'LDF', 'Sigla do time A (3 letras)'],
  ['time_B_nome', 'Pula Perna United', 'Nome do time B'],
  ['time_B_sigla', 'PPU', 'Sigla do time B (3 letras)'],
  ['regras', '{"photo":false,"hab":{"agua":false,"creat":false,"leit":true,"fio":false,"tela":false,"sono":true,"outros":false}}', 'Modo competitivo e hábitos que contam no placar. O app muda isto pela tela Regras do grupo'],
  ['inicio', '', 'Primeiro dia da temporada (AAAA-MM-DD). A rodada 1 é a semana desse dia'],
  ['fuso', 'America/Fortaleza', 'Fuso horário do grupo'],
  ['dias_sessao', '180', 'Quantos dias o login vale no aparelho'],
  ['max_pessoas', '30', 'Limite de pessoas no grupo'],
  ['ia_provedor', '', 'claude ou gemini. Vazio = sem leitura de PDF por IA'],
  ['ia_chave', '', 'Chave da API da IA. No primeiro uso ela vai para as Propriedades do script e esta célula é limpa'],
  ['ia_modelo', '', 'Opcional, para PDF e foto. Vazio = claude-haiku-5-5 (Claude) ou gemini-2.5-flash (Gemini). Para mais precisão no Claude: claude-sonnet-5-5'],
  ['ia_modelo_rapido', '', 'Opcional, para texto de comida. Vazio = claude-haiku-5-5 ou gemini-2.5-flash'],
  ['ia_limite_dia', '40', 'Leituras por IA por pessoa por dia (controle de custo)'],
  ['firebase_web_config', '', 'Notificações: bloco firebaseConfig do console do Firebase (pode ser o mesmo projeto do RM)'],
  ['firebase_vapid_key', '', 'Notificações: chave "Web Push certificates" do Cloud Messaging'],
  ['firebase_service_account', '', 'Notificações: conteúdo do JSON da conta de serviço. Vai para as Propriedades do script e a célula é limpa']
];

/* ------------------------------ planilha ------------------------------ */
var _ss = null, _cfg = null, _cache = {};
function ss_() {
  if (_ss) return _ss;
  var id = PropertiesService.getScriptProperties().getProperty('PLANILHA');
  _ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!_ss) throw apiErro_('Planilha não encontrada. Crie o Apps Script a partir da planilha (Extensões › Apps Script).', 'SETUP');
  return _ss;
}
function sh_(nome) { return ss_().getSheetByName(nome); }
function aba_(nome) {
  var sh = sh_(nome), cab = ABAS[nome];
  if (!sh) {
    sh = ss_().insertSheet(nome);
    sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), cab.length).setNumberFormat('@');
  }
  return sh;
}
/** Lê a aba inteira como objetos. Cada objeto ganha _lin (número da linha na planilha). */
function ler_(nome) {
  if (_cache[nome]) return _cache[nome];
  var sh = aba_(nome), cab = ABAS[nome], n = sh.getLastRow() - 1, out = [];
  if (n > 0) sh.getRange(2, 1, n, cab.length).getValues().forEach(function (v, i) {
    var o = { _lin: i + 2 };
    cab.forEach(function (c, j) { o[c] = v[j] === null || v[j] === undefined ? '' : String(v[j]); });
    out.push(o);
  });
  _cache[nome] = out;
  return out;
}
function linhaDe_(nome, o) { return ABAS[nome].map(function (c) { return o[c] === undefined || o[c] === null ? '' : String(o[c]); }); }
function inserir_(nome, o) {
  var sh = aba_(nome), cab = ABAS[nome];
  var lin = sh.getLastRow() + 1;
  sh.getRange(lin, 1, 1, cab.length).setNumberFormat('@').setValues([linhaDe_(nome, o)]);
  if (_cache[nome]) { var c = {}; cab.forEach(function (k) { c[k] = o[k] === undefined || o[k] === null ? '' : String(o[k]); }); c._lin = lin; _cache[nome].push(c); }
  return lin;
}
function atualizar_(nome, lin, campos) {
  var sh = aba_(nome), cab = ABAS[nome], atual = sh.getRange(lin, 1, 1, cab.length).getValues()[0];
  var novo = cab.map(function (c, j) { return Object.prototype.hasOwnProperty.call(campos, c) ? (campos[c] === null || campos[c] === undefined ? '' : String(campos[c])) : atual[j]; });
  sh.getRange(lin, 1, 1, cab.length).setValues([novo]);
  if (_cache[nome]) _cache[nome].forEach(function (o) { if (o._lin === lin) cab.forEach(function (c, j) { o[c] = String(novo[j]); }); });
}
function comLock_(fn) {
  var lock = LockService.getScriptLock(); lock.waitLock(25000);
  try { _cache = {}; return fn(); } finally { lock.releaseLock(); }
}
function json_(t, padrao) { try { return t ? JSON.parse(t) : padrao; } catch (e) { return padrao; } }

/* ------------------------------ configuração ------------------------------ */
function cfg_() {
  if (_cfg) return _cfg;
  var o = {}, sh = aba_('Config'), n = sh.getLastRow() - 1;
  if (n > 0) sh.getRange(2, 1, n, 2).getValues().forEach(function (v) { if (v[0]) o[String(v[0]).trim()] = String(v[1]).trim(); });
  _cfg = o;
  return o;
}
function cfgSet_(chave, valor) {
  var sh = aba_('Config'), n = sh.getLastRow() - 1, v = n > 0 ? sh.getRange(2, 1, n, 1).getValues() : [];
  for (var i = 0; i < v.length; i++) if (String(v[i][0]).trim() === chave) { sh.getRange(i + 2, 2).setNumberFormat('@').setValue(String(valor)); _cfg = null; return; }
  sh.appendRow([chave, String(valor), '']); _cfg = null;
}
function fuso_() { return cfg_().fuso || 'America/Fortaleza'; }
function hoje_() { return Utilities.formatDate(new Date(), fuso_(), 'yyyy-MM-dd'); }
function horaAgora_() { return Number(Utilities.formatDate(new Date(), fuso_(), 'H')); }
function regras_() { return N_regras(json_(cfg_().regras, {})); }

function grupoPublico_() {
  var c = cfg_();
  return {
    nome: c.nome_grupo || 'Racha', convite: c.convite || '',
    times: { A: { nome: c.time_A_nome || 'Time A', sigla: c.time_A_sigla || 'TMA' }, B: { nome: c.time_B_nome || 'Time B', sigla: c.time_B_sigla || 'TMB' } },
    regras: regras_(), inicio: c.inicio || N_segunda(hoje_()), fuso: fuso_(), hoje: hoje_(), ia: iaAtiva_()
  };
}

/** Rodar uma vez no editor do Apps Script (e de novo sem medo: não apaga nada). */
function configurar() {
  Object.keys(ABAS).forEach(aba_);
  var sh = aba_('Config'), atual = cfg_();
  CONFIG_PADRAO.forEach(function (l) {
    if (!(l[0] in atual)) { sh.appendRow([l[0], l[1], l[2]]); }
  });
  sh.getRange(1, 1, sh.getMaxRows(), 2).setNumberFormat('@');
  _cfg = null;
  if (!cfg_().convite) cfgSet_('convite', Utilities.getUuid().replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase());
  if (!cfg_().inicio) cfgSet_('inicio', N_segunda(hoje_()));
  PropertiesService.getScriptProperties().setProperty('PLANILHA', ss_().getId());
  pastaFotos_();
  var s0 = ss_().getSheetByName('Página1') || ss_().getSheetByName('Sheet1');
  if (s0 && ss_().getSheets().length > 1 && s0.getLastRow() === 0) ss_().deleteSheet(s0);
  var msg = 'RACHA configurado. Código de convite: ' + cfg_().convite + '. Agora implante como app da web (Implantar › Nova implantação).';
  Logger.log(msg);
  return msg;
}

/* ------------------------------ pessoas ------------------------------ */
function pessoaPorId_(id) { return ler_('Pessoas').filter(function (p) { return p.ID === id; })[0] || null; }
function pessoasAtivas_() { return ler_('Pessoas').filter(function (p) { return p.Ativo !== 'não'; }); }
function pessoaPublica_(p) {
  return { id: p.ID, name: p.Nome, team: p.Time || 'A', pos: p.Pos || 'MEI', lvl: Number(p.Nivel) || 1, ovr: Number(p.Ovr) || 0,
    attrs: json_(p.Attrs, null), foto: { a: p.FotoA || '', b: p.FotoB || '', c: p.FotoC || '' }, admin: p.Admin === 'sim', ativo: p.Ativo !== 'não' };
}
function exigirAdmin_(s) {
  var p = pessoaPorId_(s.pessoa);
  if (!p || p.Admin !== 'sim') throw apiErro_('Só quem administra o grupo pode mudar isso.', 'PERMISSAO');
  return p;
}

/* ------------------------------ sincronização ------------------------------ */
function evParaApp_(r) {
  var x = json_(r.Extra, {}) || {};
  x.id = r.ID; x.who = r.Pessoa; x.team = r.Time; x.day = r.Dia; x.t = r.Hora; x.kind = r.Tipo; x.txt = r.Texto;
  x.pts = Number(r.Pts) || 0; x.calc = json_(r.Calc, null); x.ev = r.Ev || null; x.foto = r.Foto || null; x.key = r.Chave || null;
  x['var'] = r.Var || null; x.votos = json_(r.Votos, {}) || {}; x.excluido = r.Excluido === 'sim'; x.up = Number(r.Atualizado) || 0;
  return x;
}
function postParaApp_(r) {
  return { id: r.ID, who: r.Pessoa, ts: Number(r.Ts) || 0, text: r.Texto, scene: r.Cena || '', foto: r.Foto || null,
    reacoes: json_(r.Reacoes, { like: [], fire: [] }), coments: json_(r.Comentarios, []), excluido: r.Excluido === 'sim', up: Number(r.Atualizado) || 0 };
}
function desafioParaApp_(r) {
  return { id: r.ID, de: r.De, para: r.Para, metric: r.Metrica, dias: Number(r.Dias) || 7, inicio: r.Inicio || '', fim: r.Fim || '',
    bet: r.Aposta, status: r.Status, criado: r.CriadoEm, up: Number(r.Atualizado) || 0 };
}

/** Tudo o que mudou desde "desde" (ms). desde = 0 traz a janela inteira (10 semanas de lances, 80 posts). */
function sincronizar_(s, desde) {
  var agora = Date.now(), corte = N_somaDias(N_segunda(hoje_()), -7 * 10);
  resolverVarsVencidos_();
  var evs = ler_('Eventos').filter(function (r) { return desde ? Number(r.Atualizado) > desde : r.Dia >= corte && r.Excluido !== 'sim'; }).map(evParaApp_);
  var posts = ler_('Posts').filter(function (r) { return desde ? Number(r.Atualizado) > desde : r.Excluido !== 'sim'; });
  if (!desde) posts = posts.slice(-80);
  var des = ler_('Desafios').filter(function (r) { return desde ? Number(r.Atualizado) > desde : true; });
  return { agora: agora, grupo: grupoPublico_(), pessoas: pessoasAtivas_().map(pessoaPublica_), eventos: evs, posts: posts.map(postParaApp_), desafios: des.map(desafioParaApp_), completo: !desde };
}

/* ------------------------------ estado pessoal ------------------------------ */
var ESTADO_PARTE = 45000;
function lerEstado_(pessoa) {
  var r = ler_('Estado').filter(function (x) { return x.Pessoa === pessoa; })[0];
  if (!r) return { json: null, atualizado: 0 };
  var t = '';
  for (var i = 1; i <= 12; i++) t += r['P' + i] || '';
  return { json: t || null, atualizado: Number(r.Atualizado) || 0 };
}
function salvarEstado_(s, req) {
  var t = String(req.json || '');
  if (!t || t.charAt(0) !== '{') throw apiErro_('Estado inválido.', 'VALIDACAO');
  if (t.length > ESTADO_PARTE * 12) throw apiErro_('Seus dados passaram do limite. Avise quem administra o grupo.', 'LIMITE');
  return comLock_(function () {
    var agora = Date.now(), campos = { Pessoa: s.pessoa, Atualizado: String(agora) };
    for (var i = 1; i <= 12; i++) campos['P' + i] = t.slice((i - 1) * ESTADO_PARTE, i * ESTADO_PARTE);
    var r = ler_('Estado').filter(function (x) { return x.Pessoa === s.pessoa; })[0];
    if (r && req.base && Number(r.Atualizado) > Number(req.base) + 1000 && !req.forcar) {
      // Outro aparelho salvou depois: devolve o mais novo para o app decidir
      return { conflito: true, servidor: lerEstado_(s.pessoa) };
    }
    if (r) atualizar_('Estado', r._lin, campos); else inserir_('Estado', campos);
    var pub = req.pub || {}, p = pessoaPorId_(s.pessoa);
    if (p) {
      var novo = { Pos: String(pub.pos || p.Pos).slice(0, 3), Nivel: String(Number(pub.lvl) || p.Nivel || 1), Ovr: String(Number(pub.ovr) || p.Ovr || ''),
        Attrs: pub.attrs ? JSON.stringify(pub.attrs).slice(0, 300) : p.Attrs };
      if (novo.Pos !== p.Pos || novo.Nivel !== p.Nivel || novo.Ovr !== p.Ovr || novo.Attrs !== p.Attrs) { novo.Atualizado = String(agora); atualizar_('Pessoas', p._lin, novo); }
    }
    return { atualizado: agora };
  });
}

/* ------------------------------ lances ------------------------------ */
var EV_BASE = ['id', 'who', 'team', 'day', 't', 'kind', 'txt', 'pts', 'calc', 'ev', 'foto', 'key', 'var', 'votos', 'excluido', 'up', 'photo'];
function lancarEvento_(s, req) {
  var e = req.ev || {};
  var cid = String(e.id || '').replace(/[^A-Za-z0-9_\-]/g, '').slice(0, 48);
  if (!cid) throw apiErro_('Lance sem identificação.', 'VALIDACAO');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.day))) throw apiErro_('Lance sem data.', 'VALIDACAO');
  var hoje = hoje_();
  if (e.day > N_somaDias(hoje, 1) || e.day < N_somaDias(hoje, -3)) throw apiErro_('Só dá para lançar lances dos últimos 3 dias.', 'VALIDACAO');
  var id = s.pessoa + '-' + cid, extra = {};
  Object.keys(e).forEach(function (k) { if (EV_BASE.indexOf(k) < 0) extra[k] = e[k]; });
  var extraTxt = JSON.stringify(extra);
  if (extraTxt.length > 4000) throw apiErro_('Lance grande demais.', 'VALIDACAO');
  var foto = req.foto ? salvarImagem_(req.foto, 'lance-' + id) : null;
  var r = comLock_(function () {
    var atual = ler_('Eventos').filter(function (x) { return x.ID === id; })[0], agora = String(Date.now());
    var campos = { ID: id, Pessoa: s.pessoa, Dia: e.day, Hora: String(e.t || '').slice(0, 5), Tipo: String(e.kind || '').slice(0, 20),
      Texto: String(e.txt || '').slice(0, 200), Pts: String(Math.max(0, Math.min(500, Number(e.pts) || 0))), Calc: JSON.stringify(e.calc || []).slice(0, 2000),
      Ev: e.ev === 'foto' || e.ev === 'relogio' ? e.ev : '', Extra: extraTxt, Chave: String(e.key || '').slice(0, 30), Atualizado: agora };
    if (foto) campos.Foto = foto;
    else if (e.ev === 'foto' && atual && atual.Foto) campos.Foto = atual.Foto;
    if (e.ev === 'foto' && !campos.Foto && !atual) campos.Ev = ''; // foto não chegou: não vale como evidência
    if (atual) {
      if (atual.Var === 'anulado') throw apiErro_('Este lance foi anulado pelo VAR e não pode mais ser alterado.', 'VAR');
      campos.Excluido = '';
      atualizar_('Eventos', atual._lin, campos);
    } else {
      var p = pessoaPorId_(s.pessoa);
      campos.Time = p ? p.Time : 'A';
      inserir_('Eventos', campos);
    }
    return evParaApp_(ler_('Eventos').filter(function (x) { return x.ID === id; })[0]);
  });
  if (req.gol && typeof avisarGol_ === 'function') avisarGol_(s.pessoa, r, req.gol);
  return { ev: r };
}
function excluirEvento_(s, req) {
  return comLock_(function () {
    var r = ler_('Eventos').filter(function (x) { return x.ID === String(req.id); })[0];
    if (!r) return { ok: true };
    if (r.Pessoa !== s.pessoa) throw apiErro_('Você só pode apagar os seus lances.', 'PERMISSAO');
    if (r.Var === 'anulado') throw apiErro_('Lance anulado pelo VAR fica registrado.', 'VAR');
    atualizar_('Eventos', r._lin, { Excluido: 'sim', Atualizado: String(Date.now()) });
    return { ok: true };
  });
}

/* ------------------------------ VAR ------------------------------ */
function chamarVar_(s, req) {
  var r0 = comLock_(function () {
    var r = ler_('Eventos').filter(function (x) { return x.ID === String(req.id); })[0];
    if (!r) throw apiErro_('Lance não encontrado.', 'VALIDACAO');
    if (r.Pessoa === s.pessoa) throw apiErro_('Você não pode chamar o VAR no seu próprio lance.', 'PERMISSAO');
    if (r.Var) throw apiErro_('O VAR já foi chamado neste lance.', 'VAR');
    if (r.Dia < N_segunda(hoje_())) throw apiErro_('Só dá para contestar lances da rodada atual.', 'VAR');
    var votos = { _em: Date.now(), _por: s.pessoa };
    votos[s.pessoa] = 'anular';
    atualizar_('Eventos', r._lin, { Var: 'aberto', Votos: JSON.stringify(votos), Atualizado: String(Date.now()) });
    resolverVar_(ler_('Eventos').filter(function (x) { return x.ID === r.ID; })[0]);
    return evParaApp_(ler_('Eventos').filter(function (x) { return x.ID === r.ID; })[0]);
  });
  if (typeof avisarVar_ === 'function') avisarVar_(s.pessoa, r0);
  return { ev: r0 };
}
function votarVar_(s, req) {
  return comLock_(function () {
    var r = ler_('Eventos').filter(function (x) { return x.ID === String(req.id); })[0];
    if (!r || r.Var !== 'aberto') throw apiErro_('A votação deste lance já terminou.', 'VAR');
    if (r.Pessoa === s.pessoa) throw apiErro_('Quem fez o lance não vota.', 'PERMISSAO');
    var votos = json_(r.Votos, {}) || {};
    votos[s.pessoa] = req.voto === 'vale' ? 'vale' : 'anular';
    atualizar_('Eventos', r._lin, { Votos: JSON.stringify(votos), Atualizado: String(Date.now()) });
    resolverVar_(ler_('Eventos').filter(function (x) { return x.ID === r.ID; })[0]);
    return { ev: evParaApp_(ler_('Eventos').filter(function (x) { return x.ID === r.ID; })[0]) };
  });
}
/* Maioria absoluta dos votantes possíveis (todos menos o autor) decide. Após 24 h vale a maioria de quem votou; empate mantém. */
function resolverVar_(r) {
  if (!r || r.Var !== 'aberto') return;
  var votos = json_(r.Votos, {}) || {}, n = Math.max(1, pessoasAtivas_().length - 1), an = 0, va = 0;
  Object.keys(votos).forEach(function (k) { if (k.charAt(0) === '_') return; if (votos[k] === 'anular') an++; else if (votos[k] === 'vale') va++; });
  var res = null;
  if (an * 2 > n) res = 'anulado'; else if (va * 2 >= n) res = 'mantido';
  else if (Date.now() - Number(votos._em || 0) > 864e5) res = an > va ? 'anulado' : 'mantido';
  if (res) atualizar_('Eventos', r._lin, { Var: res, Atualizado: String(Date.now()) });
}
function resolverVarsVencidos_() {
  var abertos = ler_('Eventos').filter(function (r) { return r.Var === 'aberto' && Date.now() - Number((json_(r.Votos, {}) || {})._em || 0) > 864e5; });
  if (!abertos.length) return;
  comLock_(function () { ler_('Eventos').filter(function (r) { return r.Var === 'aberto'; }).forEach(resolverVar_); });
}

/* ------------------------------ resenha ------------------------------ */
function postar_(s, req) {
  var texto = String(req.texto || '').trim().slice(0, 500);
  if (!texto && !req.foto) throw apiErro_('Escreva alguma coisa.', 'VALIDACAO');
  var cid = String(req.id || '').replace(/[^A-Za-z0-9_\-]/g, '').slice(0, 40) || String(Date.now());
  var id = s.pessoa + '-' + cid;
  var foto = req.foto ? salvarImagem_(req.foto, 'post-' + id) : '';
  var r = comLock_(function () {
    var ja = ler_('Posts').filter(function (x) { return x.ID === id; })[0];
    if (ja) return postParaApp_(ja);
    var agora = String(Date.now());
    inserir_('Posts', { ID: id, Pessoa: s.pessoa, Ts: agora, Texto: texto, Cena: String(req.cena || '').slice(0, 20), Foto: foto,
      Reacoes: JSON.stringify({ like: [], fire: [] }), Comentarios: '[]', Excluido: '', Atualizado: agora });
    return postParaApp_(ler_('Posts').filter(function (x) { return x.ID === id; })[0]);
  });
  if (typeof avisarResenha_ === 'function') avisarResenha_(s.pessoa, pessoaPorId_(s.pessoa).Nome + ' na resenha', texto || 'Postou uma foto.');
  return { post: r };
}
function reagir_(s, req) {
  return comLock_(function () {
    var r = ler_('Posts').filter(function (x) { return x.ID === String(req.id); })[0];
    if (!r) throw apiErro_('Post não encontrado.', 'VALIDACAO');
    var re = json_(r.Reacoes, { like: [], fire: [] }), tipo = req.tipo === 'fire' ? 'fire' : 'like';
    re[tipo] = re[tipo] || [];
    var i = re[tipo].indexOf(s.pessoa);
    if (i >= 0) re[tipo].splice(i, 1); else re[tipo].push(s.pessoa);
    atualizar_('Posts', r._lin, { Reacoes: JSON.stringify(re), Atualizado: String(Date.now()) });
    return { post: postParaApp_(ler_('Posts').filter(function (x) { return x.ID === r.ID; })[0]) };
  });
}
function comentar_(s, req) {
  var texto = String(req.texto || '').trim().slice(0, 300);
  if (!texto) throw apiErro_('Escreva o comentário.', 'VALIDACAO');
  var out = comLock_(function () {
    var r = ler_('Posts').filter(function (x) { return x.ID === String(req.id); })[0];
    if (!r) throw apiErro_('Post não encontrado.', 'VALIDACAO');
    var c = json_(r.Comentarios, []);
    if (c.length >= 100) throw apiErro_('Este post já tem comentários demais.', 'LIMITE');
    c.push({ who: s.pessoa, txt: texto, ts: Date.now() });
    atualizar_('Posts', r._lin, { Comentarios: JSON.stringify(c), Atualizado: String(Date.now()) });
    return { post: postParaApp_(ler_('Posts').filter(function (x) { return x.ID === r.ID; })[0]), autor: r.Pessoa };
  });
  if (out.autor !== s.pessoa && typeof avisarPessoa_ === 'function') avisarPessoa_(out.autor, 'resenha', { titulo: pessoaPorId_(s.pessoa).Nome + ' comentou', corpo: texto, url: '#racha/resenha', tag: 'coment' });
  return { post: out.post };
}
function excluirPost_(s, req) {
  return comLock_(function () {
    var r = ler_('Posts').filter(function (x) { return x.ID === String(req.id); })[0];
    if (!r) return { ok: true };
    if (r.Pessoa !== s.pessoa) throw apiErro_('Você só pode apagar os seus posts.', 'PERMISSAO');
    atualizar_('Posts', r._lin, { Excluido: 'sim', Atualizado: String(Date.now()) });
    return { ok: true };
  });
}

/* ------------------------------ mano a mano ------------------------------ */
var METRICAS = ['Dias de treino', 'Km corridos', 'Pontos no racha', 'Dias nos macros', 'Dias perfeitos de hábitos', 'Volume levantado'];
function desafiar_(s, req) {
  if (METRICAS.indexOf(req.metrica) < 0) throw apiErro_('Métrica inválida.', 'VALIDACAO');
  var outro = pessoaPorId_(String(req.para));
  if (!outro || outro.Ativo === 'não' || outro.ID === s.pessoa) throw apiErro_('Escolha alguém do grupo.', 'VALIDACAO');
  var dias = [7, 14, 30].indexOf(Number(req.dias)) >= 0 ? Number(req.dias) : 7;
  var r = comLock_(function () {
    var id = 'D' + Date.now(), agora = String(Date.now());
    inserir_('Desafios', { ID: id, De: s.pessoa, Para: outro.ID, Metrica: req.metrica, Dias: String(dias), Inicio: '', Fim: '',
      Aposta: String(req.aposta || 'Só pela resenha').slice(0, 120), Status: 'pendente', CriadoEm: new Date().toISOString(), Atualizado: agora });
    return desafioParaApp_(ler_('Desafios').filter(function (x) { return x.ID === id; })[0]);
  });
  if (typeof avisarPessoa_ === 'function') avisarPessoa_(outro.ID, 'desafios', { titulo: pessoaPorId_(s.pessoa).Nome + ' te desafiou', corpo: req.metrica + ' · ' + dias + ' dias. Aposta: ' + r.bet, url: '#racha/mano', tag: 'desafio' });
  return { desafio: r };
}
function responderDesafio_(s, req) {
  var r = comLock_(function () {
    var d = ler_('Desafios').filter(function (x) { return x.ID === String(req.id); })[0];
    if (!d) throw apiErro_('Desafio não encontrado.', 'VALIDACAO');
    var agora = String(Date.now());
    if (req.cancelar) {
      if (d.De !== s.pessoa && d.Para !== s.pessoa) throw apiErro_('Este desafio não é seu.', 'PERMISSAO');
      atualizar_('Desafios', d._lin, { Status: 'cancelado', Atualizado: agora });
    } else {
      if (d.Para !== s.pessoa) throw apiErro_('Só quem foi desafiado responde.', 'PERMISSAO');
      if (d.Status !== 'pendente') throw apiErro_('Este desafio já foi respondido.', 'VALIDACAO');
      var ini = hoje_();
      atualizar_('Desafios', d._lin, req.aceitar ? { Status: 'ativo', Inicio: ini, Fim: N_somaDias(ini, (Number(d.Dias) || 7) - 1), Atualizado: agora } : { Status: 'recusado', Atualizado: agora });
    }
    return desafioParaApp_(ler_('Desafios').filter(function (x) { return x.ID === d.ID; })[0]);
  });
  if (!req.cancelar && typeof avisarPessoa_ === 'function') avisarPessoa_(r.de, 'desafios', { titulo: pessoaPorId_(s.pessoa).Nome + (req.aceitar ? ' topou o desafio' : ' recusou o desafio'), corpo: r.metric + (req.aceitar ? ' · começa hoje e vai até ' + r.fim.split('-').reverse().slice(0, 2).join('/') : ''), url: '#racha/mano', tag: 'desafio' });
  return { desafio: r };
}

/* ------------------------------ grupo e times ------------------------------ */
function salvarGrupo_(s, req) {
  exigirAdmin_(s);
  return comLock_(function () {
    if (req.regras) {
      var rg = N_regras(req.regras), hab = {};
      Object.keys(rg.hab).forEach(function (k) { if (/^[A-Za-z0-9_]{1,20}$/.test(k)) hab[k] = !!rg.hab[k]; });
      cfgSet_('regras', JSON.stringify({ photo: rg.photo, hab: hab }));
    }
    if (req.nome) cfgSet_('nome_grupo', String(req.nome).slice(0, 30));
    if (req.times) ['A', 'B'].forEach(function (t) {
      var x = req.times[t]; if (!x) return;
      if (x.nome) cfgSet_('time_' + t + '_nome', String(x.nome).slice(0, 24));
      if (x.sigla) cfgSet_('time_' + t + '_sigla', String(x.sigla).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3));
    });
    if (req.novoConvite) cfgSet_('convite', Utilities.getUuid().replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase());
    return { grupo: grupoPublico_() };
  });
}
function sortearTimes_(s, req) {
  exigirAdmin_(s);
  return comLock_(function () {
    var t = req.times || {}, agora = String(Date.now());
    pessoasAtivas_().forEach(function (p) { if (t[p.ID] === 'A' || t[p.ID] === 'B') atualizar_('Pessoas', p._lin, { Time: t[p.ID], Atualizado: agora }); });
    return { pessoas: pessoasAtivas_().map(pessoaPublica_) };
  });
}

/* ------------------------------ fotos (Drive) ------------------------------ */
function pastaFotos_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('PASTA_FOTOS');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recria */ } }
  var p = DriveApp.createFolder('RACHA · fotos do app');
  props.setProperty('PASTA_FOTOS', p.getId());
  return p;
}
function salvarImagem_(dataUrl, nome) {
  var m = String(dataUrl).match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw apiErro_('Foto em formato não suportado.', 'VALIDACAO');
  if (m[2].length > 4 * 1024 * 1024) throw apiErro_('Foto grande demais.', 'VALIDACAO');
  var ext = m[1] === 'image/png' ? 'png' : m[1] === 'image/webp' ? 'webp' : 'jpg';
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nome + '.' + ext);
  return pastaFotos_().createFile(blob).getId();
}
function salvarFotoCard_(s, req) {
  var ids = {};
  ['a', 'b', 'c'].forEach(function (k) { if (req[k]) ids[k] = salvarImagem_(req[k], 'card-' + s.pessoa + '-' + k); });
  if (!ids.a || !ids.b || !ids.c) throw apiErro_('Faltou alguma versão da foto.', 'VALIDACAO');
  return comLock_(function () {
    var p = pessoaPorId_(s.pessoa);
    [p.FotoA, p.FotoB, p.FotoC].forEach(function (old) { if (old) { try { DriveApp.getFileById(old).setTrashed(true); } catch (e) { /* já foi */ } } });
    atualizar_('Pessoas', p._lin, { FotoA: ids.a, FotoB: ids.b, FotoC: ids.c, Atualizado: String(Date.now()) });
    return { foto: ids };
  });
}
function lerFoto_(s, req) {
  var id = String(req.id || '');
  if (!/^[A-Za-z0-9_\-]{10,}$/.test(id)) throw apiErro_('Foto inválida.', 'VALIDACAO');
  var f;
  try { f = DriveApp.getFileById(id); } catch (e) { throw apiErro_('Foto não encontrada.', 'NAOACHOU'); }
  var pasta = pastaFotos_().getId(), dentro = false, ps = f.getParents();
  while (ps.hasNext()) if (ps.next().getId() === pasta) dentro = true;
  if (!dentro) throw apiErro_('Foto não encontrada.', 'NAOACHOU');
  var b = f.getBlob();
  return { id: id, mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
}
