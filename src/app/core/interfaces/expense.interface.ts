// Modelos de gastos, iguales que los de la API (backend/models/expense_model.py).
// Los importes viajan como texto ("20.00") para que sean exactos.

import { UserSummary } from './group.interface';

export type SplitType = 'equal' | 'custom';

// Parte de un participante al crear un gasto: en "equal" sin importe (lo calcula la API)
export interface ShareCreate {
  user_id: number;
  amount?: string;
}

// Cuerpo de POST /api/groups/{group_id}/expenses
export interface ExpenseCreate {
  title: string;
  description: string | null;
  amount: string;
  paid_by: number;
  expense_date: string;
  split_type: SplitType;
  shares: ShareCreate[];
}

// Parte de un gasto que corresponde a un participante
export interface ExpenseShare {
  user: UserSummary;
  amount: string;
}

// Cada gasto del grupo, con quién lo pagó y cómo se repartió
export interface Expense {
  id: number;
  title: string;
  description: string | null;
  amount: string;
  split_type: SplitType;
  expense_date: string;
  created_at: string;
  paid_by: UserSummary;
  shares: ExpenseShare[];
}
