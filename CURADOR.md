# Curador digital "Tião" — como funciona e como publicar

O curador é um assistente de chat com IA real que aparece em todas as páginas do site
(botão "Fale com o curador", canto inferior direito). Ele responde sobre a história do
museu, o acervo e a visita, **ancorado numa base de conhecimento verificada** — não inventa.

## Arquitetura (mesmo padrão do "Téo" da TELSA/Hikvision)

```
Navegador (curador.js)  ──POST /api/curador──►  Função serverless (api/curador.js)
                                                        │
                                                        ▼
                                          OpenRouter → DeepSeek V3
                                          (deepseek/deepseek-chat-v3-0324)
```

- `curador.js` — widget de frontend (botão + painel de chat). Estático, sem chave.
- `api/curador.js` — função serverless que guarda a chave, monta o prompt com a persona
  + a base de conhecimento e chama o OpenRouter. **A chave nunca vai para o navegador.**
- `api/_kb.js` — a base de conhecimento (história, horários, endereço, as 16 famílias de
  peças, etc.). É só editar este arquivo para o curador "aprender" algo novo.

Proteções incluídas: checagem de origem, limite de requisições por IP (8/min),
limite de tamanho das mensagens e recorte do histórico.

## Publicar (Vercel — recomendado, é onde o Téo já roda)

O site é estático, mas a função `/api/curador` precisa de um servidor. A Vercel serve
os dois juntos (arquivos estáticos + função) sem configuração extra.

1. Acesse https://vercel.com e conecte o repositório `RaufAlencar/museo-tropeiro`.
2. Em **Settings → Environment Variables**, adicione:
   - `OPENROUTER_API_KEY` = a mesma chave usada no Sincro/TELSA (a que está no `.env` do core).
   - `SITE_URL` = a URL final do site (opcional; ex.: `https://museudotropeiro.org.br`).
3. Deploy. Pronto: o curador passa a responder de verdade.

> Enquanto não houver deploy com a chave (ou se o site ficar no GitHub Pages, que **não**
> roda funções), o curador mostra, com elegância, uma mensagem pedindo para ligar/e-mailar
> o museu. Nada quebra.

## Custo

Cada resposta é uma chamada ao DeepSeek V3 via OpenRouter (modelo barato). O consumo é
pequeno para o volume de um site de museu; acompanhe pelo painel do OpenRouter.

## Personalização

- **Base de conhecimento:** edite `api/_kb.js`.
- **Personalidade / regras:** edite a constante `SYSTEM` em `api/curador.js`.
- **Nome, saudação e sugestões:** edite o topo de `curador.js`.

## Testar localmente

Há um servidor de teste (Node) que roda a função junto com o site. Rode com a chave no
ambiente:

```bash
OPENROUTER_API_KEY=sk-or-... node testserver.js   # serve em http://127.0.0.1:8766
```

(O `testserver.js` fica fora do repositório, no ambiente de trabalho, para não versionar nada sensível.)
