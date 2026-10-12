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

    if (!botao || !formulario || !campoLat || !campoLon || !status) return;

    // Sem suporte no navegador, o botao nao tem o que fazer: melhor esconder do
    // que oferecer algo que vai falhar.
    if (!navigator.geolocation) {
        botao.hidden = true;
        status.textContent = 'Este navegador não permite usar a localização. Em breve será possível buscar por bairro.';
        return;
    }

    // Quando a pagina ja veio com resultado, o foco vai para a lista: sem isso,
    // quem usa leitor de tela nao percebe que algo mudou depois do recarregamento.
    if (resultado && campoLat.value) {
        resultado.focus();
    }

    function avisar(texto) {
        status.textContent = texto;
    }

    function explicarErro(erro) {
        if (erro.code === erro.PERMISSION_DENIED) {
            return 'Você não autorizou o acesso à localização. Em breve será possível buscar por bairro.';
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
            },
            { timeout: 10000 }
        );
    });
})();
