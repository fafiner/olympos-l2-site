# Sistema de doações — plano de implementação

## Estado atual

A Home apresenta a futura área de ouro/doações e informa que os preços serão anunciados em 07/11/2026 às 22:00 (Portugal). O checkout está desativado. Não há cobrança, pacote com preço, endpoint de pagamento ou crédito de ouro no site.

## Arquitetura proposta

1. **Site estático (Cloudflare Pages):** mostra os pacotes publicados pelo backend, inicia o checkout e consulta o estado de um pedido. Nunca recebe nem guarda credenciais do jogo ou tokens do provedor.
2. **API no servidor (Cloudflare Pages Functions/Workers):** cria pedidos apenas a partir de pacotes configurados no servidor, integra Mercado Pago e recebe webhooks. Segredos ficam em Cloudflare Secrets.
3. **Livro de pedidos separado do banco do jogo:** guarda o pedido, provedor, valor/moeda, pacote, estado, eventos de webhook e uma fila de entregas. Não expor MariaDB do jogo para a Internet nem aceitar writes diretos do navegador.
4. **Ponte do Mobius, após instalar o dedicado:** o servidor do jogo consulta a fila via HTTPS com credencial própria e entrega o saldo usando APIs internas da revisão Mobius. Entrega online é aplicada pelo processo do jogo; offline permanece numa fila persistente. A ponte confirma a entrega por identificador idempotente.

## Fluxo de segurança

- A conta/personagem será vinculada por um código aleatório, curto e de uso único, gerado dentro do jogo. O site não deve solicitar a senha da conta.
- O backend valida o identificador do pacote, preço e moeda; ignora qualquer quantidade de ouro ou preço enviado pelo navegador.
- A página de retorno do checkout serve apenas para informar o jogador. Ela não aprova pedido.
- No webhook, validar a assinatura oficial do provedor; consultar o pagamento diretamente pela API do provedor; conferir estado final aprovado, moeda, valor, referência externa e recebedor esperado.
- Registrar identificadores do provedor com restrições únicas e processar eventos de forma idempotente. Webhooks podem ser repetidos ou chegar fora de ordem.
- Criar crédito somente uma vez após confirmação. A fila de entrega não apaga o histórico do pedido; erros podem ser reprocessados sem duplicar saldo.
- Registrar reembolso/contestação e suspender a fila ou sinalizar a conta para revisão administrativa; não confiar em notificações do cliente.
- Usar HTTPS, limites de requisição, validação estrita de entrada, logs sem tokens/segredos e separar credenciais de sandbox e produção.

## Provedor inicial

Usar Mercado Pago com Checkout Pro/PIX para a primeira versão, após confirmar que a conta recebedora brasileira está habilitada e concluir testes em sandbox. PIX é específico do Brasil; métodos disponíveis dependem do país/conta do recebedor. PayPal pode ser adicionado depois com fluxo e verificação de webhook próprios.

## Endpoints previstos

- `GET /api/donations/packages` — retorna somente pacotes ativos e seus valores públicos.
- `POST /api/donations/checkout` — recebe identificador do pacote e código de vínculo; cria o pedido pendente e devolve URL de checkout.
- `POST /api/donations/webhook/mercadopago` — valida e reconcilia eventos com a API do Mercado Pago.
- `POST /api/game/donations/claim` — endpoint privado usado pelo Mobius para retirar uma entrega pendente.
- `POST /api/game/donations/ack` — endpoint privado para confirmar resultado usando ID idempotente.

Os dois endpoints `/api/game/*` só serão habilitados após a ponte estar compilada e instalada no servidor dedicado, com segredo separado e acesso limitado. A conta de banco do jogo não será exposta ao Worker.

## O que falta antes de aceitar dinheiro real

- Definir pacotes, valores em BRL e quantidade de ouro para cada pacote.
- Instalar a revisão Mobius no dedicado e identificar como ela representa o ouro/moeda, inventário online, entrega offline e IDs de personagem/conta.
- Implementar e testar a ponte de vínculo e entrega contra essa revisão exata.
- Configurar conta/app Mercado Pago, credenciais de teste, URL HTTPS de webhook, assinatura secreta e conta/recebedor esperado em Cloudflare.
- Testar aprovado, pendente, recusado, expirado, evento duplicado, pagamento de valor/moeda incorretos, reembolso, falha/repetição da entrega e personagem online/offline.
- Revisar regras do provedor e obrigações fiscais/comerciais para venda de moeda virtual antes de ativar produção.

**Regra de ativação:** checkout fica indisponível por padrão. Só habilitar pagamentos reais quando o sandbox passar e o fluxo pagamento → livro de pedidos → entrega Mobius estiver completo.

