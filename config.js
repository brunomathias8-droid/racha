/*
 * Configuração do RACHA. Só a linha "api" precisa ser preenchida:
 * o endereço /exec da implantação do Apps Script (Implantar › Gerenciar implantações).
 */
window.RACHA_CONFIG = {
  api: 'https://script.google.com/macros/s/AKfycbzjwQKYfrDJdzrDYvSErKn8-fOaieZpYKG1-x020SwEvdLm6AeXT5dDsz8e48HdY0wT/exec',
  intervaloSincSeg: 30,
  // false esconde a aba Racha (placar, liga, mano a mano, resenha) e os atalhos para ela. Nada é apagado: true traz tudo de volta.
  racha: false
};
