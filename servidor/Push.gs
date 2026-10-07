/**
 * Push.gs — notificações no celular (Web Push pelo Firebase Cloud Messaging). Mesmo esquema do RM.
 * O servidor decide QUANDO avisar; o app só pede permissão, registra o aparelho e escolhe os tipos.
 * No iPhone, só funciona com o app instalado na tela de início (iOS 16.4 ou mais novo).
 *
 * Configuração (uma vez; dá para reaproveitar o projeto Firebase do RM):
 *   Config › firebase_web_config      bloco firebaseConfig do console do Firebase
 *   Config › firebase_vapid_key       chave do par "Web Push certificates" (Cloud Messaging)
 *   Config › firebase_service_account conteúdo do JSON da conta de serviço (vai para as Propriedades do script e a célula é limpa)
 * Depois rodar ativarAvisos() uma vez (cria o gatilho de hora em hora).
 */
var PUSH_TIPOS = {
  gols: 'Gol no clássico (seu time ou o rival)',
  var: 'VAR chamado: o grupo precisa votar',
  desafios: 'Desafio recebido, aceito ou recusado',
  treino: 'Treino do dia, às 7h',
  habitos: 'Hábitos pendentes, às 21h',
  placar: 'Placar da rodada, domingo às 19h',
  resenha: 'Posts e comentários na resenha'
};
var PUSH_PADRAO = ['gols', 'var', 'desafios', 'treino', 'habitos', 'placar'];

/* ------------------------------ configuração ------------------------------ */
function pushWebConfig_() {
  var t = String(cfg_().firebase_web_config || '').trim();
  if (!t) return null;
  var m = t.match(/\{[\s\S]*\}/);
  if (!m) return null;
  var s = m[0].replace(/\/\/[^\n]*/g, '').replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,\s*\}/g, '}');
  try { var o = JSON.parse(s); return o.apiKey && o.projectId && o.messagingSenderId && o.appId ? o : null; } catch (e) { return null; }
}
function pushContaServico_() {
  var props = PropertiesService.getScriptProperties(), c = cfg_();
  var v = String(c.firebase_service_account || '').trim();
  if (v && v.charAt(0) === '{') {
    var j = pushLerConta_(v);
    if (j) { props.setProperty('FCM_SERVICE_ACCOUNT', JSON.stringify(j)); cfgSet_('firebase_service_account', '(guardada nas Propriedades do script)'); }
  }
  var p = props.getProperty('FCM_SERVICE_ACCOUNT');
  return p ? pushLerConta_(p) : null;
}
function pushLerConta_(txt) {
  try { var j = JSON.parse(String(txt).trim()); return j.client_email && j.private_key && j.project_id ? j : null; } catch (e) { return null; }
}
function pushStatus_() {
  var web = pushWebConfig_(), sa = pushContaServico_(), vapid = String(cfg_().firebase_vapid_key || '').trim(), falta = [];
  if (!web) falta.push('firebase_web_config');
  if (!vapid) falta.push('firebase_vapid_key');
  if (!sa) falta.push('firebase_service_account');
  return { ativo: !falta.length, falta: falta, web: web, vapid: vapid, sa: sa };
}

/* ------------------------------ API (chamada pelo Api.gs) ------------------------------ */
function pushApi_(acao, sessao, req) {
  if (acao === 'pushConfig') {
    var st = pushStatus_();
    return { ativo: st.ativo, falta: st.falta, webConfig: st.web, vapidKey: st.vapid, tipos: PUSH_TIPOS, padrao: PUSH_PADRAO };
  }
  var tok = String(req.token_push || '');
  if (tok.length < 20 || tok.length > 4096) throw apiErro_('Endereço de notificação inválido.', 'VALIDACAO');
  if (acao === 'registrarPush') return { tipos: comLock_(function () { return pushGravar_(tok, sessao.pessoa, req.plataforma, req.tipos); }) };
  if (acao === 'preferenciasPush') return { tipos: comLock_(function () { return pushGravar_(tok, sessao.pessoa, null, req.tipos); }) };
  if (acao === 'removerPush') { comLock_(function () { pushDesativar_(tok, 'removido no aparelho'); }); return { ok: true }; }
  if (acao === 'testarPush') {
    var r = pushEnviar_(tok, { titulo: 'RACHA · teste', corpo: 'As notificações estão funcionando neste aparelho.', url: '#hoje', tag: 'teste' });
    if (!r.ok) throw apiErro_('O Firebase recusou o envio: ' + r.erro, 'EXTERNO');
    return { ok: true };
  }
  throw apiErro_('Ação desconhecida.', 'ACAO');
}

