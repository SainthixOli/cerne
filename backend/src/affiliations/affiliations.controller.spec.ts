import { Test, TestingModule } from '@nestjs/testing';
import { AffiliationsController } from './affiliations.controller';
import { AffiliationsService } from './affiliations.service';

describe('AffiliationsController', () => {
  let controller: AffiliationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffiliationsController],
      providers: [
        {
          provide: AffiliationsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          }
        }
      ],
    }).compile();

    controller = module.get<AffiliationsController>(AffiliationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
