import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role, UserPayload } from './user.model';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  private toUserPayload(user: User): UserPayload {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async create(email: string, passwordHash: string): Promise<UserEntity> {
    if (await this.findByEmail(email)) {
      throw new ConflictException('Email already in use');
    }

    const isFirstUser = (await this.usersRepository.count()) === 0;

    const user = this.usersRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      role: isFirstUser ? Role.ADMIN : Role.USER,
      refreshTokenHash: null,
    });

    return this.usersRepository.save(user);
  }

  // Appelé après login — stocke le hash du refresh token
  async updateRefreshToken(id: string, refreshTokenHash: string | null): Promise<void> {
    const user = await this.findById(id);
    user.refreshTokenHash = refreshTokenHash;
    await this.usersRepository.save(user);
  }

  async updateRole(id: string, role: Role): Promise<UserPayload> {
    const user = await this.findById(id);
    user.role = role;
    await this.usersRepository.save(user);
    return this.toUserPayload(user);
  }

  // Promotion ADMIN (usage interne / seed)
  async promoteToAdmin(id: string): Promise<void> {
    await this.updateRole(id, Role.ADMIN);
  }
}
