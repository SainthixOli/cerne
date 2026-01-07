import { Module } from '@nestjs/common';
import { AffiliationsService } from './affiliations.service';
import { AffiliationsController } from './affiliations.controller';

@Module({
  controllers: [AffiliationsController],
  providers: [AffiliationsService],
})
export class AffiliationsModule {}
