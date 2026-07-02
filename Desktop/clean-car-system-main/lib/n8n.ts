import { OrdemServico } from "@/types";

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

export async function dispararWhatsApp(
  evento: string,
  os: Partial<OrdemServico>
): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn("N8N_WEBHOOK_URL não configurado, pulando webhook.");
    return;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (WEBHOOK_SECRET) {
      headers["x-webhook-secret"] = WEBHOOK_SECRET;
    }

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ evento, os }),
    });
  } catch (err) {
    console.error("Erro ao disparar webhook n8n:", err);
    // Não lança o erro — agendamento não deve falhar por causa do webhook
  }
}
