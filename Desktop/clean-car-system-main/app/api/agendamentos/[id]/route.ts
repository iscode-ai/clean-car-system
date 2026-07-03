export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const snap = await getAdminDb().collection("ordens_servico").doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ erro: "OS não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ os: snap.data() });
  } catch (err) {
    console.error("Erro ao buscar OS:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
