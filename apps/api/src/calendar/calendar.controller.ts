import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('events')
  async getEvents(
    @Query('start') start: string,
    @Query('end') end: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date();
    
    // Default to current month if not provided
    if (!start || !end) {
      const now = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    const events = await this.calendarService.getCalendarEvents(
      user.userId,
      startDate,
      endDate,
    );

    return { events, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('events/date')
  async getEventsForDate(
    @Query('date') date: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    const events = await this.calendarService.getEventsForDate(
      user.userId,
      targetDate,
    );

    return { events, userId: user.userId };
  }
}

