(function () {
    var CHAVE_LIDOS = 'progresso-leitura-lidos';

    function lerLidos() {
        try {
            var bruto = localStorage.getItem(CHAVE_LIDOS);
            var lista = bruto ? JSON.parse(bruto) : [];
            return Array.isArray(lista) ? lista : [];
        } catch (erro) {
            return [];
        }
    }

    function gravarLidos(lista) {
        try {
            localStorage.setItem(CHAVE_LIDOS, JSON.stringify(lista));
        } catch (erro) {
            // localStorage indisponivel (ex.: modo privado) - progresso nao persiste, mas a pagina continua funcional.
        }
    }

    function marcarComoLido(slug, lidos) {
        if (lidos.indexOf(slug) === -1) {
            lidos.push(slug);
            gravarLidos(lidos);
        }
        return lidos;
    }

    // RF16. Apaga a chave inteira, em vez de gravar lista vazia: o requisito fala
    // em apagar do armazenamento local, e deixar a chave para tras contraria isso.
    function apagarHistorico() {
        try {
            localStorage.removeItem(CHAVE_LIDOS);
            return true;
        } catch (erro) {
            return false;
        }
    }

    function atualizarBarra(container, lidos) {
        var total = parseInt(container.getAttribute('data-total'), 10) || 0;
        var texto = document.getElementById('progresso-leitura-texto');
        var barra = document.getElementById('progresso-leitura-barra');
        var preenchimento = document.getElementById('progresso-leitura-preenchimento');
        var quantidadeLida = Math.min(lidos.length, total);
        var percentual = total > 0 ? Math.round((quantidadeLida / total) * 100) : 0;

        if (texto) {
            texto.textContent = 'Você já leu ' + quantidadeLida + ' de ' + total + ' conteúdos (' + percentual + '%).';
        }
        if (barra) {
            barra.setAttribute('aria-valuenow', String(quantidadeLida));
        }
        if (preenchimento) {
            preenchimento.style.width = percentual + '%';
        }
    }

    function esconderSelosDeLido() {
        var selos = document.querySelectorAll('.badge-lido');
        Array.prototype.forEach.call(selos, function (selo) {
            selo.hidden = true;
        });
    }

    function marcarCardsLidos(lidos) {
        var cards = document.querySelectorAll('[data-slug]');
        cards.forEach(function (card) {
            var slug = card.getAttribute('data-slug');
            var badge = card.querySelector('.badge-lido');
            if (badge && lidos.indexOf(slug) !== -1) {
                badge.hidden = false;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var container = document.getElementById('progresso-leitura');
        if (!container) return;

        var lidos = lerLidos();

        var slugAtual = container.getAttribute('data-conteudo-atual');
        if (slugAtual) {
            lidos = marcarComoLido(slugAtual, lidos);
        }

        atualizarBarra(container, lidos);
        marcarCardsLidos(lidos);

        var botaoApagar = document.getElementById('apagar-historico');
        var aviso = document.getElementById('progresso-leitura-aviso');
        if (!botaoApagar) return;

        // So aparece para quem tem o que apagar. Botao que nao faz nada confunde,
        // e quem nunca leu nada nao precisa dele.
        botaoApagar.hidden = lidos.length === 0;

        botaoApagar.addEventListener('click', function () {
            var quantidade = lidos.length;
            var pergunta =
                'Apagar o histórico de ' +
                quantidade +
                (quantidade === 1 ? ' conteúdo lido' : ' conteúdos lidos') +
                '? Esta ação não pode ser desfeita.';

            if (!window.confirm(pergunta)) return;

            if (!apagarHistorico()) {
                if (aviso) aviso.textContent = 'Não foi possível apagar o histórico neste navegador.';
                return;
            }

            lidos = [];
            atualizarBarra(container, lidos);
            esconderSelosDeLido();
            botaoApagar.hidden = true;
            if (aviso) aviso.textContent = 'Histórico de leitura apagado deste navegador.';
        });
    });
})();
