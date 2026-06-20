alert("O arquivo script.js está conectado e funcionando!");
// ==========================================
// 1. INICIALIZAÇÃO GERAL E EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadAccessibilityPref();
    
    // Inicializa vídeo se existir na página
    const video = document.getElementById('video-aula');
    if (video) {
        video.addEventListener('ended', () => {
            if (localStorage.getItem('video_concluido') !== 'true') {
                localStorage.setItem('video_concluido', 'true');
                alert("Ótimo! Você concluiu a videoaula.");
                atualizarStatusMaterial();
            }
        });
    }

    // Inicializa Fórum se estiver na página
    if (document.getElementById('forum-feed')) {
        carregarDadosForum();
        renderizarForum();
    }
});

// ==========================================
// 2. SISTEMA DE ACESSIBILIDADE
// ==========================================
function toggleAccessibility() {
    const body = document.body;
    body.classList.toggle('accessibility-mode');
    
    const isAccessible = body.classList.contains('accessibility-mode');
    localStorage.setItem('acessibilidade', isAccessible);
}

function loadAccessibilityPref() {
    if (localStorage.getItem('acessibilidade') === 'true') {
        document.body.classList.add('accessibility-mode');
    }
}

// ==========================================
// 3. SISTEMA DE LOGIN E AUTENTICAÇÃO
// ==========================================
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const nome = email.split('@')[0];
    
    localStorage.setItem('userLogado', 'true');
    localStorage.setItem('userName', nome);
    
    calcularOfensiva();
    window.location.href = 'home.html';
}

function handleLogout() {
    localStorage.removeItem('userLogado');
    alert("Saindo do sistema...");
    window.location.href = 'index.html';
}

function checkAuth() {
    if (localStorage.getItem('userLogado') !== 'true') {
        window.location.href = 'index.html';
    } else {
        updateNavbarUI();
    }
}

function calcularOfensiva() {
    const dataAtual = new Date().toDateString();
    let ultimaData = localStorage.getItem('ultimaDataLogin');
    let streak = parseInt(localStorage.getItem('userStreak')) || 0;

    if (ultimaData === dataAtual) {
        // Já logou hoje
    } else if (ultimaData) {
        let ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        
        if (ultimaData === ontem.toDateString()) {
            streak += 1;
        } else {
            streak = 1;
        }
    } else {
        streak = 1;
    }

    localStorage.setItem('ultimaDataLogin', dataAtual);
    localStorage.setItem('userStreak', streak);
}

function updateNavbarUI() {
    const nome = localStorage.getItem('userName') || 'Aluno';
    const streak = localStorage.getItem('userStreak') || '0';
    
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const streakEl = document.getElementById('user-streak');
    
    if (avatarEl) avatarEl.textContent = nome.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = nome;
    if (streakEl) streakEl.textContent = `${streak} Dias`;
}

// ==========================================
// 4. PROGRESSO DA TRILHA E UNIDADES
// ==========================================
// --- SISTEMA DA TRILHA PRINCIPAL (unidades.html) ---
function verificarProgressoUnidades() {
    // Se a Unidade 1 inteira foi completada (nota >= 80 na avaliação)
    if (localStorage.getItem('unidade1Completed') === 'true') {
        const uni2 = document.getElementById('unidade-2');
        const linha1 = document.getElementById('linha-1');
        
        if (uni2) {
            // Apenas troca as classes visuais e libera o clique
            uni2.classList.remove('locked');
            uni2.classList.add('unlocked');
            uni2.style.pointerEvents = 'auto'; // Remove o bloqueio de clique
            
            // Troca o ícone do cadeado
            const icon = uni2.querySelector('.trilha-icon i');
            if(icon) icon.className = 'fas fa-code-branch'; 
        }
        if (linha1) linha1.classList.remove('locked');
    }
}

function verificarProgressoInterno() {
    // Material de Estudo
    if (localStorage.getItem('uni1_conteudo') === 'true') {
        marcarCheckbox('check-conteudo');
        desbloquearCard('card-exercicios');
        const txtExe = document.getElementById('txt-exercicios');
        if(txtExe) txtExe.innerText = "(Liberado! Clique para simular/acessar)";
    }

    // Trilha de Exercícios
    if (localStorage.getItem('ex2_done') === 'true' || localStorage.getItem('uni1_exercicios') === 'true') {
        marcarCheckbox('check-exercicios');
        desbloquearCard('card-avaliacao');
        localStorage.setItem('uni1_exercicios', 'true'); 
        const txtAva = document.getElementById('txt-avaliacao');
        if(txtAva) txtAva.innerText = "(Liberado! Clique para fazer a prova)";
    }

    // Avaliação Final
    if (localStorage.getItem('uni1_avaliacao') === 'true') {
        marcarCheckbox('check-avaliacao');
        const txtAva = document.getElementById('txt-avaliacao');
        if(txtAva) txtAva.innerText = "Aprovado! Unidade 2 desbloqueada na trilha.";
    }
}

