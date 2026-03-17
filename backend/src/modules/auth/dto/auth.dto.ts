// backend/src/modules/auth/dto/auth.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}
