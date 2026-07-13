/* ============ HERO — botón "Compartir" ============ */
document.addEventListener('DOMContentLoaded', () => {
  const shareBtn = document.getElementById('shareBtn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: document.title,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // El usuario canceló el share nativo: no hacemos nada más.
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        shareBtn.setAttribute('aria-label', '¡Link copiado!');
        setTimeout(() => shareBtn.setAttribute('aria-label', 'Compartir'), 2000);
      } catch (err) {
        // Silencioso: si tampoco hay clipboard, no rompemos nada.
      }
    }
  });
});
let isOpen = false;
const expandedWidth = Math.min(window.innerWidth * 0.9, 210);
let tl;

function initMenu() {
  tl && tl.revert();
  tl = gsap.timeline({ paused: true })
    .set('.menu-overlay', { pointerEvents: 'auto' })
    .to('.island', { width: expandedWidth, duration: 0.6, ease: 'back.out(1.7)' }, 0)
    .to('.island-logo', { opacity: 1, rotation: 180, duration: 0.45, ease: 'back.out(1.7)' }, 0.1)
    .to('.bar-mid', { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0)
    .to('.bar-top', { attr: { x1: 3, y1: 3, x2: 13, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
    .to('.bar-bot', { attr: { x1: 13, y1: 3, x2: 3, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
    .to('.menu-backdrop', { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
    .from('.menu-panel', { autoAlpha: 0, yPercent: -10, scale: 0.6, duration: 0.6, transformOrigin: 'top center', ease: 'back.out(1.7)' }, 0.1)
    .from('.menu-link', { opacity: 0, y: 6, duration: 0.3, ease: 'power2.out', stagger: 0.05 }, 0.2);
}
initMenu();

function toggleMenu() {
  isOpen = !isOpen;
  const btn = document.getElementById('menuToggle');
  btn.setAttribute('aria-expanded', isOpen);
  btn.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  document.querySelectorAll('.menu-link').forEach(l => l.setAttribute('tabindex', isOpen ? '0' : '-1'));

  if (isOpen) {
    tl.timeScale(1).play();
  } else {
    tl.eventCallback('onReverseComplete', () => gsap.set('.menu-overlay', { pointerEvents: 'none' }));
    tl.timeScale(1).reverse();
  }
}

document.getElementById('menuToggle').addEventListener('click', toggleMenu);
document.querySelector('.menu-backdrop').addEventListener('click', () => { if (isOpen) toggleMenu(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isOpen) {
    toggleMenu();
    document.getElementById('menuToggle').focus();
  }
});

document.querySelector('.menu-overlay').addEventListener('keydown', e => {
  if (!isOpen || e.key !== 'Tab') return;
  const focusable = [...document.querySelectorAll('.menu-link[tabindex="0"]')];
  if (!focusable.length) return;
  const [first, last] = [focusable[0], focusable[focusable.length - 1]];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// Cierra el menú si se agranda la ventana a un tamaño donde cambia el layout
window.addEventListener('resize', () => {
  if (isOpen) toggleMenu();
});

/* ============================================================
   NAV — Desktop (rediseño Dragonfly.xyz): cuadrados centrales +
   panel desplegable
   ----------------------------------------------------------------
   Módulo autocontenido: no toca nada del menú mobile (toggleMenu/
   .island/.menu-overlay, arriba) ni la lógica de scroll (más abajo)
   — los <a href="#..."> del panel ya quedan cubiertos por ese
   listener genérico de scroll suave sin cambios acá. Los 5 cuadrados
   (".dfy-nav__dot") son CSS puro en reposo; GSAP solo les anima
   transform (translate/rotate/scale) al abrir/cerrar, reordenándolos
   de una figura a otra — ninguno desaparece ni se crea de nuevo.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.dfy-nav');
  const toggle = document.getElementById('dfyNavToggle');
  const menuLabel = document.getElementById('dfyNavMenuLabel');
  const panel = document.getElementById('dfyNavPanel');
  const logo = document.querySelector('.dfy-nav__logo');
  if (!nav || !toggle || !menuLabel || !panel || typeof gsap === 'undefined') return;

  const dots = gsap.utils.toArray('.dfy-nav__dot', nav);
  if (dots.length < 5) return;

  // Estado cerrado: "quincunx" (dado-5) chico y compacto.
  const CLOSED = [
    { x: -6, y: -6, rotation: 0 },
    { x: 6, y: -6, rotation: 0 },
    { x: 0, y: 0, rotation: 0 },
    { x: -6, y: 6, rotation: 0 },
    { x: 6, y: 6, rotation: 0 },
  ];
  // Estado abierto: composición PROPIA de SophIA (no una réplica de la
  // figura de Dragonfly) — una X formada por los 5 cuadrados, mismo
  // lenguaje visual que ya usan las marcas del timeline de I+D+i. Los 4
  // brazos se trasladan a lo largo de las diagonales con una rotación
  // sutil (individual, no uniforme) para que se sienta mecánico; el
  // cuadrado central gira 45° y queda como un pequeño rombo marcando el
  // cruce — el único acento distinto del resto.
  const OPEN = [
    { x: -12, y: -12, rotation: -10 },
    { x: 12, y: -12, rotation: 10 },
    { x: 0, y: 0, rotation: 45 },
    { x: -12, y: 12, rotation: 10 },
    { x: 12, y: 12, rotation: -10 },
  ];

  dots.forEach((dot, i) => gsap.set(dot, CLOSED[i]));
  gsap.set(panel, { autoAlpha: 0, y: -14, clipPath: 'inset(0 0 100% 0)' });

  let isOpen = false;

  function setOpen(next) {
    if (next === isOpen) return;
    isOpen = next;

    toggle.setAttribute('aria-expanded', String(isOpen));
    menuLabel.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');

    const target = isOpen ? OPEN : CLOSED;
    dots.forEach((dot, i) => {
      gsap.killTweensOf(dot);
      gsap.to(dot, {
        x: target[i].x,
        y: target[i].y,
        rotation: target[i].rotation,
        scale: isOpen ? 1.1 : 1,
        duration: 0.5,
        ease: 'power3.inOut',
        delay: i * 0.035,
      });
    });

    gsap.killTweensOf(panel);
    if (isOpen) {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, y: -14, clipPath: 'inset(0 0 100% 0)' },
        { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.55, ease: 'power3.out' }
      );
    } else {
      gsap.to(panel, { autoAlpha: 0, y: -14, clipPath: 'inset(0 0 100% 0)', duration: 0.4, ease: 'power3.inOut' });
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen));
  menuLabel.addEventListener('click', () => setOpen(!isOpen));
  if (logo) logo.addEventListener('click', () => setOpen(false));

  panel.querySelectorAll('.dfy-nav__row').forEach((row) => {
    row.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('click', (e) => {
    if (isOpen && !nav.contains(e.target) && !panel.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (isOpen && e.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Si el layout cambia de tamaño (ej. pasa a mobile), cierra el panel
  // para no dejarlo "abierto" atrás de la isla mobile.
  window.addEventListener('resize', () => {
    if (isOpen) setOpen(false);
  });
});

/* ============ NAV — scroll suave con GSAP (no CSS) ============
   style.css ya NO tiene scroll-behavior:smooth (era incompatible con
   ScrollTrigger.refresh() — el navegador animaba los saltos internos
   que GSAP necesita hacer instantáneos para remedir secciones
   pineadas, y esas mediciones a mitad de animación terminaban
   corrompiendo el scroll de toda la página). Acá se reemplaza ese
   salto nativo por el mismo ScrollToPlugin que ya usa el resto del
   sitio (ej. el click en una fila de Productos): mismo mecanismo,
   consistente, y sin el conflicto. */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const targetId = link.getAttribute('href').slice(1);
  if (!targetId) return; // href="#" suelto (íconos sociales): se deja como está

  link.addEventListener('click', (e) => {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return; // ancla todavía sin sección real: comportamiento nativo sin cambios

    e.preventDefault();
    if (isOpen && link.classList.contains('menu-link')) toggleMenu();

    gsap.registerPlugin(ScrollToPlugin);
    gsap.to(window, {
      scrollTo: { y: targetEl, offsetY: 90, autoKill: true },
      duration: 1,
      ease: 'power2.inOut',
    });
  });
});

/* ============ HERO — Text Scramble Effect ============
   Cada carácter del texto final se envuelve en su propio <span> y se le
   fija el ancho exacto que ya tiene (medido con el texto final puesto).
   Durante la animación SOLO se cambia el carácter de adentro de cada
   span — nunca su ancho — así ninguna letra ni palabra se mueve un
   solo píxel. Los espacios quedan como texto real (no como spans) para
   que el salto de línea entre palabras siga funcionando normalmente. */
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function prepareScramble(el) {
  const finalText = el.textContent.trim();

  // Conserva qué palabras estaban envueltas en su propio <span> (ej.
  // ".cap2-highlight"/".idi__highlight" para resaltar palabras clave en
  // el color de énfasis): se recorren los childNodes ANTES de vaciar el
  // elemento, y cada "run" de texto guarda la clase de su nodo de origen
  // (o ninguna, si es texto plano) para que los spans de carácter que se
  // reconstruyen abajo hereden el mismo color.
  const runs = [];
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      runs.push({ text: node.textContent, className: null });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      runs.push({ text: node.textContent, className: node.className || null });
    }
  });

  el.innerHTML = '';
  const live = document.createElement('span');
  live.setAttribute('aria-hidden', 'true');
  el.appendChild(live);
  el.setAttribute('aria-label', finalText);

  const spans = [];
  runs.forEach(({ text, className }) => {
    const tokens = text.split(/(\s+)/); // conserva los espacios como tokens propios

    tokens.forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        live.appendChild(document.createTextNode(token));
        return;
      }
      // Cada palabra queda en su propio contenedor "nowrap": el salto de
      // línea solo puede pasar en los espacios reales de afuera, nunca en
      // medio de una palabra ni dejando una letra sola abajo.
      const word = document.createElement('span');
      word.style.display = 'inline-block';
      word.style.whiteSpace = 'nowrap';
      if (className) word.className = className;
      live.appendChild(word);

      Array.from(token).forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.dataset.final = char;
        span.style.display = 'inline-block';
        word.appendChild(span);
        spans.push(span);
      });
    });
  });

  // Recién ahora que están en el DOM con el texto final, medimos el
  // ancho real de cada carácter y lo dejamos fijo.
  spans.forEach((span) => {
    const width = span.getBoundingClientRect().width;
    span.style.width = Math.ceil(width) + 'px';
    span.style.textAlign = 'center';
  });

  return { spans, finalText };
}

function scrambleChars(spans, { duration = 1800, staggerPerChar = 42 } = {}) {
  const total = spans.length;
  const startTime = performance.now();

  return new Promise((resolve) => {
    function tick(now) {
      let resolvedCount = 0;

      spans.forEach((span, i) => {
        const finalChar = span.dataset.final;
        const elapsed = now - startTime - i * staggerPerChar;

        if (elapsed >= duration) {
          if (span.textContent !== finalChar) span.textContent = finalChar;
          resolvedCount++;
        } else {
          span.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      });

      if (resolvedCount === total) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  });
}

/* ============ HERO — entrada ============ */
document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const title = document.querySelector('.hero__title');
  const texts = document.querySelector('.hero__texts');

  if (title) {
    if (prefersReducedMotion) {
      // Sin animación: se deja el texto tal cual está en el HTML.
    } else {
      const startTitleScramble = () => {
        const { spans } = prepareScramble(title);
        // Antes de pintar el primer frame, ya mostramos caracteres random
        // (nunca se ve el texto final ni vacío al arrancar).
        spans.forEach((span) => {
          span.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        });
        scrambleChars(spans, { duration: 1800, staggerPerChar: 42 });
      };

      // Esperamos a que la fuente Audiowide esté lista para medir bien
      // el ancho real de cada carácter (si no, se mide con la fuente de
      // reemplazo y podría desajustarse al cargar la fuente final).
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => setTimeout(startTitleScramble, 150));
      } else {
        setTimeout(startTitleScramble, 150);
      }
    }
  }

  if (!texts || prefersReducedMotion || typeof gsap === 'undefined') return;

  gsap.from(texts.children, { opacity: 0, y: 12, duration: 0.8, ease: 'power2.out', delay: 0.9, stagger: 0.1 });
});

