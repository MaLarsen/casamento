(() => {
  'use strict';

  // Informações do convite. Campo vazio fica oculto.
  const INFO = {
    local: '',                                  // ex.: 'Espaço Jardim'
    endereco: '',                               // ex.: 'Rua X, 123 · Cidade/UF'
    traje: '',                                  // ex.: 'Traje esporte fino'
    confirmacao: '',                            // ex.: 'Confirme sua presença até 20/01/2027'
    listaPresentes: 'https://marcioemagali.com.br',
  };

  // Altura da aba (fração da altura do envelope) em cada versão do envelope
  const FLAP_H_BY_VARIANT = { floral: 0.4521, renda: 0.5271 };
  let FLAP_H = FLAP_H_BY_VARIANT.floral;
  const CARD_IN_ENV = 0.84;  // largura do cartão dentro do envelope, em fração da largura do envelope

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const reveal = $('reveal');
  const stage = $('stage');
  const rig = $('rig');
  const flap = $('flap');
  const seal = $('seal');
  const card = $('card');
  const flapShade = $('flapShade');
  const flapBackShade = $('flapBackShade');
  const kicker = $('kicker');
  const hint = $('hint');
  const openBtn = $('open');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const OPEN_AT = 0.9;     // progresso em que o convite já está no centro
  const CLICKABLE = 0.6;   // até aqui o envelope ainda aceita toque para abrir

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let L = null;        // medidas atuais
  let target = 0;      // progresso pedido pela rolagem
  let current = 0;     // progresso suavizado
  let raf = 0;
  let last = 0;
  let autoRaf = 0;     // rolagem automática disparada pelo toque

  function setVariant() {
    const v = location.hash === '#renda' ? 'renda' : 'floral';
    root.dataset.variant = v;
    FLAP_H = FLAP_H_BY_VARIANT[v];
  }

  function layout() {
    const vw = stage.clientWidth;
    const vh = stage.clientHeight;
    // No celular o envelope e o convite ocupam quase a tela toda
    // (reserva ~75px em cima e embaixo para o texto e a dica de rolagem)
    const W = Math.round(Math.min(vw * 0.94, vw < 700 ? (vh - 150) * 9 / 16 : vh * 0.41, 460));
    const H = W * 16 / 9;
    // Proporção do cartão acompanha a tela: 5:7 no desktop, mais alto no celular (cabe no envelope até 1,95)
    const cardRatio = clamp((vh * 0.88) / (vw * 0.92), 1.4, 1.95);
    const cwF = Math.round(Math.min(vw * 0.92, (vh * 0.88) / cardRatio, 540));

    root.style.setProperty('--W', W + 'px');
    root.style.setProperty('--cw', cwF + 'px');
    root.style.setProperty('--cr', cardRatio.toFixed(4));

    const cwA = W * CARD_IN_ENV;
    const chA = cwA * cardRatio;
    const gap = W * 0.05;
    const cardTopRest = H - chA - H * 0.035;

    // Afasta a "câmera" até a aba aberta caber na tela
    const s1 = Math.min(0.76, (vh * 0.9) / ((1 + FLAP_H) * H));
    const ty1 = Math.max(0, vh * 0.05 + FLAP_H * H * s1 + (H * s1) / 2 - vh / 2);
    // Cartão todo fora, ainda preso ao envelope, perto do centro
    const ty2 = -vh * 0.04 + s1 * (H / 2 + gap + chA / 2);
    // Envelope (com a aba aberta) sai inteiro por baixo da tela
    const ty3 = vh / 2 + H * s1 * (0.5 + FLAP_H) + vh * 0.04;

    L = {
      vw, vh, W, H, cwF, chA, s1, ty1, ty2, ty3,
      kAtt: cwA / cwF,
      cy0: cardTopRest + chA / 2 - H / 2,
      rise: cardTopRest + chA + gap,
    };
  }

  function render(p) {
    const { vh, H, chA, s1, ty1, ty2, ty3, kAtt, cy0, rise } = L;

    const tFlap = ease(seg(p, 0.05, 0.3));
    const tPull = ease(seg(p, 0.02, 0.26));
    const tRise = ease(seg(p, 0.3, 0.64));
    const tOut = ease(seg(p, 0.6, 0.88));

    // Envelope
    const s = lerp(1, s1, tPull);
    const ty = lerp(0, ty1, tPull) + (ty2 - ty1) * tRise + (ty3 - ty2) * tOut;
    rig.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;

    // Aba: gira em torno da borda superior e passa para trás do cartão depois de 90°
    const angle = 180 * tFlap;
    flap.style.transform = `perspective(${Math.round(H * 2.4)}px) rotateX(${angle.toFixed(2)}deg)`;
    flap.style.zIndex = angle > 90 ? 2 : 5;
    const rad = (angle * Math.PI) / 180;
    flapShade.style.opacity = (Math.sin(rad) * 0.28).toFixed(3);
    flapBackShade.style.opacity = (angle > 90 ? (1 - (angle - 90) / 90) * 0.3 : 0.3).toFixed(3);
    seal.style.opacity = angle < 88 ? 1 : 0;

    // Cartão: sobe de dentro do envelope e depois vem para o centro da tela
    const dyAtt = cy0 - rise * tRise;
    const dyOut = (-vh * 0.005 - ty) / s;
    const dy = lerp(dyAtt, dyOut, tOut);
    const k = lerp(kAtt, 1 / s, tOut);
    card.style.transform = `translate3d(0, ${dy.toFixed(2)}px, 0) scale(${k.toFixed(4)})`;
    // Sai da frente do bolso quando a base do cartão passa a borda de cima do envelope
    card.style.zIndex = dyAtt + chA / 2 < -H / 2 ? 6 : 3;

    const fade = 1 - seg(p, 0, 0.06);
    kicker.style.opacity = fade.toFixed(3);
    hint.style.opacity = fade.toFixed(3);
    openBtn.hidden = p >= CLICKABLE;
  }

  function readScroll() {
    if (reduceMotion.matches) return 1;
    const r = reveal.getBoundingClientRect();
    const total = reveal.offsetHeight - stage.clientHeight;
    return total > 0 ? clamp(-r.top / total) : 1;
  }

  function tick(now) {
    const dt = Math.min(64, now - (last || now));
    last = now;
    // Suaviza sem atrasar demais o dedo/roda do mouse
    current += (target - current) * (1 - Math.exp(-dt / 90));
    if (Math.abs(target - current) < 0.0004) current = target;
    render(current);
    raf = current === target ? 0 : requestAnimationFrame(tick);
    if (!raf) last = 0;
  }

  function onScroll() {
    target = readScroll();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function onResize() {
    layout();
    target = readScroll();
    current = target;
    render(current);
  }

  // Abre rolando a página até o convite, então o movimento é o mesmo da rolagem manual
  function openEnvelope() {
    const total = reveal.offsetHeight - stage.clientHeight;
    const from = window.scrollY;
    const to = reveal.offsetTop + total * OPEN_AT;
    if (total <= 0 || to <= from + 1) return;
    const dur = 3200 * (1 - clamp(current / OPEN_AT)) + 500;
    const t0 = performance.now();
    cancelAnimationFrame(autoRaf);
    const step = (now) => {
      const t = clamp((now - t0) / dur);
      window.scrollTo(0, from + (to - from) * ease(t));
      autoRaf = t < 1 ? requestAnimationFrame(step) : 0;
    };
    autoRaf = requestAnimationFrame(step);
  }

  // Qualquer gesto do usuário fora do envelope devolve o controle a ele
  function stopAuto(e) {
    if (!autoRaf || (e.type !== 'wheel' && e.target === openBtn)) return;
    cancelAnimationFrame(autoRaf);
    autoRaf = 0;
  }

  function fillInfo() {
    const show = (id, text) => {
      const el = $(id);
      el.textContent = text;
      el.hidden = !text;
    };
    show('cardPlace', INFO.local);
    show('cardAddress', INFO.endereco);
    show('cardDress', INFO.traje);
    show('cardRsvp', INFO.confirmacao);
    show('detailsPlace', [INFO.local, INFO.endereco].filter(Boolean).join(' · '));
    $('giftLink').href = INFO.listaPresentes;
  }

  function startCountdown() {
    const box = $('countdown');
    const when = new Date(box.dataset.date).getTime();
    const cells = {};
    box.querySelectorAll('[data-unit]').forEach((el) => { cells[el.dataset.unit] = el; });
    const pad = (n) => String(n).padStart(2, '0');
    const update = () => {
      let t = Math.max(0, Math.floor((when - Date.now()) / 1000));
      const d = Math.floor(t / 86400); t -= d * 86400;
      const h = Math.floor(t / 3600); t -= h * 3600;
      const m = Math.floor(t / 60);
      const s = t - m * 60;
      cells.d.textContent = d;
      cells.h.textContent = pad(h);
      cells.m.textContent = pad(m);
      cells.s.textContent = pad(s);
    };
    update();
    setInterval(update, 1000);
  }

  setVariant();
  fillInfo();
  startCountdown();
  onResize();
  window.addEventListener('hashchange', () => { setVariant(); onResize(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  openBtn.addEventListener('click', openEnvelope);
  for (const ev of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    window.addEventListener(ev, stopAuto, { passive: true });
  }
  window.addEventListener('resize', onResize);
  reduceMotion.addEventListener?.('change', onResize);
})();
