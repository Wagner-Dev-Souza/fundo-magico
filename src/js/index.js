document.addEventListener("DOMContentLoaded", function () {
	// Objetivo:
	// Enviar a descrição do usuário para o webhook do n8n, que devolve
	// HTML + CSS gerados por IA. O CSS é aplicado na página (fundo mágico),
	// o HTML vai para o preview e ambos aparecem nas caixas de código.

	// ---------------------------------------------------------------------
	// Configuração
	// ---------------------------------------------------------------------

	// URL do webhook: vem de `src/js/config.js` (não versionado).
	// Copie `src/js/config.example.js` para `config.js` e preencha com a sua URL.
	const WEBHOOK_URL = (window.APP_CONFIG && window.APP_CONFIG.WEBHOOK_URL) || "";

	// Tempo máximo de espera pela resposta da IA (ms). Evita que a interface
	// fique travada para sempre quando o workflow demora ou não responde.
	const REQUEST_TIMEOUT_MS = 60000;

	const form = document.querySelector(".form-group");
	const input = document.getElementById("description");
	const htmlCode = document.getElementById("html-code");
	const cssCode = document.getElementById("css-code");
	const preview = document.getElementById("preview-section");
	const statusEl = document.getElementById("status-message");
	const generateBtn = document.getElementById("generate-btn");
	const btnText = document.getElementById("btn-text");
	const copyHtmlBtn = document.getElementById("copy-html");
	const copyCssBtn = document.getElementById("copy-css");

	const STYLE_TAG_ID = "dynamic-style";

	// Sem configuração a geração não funciona: avisa na tela e bloqueia o botão,
	// em vez de deixar o usuário clicar e receber um erro genérico de rede.
	if (!WEBHOOK_URL || WEBHOOK_URL.indexOf("http") !== 0) {
		setStatus("Configure a URL do webhook em src/js/config.js (copie o config.example.js).", "error");
		if (generateBtn) {
			generateBtn.disabled = true;
		}
	}

	// ---------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------

	/** Remove <script> de HTML gerado por IA antes de injetar na página. */
	function sanitizeHtml(html) {
		if (!html) {
			return "";
		}
		return html.replace(/<script[\s\S]*?<\/script>/gi, "");
	}

	/**
	 * Extrai { code, style } dos formatos mais comuns devolvidos pelo n8n.
	 * Aceita:
	 *   1) { code, style }                (contrato documentado)
	 *   2) { html, css }                  (nomes alternativos)
	 *   3) [ { ... } ]                    (saída padrão de Webhook no n8n)
	 *   4) { data: { ... } }              (resposta embrulhada)
	 *   5) string contendo JSON
	 * Retorna null quando não há nada aproveitável.
	 */
	function parsePayload(raw) {
		let data = raw;

		if (typeof data === "string") {
			try {
				data = JSON.parse(data);
			} catch (error) {
				return null;
			}
		}

		// Webhook do n8n costuma devolver um array com um item.
		if (Array.isArray(data)) {
			data = data[0];
		}

		// Alguns workflows embrulham o resultado em { data: ... }.
		if (
			data &&
			typeof data === "object" &&
			typeof data.data === "object" &&
			data.data !== null &&
			!data.code &&
			!data.html
		) {
			data = data.data;
		}

		if (!data || typeof data !== "object") {
			return null;
		}

		const code = data.code || data.html || "";
		const style = data.style || data.css || "";

		if (!code && !style) {
			return null;
		}

		return { code: code, style: style };
	}

	/** Mostra uma mensagem de status para o usuário. type: "info" | "error" | "success" */
	function setStatus(message, type) {
		if (!statusEl) {
			return;
		}
		statusEl.textContent = message || "";
		statusEl.className = "status" + (type ? " status--" + type : "");
	}

	/** Liga/desliga o estado de carregamento do formulário. */
	function setLoading(isLoading) {
		if (generateBtn) {
			generateBtn.disabled = isLoading;
			generateBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
		}
		if (btnText) {
			btnText.textContent = isLoading ? "Gerando Background..." : "Gerar Background Mágico";
		}
	}

	/** Injetar (ou substituir) a tag <style> com o CSS gerado. */
	function applyStyle(style) {
		let styleTag = document.getElementById(STYLE_TAG_ID);

		if (styleTag) {
			styleTag.remove();
		}

		if (!style) {
			return;
		}

		styleTag = document.createElement("style");
		styleTag.id = STYLE_TAG_ID;
		styleTag.textContent = style;
		document.head.appendChild(styleTag);
	}

	/** Remove o fundo gerado anteriormente e limpa o preview. */
	function clearResult() {
		applyStyle("");
		preview.innerHTML = "";
		preview.style.display = "none";
	}

	/** Copia o conteúdo de um elemento para a área de transferência. */
	async function copyToClipboard(element, button) {
		if (!element || !element.textContent) {
			return;
		}
		try {
			await navigator.clipboard.writeText(element.textContent);
			const original = button.textContent;
			button.textContent = "Copiado!";
			setTimeout(function () {
				button.textContent = original;
			}, 1500);
		} catch (error) {
			console.error("Não foi possível copiar:", error);
		}
	}

	if (copyHtmlBtn) {
		copyHtmlBtn.addEventListener("click", function () {
			copyToClipboard(htmlCode, copyHtmlBtn);
		});
	}

	if (copyCssBtn) {
		copyCssBtn.addEventListener("click", function () {
			copyToClipboard(cssCode, copyCssBtn);
		});
	}

	// ---------------------------------------------------------------------
	// Fluxo principal
	// ---------------------------------------------------------------------

	form.addEventListener("submit", async function (event) {
		event.preventDefault();

		const description = input.value.trim();

		if (!description) {
			setStatus("Descreva o background que você deseja antes de gerar.", "error");
			input.focus();
			return;
		}

		setLoading(true);
		setStatus("Gerando seu background mágico... isso pode levar alguns segundos.", "info");
		clearResult();

		// Timeout: aborta a requisição se o workflow não responder a tempo.
		const controller = new AbortController();
		const timeoutId = setTimeout(function () {
			controller.abort();
		}, REQUEST_TIMEOUT_MS);

		try {
			const response = await fetch(WEBHOOK_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ description: description }),
				signal: controller.signal,
			});

			// Bug corrigido: sem esta checagem, respostas de erro (ex.: 500 do
			// n8n) eram tratadas como sucesso e a página ficava vazia sem aviso.
			if (!response.ok) {
				throw new Error("O servidor respondeu com erro HTTP " + response.status + ".");
			}

			const data = await response.json();
			const result = parsePayload(data);

			if (!result) {
				throw new Error("A resposta do servidor não contém HTML/CSS no formato esperado.");
			}

			// Exibe o código gerado.
			htmlCode.textContent = result.code;
			cssCode.textContent = result.style;

			// Renderiza o preview (sem <script>, por segurança).
			preview.innerHTML = sanitizeHtml(result.code);
			preview.style.display = "block";

			// Aplica o CSS gerado no documento.
			applyStyle(result.style);

			setStatus("Background gerado com sucesso!", "success");
		} catch (error) {
			// Mantém a página consistente: o fundo antigo não fica preso na tela.
			clearResult();
			htmlCode.textContent = "";
			cssCode.textContent = "";

			if (error.name === "AbortError") {
				setStatus("A geração demorou demais e foi cancelada. Tente novamente.", "error");
			} else if (error instanceof TypeError) {
				// Falha de rede / CORS / servidor inacessível.
				setStatus("Não foi possível conectar ao servidor. Verifique sua conexão.", "error");
			} else {
				setStatus("Não foi possível gerar o background: " + error.message, "error");
			}

			console.error("Erro ao gerar o fundo mágico:", error);
		} finally {
			clearTimeout(timeoutId);
			setLoading(false);
		}
	});
});
