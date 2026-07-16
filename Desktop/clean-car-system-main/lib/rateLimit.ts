// Rate limiter simples em memória (por instância serverless).
// Não é 100% à prova de bala em ambiente multi-instância, mas já
// bloqueia bots simples e picos de spam no formulário público.

interface Registro {
  contagem: number;
  resetEm: number;
}

const registros = new Map<string, Registro>();

// Limpa registros antigos periodicamente para não vazar memória
setInterval(() => {
  const agora = Date.now();
  for (const [chave, r] of registros.entries()) {
    if (r.resetEm < agora) registros.delete(chave);
  }
}, 5 * 60 * 1000);

/**
 * Verifica se a chave (geralmente IP + rota) excedeu o limite.
 * @param chave identificador único (ex: `agendar:${ip}`)
 * @param limite quantidade máxima de requisições
 * @param janelaMs janela de tempo em milissegundos
 * @returns true se permitido, false se excedeu o limite
 */
export function verificarRateLimit(chave: string, limite: number, janelaMs: number): boolean {
  const agora = Date.now();
  const atual = registros.get(chave);

  if (!atual || atual.resetEm < agora) {
    registros.set(chave, { contagem: 1, resetEm: agora + janelaMs });
    return true;
  }

  if (atual.contagem >= limite) {
    return false;
  }

  atual.contagem += 1;
  return true;
}

export function obterIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "desconhecido";
}