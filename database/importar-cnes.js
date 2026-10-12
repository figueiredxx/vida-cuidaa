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

const unidadeSaudeService = require('../src/services/unidade-saude.service');

const { extraido_em: extraidoEm, unidades } = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));

// A carga passa pelo service porque a correcao dos nomes de bairro (RF28) e' regra
// de negocio: o script so le o arquivo e reporta o resultado.
const total = unidadeSaudeService.importar(unidades, extraidoEm);

const bairros = unidadeSaudeService.listarBairrosDisponiveis({ apenasSus: false }).length;

console.log(`${total} unidades de saude importadas (base extraida em ${extraidoEm}).`);
console.log(`${bairros} bairros reconhecidos pela tabela de correcao.`);