/* ============================================================
   TRANSICIÓN ENTRE SECCIONES (GSAP ScrollTrigger) — pin + scale + fade
   ----------------------------------------------------------------
   Adaptado del patrón de referencia "Slides Pinning" de GSAP. No toca
   nada del Home (texto scramble, entrada, nav, island, side-nav): solo
   lo incluye como el primer panel de esta transición, tal cual está.

   Cómo se activa: cada panel (excepto el último) queda "pineado" en
   pantalla mientras el siguiente panel scrollea por encima; en ese
   tramo el panel de atrás se achica y se desvanece (dissolve). El
   Home participa como panel #1 → la primera transición es
   Home → Sección de prueba 2, tal como se pidió.

   Para sumar una sección real más adelante: solo hace falta que tenga
   la clase "test-section" (o agregarla a la lista de selectores de
   abajo) — no hay que tocar esta lógica.

   IMPORTANTE — orden de creación (bug fijo acá):
   El trigger de "Sección 03" usa start:'bottom bottom' + pinSpacing:
   false, así que su punto de disparo depende de la posición real de
   Sección 03 en el flujo del documento — la cual, a su vez, depende
   de que el pin largo de Capacidades (con su pin-spacer que reserva
   varias pantallas de alto) ya exista. Por eso esta función NO se
   autoejecuta acá: se define nada más, y recién se llama más abajo,
   al final del DOMContentLoaded que crea el pin de Capacidades — así
   se garantiza el orden correcto sin depender de que un refresh()
   posterior "corrija" una medición ya tomada de más temprano.
   ============================================================ */
