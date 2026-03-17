// backend/src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponse } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    console.log('========== REGISTRATION ATTEMPT ==========');
    console.log('1. Received data:', registerDto);
    const { email, password, name, role } = registerDto;
    try {
      // Check if user exists
      console.log('2. Checking if user exists:', email);
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      console.log('3. Existing user?', existingUser ? 'Yes' : 'No');
      if (existingUser) {
        console.log('4. User already exists, throwing error');
        throw new ConflictException('User already exists');
      }

      // Hash password
      console.log('5. Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('6. Password hashed successfully');

      // Create user
      console.log('7. Attempting to create user in DB...');
      console.log('   Data to insert:', {
        email,
        name,
        role: role || 'MEMBER',
        password: '[HIDDEN]',
      });
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'MEMBER',
        },
      });

      console.log('8. USER CREATED SUCCESSFULLY!');
      console.log('   User ID:', user.id);
      console.log('   User email:', user.email);

      // Generate JWT
      console.log('9. Generating JWT...');
      const payload = { sub: user.id, email: user.email, role: user.role };
      const token = this.jwtService.sign(payload);

      console.log('10. JWT generated');
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      console.log('!!!!!!!!!! REGISTRATION ERROR !!!!!!!!!!');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('Error type:', error.constructor.name);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('Error message:', error.message);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('Error stack:', error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }
}
