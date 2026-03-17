// frontend/src/services/blog.service.ts
import api from "./api";
import type { BlogPost } from "../types";

export type BlogCategory =
  | "TUTORIAL"
  | "TIP"
  | "RESOURCE"
  | "CODE_SNIPPET"
  | "EXPERIENCE";

export interface CreateBlogPostDto {
  title: string;
  content: string;
  category: BlogCategory;
  tags?: string[];
  url?: string;
  codeSnippet?: string;
}

export interface UpdateBlogPostDto {
  title?: string;
  content?: string;
  category?: BlogCategory;
  tags?: string[];
  url?: string;
  codeSnippet?: string;
}

export interface BlogFilterDto {
  category?: BlogCategory;
  tag?: string;
  search?: string;
}

export const blogService = {
  async create(data: CreateBlogPostDto): Promise<BlogPost> {
    const response = await api.post<BlogPost>("/blog", data);
    return response.data;
  },

  async findAll(filter?: BlogFilterDto): Promise<BlogPost[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.category) params.append("category", filter.category);
      if (filter.tag) params.append("tag", filter.tag);
      if (filter.search) params.append("search", filter.search);
    }

    const response = await api.get<BlogPost[]>(`/blog?${params.toString()}`);
    return response.data;
  },

  async findOne(id: string): Promise<BlogPost> {
    const response = await api.get<BlogPost>(`/blog/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateBlogPostDto): Promise<BlogPost> {
    const response = await api.patch<BlogPost>(`/blog/${id}`, data);
    return response.data;
  },

  async findByCategory(category: BlogCategory): Promise<BlogPost[]> {
    const response = await api.get<BlogPost[]>(`/blog/category/${category}`);
    return response.data;
  },

  async getPopularPosts(limit: number = 5): Promise<BlogPost[]> {
    const response = await api.get<BlogPost[]>(`/blog/popular?limit=${limit}`);
    return response.data;
  },

  async getUserPosts(userId: string): Promise<BlogPost[]> {
    const response = await api.get<BlogPost[]>(`/blog/user/${userId}`);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/blog/${id}`);
  },
};
