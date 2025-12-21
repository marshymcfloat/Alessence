import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateNoteDTO, UpdateNoteDTO } from '@repo/types/nest';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { NoteService } from './note.service';
import { Note } from '@repo/db';

@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAll(
    @GetUser() user: AuthenticatedUser,
    @Query('search') search?: string,
  ): Promise<{ notes: Note[]; userId: string }> {
    const notes = search
      ? await this.noteService.search(user.userId, search)
      : await this.noteService.getAll(user.userId);

    return { notes, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getById(
    @Param('id') id: number,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ note: Note; userId: string }> {
    const note = await this.noteService.getById(+id, user.userId);

    return { note, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createNoteDto: CreateNoteDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ note: Note; userId: string }> {
    const note = await this.noteService.create(createNoteDto, user.userId);

    return { note, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateNoteDto: UpdateNoteDTO,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ note: Note; userId: string }> {
    const note = await this.noteService.update(+id, updateNoteDto, user.userId);

    return { note, userId: user.userId };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(
    @Param('id') id: number,
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.noteService.delete(+id, user.userId);
    return { success: true };
  }
}

