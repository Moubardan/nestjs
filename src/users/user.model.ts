
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;       // on ne stocke JAMAIS le mot de passe en clair
  role: Role;
  refreshTokenHash: string | null; // hash du refresh token courant (null = déconnecté)
  createdAt: Date;
}

// Ce que @CurrentUser() retourne — jamais le passwordHash ni le refreshTokenHash
export interface UserPayload {
  id: string;
  email: string;
  role: Role;
}
