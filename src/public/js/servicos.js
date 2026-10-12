// Pagina de servicos: pede a geolocalizacao ao navegador (RF24) e reenvia o
// formulario com a coordenada, para o servidor montar a lista ordenada.
//
// A lista nao e' montada aqui de proposito: assim a URL com o resultado pode ser
// compartilhada, o botao "voltar" funciona e o leitor de tela recebe HTML pronto.
(function () {
    var botao = document.getElementById('botao-localizacao');
    var formulario = document.getElementById('form-servicos');
    var campoLat = document.getElementById('campo-lat');
    var campoLon = document.getElementById('campo-lon');
    var status = document.getElementById('status-localizacao');
    var resultado = document.getElementById('resultado-servicos');
    var campoBairro = document.getElementById('bairro');

    if (!botao || !formulario || !campoLat || !campoLon || !status) return;

    // RF28: quando a localizacao nao vem, o seletor de bairro e' a saida. Levar o
    // foco ate ele evita que a pessoa fique parada diante de um aviso de erro.
    function oferecerBuscaPorBairro() {
        if (campoBairro) campoBairro.focus();
    }

    // Quando a pagina ja veio com resultado, o foco vai para a lista: sem isso,
    // quem usa leitor de tela nao percebe que algo mudou depois do recarregamento.
    // Vale para os dois caminhos de busca, por localizacao e por bairro.
    if (resultado && resultado.querySelector('.servicos-lista')) {
        resultado.focus();
    }

    // Sem suporte no navegador, o botao nao tem o que fazer: melhor esconder do
    // que oferecer algo que vai falhar.
    if (!navigator.geolocation) {
        botao.hidden = true;
        status.textContent = 'Este navegador não permite usar a localização. Escolha um bairro na lista para ver as unidades.';
        return;
    }

    function avisar(texto) {
        status.textContent = texto;
    }

    function explicarErro(erro) {
        if (erro.code === erro.PERMISSION_DENIED) {
            return 'Você não autorizou o acesso à localização. Escolha um bairro na lista para ver as unidades.';
        }
        if (erro.code === erro.POSITION_UNAVAILABLE) {
            return 'Não foi possível determinar sua localização agora. Tente de novo em instantes.';
        }
        if (erro.code === erro.TIMEOUT) {
            return 'A busca pela sua localização demorou demais. Tente de novo.';
        }
        return 'Não foi possível obter sua localização.';
    }

    botao.addEventListener('click', function () {
        botao.disabled = true;
        avisar('Procurando sua localização...');

        navigator.geolocation.getCurrentPosition(
            function (posicao) {
                campoLat.value = posicao.coords.latitude;
                campoLon.value = posicao.coords.longitude;
                avisar('Localização encontrada. Carregando as unidades mais próximas...');
                formulario.submit();
            },
            function (erro) {
                botao.disabled = false;
                avisar(explicarErro(erro));
                if (erro.code === erro.PERMISSION_DENIED) oferecerBuscaPorBairro();
            },
            { timeout: 10000 }
        );
    });
})();
