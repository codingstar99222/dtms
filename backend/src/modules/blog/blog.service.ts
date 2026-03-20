// backend/src/modules/blog/blog.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  BlogPostResponseDto,
  BlogFilterDto,
} from './dto/blog.dto';
import { BlogCategory, Role, Prisma } from '@prisma/client';

interface BlogPostWithAuthor {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: BlogCategory;
  tags: string;
  url: string | null;
  codeSnippet: string | null;
  views: number;
  publishedAt: Date;
  updatedAt: Date;
  user: {
    name: string;
  };
}

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createDto: CreateBlogPostDto,
  ): Promise<BlogPostResponseDto> {
    const { title, content, category, tags, url, codeSnippet } = createDto;
    if (category === 'RESOURCE' && !url) {
      throw new BadRequestException(
        'URL is required for RESOURCE category posts',
      );
    }
    const post = await this.prisma.blogPost.create({
      data: {
        userId,
        title,
        content,
        category,
        tags: JSON.stringify(tags || []),
        url,
        codeSnippet,
        views: 0,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(post as BlogPostWithAuthor);
  }

  async findAll(filter?: BlogFilterDto): Promise<BlogPostResponseDto[]> {
    const where: Prisma.BlogPostWhereInput = {};

    if (filter) {
      if (filter.category) {
        where.category = filter.category;
      }

      if (filter.tag) {
        where.tags = { contains: filter.tag };
      }

      if (filter.search) {
        where.OR = [
          { title: { contains: filter.search } },
          { content: { contains: filter.search } },
        ];
      }
    }

    const posts = await this.prisma.blogPost.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return (posts as BlogPostWithAuthor[]).map((post) =>
      this.toResponseDto(post),
    );
  }

  async findOne(id: string): Promise<BlogPostResponseDto> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    // Increment view count
    const updatedPost = await this.prisma.blogPost.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(updatedPost as BlogPostWithAuthor);
  }

  async update(
    id: string,
    userId: string,
    userRole: Role,
    updateDto: UpdateBlogPostDto,
  ): Promise<BlogPostResponseDto> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    // Only author or admin can update
    if (userRole !== Role.ADMIN && post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const category = updateDto.category || post.category;
    if (category === 'RESOURCE' && updateDto.url === '') {
      throw new BadRequestException(
        'URL cannot be empty for RESOURCE category posts',
      );
    }
    const updateData: Prisma.BlogPostUpdateInput = {};

    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.content !== undefined) updateData.content = updateDto.content;
    if (updateDto.category !== undefined)
      updateData.category = updateDto.category;
    if (updateDto.url !== undefined) updateData.url = updateDto.url;
    if (updateDto.codeSnippet !== undefined)
      updateData.codeSnippet = updateDto.codeSnippet;

    if (updateDto.tags !== undefined) {
      updateData.tags = JSON.stringify(updateDto.tags);
    }

    const updatedPost = await this.prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return this.toResponseDto(updatedPost as BlogPostWithAuthor);
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    // Only author or admin can delete
    if (userRole !== Role.ADMIN && post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.blogPost.delete({
      where: { id },
    });
  }

  async findByCategory(category: BlogCategory): Promise<BlogPostResponseDto[]> {
    const posts = await this.prisma.blogPost.findMany({
      where: { category },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return (posts as BlogPostWithAuthor[]).map((post) =>
      this.toResponseDto(post),
    );
  }

  async getPopularPosts(limit: number = 5): Promise<BlogPostResponseDto[]> {
    const posts = await this.prisma.blogPost.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { views: 'desc' },
      take: limit,
    });

    return (posts as BlogPostWithAuthor[]).map((post) =>
      this.toResponseDto(post),
    );
  }

  async getUserPosts(userId: string): Promise<BlogPostResponseDto[]> {
    const posts = await this.prisma.blogPost.findMany({
      where: { userId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return (posts as BlogPostWithAuthor[]).map((post) =>
      this.toResponseDto(post),
    );
  }

  private toResponseDto(post: BlogPostWithAuthor): BlogPostResponseDto {
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(post.tags || '[]') as string[];
    } catch {
      parsedTags = [];
    }

    return {
      id: post.id,
      userId: post.userId,
      authorName: post.user.name,
      title: post.title,
      content: post.content,
      category: post.category,
      tags: parsedTags,
      url: post.url || undefined,
      codeSnippet: post.codeSnippet || undefined,
      views: post.views,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    };
  }
}
