# Olympos L2 — Home

Protótipo responsivo em HTML, CSS e JavaScript sem dependências de build. As imagens enviadas foram recortadas e otimizadas em WebP dentro de `assets/`; o cenário, a arte da Rainha do Gelo e as crônicas se movem suavemente conforme a rolagem. A animação respeita a preferência do sistema por movimento reduzido.

O logo está em `assets/olympos-logo.svg`: lettering próprio de Olympos, com serifas clássicas inspirado pela direção visual de fantasia épica, sem reutilizar o lettering oficial de Lineage II.

O conteúdo e os números apresentados são **dados de demonstração**, mantidos em `data/demo-data.js`; eles não representam um servidor real.

## Abrir

Abra `index.html` em um navegador. Como o JavaScript usa módulos ES, em alguns navegadores será necessário servir a pasta localmente (por exemplo, com a extensão Live Server do VS Code ou `python -m http.server` dentro desta pasta).

## Integração futura

`api.js` contém um adaptador inicial e os endpoints esperados (`/api/home`, `/api/server/status`, `/api/rankings/pvp`, `/api/epic-bosses`, `/api/events`, `/api/news`). O módulo `app.js` mantém a apresentação e os dados desacoplados; quando a API estiver pronta, mapeie sua resposta ao formato de `data/demo-data.js` e defina `window.OLYMPOS_API_URL` antes de carregar o app.

Para conectar Mobius High Five e MariaDB, um serviço separado deverá fazer a leitura do banco, agregar as informações públicas e servi-las por esses endpoints. Credenciais do MariaDB não pertencem ao navegador.

Cadastro, cliente de jogo e links de comunidade são botões de demonstração e exibem uma mensagem de disponibilidade futura.

## Doações

A Home contém uma área informativa de doações, mas **não aceita pagamentos**. Os pacotes e valores serão anunciados no lançamento. A área só deve ser ativada depois de configurar o checkout do lado do servidor e concluir a integração autenticada com a revisão Mobius usada no dedicado.

Consulte [`docs/donations.md`](docs/donations.md) para o desenho de segurança, estados do pedido e passos de ativação. Nenhum segredo de pagamento ou credencial MariaDB deve ser incluído no site ou no repositório.

