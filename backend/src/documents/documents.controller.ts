import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Request() req: any, @Body() createDocumentDto: CreateDocumentDto, @UploadedFile() file: Express.Multer.File) {
    return this.documentsService.create(req.user.userId, file, createDocumentDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.documentsService.findAll(req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