// Utilitários de Interface
function marcarCheckbox(id) {
    const el = document.getElementById(id);
    if(el) el.className = 'fas fa-check-square check-icon marcado';
}

function desbloquearCard(id) {
    const el = document.getElementById(id);
    if(el) el.classList.remove('locked');
}

// ==========================================
// 5. MATERIAL DE ESTUDO
// ==========================================
function marcarVideoConcluido() {
    if (localStorage.getItem('video_concluido') !== 'true') {
        localStorage.setItem('video_concluido', 'true');
        alert("Ótimo! Você concluiu a videoaula.");
        atualizarStatusMaterial();
    } else {
        alert("Esta aula já está marcada como concluída!");
    }
}

function lerApostila() {
    window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
    if (localStorage.getItem('apostila_concluida') !== 'true') {
        localStorage.setItem('apostila_concluida', 'true');
        atualizarStatusMaterial();
    }
}

function atualizarStatusMaterial() {
    const checkVideo = document.getElementById('check-video');
    const checkApostila = document.getElementById('check-apostila');
    
    if(!checkVideo || !checkApostila) return;

    const videoFeito = localStorage.getItem('video_concluido') === 'true';
    const apostilaFeita = localStorage.getItem('apostila_concluida') === 'true';

    if (videoFeito) checkVideo.className = 'fas fa-check-square check-icon marcado';
    if (apostilaFeita) checkApostila.className = 'fas fa-check-square check-icon marcado';

    if (videoFeito && apostilaFeita) {
        if (localStorage.getItem('uni1_conteudo') !== 'true') {
            localStorage.setItem('uni1_conteudo', 'true');
            setTimeout(() => {
                alert("Parabéns! Você concluiu o material de estudo.\nA Trilha de Exercícios foi liberada!");
            }, 500);
        }
    }
}

// ==========================================
// 6. SIMULADORES E FASES (QUIZ / IDE)
// ==========================================
function simularTerminoConteudo() {
    alert("Sistema: Você assistiu as videoaulas e leu o material. Exercícios liberados!");
    localStorage.setItem('uni1_conteudo', 'true');
    verificarProgressoInterno();
}

function simularTerminoExercicios() {
    if(document.getElementById('card-exercicios').classList.contains('locked')) return;
    alert("Sistema: Você terminou todos os exercícios. A Avaliação Final foi liberada!");
    localStorage.setItem('uni1_exercicios', 'true');
    verificarProgressoInterno();
}

// Animação de troca de telas
function irParaFase(faseAtualId, proximaFaseId) {
    const atual = document.getElementById(faseAtualId);
    const proxima = document.getElementById(proximaFaseId);
    
    atual.classList.remove('active');
    
    setTimeout(() => {
        atual.classList.add('hidden');
        proxima.classList.remove('hidden');
        requestAnimationFrame(() => {
            proxima.classList.add('active');
        });
    }, 400); 
}

// Fase 1 (Quiz)
const perguntasFase1 = [
    { p: "O que é um algoritmo?", op: ["Linguagem", "Passos finitos", "Hardware"], c: 1 },
    { p: "Tipo de dado para '10.5'?", op: ["int", "float/double", "char"], c: 1 },
    { p: "Variável booleana?", op: ["Letras", "Verdadeiro/Falso", "0 a 100"], c: 1 },
    { p: "Função do IF?", op: ["Repetir", "Decisão baseada em condição", "Imprimir"], c: 1 },
    { p: "Em C, como termina uma instrução?", op: [ "Ponto e vírgula (;)", "Dois pontos (:)", "Ponto (.)"], c: 0 }
];

