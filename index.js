const setupContainer = document.getElementById('setup-container');
const gameContainer = document.getElementById('game-container');
const wordDisplay = document.getElementById('word-display');
const gameMessage = document.getElementById('game-message');
const errorCount = document.getElementById('error-count');
const resetBtn = document.getElementById('reset-btn');
const tipContainer = document.getElementById('tip-container');
const tipText = document.getElementById('tip-text');
const levelDisplay = document.getElementById('level-display');

const successSound = new Audio('./sons/success.mp3');
const errorSound = new Audio('./sons/error.mp3');

const URL_API = 'https://api-palavras-8ptt.onrender.com/';

// TELA 1: INICIAR JOGO
async function iniciarJogo(event) {
    if (event.key === "Enter") {
        const nicknameInput = document.getElementById('nickname-input');
        const nickname = nicknameInput.value.trim();
        
        const radioChecked = document.querySelector('input[name="difficulty"]:checked');
        const nivelValue = radioChecked ? radioChecked.value : 'facil';

        if (!nickname) {
            alert('Preencha o seu nome!');
            nicknameInput.focus();
            return;
        }

        try {
            const response = await fetch(`${URL_API}/iniciar`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nickname: nickname,
                    nivel: nivelValue 
                })
            });

            const data = await response.json();

            if (data.erro) {
                alert(data.erro);
                return;
            }

            setupContainer.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            
            if(document.getElementById('player-display')) {
                document.getElementById('player-display').innerText = data.mensagem;
            }
            if(levelDisplay) {
                levelDisplay.innerText = `Nível: ${nivelValue}`;
            }

            buscarPalavra();
            
            setTimeout(() => {
                const letterInput = document.getElementById('letter-input');
                if(letterInput) letterInput.focus();
            }, 200);

        } catch (err) {
            console.error("Erro ao iniciar:", err);
        }
    }
}

async function buscarPalavra() {
    try {
        const response = await fetch(`${URL_API}/status`, {
            credentials: 'include',
            method: 'GET'
        });
        const data = await response.json();
        wordDisplay.innerHTML = '';

        if (data.dica && tipContainer) {
            tipContainer.classList.remove('hidden');
            tipText.innerText = data.dica;
        }

        for (let i = 0; i < data.qtde_caracteres; i++) {
            const span = document.createElement('span');
            span.className = 'letter-slot';
            span.id = `slot-${i}`;
            wordDisplay.appendChild(span);
        }
    } catch (err) {
        console.error("Erro ao buscar palavra:", err);
    }
}

// TELA 2: TENTAR LETRA
async function tentarLetra(event) {
    if (event.key === "Enter") {
        const input = document.getElementById('letter-input');
        if (!input) return;

        const caractere = input.value.trim();
        
        // Se o botão de reiniciar já apareceu, o Enter foca nele
        if (resetBtn && !resetBtn.classList.contains('hidden')) {
            resetBtn.focus();
            return;
        }

        if (!caractere) return;

        input.value = ''; 
        input.focus();

        try {
            const response = await fetch(`${URL_API}/tentativa`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caractere: caractere })
            });

            const data = await response.json();

            if (data.posicoes && data.posicoes.length > 0) {
                successSound.currentTime = 0;
                successSound.play();
                data.posicoes.forEach(pos => {
                    const slot = document.getElementById(`slot-${pos}`);
                    if(slot) slot.innerText = caractere;
                });
            } else {
                errorSound.currentTime = 0;
                errorSound.play();
            }

            if(errorCount) errorCount.innerText = data.erros_atuais;
            if(gameMessage) gameMessage.innerText = data.mensagem;

            // --- LÓGICA DE CORES E FIM DE JOGO ---
            if (data.status_jogo !== 'Jogando') {
                resetBtn.classList.remove('hidden');
                
                if (data.status_jogo.toLowerCase().includes('perdeu') || data.status_jogo.toLowerCase().includes('derrota')) {
                    // MUDAR FUNDO PARA ROSA QUANDO ERRA/PERDE
                    document.body.style.background = 'radial-gradient(circle at 20% 30%, #ffe0e6 0%, #ffd6d6 100%)';
                    gameMessage.style.color = '#d96b8a';
                    
                    if (!document.getElementById('reveal-word')) {
                        const revealMsg = document.createElement('p');
                        revealMsg.id = 'reveal-word';
                        revealMsg.innerText = `A palavra era: ${data.palavra || ''}`;
                        revealMsg.style.cssText = "margin-top: 10px; color: #bc7e9e; font-size: 0.8rem; font-weight: 600; font-style: italic;";
                        gameContainer.insertBefore(revealMsg, resetBtn);
                    }
                } else {
                    // MUDAR FUNDO PARA VERDE QUANDO GANHA
                    document.body.style.background = 'radial-gradient(circle at 20% 30%, #e8fff1 0%, #d8ffe8 100%)';
                    gameMessage.style.color = '#69b97d';
                }
            }
        } catch (err) {
            console.error("Erro na tentativa:", err);
        }
    }
}

function reiniciarJogo() {
    location.reload();
}