document.addEventListener('DOMContentLoaded', () => {

  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ehDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Header ganha fundo ao rolar
  const header = document.getElementById('header');

  // Revelação suave — cascata calculada por seção
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('section').forEach((secao) => {
    secao.querySelectorAll('.revelar').forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 0.12, 0.6)}s`;
      observador.observe(el);
    });
  });

  // Cortinas (clip-path): o gatilho é a seção-mãe — um elemento 100% clipado
  // nunca intersecta, então observá-lo diretamente jamais dispararia
  document.querySelectorAll('.cortina').forEach((cortina) => {
    const gatilho = cortina.closest('section') || cortina.parentElement;
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          cortina.classList.add('visivel');
          obs.disconnect();
        }
      });
    }, { threshold: 0.25 });
    obs.observe(gatilho);
  });

  // Abrir apenas um item do FAQ por vez
  const faqs = document.querySelectorAll('.faq details');
  faqs.forEach((faq) => {
    faq.addEventListener('toggle', () => {
      if (faq.open) {
        faqs.forEach((outro) => { if (outro !== faq) outro.open = false; });
      }
    });
  });

  // No mobile, troca o vídeo do herói por imagem estática (economia de dados)
  const videoHero = document.querySelector('.hero-fundo video');
  if (videoHero && window.matchMedia('(max-width: 768px)').matches) {
    const img = document.createElement('img');
    img.src = videoHero.getAttribute('poster') || 'assets/consultorio-hero.jpg';
    img.alt = '';
    videoHero.replaceWith(img);
  }

  if (reduzMovimento) {
    header.classList.toggle('rolado', window.scrollY > 40);
    window.addEventListener('scroll', () => {
      header.classList.toggle('rolado', window.scrollY > 40);
    }, { passive: true });
    return; // nada de travessia, dolly ou luz — só o essencial
  }

  /* ===================================================================
     MOTOR DE MOVIMENTO — um único loop, só transform/opacity (60fps)
     =================================================================== */

  const heroWrap = document.querySelector('.hero-wrap');
  const heroFundo = document.querySelector('.hero-fundo');
  const heroConteudo = document.querySelector('.hero-conteudo');
  const rolarHint = document.querySelector('.rolar-hint');
  const fundosParalaxe = document.querySelectorAll('[data-parallax]');

  // luz do herói que segue o mouse (só desktop)
  const luz1 = document.querySelector('.luz-1');
  const luz2 = document.querySelector('.luz-2');
  const mouse = { x: 0, y: 0 };   // alvo (deslocamento a partir do centro)
  const luzPos = { x: 0, y: 0 };  // posição atual, com inércia

  if (ehDesktop && luz1) {
    // o JS assume o controle: sai a animação de flutuar, entra a inércia do olhar
    luz1.style.animation = 'none';
    if (luz2) luz2.style.animation = 'none';
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 90;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 60;
    }, { passive: true });
  }

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const quadro = () => {
    const vh = window.innerHeight;
    const rolagem = window.scrollY;

    // header
    header.classList.toggle('rolado', rolagem > 40);

    // ---- A TRAVESSIA DA PORTA ----
    // progresso 0→1 enquanto o herói está "preso": a câmera avança para dentro da foto
    // no mobile a travessia é curta (118svh), então o gesto é mais suave e o texto sai antes
    if (heroWrap) {
      const ehMobile = window.innerWidth <= 900;
      const alcance = Math.max(1, heroWrap.offsetHeight - vh);
      const p = clamp(rolagem / alcance, 0, 1);
      if (heroFundo) heroFundo.style.transform = `scale(${1 + p * (ehMobile ? 0.1 : 0.22)})`;
      if (heroConteudo) {
        heroConteudo.style.opacity = clamp(1 - p * (ehMobile ? 2.4 : 1.6), 0, 1);
        heroConteudo.style.transform = `translateY(${p * (ehMobile ? -36 : -70)}px)`;
      }
      if (rolarHint) rolarHint.style.opacity = clamp(1 - p * 4, 0, 1);
    }

    // ---- LUZ QUE SEGUE O OLHAR (inércia) ----
    if (ehDesktop && luz1) {
      luzPos.x += (mouse.x - luzPos.x) * 0.04;
      luzPos.y += (mouse.y - luzPos.y) * 0.04;
      luz1.style.transform = `translate(${luzPos.x}px, ${luzPos.y}px)`;
      if (luz2) luz2.style.transform = `translate(${-luzPos.x * 0.6}px, ${-luzPos.y * 0.6}px)`;
    }

    // ---- PARALAXE + DOLLY DOS INTERLÚDIOS ----
    fundosParalaxe.forEach((fundo) => {
      const secao = fundo.parentElement.getBoundingClientRect();
      if (secao.bottom < 0 || secao.top > vh) return;
      const centro = secao.top + secao.height / 2;
      const paralaxe = (centro - vh / 2) * -0.12;
      // dolly: a imagem chega levemente ampliada e "assenta" ao entrar na tela
      const t = clamp((vh - secao.top) / (vh + secao.height), 0, 1);
      const escala = fundo.classList.contains('interlude-fundo') ? 1.14 - 0.14 * t : 1;
      fundo.style.transform = `translateY(${paralaxe}px) scale(${escala})`;
    });

    requestAnimationFrame(quadro);
  };

  requestAnimationFrame(quadro);
});
