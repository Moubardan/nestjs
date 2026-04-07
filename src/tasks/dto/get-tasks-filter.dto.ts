import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskStatus } from '../task.model';

export class GetTasksFilterDto {
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `status must be one of: ${Object.values(TaskStatus).join(', ')}`,

  })
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
