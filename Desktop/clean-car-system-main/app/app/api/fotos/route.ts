export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { FotoOS } from "@/types";
import { autenticar } from "@/lib/authServer";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const caller = await autenticar(req);
  if (!caller || (caller.role !== "operador" && caller.role !== "admin")) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const osId = formData.get("osId") as string;
    const tipo = formData.get("tipo") as "antes" | "depois";
    const arquivo = formData.get("arquivo") as File;

    if (!osId || !tipo || !arquivo) {
      return NextResponse.json({ erro: "osId, tipo e arquivo são obrigatórios." }, { status: 400 });
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const ext = arquivo.name.split(".").pop() || "jpg";
    const nomeArquivo = `fotos/${osId}/${tipo}_${randomBytes(4).toString("hex")}.${ext}`;

    const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const fileRef = bucket.file(nomeArquivo);
    await fileRef.save(buffer, { contentType: arquivo.type });
    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${nomeArquivo}`;

    const novaFoto: FotoOS = {
      url,
      tipo,
      enviadaEm: new Date().toISOString(),
    };

    const ref = getAdminDb().collection("ordens_servico").doc(osId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ erro: "OS não encontrada." }, { status: 404 });

    const fotos = snap.data()!.fotos || [];
    await ref.update({ fotos: [...fotos, novaFoto] });

    return NextResponse.json({ foto: novaFoto });
  } catch (err) {
    console.error("Erro ao salvar foto:", err);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
