import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Note, Tag } from '@repo/db';
import { CreateNoteDTO, UpdateNoteDTO } from '@repo/types/nest';
import { DbService } from 'src/db/db.service';

@Injectable()
export class NoteService {
  constructor(private readonly dbService: DbService) {}

  async create(createNoteDto: CreateNoteDTO, userId: string): Promise<Note> {
    const { title, content, isMarkdown, subjectId, fileId, taskId, tagIds } =
      createNoteDto;

    // Create note with relationships
    const note = await this.dbService.note.create({
      data: {
        title,
        content,
        isMarkdown: isMarkdown ?? false,
        subjectId: subjectId ?? null,
        fileId: fileId ?? null,
        taskId: taskId ?? null,
        userId,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return note;
  }

  async getAll(userId: string): Promise<Note[]> {
    const notes = await this.dbService.note.findMany({
      where: {
        userId: userId, // Only return notes owned by this user
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return notes;
  }

  async getById(id: number, userId: string): Promise<Note> {
    const note = await this.dbService.note.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async update(
    id: number,
    updateNoteDto: UpdateNoteDTO,
    userId: string,
  ): Promise<Note> {
    const note = await this.getById(id, userId);

    const { tagIds, ...updateData } = updateNoteDto;

    // Handle tag updates
    if (tagIds !== undefined) {
      // Delete existing tags
      await this.dbService.noteTag.deleteMany({
        where: { noteId: id },
      });

      // Create new tags if provided
      if (tagIds.length > 0) {
        await this.dbService.noteTag.createMany({
          data: tagIds.map((tagId) => ({
            noteId: id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    }

    try {
      const updatedNote = await this.dbService.note.update({
        where: { id },
        data: updateData,
        include: {
          subject: {
            select: {
              id: true,
              title: true,
            },
          },
          file: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return updatedNote;
    } catch (error) {
      console.error('Error updating note', error);
      throw new BadRequestException('Failed to update note');
    }
  }

  async delete(id: number, userId: string): Promise<void> {
    const note = await this.getById(id, userId);

    try {
      await this.dbService.note.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting note', error);
      throw new BadRequestException('Failed to delete note');
    }
  }

  async search(userId: string, query: string): Promise<Note[]> {
    const notes = await this.dbService.note.findMany({
      where: {
        userId,
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return notes;
  }
}
