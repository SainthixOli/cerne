import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, file: Express.Multer.File, createDocumentDto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        userId,
        type: createDocumentDto.type,
        filePath: file.path,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.document.findMany({ where: { userId } });
  }

  async remove(id: string) {
    return this.prisma.document.delete({ where: { id } });
  }
}
