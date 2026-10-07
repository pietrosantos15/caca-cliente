# Garimpo Local — extensão do Chrome

Coleta empresas do **Google Maps** que você abriu, separa as **sem site** (leads quentes) e monta o link do WhatsApp com a mensagem do nicho. Roda 100% no seu navegador: sem servidor, sem API key, sem "servidor ocupado".

## Instalar (uma vez)
1. Baixe/clone esta pasta `extensao`.
2. No Chrome, abra `chrome://extensions` e ligue **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** e escolha a pasta `extensao`.
4. Fixe o ícone ⛏️ na barra. Ao clicar nele abre o painel lateral.

## Usar
1. Escolha o **nicho** e a **cidade** e clique em **🔎 Abrir no Maps** (ou pesquise você mesmo no Google Maps, ex.: “dentista em Sorocaba”).
2. Com a lista de resultados aberta, clique em **▶ Coletar esta pesquisa**. A extensão rola a lista, abre cada ficha, lê telefone/site/endereço e volta. (Modo *Rápido*: só lê a lista, sem abrir as fichas.)
3. Os leads aparecem no painel, ordenados por temperatura: 🔥 sem site e com telefone, 🌤️ site simples/sem contato, ❄️ já tem site.
4. **WhatsApp** abre a conversa com a mensagem pronta; **Instagram** abre o perfil do negócio (se o Maps mostrar), ou a busca pelo nome. Se você achar o @ do perfil, cole no campo do card e o botão passa a abrir direto; **Etapa** e **Anotações** acompanham a negociação; **CSV** exporta; **Backup/Restaurar** guarda e recupera tudo.

### Cobrir uma cidade inteira
O Maps mostra no máximo ~120 resultados por pesquisa. Em *Opções e fila por bairro* escreva um bairro por linha e clique em **Rodar fila de bairros**: a extensão pesquisa “nicho em bairro, cidade” uma a uma, com pausa entre elas.

## Pontuação (igual ao Garimpo Local)
Base 20 · telefone +25 · celular +15 · sem site/só rede social +30 · site simples (Linktree, negocio.site…) +10 · site próprio −40 · 5+ avaliações +5. **Quente ≥ 70**, morno ≥ 45, frio abaixo.

## Cuidados
- Os termos do Google proíbem coleta automática. Para uso pessoal e em pouco volume o risco é baixo, mas muitas buscas seguidas podem gerar captcha ou bloqueio temporário. Use a fila com calma.
- “Sem site” = o Maps não mostra site na ficha. Confirme no Google/Instagram antes de abordar.
- Se o Google mudar o layout do Maps, os seletores em `content.js` podem precisar de ajuste. O botão **🩺 Diagnóstico** mostra o que a extensão enxerga na página.
- Mensagens em massa no WhatsApp podem levar a bloqueio do número: envie aos poucos e personalize. Siga a LGPD (só dados comerciais de empresas).
- Os dados ficam no armazenamento local da extensão (`chrome.storage.local`), neste navegador. Faça backup de vez em quando.

## Arquivos
`manifest.json` (MV3) · `content.js` (lê o Maps) · `panel.html/css/js` (painel lateral) · `lib.js` (telefone, site, pontuação, CSV) · `templates.js` (mensagens por nicho, gerado do app Garimpo Local).
