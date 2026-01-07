import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @Get()
  findAll() {
    return this.auditService.findAll();
  }
}