function initSectionTransitions() {
  if (typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const hero = document.querySelector('.hero');
  const otherPanels = gsap.utils.toArray('.test-section');
  // I+D+i (id="idi") es contenido real agregado, no ".test-section" —
  // se agrega a mano al final de la lista, solo para que la Sección 03
  // (que sí es un "test-section") deje de ser "la última" y conserve
  // su propio scale+fade de salida.
  //
  // Productos (id="s4-intro") NO se agrega acá a propósito: se probó
  // (rompía la página) pinearlo con el mecanismo genérico de acá abajo
  // — pensado para paneles de altura FIJA, usa un "fakeScrollRatio"/
  // marginBottom calculado UNA sola vez al cargar. Productos cambia de
  // alto en vivo al filtrar; con esa altura vieja cacheada, un
  // ScrollTrigger.refresh() mientras Productos estaba pineado (ej. al
  // tocar un filtro en ese momento del scroll) dejaba todo el layout
  // corrompido. Su transición hacia I+D+i vive aparte, más abajo
  // (mismo truco sin pin que ya usa Capacidades → Sección 03: inmune a
  // esto porque nunca cachea nada, todo se recalcula solo en cada
  // refresh).
  const idiSection = document.getElementById('idi');
  if (idiSection) otherPanels.push(idiSection);
  const panels = hero ? [hero, ...otherPanels] : otherPanels;

  // Hace falta al menos 2 paneles para que exista una transición.
  if (panels.length < 2) return;

  // El último panel no se pinea: no hay nada todavía que lo cubra por
  // debajo (cuando se sume la siguiente sección real, va a dejar de
  // ser "el último" automáticamente y va a empezar a pinearse solo).
  const outgoingPanels = panels.slice(0, -1);

  outgoingPanels.forEach((panel) => {
    // Si el panel tiene contenido más alto que la pantalla (como la
    // Sección 2 del ejemplo original), esto compensa el "scroll extra"
    // necesario antes de pasar a la siguiente. Nuestros placeholders
    // entran en una pantalla, así que esto no hace nada por ahora.
    const innerPanel = panel.querySelector('.section-inner') || panel;
    const panelHeight = innerPanel.offsetHeight;
    const windowHeight = window.innerHeight;
    const difference = panelHeight - windowHeight;
    const fakeScrollRatio = difference > 0 ? difference / (difference + windowHeight) : 0;

    if (fakeScrollRatio) {
      panel.style.marginBottom = panelHeight * fakeScrollRatio + 'px';
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'bottom bottom',
        end: () => (fakeScrollRatio ? `+=${innerPanel.offsetHeight}` : 'bottom top'),
        pinSpacing: false,
        pin: true,
        scrub: true,
      },
    });

    if (fakeScrollRatio) {
      tl.to(innerPanel, {
        yPercent: -100,
        y: window.innerHeight,
        duration: 1 / (1 - fakeScrollRatio) - 1,
        ease: 'none',
      });
    }

    // pointerEvents:'none' al llegar a opacity:0 — opacity no saca al
    // elemento del hit-testing, así que sin esto un panel ya invisible
    // seguía "arriba" en el stacking (aunque no se viera) y tapaba los
    // clicks de lo que venga después mientras su caja siguiera
    // geométricamente dentro del viewport (pasa con paneles cortos
    // seguidos de contenido más alto que 1 pantalla, como Productos:
    // no le alcanza el scroll natural para que el panel corto termine
    // de salir de la caja del todo). Se vuelve a 'auto' en el fromTo
    // de arriba si el usuario scrollea para atrás.
    tl.fromTo(panel, { scale: 1, opacity: 1, pointerEvents: 'auto' }, { scale: 0.92, opacity: 0.55, duration: 0.9 }).to(panel, {
      opacity: 0,
      pointerEvents: 'none',
      duration: 0.1,
    });
  });

  /* --------------------------------------------------------------------
     Capacidades → Sección 03: mismo efecto scale+fade que usa el resto
     del sitio, SIN tocar ni una línea del carrusel de Capacidades y SIN
     volver a pinear la sección (probado a mano: pinear el mismo
     elemento con un segundo ScrollTrigger corrompe el pin-spacer del
     primero — el pin propio de Capacidades perdía todo el scroll
     reservado para las 6 cards). En vez de eso, este tween NO pinea:
     arranca justo en el número de scroll donde termina el pin propio
     de Capacidades (leído del ScrollTrigger que YA creó el carrusel,
     vía la API pública de GSAP — sin tocar su código) y dura un largo
     de un viewport, igual que el resto de las transiciones del sitio.
     Como en ese tramo Capacidades ya no está pineada, sigue scrolleando
     hacia arriba con normalidad (igual que ya venía funcionando):
     el scale+fade solo le agrega el mismo remate visual que tienen
     Home→Capacidades y Sección 03→04. En mobile Capacidades no pinea
     (ver más abajo), así que no hay ScrollTrigger que encontrar y esta
     sección directamente no se crea: sigue sin pin/scale/fade, como
     siempre.
  -------------------------------------------------------------------- */
  const capsSection = document.getElementById('s3-caps');
  const capsScrollTrigger = capsSection
    ? ScrollTrigger.getAll().find((t) => t.pin === capsSection)
    : null;

  if (capsSection && capsScrollTrigger) {
    gsap.timeline({
      scrollTrigger: {
        trigger: capsSection,
        start: () => capsScrollTrigger.end,
        end: () => capsScrollTrigger.end + window.innerHeight,
        scrub: true,
      },
    })
      .fromTo(capsSection, { scale: 1, opacity: 1, pointerEvents: 'auto' }, { scale: 0.92, opacity: 0.55, duration: 0.9 })
      .to(capsSection, { opacity: 0, pointerEvents: 'none', duration: 0.1 });
  }

  /* --------------------------------------------------------------------
     Productos → I+D+i: mismo efecto scale+fade+PIN que el resto del
     sitio (Productos queda fijo en pantalla mientras I+D+i sube desde
     abajo), pero sin reintroducir el bug histórico de pinear Productos
     por su altura COMPLETA (dinámica, cambia al filtrar).

     La diferencia clave con el mecanismo genérico de arriba (el que sí
     rompía la página): acá NO se cachea ninguna altura a mano — nada
     de fakeScrollRatio/marginBottom. 'bottom bottom' es un keyword de
     posición que GSAP vuelve a medir contra el layout REAL en cada
     refresh(), y el pin solo cubre el último tramo (un viewport, igual
     que el resto de las transiciones), que arranca recién cuando el
     BOTTOM de Productos ya tocó el bottom del viewport — o sea, con
     los tabs/filtros ya scrolleados bien fuera de pantalla y no
     interactivos. El filtro de Productos (que dispara su propio
     refresh()) siempre actúa ANTES de llegar a este tramo, nunca
     mientras está pineado acá, así que no hay ventana en la que un
     refresh() pueda encontrar a este pin con una medida vieja.
  -------------------------------------------------------------------- */
  const productsSection = document.getElementById('s4-intro');
  if (productsSection) {
    gsap.timeline({
      scrollTrigger: {
        trigger: productsSection,
        start: 'bottom bottom',
        end: () => '+=' + window.innerHeight,
        pinSpacing: false,
        pin: true,
        scrub: true,
      },
    })
      .fromTo(productsSection, { scale: 1, opacity: 1, pointerEvents: 'auto' }, { scale: 0.92, opacity: 0.55, duration: 0.9 })
      .to(productsSection, { opacity: 0, pointerEvents: 'none', duration: 0.1 });
  }

  // Recalcula las medidas si la ventana cambia de tamaño (los
  // placeholders no lo necesitan, pero es una salvaguarda barata).
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}

/* ============================================================
   SECCIÓN "CAPACIDADES" — migrada tal cual del sitio anterior
   ----------------------------------------------------------------
   Todo lo de acá abajo (el observer de "reveal-section", el registro
   de plugins/defaults de ScrollTrigger, y la lógica completa del
   carrusel) es CÓDIGO ORIGINAL SIN MODIFICAR, copiado del sitio viejo.

   Se agrega al final a propósito: así el sistema de transición
   (pin+scale+fade) de esta página, definido arriba, ya creó todos
   sus ScrollTrigger ANTES de que se llame acá abajo a
   ScrollTrigger.defaults(...) — por lo que ese defaults() no afecta
   ni modifica ninguno de los triggers ya existentes, solo aplica a
   los que crea este bloque (el pin del carrusel de Capacidades).
   Ambos sistemas quedan así totalmente independientes entre sí.
   ============================================================ */

