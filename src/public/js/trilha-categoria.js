// Trilha por categoria: usa a MESMA lista de artigos lidos gravada por
// progresso-leitura.js, para nao existirem dois controles de progresso no
// navegador. Calcula quanto falta em cada categoria e libera o quiz quando
// todos os artigos publicados daquela categoria ja foram lidos.
(function () {
    var CHAVE_LIDOS = 'progresso-leitura-lidos';

    function lerLidos() {
        try {
            var bruto = localStorage.getItem(CHAVE_LIDOS);
            var lista = bruto ? JSON.parse(bruto) : [];
            return Array.isArray(lista) ? lista : [];
        } catch (erro) {
            // localStorage indisponivel (ex.: modo privado): o quiz continua
            // alcancavel pela URL, so nao ha progresso para exibir.
            return [];
        }
    }

    function contarLidos(slugs, lidos) {
        return slugs.filter(function (slug) {
            return lidos.indexOf(slug) !== -1;
        }).length;
    }

    function atualizarIndice(lidos) {
        var lista = document.getElementById('lista-trilhas');
        if (!lista) return;

        Array.prototype.forEach.call(lista.querySelectorAll('[data-slugs-artigos]'), function (item) {
            var bruto = item.getAttribute('data-slugs-artigos');
            var slugs = bruto ? bruto.split(',') : [];
            var texto = item.querySelector('.trilhas__progresso');
            if (!texto || slugs.length === 0) return;

            var quantidade = contarLidos(slugs, lidos);
            texto.textContent = 'Você leu ' + quantidade + ' de ' + slugs.length + ' artigos.';
            if (quantidade === slugs.length) {
                texto.textContent += ' Quiz liberado!';
                item.classList.add('trilhas__item--concluida');
            }
        });
    }

    function marcarArtigosLidos(lidos) {
        Array.prototype.forEach.call(document.querySelectorAll('.trilha-artigos [data-slug]'), function (item) {
            var badge = item.querySelector('.badge-lido');
            if (badge && lidos.indexOf(item.getAttribute('data-slug')) !== -1) {
                badge.hidden = false;
                item.classList.add('trilha-artigos__item--lido');
            }
        });
    }

    function atualizarBarra(container, quantidade, total) {
        var texto = document.getElementById('trilha-progresso-texto');
        var barra = document.getElementById('trilha-progresso-barra');
        var preenchimento = document.getElementById('trilha-progresso-preenchimento');
        var percentual = total > 0 ? Math.round((quantidade / total) * 100) : 0;

        if (texto) {
            texto.textContent = 'Você leu ' + quantidade + ' de ' + total + ' artigos desta categoria (' + percentual + '%).';
        }
        if (barra) {
            barra.setAttribute('aria-valuenow', String(quantidade));
        }
        if (preenchimento) {
            preenchimento.style.width = percentual + '%';
        }
    }

    function liberarQuiz(quantidade, total) {
        var secao = document.getElementById('trilha-quiz');
        if (!secao) return;

        var aviso = document.getElementById('trilha-quiz-aviso');
        var link = document.getElementById('trilha-quiz-link');
        var faltam = total - quantidade;

        if (faltam <= 0) {
            secao.classList.add('quiz-cadeado--liberado');
            if (aviso) {
                aviso.textContent = 'Você concluiu esta categoria. O quiz está liberado!';
            }
            if (link) {
                link.hidden = false;
            }
            return;
        }

        if (aviso) {
            aviso.textContent =
                faltam === 1
                    ? 'Falta 1 artigo desta categoria para liberar o quiz.'
                    : 'Faltam ' + faltam + ' artigos desta categoria para liberar o quiz.';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var lidos = lerLidos();

        atualizarIndice(lidos);

        var container = document.getElementById('trilha-progresso');
        if (!container) return;

        var artigos = Array.prototype.map.call(document.querySelectorAll('.trilha-artigos [data-slug]'), function (item) {
            return item.getAttribute('data-slug');
        });
        var total = parseInt(container.getAttribute('data-total'), 10) || artigos.length;
        var quantidade = contarLidos(artigos, lidos);

        marcarArtigosLidos(lidos);
        atualizarBarra(container, quantidade, total);
        liberarQuiz(quantidade, total);
    });
})();
