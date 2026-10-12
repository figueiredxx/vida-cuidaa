// Carrega no banco as unidades de saude extraidas do CNES.
//
// Separado do scripts/extrair-cnes.js de proposito: a extracao depende da API do
// Ministerio estar no ar, a importacao nao. Quem clonar o repositorio roda so
// este passo, lendo o JSON que ja esta versionado.
//
// Uso: npm run importar:cnes
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, 'cnes-manaus.json');

if (!fs.existsSync(ARQUIVO)) {
    console.error(
        `Arquivo nao encontrado: ${path.relative(process.cwd(), ARQUIVO)}\n` +
            'Gere com: node scripts/extrair-cnes.js'
    );
    process.exit(1);
}

const unidadeSaudeRepository = require('../src/repositories/unidade-saude.repository');

const unidades = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
unidadeSaudeRepository.substituirTodas(unidades);

console.log(`${unidadeSaudeRepository.contar()} unidades de saude importadas.`);
