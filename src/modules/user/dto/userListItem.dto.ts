import { Role } from '../entities/user.entity';

export type UserListItemDto =
  | { id: number; name: string; role: Role; email: string; password?: never }
  | { id: number; name: string; role: Role; email: ''; password?: never }
  | { id: number; name: string; role: Role; email: string; password: string };
