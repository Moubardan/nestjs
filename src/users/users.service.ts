import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User, Role, UserPayload } from './user.model';

@Injectable()
export class UsersService {
  private users: User[] = [];

  private toUserPayload(user: User): UserPayload {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findById(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  create(email: string, passwordHash: string): User {
    if (this.findByEmail(email)) {
      throw new ConflictException('Email already in use');
    }

    const isFirstUser = this.users.length === 0;

    const user: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      passwordHash,
      role: isFirstUser ? Role.ADMIN : Role.USER,
      refreshTokenHash: null,
      createdAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  // Appelé après login — stocke le hash du refresh token
  updateRefreshToken(id: string, refreshTokenHash: string | null): void {
    const user = this.findById(id);
    user.refreshTokenHash = refreshTokenHash;
  }

  updateRole(id: string, role: Role): UserPayload {
    const user = this.findById(id);
    user.role = role;
    return this.toUserPayload(user);
  }

  // Promotion ADMIN (usage interne / seed)
  promoteToAdmin(id: string): void {
    this.updateRole(id, Role.ADMIN);
  }
}
