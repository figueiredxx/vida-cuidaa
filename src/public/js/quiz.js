(function () {
    document.addEventListener('DOMContentLoaded', function () {
        const player = document.getElementById('quiz-player');
        if (!player) return;

        const quizId = player.getAttribute('data-quiz-id');
        const perguntas = Array.from(player.querySelectorAll('.quiz-pergunta'));
        const total = perguntas.length;

        const indiceAtualEl = document.getElementById('quiz-indice-atual');
        const botaoAnterior = document.getElementById('quiz-anterior');
        const botaoProxima = document.getElementById('quiz-proxima');
        const botaoEnviar = document.getElementById('quiz-enviar');
        const form = document.getElementById('quiz-form');
        const secaoResultado = document.getElementById('quiz-resultado');
        const pontuacaoEl = document.getElementById('quiz-resultado-pontuacao');
        const detalhesEl = document.getElementById('quiz-resultado-detalhes');
        const botaoRefazer = document.getElementById('quiz-refazer');
        const progressoPreenchimento = document.getElementById('quiz-progresso-preenchimento');
        const progressoPontos = Array.from(document.querySelectorAll('.quiz-progresso__ponto'));

        let indice = 0;

        function perguntaRespondida(indiceAlvo) {
            const campo = perguntas[indiceAlvo];
            return Boolean(campo.querySelector('input[type="radio"]:checked'));
        }

        function atualizarProgressoVisual() {
            if (progressoPreenchimento) {
                progressoPreenchimento.style.width = Math.round(((indice + 1) / total) * 100) + '%';
            }
            progressoPontos.forEach(function (ponto, i) {
                ponto.classList.toggle('quiz-progresso__ponto--atual', i === indice);
                ponto.classList.toggle('quiz-progresso__ponto--concluida', i < indice || (i === indice && perguntaRespondida(i)));
            });
        }

        function mostrarPergunta(novoIndice) {
            perguntas.forEach(function (campo, i) {
                campo.hidden = i !== novoIndice;
            });
            indice = novoIndice;
            indiceAtualEl.textContent = String(indice + 1);
            botaoAnterior.disabled = indice === 0;
            botaoProxima.hidden = indice === total - 1;
            botaoEnviar.hidden = indice !== total - 1;
            atualizarProgressoVisual();
            perguntas[indice].querySelector('input[type="radio"]').focus();
        }

        botaoProxima.addEventListener('click', function () {
            if (!perguntaRespondida(indice)) {
                window.alert('Selecione uma alternativa antes de continuar.');
                return;
            }
            mostrarPergunta(Math.min(total - 1, indice + 1));
        });

        botaoAnterior.addEventListener('click', function () {
            mostrarPergunta(Math.max(0, indice - 1));
        });

        function coletarRespostas() {
            const respostas = {};
            perguntas.forEach(function (campo) {
                const escolhida = campo.querySelector('input[type="radio"]:checked');
                if (escolhida) {
                    respostas[escolhida.getAttribute('data-questao-id')] = escolhida.value;
                }
            });
            return respostas;
        }

        function renderizarResultado(resultado) {
            pontuacaoEl.textContent = 'Você acertou ' + resultado.acertos + ' de ' + resultado.total + ' perguntas.';

            detalhesEl.innerHTML = '';
            resultado.detalhes.forEach(function (item) {
                const li = document.createElement('li');
                li.className = item.acertou ? 'acertou' : 'errou';

                const enunciado = document.createElement('p');
                enunciado.textContent = item.enunciado;
                li.appendChild(enunciado);

                const status = document.createElement('p');
                status.textContent = item.acertou
                    ? 'Você acertou!'
                    : 'Resposta correta: ' + item.alternativaCorretaTexto;
                li.appendChild(status);

                if (item.explicacao) {
                    const explicacao = document.createElement('p');
                    explicacao.className = 'quiz-explicacao';
                    explicacao.textContent = item.explicacao;
                    li.appendChild(explicacao);
                }

                // So em quem errou: o caminho de volta para o artigo que responde a pergunta.
                if (!item.acertou && item.artigo) {
                    const revisar = document.createElement('p');
                    revisar.className = 'quiz-revisar';
                    revisar.appendChild(document.createTextNode('Reveja: '));
                    const link = document.createElement('a');
                    link.href = '/conteudos/' + item.artigo.slug;
                    link.textContent = item.artigo.titulo;
                    revisar.appendChild(link);
                    li.appendChild(revisar);
                }

                detalhesEl.appendChild(li);
            });

            form.hidden = true;
            secaoResultado.hidden = false;
            secaoResultado.querySelector('h2').focus();
        }

        form.addEventListener('submit', function (evento) {
            evento.preventDefault();

            if (!perguntaRespondida(indice)) {
                window.alert('Selecione uma alternativa antes de enviar.');
                return;
            }

            fetch('/api/quiz/' + quizId + '/responder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ respostas: coletarRespostas() }),
            })
                .then(function (resposta) {
                    if (!resposta.ok) throw new Error('Falha ao corrigir o quiz.');
                    return resposta.json();
                })
                .then(renderizarResultado)
                .catch(function () {
                    window.alert('Não foi possível corrigir o quiz agora. Tente novamente.');
                });
        });

        botaoRefazer.addEventListener('click', function () {
            window.location.reload();
        });

        mostrarPergunta(0);
    });
})();
