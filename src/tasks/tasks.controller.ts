import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Headers,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { IsOwnerGuard } from '../common/guards/is-owner.guard';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // GET /tasks?status=OPEN&search=nest
  @Get()
  findAll(@Query() filterDto: GetTasksFilterDto): Task[] {
    return this.tasksService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Task {
    return this.tasksService.findById(id);
  }

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Headers('x-user-id') userId: string,
  ): Task {
    return this.tasksService.create(createTaskDto, userId ?? 'anonymous');
  }

  @Patch(':id/status')
  @UseGuards(IsOwnerGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ): Task {
    return this.tasksService.updateStatus(id, updateTaskStatusDto);
  }

  @Delete(':id')
  @UseGuards(IsOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.tasksService.remove(id);
  }
}
