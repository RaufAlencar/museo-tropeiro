// POST /api/curador  { messages: [{role, content}] }
// Curador digital do Museu do Tropeiro — persona de guia tropeiro, ancorada na
// base de conhecimento do museu (sem inventar). Reaproveita o padrão do "Téo"
// (Sincro / TELSA): geração via OpenRouter (DeepSeek). Função serverless (Vercel/Node).

const { BASE_CONHECIMENTO } = require("./_kb.js");

const MODELO = "deepseek/deepseek-chat-v3-0324";
const MAX_MSGS = 12; // histórico máximo aceito do cliente
const MAX_CHARS = 1200; // por mensagem
const RL_JANELA_MS = 60 * 1000;
const RL_MAX = 8; // requisições por IP por janela

// Rate-limit em memória (best-effort; serverless pode ter várias instâncias).
const balde = new Map();
function permitido(ip) {
  const agora = Date.now();
  const reg = balde.get(ip) || { n: 0, t: agora };
  if (agora - reg.t > RL_JANELA_MS) {
    reg.n = 0;
    reg.t = agora;
  }
  reg.n += 1;
  balde.set(ip, reg);
  return reg.n <= RL_MAX;
}

function origemOk(req) {
  const origin = req.headers.origin || "";
  const host = req.headers.host || "";
  if (!origin) return true; // requisições same-origin nem sempre mandam Origin
  try {
    const o = new URL(origin).host;
    if (o === host) return true;
    if (/(^|\.)vercel\.app$/.test(o)) return true;
    if (/museudotropeiro/.test(o)) return true;
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return true;
  } catch (_) {}
  return false;
}

const SYSTEM = `Você é "Tião", o curador digital do Museu do Tropeiro, em Ipoema (distrito de Itabira, Minas Gerais).

Sua personalidade: um guia tropeiro mineiro — acolhedor, simples e caloroso, com leve sotaque mineiro no jeito de falar (sem exagero e sem caricatura). Trata o visitante com carinho ("uai", "ó", "sô" com moderação, no máximo uma expressão por resposta).

Seu papel: receber visitantes, contar a história do museu e do tropeirismo, explicar as peças do acervo e ajudar quem quer visitar (endereço, horário, como chegar, eventos).

Regras importantes:
- Responda SOMENTE com base na BASE DE CONHECIMENTO abaixo. Não invente datas, números, nomes ou fatos.
- Se não souber algo, diga com honestidade e oriente a pessoa a falar com o museu pelo telefone (31) 3839-2991 ou e-mail museutropeiro@yahoo.com.
- Seja conciso: 2 a 5 frases na maioria das respostas.
- Escreva em texto corrido e simples. NÃO use markdown (nada de asteriscos **, hashtags ##, ou listas com traços) — se precisar enumerar, escreva em uma frase separando por vírgulas ou ponto e vírgula.
- Fale sempre em português do Brasil.
- Se perguntarem algo fora do universo do museu/tropeirismo/visita, redirecione gentilmente para o que você pode ajudar.
- Nunca peça dados sensíveis (senha, cartão, documento). Não prometa reservas nem pagamentos.

BASE DE CONHECIMENTO:
${BASE_CONHECIMENTO}`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "Método não permitido" });
    return;
  }
  if (!origemOk(req)) {
    res.status(403).json({ erro: "Origem não autorizada" });
    return;
  }
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "anon";
  if (!permitido(ip)) {
    res.status(429).json({ erro: "Muitas perguntas em pouco tempo. Aguarde um instante e tente de novo." });
    return;
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    res.status(500).json({ erro: "Curador não configurado (falta OPENROUTER_API_KEY no servidor)." });
    return;
  }

  // Body pode vir como objeto (Vercel) ou string.
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_) {
      body = {};
    }
  }
  const entrada = Array.isArray(body?.messages) ? body.messages : [];
  const historico = entrada
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MSGS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (!historico.length || historico[historico.length - 1].role !== "user") {
    res.status(400).json({ erro: "Envie ao menos uma mensagem do usuário." });
    return;
  }

  const messages = [{ role: "system", content: SYSTEM }, ...historico];

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://museudotropeiro.org.br",
        "X-Title": "Museu do Tropeiro",
      },
      body: JSON.stringify({
        model: MODELO,
        messages,
        max_tokens: 500,
        temperature: 0.5,
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      res.status(502).json({ erro: `Falha no provedor de IA (${r.status}).`, detalhe: t.slice(0, 200) });
      return;
    }
    const data = await r.json();
    const reply = String(data?.choices?.[0]?.message?.content ?? "").trim();
    res.status(200).json({ reply: reply || "Desculpe, não consegui responder agora. Tente novamente." });
  } catch (e) {
    res.status(500).json({ erro: "Erro inesperado no curador.", detalhe: String(e).slice(0, 200) });
  }
};