/* ── Scroll reveal genérico ───────────────────────────────────────────
   Cualquier elemento con la clase "reveal-section" aparece con un
   fade + blur + leve desplazamiento hacia arriba a medida que entra en
   el viewport (y se revierte al salir, en cualquier dirección).

   Usa IntersectionObserver en vez de ScrollTrigger a propósito: no
   depende de calcular distancias de scroll en píxeles, así que
   funciona igual de bien en secciones cortas (S2) o muy altas
   (Productos), y no se ve afectado por el pin largo de Capacidades.
   El CSS (.reveal-section / .reveal-section.is-visible) define los
   estados inicial/final y la transición; acá solo togglear la clase.
   ──────────────────────────────────────────────────────────────────── */
(function () {
  const revealEls = document.querySelectorAll(".reveal-section");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    {
      // Se activa cuando ~15% del elemento es visible, y se desactiva
      // cuando baja de ese umbral (sirve tanto al entrar como al salir,
      // en cualquier dirección de scroll).
      threshold: 0.15,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
})();

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
      ScrollTrigger.defaults({ anticipatePin: 1, invalidateOnRefresh: true });

/* ============================================================================
   NUEVA SECCIÓN "CAPACIDADES" — slider horizontal con preview
   ============================================================================ */

document.addEventListener("DOMContentLoaded", () => {

  // Registramos los plugins de GSAP (ya se registraron arriba también;
  // volver a registrarlos es seguro/no produce ningún efecto adicional).
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  /* ------------------------------------------------------------------------
     1) REFERENCIAS AL DOM
  ------------------------------------------------------------------------ */
  const section   = document.querySelector(".pa");
  const viewport  = document.querySelector(".pa__viewport");
  const track     = document.querySelector(".pa__track");
  const slides    = gsap.utils.toArray(".pa__slide");
  const panels    = gsap.utils.toArray(".pa__panel");
  const videos = gsap.utils.toArray(".pa__video");
  const progressFill = document.querySelector(".pa__progress-fill");
  const btnPrev   = document.querySelector(".pa__arrow--prev");
  const btnNext   = document.querySelector(".pa__arrow--next");
  const counterCurrent = document.querySelector(".pa__counter-current");
  const counterTotal   = document.querySelector(".pa__counter-total");

  const TOTAL = slides.length;         // cantidad de capacidades (6)
  const TRANSITION_DURATION = 0.7;     // duración de la transición (0.6-0.9s)
  const SLIDE_WIDTH_PCT = 0.88;        // cada card ocupa 88% del escenario → 12% de preview

  let currentIndex = 0;                // capacidad activa

  if (counterTotal) counterTotal.textContent = TOTAL;

  /* ------------------------------------------------------------------------
     2) ACTUALIZAR BARRA DE PROGRESO + CONTADOR (ej: 1/6)
     Barra continua: el relleno avanza hasta el porcentaje que le
     corresponde al índice activo dentro del total de capacidades.
  ------------------------------------------------------------------------ */
  function updateProgress(index) {
    if (counterCurrent) counterCurrent.textContent = index + 1;
    const percent = (index / (TOTAL - 1)) * 100;
    gsap.to(progressFill, {
      width: percent + "%",
      duration: 0.6,
      ease: "power2.inOut",
    });
  }

  function updateVideos() {

  videos.forEach((video, i) => {

    if (i === currentIndex) {
      video.currentTime = 0;
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }

    } else {

      video.pause();
      video.currentTime = 0;
    }
  });
}

  /* ------------------------------------------------------------------------
     3) TRANSICIÓN: desplazamiento horizontal con preview
  ------------------------------------------------------------------------ */
function updateSlidePosition(animate) {
  const viewportWidth = viewport.offsetWidth;
  // Leemos el gap real aplicado por CSS (clamp responsive) para que el
  // paso de desplazamiento quede siempre sincronizado con el espacio
  // visual real entre cards, sin importar el tamaño de pantalla.
  const trackGap = parseFloat(getComputedStyle(track).columnGap) || 0;
  const slideStep = viewportWidth * SLIDE_WIDTH_PCT + trackGap;
  const targetX = -currentIndex * slideStep;

  if (animate) {
    gsap.to(track, { x: targetX, duration: TRANSITION_DURATION, ease: "power3.inOut" });
  } else {
    gsap.set(track, { x: targetX });
  }

  panels.forEach((panel, i) => {
    const isFront = i === currentIndex;
    const panelTarget = {
      opacity: isFront ? 1 : 0,
      duration: animate ? TRANSITION_DURATION * 0.6 : 0,
      ease: "power2.out",
    };
    if (animate) gsap.to(panel, panelTarget);
    else gsap.set(panel, panelTarget);
  });

  // Escala sutil (profundidad): la card activa queda a scale:1, el resto
  // retrocede levemente a 0.97. Mismo duration/ease que el tween de
  // track.x para que no compitan visualmente. Vive en esta función
  // compartida para que ambas ramas de matchMedia (scroll y swipe) la
  // hereden sin duplicar nada.
  slides.forEach((slide, i) => {
    const targetScale = i === currentIndex ? 1 : 0.97;
    if (animate) {
      gsap.to(slide, { scale: targetScale, duration: TRANSITION_DURATION, ease: "power3.inOut" });
    } else {
      gsap.set(slide, { scale: targetScale });
    }
  });
}

  /* ------------------------------------------------------------------------
     4) FUNCIÓN CENTRAL: aplicar un nuevo índice activo
  ------------------------------------------------------------------------ */
 function setActiveIndex(index) {
  if (index === currentIndex) return;
  currentIndex = index;
  updateProgress(index);
  updateSlidePosition(true);
  updateVideos();
}

  /* ------------------------------------------------------------------------
     5) NAVEGACIÓN — matchMedia decide la implementación por breakpoint
     Desktop/Tablet (>620px): pin + scrub + snap; el scroll real de la
     página es la única fuente de verdad (ScrollTrigger.onUpdate →
     setActiveIndex), y la sección no se libera hasta recorrer las 6
     cards. Mobile (≤620px): sin pin — el scroll vertical atraviesa la
     sección con normalidad; las cards solo cambian por flechas o swipe
     (táctil / trackpad horizontal). Mismo breakpoint (620px) que ya usa
     el CSS propio de este componente (.pa__panel/.pa__arrow/.pa__progress
     en style.css), para que el corte visual y el funcional coincidan.

     Las flechas (btnPrev/btnNext) se definen UNA sola vez, más abajo, y
     llaman a "goToIndex" — una referencia mutable que cada rama de
     matchMedia reasigna con su propia implementación. Así no hay
     lógica duplicada entre desktop/tablet y mobile.
  ------------------------------------------------------------------------ */
  let goToIndex = () => {};

  const capMM = gsap.matchMedia();

  capMM.add(
    {
      isDesktop: "(min-width: 621px)",
      isMobile: "(max-width: 620px)",
    },
    (context) => {
      const { isDesktop } = context.conditions;

      if (isDesktop) {
        /* ---- DESKTOP / TABLET: pin + scrub + snap ----
           Se agrega un "colchón" de scroll extra al final (END_BUFFER_VH):
           sin esto, apenas se terminaba de ver la última card el pin se
           soltaba y toda la página arrancaba a moverse hacia la
           siguiente sección, dando una sensación de salto prematuro. */
        const STEP_VH = 0.6;
        const END_BUFFER_VH = 0.4;
        const ACTIVE_VH = STEP_VH * (TOTAL - 1);
        const activeRatio = ACTIVE_VH / (ACTIVE_VH + END_BUFFER_VH);

        const st = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => "+=" + window.innerHeight * (ACTIVE_VH + END_BUFFER_VH),
          pin: true,
          scrub: 1,
          snap: {
            snapTo: (value) => {
              if (value >= activeRatio) return activeRatio; // colchón: se mantiene en la última card
              const stepProgress = value / activeRatio;
              return (Math.round(stepProgress * (TOTAL - 1)) / (TOTAL - 1)) * activeRatio;
            },
            duration: 0.15,
            delay: 0.08,
            inertia: false,
          },
          onUpdate: (self) => {
            const clampedProgress = Math.min(self.progress / activeRatio, 1);
            const idx = Math.round(clampedProgress * (TOTAL - 1));
            setActiveIndex(idx);
          },
        });

        goToIndex = (index) => {
          const wrapped = ((index % TOTAL) + TOTAL) % TOTAL;
          const progress = (wrapped / (TOTAL - 1)) * activeRatio;
          const targetScroll = st.start + progress * (st.end - st.start);
          // Se crea dentro de context.add() para que, si el usuario cruza
          // el breakpoint a mitad de esta animación de scroll, matchMedia
          // la mate sola (evita un salto de scroll residual en mobile).
          context.add(() => {
            gsap.to(window, {
              // autoKill:false a propósito: si se hace clic en la flecha
              // apenas se llega a la sección (scroll todavía no asentado
              // en una card exacta), el snap propio del pin de Capacidades
              // dispara su propia corrección de scroll casi al mismo
              // tiempo — con autoKill:true, ScrollToPlugin interpretaba
              // esa corrección interna como si fuera scroll manual del
              // usuario y mataba esta animación a mitad de camino, dejando
              // la flecha sin efecto. GSAP ya mata sola cualquier tween
              // vieja sobre el mismo target al crear una nueva (overwrite
              // por default), así que esto no compite con el snap: solo
              // evita que se autocancele por error.
              scrollTo: { y: targetScroll, autoKill: false },
              duration: 1,
              ease: "power2.inOut",
            });
          });
        };
      } else {
        /* ---- MOBILE: pin + swipe/flechas — equivalente a desktop ----
           La sección se pinea (se "congela" en pantalla, igual que en
           desktop) mientras el usuario recorre las 6 cards. A
           diferencia de desktop, el scroll vertical NO controla qué
           card se ve — eso lo hacen el swipe horizontal táctil, el
           swipe horizontal de trackpad o las flechas. Mientras falten
           cards por recorrer, cualquier intento de scroll vertical
           hacia ABAJO se intercepta (preventDefault): así ningún gesto,
           ni uno fuerte, puede atravesar la sección de un tirón sin
           mostrar el carrusel. Recién en la última card se deja de
           interceptar, y el próximo scroll/swipe hacia abajo libera el
           pin con total normalidad y continúa hacia la Sección 03
           (mismo pin-spacer + mismo mecanismo de dissolve que ya usa
           Home→Capacidades y Capacidades→Sección 03 en desktop: ver
           capsScrollTrigger en initSectionTransitions()). Scrollear
           hacia ARRIBA (volver antes de la sección) nunca se bloquea. */
        goToIndex = (index) => {
          const wrapped = ((index % TOTAL) + TOTAL) % TOTAL;
          setActiveIndex(wrapped);
        };

        const mobileSt = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => "+=" + window.innerHeight,
          pin: true,
        });

        const isLastCard = () => currentIndex === TOTAL - 1;

        const SWIPE_THRESHOLD_PX = 45;    // distancia mínima para contar como swipe horizontal
        const INTENT_THRESHOLD_PX = 10;   // umbral de "ruido" antes de decidir la dirección del gesto
        const WHEEL_DELTA_THRESHOLD = 12; // deltaX mínimo para contar como gesto de trackpad horizontal
        const WHEEL_LOCK_MS = 550;        // cooldown: 1 gesto de trackpad = 1 solo cambio de card

        let touchStartX = 0;
        let touchStartY = 0;
        let touchDeciding = true;
        let touchIsHorizontal = false;

        const onTouchStart = (e) => {
          const t = e.touches[0];
          touchStartX = t.clientX;
          touchStartY = t.clientY;
          touchDeciding = true;
          touchIsHorizontal = false;
        };

        const onTouchMove = (e) => {
          const t = e.touches[0];
          const dx = t.clientX - touchStartX;
          const dy = t.clientY - touchStartY;

          if (touchDeciding) {
            if (Math.abs(dx) < INTENT_THRESHOLD_PX && Math.abs(dy) < INTENT_THRESHOLD_PX) return;
            touchIsHorizontal = Math.abs(dx) > Math.abs(dy);
            touchDeciding = false;
          }

          if (touchIsHorizontal) {
            e.preventDefault();
            return;
          }

          // Gesto vertical hacia abajo (dy < 0: el contenido sube) con
          // cards pendientes → se bloquea para no soltar el pin antes
          // de tiempo. Hacia arriba, o ya en la última card, se deja
          // pasar: scroll nativo normal.
          if (dy < 0 && !isLastCard()) e.preventDefault();
        };

        const onTouchEnd = (e) => {
          if (!touchIsHorizontal) return;
          const dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return; // gesto horizontal pero muy corto: ignorar
          goToIndex(dx < 0 ? currentIndex + 1 : currentIndex - 1);
        };

        let wheelLocked = false;
        const onWheel = (e) => {
          const { deltaX, deltaY } = e;

          // Gesto claramente horizontal (trackpad) por encima del umbral
          // → navega y bloquea solo este gesto puntual.
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > WHEEL_DELTA_THRESHOLD) {
            e.preventDefault();
            if (wheelLocked) return;
            wheelLocked = true;
            goToIndex(deltaX > 0 ? currentIndex + 1 : currentIndex - 1);
            setTimeout(() => { wheelLocked = false; }, WHEEL_LOCK_MS);
            return;
          }
          // deltaY dominante (mouse wheel normal, o trackpad scrolleando
          // vertical) hacia abajo, con cards pendientes → mismo bloqueo
          // que el touch, por consistencia (ej. mobile emulado con mouse).
          if (deltaY > 0 && !isLastCard()) e.preventDefault();
        };

        // Los listeners van en "section" (toda la sección pineada), no
        // solo en "viewport": mientras está pineada ocupa toda la
        // pantalla, así que cualquier punto donde el usuario apoye el
        // dedo (topbar, panel de texto, etc.) tiene que quedar cubierto
        // por el bloqueo de scroll, no solo el área de la card.
        section.addEventListener("touchstart", onTouchStart, { passive: true });
        section.addEventListener("touchmove", onTouchMove, { passive: false });
        section.addEventListener("touchend", onTouchEnd);
        section.addEventListener("wheel", onWheel, { passive: false });

        // Listeners planos: matchMedia no los trackea (solo tweens/
        // ScrollTrigger). Hay que sacarlos a mano si se cruza el
        // breakpoint, para no acumular listeners duplicados. El pin
        // (mobileSt) sí lo trackea matchMedia por estar creado directo
        // dentro de este callback (mismo patrón que "st" en desktop).
        return () => {
          section.removeEventListener("touchstart", onTouchStart);
          section.removeEventListener("touchmove", onTouchMove);
          section.removeEventListener("touchend", onTouchEnd);
          section.removeEventListener("wheel", onWheel);
        };
      }
    }
  );

  // El pin de Capacidades (si es desktop, arriba en capMM.add) ya está
  // creado en este punto, con su pin-spacer real ya en el DOM. Recién
  // ahora es seguro construir el sistema de transición pin+scale+fade
  // (Home→Capacidades→Sección 03→Sección 04): así el trigger de
  // "Sección 03" mide su posición real (después del recorrido completo
  // de Capacidades) en vez de una posición desactualizada de antes de
  // que el pin existiera. El refresh() previo fuerza a que el
  // pin-spacer de Capacidades ya tenga su alto final antes de medir.
  ScrollTrigger.refresh();
  initSectionTransitions();

  btnPrev.addEventListener("click", () => goToIndex(currentIndex - 1));
  btnNext.addEventListener("click", () => goToIndex(currentIndex + 1));

  /* ------------------------------------------------------------------------
     7) ESTADO INICIAL
  ------------------------------------------------------------------------ */
  
