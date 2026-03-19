// backend/src/common/services/time.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TimeService {
  private timeZone: string;
  private offsetHours: number = 0;
  private offsetMinutes: number = 0;

  constructor(private configService: ConfigService) {
    this.timeZone = this.configService.get<string>('TIME_ZONE') || 'UTC';

    const offset = this.configService.get<string>('TIME_ZONE_OFFSET');
    if (offset) {
      const match = offset.match(/([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        this.offsetHours = sign * parseInt(match[2], 10);
        this.offsetMinutes = sign * parseInt(match[3], 10);
      }
    }
  }

  // === FOR CALENDAR DATES (Reports, Deadlines) ===

  createDateString(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  parseDateString(dateStr: string): {
    year: number;
    month: number;
    day: number;
  } {
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month, day };
  }

  formatDate(date: Date): string {
    if (!date) return '';
    // Use UTC methods to avoid timezone shifts
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayString(): string {
    const now = new Date();
    return this.createDateString(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
    );
  }

  getDateRangeStrings(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();
    console.log('Today in UTC:', today.toISOString().split('T')[0]);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      dates.push(
        this.createDateString(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          date.getUTCDate(),
        ),
      );
    }
    console.log('Date range:', dates);
    return dates;
  }

  // === FOR TIMESTAMPS (Time Tracking, Approvals) ===

  now(): Date {
    return new Date(); // Always UTC in Node.js
  }

  formatForDisplay(utcDate: Date, includeTime: boolean = true): string {
    if (!utcDate) return '';

    // Apply configured offset for display
    const localTime =
      utcDate.getTime() +
      this.offsetHours * 3600000 +
      this.offsetMinutes * 60000;
    const localDate = new Date(localTime);

    if (includeTime) {
      return localDate.toISOString().replace('T', ' ').substring(0, 19);
    }
    return localDate.toISOString().split('T')[0];
  }

  // === FOR BUSINESS LOGIC ===

  isSameDay(date1: Date, date2: Date): boolean {
    return this.formatDate(date1) === this.formatDate(date2);
  }

  daysBetween(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  }

  startOfDay(date: Date): Date {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  endOfDay(date: Date): Date {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  }
}
