import { BadRequestException, Injectable } from '@nestjs/common';
import { Subject } from '@repo/db';
import { CreateSubjectDTO } from '@repo/types/nest';
import { capitalizeString } from '@repo/utils';
import { DbService } from 'src/db/db.service';

@Injectable()
export class SubjectService {
  constructor(private readonly dbService: DbService) {}

  async create(createSubjectDTO: CreateSubjectDTO): Promise<Subject> {
    const { title, description, semester } = createSubjectDTO;
    try {
      const capitalizeTitle = capitalizeString(title);

      if (!capitalizeTitle) {
        throw new BadRequestException('Please pass a valid subject title');
      }

      const newSubject = await this.dbService.subject.create({
        data: { title: capitalizeTitle, description, sem: semester },
      });

      if (!newSubject) {
        throw new BadRequestException();
      }

      return newSubject;
    } catch (error) {
      console.error(
        'There is unexpected error occured while attempting to create new subject',
      );
      throw new Error(
        'There is unpxected error occured while attempting to create new subject',
      );
    }
  }
}