updateSlidePosition(false);
updateProgress(0);
updateVideos();

  /* ------------------------------------------------------------------------
     8) RESIZE: recalcular la posición del track (sin animar), ya que el
     ancho de cada card es un % del escenario. También se refresca
     ScrollTrigger globalmente (otros ScrollTrigger del sitio, como el
     navbar o el subrayado de #s2-intro, dependen de medidas que cambian
     con el resize).
  ------------------------------------------------------------------------ */
  window.addEventListener("resize", () => {
    updateSlidePosition(false);
    ScrollTrigger.refresh();
  });

});

/* ============================================================
   INTEGRACIÓN — red de seguridad final para el sistema de transición
   ----------------------------------------------------------------
   El fix real ya está arriba: initSectionTransitions() (el sistema
   pin+scale+fade) se define pero NO se autoejecuta; se llama recién
   dentro del DOMContentLoaded de Capacidades, después de que su pin
   ya está creado — así el trigger de "Sección 03" siempre mide su
   posición real (después del recorrido completo de Capacidades) y
   nunca queda con una posición desactualizada de antes de que ese
   pin existiera.

   Este listener de acá abajo es solo una red de seguridad extra: se
   registra al final a propósito (corre después de todo lo anterior)
   y fuerza refreshes adicionales por si fuentes/videos que todavía
   están cargando llegan a cambiar el alto de alguna sección después
   del cálculo inicial.
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof ScrollTrigger === "undefined") return;

  // Refresh inmediato: ya corrimos después de que Capacidades creó su
  // pin (por el orden de los listeners), así que el layout ya está
  // completo en este punto.
  ScrollTrigger.refresh();

  // Refresh extra cuando terminen de cargar fuentes/recursos (Audiowide,
  // Orbitron, videos con preload="metadata"): por si alguno de esos
  // recursos todavía corre el alto de alguna sección en ese momento.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => ScrollTrigger.refresh());
});

/* ============================================================
   SECCIÓN 03 — Text Scramble en el título
   ----------------------------------------------------------------
   Mismo efecto y mismas funciones (prepareScramble / scrambleChars)
   que ya usa el título del Home, sin duplicar lógica. La diferencia
   es el disparador: el título del Home arranca solo al cargar la
   página; este arranca cuando la sección entra en pantalla (con
   IntersectionObserver), ya que el usuario llega a ella recién
   después de hacer scroll.
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cap2Title = document.querySelector(".cap2-title");
  if (!cap2Title || prefersReducedMotion) return;

  const runCap2Scramble = () => {
    const { spans } = prepareScramble(cap2Title);
    spans.forEach((span) => {
      span.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    });
    scrambleChars(spans, { duration: 1400, staggerPerChar: 18 });
  };

  const start = () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => runCap2Scramble());
    } else {
      runCap2Scramble();
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          start();
          observer.unobserve(cap2Title);
        }
      });
    },
    { threshold: 0.4 }
  );

  observer.observe(cap2Title);
});

/* ============================================================
   SECCIÓN "PRODUCTOS" — migrada tal cual del sitio anterior
   ----------------------------------------------------------------
   Todo lo de acá abajo es CÓDIGO ORIGINAL SIN MODIFICAR, copiado del
   sitio viejo: el sistema de scramble de los nombres de producto
   (distinto del que usa el título del Home — este es el original de
   esta sección, con su propio "CHARS"/"scrambleText", sin chocar con
   nuestras funciones "SCRAMBLE_CHARS"/"scrambleChars"), los filtros
   por tab + el panel de PDF embebido, y las partículas magnéticas de
   las tabs al hacer hover. Usa ScrollTrigger/ScrollToPlugin, ya
   registrados y cargados arriba (por Capacidades) — no se duplica
   ninguna librería.
   ============================================================ */

