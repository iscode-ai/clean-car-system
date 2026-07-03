export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";

import { Servico, UserRole } from "@/types";
import { randomBytes } from "crypto";

async function autenticarAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("[servicos] sem header Authorization");
    return null;
  }
  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await getAdminAuth().verifyIdToken(token);
    console.log("[servicos] uid decodificado:", decoded.uid);

    const snap = await getAdminDb().collection("usuarios").doc(decoded.uid).get();
    console.log("[servicos] doc existe:", snap.exists, "data:", snap.data());

    if (!snap.exists) return null;
    const role = snap.data()!.role as UserRole;
    if (role !== "admin") {
      console.log("[servicos] role não é admin:", role);
      return null;
    }
    return { uid: decoded.uid, role };
  } catch (err) {
    console.error("[servicos] erro ao autenticar:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const todos = searchParams.get("todos") === "1";
    let snap;
    if (todos) {
      const caller = await autenticarAdmin(req);
      if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
      snap = await getAdminDb().collection("servicos").get();
    } else {
      snap = await getAdminDb().collection("servicos").where("ativo", "==", true).get();
    }
    const servicos = snap.docs.map((d) => d.data());
    return NextResponse.json({ servicos });
  } catch (err) {
    console.error("Erro ao listar serviços:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const caller = await autenticarAdmin(req);
  if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const body = await req.json();
    const { nome, descricao, preco, duracaoMin } = body;
    if (!nome || !preco || !duracaoMin) {
      return NextResponse.json({ erro: "Nome, preço e duração são obrigatórios." }, { status: 400 });
    }
    const id = randomBytes(4).toString("hex");
    const novoServico: Servico = {
      id, nome, descricao: descricao || "",
      preco: Number(preco), duracaoMin: Number(duracaoMin), ativo: true,
    };
    await getAdminDb().collection("servicos").doc(id).set(novoServico);
    return NextResponse.json({ servico: novoServico });
  } catch (err) {
    console.error("Erro ao criar serviço:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const caller = await autenticarAdmin(req);
  if (!caller) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const body = await req.json();
    const { id, ...campos } = body;
    if (!id) return NextResponse.json({ erro: "ID obrigatório." }, { status: 400 });
    if (campos.preco) campos.preco = Number(campos.preco);
    if (campos.duracaoMin) campos.duracaoMin = Number(campos.duracaoMin);
    await getAdminDb().collection("servicos").doc(id).update(campos);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao editar serviço:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
