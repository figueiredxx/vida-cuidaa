// Gera uma vitrine estatica (HTML puro) das paginas publicas do site, para publicar
// no GitHub Pages. Nao roda em producao: e' so uma ferramenta de build que le os
// mesmos dados do banco via repositories/services e escreve arquivos .html.
//
// Paginas que dependem de servidor (envio de duvida, correcao de quiz) ficam com
// aviso estatico no lugar do formulario/acao dinamica.
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const categoriaRepository = require('../src/repositories/categoria.repository');
const categoriaService = require('../src/services/categoria.service');
const conteudoRepository = require('../src/repositories/conteudo.repository');
const glossarioService = require('../src/services/glossario.service');
const quizRepository = require('../src/repositories/quiz.repository');
const quizPlayerService = require('../src/services/quiz-player.service');
const duvidaService = require('../src/services/duvida.service');
const unidadeSaudeService = require('../src/services/unidade-saude.service');

const RAIZ = path.join(__dirname, '..');
const DIR_VIEWS = path.join(RAIZ, 'src', 'views', 'site');
const DIR_PUBLIC = path.join(RAIZ, 'src', 'public');
const DIR_SAIDA = path.join(RAIZ, 'dist-estatico');

// Prefixo de caminho do GitHub Pages de projeto (ex.: /TCC-SAMUEL). Vazio para pre-visualizar
// localmente servindo dist-estatico/ na raiz.
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/$/, '');

const LIMITE_RELACIONADOS = 3;
const PALAVRAS_POR_MINUTO = 200;

const AVISO_ESTATICO =
    '<p class="aviso-estatico">Esta é uma versão estática de demonstração. ' +
    'Funcionalidades que dependem do servidor (envio de dúvidas e correção do quiz) ' +
    'só funcionam na versão publicada com o backend ativo.</p>';

function calcularTempoLeituraMinutos(corpoHtml) {
    const texto = corpoHtml.replace(/<[^>]*>/g, ' ');
    const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(palavras / PALAVRAS_POR_MINUTO));
}

function renderizar(viewNome, locals) {
    return ejs.renderFile(path.join(DIR_VIEWS, `${viewNome}.ejs`), locals);
}

function injetarAvisoEstatico(html) {
    return html.replace('<footer class="site-footer">', `<footer class="site-footer">\n${AVISO_ESTATICO}`);
}

function neutralizarFormularioDuvida(html) {
    return html.replace(
        /<form method="POST" action="\/duvidas"[\s\S]*?<\/form>/,
        '<p class="aviso-estatico">O envio de dúvidas está disponível apenas na versão ' +
            'publicada com o servidor ativo (o canal continua totalmente anônimo).</p>'
    );
}

// A pagina de servicos depende do servidor para calcular as distancias, entao na
// vitrine estatica ela vira so a explicacao do recurso. Sem isso o item "Servicos"
// do menu levaria a uma pagina quebrada no GitHub Pages.
function neutralizarBuscaServicos(html) {
    return html.replace(
        /<form method="GET" action="\/servicos"[\s\S]*?<\/section>/,
        '<p class="aviso-estatico">A busca por unidades de saúde, por localização ou ' +
            'por bairro, depende do servidor e está disponível apenas na versão ' +
            'publicada com o backend ativo.</p></section>'
    );
}

function aplicarBasePath(html) {
    if (!BASE_PATH) return html;
    return html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${BASE_PATH}/`);
}

function escreverPagina(rota, html) {
    const destino = path.join(DIR_SAIDA, rota, 'index.html');
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, aplicarBasePath(injetarAvisoEstatico(html)), 'utf8');
    console.log('gerado:', path.relative(RAIZ, destino));
}

function copiarDiretorio(origem, destino) {
    fs.mkdirSync(destino, { recursive: true });
    for (const entrada of fs.readdirSync(origem, { withFileTypes: true })) {
        const origemCaminho = path.join(origem, entrada.name);
        const destinoCaminho = path.join(destino, entrada.name);
        if (entrada.isDirectory()) {
            copiarDiretorio(origemCaminho, destinoCaminho);
        } else {
            fs.copyFileSync(origemCaminho, destinoCaminho);
        }
    }
}

function copiarAssets() {
    // vendor entra por causa do Leaflet: a pagina de servicos pede o arquivo mesmo
    // na vitrine estatica, onde o mapa fica sem marcador por falta de servidor.
    for (const pasta of ['css', 'js', 'fonts', 'vendor']) {
        const origem = path.join(DIR_PUBLIC, pasta);
        if (fs.existsSync(origem)) {
            copiarDiretorio(origem, path.join(DIR_SAIDA, pasta));
        }
    }

    if (BASE_PATH) {
        const mainCssPath = path.join(DIR_SAIDA, 'css', 'main.css');
        if (fs.existsSync(mainCssPath)) {
            const conteudo = fs.readFileSync(mainCssPath, 'utf8').replace(/url\('\/(?!\/)/g, `url('${BASE_PATH}/`);
            fs.writeFileSync(mainCssPath, conteudo, 'utf8');
        }
    }
}

