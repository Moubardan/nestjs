
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  findAll(): Task[] {
    return this.tasks;
  }

  findById(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);

    if (!task) {
      throw new NotFoundException(`Task avec l'id "${id}" introuvable`);
    }

    return task;
  }

  create(dto: CreateTaskDto): Task {
    const task: Task = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description,
      status: TaskStatus.OPEN, 
    };

    this.tasks.push(task);
    return task;
  }

  updateStatus(id: string, dto: UpdateTaskStatusDto): Task {
    const task = this.findById(id); 
    task.status = dto.status;
    return task;
  }

  remove(id: string): void {
    this.findById(id); 
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }
}
