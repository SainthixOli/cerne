import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDocumentDto {
    @IsNotEmpty()
    @IsString()
    type: string; // "rg", "cpf", "address_proof"
}