function pushGravar_(tok, pessoa, plataforma, tipos) {
  var validos = (Array.isArray(tipos) ? tipos : PUSH_PADRAO).filter(function (t) { return PUSH_TIPOS[t]; });
  var agora = new Date().toISOString(), atual = ler_('Push').filter(function (r) { return r.Token === tok; })[0];
  if (atual) atualizar_('Push', atual._lin, { Pessoa: pessoa, Plataforma: plataforma || atual.Plataforma, Tipos: validos.join(','), AtualizadoEm: agora, Ativo: 'sim', UltimoErro: '' });
  else inserir_('Push', { Token: tok, Pessoa: pessoa, Plataforma: String(plataforma || '').slice(0, 30), Tipos: validos.join(','), CriadoEm: agora, AtualizadoEm: agora, Ativo: 'sim', UltimoErro: '' });
  return validos;
}
function pushDesativar_(tok, motivo) {
  ler_('Push').forEach(function (r) { if (r.Token === tok) atualizar_('Push', r._lin, { Ativo: 'não', UltimoErro: String(motivo || '').slice(0, 200) }); });
}
function pushAparelhos_(pessoa, tipo) {
  return ler_('Push').filter(function (r) { return r.Ativo === 'sim' && r.Pessoa === pessoa && String(r.Tipos).split(',').indexOf(tipo) >= 0; }).map(function (r) { return r.Token; });
}

/* ------------------------------ envio (FCM HTTP v1) ------------------------------ */
function pushAcesso_(sa) {
  var cache = CacheService.getScriptCache(), c = cache.get('fcm_acesso');
  if (c) return c;
  var b64 = function (s) { return Utilities.base64EncodeWebSafe(s).replace(/=+$/, ''); };
  var agora = Math.floor(Date.now() / 1000);
  var cab = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var corpo = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: agora, exp: agora + 3600 }));
  var ass = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(cab + '.' + corpo, sa.private_key)).replace(/=+$/, '');
  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', { method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: cab + '.' + corpo + '.' + ass } });
  if (r.getResponseCode() !== 200) throw new Error('Google não liberou o acesso ao Firebase (' + r.getResponseCode() + '): ' + r.getContentText().slice(0, 200));
  var tok = JSON.parse(r.getContentText()).access_token;
  cache.put('fcm_acesso', tok, 3000);
  return tok;
}
/** Envia para um aparelho. Devolve { ok, erro }. Endereço inválido ou desinstalado é desativado. */
function pushEnviar_(tok, msg) {
  var sa = pushContaServico_();
  if (!sa) return { ok: false, erro: 'conta de serviço do Firebase não configurada' };
  try {
    var r = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + sa.project_id + '/messages:send', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + pushAcesso_(sa) },
      payload: JSON.stringify({ message: { token: tok,
        data: { titulo: String(msg.titulo || 'RACHA'), corpo: String(msg.corpo || ''), url: String(msg.url || '#hoje'), tag: String(msg.tag || '') },
        webpush: { headers: { Urgency: 'high', TTL: '43200' } } } })
    });
    var code = r.getResponseCode();
    if (code === 200) return { ok: true };
    var txt = r.getContentText().slice(0, 300);
    if (code === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(txt)) comLock_(function () { pushDesativar_(tok, txt); });
    return { ok: false, erro: code + ' ' + txt };
  } catch (e) { return { ok: false, erro: String(e.message || e) }; }
}

/* ------------------------------ avisos na hora (gol, VAR, desafio, resenha) ------------------------------ */
function silencio_() { var h = horaAgora_(); return h >= 23 || h < 7; }
function avisarPessoa_(pessoa, tipo, msg) {
  try {
    if (!pushStatus_().ativo || silencio_()) return 0;
    var n = 0;
    pushAparelhos_(pessoa, tipo).forEach(function (t) { if (pushEnviar_(t, msg).ok) n++; });
    return n;
  } catch (e) { Logger.log('aviso ' + tipo + ': ' + e); return 0; }
}
function avisarGrupo_(exceto, tipo, msg) {
  pessoasAtivas_().forEach(function (p) { if (exceto.indexOf(p.ID) < 0) avisarPessoa_(p.ID, tipo, msg); });
}
function nomeTime_(t) { var c = cfg_(); return c['time_' + t + '_nome'] || 'Time ' + t; }
function siglaTime_(t) { var c = cfg_(); return c['time_' + t + '_sigla'] || t; }
function avisarGol_(autor, ev, gol) {
  var t = gol.time === 'B' ? 'B' : 'A', p = pessoaPorId_(autor), pl = gol.placar || {};
  avisarGrupo_([autor], 'gols', { titulo: 'GOOOL do ' + nomeTime_(t) + '!', corpo: p.Nome + ': ' + ev.txt + '. ' + siglaTime_('A') + ' ' + (pl.A || 0) + ' × ' + (pl.B || 0) + ' ' + siglaTime_('B'), url: '#racha/classico', tag: 'gol' });
}
function avisarVar_(quem, ev) {
  var p = pessoaPorId_(quem), dono = pessoaPorId_(ev.who);
  avisarGrupo_([quem, ev.who], 'var', { titulo: 'VAR chamado por ' + p.Nome, corpo: 'Lance de ' + dono.Nome + ': ' + ev.txt + '. Vale ou anula? Vote em até 24 h.', url: '#racha/classico', tag: 'var-' + ev.id });
  avisarPessoa_(ev.who, 'var', { titulo: 'Seu lance foi pro VAR', corpo: p.Nome + ' contestou: ' + ev.txt + '. O grupo vai votar.', url: '#racha/classico', tag: 'var-' + ev.id });
}
function avisarResenha_(autor, titulo, corpo) { avisarGrupo_([autor], 'resenha', { titulo: titulo, corpo: corpo, url: '#racha/resenha', tag: 'resenha' }); }

