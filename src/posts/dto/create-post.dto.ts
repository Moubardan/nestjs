import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PostStatus } from '../post.model';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @IsOptional()
  @IsEnum(PostStatus, {
    message: `status must be one of: ${Object.values(PostStatus).join(', ')}`,
  })
  status?: PostStatus;
}