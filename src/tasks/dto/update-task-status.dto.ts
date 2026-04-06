
import { IsEnum } from 'class-validator';
import { TaskStatus } from '../task.model';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus, {
    message: `Le statut doit être l'une des valeurs : ${Object.values(TaskStatus).join(', ')}`,
  })
  status: TaskStatus;
}
