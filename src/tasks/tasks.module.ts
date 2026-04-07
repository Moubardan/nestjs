import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { IsOwnerGuard } from '../common/guards/is-owner.guard';

@Module({
  controllers: [TasksController],
  providers: [TasksService, IsOwnerGuard],
})
export class TasksModule {}
