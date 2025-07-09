export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin' | 'user';
  iat?: number;
  exp?: number;
}
