export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { autenticar } from "@/lib/authServer";
import { OrdemServico } from "@/types";

// GET /api/cliente/agendamentos — lista as OS vinculadas ao cliente logado
// (por clienteUid e, como fallback, pelo telefone cadastrado no perfil).
export async function GET(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const usuarioSnap = await adminDb.collection("usuarios").doc(caller.uid).get();
  const telefone = usuarioSnap.exists ? (usuarioSnap.data()!.telefone as string | undefined) : undefined;

  const porUid = await adminDb
    .collection("ordens_servico")
    .where("clienteUid", "==", caller.uid)
    .get();

  let porTelefone: FirebaseFirestore.QuerySnapshot | null = null;
  if (telefone) {
    porTelefone = await adminDb
      .collection("ordens_servico")
      .where("clienteTelefone", "==", telefone)
      .get();
  }

  const mapa = new Map<string, OrdemServico>();
  porUid.docs.forEach((d) => mapa.set(d.id, d.data() as OrdemServico));
  porTelefone?.docs.forEach((d) => mapa.set(d.id, d.data() as OrdemServico));

  const resultados = Array.from(mapa.values()).sort((a, b) =>
    b.criadoEm.localeCompare(a.criadoEm)
  );

  return NextResponse.json({ resultados });
}
