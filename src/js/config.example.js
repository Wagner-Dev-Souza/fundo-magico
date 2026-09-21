/* ==========================================================================
   Fundo Mágico — modelo de configuração
   --------------------------------------------------------------------------
   COMO USAR
   1. Copie este arquivo para `config.js` (mesma pasta).
   2. Cole a URL do seu webhook no lugar do texto abaixo.
   3. O `config.js` está no .gitignore: ele é seu, e não vai para o repositório.

   O arquivo é carregado pelo index.html antes do index.js, e expõe a
   configuração em window.APP_CONFIG.
   ========================================================================== */

window.APP_CONFIG = {
  /* URL do webhook que recebe { description } e devolve { code, style }. */
  WEBHOOK_URL: "COLE_AQUI_A_URL_DO_SEU_WEBHOOK"
};
