/**
 * Estrutura da página.
 *
 * Verifica o estado inicial da interface: os campos de entrada existem, o botão
 * está liberado (a configuração foi preparada antes do teste) e o resultado
 * começa vazio e escondido.
 */
const { interceptarConfig } = require('../support/configuracao');

describe('Página do Fundo Mágico', () => {
  beforeEach(() => {
    interceptarConfig();
    cy.visit('/');
  });

  it('carrega com o título correto', () => {
    cy.title().should('include', 'Fundo Mágico');
  });

  it('exibe o campo de descrição vazio', () => {
    cy.get('#description')
      .should('be.visible')
      .and('be.enabled')
      .and('have.value', '');
  });

  it('exibe o botão de gerar habilitado, com o texto esperado', () => {
    cy.get('#generate-btn').should('be.visible').and('not.be.disabled');
    cy.get('#btn-text').should('have.text', 'Gerar Background Mágico');
  });

  it('começa sem mensagem de status', () => {
    cy.get('#status-message').should('be.empty');
  });

  it('começa com a área de prévia escondida', () => {
    cy.get('#preview-section').should('not.be.visible');
  });

  it('exibe as saídas de código e os botões de copiar', () => {
    cy.get('#html-code').should('exist');
    cy.get('#css-code').should('exist');
    cy.get('#copy-html').should('exist');
    cy.get('#copy-css').should('exist');
  });
});
