export const dynamic = "force-dynamic";
// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb() } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { UsuarioSistema, UserRole } from "@/types";

// Helper: valida token e retorna role do chamador
async function autenticar(req: NextRequest): Promise<{ uid: string; role: UserRole } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await getAuth().verifyIdToken(token);
    const snap = await getAdminDb().collection("usuarios").doc(decoded.uid).get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return { uid: decoded.uid, role: data.role };
  } catch {
    return null;
  }
}

// GET /api/usuarios — lista todos (só admin)
export async function GET(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const snap = await getAdminDb().collection("usuarios").get();
  const usuarios = snap.docs.map((d) => d.data() as UsuarioSistema);
  return NextResponse.json({ usuarios });
}

// POST /api/usuarios — cria usuário (só admin)
export async function POST(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const { uid, nome, role } = await req.json();
  if (!uid || !nome || !role) {
    return NextResponse.json({ erro: "uid, nome e role são obrigatórios." }, { status: 400 });
  }

  const rolesValidas: UserRole[] = ["cliente", "operador", "admin"];
  if (!rolesValidas.includes(role)) {
    return NextResponse.json({ erro: "Role inválida." }, { status: 400 });
  }

  const novoUsuario: UsuarioSistema = { uid, nome, role, ativo: true };
  await getAdminDb().collection("usuarios").doc(uid).set(novoUsuario);
  return NextResponse.json({ ok: true, usuario: novoUsuario });
}

// PATCH /api/usuarios — atualiza role ou ativo (só admin)
export async function PATCH(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const { uid, role, ativo } = await req.json();
  if (!uid) {
    return NextResponse.json({ erro: "uid obrigatório." }, { status: 400 });
  }

  const update: Partial<UsuarioSistema> = {};
  if (role !== undefined) update.role = role;
  if (ativo !== undefined) update.ativo = ativo;

  await getAdminDb().collection("usuarios").doc(uid).update(update);
  return NextResponse.json({ ok: true });
}
