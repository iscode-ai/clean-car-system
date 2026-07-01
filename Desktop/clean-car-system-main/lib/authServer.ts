import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import "@/lib/firebaseAdmin";
import { UserRole } from "@/types";

export interface ChamadorAutenticado {
  uid: string;
  email?: string;
  role: UserRole;
}

/**
 * Verifica o ID token do Firebase enviado em "Authorization: Bearer <token>".
 * Retorna { uid, email, role } se o usuário existir em /usuarios.
 * Use `exigirCadastro: false` quando o usuário pode ainda não ter doc
 * criado em /usuarios (ex: durante o auto-cadastro de cliente).
 */
export async function autenticar(
  req: NextRequest,
  opts: { exigirCadastro?: boolean } = {}
): Promise<ChamadorAutenticado | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await getAuth().verifyIdToken(token);

    const snap = await getAdminDb().collection("usuarios").doc(decoded.uid).get();
    if (!snap.exists) {
      if (opts.exigirCadastro === false) {
        return { uid: decoded.uid, email: decoded.email, role: "cliente" };
      }
      return null;
    }

    const data = snap.data()!;
    if (data.ativo === false) return null;

    return { uid: decoded.uid, email: decoded.email, role: data.role };
  } catch {
    return null;
  }
}
