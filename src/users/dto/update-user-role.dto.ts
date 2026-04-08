import { IsEnum } from 'class-validator';
import { Role } from '../user.model';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;
}