export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb() } from "@/lib/firebaseAdmin";
import { autenticar } from "@/lib/authServer";
import { formatarTelefoneE164 } from "@/lib/os";

// GET /api/cliente/perfil — retorna o perfil do cliente logado
export async function GET(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const snap = await getAdminDb().collection("usuarios").doc(caller.uid).get();
  if (!snap.exists) return NextResponse.json({ erro: "Perfil não encontrado." }, { status: 404 });

  return NextResponse.json({ usuario: snap.data() });
}

// PATCH /api/cliente/perfil — cliente atualiza o próprio nome/telefone
export async function PATCH(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { nome, telefone } = await req.json();
  const update: Record<string, string> = {};
  if (nome) update.nome = nome;
  if (telefone) update.telefone = formatarTelefoneE164(telefone);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ erro: "Nada para atualizar." }, { status: 400 });
  }

  await getAdminDb().collection("usuarios").doc(caller.uid).update(update);
  return NextResponse.json({ ok: true });
}