/* ── Text Scramble ──────────────────────────────────────────────────── */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-/=?『』";

function scrambleText(el, { flickersPerChar = 6, frameDuration = 35 } = {}) {
  
  if (el._scrambleInterval) clearInterval(el._scrambleInterval);

  if (!el.dataset.scrambleFinal) el.dataset.scrambleFinal = el.textContent;
  const finalText = el.dataset.scrambleFinal;

  const length = finalText.length;
  const totalFrames = length * flickersPerChar;
  let frame = 0;

  el._scrambleInterval = setInterval(() => {
    let out = "";
    const resolvedCount = Math.floor(frame / flickersPerChar);

    for (let i = 0; i < length; i++) {
      const char = finalText[i];
      if (char === " ") {
        out += " ";
      } else if (i < resolvedCount) {
        out += char;
      } else {
        out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    }

    el.textContent = out;
    frame++;

    if (frame > totalFrames) {
      el.textContent = finalText;
      clearInterval(el._scrambleInterval);
      el._scrambleInterval = null;
    }
  }, frameDuration);
}

/* 1) Disparado por scroll, una sola vez (ej. SOPHIA TECH CORP) */
(function () {
  const els = document.querySelectorAll(".js-scramble");
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const isFast = entry.target.classList.contains("js-scramble-fast");
          scrambleText(
            entry.target,
            isFast
              ? { flickersPerChar: 3, frameDuration: 16 } // más rápido: nombres de producto
              : { flickersPerChar: 6, frameDuration: 35 } // velocidad original: SOPHIA TECH CORP
          );
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  els.forEach((el) => observer.observe(el));
})();

/* =========================== S4 — PRODUCTOS (filtros + entrada) ===========================
   Antes S6 en el sitio viejo: mismo mecanismo de filtro exacto,
   renombrado a "prod-*" / "#s4-intro". */
(function () {
  const tabs = document.querySelectorAll("#prod-tabs .prod-tab");
  const rows = document.querySelectorAll("#prod-list .prod-row");
  if (!tabs.length || !rows.length) return;

  /* Presentación comercial (PDF embebido) por producto. Para agregar la
     de un nuevo producto en el futuro, alcanza con sumar una línea acá
     — no hace falta tocar el HTML ni ninguna otra parte de este bloque.
     La clave tiene que ser igual al "data-filter" del tab de ese producto. */
const PRODUCT_PDFS = {
    "timbrame24": "recursos/productos/timbrame24-presentacion.pdf",
    "smart-meter": "recursos/productos/smart-meter-presentacion.pdf",
    "domotica": "recursos/productos/domotica-presentacion.pdf",
    "pet24": "recursos/productos/pet24-presentacion.pdf",
    "gestion-riesgos": "recursos/productos/gestion-riesgos-presentacion.pdf",
};
  const presentationEl = document.getElementById("prod-presentation");

  function updatePresentation(filter) {
    if (!presentationEl) return;

    const pdfPath = PRODUCT_PDFS[filter];

    if (!pdfPath) {
      // "Todo", o un producto que todavía no tiene presentación cargada:
      // se oculta y se vacía (evita que un iframe viejo siga cargado de fondo).
      presentationEl.classList.remove("is-visible");
      presentationEl.innerHTML = "";
      presentationEl.setAttribute("aria-hidden", "true");
      return;
    }

    // El PDF NO se carga acá todavía (a propósito): solo se arma el botón
    // "Presentación" cerrado. El iframe recién se crea cuando el usuario
    // lo abre (ver el listener del toggle, más abajo) — evita descargar
    // el PDF si el usuario nunca llega a abrirlo.
    presentationEl.innerHTML = `
      <div class="prod-presentation-inner">
        <button class="prod-presentation-toggle" type="button" aria-expanded="false">
          <span>Explorar solución</span>
          <svg class="prod-presentation-chevron" viewBox="0 0 20 20" width="16" height="16" fill="none">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="prod-presentation-body"></div>
      </div>
    `;
    presentationEl.classList.add("is-visible");
    presentationEl.setAttribute("aria-hidden", "false");

    const toggleBtn = presentationEl.querySelector(".prod-presentation-toggle");
    const bodyEl = presentationEl.querySelector(".prod-presentation-body");

    toggleBtn.addEventListener("click", () => {
      const isOpen = presentationEl.classList.toggle("is-open");
      toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");

      // Carga diferida: el iframe con el PDF real recién se crea la
      // PRIMERA vez que se abre (bodyEl.childElementCount === 0).
      if (isOpen && !bodyEl.childElementCount) {
        bodyEl.innerHTML = `
        <iframe
            src="${pdfPath}#toolbar=0&navpanes=0&scrollbar=0&zoom=50"
            title="Presentación comercial"
            loading="lazy"
            style="scrollbar-width: thin; background: #0000;"
          ></iframe>
        `;
      }

      // Mismo motivo que el refresh de los tabs: abrir/cerrar el panel
      // cambia el alto de Productos (transición CSS de 0.6s), así que se
      // espera a que termine antes de resincronizar ScrollTrigger.
      if (typeof ScrollTrigger !== "undefined") {
        setTimeout(() => ScrollTrigger.refresh(), 650);
      }
    });
  }

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const filter = tab.getAttribute("data-filter");
      tabs.forEach((t) => t.classList.toggle("active", t === tab));

      rows.forEach((row) => {
        const match = filter === "all" || row.getAttribute("data-category") === filter;
        row.classList.toggle("prod-row-hidden", !match);
        // La fila que matchea el filtro pasa a mostrarse primero en la
        // lista. Como .prod-list es un flex-column, "order" la reordena
        // visualmente sin moverla en el HTML real y sin afectar el alto
        // total de la página (las demás filas siguen ocupando su lugar,
        // solo invisibles). El panel de presentación (#prod-presentation)
        // no tiene "order" explícito, así que su valor por defecto es 0:
        // queda siempre entre la fila activa (-1) y las ocultas (1), es
        // decir, justo debajo de la fila activa.
        row.style.order = match ? "-1" : "1";
      });

      updatePresentation(filter);

      // Productos ahora participa del sistema de transición pin+scale+fade
      // (se pinea como saliente hacia I+D+i, ver initSectionTransitions()):
      // como filtrar cambia su alto real (se ocultan filas), hay que avisarle
      // a ScrollTrigger para que esa transición no quede con una medida
      // vieja. No cambia nada del filtro en sí, solo mantiene sincronizado
      // el sistema de scroll con el nuevo alto.
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    });
  });

  /* Toda la fila es clickeable: dispara el click del tab de arriba que le
     corresponde (misma "data-category" ↔ "data-filter"), así se reutiliza
     100% la lógica de filtro/orden/presentación de arriba sin duplicar
     nada y quedan siempre sincronizados. Después hace scroll suave hasta
     los tabs para mostrar el resultado (mismo mecanismo que el navbar:
     GSAP ScrollToPlugin con offset de 90px por el navbar fijo). */
  rows.forEach((row) => {
    row.addEventListener("click", () => {
      const category = row.getAttribute("data-category");
      const tab = document.querySelector(`#prod-tabs .prod-tab[data-filter="${category}"]`);
      if (!tab) return;

      tab.click();

      gsap.to(window, {
        scrollTo: { y: "#prod-tabs", offsetY: 90 },
        duration: 1,
        ease: "power2.inOut",
      });
    });
  });

  // Entrada suave de toda la sección al llegar con el scroll
  gsap.fromTo(
    "#s4-intro .prod-tabs, #s4-intro .prod-row",
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.05,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#s4-intro",
        start: "top 75%",
      },
    }
  );
})();


