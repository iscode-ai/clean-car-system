// src/lib/n8n.ts

export type EventoWhatsApp =
  | "agendamento_criado"
  | "checkin_realizado"
  | "status_atualizado"
  | "servico_finalizado"
  | "veiculo_entregue"
  | "pedido_avaliacao";

interface DispararPayload {
  evento: EventoWhatsApp;
  telefone: string; // E.164 sem o +
  osId: string;
  nomeCliente: string;
  dados?: Record<string, unknown>;
}

/**
 * Dispara um webhook no n8n que aciona o fluxo correto da Evolution API.
 * O n8n recebe o evento e roteá para o template de mensagem correto.
 */
export async function dispararWhatsApp(payload: DispararPayload): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("[n8n] N8N_WEBHOOK_URL não definida — mensagem não enviada.");
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        evento: payload.evento,
        telefone: payload.telefone,
        osId: payload.osId,
        nomeCliente: payload.nomeCliente,
        dados: payload.dados ?? {},
        // URL de acompanhamento que vai junto na mensagem pro cliente
        linkAcompanhamento: `http://192.168.3.4:3001/acompanhar?os=${payload.osId}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[n8n] Webhook falhou (${res.status}):`, body);
    }
  } catch (err) {
    // Não deixa o erro do WhatsApp derrubar a operação principal
    console.error("[n8n] Erro ao chamar webhook:", err);
  }
}
