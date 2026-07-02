export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { UsuarioSistema, UserRole } from "@/types";

async function autenticarAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await getAuth().verifyIdToken(token);
    const snap = await getAdminDb().collection("usuarios").doc(decoded.uid).get();
    if (!snap.exists) return null;
    const role = snap.data()!.role as UserRole;
    if (role !== "admin") return null;
    return { uid: decoded.uid, role };
  } catch {
    return null;
  }
}

// GET — lista todos os usuários (admin)
export async function GET(req: NextRequest) {
  const caller = await autenticarAdmin(req);
  if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const snap = await getAdminDb().collection("usuarios").get();
    const usuarios = snap.docs.map((d) => d.data());
    return NextResponse.json({ usuarios });
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}

// POST — criar operador/admin (admin)
export async function POST(req: NextRequest) {
  const caller = await autenticarAdmin(req);
  if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const { nome, email, senha, role, telefone } = await req.json();
    if (!nome || !email || !senha || !role) {
      return NextResponse.json({ erro: "Nome, email, senha e role são obrigatórios." }, { status: 400 });
    }

    const userRecord = await getAuth().createUser({ email, password: senha, displayName: nome });

    const novoUsuario: UsuarioSistema = {
      uid: userRecord.uid,
      nome,
      email,
      telefone: telefone || "",
      role: role as UserRole,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };

    await getAdminDb().collection("usuarios").doc(userRecord.uid).set(novoUsuario);
    return NextResponse.json({ usuario: novoUsuario });
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Erro interno.";
    console.error("Erro ao criar usuário:", err);
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}

// PATCH — ativar/desativar usuário (admin)
export async function PATCH(req: NextRequest) {
  const caller = await autenticarAdmin(req);
  if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const { uid, ativo } = await req.json();
    if (!uid || ativo === undefined) {
      return NextResponse.json({ erro: "uid e ativo são obrigatórios." }, { status: 400 });
    }
    await getAdminDb().collection("usuarios").doc(uid).update({ ativo });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
