// src/app/operador/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { OrdemServico, STATUS_LABELS, STATUS_FLOW, StatusOS } from "@/types";

// qrcode scanner via jsQR (instalar: npm i jsqr)
// A câmera lê frames do vídeo e tenta decodificar o QR

type Tela = "login" | "scanner" | "ficha";

export default function OperadorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tela, setTela] = useState<Tela>("login");
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", senha: "" });
  const [loginErro, setLoginErro] = useState("");
  const [scanErro, setScanErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setTela("scanner");
    });
    return () => unsub();
  }, []);

  // Inicia câmera ao entrar no scanner
  useEffect(() => {
    if (tela === "scanner") iniciarCamera();
    else pararCamera();
    return () => pararCamera();
  }, [tela]);

  async function iniciarCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(lerFrame);
      }
    } catch {
      setScanErro("Câmera não disponível. Insira o código manualmente.");
    }
  }

  function pararCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function lerFrame() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(lerFrame);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Importação dinâmica do jsQR para não quebrar SSR
    const jsQR = (await import("jsqr")).default;
    const result = jsQR(imageData.data, imageData.width, imageData.height);

    if (result?.data) {
      pararCamera();
      await fazerCheckin(result.data);
    } else {
      rafRef.current = requestAnimationFrame(lerFrame);
    }
  }

  async function fazerCheckin(qrCode: string) {
    setScanErro("");
    const token = await user?.getIdToken();
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ qrCode, operadorUid: user?.uid }),
    });
    const data = await res.json();
    if (!res.ok) {
      setScanErro(data.erro || "Erro no check-in.");
      iniciarCamera();
      return;
    }
    setOs(data.os);
    setTela("ficha");
  }

  async function buscarOSManual(osId: string) {
    const res = await fetch(`/api/agendamentos?osId=${encodeURIComponent(osId)}`);
    const data = await res.json();
    if (data.resultados?.[0]) {
      setOs(data.resultados[0]);
      setTela("ficha");
    } else {
      setScanErro("OS não encontrada.");
    }
  }

  async function atualizarStatus(novoStatus: StatusOS) {
    if (!os) return;
    setAtualizando(true);
    const token = await user?.getIdToken();
    const res = await fetch("/api/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ osId: os.id, novoStatus, operadorUid: user?.uid, observacao }),
    });
    const data = await res.json();
    if (res.ok) {
      setOs((prev) => prev ? { ...prev, status: novoStatus } : prev);
      setObservacao("");
    } else {
      alert(data.erro || "Erro ao atualizar status.");
    }
    setAtualizando(false);
  }

  async function uploadFoto(tipo: "antes" | "depois", arquivo: File) {
    if (!os || !user) return;
    setUploadStatus("Enviando...");
    const token = await user.getIdToken();
    const fd = new FormData();
    fd.append("osId", os.id);
    fd.append("tipo", tipo);
    fd.append("operadorUid", user.uid);
    fd.append("arquivo", arquivo);

    const res = await fetch("/api/fotos", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (res.ok) {
      setOs((prev) =>
        prev ? { ...prev, fotos: [...(prev.fotos ?? []), { url: data.url, tipo, enviadaEm: new Date().toISOString() }] } : prev
      );
      setUploadStatus("Foto enviada ✓");
    } else {
      setUploadStatus(data.erro || "Erro no upload.");
    }
    setTimeout(() => setUploadStatus(""), 3000);
  }

  // Próximo status válido
  const proximoStatus: StatusOS | null = os
    ? (STATUS_FLOW[STATUS_FLOW.indexOf(os.status) + 1] ?? null)
    : null;

  // ─── LOGIN ───
  if (!user) {
    return (
      <main className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-6">Login do operador</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoginErro("");
            try {
              await signInWithEmailAndPassword(auth, loginForm.email, loginForm.senha);
            } catch {
              setLoginErro("E-mail ou senha inválidos.");
            }
          }}
          className="space-y-4"
        >
          <label className="block">
            <span className="label">E-mail</span>
            <input
              type="email"
              required
              className="input mt-1.5"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="label">Senha</span>
            <input
              type="password"
              required
              className="input mt-1.5"
              value={loginForm.senha}
              onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })}
            />
          </label>
          {loginErro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{loginErro}</p>}
          <button className="btn-primary w-full">Entrar</button>
        </form>
      </main>
    );
  }

  // ─── SCANNER ───
  if (tela === "scanner") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Check-in por QR Code</h1>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              Escaneie o QR do cliente para dar entrada no veículo.
            </p>
          </div>
          <button onClick={() => signOut(auth)} className="text-sm shrink-0 ml-4" style={{ color: "var(--color-text-muted)" }}>
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="card aspect-square flex items-center justify-center relative overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover absolute inset-0" muted playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 rounded-lg flex items-center justify-center" style={{ borderColor: "var(--color-accent)" }}>
                <span className="text-sm font-medium bg-black/40 px-2 py-1 rounded" style={{ color: "var(--color-text-primary)" }}>
                  Leitor QR Code
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <input
              id="manualOS"
              className="input"
              placeholder="Ex: CC-2026-000001"
            />
            <button
              className="btn-primary w-full"
              onClick={() => {
                const val = (document.getElementById("manualOS") as HTMLInputElement).value;
                if (val) buscarOSManual(val.trim());
              }}
            >
              Buscar OS
            </button>

            <div className="card p-4">
              <p className="font-medium">Dar entrada no veículo</p>
              <p className="text-sm mt-1" style={{ color: "var(--color-accent)" }}>
                Status: Veículo recebido
              </p>
            </div>

            {scanErro && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{scanErro}</p>}
          </div>
        </div>
      </main>
    );
  }

  // ─── FICHA ───
  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => { setOs(null); setTela("scanner"); }} className="text-sm" style={{ color: "var(--color-accent)" }}>
          ← Scanner
        </button>
        <h1 className="text-lg font-semibold">{os?.id}</h1>
      </div>

      {os && (
        <>
          {/* Info do veículo */}
          <div className="card p-4 space-y-1 text-sm">
            <p><span className="font-medium">Cliente:</span> {os.clienteNome}</p>
            <p><span className="font-medium">Placa:</span> {os.placa}{os.veiculoModelo ? ` — ${os.veiculoModelo}` : ""}</p>
            <p><span className="font-medium">Serviço:</span> {os.servicoNome}</p>
            <p><span className="font-medium">Agendado:</span> {os.dataAgendada} às {os.horaAgendada}</p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className="font-semibold" style={{ color: "var(--color-accent)" }}>{STATUS_LABELS[os.status]}</span>
            </p>
          </div>

          {/* Upload de fotos */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-medium">Fotos</p>
            <div className="flex gap-3">
              {(["antes", "depois"] as const).map((tipo) => (
                <label key={tipo} className="flex-1 cursor-pointer">
                  <div
                    className="border-2 border-dashed rounded-lg p-3 text-center text-sm transition"
                    style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)" }}
                  >
                    {tipo === "antes" ? "Antes" : "Depois"}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFoto(tipo, f);
                    }}
                  />
                </label>
              ))}
            </div>
            {uploadStatus && <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>{uploadStatus}</p>}

            {os.fotos?.length > 0 && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                {os.fotos.map((f, i) => (
                  <div key={i} className="relative">
                    <img src={f.url} alt="" className="w-full h-20 object-cover rounded" />
                    <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                      {f.tipo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Atualizar status */}
          {proximoStatus && os.status !== "entregue" && os.status !== "cancelado" && (
            <div className="card p-4 space-y-3">
              <p className="text-sm font-medium">Avançar status</p>
              <label className="block">
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Observação (opcional)</span>
                <input
                  className="input mt-1"
                  placeholder="Ex: aguardando peça"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </label>
              <button
                disabled={atualizando}
                onClick={() => atualizarStatus(proximoStatus)}
                className="btn-primary w-full"
              >
                {atualizando ? "Atualizando..." : `→ ${STATUS_LABELS[proximoStatus]}`}
              </button>
              <button
                disabled={atualizando}
                onClick={() => atualizarStatus("cancelado")}
                className="btn-danger-outline w-full"
              >
                Cancelar OS
              </button>
            </div>
          )}

          {/* Histórico */}
          <div className="card p-4 space-y-2">
            <p className="text-sm font-medium">Histórico</p>
            {[...os.historico].reverse().map((h, i) => (
              <div key={i} className="text-sm border-l-2 pl-3" style={{ borderColor: "var(--color-border-strong)" }}>
                <span className="font-medium">{STATUS_LABELS[h.status]}</span>
                <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>
                  {new Date(h.alteradoEm).toLocaleString("pt-BR")}
                </span>
                {h.observacao && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{h.observacao}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
