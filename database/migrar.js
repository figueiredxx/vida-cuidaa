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

adicionarConteudoIdEmQuestao();
db.close();
console.log('Migracoes concluidas.');
