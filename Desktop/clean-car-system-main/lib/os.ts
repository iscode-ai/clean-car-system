import { StatusOS, STATUS_FLOW } from "@/types";
import { randomBytes } from "crypto";

export function gerarNumeroOS(): string {
  const data = new Date();
  const yy = String(data.getFullYear()).slice(2);
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  const sufixo = randomBytes(3).toString("hex").toUpperCase();
  return `OS-${yy}${mm}${dd}-${sufixo}`;
}

export function gerarTokenQRCode(): string {
  return randomBytes(16).toString("hex");
}

export function transicaoValida(atual: StatusOS, novo: StatusOS): boolean {
  if (novo === "cancelado") return atual !== "entregue";
  if (atual === "entregue" || atual === "cancelado") return false;
  const idxAtual = STATUS_FLOW.indexOf(atual);
  const idxNovo = STATUS_FLOW.indexOf(novo);
  if (idxAtual === -1 || idxNovo === -1) return false;
  return idxNovo === idxAtual + 1;
}

export function formatarTelefoneE164(telefoneBR: string): string {
  const digitos = telefoneBR.replace(/\D/g, "");
  if (digitos.startsWith("55")) return digitos;
  return `55${digitos}`;
}
