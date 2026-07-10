import Link from "next/link";

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer style={{ borderTop: "0.5px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="text-xl font-bold tracking-tight mb-3">
            <span>Clean</span> <span style={{ color: "var(--color-accent)" }}>Car</span>
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Agendamento, check-in por QR Code e acompanhamento em tempo real do seu veículo.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Navegação</p>
          <ul className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <li><Link href="/agendar" className="hover:underline">Agendar</Link></li>
            <li><Link href="/acompanhar" className="hover:underline">Acompanhar</Link></li>
            <li><Link href="/cliente/login" className="hover:underline">Área do cliente</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Contato</p>
          <ul className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <li>📍 Endereço da loja</li>
            <li>📞 (00) 00000-0000</li>
            <li>✉️ contato@cleancar.com.br</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Horário</p>
          <ul className="space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <li>Seg a Sáb: 8h às 18h</li>
            <li>Domingo: fechado</li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: "0.5px solid var(--color-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {ano} Clean Car. Todos os direitos reservados.
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Desenvolvido por is.code
          </p>
        </div>
      </div>
    </footer>
  );
}
