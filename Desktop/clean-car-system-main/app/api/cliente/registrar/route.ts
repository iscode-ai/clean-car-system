export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { autenticar } from "@/lib/authServer";
import { UsuarioSistema } from "@/types";
import { formatarTelefoneE164 } from "@/lib/os";

// POST /api/cliente/registrar — cria o doc /usuarios/{uid} logo após o
// cliente criar a conta no Firebase Auth (signup por e-mail).
export async function POST(req: NextRequest) {
  const caller = await autenticar(req, { exigirCadastro: false });
  if (!caller) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { nome, telefone } = await req.json();
  if (!nome || !telefone) {
    return NextResponse.json({ erro: "Nome e telefone são obrigatórios." }, { status: 400 });
  }

  const ref = getAdminDb().collection("usuarios").doc(caller.uid);
  const snap = await ref.get();

  if (snap.exists) {
    // já tem cadastro — apenas garante telefone/nome atualizados
    await ref.update({ nome, telefone: formatarTelefoneE164(telefone) });
  } else {
    const novoUsuario: UsuarioSistema = {
      uid: caller.uid,
      nome,
      email: caller.email,
      telefone: formatarTelefoneE164(telefone),
      role: "cliente",
      ativo: true,
      criadoEm: new Date().toISOString(),
    };
    await ref.set(novoUsuario);
  }

  return NextResponse.json({ ok: true });
}
