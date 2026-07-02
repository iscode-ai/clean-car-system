export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { autenticar } from "@/lib/authServer";
import { OrdemServico } from "@/types";

export async function GET(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  try {
    const usuarioSnap = await getAdminDb().collection("usuarios").doc(caller.uid).get();
    const telefone = usuarioSnap.exists ? (usuarioSnap.data()!.telefone as string | undefined) : undefined;

    const porUid = await getAdminDb()
      .collection("ordens_servico")
      .where("clienteUid", "==", caller.uid)
      .get();

    const mapa = new Map<string, OrdemServico>();
    porUid.docs.forEach((d) => mapa.set(d.id, d.data() as OrdemServico));

    if (telefone) {
      const porTelefone = await getAdminDb()
        .collection("ordens_servico")
        .where("clienteTelefone", "==", telefone)
        .get();
      porTelefone.docs.forEach((d) => mapa.set(d.id, d.data() as OrdemServico));
    }

    const resultados = Array.from(mapa.values()).sort((a, b) =>
      b.criadoEm.localeCompare(a.criadoEm)
    );

    return NextResponse.json({ resultados });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
