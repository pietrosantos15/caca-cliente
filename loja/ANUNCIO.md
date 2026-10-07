# Garimpo Local — dados para a Chrome Web Store

**Nome:** Garimpo Local — leads do Google Maps
**Categoria:** Produtividade (ferramentas)
**Idioma:** Português (Brasil)

**Descrição curta (máx. 132):**
Encontre empresas sem site no Google Maps e chame no WhatsApp. Roda no seu navegador, sem servidor.

**Descrição detalhada:**
O Garimpo Local lê a lista de resultados do Google Maps que você mesmo abriu e organiza as empresas em um painel lateral, separando quem ainda não tem site (leads quentes) de quem já tem.

O que ele faz
• Coleta nome, categoria, endereço, telefone, site, nota e avaliações das empresas da pesquisa aberta no Maps.
• Classifica cada empresa como quente, morna ou fria, com uma pontuação simples e transparente.
• Monta o link do WhatsApp com uma mensagem pronta para cada tipo de negócio (32 nichos).
• Atalho para o perfil do Instagram de cada negócio, para contatos que não respondem no WhatsApp.
• Acompanha cada contato: etapa (novo, contactado, respondeu, reunião, fechado), anotações e filtros.
• Fila por bairro para cobrir uma cidade inteira, com pausas entre as pesquisas.
• Exporta em CSV e faz backup/restauração.

Privacidade
Tudo roda no seu navegador. Nenhum dado é enviado a servidores. Os leads ficam no armazenamento local da extensão e você pode apagá-los quando quiser.

Uso responsável
Use apenas informações comerciais públicas de empresas, respeite a LGPD, os termos do Google Maps e as regras do WhatsApp. Evite muitas buscas seguidas.

**Finalidade única (campo "single purpose"):**
Ler os resultados do Google Maps abertos pelo usuário e organizá-los como lista de contatos comerciais (leads) em um painel lateral.

**Justificativa das permissões:**
- Acesso a google.com/maps e google.com.br/maps: necessário para ler a lista de resultados que o usuário abriu. Não acessa nenhum outro site.
- storage: guardar localmente os leads, anotações e configurações do usuário.
- sidePanel: exibir o painel de leads ao lado do Maps.
- Código remoto: não usa. Todo o código está no pacote.

**Práticas de privacidade (formulário do painel):**
- Dados coletados: "Informações de localização/endereço comercial e contato de empresas" exibidas no Maps; marque que NÃO são dados pessoais do usuário e que ficam só no dispositivo.
- Não vende dados, não usa para fins alheios à finalidade única, não usa para crédito/empréstimo.
- URL da política de privacidade: https://caca-cliente-lac.vercel.app/privacidade.html (confirme que abre depois do deploy; se a URL da Vercel for outra, use a dela).

**Arquivos nesta pasta:** `1-leads.png`, `2-whatsapp.png` (capturas 1280×800), `promo-440x280.png` (imagem promocional pequena).
Pacote para enviar: `garimpo-extensao-loja.zip` (sem README e sem testes).
