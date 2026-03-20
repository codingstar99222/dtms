// backend/src/modules/financial/financial.controller.ts
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
} from '@nestjs/common';
import { FinancialService } from './financial.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  DateRangeDto,
  TransactionResponseDto,
} from './dto/financial.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('transactions')
  @Roles(Role.ADMIN)
  async createTransaction(
    @Request() req: RequestWithUser,
    @Body() createDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.financialService.create(req.user.id, req.user.role, createDto);
  }

  @Get('transactions')
  async getTransactions(
    @Request() req: RequestWithUser,
    @Query() dateRange?: DateRangeDto,
  ): Promise<TransactionResponseDto[]> {
    return this.financialService.findAll(req.user.id, req.user.role, dateRange);
  }

  @Get('transactions/:id')
  async getTransaction(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    return this.financialService.findOne(id, req.user.id, req.user.role);
  }

  @Patch('transactions/:id')
  @Roles(Role.ADMIN)
  async updateTransaction(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.financialService.update(
      id,
      req.user.id,
      req.user.role,
      updateDto,
    );
  }

  @Delete('transactions/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTransaction(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.financialService.remove(id, req.user.role);
  }

  @Get('summary/me')
  async getMySummary(
    @Request() req: RequestWithUser,
    @Query() dateRange?: DateRangeDto,
  ) {
    return this.financialService.getUserSummary(req.user.id, dateRange);
  }

  @Get('summary/user/:userId')
  @Roles(Role.ADMIN)
  async getUserSummary(
    @Param('userId') userId: string,
    @Query() dateRange?: DateRangeDto,
  ) {
    return this.financialService.getUserSummary(userId, dateRange);
  }
}