/* ── Partículas magnéticas en las tabs de Productos ──────────────────────
   Genera, para cada tab, su propio campo de partículas (igual mecanismo
   que el ejemplo: posiciones y offsets aleatorios vía CSS custom
   properties --x/--y). Se hace acá para no tener que tocar el HTML de
   cada una de las 8 tabs a mano. */
(function () {
  const prodTabs = document.querySelectorAll(".prod-tab");
  if (!prodTabs.length) return;

  const PARTICLES_PER_TAB = 14; // pocas partículas: efecto sutil, no denso

  prodTabs.forEach((tab) => {
    // Envolvemos el texto existente en un <span> para que quede siempre
    // por encima de las partículas (ver CSS: .prod-tab > span { z-index: 2 }).
    const label = tab.textContent;
    tab.innerHTML = `<span>${label}</span>`;

    const field = document.createElement("div");
    field.className = "particles-field";
    tab.appendChild(field);

    for (let i = 0; i < PARTICLES_PER_TAB; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      // Rango de movimiento chico (-25px a 25px): las tabs son botones
      // pequeños, no tiene sentido un desplazamiento grande como en botones
      // full-size.
      particle.style.setProperty("--x", `${Math.random() * 50 - 25}px`);
      particle.style.setProperty("--y", `${Math.random() * 50 - 25}px`);
      particle.style.animation = `particleFloat ${1 + Math.random() * 2}s infinite`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      field.appendChild(particle);
    }
  });
})();