function carregarQuizFase1() {
    const container = document.getElementById('quiz-fase1');
    if (!container) return; 

    let html = '';
    perguntasFase1.forEach((q, index) => {
        html += `<div class="questao-quiz"><p><strong>${index+1}. ${q.p}</strong></p><div>`;
        q.op.forEach((opcao, opIndex) => {
            html += `<label class="opcao-quiz"><input type="radio" name="q${index}" value="${opIndex}"> ${opcao}</label>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function corrigirFase1() {
    let acertos = 0;
    let todas = true;

    perguntasFase1.forEach((q, index) => {
        const selecionada = document.querySelector(`input[name="q${index}"]:checked`);
        if (!selecionada) todas = false;
        else if (parseInt(selecionada.value) === q.c) acertos++;
    });

    const boxResult = document.getElementById('resultado-fase1');
    boxResult.classList.remove('hidden', 'resultado-sucesso', 'resultado-erro');

    if (!todas) {
        boxResult.innerText = "Responda todas as questões!";
        boxResult.classList.add('resultado-erro');
        return;
    }

    const nota = (acertos / perguntasFase1.length) * 100;

    if (nota >= 80) {
        boxResult.innerText = `Nota: ${nota}%. Destravando Fase 2...`;
        boxResult.classList.add('resultado-sucesso');
        setTimeout(() => irParaFase('fase1-container', 'fase2-container'), 1500);
    } else {
        boxResult.innerText = `Nota: ${nota}%. Mínimo de 80%. Tente novamente!`;
        boxResult.classList.add('resultado-erro');
    }
}

// Fase 2 e 3 (IDE)
function executarCodigoC_Fase2() {
    const code = document.getElementById('editor-fase2').value;
    const consoleOut = document.getElementById('console-fase2');
    
    consoleOut.className = 'console-output'; 
    consoleOut.innerText = "$ gcc main.c -o main\n$ ./main\n";
    
    setTimeout(() => {
        const cleanCode = code.replace(/\s+/g, '');
        
        if (!code.includes(';')) {
            consoleOut.innerText += "main.c: erro: esperava ';' antes do fim do retorno.\n";
            consoleOut.className += ' console-error';
            return;
        }

        const hasSumLogic = cleanCode.includes('returna+b;') || cleanCode.includes('returnb+a;') || cleanCode.includes('return(a+b);');
        
        if (hasSumLogic) {
            consoleOut.innerText += "[Test Case 1: soma(5, 5)] -> 10: PASSOU ✅\n[Test Case 2: soma(-2, 8)] -> 6: PASSOU ✅\n\n🎉 BUILD SUCESS! Código Aprovado.";
            setTimeout(() => irParaFase('fase2-container', 'fase3-container'), 2500);
        } else {
            consoleOut.innerText += "❌ Erro Lógico: A função não retornou a soma de 'a' e 'b'. Lembre-se do operador '+'.";
            consoleOut.className += ' console-error';
        }
    }, 800); 
}

function avaliarDesafioFinalC() {
    const questaoA = document.getElementById('select-fase3').value;
    const codeB = document.getElementById('editor-fase3').value;
    const consoleOut = document.getElementById('console-fase3');
    
    consoleOut.className = 'console-output';
    consoleOut.classList.remove('hidden');
    consoleOut.innerText = "Analisando Sistema...\n";

    if (questaoA !== '%d') {
        consoleOut.innerText += "❌ Parte A: Erro. '%d' ou '%i' são usados para inteiros (decimal).\n";
        consoleOut.className += ' console-error';
        return;
    }
    consoleOut.innerText += "✅ Parte A: %d é Correto!\n\n$ gcc boss.c -o boss\n$ ./boss\n";

    setTimeout(() => {
        const cleanCode = codeB.replace(/\s+/g, '');
        const usedModulo = cleanCode.includes('%2');
        const correctLogic = cleanCode.includes('%2==0') || cleanCode.includes('%2===0');
        
        if (usedModulo && correctLogic) {
            consoleOut.innerText += "✅ Teste [ehPar(4)] -> 1: PASSOU\n✅ Teste [ehPar(7)] -> 0: PASSOU\n\n🏆 PARABÉNS! COMPILADO COM SUCESSO. Você venceu a unidade!";
            localStorage.setItem('uni1_exercicios', 'true');
            setTimeout(() => {
                alert("Nível Concluído! Retornando ao Menu da Unidade.");
                window.location.href = "opcoes-unidade.html";
            }, 3000);
        } else {
            consoleOut.innerText += "❌ Parte B: Erro. A função falhou. Dica: Use o operador de resto de divisão '%' por 2.";
            consoleOut.className += ' console-error';
        }
    }, 1000);
}

// ==========================================
// 7. AVALIAÇÃO FINAL (TIMER E PROVA)
// ==========================================
const questoesProva = [
    { p: "Qual estrutura de repetição executa o bloco pelo menos uma vez antes de testar a condição?", op: ["for", "while", "do-while"], c: 2 },
    { p: "Em C, como declaramos uma variável do tipo caractere?", op: ["char letra;", "string letra;", "character letra;"], c: 0 },
    { p: "Qual é o operador lógico para 'OU' (OR) em C?", op: ["&&", "||", "!"], c: 1 },
    { p: "O que o comando 'return 0;' faz na função main()?", op: ["Gera um erro no código", "Indica que o programa terminou com sucesso", "Reinicia o computador"], c: 1 },
    { p: "Como adicionamos um comentário de uma linha em C?", op: ["// Comentário", "/* Comentário */", "# Comentário"], c: 0 }
];

let tempoProva = 3600; // 1 Hora
let timerInterval;

function carregarProva() {
    const container = document.getElementById('quiz-prova');
    if (!container) return; 

    let html = '';
    questoesProva.forEach((q, index) => {
        html += `<div class="questao-quiz"><p><strong>${index+1}. ${q.p}</strong> (10 pts)</p><div>`;
        q.op.forEach((opcao, opIndex) => {
            html += `<label class="opcao-quiz" style="display:block; margin: 8px 0;"><input type="radio" name="p${index}" value="${opIndex}"> ${opcao}</label>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function iniciarProva() {
    carregarProva();
    irParaFase('intro-prova', 'area-prova');
    timerInterval = setInterval(atualizarTimer, 1000);
}

function atualizarTimer() {
    tempoProva--;
    
    const minutos = Math.floor(tempoProva / 60);
    const segundos = tempoProva % 60;
    
    const display = document.getElementById('timer-display');
    if(display) {
        display.innerHTML = `<i class="fas fa-clock"></i> ${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        if (tempoProva <= 300) { display.classList.add('warning'); }
    }

    if (tempoProva <= 0) {
        clearInterval(timerInterval);
        alert("O tempo esgotou! Entregando a prova automaticamente...");
        finalizarProva(true);
    }
}

function avaliarCodigoProvaC() {
    const code = document.getElementById('editor-prova').value;
    const cleanCode = code.replace(/\s+/g, '');
    const containsMultiplication = cleanCode.includes('returnbase*altura;') || cleanCode.includes('returnaltura*base;') || cleanCode.includes('return(base*altura);');
    return containsMultiplication ? 50 : 0; 
}

function finalizarProva(porTempo = false) {
    if (!porTempo) {
        const confirmar = confirm("Tem certeza que deseja entregar a prova? Não será possível alterar as respostas.");
        if (!confirmar) return;
    }

    clearInterval(timerInterval); 

    let notaObjetivas = 0;
    questoesProva.forEach((q, index) => {
        const selecionada = document.querySelector(`input[name="p${index}"]:checked`);
        if (selecionada && parseInt(selecionada.value) === q.c) { notaObjetivas += 10; }
    });

    const notaPratica = avaliarCodigoProvaC();
    const notaFinal = notaObjetivas + notaPratica;

    exibirResultado(notaFinal, notaObjetivas, notaPratica);
}

function exibirResultado(notaTotal, objPts, pratPts) {
    irParaFase('area-prova', 'resultado-prova');

    const icone = document.getElementById('resultado-icone');
    const titulo = document.getElementById('resultado-titulo');
    const msg = document.getElementById('resultado-mensagem');
    const detalhes = document.getElementById('resultado-detalhes');
    
    detalhes.classList.remove('hidden');
    detalhes.innerHTML = `Objetivas: <strong>${objPts}/50</strong> | Prática C: <strong>${pratPts}/50</strong>`;

    if (notaTotal >= 80) {
        icone.innerHTML = '<i class="fas fa-trophy" style="color: #f1c40f;"></i>';
        titulo.innerText = "Aprovado com Excelência!";
        titulo.style.color = "var(--success-green)";
        msg.innerText = `Sua nota final foi ${notaTotal}%. Você concluiu a Unidade 1 com maestria e desbloqueou a Unidade 2!`;
        detalhes.className = 'resultado-box resultado-sucesso';
        
        localStorage.setItem('uni1_avaliacao', 'true');
        localStorage.setItem('unidade1Completed', 'true');
    } else {
        icone.innerHTML = '<i class="fas fa-times-circle" style="color: #e74c3c;"></i>';
        titulo.innerText = "Não foi dessa vez...";
        titulo.style.color = "#e74c3c";
        msg.innerText = `Sua nota final foi ${notaTotal}%. Você precisa de no mínimo 80% para aprovação. Revise o material e tente novamente!`;
        detalhes.className = 'resultado-box resultado-erro';
    }
}

function voltarParaUnidade() { window.location.href = "opcoes-unidade.html"; }

// ==========================================
// 8. FÓRUM DE DISCUSSÕES
// ==========================================
let forumData = [];
const currentUser = "Aluno"; 
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

function abrirModalPost() {
    const modal = document.getElementById('modal-post');
    const textarea = document.getElementById('novo-post-texto');
    modal.classList.remove('hidden');
    setTimeout(() => textarea.focus(), 100); 
}

function fecharModalPost() {
    const modal = document.getElementById('modal-post');
    const textarea = document.getElementById('novo-post-texto');
    modal.classList.add('hidden');
    textarea.value = ''; 
}

function carregarDadosForum() {
    const dadosSalvos = localStorage.getItem('algoritmolab_forum_v2');
    if (dadosSalvos) {
        forumData = JSON.parse(dadosSalvos);
    } else {
        forumData = [
            {
                id: generateId(), author: "Prof. Lógica", content: "Bem-vindos ao fórum da Unidade 1! Lembrem-se que o laço 'while' é perfeito quando não sabemos quantas vezes o código vai repetir. Alguém tem um exemplo prático?",
                time: "Há 2 horas", likes: 12, likedByMe: false,
                comments: [{ id: generateId(), author: "João Silva", content: "Eu uso muito em jogos, tipo um 'while(vida > 0)' para manter o jogo rodando!", likes: 5, likedByMe: false, replies: [] }]
            }
        ];
        salvarDadosForum();
    }
}

function salvarDadosForum() { localStorage.setItem('algoritmolab_forum_v2', JSON.stringify(forumData)); }

function criarPost() {
    const textarea = document.getElementById('novo-post-texto');
    const content = textarea.value.trim();
    if (!content) { alert("Escreva algo antes de publicar!"); return; }

    forumData.unshift({ id: generateId(), author: currentUser, content: content, time: "Agora mesmo", likes: 0, likedByMe: false, comments: [] });
    salvarDadosForum();
    fecharModalPost();
    renderizarForum();
}

function adicionarComentario(postId) {
    const input = document.getElementById(`input-comment-${postId}`);
    if (!input.value.trim()) return;
    const post = forumData.find(p => p.id === postId);
    if (post) {
        post.comments.push({ id: generateId(), author: currentUser, content: input.value.trim(), likes: 0, likedByMe: false, replies: [] });
        salvarDadosForum(); renderizarForum();
    }
}

function adicionarResposta(postId, commentId) {
    const input = document.getElementById(`input-reply-${commentId}`);
    if (!input.value.trim()) return;
    const post = forumData.find(p => p.id === postId);
    const comment = post.comments.find(c => c.id === commentId);
    if (comment) {
        comment.replies.push({ id: generateId(), author: currentUser, content: input.value.trim(), likes: 0, likedByMe: false });
        salvarDadosForum(); renderizarForum();
    }
}

function toggleInteracaoBox(id) {
    const el = document.getElementById(id);
    if (el.style.display === 'none' || el.style.display === '') {
        el.style.display = 'flex';
        el.querySelector('input').focus();
    } else { el.style.display = 'none'; }
}

function toggleLikePost(postId) {
    const post = forumData.find(p => p.id === postId);
    post.likedByMe = !post.likedByMe; post.likes += post.likedByMe ? 1 : -1;
    salvarDadosForum(); renderizarForum();
}

function toggleLikeComment(postId, commentId) {
    const post = forumData.find(p => p.id === postId);
    const comment = post.comments.find(c => c.id === commentId);
    comment.likedByMe = !comment.likedByMe; comment.likes += comment.likedByMe ? 1 : -1;
    salvarDadosForum(); renderizarForum();
}

function renderizarForum() {
    const feed = document.getElementById('forum-feed');
    if(!feed) return;
    let html = '';

    forumData.forEach(post => {
        const likeClass = post.likedByMe ? 'liked' : '';
        const likeIcon = post.likedByMe ? 'fas fa-heart' : 'far fa-heart';
        html += `
        <div class="post-card">
            <div class="post-header">
                <div class="post-avatar">${post.author.charAt(0)}</div>
                <div><div class="post-author">${post.author}</div><div class="post-time">${post.time}</div></div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="forum-actions">
                <button class="action-btn ${likeClass}" onclick="toggleLikePost('${post.id}')"><i class="${likeIcon}"></i> ${post.likes}</button>
                <button class="action-btn" onclick="toggleInteracaoBox('comment-box-${post.id}')"><i class="far fa-comment-alt"></i> Comentar</button>
            </div>
            
            <div class="comments-section">
                ${post.comments.map(c => `
                    <div class="comment-card">
                        <strong>${c.author}</strong> <span class="post-time">- Comentou</span>
                        <div class="comment-content">${c.content}</div>
                        <div class="forum-actions" style="border:none; padding:0;">
                            <button class="action-btn ${c.likedByMe ? 'liked' : ''}" onclick="toggleLikeComment('${post.id}', '${c.id}')"><i class="${c.likedByMe ? 'fas' : 'far'} fa-heart"></i> ${c.likes}</button>
                            <button class="action-btn" onclick="toggleInteracaoBox('reply-box-${c.id}')"><i class="fas fa-reply"></i> Responder</button>
                        </div>
                        <div class="replies-section">
                            ${(c.replies || []).map(r => `<div class="reply-card"><strong>${r.author}:</strong> ${r.content}</div>`).join('')}
                            <div class="input-row" id="reply-box-${c.id}" style="display:none;">
                                <input type="text" id="input-reply-${c.id}" class="forum-input" placeholder="Sua resposta...">
                                <button class="btn" onclick="adicionarResposta('${post.id}', '${c.id}')">Enviar</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
                <div class="input-row" id="comment-box-${post.id}" style="display:none;">
                    <input type="text" id="input-comment-${post.id}" class="forum-input" placeholder="Escreva um comentário...">
                    <button class="btn" onclick="adicionarComentario('${post.id}')">Comentar</button>
                </div>
            </div>
        </div>`;
    });
    feed.innerHTML = html;
}

// ==========================================
// 9. UTILITÁRIOS EXTRAS
// ==========================================
function resetarProgresso() {
    if(confirm("Tem certeza que deseja apagar todo o progresso para testar novamente?")) {
        localStorage.clear();
        location.reload();
    }
}

function abrirConfiguracoes() {
    alert("Configurações: Painel em desenvolvimento.");
}
/* ==========================================================================
   SISTEMA FLUIDO DO FÓRUM (forum.js)
   ========================================================================== */

let forumData = [];
const currentUser = "Aluno"; // Seu nome de usuário logado
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosForum();
    renderizarForum();
});

// ==========================================
// CONTROLE DO MODAL
// ==========================================
function abrirModalPost() {
    const modal = document.getElementById('modal-post');
    const textarea = document.getElementById('novo-post-texto');
    modal.classList.remove('hidden');
    setTimeout(() => textarea.focus(), 100); // Foca no campo após a animação
}

function fecharModalPost() {
    const modal = document.getElementById('modal-post');
    const textarea = document.getElementById('novo-post-texto');
    modal.classList.add('hidden');
    textarea.value = ''; // Limpa ao fechar
}

// ==========================================
// DADOS (LOCALSTORAGE)
// ==========================================
function carregarDadosForum() {
    const dadosSalvos = localStorage.getItem('algoritmolab_forum_v2');
    if (dadosSalvos) {
        forumData = JSON.parse(dadosSalvos);
    } else {
        // Dados semente
        forumData = [
            {
                id: generateId(),
                author: "Prof. Lógica",
                content: "Bem-vindos ao fórum da Unidade 1! Lembrem-se que o laço 'while' é perfeito quando não sabemos quantas vezes o código vai repetir. Alguém tem um exemplo prático?",
                time: "Há 2 horas",
                likes: 12,
                likedByMe: false,
                comments: [
                    {
                        id: generateId(),
                        author: "João Silva",
                        content: "Eu uso muito em jogos, tipo um 'while(vida > 0)' para manter o jogo rodando!",
                        likes: 5,
                        likedByMe: false,
                        replies: [
                            {
                                id: generateId(),
                                author: "Prof. Lógica",
                                content: "Excelente exemplo, João! O famoso Game Loop.",
                                likes: 2,
                                likedByMe: false
                            }
                        ]
                    }
                ]
            }
        ];
        salvarDadosForum();
    }
}

function salvarDadosForum() {
    localStorage.setItem('algoritmolab_forum_v2', JSON.stringify(forumData));
}

// ==========================================
// AÇÕES DO FÓRUM
// ==========================================
function criarPost() {
    const textarea = document.getElementById('novo-post-texto');
    const content = textarea.value.trim();
    
    if (!content) {
        alert("Escreva algo antes de publicar!");
        return;
    }

    const novoPost = {
        id: generateId(), author: currentUser, content: content,
        time: "Agora mesmo", likes: 0, likedByMe: false, comments: []
    };

    forumData.unshift(novoPost); // Adiciona no topo
    salvarDadosForum();
    fecharModalPost();
    renderizarForum();
}

function adicionarComentario(postId) {
    const input = document.getElementById(`input-comment-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    const post = forumData.find(p => p.id === postId);
    if (post) {
        post.comments.push({
            id: generateId(), author: currentUser, content: content,
            likes: 0, likedByMe: false, replies: []
        });
        salvarDadosForum();
        renderizarForum();
    }
}

function adicionarResposta(postId, commentId) {
    const input = document.getElementById(`input-reply-${commentId}`);
    const content = input.value.trim();
    if (!content) return;

    const post = forumData.find(p => p.id === postId);
    const comment = post.comments.find(c => c.id === commentId);
    if (comment) {
        comment.replies.push({
            id: generateId(), author: currentUser, content: content,
            likes: 0, likedByMe: false
        });
        salvarDadosForum();
        renderizarForum();
    }
}

function toggleInteracaoBox(id) {
    const el = document.getElementById(id);
    if (el.style.display === 'none' || el.style.display === '') {
        el.style.display = 'flex';
        el.querySelector('input').focus();
    } else {
        el.style.display = 'none';
    }
}

// ==========================================
// CURTIDAS
// ==========================================
function toggleLikePost(postId) {
    const post = forumData.find(p => p.id === postId);
    post.likedByMe = !post.likedByMe;
    post.likes += post.likedByMe ? 1 : -1;
    salvarDadosForum(); renderizarForum();
}

function toggleLikeComment(postId, commentId) {
    const post = forumData.find(p => p.id === postId);
    const comment = post.comments.find(c => c.id === commentId);
    comment.likedByMe = !comment.likedByMe;
    comment.likes += comment.likedByMe ? 1 : -1;
    salvarDadosForum(); renderizarForum();
}

function toggleLikeReply(postId, commentId, replyId) {
    const post = forumData.find(p => p.id === postId);
    const comment = post.comments.find(c => c.id === commentId);
    const reply = comment.replies.find(r => r.id === replyId);
    reply.likedByMe = !reply.likedByMe;
    reply.likes += reply.likedByMe ? 1 : -1;
    salvarDadosForum(); renderizarForum();
}

// ==========================================
// RENDERIZAÇÃO
// ==========================================
function renderizarForum() {
    const feed = document.getElementById('forum-feed');
    let html = '';

    forumData.forEach(post => {
        const likeIcon = post.likedByMe ? 'fas fa-heart' : 'far fa-heart';
        const likeClass = post.likedByMe ? 'liked' : '';
        const initial = post.author.charAt(0).toUpperCase();

        html += `
        <div class="post-card">
            <div class="post-header">
                <div class="post-avatar">${initial}</div>
                <div>
                    <div class="post-author">${post.author}</div>
                    <div class="post-time">${post.time}</div>
                </div>
            </div>
            
            <div class="post-content">${post.content}</div>
            
            <div class="forum-actions">
                <button class="action-btn ${likeClass}" onclick="toggleLikePost('${post.id}')">
                    <i class="${likeIcon}"></i> <span>${post.likes} Curtidas</span>
                </button>
                <button class="action-btn" onclick="document.getElementById('input-comment-${post.id}').focus()">
                    <i class="far fa-comment-alt"></i> <span>Comentar</span>
                </button>
            </div>

            <div class="comments-section">
        `;

        post.comments.forEach(comment => {
            const cLikeIcon = comment.likedByMe ? 'fas fa-heart' : 'far fa-heart';
            const cLikeClass = comment.likedByMe ? 'liked' : '';
            
            html += `
                <div class="comment-card">
                    <strong style="color: var(--primary-blue); font-size: 0.95rem;">${comment.author}</strong>
                    <div class="comment-content">${comment.content}</div>
                    
                    <div style="display: flex; gap: 15px; margin-top: 8px;">
                        <button class="action-btn ${cLikeClass}" style="padding: 4px 8px; font-size: 0.85rem;" onclick="toggleLikeComment('${post.id}', '${comment.id}')">
                            <i class="${cLikeIcon}"></i> ${comment.likes}
                        </button>
                        <button class="action-btn" style="padding: 4px 8px; font-size: 0.85rem;" onclick="toggleInteracaoBox('reply-box-${comment.id}')">
                            <i class="fas fa-reply"></i> Responder
                        </button>
                    </div>

                    <div id="reply-box-${comment.id}" class="input-row" style="display: none; margin-top: 10px;">
                        <input type="text" id="input-reply-${comment.id}" class="forum-input" placeholder="Respondendo a ${comment.author}..." onkeypress="if(event.key === 'Enter') adicionarResposta('${post.id}', '${comment.id}')">
                        <button class="btn bg-dark" style="padding: 0 20px;" onclick="adicionarResposta('${post.id}', '${comment.id}')">Enviar</button>
                    </div>
            `;

            if (comment.replies && comment.replies.length > 0) {
                html += `<div class="replies-section">`;
                comment.replies.forEach(reply => {
                    const rLikeIcon = reply.likedByMe ? 'fas fa-heart' : 'far fa-heart';
                    const rLikeClass = reply.likedByMe ? 'liked' : '';
                    html += `
                        <div class="reply-card">
                            <strong style="font-size: 0.85rem; color: #64748b;">${reply.author}</strong>
                            <div style="font-size: 0.9rem; margin: 4px 0; color: #334155;">${reply.content}</div>
                            <button class="action-btn ${rLikeClass}" style="padding: 2px 5px; font-size: 0.8rem;" onclick="toggleLikeReply('${post.id}', '${comment.id}', '${reply.id}')">
                                <i class="${rLikeIcon}"></i> ${reply.likes}
                            </button>
                        </div>
                    `;
                });
                html += `</div>`;
            }
            html += `</div>`;
        });

        html += `
                <div class="input-row">
                    <input type="text" id="input-comment-${post.id}" class="forum-input" placeholder="Escreva um comentário..." onkeypress="if(event.key === 'Enter') adicionarComentario('${post.id}')">
                    <button class="btn bg-teal" style="color: var(--primary-blue); padding: 0 20px;" onclick="adicionarComentario('${post.id}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div> 
        </div> 
        `;
    });

    feed.innerHTML = html;
}
/* ==========================================================================
   LÓGICA GERAL & UTILITÁRIOS
   ========================================================================== */
function resetarProgresso() {
    if(confirm("Tem certeza que deseja apagar todo o progresso para testar novamente?")) {
        localStorage.clear();
        location.reload();
    }
}
function abrirConfiguracoes() { alert("Configurações: Painel em desenvolvimento."); }
function handleLogout() { alert("Saindo do sistema..."); }
function toggleAccessibility() { document.body.classList.toggle('alto-contraste'); alert("Modo acessibilidade alternado."); }

/* ==========================================================================
   SISTEMA DA TRILHA PRINCIPAL (unidades.html) - NOVO E CORRIGIDO
   ========================================================================== */
function verificarProgressoUnidades() {
    // 1. Unidade 1 Concluída -> Desbloqueia Unidade 2
    if (localStorage.getItem('unidade1Completed') === 'true') {
        const itemUni2 = document.getElementById('unidade-2-item');
        const connectorUni1 = document.querySelector('#unidade-1-item .trilha-connector');

        if (itemUni2) {
            itemUni2.classList.remove('locked');
            itemUni2.classList.add('unlocked');
            
            // Alterar ícone do cadeado para cadeado aberto
            const iconContainer = itemUni2.querySelector('.status-circle.locked-icon-container');
            if (iconContainer) {
                iconContainer.querySelector('i').className = 'fas fa-unlock';
            }
        }
        
        if (connectorUni1) {
             connectorUni1.classList.remove('locked');
        }
    }

    // 2. Unidade 2 Concluída -> Desbloqueia Unidade 3
    if (localStorage.getItem('uni2_avaliacao') === 'true') { 
        const itemUni3 = document.getElementById('unidade-3-item');
        const connectorUni2 = document.querySelector('#unidade-2-item .trilha-connector');

        if (itemUni3) {
            itemUni3.classList.remove('locked');
            itemUni3.classList.add('unlocked');
            
            const iconContainer = itemUni3.querySelector('.status-circle.locked-icon-container');
            if (iconContainer) {
                iconContainer.querySelector('i').className = 'fas fa-unlock';
            }
        }
        
        if (connectorUni2) {
             connectorUni2.classList.remove('locked');
        }
    }
}
