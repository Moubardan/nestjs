import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from '../../tasks/tasks.service';
import { UserPayload } from '../../users/user.model';

@Injectable()
export class IsOwnerGuard implements CanActivate {
  constructor(private readonly tasksService: TasksService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user: UserPayload }>();

    // request.user est peuplé par JwtAuthGuard (via JwtStrategy.validate())
    // IsOwnerGuard doit toujours être utilisé APRÈS JwtAuthGuard
    const currentUser = request.user;
    if (!currentUser) {
      throw new UnauthorizedException('Authentication required');
    }

    const taskId = request.params['id'];
    const task = await this.tasksService.findById(taskId); // lève 404 si inexistante

    if (task.ownerId !== currentUser.id) {
      throw new ForbiddenException('You can only modify your own tasks');
    }

    return true;
  }
}
