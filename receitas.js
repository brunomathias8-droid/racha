/* receitas.js — receitas vêm do servidor do grupo (arquivo Receitas.gs, privado, fora deste repositório público).
   Ficam guardadas no aparelho depois da primeira carga. */
'use strict';
const KBIC = { 'Café salgado': 'cup', 'Café doce': 'pancake', 'Proteína': 'drum', 'Prato completo': 'bowl', 'Acompanhamento': 'bowl', 'Lanche salgado': 'burger', 'Lanche doce': 'pancake' };
let RECIPES = [];
function usarReceitas(kb) { RECIPES = (kb || []).map(r => ({ ...r, ic: KBIC[r.grp] || 'bowl', src: `200 Receitas pra Secar · p. ${r.pg}`, time: r.x ? 'Express' : '', steps: r.st || r.steps || [] })); }
async function carregarReceitas() {
  const c = await idb.get('kv', 'receitas').catch(() => null);
  if (c && c.kb) usarReceitas(c.kb);
  if (!S.sessao || !navigator.onLine || (c && c.dia === hoje() && c.kb && c.kb.length)) return;
  try { const r = await api('receitas', {}); if (r.kb && r.kb.length) { usarReceitas(r.kb); idb.set('kv', 'receitas', { kb: r.kb, dia: hoje() }).catch(() => { }); if (S.tab === 'dieta' || S.tab === 'hoje') render(); } } catch (e) { /* tenta de novo depois */ }
}
function plu(label, n) { if (n <= 1) return label; const m = String(label).match(/^(\S+)(.*)$/); if (!m) return label;
  const P = { 'porção': 'porções', 'fatia': 'fatias', 'unidade': 'unidades', 'bife': 'bifes', 'batata': 'batatas', 'lanche': 'lanches', 'colher': 'colheres' }; return (P[m[1]] || m[1]) + m[2]; }
