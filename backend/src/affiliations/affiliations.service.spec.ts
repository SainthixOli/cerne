import { Test, TestingModule } from '@nestjs/testing';
import { AffiliationsService } from './affiliations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AffiliationsService', () => {
  let service: AffiliationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffiliationsService,
        {
          provide: PrismaService,
          useValue: {
            affiliation: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            }
          }
        }
      ],
    }).compile();

    service = module.get<AffiliationsService>(AffiliationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
