// Modelos de datos de usuario y autenticación, iguales que los de la API

// Respuesta de GET /api/users/me y de POST /api/auth/register (nunca incluye la contraseña)
export interface User {
  id: number;
  name: string;
  lastname: string;
  nickname: string;
  email: string;
  created_at: string;
}

// Cuerpo de POST /api/auth/register
export interface UserCreate {
  name: string;
  lastname: string;
  nickname: string;
  email: string;
  password: string;
  password_confirm: string;
}

// Cuerpo de POST /api/auth/login: "login" es el email o el nickname
export interface UserLogin {
  login: string;
  password: string;
}

// Respuesta de POST /api/auth/login
export interface Token {
  access_token: string;
  token_type: string;
}
