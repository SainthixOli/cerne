import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('SystemController', () => {
  let controller: SystemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            user: { count: jest.fn() },
            affiliation: { count: jest.fn() },
            document: { count: jest.fn() },
          }
        }
      ]
    }).compile();

    controller = module.get<SystemController>(SystemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
