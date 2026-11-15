/* About page v2 — Details Vault "Fade In Text Reveal" (text-reveal-02) + Studio375-style motion */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function textReveal02(scope = document, delay = 0, { ignoreManual = false } = {}) {
    const { gsap, SplitText } = window;
    const CONFIG = {
      lines: { duration: 0.04, stagger: 0.03, ease: 'power1.out' },
      words: { duration: 0.04, stagger: 0.03, ease: 'power1.out' },
      chars: { duration: 0.04, stagger: 0.03, ease: 'power1.out' },
      scrollStart: 'top 85%', scrubStart: 'top 80%', scrubEnd: 'top 20%', once: true, markers: false,
    };
    const allSplitEls = scope.querySelectorAll('[data-reveal-02]');
    const autoEls = ignoreManual ? [...allSplitEls] : [...allSplitEls].filter(el => !el.hasAttribute('data-manual'));
    gsap.set(autoEls, { visibility: 'visible' });
    allSplitEls.forEach(el => {
      const splitType = el.getAttribute('data-reveal-02');
      const c = CONFIG[splitType];
      if (!c) return;
      let type, linesClass, wordsClass, charsClass;
      switch (splitType) {
        case 'lines': type = 'lines'; linesClass = 'line'; break;
        case 'words': type = 'words, lines'; wordsClass = 'word'; linesClass = 'line'; break;
        case 'chars': type = 'chars, words, lines'; charsClass = 'char'; wordsClass = 'word'; linesClass = 'line'; break;
        default: return;
      }
      const classes = { ...(linesClass && { linesClass }), ...(wordsClass && { wordsClass }), ...(charsClass && { charsClass }) };
      if (!ignoreManual && el.hasAttribute('data-manual')) {
        SplitText.create(el, { type, autoSplit: true, ...classes });
        return;
      }
      const scrollMode = el.getAttribute('data-scroll');
      const useScroll = el.hasAttribute('data-scroll');
      const useScrub = scrollMode === 'scrub';
      SplitText.create(el, {
        type, autoSplit: true, ...classes,
        onSplit(instance) {
          const d = parseFloat(el.dataset.duration), s = parseFloat(el.dataset.stagger), dl = parseFloat(el.dataset.delay);
          const duration = Number.isNaN(d) ? c.duration : d;
          const stagger = Number.isNaN(s) ? c.stagger : s;
          const elDelay = Number.isNaN(dl) ? 0 : dl;
          const ease = el.dataset.ease || c.ease;
          const targets = instance[splitType];
          const once = el.hasAttribute('data-once') ? el.getAttribute('data-once') !== 'false' : CONFIG.once;
          const tween = { opacity: 0.1, duration, stagger, delay: useScroll ? elDelay : elDelay + delay, immediateRender: true, ease };
          if (useScrub) {
            tween.scrollTrigger = { trigger: el, start: CONFIG.scrubStart, end: CONFIG.scrubEnd, scrub: true, markers: CONFIG.markers,
              ...(once && { onLeave: self => self.kill(false) }) };
          } else if (useScroll) {
            const start = scrollMode || CONFIG.scrollStart;
            tween.scrollTrigger = { trigger: el, start: `clamp(${start})`, markers: CONFIG.markers,
              ...(once ? { once: true } : { toggleActions: 'play none none reverse' }) };
          }
          return gsap.from(targets, tween);
        },
      });
    });
  }

  // Studio375-style: floating images drift with scroll; CTA letters scatter then settle into place.
  function motion() {
    const { gsap } = window;
    document.querySelectorAll('.about-v2 .av2-float').forEach((el, i) => {
      gsap.fromTo(el, { opacity: 0, y: 40, scale: 0.9 }, { opacity: 0.85, y: 0, scale: 1, duration: 1.2, delay: 0.4 + i * 0.15, ease: 'power3.out' });
      gsap.to(el, { yPercent: -60 - i * 30, ease: 'none', scrollTrigger: { trigger: '.av2-hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    const route = document.querySelector('.av2-route i');
    if (route) gsap.fromTo(route, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: route, start: 'top 90%', end: 'top 55%', scrub: true } });

    const cta = document.querySelector('[data-av2-scatter]');
    if (cta) {
      const split = window.SplitText.create(cta, { type: 'chars', charsClass: 'av2-ch' });
      gsap.from(split.chars, {
        y: () => gsap.utils.random(-120, 120), x: () => gsap.utils.random(-40, 40), rotate: () => gsap.utils.random(-30, 30), opacity: 0,
        ease: 'power3.out', stagger: { each: 0.02, from: 'random' },
        scrollTrigger: { trigger: cta, start: 'top 90%', end: 'top 45%', scrub: 1 },
      });
    }
  }

  function init() {
    const reveal = document.querySelectorAll('.about-v2 [data-reveal-02]');
    if (reduce || !window.gsap || !window.SplitText || !window.ScrollTrigger) {
      reveal.forEach(el => { el.style.visibility = 'visible'; });
      return;
    }
    window.gsap.registerPlugin(window.SplitText, window.ScrollTrigger);
    document.fonts.ready.then(() => { textReveal02(document); motion(); window.ScrollTrigger.refresh(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
