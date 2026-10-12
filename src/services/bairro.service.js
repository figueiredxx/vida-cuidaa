// Tabela de correcao dos nomes de bairro vindos do CNES (RF28).
//
// Por que isto existe: a API do Ministerio nao devolve o bairro em forma
// utilizavel. Os 659 estabelecimentos de Manaus chegam com 95 grafias distintas
// para cerca de 63 bairros reais, por quatro motivos somados:
//
//   1. truncamento em 20 caracteres  -> "NOSSA SENHORA DAS GR", "PARQUE 10 DE NOVEMBR"
//   2. erro de digitacao no cadastro -> "ADRIANNOPOLIS", "CHPADA", "CREPO"
//   3. abreviacao                    -> "N SRA DAS GRACAS", "D PEDRO I"
//   4. subdivisao informal           -> "COMPENSA I", "COMPENSA II", "COMPENSA III"
//
// Sem a correcao, o seletor da pagina de servicos ofereceria Adrianopolis quatro
// vezes, uma delas escrita errado. A tabela cobre os 95 valores presentes na
// base, e o teste de cobertura quebra se uma reextracao trouxer valor novo.
//
// A chave e' o valor cru em caixa alta, sem acento e com espacos colapsados; o
// valor e' o nome oficial do bairro, como a pagina exibe.
const BAIRROS_POR_VALOR_DO_CNES = {
    // Zona Centro-Sul e Centro-Oeste
    ADRIANOPOLIS: 'Adrianópolis',
    ADRIANNOPOLIS: 'Adrianópolis',
    ADRIANOPLOLIS: 'Adrianópolis',
    ARIANOPOLIS: 'Adrianópolis',
    ALEIXO: 'Aleixo',
    CHAPADA: 'Chapada',
    CHPADA: 'Chapada',
    FLORES: 'Flores',
    'NOSSA SENHORA DAS GR': 'Nossa Senhora das Graças',
    'NOSSA SENHORA DA GRA': 'Nossa Senhora das Graças',
    'N S DAS GRACAS': 'Nossa Senhora das Graças',
    'N SRA DAS GRACAS': 'Nossa Senhora das Graças',
    'PARQUE 10 DE NOVEMBR': 'Parque 10 de Novembro',
    'PARQUE 10': 'Parque 10 de Novembro',
    'PARQUE DEZ': 'Parque 10 de Novembro',
    'SAO GERALDO': 'São Geraldo',
    'DA PAZ': 'Da Paz',
    'BAIRRO DA PAZ': 'Da Paz',
    'ALVORADA': 'Alvorada',
    'ALVORADA 2': 'Alvorada',
    'ALVORADA I': 'Alvorada',
    'ALVORADA II': 'Alvorada',
    PLANALTO: 'Planalto',
    REDENCAO: 'Redenção',
    'DOM PEDRO I': 'Dom Pedro I',
    'DOM PEDRO': 'Dom Pedro I',
    'D PEDRO I': 'Dom Pedro I',
    'SAO JORGE': 'São Jorge',

    // Zona Sul
    CENTRO: 'Centro',
    CACHOEIRINHA: 'Cachoeirinha',
    EDUCANDOS: 'Educandos',
    'MORRO DA LIBERDADE': 'Morro da Liberdade',
    BETANIA: 'Betânia',
    CRESPO: 'Crespo',
    CREPO: 'Crespo',
    'SAO LAZARO': 'São Lázaro',
    'COLONIA OLIVEIRA MAC': 'Colônia Oliveira Machado',
    'COL OLIVEIRA MACHADO': 'Colônia Oliveira Machado',
    PETROPOLIS: 'Petrópolis',
    RAIZ: 'Raiz',
    JAPIIM: 'Japiim',
    'JAPIIM I': 'Japiim',
    'PRACA 14 DE JANEIRO': 'Praça 14 de Janeiro',
    'PRACA 14': 'Praça 14 de Janeiro',
    'SANTA LUZIA': 'Santa Luzia',
    'VILA BURITI': 'Vila Buriti',
    'DISTRITO INDUSTRIAL': 'Distrito Industrial',
    MAUAZINHO: 'Mauazinho',

    // Zona Oeste
    COMPENSA: 'Compensa',
    'COMPENSA I': 'Compensa',
    'COMPENSA II': 'Compensa',
    'COMPENSA III': 'Compensa',
    'SAO RAIMUNDO': 'São Raimundo',
    'SANTO ANTONIO': 'Santo Antônio',
    'VILA DA PRATA': 'Vila da Prata',
    'GLORIA': 'Glória',
    'SAO FRANCISCO': 'São Francisco',
    'LIRIO DO VALE': 'Lírio do Vale',
    'NOVA ESPERANCA': 'Nova Esperança',
    'SANTO AGOSTINHO': 'Santo Agostinho',
    'PONTA NEGRA': 'Ponta Negra',
    TARUMA: 'Tarumã',
    'TARUMA ACU': 'Tarumã-Açu',

    // Zona Norte
    'CIDADE NOVA': 'Cidade Nova',
    'CIDADE NOVA I': 'Cidade Nova',
    'CIDADE NOVA II': 'Cidade Nova',
    'NOVO ISRAEL': 'Novo Israel',
    'MONTE DAS OLIVEIRAS': 'Monte das Oliveiras',
    'NOVA CIDADE': 'Nova Cidade',
    'SANTA ETELVINA': 'Santa Etelvina',
    'COLONIA TERRA NOVA': 'Colônia Terra Nova',
    'NOVO ALEIXO': 'Novo Aleixo',
    'LAGO AZUL': 'Lago Azul',
    'CIDADE DE DEUS': 'Cidade de Deus',

    // Zona Leste
    'SAO JOSE OPERARIO': 'São José Operário',
    'JORGE TEIXEIRA': 'Jorge Teixeira',
    'TANCREDO NEVES': 'Tancredo Neves',
    'TACREDO NEVES': 'Tancredo Neves',
    COROADO: 'Coroado',
    'COROADO II': 'Coroado',
    'ARMANDO MENDES': 'Armando Mendes',
    'ZUMBI DOS PALMARES': 'Zumbi dos Palmares',
    ZUMBI: 'Zumbi dos Palmares',
    'GILBERTO MESTRINHO': 'Gilberto Mestrinho',
    'COLONIA ANTONIO ALEI': 'Colônia Antônio Aleixo',
    'COLONIA SANTO ANTONI': 'Colônia Santo Antônio',
    'COLONIA SANTOS ANTON': 'Colônia Santo Antônio',
    'NOSSA SENHORA APAREC': 'Nossa Senhora Aparecida',
    PURAQUEQUARA: 'Puraquequara',
    'PRESIDENTE VARGAS': 'Presidente Vargas',

    // Valores que o CNES usa mas que nao constam da divisao oficial de bairros de
    // Manaus. Ficam com a grafia corrigida e aguardam conferencia: nao da' para
    // simplesmente descartar, porque sao unidades reais atendendo gente.
    'KM 08': 'Km 08',
    'KM 8': 'Km 08',
    'N SENHORA DE FATIMA': 'Nossa Senhora de Fátima',
    'PONTA PELADA': 'Ponta Pelada',
    'ZONA RURAL': 'Zona Rural',
};

// Tira acento para a busca na tabela: assim 'São Raimundo' digitado pelo usuario
// encontra a mesma entrada que 'SAO RAIMUNDO' vindo da API.
function semAcento(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function chave(texto) {
    return semAcento(String(texto)).toUpperCase().trim().replace(/\s+/g, ' ');
}

// Devolve null, e nao o valor cru, quando o bairro nao esta na tabela: e' melhor
// a pagina deixar de oferecer o filtro do que exibir "CHPADA" como se fosse nome.
function normalizarBairro(texto) {
    if (texto === null || texto === undefined || String(texto).trim() === '') return null;

    return BAIRROS_POR_VALOR_DO_CNES[chave(texto)] || null;
}

module.exports = { normalizarBairro };
