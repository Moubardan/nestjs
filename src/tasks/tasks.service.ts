
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  // Filtre optionnel par status et/ou recherche textuelle dans title/description
  findAll(filterDto?: GetTasksFilterDto): Task[] {
    let tasks = [...this.tasks];

    if (filterDto?.status) {
      tasks = tasks.filter((t) => t.status === filterDto.status);
    }

    if (filterDto?.search) {
      const search = filterDto.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search),
      );
    }

    return tasks;
  }

  findById(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    return task;
  }

  create(dto: CreateTaskDto, ownerId: string): Task {
    const task: Task = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description,
      status: TaskStatus.OPEN,
      ownerId,
      ...(dto.notes !== undefined && { notes: dto.notes }),
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
