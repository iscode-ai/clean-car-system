"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UsuarioSistema } from "@/types";

interface AuthContextValue {
  user: User | null;
  perfil: UsuarioSistema | null;
  carregando: boolean;
  recarregarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  perfil: null,
  carregando: true,
  recarregarPerfil: async () => {},
  sair: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<UsuarioSistema | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarPerfil(u: User | null) {
    if (!u) {
      setPerfil(null);
      return;
    }
    try {
      const token = await u.getIdToken();
      const res = await fetch("/api/cliente/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPerfil(data.usuario);
      } else {
        setPerfil(null);
      }
    } catch {
      setPerfil(null);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await carregarPerfil(u);
      setCarregando(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        carregando,
        recarregarPerfil: () => carregarPerfil(user),
        sair: () => signOut(auth),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
