import { NextRequest } from "next/server";

import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import { UserRole } from "@/types";

export interface ChamadorAutenticado {
  uid: string;
  email?: string;
  role: UserRole;
}

export async function autenticar(
  req: NextRequest,
  opts: { exigirCadastro?: boolean } = {}
): Promise<ChamadorAutenticado | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await getAdminAuth().verifyIdToken(token);

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
