// Migracoes do banco ja existente.
//
// O schema.sql usa CREATE TABLE IF NOT EXISTS, entao ele cria tabelas novas mas
// nunca altera uma tabela que ja existe. Bancos criados antes de uma coluna nova
// ficariam desatualizados. Este script aplica essas alteracoes de forma
// idempotente: pode rodar quantas vezes for preciso sem quebrar nada.
require('dotenv').config();

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.join(__dirname, 'database.sqlite');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function colunaExiste(tabela, coluna) {
    return db
        .prepare(`PRAGMA table_info(${tabela})`)
        .all()
        .some((c) => c.name === coluna);
}

function tabelaExiste(tabela) {
    return !!db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tabela);
}

// Vincula cada questao ao artigo de onde ela saiu, para o resultado do quiz
// conseguir indicar qual conteudo o visitante deve revisar.
function adicionarConteudoIdEmQuestao() {
    if (colunaExiste('questao', 'conteudo_id')) {
        console.log('questao.conteudo_id ja existe - nada a fazer.');
        return;
    }
    db.exec('ALTER TABLE questao ADD COLUMN conteudo_id INTEGER REFERENCES conteudo(id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_questao_conteudo ON questao(conteudo_id)');
    console.log('questao.conteudo_id adicionada.');
}

// Unidades de saude do CNES, usadas pela pagina de servicos. A carga em si fica
// no importar-cnes.js; aqui so garante que a tabela exista.
function criarTabelaUnidadeSaude() {
    if (tabelaExiste('unidade_saude')) {
        console.log('unidade_saude ja existe - nada a fazer.');
        return;
    }
    db.exec(`
        CREATE TABLE unidade_saude (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_cnes TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL,
            logradouro TEXT,
            numero TEXT,
            bairro TEXT,
            bairro_normalizado TEXT,
            telefone TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            tipo_unidade INTEGER NOT NULL,
            tipo_descricao TEXT,
            atende_sus INTEGER NOT NULL DEFAULT 0,
            turno_atendimento TEXT
        )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_unidade_saude_bairro ON unidade_saude(bairro_normalizado)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_unidade_saude_tipo ON unidade_saude(tipo_unidade)');
    console.log('unidade_saude criada.');
}

// Descricao oficial do tipo de unidade, usada no filtro do RF27. Vem do endpoint
// /cnes/tipounidades, porque a listagem de estabelecimentos so traz o codigo.
function adicionarTipoDescricaoEmUnidadeSaude() {
    if (!tabelaExiste('unidade_saude') || colunaExiste('unidade_saude', 'tipo_descricao')) {
        console.log('unidade_saude.tipo_descricao ja existe - nada a fazer.');
        return;
    }
    db.exec('ALTER TABLE unidade_saude ADD COLUMN tipo_descricao TEXT');
    console.log('unidade_saude.tipo_descricao adicionada.');
}

// RF28: o bairro corrigido, usado na busca e na exibicao. O valor cru do CNES
// continua na coluna bairro, para a origem do dado permanecer auditavel.
function adicionarBairroNormalizadoEmUnidadeSaude() {
    if (!tabelaExiste('unidade_saude') || colunaExiste('unidade_saude', 'bairro_normalizado')) {
        console.log('unidade_saude.bairro_normalizado ja existe - nada a fazer.');
        return;
    }
    db.exec('ALTER TABLE unidade_saude ADD COLUMN bairro_normalizado TEXT');
    db.exec('DROP INDEX IF EXISTS idx_unidade_saude_bairro');
    db.exec('CREATE INDEX idx_unidade_saude_bairro ON unidade_saude(bairro_normalizado)');
    console.log('unidade_saude.bairro_normalizado adicionada. Rode: npm run importar:cnes');
}

// RN22: a data da extracao da base precisa ser registrada e exibida ao usuario.
function criarTabelaExtracaoCnes() {
    if (tabelaExiste('extracao_cnes')) {
        console.log('extracao_cnes ja existe - nada a fazer.');
        return;
    }
    db.exec(`
        CREATE TABLE extracao_cnes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_extracao TEXT NOT NULL
        )
    `);
    console.log('extracao_cnes criada.');
}

adicionarConteudoIdEmQuestao();
criarTabelaUnidadeSaude();
adicionarTipoDescricaoEmUnidadeSaude();
adicionarBairroNormalizadoEmUnidadeSaude();
criarTabelaExtracaoCnes();
db.close();
console.log('Migracoes concluidas.');
