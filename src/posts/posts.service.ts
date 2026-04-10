import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPayload } from '../users/user.model';
import { UserEntity } from '../users/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { CommentEntity } from './comment.entity';
import { PostEntity } from './post.entity';
import { PaginatedPosts, PostStatus } from './post.model';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentsRepository: Repository<CommentEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async createPost(dto: CreatePostDto, user: UserPayload): Promise<PostEntity> {
    const author = await this.usersRepository.findOne({ where: { id: user.id } });
    if (!author) {
      throw new NotFoundException(`User with id "${user.id}" not found`);
    }

    const post = this.postsRepository.create({
      title: dto.title,
      content: dto.content,
      status: dto.status ?? PostStatus.DRAFT,
      authorId: author.id,
    });

    return this.postsRepository.save(post);
  }

  async findAll(query: GetPostsQueryDto): Promise<PaginatedPosts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.comments', 'comments')
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      queryBuilder.andWhere('post.status = :status', { status: query.status });
    }

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'comments', 'comments.author'],
    });

    if (!post) {
      throw new NotFoundException(`Post with id "${id}" not found`);
    }

    return post;
  }

  async createComment(postId: string, dto: CreateCommentDto, user: UserPayload): Promise<CommentEntity> {
    const [post, author] = await Promise.all([
      this.postsRepository.findOne({ where: { id: postId } }),
      this.usersRepository.findOne({ where: { id: user.id } }),
    ]);

    if (!post) {
      throw new NotFoundException(`Post with id "${postId}" not found`);
    }

    if (!author) {
      throw new NotFoundException(`User with id "${user.id}" not found`);
    }

    const comment = this.commentsRepository.create({
      body: dto.body,
      postId: post.id,
      authorId: author.id,
    });

    return this.commentsRepository.save(comment);
  }
}