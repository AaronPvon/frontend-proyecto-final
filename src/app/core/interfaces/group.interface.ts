// Modelos de grupos, iguales que los de la API (backend/models/group_model.py).
// Los importes llegan como texto ("176.66") para que sean exactos.

export type GroupStatus = 'active' | 'closed';
export type Currency = 'EUR' | 'USD';

// Datos básicos de un usuario dentro de un grupo (sin email)
export interface UserSummary {
  id: number;
  name: string;
  lastname: string;
  nickname: string;
}

// Cada grupo del listado "Mis grupos"
export interface Group {
  id: number;
  title: string;
  description: string | null;
  budget: string | null;
  currency: string;
  status: GroupStatus;
  closed_at: string | null;
  created_at: string;
  creator: UserSummary;
}

// Detalle de un grupo: lo mismo que en el listado, más los miembros y el total gastado
export interface GroupDetail extends Group {
  members: UserSummary[];
  total_spent: string;
}

// Cuerpo de POST /api/groups
export interface GroupCreate {
  title: string;
  description: string | null;
  budget: string | null;
  currency: Currency;
}

// Saldo de un miembro: positivo, le deben; negativo, debe
export interface Balance {
  user_id: number;
  name: string;
  lastname: string;
  nickname: string;
  status: 'accepted' | 'left';
  balance: string;
}
