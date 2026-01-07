import { PartialType } from '@nestjs/mapped-types';
import { CreateAffiliationDto } from './create-affiliation.dto';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateAffiliationDto extends PartialType(CreateAffiliationDto) {
    @IsOptional()
    @IsString()
    @IsIn(['pending', 'approved', 'rejected', 'suspended'])
    status?: string;

    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
