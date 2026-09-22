/**
 * Configuração injetada nos testes.
 *
 * A URL do webhook vive em `src/js/config.js`, que não é versionado (é
 * configuração de ambiente). Em vez de depender do arquivo local — que aponta
 * para o servidor real — os testes **interceptam o próprio config.js** e
 * respondem com um endereço de teste.
 *
 * Vantagens: a suíte roda igual em qualquer máquina e no pipeline, sem criar
 * arquivo nenhum, e nenhuma requisição sai para a internet.
 */
const URL_WEBHOOK_TESTE = 'http://localhost:9099/webhook/teste';

const interceptarConfig = () => {
  cy.intercept('GET', '**/src/js/config.js', {
    statusCode: 200,
    headers: { 'content-type': 'application/javascript' },
    body: `window.APP_CONFIG = { WEBHOOK_URL: "${URL_WEBHOOK_TESTE}" };`
  });
};

// Importado pelos spec files (CommonJS, sem precisar de support file).
module.exports = { URL_WEBHOOK_TESTE, interceptarConfig };
