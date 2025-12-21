import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { SearchService, SearchResult } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async search(
    @Query('q') query: string,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ results: SearchResult[]; userId: string }> {
    const results = await this.searchService.searchAll(
      user.userId,
      query || '',
    );

    return { results, userId: user.userId };
  }
}

