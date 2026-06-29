// src/app/api/servicos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { Servico, UserRole } from "@/types";
import { randomBytes } from "crypto";

async function autenticar(req: NextRequest): Promise<{ uid: string; role: UserRole } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await getAuth().verifyIdToken(token);
    const snap = await adminDb.collection("usuarios").doc(decoded.uid).get();
    if (!snap.exists) return null;
    return { uid: decoded.uid, role: snap.data()!.role };
  } catch {
    return null;
  }
}

// GET /api/servicos — lista públicos (ativos) ou todos pra admin
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const todos = searchParams.get("todos") === "1";

  let q;
  if (todos) {
    const caller = await autenticar(req);
    if (!caller || caller.role !== "admin") {
      return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    }
    q = adminDb.collection("servicos").orderBy("nome");
  } else {
    q = adminDb.collection("servicos").where("ativo", "==", true).orderBy("nome");
  }

  const snap = await q.get();
  const servicos = snap.docs.map((d) => d.data() as Servico);
  return NextResponse.json({ servicos });
}

// POST /api/servicos — cria serviço (só admin, regra 07)
export async function POST(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const { nome, descricao, preco, duracaoMin } = await req.json();
  if (!nome || preco === undefined || !duracaoMin) {
    return NextResponse.json({ erro: "nome, preco e duracaoMin são obrigatórios." }, { status: 400 });
  }

  const id = randomBytes(6).toString("hex");
  const novoServico: Servico = { id, nome, descricao: descricao || "", preco, duracaoMin, ativo: true };
  await adminDb.collection("servicos").doc(id).set(novoServico);
  return NextResponse.json({ ok: true, servico: novoServico });
}

// PATCH /api/servicos — edita serviço (só admin, regra 07)
export async function PATCH(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const { id, ...campos } = await req.json();
  if (!id) return NextResponse.json({ erro: "id obrigatório." }, { status: 400 });

  const permitidos: (keyof Servico)[] = ["nome", "descricao", "preco", "duracaoMin", "ativo"];
  const update: Partial<Servico> = {};
  for (const campo of permitidos) {
    if (campos[campo] !== undefined) update[campo] = campos[campo] as never;
  }

  await adminDb.collection("servicos").doc(id).update(update);
  return NextResponse.json({ ok: true });
}

// DELETE /api/servicos — desativa (soft delete, só admin)
export async function DELETE(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ erro: "id obrigatório." }, { status: 400 });

  await adminDb.collection("servicos").doc(id).update({ ativo: false });
  return NextResponse.json({ ok: true });
}
