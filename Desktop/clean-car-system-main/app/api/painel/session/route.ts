export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ erro: "Token obrigatório." }, { status: 400 });
    const decoded = await getAdminAuth().verifyIdToken(token);
    const snap = await getAdminDb().collection("usuarios").doc(decoded.uid).get();
    if (!snap.exists) return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
    const data = snap.data()!;
    if (data.role !== "admin" && data.role !== "operador") return NextResponse.json({ erro: "Acesso não autorizado." }, { status: 403 });
    if (data.ativo === false) return NextResponse.json({ erro: "Usuário inativo." }, { status: 403 });
    const res = NextResponse.json({ ok: true, role: data.role, nome: data.nome });
    res.cookies.set("ccs-role", data.role, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 60 * 60 * 8, path: "/" });
    return res;
  } catch (err) {
    console.error("[painel/session]", err);
    return NextResponse.json({ erro: "Token inválido." }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("ccs-role");
  return res;
}
