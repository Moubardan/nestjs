
import { IsEnum } from 'class-validator';
import { TaskStatus } from '../task.model';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus, {
    message: `status must be one of: ${Object.values(TaskStatus).join(', ')}`,

  })
  status: TaskStatus;
}