/* ============================================================
   SECCIÓN "I+D+I" — Proceso de Innovación
   ----------------------------------------------------------------
   Adapta la LÓGICA del ejemplo de referencia (una sola timeline con
   scrollTrigger scrub + pin que arma la experiencia como una
   secuencia de pasos) al contenido real: en vez de Three.js + Flip
   moviendo un cubo entre marcadores, acá el scroll dibuja una línea
   curva vertical (SVG) y mueve un indicador que la recorre punto a
   punto, cruzando el contenido de cada etapa — con GSAP + la API
   nativa de SVG (getPointAtLength), ya alcanza y sobra: no se suman
   Three.js, Flip ni ningún plugin nuevo.

   Mismo patrón que el pin del carrusel de Capacidades: un solo
   ScrollTrigger (pin:true + scrub), todo el estado derivado de
   self.progress en un único onUpdate (nada de scroll-jacking manual).
   Como es la última sección del sitio, al terminar el recorrido el
   pin se libera con total normalidad y ahí termina la página. Sí
   participa como "entrante" del sistema de transición genérico: ver
   initSectionTransitions(), que ahora pinea Productos como saliente
   hacia acá.
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("idi");
  if (!section || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const introEl = section.querySelector(".idi__intro");
  const processEl = section.querySelector(".idi__process");
  const eyebrowEl = section.querySelector(".idi__eyebrow");
  const pathEl = section.querySelector(".idi__path-progress");
  const indicatorEl = section.querySelector(".idi__indicator");
  const stages = gsap.utils.toArray(".idi__stage", section);
  const nodes = gsap.utils.toArray(".idi__node", section);
  const TOTAL = stages.length;

  if (!TOTAL || !pathEl) return;

  const COLOR_PRIMARY = "#077DB3";
  const COLOR_INACTIVE = "#7E7F83"; // gris secundario, indicador pendiente
  const NODE_GLOW = "drop-shadow(0 0 5px rgba(7, 125, 179, 0.55))";

  // La sección arranca con fondo CLARO (intro) y cruza a OSCURO (timeline)
  // durante el mismo scroll pineado — se interpola cada frame en base al
  // mismo "introOpacity" que ya calcula el onUpdate de abajo, así que no
  // agrega ningún trigger/temporización nueva, solo estética.
  const BG_LIGHT = "#F5F9E9";
  const BG_DARK = "#11151C";
  const EYEBROW_INK_LIGHT = "#11151C";
  const EYEBROW_INK_DARK = "#E5E5E5";

  // El viewBox del SVG es fijo (200x900, ver index.html) y el <svg> usa
  // preserveAspectRatio="none": el mapeo de coordenadas del path a % del
  // contenedor es directo (mismo % en cada eje que en el viewBox), así que
  // no hace falta recalcular nada en el resize — solo la GEOMETRÍA del
  // path (fija) determina las posiciones.
  const VIEWBOX_W = 200;
  const VIEWBOX_H = 900;
  const pathLength = pathEl.getTotalLength();

  function pointAt(progress) {
    const pt = pathEl.getPointAtLength(pathLength * progress);
    return { left: (pt.x / VIEWBOX_W) * 100 + "%", top: (pt.y / VIEWBOX_H) * 100 + "%" };
  }

  // Los 4 nodos se ubican en los puntos del path a 0, 1/3, 2/3 y 1 de su
  // longitud — quedan exactamente SOBRE la curva, sin coordenadas a mano.
  nodes.forEach((node, i) => {
    const pt = pointAt(TOTAL > 1 ? i / (TOTAL - 1) : 0);
    node.style.left = pt.left;
    node.style.top = pt.top;
  });

  // Estado inicial: intro visible, proceso oculto, línea sin dibujar,
  // indicador y primera etapa/nodo en el punto de partida. El indicador
  // (la X que recorre el path) usa xPercent/yPercent en vez del centrado
  // por CSS: así GSAP puede combinar posición + rotación en el mismo
  // transform sin pisarse con nada declarado en la hoja de estilos.
  gsap.set(introEl, { autoAlpha: 1, y: 0 });
  gsap.set(processEl, { autoAlpha: 0 });
  gsap.set(section, { backgroundColor: BG_LIGHT });
  if (eyebrowEl) gsap.set(eyebrowEl, { color: EYEBROW_INK_LIGHT });
  gsap.set(pathEl, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
  gsap.set(indicatorEl, { ...pointAt(0), xPercent: -50, yPercent: -50, rotation: 0 });
  gsap.set(stages, { autoAlpha: 0, y: 10 });
  gsap.set(stages[0], { autoAlpha: 1, y: 0 });
  gsap.set(nodes[0], { color: COLOR_PRIMARY, filter: NODE_GLOW });

  // Duraciones en "unidades de viewport" (mismo criterio que STEP_VH/
  // END_BUFFER_VH del carrusel de Capacidades): INTRO_VH da tiempo a leer
  // el título compacto antes de que arranque el recorrido, STEP_VH es el
  // tramo de scroll por cada paso de la línea, END_BUFFER_VH es el
  // colchón final que evita que el pin se suelte apenas se llega a la
  // última etapa.
  const INTRO_VH = 0.6;
  const STEP_VH = 0.8;
  const END_BUFFER_VH = 0.5;
  const STEPS_VH = STEP_VH * (TOTAL - 1);
  const TOTAL_VH = INTRO_VH + STEPS_VH + END_BUFFER_VH;
  const introRatio = INTRO_VH / TOTAL_VH;
  const activeRatio = (INTRO_VH + STEPS_VH) / TOTAL_VH;

  let currentStage = 0;

  // Resuelve TODAS las etapas en base al índice activo (no solo la
  // anterior y la nueva): un ScrollTrigger.refresh() a mitad de camino
  // (ej. al filtrar Productos, que ahora recalcula el layout de toda la
  // página) puede correr el progreso de golpe más de un paso o disparar
  // varios onUpdate seguidos, y dos tweens ".to()" en danza (una que
  // esconde, otra que muestra) podían quedar compitiendo por el mismo
  // elemento y "trabarse" a medio camino, mostrando dos etapas a la vez.
  // Para que sea imposible que eso pase: primero se MATAN los tweens
  // pendientes de cada etapa (gsap.killTweensOf) y las que no están
  // activas se esconden con gsap.set (instantáneo, nada que pueda
  // quedar a mitad de camino) — solo la etapa que entra se anima, con
  // fromTo (estado inicial y final explícitos, no depende de en qué
  // opacidad haya quedado antes).
  function setActiveStage(idx) {
    if (idx === currentStage) return;
    currentStage = idx;

    stages.forEach((stage, i) => {
      gsap.killTweensOf(stage);
      if (i !== idx) gsap.set(stage, { autoAlpha: 0 });
    });
    gsap.fromTo(
      stages[idx],
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );

    // El número de cada nodo usa color:inherit (ver CSS), así que
    // animar el "color" del nodo alcanza para los dos a la vez.
    nodes.forEach((node, i) => {
      const active = i <= idx;
      gsap.killTweensOf(node);
      gsap.to(node, {
        color: active ? COLOR_PRIMARY : COLOR_INACTIVE,
        filter: active ? NODE_GLOW : "none",
        duration: 0.3,
      });
    });
  }

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => "+=" + window.innerHeight * TOTAL_VH,
    pin: true,
    scrub: 1,
    onUpdate: (self) => {
      const p = self.progress;

      // Fase 1 (0..introRatio): el título es visible y luego se desvanece
      // dando paso al proceso — igual idea que la referencia, que ubica
      // el elemento en su primer marcador antes de empezar a moverlo.
      const introP = gsap.utils.clamp(0, 1, p / introRatio);
      const FADE_START = 0.55;
      const introOpacity = introP < FADE_START ? 1 : 1 - (introP - FADE_START) / (1 - FADE_START);
      gsap.set(introEl, { autoAlpha: introOpacity, y: -introP * 14 });
      gsap.set(processEl, { autoAlpha: 1 - introOpacity });

      // Cruce de fondo claro→oscuro (y tinta del eyebrow) sincronizado con
      // el mismo desvanecimiento de la intro, no con un tramo aparte.
      gsap.set(section, { backgroundColor: gsap.utils.interpolate(BG_LIGHT, BG_DARK, 1 - introOpacity) });
      if (eyebrowEl) {
        gsap.set(eyebrowEl, { color: gsap.utils.interpolate(EYEBROW_INK_LIGHT, EYEBROW_INK_DARK, 1 - introOpacity) });
      }

      // Fase 2 (introRatio..activeRatio): la línea se dibuja con el
      // scroll y el indicador (la X) la recorre punto a punto, girando
      // suave y de forma continua (0° a 180° en todo el recorrido — un
      // giro lento, nunca brusco) mientras avanza; cada etapa reemplaza
      // a la anterior al llegar el indicador a su nodo.
      const lineP = gsap.utils.clamp(0, 1, (p - introRatio) / (activeRatio - introRatio));
      gsap.set(pathEl, { strokeDashoffset: pathLength * (1 - lineP) });
      gsap.set(indicatorEl, { ...pointAt(lineP), xPercent: -50, yPercent: -50, rotation: lineP * 180 });

      const idx = Math.min(TOTAL - 1, Math.round(lineP * (TOTAL - 1)));
      setActiveStage(idx);
    },
  });
});