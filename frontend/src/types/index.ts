// frontend/src/types/index.ts
export type Role = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

// Reports
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Report {
  id: string;
  userId: string;
  userName: string;
  date: string;
  content: string;
  status: ReportStatus;
  reason?: string;
  submittedAt: string;
  approvedAt?: string;
  version: number;
  canEdit: boolean;
  canDelete: boolean;
}

// Tasks
export type TaskStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  assigneeName?: string;
  creatorId: string;
  creatorName: string;
  client?: string;
  rate?: number;
  budget?: number;
  hoursWorked: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
}

// Blog
export type BlogCategory = 'TUTORIAL' | 'TIP' | 'RESOURCE' | 'CODE_SNIPPET' | 'EXPERIENCE';

export interface BlogPost {
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
  publishedAt: string;
  updatedAt: string;
}

// Financial
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  amount: number;
  description: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

// Time Tracking
export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  taskId?: string;
  taskTitle?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
}

export interface ActiveTimer {
  isActive: boolean;
  entry?: TimeEntry;
  elapsedMinutes?: number;
}

// Dashboard
export interface DashboardOverview {
  totalMembers: number;
  activeMembers: number;
  pendingReports: number;
  activeTasks: number;
  totalEarnings: number;
  totalExpenses: number;
  netBalance: number;
  totalHours: number;
}

export interface TrendPoint {
  date: string;
  reports: number;
  tasks: number;
  hours: number;
  income: number;
}

export interface MonthlyTrend {
  month: string;
  reports: number;
  tasks: number;
  hours: number;
  income: number;
  expenses: number;
  net: number;
}

export interface Activity {
  id: string;
  type: 'report' | 'task' | 'blog' | 'time' | 'financial';
  action: string;
  userName: string;
  userId: string;
  description: string;
  timestamp: string;
  link?: string;
}

export interface DashboardSummary {
  overview: DashboardOverview;
  trends: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: MonthlyTrend[];
  };
  recentActivities: Activity[];
}
