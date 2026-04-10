import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasksRepository: Repository<TaskEntity>,
  ) {}

  async findAll(filterDto?: GetTasksFilterDto): Promise<TaskEntity[]> {
    const query = this.tasksRepository.createQueryBuilder('task');

    if (filterDto?.status) {
      query.andWhere('task.status = :status', { status: filterDto.status });
    }

    if (filterDto?.search) {
      query.andWhere(
        '(LOWER(task.title) LIKE :search OR LOWER(task.description) LIKE :search)',
        { search: `%${filterDto.search.toLowerCase()}%` },
      );
    }

    return query.getMany();
  }

  async findById(id: string): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    return task;
  }

  async create(dto: CreateTaskDto, ownerId: string): Promise<TaskEntity> {
    const task = this.tasksRepository.create({
      title: dto.title,
      description: dto.description,
      status: TaskStatus.OPEN,
      ownerId,
      notes: dto.notes ?? null,
    });

    return this.tasksRepository.save(task);
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto): Promise<TaskEntity> {
    const task = await this.findById(id);
    task.status = dto.status;
    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.tasksRepository.delete(id);
  }
}
