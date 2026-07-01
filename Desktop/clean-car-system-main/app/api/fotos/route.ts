export const dynamic = "force-dynamic";
// src/app/api/fotos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { FotoOS } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const osId = formData.get("osId") as string;
    const tipo = formData.get("tipo") as "antes" | "depois";
    const operadorUid = formData.get("operadorUid") as string;
    const arquivo = formData.get("arquivo") as File;

    if (!osId || !tipo || !operadorUid || !arquivo) {
      return NextResponse.json({ erro: "Campos obrigatórios faltando." }, { status: 400 });
    }

    if (!["antes", "depois"].includes(tipo)) {
      return NextResponse.json({ erro: "tipo deve ser 'antes' ou 'depois'." }, { status: 400 });
    }

    // Verifica se OS existe
    const osRef = getAdminDb().collection("ordens_servico").doc(osId);
    const osSnap = await osRef.get();
    if (!osSnap.exists) {
      return NextResponse.json({ erro: "OS não encontrada." }, { status: 404 });
    }

    const os = osSnap.data()!;

    // Valida que status permite upload (não faz sentido antes do check-in ou após entregue)
    const statusPermitidos = ["checkin_realizado", "em_atendimento", "finalizado"];
    if (!statusPermitidos.includes(os.status)) {
      return NextResponse.json(
        { erro: `Status "${os.status}" não permite upload de fotos.` },
        { status: 409 }
      );
    }

    // Upload pro Firebase Storage
    const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const ext = arquivo.name.split(".").pop() || "jpg";
    const caminho = `fotos/${osId}/${tipo}_${Date.now()}.${ext}`;
    const fileRef = bucket.file(caminho);

    await fileRef.save(buffer, {
      metadata: { contentType: arquivo.type || "image/jpeg" },
    });

    await fileRef.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${caminho}`;

    // Registra na OS (regra 08: fotos vinculadas à OS, nunca perdidas)
    const novaFoto: FotoOS = {
      url,
      tipo,
      enviadaEm: new Date().toISOString(),
    };

    await osRef.update({
      fotos: [...(os.fotos ?? []), novaFoto],
    });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ erro: "Erro interno ao fazer upload." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const osId = searchParams.get("osId");

  if (!osId) {
    return NextResponse.json({ erro: "osId obrigatório." }, { status: 400 });
  }

  const osSnap = await getAdminDb().collection("ordens_servico").doc(osId).get();
  if (!osSnap.exists) {
    return NextResponse.json({ erro: "OS não encontrada." }, { status: 404 });
  }

  const os = osSnap.data()!;
  return NextResponse.json({ fotos: os.fotos ?? [] });
}
