// Aplica as preferencias de acessibilidade antes da pagina pintar, para nao
// haver salto de tamanho de fonte nem piscada de contraste.
//
// Ficava inline no head.ejs, onde o Content-Security-Policy do helmet
// (script-src 'self', sem unsafe-inline) simplesmente nao deixava executar: as
// preferencias so voltavam depois, pelo acessibilidade.js, com a pagina ja
// desenhada. Em arquivo proprio, roda — e o CSP continua sem brecha para inline.
(function () {
    try {
        var fonte = localStorage.getItem('acessibilidade-fonte');
        var contraste = localStorage.getItem('acessibilidade-contraste');
        if (fonte === 'grande' || fonte === 'enorme') {
            document.documentElement.classList.add('fonte-' + fonte);
        }
        if (contraste === 'on') {
            document.documentElement.classList.add('alto-contraste');
        }
    } catch (erro) {
        // localStorage pode estar indisponivel (modo privado); segue com o padrao.
    }
})();
