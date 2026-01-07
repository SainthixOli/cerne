import { Injectable } from '@nestjs/common';
import { CreateAffiliationDto } from './dto/create-affiliation.dto';
import { UpdateAffiliationDto } from './dto/update-affiliation.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AffiliationsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createAffiliationDto: CreateAffiliationDto) {
    return this.prisma.affiliation.create({
      data: {
        userId,
        status: 'pending',
        ...createAffiliationDto,
      },
    });
  }

  async findAll() {
    const affiliations = await this.prisma.affiliation.findMany({
      include: {
        user: {
          include: {
            profile: true,
            documents: true // Include documents to find PDF
          }
        }
      },
    });

    return affiliations.map(aff => {
      // Find the affiliation document if exists
      const doc = aff.user?.documents?.find(d => d.type === 'affiliation_form' || d.type === 'pdf') || aff.user?.documents?.[0]; // Fallback

      return {
        id: aff.id,
        user_id: aff.userId,
        nome: aff.user?.name || 'Sem Nome',
        cpf: aff.user?.profile?.cpf || '',
        data_solicitacao: aff.requestDate,
        status: aff.status,
        status_conta: aff.status === 'approved' || aff.status === 'concluido' ? 'aprovado' : 'pendente_docs', // Mock logic
        url_arquivo: doc ? doc.filePath : null,
        total_requests: 1
      };
    });
  }

  async findOne(id: string) {
    return this.prisma.affiliation.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async update(id: string, updateAffiliationDto: UpdateAffiliationDto) {
    return this.prisma.affiliation.update({
      where: { id },
      data: updateAffiliationDto,
    });
  }

  async remove(id: string) {
    return this.prisma.affiliation.delete({ where: { id } });
  }
}
