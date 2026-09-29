# Plano de importação SQLite → PostgreSQL

Este plano não autoriza nem executa a migração de dados reais. A execução exige aprovação explícita, backup verificado e uma janela de manutenção.

## Pré-condições

1. Colocar a aplicação em modo somente leitura e registrar o horário de corte.
2. Criar uma cópia binária do SQLite e validar que ela abre com `PRAGMA integrity_check` em uma máquina isolada.
3. Registrar tamanho e SHA-256 da cópia; nunca trabalhar sobre o arquivo operacional.
4. Criar um PostgreSQL vazio e descartável, executar `knex migrate:latest` e guardar o snapshot do schema.
5. Executar o preflight da Fase 2. Registros órfãos, tenant ausente, vínculo ambíguo ou relação cross-tenant bloqueiam a importação; nada é atribuído ao tenant 1.

## Extração e carga

1. Exportar cada tabela em ordem determinística, com colunas explícitas e linhas ordenadas pela chave primária.
2. Normalizar apenas a representação técnica durante o transporte: booleanos, timestamps UTC e `NULL`. Não corrigir conteúdo silenciosamente.
3. Calcular por tabela:
   - total de linhas;
   - total por tenant;
   - mínimos e máximos das chaves;
   - SHA-256 do fluxo canônico de linhas;
   - quantidade de valores nulos por coluna obrigatória.
4. Carregar primeiro `tenants`, depois `profiles` e, em seguida, as tabelas dependentes segundo as foreign keys. A carga ocorre em transações por lote e falha por inteiro em qualquer violação.
5. Ajustar sequences PostgreSQL para `MAX(id) + 1` somente depois da reconciliação das tabelas com IDs numéricos.

## Reconciliação obrigatória

Comparar origem e destino por tabela e por tenant:

- contagem total e contagem por tenant;
- checksum canônico de todas as colunas importadas;
- chaves ausentes e excedentes em ambas as direções;
- contagens de status/roles;
- órfãos e relações cross-tenant (devem ser zero);
- unicidades compostas e protocolos duplicados;
- documentos cujo objeto local não existe, relatados sem copiar uploads automaticamente.

Depois, executar amostragem determinística por hash de chave, testes funcionais em modo somente leitura e toda a suíte PostgreSQL/RLS. Divergência interrompe a promoção.

## Promoção e retorno

1. Guardar relatório assinado com hashes, contagens e decisões humanas.
2. Trocar a conexão somente após aprovação; não habilitar dual-write.
3. Manter o SQLite original imutável e offline durante a retenção acordada.
4. Se a validação pós-corte falhar, restaurar a configuração anterior e descartar o PostgreSQL de destino; não tentar mesclar escritas parciais.
