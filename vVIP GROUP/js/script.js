// Variáveis globais para melhor performance
let currentViewers = Math.floor(Math.random() * (230 - 140 + 1)) + 140;
let lastViewerUpdate = 0;
let viewerInterval = null;
let countdownInterval = null;

// Função para garantir que o DOM está carregado
function domReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Função para iniciar a contagem regressiva
function startCountdown() {
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const countdownElement = document.getElementById('countdown');
    
    if (!minutesElement || !secondsElement || !countdownElement) return;
    
    let duration = 5 * 60; // 5 minutos
    let lastUpdate = Date.now();
    
    function updateCountdown() {
        const now = Date.now();
        const delta = now - lastUpdate;
        
        if (delta >= 1000) {
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;

            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');

            if (duration === 60) {
                countdownElement.style.animation = 'blink 1s infinite';
            }

            if (--duration < 0) {
                countdownElement.innerHTML = "OFFER EXPIRED";
                countdownElement.style.color = "#ff0000";
                countdownElement.style.animation = 'none';
                return;
            }
            
            lastUpdate = now;
        }
        
        requestAnimationFrame(updateCountdown);
    }
    
    requestAnimationFrame(updateCountdown);
}

// Função para simular visualizações em tempo real
function updateLiveViewers() {
    const viewerCount = document.getElementById('viewerCount');
    if (!viewerCount) return;
    
    const now = Date.now();
    if (now - lastViewerUpdate >= 3000) {
        let change = 0;
        const willIncrease = Math.random() < 0.7;
        
        if (willIncrease) {
            change = Math.floor(Math.random() * 3) + 1;
            if (Math.random() < 0.1) {
                change = Math.floor(Math.random() * 3) + 3;
            }
        } else {
            change = -(Math.floor(Math.random() * 2) + 1);
        }
        
        currentViewers = Math.max(140, Math.min(230, currentViewers + change));
        viewerCount.textContent = currentViewers;
        
        viewerCount.classList.add('increase');
        setTimeout(() => {
            viewerCount.classList.remove('increase');
        }, 1000);
        
        lastViewerUpdate = now;
    }
    
    requestAnimationFrame(updateLiveViewers);
}

// Função para verificar se o vídeo está carregado
function checkVideoLoad() {
    const video = document.getElementById('mainVideo');
    const viewerCount = document.getElementById('viewerCount');
    
    if (video && viewerCount) {
        viewerCount.textContent = currentViewers;
        if (!viewerInterval) {
            viewerInterval = setInterval(updateLiveViewers, 3000);
        }
    }
}

// Função para mostrar o popup
function showEndPopup() {
    const popup = document.createElement('div');
    popup.className = 'end-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Choose a payment option | <span class="highlight-price">Price $20</span></h3>
  <strong>You will receive VIP access after payment.</strong> If your payment fails, call on Telegram.
</p>
            <p class="timer">Offer expires in: <span id="popupCountdown">05:00</span></p>
            <div class="popup-buttons">
                <a href="https://t.me/Buy_Here33?text=Hello!%20I%20would%20like%20to%20buy%0A%0AContent:%20Access%20to%20the%20VIP%20group%20of%20Cp" class="popup-button" target="_blank" rel="noopener">
                    <i class="fas fa-lock"></i> GET VIP ACCESS NOW | $20
                </a>
                <a href="https://t.me/Buy_Here33?text=Hello!%20I%20would%20like%20to%20buy%0A%0AContent:%20Access%20to%20the%20VIP%20group%20of%20Cp.%20Buy%20Teens%20and%20all%20other%20leaked%20content%0ADescription:%0AExclusive%20high%20quality%20content%20%E2%80%A2%20Lifetime%20access%20%E2%80%A2%20Instant%20delivery" 
                   class="telegram-button" 
                   target="_blank" 
                   rel="noopener">
                    <i class="fab fa-telegram"></i> Contact via Telegram
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Inicia contagem regressiva no popup
    startPopupCountdown();
}

// Função para contagem regressiva no popup
function startPopupCountdown() {
    let duration = 5 * 60; // 5 minutos
    const countdownElement = document.getElementById('popupCountdown');
    
    const timer = setInterval(() => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (--duration < 0) {
            clearInterval(timer);
            const popup = document.querySelector('.end-popup');
            if (popup) {
                popup.remove();
            }
        }
    }, 1000);
}