async function gerarHome() {
    const html = await renderizar('home', {
        titulo: 'Inicio',
        categorias: categoriaRepository.listarTodas(),
        conteudosRecentes: conteudoRepository.listarPublicadosRecentes(8),
    });
    escreverPagina('', html);
}

async function gerarSobre() {
    const html = await renderizar('sobre', { titulo: 'Sobre' });
    escreverPagina('sobre', html);
}

async function gerarCatalogoEDetalhes() {
    const itens = conteudoRepository.listarComFiltros({
        categoriaSlug: null,
        faixaEtaria: null,
        busca: null,
        pagina: 1,
        porPagina: 9999,
    });

    const htmlCatalogo = await renderizar('conteudos', {
        titulo: 'Conteúdos',
        itens,
        paginaAtual: 1,
        totalPaginas: 1,
        categorias: categoriaRepository.listarTodas(),
        totalPublicados: itens.length,
        filtrosAtivos: { categoria: '', faixa: '', q: '' },
    });
    escreverPagina('conteudos', htmlCatalogo);

    for (const item of itens) {
        const conteudo = conteudoRepository.buscarPorSlugPublicado(item.slug);
        const htmlDetalhe = await renderizar('conteudo', {
            titulo: conteudo.titulo,
            conteudo,
            tempoLeituraMinutos: calcularTempoLeituraMinutos(conteudo.corpo_html),
            relacionados: conteudoRepository.listarRelacionados(conteudo.categoria_id, conteudo.id, LIMITE_RELACIONADOS),
            totalPublicados: itens.length,
        });
        escreverPagina(`conteudos/${conteudo.slug}`, htmlDetalhe);
    }
}

async function gerarTrilhas() {
    const categorias = categoriaService.listarTrilhas();

    const htmlIndice = await renderizar('categorias', { titulo: 'Trilhas por categoria', categorias });
    escreverPagina('categorias', htmlIndice);

    for (const categoria of categorias) {
        const trilha = categoriaService.buscarTrilha(categoria.slug);
        const html = await renderizar('categoria', { titulo: trilha.categoria.nome, ...trilha });
        escreverPagina(`categorias/${categoria.slug}`, html);
    }
}

async function gerarGlossario() {
    const dados = glossarioService.listarPorLetra(null);
    const html = await renderizar('glossario', { titulo: 'Glossário', ...dados });
    escreverPagina('glossario', html);
}

async function gerarQuizzes() {
    const quizzes = quizRepository.listarTodos();
    for (const quiz of quizzes) {
        const dados = quizPlayerService.buscarParaPlayer(quiz.id);
        if (!dados) continue;
        const html = await renderizar('quiz', { titulo: dados.quiz.titulo, ...dados });
        escreverPagina(`quiz/${quiz.id}`, html);
    }
}

async function gerarDuvidas() {
    const faq = duvidaService.listarFaqPublicado();
    const html = await renderizar('duvidas', { titulo: 'Dúvidas', faq, erro: null, enviado: false });
    escreverPagina('duvidas', neutralizarFormularioDuvida(html));
}

async function gerarServicos() {
    const html = await renderizar('servicos', {
        titulo: 'Serviços de saúde',
        apenasSus: true,
        tipo: '',
        bairro: '',
        tipos: unidadeSaudeService.listarTiposDisponiveis(),
        bairros: unidadeSaudeService.listarBairrosDisponiveis({ apenasSus: true }),
        dataExtracao: unidadeSaudeService.buscarDataExtracao(),
        latitude: null,
        longitude: null,
        unidades: null,
        erro: null,
    });
    escreverPagina('servicos', neutralizarBuscaServicos(html));
}

async function gerar404() {
    const html = await renderizar('404', { titulo: 'Página não encontrada' });
    fs.writeFileSync(path.join(DIR_SAIDA, '404.html'), aplicarBasePath(injetarAvisoEstatico(html)), 'utf8');
    console.log('gerado: dist-estatico/404.html');
}

async function main() {
    fs.rmSync(DIR_SAIDA, { recursive: true, force: true });
    fs.mkdirSync(DIR_SAIDA, { recursive: true });
    fs.writeFileSync(path.join(DIR_SAIDA, '.nojekyll'), '');

    copiarAssets();

    await gerarHome();
    await gerarSobre();
    await gerarCatalogoEDetalhes();
    await gerarTrilhas();
    await gerarGlossario();
    await gerarQuizzes();
    await gerarDuvidas();
    await gerarServicos();
    await gerar404();

    console.log('\nVitrine estática gerada em', path.relative(RAIZ, DIR_SAIDA));
}

main().catch((erro) => {
    console.error(erro);
    process.exit(1);
});
