// Mapa das unidades de saude (RF29).
//
// Os marcadores saem da propria lista ja renderizada pelo servidor, lendo os
// data-* de cada item. E' por isso que mapa e lista nunca divergem: nao existe
// segunda consulta, segundo filtro nem segunda ordem — e' o mesmo resultado,
// desenhado de outro jeito.
//
// Tudo aqui e' melhoria progressiva: se o Leaflet nao carregar, se a rede cair
// ou se os ladrilhos falharem, a lista continua inteira na pagina.
(function () {
    var caixa = document.getElementById('mapa-servicos');
    if (!caixa) return;

    var aviso = document.getElementById('mapa-indisponivel');

    function desistir() {
        caixa.hidden = true;
        if (aviso) aviso.hidden = false;
    }

    // Sem a biblioteca nao ha mapa a desenhar. Acontece sem internet, com bloqueador
    // de script ou se o arquivo sumir do servidor.
    if (typeof L === 'undefined') {
        desistir();
        return;
    }

    var itens = document.querySelectorAll('.servicos-lista__item');
    if (!itens.length) return;

    // Centro urbano de Manaus. Serve de alternativa quando nao ha posicao de quem
    // buscou, e de rede de seguranca contra enquadramento absurdo.
    var CENTRO_MANAUS = [-3.0797, -60.0051];
    var ZOOM_PADRAO = 12;
    var ZOOM_MINIMO_UTIL = 11;
    var TEMPO_ATE_DESISTIR_MS = 10000;
    var FALHAS_ATE_DESISTIR = 4;

    var mapa = L.map(caixa, { scrollWheelZoom: false });

    var ladrilhos = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // Exigencia da licenca. Nao remover.
        attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });

    // Se nenhum ladrilho chegar, o mapa fica um retangulo cinza sem explicacao.
    // Melhor assumir a falha e mandar a pessoa para a lista.
    //
    // A conta e' por ladrilho, e nao pelo evento 'load' da camada: esse 'load'
    // dispara quando a camada termina de tentar, inclusive quando todas as
    // tentativas falharam. Usa-lo aqui faria o aviso nunca aparecer justamente
    // no caso que ele existe para cobrir — foi o que aconteceu no primeiro teste
    // com a rede bloqueada.
    var carregou = false;
    var falhas = 0;

    var relogio = setTimeout(function () {
        if (!carregou) desistir();
    }, TEMPO_ATE_DESISTIR_MS);

    ladrilhos.on('tileload', function () {
        carregou = true;
        clearTimeout(relogio);
    });

    ladrilhos.on('tileerror', function () {
        falhas += 1;
        // Um ladrilho isolado falhando nao e' problema; varios sem nenhum sucesso
        // significa que o mapa nao vai aparecer.
        if (!carregou && falhas >= FALHAS_ATE_DESISTIR) {
            clearTimeout(relogio);
            desistir();
        }
    });

    ladrilhos.addTo(mapa);

    function texto(elemento, conteudo) {
        var no = document.createElement(elemento);
        no.textContent = conteudo;
        return no;
    }

    // O balao e' montado no DOM, nunca por concatenacao de HTML: o nome do
    // estabelecimento vem de base externa e nao pode virar marcacao.
    function montarBalao(dados) {
        var caixaBalao = document.createElement('div');
        caixaBalao.className = 'mapa-balao';

        caixaBalao.appendChild(texto('strong', dados.nome));

        if (dados.tipo) caixaBalao.appendChild(texto('p', dados.tipo));

        var endereco = dados.endereco;
        if (dados.bairro) endereco = endereco ? endereco + ' — ' + dados.bairro : dados.bairro;
        if (endereco) caixaBalao.appendChild(texto('p', endereco));

        if (dados.telefone) {
            var linha = document.createElement('p');
            var link = document.createElement('a');
            link.href = 'tel:' + dados.telefone.replace(/\D/g, '');
            link.textContent = dados.telefone;
            linha.appendChild(document.createTextNode('Telefone: '));
            linha.appendChild(link);
            caixaBalao.appendChild(linha);
        }

        // O texto diz por extenso se atende pelo SUS: a cor do marcador sozinha nao
        // serve a quem nao distingue as duas.
        var selo = texto('p', dados.sus ? 'Atende pelo SUS' : 'Não atende pelo SUS');
        selo.className = dados.sus ? 'mapa-balao__sus' : 'mapa-balao__particular';
        caixaBalao.appendChild(selo);

        return caixaBalao;
    }

    var pontos = [];

    Array.prototype.forEach.call(itens, function (item) {
        var latitude = parseFloat(item.getAttribute('data-lat'));
        var longitude = parseFloat(item.getAttribute('data-lon'));
        if (!isFinite(latitude) || !isFinite(longitude)) return;

        var atendeSus = item.getAttribute('data-sus') === '1';

        // Circulo em vez do alfinete padrao: aceita cor por unidade e, no caso dos
        // particulares, borda tracejada — a mesma distincao da lista, que nao
        // depende so de cor.
        var marcador = L.circleMarker([latitude, longitude], {
            radius: 8,
            weight: 3,
            color: atendeSus ? '#0b5d3b' : '#8a4b00',
            fillColor: atendeSus ? '#1f9d63' : '#f0a04b',
            fillOpacity: 0.9,
            dashArray: atendeSus ? null : '3 3',
        });

        marcador.bindPopup(
            montarBalao({
                nome: item.getAttribute('data-nome'),
                tipo: item.getAttribute('data-tipo'),
                endereco: item.getAttribute('data-endereco'),
                bairro: item.getAttribute('data-bairro'),
                telefone: item.getAttribute('data-telefone'),
                sus: atendeSus,
            })
        );

        marcador.addTo(mapa);
        pontos.push([latitude, longitude]);
    });

    var origemLat = parseFloat(caixa.getAttribute('data-origem-lat'));
    var origemLon = parseFloat(caixa.getAttribute('data-origem-lon'));
    var temOrigem = isFinite(origemLat) && isFinite(origemLon);

    if (temOrigem) {
        L.circleMarker([origemLat, origemLon], {
            radius: 7,
            weight: 3,
            color: '#1b3a6b',
            fillColor: '#4a7fd4',
            fillOpacity: 1,
        })
            .bindPopup('Você está aqui')
            .addTo(mapa);

        mapa.setView([origemLat, origemLon], 13);
    } else if (pontos.length) {
        mapa.fitBounds(pontos, { padding: [30, 30], maxZoom: 15 });

        // O cartao avisa: enquadrar todos os pontos pode abrir o mapa mostrando
        // quase so floresta, porque ha unidades ribeirinhas a dezenas de
        // quilometros. Quando o enquadramento afasta demais, volta para o centro
        // urbano — os pontos distantes continuam na lista.
        if (mapa.getZoom() < ZOOM_MINIMO_UTIL) {
            mapa.setView(CENTRO_MANAUS, ZOOM_PADRAO);
        }
    } else {
        mapa.setView(CENTRO_MANAUS, ZOOM_PADRAO);
    }
})();
