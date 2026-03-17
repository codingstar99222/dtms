// backend/src/modules/blog/dto/blog.dto.ts
import { IsString, IsEnum, IsOptional, IsArray, IsUrl } from 'class-validator';
import { BlogCategory } from '@prisma/client';

export class CreateBlogPostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(BlogCategory)
  category: BlogCategory;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  codeSnippet?: string;
}

export class UpdateBlogPostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(BlogCategory)
  @IsOptional()
  category?: BlogCategory;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  codeSnippet?: string;
}

export class BlogPostResponseDto {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  content: string;
  category: BlogCategory;
  tags: string[];
  url?: string;
  codeSnippet?: string;
  views: number;
  publishedAt: Date;
  updatedAt: Date;
}

export class BlogFilterDto {
  @IsEnum(BlogCategory)
  @IsOptional()
  category?: BlogCategory;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
