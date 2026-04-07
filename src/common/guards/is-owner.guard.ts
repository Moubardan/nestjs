
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from '../../tasks/tasks.service';

@Injectable()
export class IsOwnerGuard implements CanActivate {
  constructor(private readonly tasksService: TasksService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const currentUserId = request.headers['x-user-id'] as string;

    if (!currentUserId) {
      throw new ForbiddenException('Missing X-User-Id header');
    }

    const taskId = request.params['id'];
    const task = this.tasksService.findById(taskId); // lève 404 si inexistante

    if (task.ownerId !== currentUserId) {
      throw new ForbiddenException(
        'You can only modify your own tasks',
      );
    }

    return true;
  }
}
