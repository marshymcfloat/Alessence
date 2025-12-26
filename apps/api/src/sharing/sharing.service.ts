import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FriendshipStatusEnum, SharePermission } from '@repo/db';

export interface SharedItem {
  id: number;
  permission: SharePermission;
  createdAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SharedFileItem extends SharedItem {
  file: {
    id: number;
    name: string;
    type: string;
    fileUrl: string;
  };
}

export interface SharedNoteItem extends SharedItem {
  note: {
    id: number;
    title: string;
    content: string;
    isMarkdown: boolean;
  };
}

export interface SharedDeckItem extends SharedItem {
  deck: {
    id: number;
    title: string;
    description: string | null;
    _count: { cards: number };
  };
}

@Injectable()
export class SharingService {
  constructor(private readonly dbService: DbService) {}

  /**
   * Check if two users are friends
   */
  private async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.dbService.friendship.findFirst({
      where: {
        status: FriendshipStatusEnum.ACCEPTED,
        OR: [
          { requesterId: userId1, addresseeId: userId2 },
          { requesterId: userId2, addresseeId: userId1 },
        ],
      },
    });
    return !!friendship;
  }

  // ==================== FILE SHARING ====================

  /**
   * Share a file with a friend
   */
  async shareFile(
    fileId: number,
    ownerId: string,
    recipientId: string,
    permission: SharePermission = SharePermission.VIEW,
  ) {
    // Check if file exists and belongs to the owner
    const file = await this.dbService.file.findFirst({
      where: { id: fileId, userId: ownerId },
    });

    if (!file) {
      throw new NotFoundException('File not found or you do not own it.');
    }

    // Check if they are friends
    const areFriends = await this.areFriends(ownerId, recipientId);
    if (!areFriends) {
      throw new ForbiddenException('You can only share with friends.');
    }

    // Check if already shared
    const existing = await this.dbService.sharedFile.findUnique({
      where: { fileId_recipientId: { fileId, recipientId } },
    });

    if (existing) {
      throw new BadRequestException('File already shared with this user.');
    }

    return this.dbService.sharedFile.create({
      data: { fileId, ownerId, recipientId, permission },
      include: {
        file: { select: { id: true, name: true, type: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Unshare a file
   */
  async unshareFile(shareId: number, ownerId: string) {
    const shared = await this.dbService.sharedFile.findFirst({
      where: { id: shareId, ownerId },
    });

    if (!shared) {
      throw new NotFoundException('Shared file not found.');
    }

    await this.dbService.sharedFile.delete({ where: { id: shareId } });
  }

  /**
   * Get files shared with me
   */
  async getFilesSharedWithMe(userId: string): Promise<SharedFileItem[]> {
    const shared = await this.dbService.sharedFile.findMany({
      where: { recipientId: userId },
      include: {
        file: { select: { id: true, name: true, type: true, fileUrl: true } },
        owner: { select: { id: true, name: true, email: true, profilePicture: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shared.map((s) => ({
      id: s.id,
      permission: s.permission,
      createdAt: s.createdAt,
      owner: s.owner,
      file: s.file,
    }));
  }

  /**
   * Get files I have shared
   */
  async getFilesSharedByMe(userId: string) {
    return this.dbService.sharedFile.findMany({
      where: { ownerId: userId },
      include: {
        file: { select: { id: true, name: true, type: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== NOTE SHARING ====================

  /**
   * Share a note with a friend
   */
  async shareNote(
    noteId: number,
    ownerId: string,
    recipientId: string,
    permission: SharePermission = SharePermission.VIEW,
  ) {
    const note = await this.dbService.note.findFirst({
      where: { id: noteId, userId: ownerId },
    });

    if (!note) {
      throw new NotFoundException('Note not found or you do not own it.');
    }

    const areFriends = await this.areFriends(ownerId, recipientId);
    if (!areFriends) {
      throw new ForbiddenException('You can only share with friends.');
    }

    const existing = await this.dbService.sharedNote.findUnique({
      where: { noteId_recipientId: { noteId, recipientId } },
    });

    if (existing) {
      throw new BadRequestException('Note already shared with this user.');
    }

    return this.dbService.sharedNote.create({
      data: { noteId, ownerId, recipientId, permission },
      include: {
        note: { select: { id: true, title: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Unshare a note
   */
  async unshareNote(shareId: number, ownerId: string) {
    const shared = await this.dbService.sharedNote.findFirst({
      where: { id: shareId, ownerId },
    });

    if (!shared) {
      throw new NotFoundException('Shared note not found.');
    }

    await this.dbService.sharedNote.delete({ where: { id: shareId } });
  }

  /**
   * Get notes shared with me
   */
  async getNotesSharedWithMe(userId: string): Promise<SharedNoteItem[]> {
    const shared = await this.dbService.sharedNote.findMany({
      where: { recipientId: userId },
      include: {
        note: { select: { id: true, title: true, content: true, isMarkdown: true } },
        owner: { select: { id: true, name: true, email: true, profilePicture: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shared.map((s) => ({
      id: s.id,
      permission: s.permission,
      createdAt: s.createdAt,
      owner: s.owner,
      note: s.note,
    }));
  }

  /**
   * Get notes I have shared
   */
  async getNotesSharedByMe(userId: string) {
    return this.dbService.sharedNote.findMany({
      where: { ownerId: userId },
      include: {
        note: { select: { id: true, title: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== FLASHCARD DECK SHARING ====================

  /**
   * Share a flashcard deck with a friend
   */
  async shareDeck(
    deckId: number,
    ownerId: string,
    recipientId: string,
    permission: SharePermission = SharePermission.VIEW,
  ) {
    const deck = await this.dbService.flashcardDeck.findFirst({
      where: { id: deckId, userId: ownerId },
    });

    if (!deck) {
      throw new NotFoundException('Deck not found or you do not own it.');
    }

    const areFriends = await this.areFriends(ownerId, recipientId);
    if (!areFriends) {
      throw new ForbiddenException('You can only share with friends.');
    }

    const existing = await this.dbService.sharedFlashcardDeck.findUnique({
      where: { deckId_recipientId: { deckId, recipientId } },
    });

    if (existing) {
      throw new BadRequestException('Deck already shared with this user.');
    }

    return this.dbService.sharedFlashcardDeck.create({
      data: { deckId, ownerId, recipientId, permission },
      include: {
        deck: { select: { id: true, title: true, description: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Unshare a deck
   */
  async unshareDeck(shareId: number, ownerId: string) {
    const shared = await this.dbService.sharedFlashcardDeck.findFirst({
      where: { id: shareId, ownerId },
    });

    if (!shared) {
      throw new NotFoundException('Shared deck not found.');
    }

    await this.dbService.sharedFlashcardDeck.delete({ where: { id: shareId } });
  }

  /**
   * Get decks shared with me
   */
  async getDecksSharedWithMe(userId: string): Promise<SharedDeckItem[]> {
    const shared = await this.dbService.sharedFlashcardDeck.findMany({
      where: { recipientId: userId },
      include: {
        deck: {
          select: {
            id: true,
            title: true,
            description: true,
            _count: { select: { cards: true } },
          },
        },
        owner: { select: { id: true, name: true, email: true, profilePicture: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shared.map((s) => ({
      id: s.id,
      permission: s.permission,
      createdAt: s.createdAt,
      owner: s.owner,
      deck: s.deck,
    }));
  }

  /**
   * Get decks I have shared
   */
  async getDecksSharedByMe(userId: string) {
    return this.dbService.sharedFlashcardDeck.findMany({
      where: { ownerId: userId },
      include: {
        deck: { select: { id: true, title: true, description: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Copy a shared deck to my collection
   */
  async copySharedDeck(shareId: number, userId: string, subjectId?: number) {
    const shared = await this.dbService.sharedFlashcardDeck.findFirst({
      where: { id: shareId, recipientId: userId },
      include: {
        deck: { include: { cards: true } },
      },
    });

    if (!shared) {
      throw new NotFoundException('Shared deck not found.');
    }

    if (shared.permission !== SharePermission.COPY) {
      throw new ForbiddenException('You do not have permission to copy this deck.');
    }

    // Create a copy of the deck
    const newDeck = await this.dbService.flashcardDeck.create({
      data: {
        title: `${shared.deck.title} (Copy)`,
        description: shared.deck.description,
        userId,
        subjectId,
        cards: {
          create: shared.deck.cards.map((card) => ({
            front: card.front,
            back: card.back,
            frontImageUrl: card.frontImageUrl,
            backImageUrl: card.backImageUrl,
          })),
        },
      },
      include: {
        _count: { select: { cards: true } },
      },
    });

    return newDeck;
  }

  /**
   * Get all shared content summary
   */
  async getSharedWithMeSummary(userId: string) {
    const [files, notes, decks] = await Promise.all([
      this.dbService.sharedFile.count({ where: { recipientId: userId } }),
      this.dbService.sharedNote.count({ where: { recipientId: userId } }),
      this.dbService.sharedFlashcardDeck.count({ where: { recipientId: userId } }),
    ]);

    return { files, notes, decks, total: files + notes + decks };
  }
}

