export type StatusOS =
  | "agendado"
  | "confirmado"
  | "checkin_realizado"
  | "em_atendimento"
  | "finalizado"
  | "aguardando_retirada"
  | "entregue"
  | "cancelado";

export const STATUS_LABELS: Record<StatusOS, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  checkin_realizado: "Check-in realizado",
  em_atendimento: "Em atendimento",
  finalizado: "Finalizado",
  aguardando_retirada: "Aguardando retirada",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_FLOW: StatusOS[] = [
  "agendado",
  "confirmado",
  "checkin_realizado",
  "em_atendimento",
  "finalizado",
  "aguardando_retirada",
  "entregue",
];

export type UserRole = "cliente" | "operador" | "admin";

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMin: number;
  ativo: boolean;
}

export interface StatusHistoricoItem {
  status: StatusOS;
  alteradoEm: string;
  alteradoPor: string;
  observacao?: string;
}

export interface FotoOS {
  url: string;
  tipo: "antes" | "depois";
  enviadaEm: string;
}

export interface OrdemServico {
  id: string;
  qrCode: string;
  qrUsado: boolean;
  clienteNome: string;
  clienteTelefone: string;
  clienteUid?: string;
  placa: string;
  veiculoModelo?: string;
  servicoId: string;
  servicoNome: string;
  servicoPreco: number;
  dataAgendada: string;
  horaAgendada: string;
  status: StatusOS;
  historico: StatusHistoricoItem[];
  fotos: FotoOS[];
  criadoEm: string;
  operadorResponsavel?: string;
}

export interface UsuarioSistema {
  uid: string;
  nome: string;
  email?: string;
  telefone?: string;
  role: UserRole;
  ativo: boolean;
  criadoEm?: string;
}
