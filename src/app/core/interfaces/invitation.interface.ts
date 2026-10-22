// Modelos de invitaciones, iguales que los de la API (backend/models/member_model.py)

import { UserSummary } from './group.interface';

// Cuerpo de POST /api/groups/{group_id}/invitations: email o nickname, como en el login
export interface InvitationCreate {
  login: string;
}

// Una invitación vista desde el grupo: a quién se invitó y cuándo
export interface GroupInvitation {
  user: UserSummary;
  invited_at: string;
}

// Una invitación vista desde el invitado: lo que necesita para decidir si acepta
export interface UserInvitation {
  group_id: number;
  title: string;
  description: string | null;
  creator: UserSummary;
  invited_at: string;
}