/* ------------------------------ avisos programados ------------------------------ */
var DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Gatilho de hora em hora. Cada aviso sai uma vez por dia (marca nas Propriedades do script). */
function verificarAvisos() {
  _cache = {}; _cfg = null;
  resolverVarsVencidos_();
  if (!pushStatus_().ativo) return;
  var hoje = hoje_(), hora = horaAgora_(), dow = N_dataObj(hoje).getDay(), props = PropertiesService.getScriptProperties();
  var feito = function (k) { var c = 'AV_' + k + '_' + hoje; if (props.getProperty(c)) return true; props.setProperty(c, '1'); return false; };
  var estadoDe = function (id) { return json_(lerEstado_(id).json, null); };

  if (hora === 7 && !feito('treino')) pessoasAtivas_().forEach(function (p) {
    var st = estadoDe(p.ID); if (!st || !Array.isArray(st.week)) return;
    var d = st.week.filter(function (w) { return w.d === DIAS_ABREV[dow]; })[0];
    if (!d || d.type === 'rest') return;
    var pts = d.type === 'musc' ? 50 : 35;
    avisarPessoa_(p.ID, 'treino', { titulo: 'Hoje: ' + d.title, corpo: 'Vale +' + pts + ' pts pro ' + nomeTime_(p.Time) + '.' + (d.note ? ' ' + d.note : ''), url: '#treino', tag: 'treino' });
  });

  if (hora === 21 && !feito('habitos')) pessoasAtivas_().forEach(function (p) {
    var st = estadoDe(p.ID); if (!st || !Array.isArray(st.habits) || !st.habits.length) return;
    var pend = st.habits.filter(function (h) { return st.day !== hoje || !(h.type === 'count' ? h.val >= h.target : h.val); });
    if (!pend.length) return;
    var nomes = pend.slice(0, 3).map(function (h) { return String(h.name).split(' ·')[0]; }).join(', ') + (pend.length > 3 ? ' e mais ' + (pend.length - 3) : '');
    avisarPessoa_(p.ID, 'habitos', { titulo: pend.length === 1 ? 'Falta 1 hábito hoje' : 'Faltam ' + pend.length + ' hábitos hoje', corpo: nomes + '. Dia perfeito vale +15 pts.', url: '#habitos', tag: 'habitos' });
  });

  if (dow === 0 && hora === 19 && !feito('placar')) {
    var seg = N_segunda(hoje), evs = ler_('Eventos').filter(function (r) { return r.Dia >= seg && r.Excluido !== 'sim'; }).map(evParaApp_);
    var pl = N_placar(evs, regras_(), seg), c = cfg_();
    var lider = pl.A === pl.B ? 'Empatado. Um treino hoje decide.' : (pl.A > pl.B ? nomeTime_('A') : nomeTime_('B')) + ' na frente. Fecha às 23:59.';
    pessoasAtivas_().forEach(function (p) {
      avisarPessoa_(p.ID, 'placar', { titulo: 'Rodada fecha hoje: ' + siglaTime_('A') + ' ' + pl.A + ' × ' + pl.B + ' ' + siglaTime_('B'), corpo: lider, url: '#racha/classico', tag: 'placar' });
    });
  }
  if (hora === 3) {
    var lim = N_somaDias(hoje, -10), todas = props.getProperties();
    Object.keys(todas).forEach(function (k) { if (k.indexOf('AV_') === 0 && k.slice(-10) < lim) props.deleteProperty(k); });
  }
}

/** Rodar uma vez no editor: confere a configuração e cria o gatilho de hora em hora. */
function ativarAvisos() {
  var st = pushStatus_();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'verificarAvisos') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('verificarAvisos').timeBased().everyHours(1).create();
  aba_('Push');
  var msg = st.ativo ? 'Avisos ativados. Agora, no app: Perfil › Notificações › Ativar.' : 'Gatilho criado, mas falta preencher na aba Config: ' + st.falta.join(', ');
  Logger.log(msg);
  return msg;
}

/** Para testar no editor: manda um aviso a todos os aparelhos ativos. */
function testarAvisos() {
  var ok = 0;
  ler_('Push').forEach(function (r) { if (r.Ativo === 'sim' && pushEnviar_(r.Token, { titulo: 'RACHA · teste', corpo: 'Aviso de teste enviado pelo editor.', url: '#hoje', tag: 'teste' }).ok) ok++; });
  Logger.log('Avisos enviados: ' + ok);
  return ok;
}
