// backend/src/modules/blog/blog.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  BlogFilterDto,
} from './dto/blog.dto';
import { Role, BlogCategory } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('blog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() createDto: CreateBlogPostDto,
  ) {
    return this.blogService.create(req.user.id, createDto);
  }

  @Get()
  async findAll(@Query() filter?: BlogFilterDto) {
    return this.blogService.findAll(filter);
  }

  @Get('popular')
  async getPopularPosts(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.blogService.getPopularPosts(limit);
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: BlogCategory) {
    return this.blogService.findByCategory(category);
  }

  @Get('user/:userId')
  async getUserPosts(@Param('userId') userId: string) {
    return this.blogService.getUserPosts(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateBlogPostDto,
  ) {
    return this.blogService.update(id, req.user.id, req.user.role, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.blogService.remove(id, req.user.id, req.user.role);
  }
}