// Função para verificar se o vídeo terminou
function setupVideoEndCheck() {
    const video = document.getElementById('mainVideo');
    if (video) {
        let hasEnded = false;
        
        video.addEventListener('timeupdate', () => {
            // Se o vídeo estiver nos últimos 5 segundos ou se o usuário pular para o final
            if ((video.currentTime >= video.duration - 5 || video.currentTime >= video.duration - 1) && !hasEnded) {
                hasEnded = true;
                showEndPopup();
            }
        });
        
        video.addEventListener('ended', () => {
            if (!hasEnded) {
                hasEnded = true;
                showEndPopup();
            }
        });
    }
}

// Função para inicializar todas as funcionalidades
function initializeAll() {
    // Inicia o cronômetro
    startCountdown();
    
    // Inicia o contador de espectadores
    checkVideoLoad();
    
    // Otimizações específicas para iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.webkitOverflowScrolling = 'touch';
        document.body.style.webkitTransform = 'translate3d(0,0,0)';
    }
    
    // Otimizações específicas para Android
    if (/Android/.test(navigator.userAgent)) {
        document.body.style.overflowScrolling = 'touch';
    }
    
    // Garante que o contador continue rodando mesmo quando a página estiver em segundo plano
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (!viewerInterval) {
                viewerInterval = setInterval(updateLiveViewers, 3000);
            }
        }
    });
    
    // Configura os eventos do vídeo
    const video = document.getElementById('mainVideo');
    if (video) {
        video.addEventListener('loadedmetadata', checkVideoLoad);
        video.addEventListener('play', checkVideoLoad);
        video.addEventListener('pause', () => {});
        video.addEventListener('ended', () => {});
    }
    
    setupVideoEndCheck();
}

// Inicializa tudo quando o DOM estiver pronto
domReady(initializeAll);

// Garante que os contadores continuem rodando mesmo quando o vídeo estiver pausado
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('mainVideo');
    if (video) {
        video.addEventListener('pause', () => {});
        video.addEventListener('play', () => {});
        video.addEventListener('ended', () => {});
    }
});

// Função para mostrar notificações de compras recentes
function showRecentPurchases() {
    const socialProof = document.querySelector('.social-proof');
    if (socialProof) {
        const names = ['John D.', 'Sarah M.', 'Mike T.', 'Lisa R.', 'Alex K.'];
        const times = ['2 minutes ago', '5 minutes ago', '10 minutes ago', '15 minutes ago'];
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomTime = times[Math.floor(Math.random() * times.length)];
        
        activityItem.innerHTML = `
            <div class="avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="activity-content">
                <span class="name">${randomName}</span>
                <span class="time">${randomTime}</span>
            </div>
        `;
        
        // Adiciona animação de entrada
        activityItem.style.opacity = '0';
        activityItem.style.transform = 'translateX(-20px)';
        
        socialProof.insertBefore(activityItem, socialProof.firstChild);
        
        // Anima a entrada do novo item
        setTimeout(() => {
            activityItem.style.opacity = '1';
            activityItem.style.transform = 'translateX(0)';
            activityItem.style.transition = 'all 0.5s ease';
        }, 100);
        
        // Remove o último item se houver mais de 5
        if (socialProof.children.length > 5) {
            const lastItem = socialProof.lastChild;
            lastItem.style.opacity = '0';
            lastItem.style.transform = 'translateX(20px)';
            lastItem.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                socialProof.removeChild(lastItem);
            }, 500);
        }
    }
}

// Função para impedir saída do site
function preventExit() {
    // Mensagem quando tentar fechar a janela
    window.onbeforeunload = function(e) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    };
    
    // Mostra popup quando o mouse se aproxima do topo
    let popupShown = false;
    document.addEventListener('mousemove', (e) => {
        if (e.clientY < 50 && !popupShown) {
            showEndPopup();
            popupShown = true;
        }
    });
}

// Função para animar os elementos quando entram na viewport
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                // Remove o observer após a primeira animação
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.cta-section, .payment-method, .video-wrapper').forEach(el => {
        observer.observe(el);
    });
}

// Função para adicionar efeito de digitação no título
function typeWriterEffect() {
    const title = document.querySelector('.cta-section h2');
    if (title) {
        const text = title.textContent;
        title.textContent = '';
        let i = 0;
        
        const typeWriter = setInterval(() => {
            if (i < text.length) {
                title.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeWriter);
            }
        }, 100);
    }
} 