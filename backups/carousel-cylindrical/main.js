/* =========================================================
   Conler — interaction layer
   Modules: clock · nav · menu · splitText · hero · ticks · GSAP scroll · carousel
   Vanilla JS with GSAP enhancement.
   ========================================================= */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const hasGsap = () => window.gsap && window.ScrollTrigger;

  /* ---------- Intro / loader (first visit only) ---------- */
  function initIntro() {
    const intro = $('[data-intro]');
    if (!intro) return;

    const KEY = 'conler_intro_shown';
    if (prefersReduced || sessionStorage.getItem(KEY) === '1') {
      intro.remove();
      return;
    }
    sessionStorage.setItem(KEY, '1');

    document.documentElement.classList.add('intro-active');

    requestAnimationFrame(() => intro.classList.add('is-in'));

    // Counter ticks 0 → 100, eased, with a small jitter to feel "loading-y".
    const counter = $('[data-intro-counter]', intro);
    if (counter) {
      const DUR = 1700;
      const START = 1500;
      setTimeout(() => {
        let t0 = null;
        const tick = (t) => {
          if (t0 === null) t0 = t;
          const p = Math.min(1, (t - t0) / DUR);
          const eased = 1 - Math.pow(1 - p, 3);
          counter.textContent = String(Math.floor(eased * 100)).padStart(3, '0');
          if (p < 1) requestAnimationFrame(tick);
          else counter.textContent = '100';
        };
        requestAnimationFrame(tick);
      }, START);
    }

    // Hold at 100 briefly, then curtain splits + hand off hero reveal.
    setTimeout(() => {
      intro.classList.add('is-out');
      document.documentElement.classList.remove('intro-active');
      const heading = $('[data-split]');
      if (heading) heading.classList.add('is-revealed');
    }, 3500);

    setTimeout(() => intro.remove(), 5000);
  }

  /* ---------- Live clock (Cagliari) ---------- */
  function initClock() {
    const targets = $$('[data-clock]');
    if (!targets.length) return;

    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Rome',
    });

    const tick = () => {
      const time = fmt.format(new Date());
      targets.forEach(el => { el.textContent = time + ' CAG'; });
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Fullscreen menu ---------- */
  function initMenu() {
    const toggle = $('[data-menu-toggle]');
    const menu = $('[data-menu]');
    const nav = $('[data-nav]');
    if (!toggle || !menu) return;

    const links = $$('[data-menu-link]', menu);
    const closeBtns = $$('[data-menu-close]', menu);
    const menuHeader = $('.menu__header', menu);
    let menuTl = null;

    const setOpen = (open) => {
      if (!window.gsap || prefersReduced) {
        toggle.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-hidden', String(!open));
        menu.classList.toggle('is-open', open);
        document.body.classList.toggle('menu-open', open);
        if (nav) nav.classList.toggle('menu-active', open);
        return;
      }

      if (menuTl) menuTl.kill();

      const menuItems = [menuHeader, ...links].filter(Boolean);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);

      if (open) {
        if (nav) nav.classList.add('menu-active');
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');

        const measureRect = menu.getBoundingClientRect();
        const PILL_W = 300;
        const PILL_H = 54;
        const rightInset = Math.max(0, ((measureRect.width - PILL_W) / measureRect.width) * 100);
        const bottomInset = Math.max(0, ((measureRect.height - PILL_H) / measureRect.height) * 100);

        gsap.set(menu, {
          transition: 'none',
          autoAlpha: 0,
          clipPath: `inset(0 ${rightInset}% ${bottomInset}% 0 round 999px)`,
        });
        gsap.set(menuHeader, {
          transition: 'none',
          autoAlpha: 0,
          y: 6,
          filter: 'blur(6px)',
        });
        gsap.set(links, {
          transition: 'none',
          autoAlpha: 0,
          x: 44,
          y: 0,
          filter: 'blur(8px)',
        });

        menuTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        menuTl
          .to(menu, { autoAlpha: 1, duration: 0.22, ease: 'power2.out' }, 0)
          .to(menu, {
            clipPath: 'inset(0 0% 0% 0 round 20px)',
            duration: 0.85,
            ease: 'expo.out',
          }, 0)
          .to(menuHeader, {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.55,
            ease: 'power3.out',
          }, 0.28)
          .to(links, {
            autoAlpha: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: 0.95,
            stagger: 0.085,
            ease: 'expo.out',
          }, 0.38);
      } else {
        const measureRect = menu.getBoundingClientRect();
        const PILL_W = 300;
        const PILL_H = 54;
        const rightInset = Math.max(0, ((measureRect.width - PILL_W) / measureRect.width) * 100);
        const bottomInset = Math.max(0, ((measureRect.height - PILL_H) / measureRect.height) * 100);

        menuTl = gsap.timeline({
          defaults: { ease: 'expo.inOut' },
          onComplete: () => {
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
            if (nav) nav.classList.remove('menu-active');
            gsap.set([menu, ...menuItems], { clearProps: 'all' });
          },
        });

        menuTl
          .to(links.slice().reverse(), {
            autoAlpha: 0,
            x: 36,
            filter: 'blur(5px)',
            duration: 0.45,
            stagger: 0.05,
            ease: 'expo.in',
          }, 0)
          .to(menuHeader, {
            autoAlpha: 0,
            y: -4,
            filter: 'blur(4px)',
            duration: 0.3,
            ease: 'power2.in',
          }, 0.12)
          .to(menu, {
            clipPath: `inset(0 ${rightInset}% ${bottomInset}% 0 round 999px)`,
            duration: 0.95,
            ease: 'expo.inOut',
          }, 0.18)
          .add(() => {
            if (nav) nav.classList.remove('menu-active');
          }, 0.7)
          .to(menu, {
            autoAlpha: 0,
            duration: 0.32,
            ease: 'power2.in',
          }, 0.78);
      }
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    closeBtns.forEach(b => b.addEventListener('click', () => setOpen(false)));

    links.forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
      }
    });

    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('is-open')) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });

    if (nav) {
      const onScroll = () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 40);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  /* ---------- Split heading lines into reveal-wrappers ---------- */
  function initSplitHero() {
    const heading = $('[data-split]');
    if (!heading) return;

    $$('.hero__line', heading).forEach(line => {
      if (line.querySelector('.hero__line__inner')) return; // already wrapped
      const inner = document.createElement('span');
      inner.className = 'hero__line__inner';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);
    });

    // If the intro is running it owns the hero hand-off; don't auto-trigger.
    if (document.documentElement.classList.contains('intro-active')) return;

    const trigger = () => heading.classList.add('is-revealed');
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(trigger);
    } else {
      window.addEventListener('load', trigger, { once: true });
    }
  }

  /* ---------- Word splitter (for about/footer headings) ---------- */
  function initSplitWords() {
    $$('[data-split-words]').forEach(node => {
      if (node.dataset.splitDone) return;
      node.dataset.splitDone = '1';

      const walk = (el) => {
        Array.from(el.childNodes).forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent;
            const parts = text.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach(part => {
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
              } else if (part.length) {
                const word = document.createElement('span');
                word.className = 'word';
                const inner = document.createElement('span');
                inner.className = 'word__inner';
                inner.textContent = part;
                word.appendChild(inner);
                frag.appendChild(word);
              }
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            // wrap the inner text of <em>/<i> too, but keep the tag
            const wrap = document.createElement('span');
            wrap.className = 'word';
            const inner = document.createElement('span');
            inner.className = 'word__inner';
            // move content into inner, preserving the original tag styling
            const clone = child.cloneNode(false);
            clone.innerHTML = child.innerHTML;
            inner.appendChild(clone);
            wrap.appendChild(inner);
            child.replaceWith(wrap);
          }
        });
      };
      walk(node);

      // stagger via inline transition-delay (cheaper than CSS selectors for n words)
      const inners = $$('.word__inner', node);
      inners.forEach((el, i) => {
        el.style.transitionDelay = (i * 55) + 'ms';
      });
    });
  }

  /* ---------- GSAP scroll choreography ---------- */
  function initGsapScroll() {
    if (prefersReduced || !hasGsap()) return false;

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    gsap.defaults({
      ease: 'power3.out',
      duration: 1,
    });

    $$('.reveal:not(.reveal--stagger):not([data-split-words])').forEach(el => {
      gsap.fromTo(el,
        {
          autoAlpha: 0,
          y: 46,
          filter: 'blur(10px)',
        },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          clearProps: 'filter,transform,opacity,visibility',
          onStart: () => el.classList.add('is-visible'),
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            once: true,
          },
        }
      );
    });

    $$('.reveal--stagger').forEach(group => {
      const children = Array.from(group.children);
      if (!children.length) return;
      gsap.fromTo(children,
        {
          autoAlpha: 0,
          y: 30,
          scale: 0.94,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.06,
          clearProps: 'transform,opacity,visibility',
          onStart: () => group.classList.add('is-visible'),
          scrollTrigger: {
            trigger: group,
            start: 'top 82%',
            once: true,
          },
        }
      );
    });

    $$('[data-split-words]').forEach(node => {
      const words = $$('.word__inner', node);
      if (!words.length) return;
      gsap.fromTo(words,
        {
          yPercent: 110,
          rotateX: 24,
          autoAlpha: 0,
        },
        {
          yPercent: 0,
          rotateX: 0,
          autoAlpha: 1,
          duration: 0.9,
          stagger: 0.045,
          clearProps: 'transform,opacity,visibility',
          onStart: () => node.classList.add('is-visible'),
          scrollTrigger: {
            trigger: node,
            start: 'top 78%',
            once: true,
          },
        }
      );
    });

    const heroMedia = $('[data-parallax]');
    if (heroMedia) {
      gsap.to(heroMedia, {
        yPercent: 12,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    const logoTrack = $('.logos__track');
    if (logoTrack) {
      gsap.fromTo(logoTrack,
        { xPercent: 0 },
        {
          xPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: '.logos',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        }
      );
    }

    $$('.carousel, .carousel-footer').forEach((el, i) => {
      gsap.fromTo(el,
        {
          autoAlpha: 0,
          y: 56,
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          delay: i * 0.12,
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: {
            trigger: el,
            start: 'top 72%',
            once: true,
          },
        }
      );
    });

    $$('.portfolio__grid').forEach(grid => {
      const cards = $$('.portfolio__item', grid);
      if (!cards.length) return;

      gsap.fromTo(cards,
        {
          autoAlpha: 0,
          y: 72,
          scale: 0.94,
          clipPath: 'inset(12% 0 0 0 round 24px)',
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          clipPath: 'inset(0% 0 0 0 round 24px)',
          duration: 1,
          stagger: {
            each: 0.08,
            from: 'start',
          },
          clearProps: 'transform,opacity,visibility,clip-path',
          scrollTrigger: {
            trigger: grid,
            start: 'top 78%',
            once: true,
          },
        }
      );

      cards.forEach(card => {
        const media = $('img, video', card);
        if (!media) return;

        gsap.fromTo(media,
          { yPercent: -5, scale: 1.08 },
          {
            yPercent: 5,
            scale: 1.08,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.55,
            },
          }
        );
      });
    });

    $$('[data-terms-section]').forEach(section => {
      const blocks = Array.from(section.children);
      if (!blocks.length) return;

      gsap.fromTo(blocks,
        {
          autoAlpha: 0,
          y: 28,
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.035,
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: {
            trigger: section,
            start: 'top 78%',
            once: true,
          },
        }
      );
    });

    const aboutHero = $('[data-about-hero]');
    if (aboutHero) {
      gsap.fromTo($$('.about-hero__title > *', aboutHero),
        { autoAlpha: 0, yPercent: 110, rotateX: 24 },
        { autoAlpha: 1, yPercent: 0, rotateX: 0, duration: 1.15, stagger: 0.12, ease: 'power4.out' }
      );

      gsap.fromTo($$('.about-hero__image', aboutHero),
        { autoAlpha: 0, y: 120, rotate: 0, scale: 0.86 },
        { autoAlpha: 1, y: 0, rotate: i => [-8, 6, -3][i] || 0, scale: 1, duration: 1.25, stagger: 0.12, ease: 'power4.out', delay: 0.25 }
      );

      gsap.fromTo($('.about-hero__note', aboutHero),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.75 }
      );

      gsap.to($$('.about-hero__image', aboutHero), {
        yPercent: i => [-12, 16, -8][i] || 0,
        ease: 'none',
        scrollTrigger: {
          trigger: aboutHero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.7,
        },
      });
    }

    const manifesto = $('[data-about-manifesto]');
    if (manifesto) {
      const lines = $$('.about-manifesto__lines p', manifesto);
      lines.forEach((line, i) => {
        gsap.to(line, {
          color: 'rgba(244, 244, 241, 0.96)',
          scale: 1.025,
          transformOrigin: 'left center',
          scrollTrigger: {
            trigger: manifesto,
            start: () => `${i * 18}% center`,
            end: () => `${(i + 1) * 18}% center`,
            scrub: true,
          },
        });
      });
    }

    const process = $('[data-about-process]');
    const processHeading = $('.about-process__intro h2', process || document);
    const processTrack = $('[data-about-process-track]', process || document);
    const processViewport = $('[data-about-process-viewport]', process || document);
    if (process && processTrack && processViewport) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', () => {
        const getDistance = () => Math.max(0, processTrack.scrollWidth - processViewport.clientWidth);
        const tween = gsap.to(processTrack, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: process,
            start: 'top top',
            end: () => '+=' + getDistance(),
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        let wipeTween;
        if (processHeading) {
          wipeTween = gsap.fromTo(processHeading,
            { '--wipe': '0%' },
            {
              '--wipe': '110%',
              ease: 'none',
              scrollTrigger: {
                trigger: process,
                start: 'top top',
                end: () => '+=' + Math.max(220, getDistance() * 0.55),
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            }
          );
        }
        return () => {
          tween.scrollTrigger && tween.scrollTrigger.kill();
          tween.kill();
          gsap.set(processTrack, { clearProps: 'transform' });
          if (wipeTween) {
            wipeTween.scrollTrigger && wipeTween.scrollTrigger.kill();
            wipeTween.kill();
            gsap.set(processHeading, { clearProps: '--wipe' });
          }
        };
      });
    }

    const stack = $('[data-about-stack]');
    if (stack) {
      gsap.fromTo($('.about-stack h2', stack),
        { autoAlpha: 0, y: 56 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          scrollTrigger: { trigger: stack, start: 'top 70%', once: true },
        }
      );

      $$('.about-stack__images img', stack).forEach((img, i) => {
        gsap.fromTo(img,
          { y: 80, rotate: 0, autoAlpha: 0 },
          {
            y: 0,
            rotate: [-7, 5, -3][i] || 0,
            autoAlpha: 1,
            duration: 1,
            delay: i * 0.1,
            scrollTrigger: { trigger: stack, start: 'top 72%', once: true },
          }
        );
        gsap.to(img, {
          yPercent: [-14, 10, -8][i] || 0,
          ease: 'none',
          scrollTrigger: {
            trigger: stack,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        });
      });
    }

    const story = $('[data-about-story]');
    if (story) {
      const headingWords = $$('.about-story__header h2 .word > span', story);
      if (headingWords.length) {
        gsap.set(headingWords, { yPercent: 110, opacity: 0 });
        ScrollTrigger.create({
          trigger: story,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(headingWords, {
              yPercent: 0,
              opacity: 1,
              duration: 1.1,
              ease: 'expo.out',
              stagger: 0.09,
            });
          },
        });
      }

      const rail = $('.about-story__rail', story);
      if (rail) {
        gsap.fromTo(rail,
          { autoAlpha: 0, y: -12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: story, start: 'top 78%', once: true },
          }
        );
      }

      gsap.fromTo($$('.about-story__portrait', story),
        { autoAlpha: 0, y: 110, scale: 0.86, rotate: 0 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotate: i => i === 0 ? -6 : 5,
          duration: 1.15,
          stagger: 0.16,
          ease: 'power4.out',
          scrollTrigger: { trigger: story, start: 'top 62%', once: true },
        }
      );

      const connectionLine = $('.about-story__connection i', story);
      if (connectionLine) {
        gsap.fromTo(connectionLine,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.1,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: story, start: 'top 55%', once: true },
          }
        );
      }

      const storyParagraphs = $$('.about-story__copy p', story);
      if (storyParagraphs[0]) storyParagraphs[0].classList.add('is-active');

      gsap.set(storyParagraphs, { clipPath: 'inset(0 0 100% 0)', autoAlpha: 0, y: 18 });
      gsap.to(storyParagraphs, {
        clipPath: 'inset(0 0 0% 0)',
        autoAlpha: 1,
        y: 0,
        duration: 1.0,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-story__copy', start: 'top 78%', once: true },
      });

      const progressBar = $('[data-story-progress]', story);
      if (progressBar) {
        gsap.to(progressBar, {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: '.about-story__copy',
            start: 'top 75%',
            end: 'bottom 60%',
            scrub: 0.6,
          },
        });
      }

      gsap.fromTo($$('.about-story__stamp', story),
        { autoAlpha: 0, y: 18, scale: 0.88 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          stagger: 0.1,
          scrollTrigger: { trigger: story, start: 'top 58%', once: true },
        }
      );

      $$('.about-story__portrait', story).forEach((portrait, i) => {
        gsap.to(portrait, {
          yPercent: i === 0 ? -10 : 12,
          rotate: i === 0 ? -10 : 8,
          ease: 'none',
          scrollTrigger: {
            trigger: story,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.75,
          },
        });
      });

      if (window.innerWidth > 768 && storyParagraphs.length) {
        storyParagraphs.forEach((paragraph, i) => {
          ScrollTrigger.create({
            trigger: story,
            start: () => `${18 + i * 13}% center`,
            end: () => `${31 + i * 13}% center`,
            onEnter: () => {
              storyParagraphs.forEach(item => item.classList.toggle('is-active', item === paragraph));
            },
            onEnterBack: () => {
              storyParagraphs.forEach(item => item.classList.toggle('is-active', item === paragraph));
            },
          });
        });
      }
    }

    const services = $('[data-about-services]');
    if (services) {
      const titleWords = $$('.about-services__title .word > span', services);
      if (titleWords.length) {
        gsap.fromTo(titleWords,
          { yPercent: 110, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: { trigger: services, start: 'top 80%', once: true },
          }
        );
      }

      const count = $('.about-services__count', services);
      if (count) {
        gsap.fromTo(count,
          { autoAlpha: 0, x: 30 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: services, start: 'top 82%', once: true },
          }
        );
      }

      const rows = $$('.about-services__row', services);
      rows.forEach((row, i) => {
        const name = $('.about-services__name i', row);
        const num = $('.about-services__num', row);
        const tag = $('.about-services__tag', row);

        const tl = gsap.timeline({
          scrollTrigger: { trigger: row, start: 'top 88%', once: true },
        });
        tl.fromTo(row,
          { '--row-line': '0%' },
          { duration: 0.001 }
        );
        if (name) {
          tl.fromTo(name,
            { yPercent: 110, rotate: 4, opacity: 0 },
            { yPercent: 0, rotate: 0, opacity: 1, duration: 0.95, ease: 'expo.out' },
            0
          );
        }
        if (num) {
          tl.fromTo(num,
            { autoAlpha: 0, x: -20 },
            { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' },
            0.05
          );
        }
        if (tag) {
          tl.fromTo(tag,
            { autoAlpha: 0, x: 20 },
            { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out' },
            0.15
          );
        }
      });

      const marqueeTrack = $('.about-services__marquee-track', services);
      if (marqueeTrack) {
        const trackWidth = () => marqueeTrack.scrollWidth / 2;
        gsap.set(marqueeTrack, { x: 0 });
        gsap.to(marqueeTrack, {
          x: () => -trackWidth(),
          ease: 'none',
          scrollTrigger: {
            trigger: services,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
      }
    }

    const works = $('[data-works]');
    if (works) {
      const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      const splitNameChars = (el) => {
        const original = el.textContent;
        el.textContent = '';
        el.setAttribute('aria-label', original);
        const chars = [];
        for (const ch of original) {
          const mask = document.createElement('span');
          mask.className = 'webdesign-works__char-mask';
          mask.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.className = 'webdesign-works__char';
          inner.textContent = ch === ' ' ? ' ' : ch;
          inner.dataset.final = inner.textContent;
          mask.appendChild(inner);
          el.appendChild(mask);
          chars.push(inner);
        }
        return chars;
      };

      const rows = $$('.webdesign-works__row', works);
      rows.forEach((row, i) => {
        const link = $('.webdesign-works__link', row);
        const thumb = $('.webdesign-works__thumb', row);
        const thumbImg = $('img', thumb || document);
        const name = $('.webdesign-works__name', row);
        const tags = $('.webdesign-works__tags', row);
        const year = $('.webdesign-works__year', row);
        const nameChars = name ? splitNameChars(name) : [];

        gsap.set(row, { '--row-line': 0 });
        if (thumb) gsap.set(thumb, { clipPath: 'inset(0 100% 0 0)' });
        if (thumbImg) gsap.set(thumbImg, { scale: 1.18 });
        if (nameChars.length) gsap.set(nameChars, { yPercent: 110 });
        [tags, year].forEach((el) => {
          if (el) gsap.set(el, { yPercent: 60, opacity: 0 });
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: row,
            start: 'top 88%',
            once: true,
          },
        });
        tl.to(row, { '--row-line': 1, duration: 0.7, ease: 'power3.out' }, 0);
        if (thumb) tl.to(thumb, { clipPath: 'inset(0 0% 0 0)', duration: 1.05, ease: 'power3.out' }, 0.05);
        if (thumbImg) tl.to(thumbImg, { scale: 1, duration: 1.4, ease: 'power3.out' }, 0.05);
        if (nameChars.length) {
          tl.to(nameChars, {
            yPercent: 0,
            duration: 0.95,
            stagger: 0.04,
            ease: 'power4.out',
          }, 0.18);
        }
        const metaTargets = [tags, year].filter(Boolean);
        if (metaTargets.length) {
          tl.to(metaTargets, {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.06,
            ease: 'power4.out',
          }, 0.28);
        }

        if (link) {
          let scrambleRaf = null;
          let scrambleEnds = null;
          const runScramble = () => {
            if (!nameChars.length) return;
            const totalDuration = 420;
            const perCharLockTime = 220;
            const startTime = performance.now();
            scrambleEnds = nameChars.map((_, idx) => startTime + (idx / nameChars.length) * (totalDuration - perCharLockTime) + perCharLockTime);
            const tick = (now) => {
              let allDone = true;
              nameChars.forEach((ch, idx) => {
                if (now >= scrambleEnds[idx]) {
                  ch.textContent = ch.dataset.final;
                } else {
                  const finalCh = ch.dataset.final;
                  if (finalCh === ' ') {
                    ch.textContent = ' ';
                  } else {
                    ch.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                  }
                  allDone = false;
                }
              });
              if (!allDone) scrambleRaf = requestAnimationFrame(tick);
              else scrambleRaf = null;
            };
            if (scrambleRaf) cancelAnimationFrame(scrambleRaf);
            scrambleRaf = requestAnimationFrame(tick);
          };
          const resetScramble = () => {
            if (scrambleRaf) cancelAnimationFrame(scrambleRaf);
            scrambleRaf = null;
            nameChars.forEach((ch) => { ch.textContent = ch.dataset.final; });
          };

          const magneticTargets = [thumb, name].filter(Boolean);
          link.addEventListener('mousemove', (e) => {
            const rect = link.getBoundingClientRect();
            const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
            const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
            gsap.to(magneticTargets, {
              x: dx * 24,
              y: dy * 12,
              duration: 0.6,
              ease: 'power3.out',
              overwrite: 'auto',
            });
          });
          link.addEventListener('mouseenter', () => {
            if (thumbImg) gsap.to(thumbImg, { scale: 1.06, duration: 0.7, ease: 'power3.out' });
            runScramble();
          });
          link.addEventListener('mouseleave', () => {
            gsap.to(magneticTargets, { x: 0, y: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
            if (thumbImg) gsap.to(thumbImg, { scale: 1, duration: 0.7, ease: 'power3.out' });
            resetScramble();
          });
        }
      });

      const footer = $('.webdesign-works__footer', works);
      if (footer) {
        gsap.fromTo(footer.children,
          { yPercent: 60, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: { trigger: footer, start: 'top 85%', once: true },
          }
        );
      }
    }

    const worksCursor = $('[data-works-cursor]');
    const worksCursorTrack = $('[data-works-cursor-track]', worksCursor || document);
    const worksRows = $$('[data-works-row]');
    if (worksCursor && worksCursorTrack && worksRows.length && !('ontouchstart' in window)) {
      let targetX = 0, targetY = 0;
      let renderX = 0, renderY = 0;
      let rafId = null;
      const ease = 0.22;
      const render = () => {
        renderX += (targetX - renderX) * ease;
        renderY += (targetY - renderY) * ease;
        worksCursor.style.setProperty('--cx', renderX + 'px');
        worksCursor.style.setProperty('--cy', renderY + 'px');
        if (Math.abs(targetX - renderX) > 0.4 || Math.abs(targetY - renderY) > 0.4) {
          rafId = requestAnimationFrame(render);
        } else {
          rafId = null;
        }
      };
      const onMove = (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!rafId) rafId = requestAnimationFrame(render);
      };
      const setMarqueeName = (name) => {
        worksCursorTrack.innerHTML = '';
        const copies = 6;
        for (let i = 0; i < copies; i++) {
          const span = document.createElement('span');
          span.textContent = name;
          worksCursorTrack.appendChild(span);
        }
        const singleW = worksCursorTrack.firstElementChild.getBoundingClientRect().width;
        const bubbleW = Math.round(singleW * 2 + name.length * 11 + 12);
        worksCursor.style.setProperty('--cw', bubbleW + 'px');
      };
      worksRows.forEach(row => {
        row.addEventListener('mouseenter', (e) => {
          setMarqueeName(row.dataset.worksName || '');
          renderX = e.clientX;
          renderY = e.clientY;
          targetX = e.clientX;
          targetY = e.clientY;
          worksCursor.style.setProperty('--cx', renderX + 'px');
          worksCursor.style.setProperty('--cy', renderY + 'px');
          worksCursor.classList.add('is-visible');
          window.addEventListener('mousemove', onMove);
        });
        row.addEventListener('mouseleave', () => {
          worksCursor.classList.remove('is-visible');
          window.removeEventListener('mousemove', onMove);
        });
      });
    }

    const spreadText = $('[data-spread-text]');
    const spreadCopy = $('[data-spread-text-copy]', spreadText || document);
    if (spreadText && spreadCopy) {
      gsap.fromTo(spreadCopy,
        { '--spread': 1 },
        {
          '--spread': 0,
          ease: 'none',
          scrollTrigger: {
            trigger: spreadText,
            start: 'top 80%',
            end: 'top 25%',
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        }
      );
    }

    const servicePage = $('[data-service-page]');
    if (servicePage) {
      const panels = $$('[data-webdesign-panel]', servicePage);
      if (panels.length) {
        gsap.set(panels, { transition: 'none', clearProps: 'transform,filter' });

        panels.forEach((panel, i) => {
          const title = $('[data-panel-title]', panel);
          const num = $('[data-panel-num]', panel);
          const label = $('.webdesign-panel__label', panel);
          const textBlocks = $$('.webdesign-panel__text', panel);
          const image = $('[data-panel-image]', panel);
          const imageMedia = image ? $('img', image) : null;

          gsap.set([title, num, label, image, ...textBlocks].filter(Boolean), {
            transition: 'none',
            clearProps: 'opacity,visibility,filter,clipPath,transform',
          });
          if (imageMedia) gsap.set(imageMedia, { transition: 'none' });

          const introTargets = [title, num, label, ...textBlocks, image].filter(Boolean);
          gsap.fromTo(introTargets,
            { y: 36, opacity: 0.001 },
            {
              y: 0,
              opacity: 1,
              duration: 0.85,
              stagger: 0.055,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: panel,
                start: i === 0 ? 'top 92%' : 'top 68%',
                once: true,
              },
            }
          );

          if (imageMedia) {
            gsap.fromTo(imageMedia,
              { scale: 1.06 },
              {
                scale: 1,
                duration: 1.05,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: panel,
                  start: i === 0 ? 'top 92%' : 'top 68%',
                  once: true,
                },
              }
            );
            gsap.fromTo(imageMedia,
              { yPercent: 3 },
              {
                yPercent: -3,
                ease: 'none',
                scrollTrigger: {
                  trigger: panel,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.8,
                },
              }
            );
          }

          if (window.innerWidth > 760) {
            const isLast = i === panels.length - 1;
            const nextTrigger = isLast ? document.querySelector('[data-spread-text]') : panels[i + 1];
            if (nextTrigger) {
              gsap.to(panel, {
                scale: 0.7,
                rotate: i % 2 === 0 ? -1.9 : 1.5,
                yPercent: -26,
                ease: 'none',
                scrollTrigger: {
                  trigger: nextTrigger,
                  start: 'top bottom',
                  end: 'top top',
                  scrub: 0.9,
                  invalidateOnRefresh: true,
                },
              });
            }
          }
        });
      }

    }

    const stats = $('[data-about-stats]');
    if (stats) {
      gsap.fromTo($$('div', stats),
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          scrollTrigger: { trigger: stats, start: 'top 78%', once: true },
        }
      );

      $$('[data-count]', stats).forEach(counter => {
        const target = Number(counter.dataset.count || 0);
        const value = { n: 0 };
        gsap.to(value, {
          n: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => { counter.textContent = Math.round(value.n); },
          scrollTrigger: { trigger: stats, start: 'top 78%', once: true },
        });
      });
    }

    ScrollTrigger.refresh();
    return true;
  }

  /* ---------- Reveal-on-scroll fallback ---------- */
  function initRevealFallback() {
    if (prefersReduced) {
      $$('.reveal').forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    $$('.reveal').forEach(el => io.observe(el));
  }

  /* ---------- Hero — video parallax + tick reactivity ---------- */
  function initHeroInteraction() {
    const media = $('[data-parallax]');
    const ticks = $$('.tick');
    if (!media && !ticks.length) return;
    const useMouseMedia = media && !hasGsap();

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let rafId = null;

    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      targetX = x;
      targetY = y;

      if (ticks.length) {
        ticks.forEach((tick, i) => {
          const offset = Math.abs(i - 2);
          const h = 12 + (4 - offset * 2) + Math.abs(x * 14);
          tick.style.height = h + 'px';
          tick.style.opacity = (0.4 + Math.abs(x) * 0.6).toFixed(2);
        });
      }

      if (!rafId) rafId = requestAnimationFrame(loop);
    };

    const loop = () => {
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;
      if (useMouseMedia) {
        media.style.transform = `translate3d(${mouseX * 18}px, ${mouseY * 14}px, 0) scale(1.02)`;
      }
      if (Math.abs(targetX - mouseX) > 0.001 || Math.abs(targetY - mouseY) > 0.001) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    };

    if (!prefersReduced) {
      window.addEventListener('mousemove', onMove, { passive: true });
    }
  }

  /* ---------- Carousel (3D + drag + keyboard) ---------- */
  function initCarousel() {
    const root = $('[data-carousel]');
    if (!root) return;

    const stage = $('[data-carousel-stage]', root);
    const track = $('[data-carousel-track]', root);
    const items = $$('.carousel__item', track);
    const arrows = $$('[data-carousel-dir]', root);
    const dots = $$('[data-carousel-dots] .dot', root);
    if (!items.length) return;

    const total = items.length;
    let current = 3;
    const SPACING = () => Math.min(240, window.innerWidth * 0.175);

    const setDots = () => {
      dots.forEach((d, i) => {
        const active = i === current;
        d.classList.toggle('active', active);
        d.setAttribute('aria-current', active ? 'true' : 'false');
      });
    };

    dots.forEach((dot, i) => {
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.setAttribute('aria-label', `Go to slide ${i + 1} of ${items.length}`);
      dot.addEventListener('click', () => {
        if (i === current) return;
        current = i;
        layout();
      });
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (i !== current) {
            current = i;
            layout();
          }
        }
      });
    });

    if (stage) stage.setAttribute('aria-live', 'polite');

    const layout = () => {
      const spacing = SPACING();
      items.forEach((item, i) => {
        let pos = (i - current + total) % total;
        if (pos > total / 2) pos -= total;

        const abs = Math.abs(pos);
        const scale = 1 - abs * 0.07;
        const z = pos === 0 ? 0 : -abs * 60;
        const rotY = pos * -6;
        const opacity = abs > 2 ? 0 : 1;

        item.style.transform = `translate(-50%, -50%) translate3d(${pos * spacing}px, 0, ${z}px) scale(${scale}) rotateY(${rotY}deg)`;
        item.style.opacity = String(opacity);
        item.style.zIndex = String(10 - abs);
        item.classList.toggle('is-active', pos === 0);
      });
      setDots();
    };

    // Initial paint without transitions; enable transitions after first frame.
    items.forEach(item => { item.style.transition = 'none'; });
    layout();
    requestAnimationFrame(() => {
      items.forEach(item => {
        item.style.transition = 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms cubic-bezier(0.22, 1, 0.36, 1)';
      });
    });

    const step = (dir) => {
      current = (current + dir + total) % total;
      layout();
    };

    arrows.forEach(btn => {
      // Stop pointerdown from bubbling to the stage's drag handler, which would
      // setPointerCapture on the stage and steal the resulting click.
      btn.addEventListener('pointerdown', (e) => e.stopPropagation());
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dir = parseInt(btn.dataset.carouselDir, 10) || 0;
        step(dir);
      });
    });

    // Keyboard
    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });

    // Drag / swipe — pointer events
    let dragging = false;
    let startX = 0;
    let lastX = 0;
    let movedAt = 0;
    const DRAG_THRESHOLD = 60;

    const onDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      lastX = e.clientX;
      movedAt = Date.now();
      stage.classList.add('is-dragging');
      stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      lastX = e.clientX;
      const dx = e.clientX - startX;
      // micro-feedback: nudge track slightly
      track.style.transform = `translate3d(${Math.max(-40, Math.min(40, dx * 0.18))}px, 0, 0)`;
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      track.style.transform = '';
      const dx = lastX - startX;
      const elapsed = Date.now() - movedAt;
      if (Math.abs(dx) > DRAG_THRESHOLD && elapsed < 700) {
        step(dx < 0 ? 1 : -1);
      } else if (Math.abs(dx) > 140) {
        step(dx < 0 ? 1 : -1);
      }
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('pointerleave', onUp);

    // Click a side item to jump directly to it
    items.forEach((item, i) => {
      item.addEventListener('click', () => {
        if (i === current) return;
        if (Math.abs(lastX - startX) > 8) return; // suppress click after drag
        current = i;
        layout();
      });
    });

    // Reflow on resize
    let resizeRaf;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(layout);
    });
  }

  /* ---------- Portfolio archive filters ---------- */
  function initPortfolio() {
    const grid = $('[data-portfolio-grid]');
    const filters = $('[data-portfolio-filters]');
    if (!grid || !filters) return;

    const items = $$('.portfolio__item', grid);
    const buttons = $$('[data-filter]', filters);

    const applyFilter = (category) => {
      buttons.forEach(button => {
        const active = button.dataset.filter === category;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      items.forEach(item => {
        const categories = (item.dataset.category || '').split(/\s+/).filter(Boolean);
        const match = category === 'all' || categories.includes(category);
        item.classList.toggle('is-hidden', !match);
      });

      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };

    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
      button.addEventListener('click', () => applyFilter(button.dataset.filter || 'all'));
    });

    $$('[data-video-card]', grid).forEach(card => {
      const video = $('video', card);
      if (!video) return;

      card.addEventListener('mouseenter', () => {
        const play = video.play();
        if (play && typeof play.catch === 'function') play.catch(() => {});
      });
      card.addEventListener('mouseleave', () => video.pause());
      card.addEventListener('focusin', () => {
        const play = video.play();
        if (play && typeof play.catch === 'function') play.catch(() => {});
      });
      card.addEventListener('focusout', () => video.pause());
    });
  }

  /* ---------- Contact form ---------- */
  function initContact() {
    const form = $('[data-contact]');
    if (!form) return;
    const status = $('[data-contact-status]', form);

    // Pill toggle state (fallback for browsers without :has)
    $$('.pill--toggle input', form).forEach(input => {
      const wrap = input.closest('.pill--toggle');
      const sync = () => wrap.classList.toggle('is-checked', input.checked);
      input.addEventListener('change', sync);
      sync();
    });

    // Clear invalid state on input
    $$('input, textarea', form).forEach(el => {
      el.addEventListener('input', () => {
        el.closest('.field')?.classList.remove('is-invalid');
        if (status) status.textContent = '';
        status?.classList.remove('is-success', 'is-error');
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const required = $$('input[required], textarea[required]', form);
      let valid = true;
      required.forEach(el => {
        const wrapper = el.closest('.field');
        if (!el.checkValidity()) {
          wrapper?.classList.add('is-invalid');
          valid = false;
        } else {
          wrapper?.classList.remove('is-invalid');
        }
      });

      if (!valid) {
        status.textContent = 'Please complete the highlighted fields.';
        status.className = 'contact__status is-error';
        const firstInvalid = form.querySelector('.is-invalid input, .is-invalid textarea');
        firstInvalid?.focus();
        return;
      }

      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const services = data.getAll('services').join(', ') || '—';
      const message = (data.get('message') || '').toString().trim();

      const subject = `New project — ${name}`;
      const body =
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Services: ${services}\n\n` +
        `${message}`;

      const mailto = `mailto:conlerevents@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      status.textContent = 'Opening your email client…';
      status.className = 'contact__status is-success';

      window.location.href = mailto;

      setTimeout(() => {
        status.textContent = 'Message drafted — finish sending from your email app. Or write us directly at conlerevents@gmail.com.';
      }, 1200);
    });
  }

  /* ---------- Smooth in-page anchor ---------- */
  function initAnchors() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ---------- Contact panel overlay ---------- */
  function initContactPanel() {
    const triggers = $$('[data-contact-trigger]');
    if (!triggers.length) return;
    let panel = $('[data-contact-panel]');

    if (!panel) {
      document.body.insertAdjacentHTML('beforeend', `
  <aside class="contact-panel" id="contact-panel" data-contact-panel aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="contact-panel-title">
    <div class="contact-panel__backdrop" data-contact-close aria-hidden="true"></div>
    <div class="contact-panel__sheet">
      <button class="contact-panel__close" type="button" aria-label="Close" data-contact-close>
        <span class="contact-panel__close-label">Close</span>
        <span class="contact-panel__close-icon" aria-hidden="true"></span>
      </button>

      <header class="contact-panel__head">
        <span class="contact-panel__eyebrow" data-cp-eyebrow><span>Get in touch — Index 005</span></span>
        <h2 class="contact-panel__title" id="contact-panel-title" data-cp-title>
          <span class="word"><span>let's</span></span>
          <span class="word"><span>chat</span></span>
          <span class="word"><span>—</span></span>
          <em><span class="word"><span>coffee's</span></span></em>
          <span class="word"><span>on</span></span>
          <span class="word"><span>us.</span></span>
        </h2>
        <p class="contact-panel__lede" data-cp-lede>Tell us what you're making. We answer fast, in plain Sardinian-Dutch.</p>
      </header>

      <form class="contact-panel__list" action="https://formsubmit.co/conlerevents@gmail.com" method="POST" novalidate data-cp-form>
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_template" value="box" />
        <div class="contact-panel__row" data-cp-field>
          <span class="contact-panel__num">01</span>
          <label class="contact-panel__label" for="cp-name"><i>Name</i></label>
          <input class="contact-panel__input" type="text" id="cp-name" name="name" placeholder="Your name" required autocomplete="name" />
          <span class="contact-panel__arrow" aria-hidden="true">→</span>
        </div>
        <div class="contact-panel__row" data-cp-field>
          <span class="contact-panel__num">02</span>
          <label class="contact-panel__label" for="cp-email"><i>Email</i></label>
          <input class="contact-panel__input" type="email" id="cp-email" name="email" placeholder="you@email.com" required autocomplete="email" />
          <span class="contact-panel__arrow" aria-hidden="true">→</span>
        </div>
        <div class="contact-panel__row" data-cp-field>
          <span class="contact-panel__num">03</span>
          <label class="contact-panel__label" for="cp-phone"><i>Phone</i><b>optional</b></label>
          <input class="contact-panel__input" type="tel" id="cp-phone" name="phone" placeholder="+31 6 23 45 92 49" autocomplete="tel" />
          <span class="contact-panel__arrow" aria-hidden="true">→</span>
        </div>
        <div class="contact-panel__row contact-panel__row--message" data-cp-field>
          <span class="contact-panel__num">04</span>
          <label class="contact-panel__label" for="cp-message"><i>Message</i></label>
          <input class="contact-panel__input" type="text" id="cp-message" name="message" placeholder="What's on your mind?" />
          <span class="contact-panel__arrow" aria-hidden="true">→</span>
        </div>
        <div class="contact-panel__row contact-panel__row--cta" data-cp-field>
          <span class="contact-panel__num">05</span>
          <span class="contact-panel__label"><i>Send</i></span>
          <button type="submit" class="contact-panel__submit"><span>Send it over</span></button>
          <span class="contact-panel__arrow" aria-hidden="true">→</span>
        </div>
      </form>

      <div class="contact-panel__channels">
        <a class="contact-panel__row contact-panel__row--info" href="mailto:conlerevents@gmail.com" data-cp-info>
          <span class="contact-panel__num">→</span>
          <span class="contact-panel__label"><i>Email</i></span>
          <span class="contact-panel__value">conlerevents@gmail.com</span>
          <span class="contact-panel__arrow" aria-hidden="true">↗</span>
        </a>
        <a class="contact-panel__row contact-panel__row--info" href="tel:+31623459249" data-cp-info>
          <span class="contact-panel__num">→</span>
          <span class="contact-panel__label"><i>Phone</i></span>
          <span class="contact-panel__value">+31 6 23 45 92 49</span>
          <span class="contact-panel__arrow" aria-hidden="true">↗</span>
        </a>
        <div class="contact-panel__row contact-panel__row--info contact-panel__row--static" data-cp-info>
          <span class="contact-panel__num">→</span>
          <span class="contact-panel__label"><i>Studio</i></span>
          <span class="contact-panel__value">Slaperdijk 17 · 6846RR Arnhem · NL</span>
          <span class="contact-panel__arrow contact-panel__arrow--mute" aria-hidden="true">·</span>
        </div>
        <div class="contact-panel__row contact-panel__row--info contact-panel__row--social" data-cp-social>
          <span class="contact-panel__num">→</span>
          <span class="contact-panel__label"><i>Follow</i></span>
          <span class="contact-panel__value">
            <a href="https://www.instagram.com/theconler/" target="_blank" rel="noopener">Instagram</a>
            <em>·</em>
            <a href="https://www.facebook.com/people/TheConler/100092535591763/" target="_blank" rel="noopener">Facebook</a>
            <em>·</em>
            <a href="https://youtu.be/S4mnPDaNaEc?si=ot1k649NoV4xLrwT" target="_blank" rel="noopener">YouTube</a>
            <em>·</em>
            <a href="https://www.linkedin.com/in/theconler" target="_blank" rel="noopener">LinkedIn</a>
          </span>
          <span class="contact-panel__arrow contact-panel__arrow--mute" aria-hidden="true">·</span>
        </div>
      </div>

      <div class="contact-panel__marquee" data-cp-marquee aria-hidden="true">
        <div class="contact-panel__marquee-track">
          <span>Available · 2026</span><em>★</em>
          <span>Cagliari — Arnhem</span><em>★</em>
          <span>Booking Q3 — Q4</span><em>★</em>
          <span>Available · 2026</span><em>★</em>
          <span>Cagliari — Arnhem</span><em>★</em>
          <span>Booking Q3 — Q4</span><em>★</em>
        </div>
      </div>
    </div>
  </aside>`);
      panel = $('[data-contact-panel]');
    }

    const sheet = $('.contact-panel__sheet', panel);
    const backdrop = $('.contact-panel__backdrop', panel);
    const closeBtns = $$('[data-contact-close]', panel);
    const closeBtn = $('.contact-panel__close', panel);
    const eyebrow = $('[data-cp-eyebrow] > span', panel);
    const titleWords = $$('[data-cp-title] .word > span', panel);
    const lede = $('[data-cp-lede]', panel);
    const fields = $$('[data-cp-field]', panel);
    const infoRows = $$('[data-cp-info]', panel);
    const socialRow = $('[data-cp-social]', panel);
    const socialLinks = socialRow ? $$('.contact-panel__value a', socialRow) : [];
    const marqueeTrack = $('.contact-panel__marquee-track', panel);
    const form = $('[data-cp-form]', panel);
    const formInputs = form ? $$('input[required], textarea[required]', form) : [];
    const menu = $('[data-menu]');

    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    let isOpen = false;
    let openTl = null;
    let lastFocused = null;

    const setBodyLock = (locked) => {
      document.documentElement.classList.toggle('contact-open', locked);
    };

    const trapFocus = (e) => {
      if (!isOpen || e.key !== 'Tab') return;
      const focusable = $$(FOCUSABLE, panel).filter(el => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    if (form) {
      const clearInvalid = (input) => {
        const row = input.closest('.contact-panel__row');
        if (row) row.classList.remove('is-invalid');
      };
      formInputs.forEach(input => {
        input.addEventListener('input', () => clearInvalid(input));
        input.addEventListener('blur', () => {
          if (input.value && !input.checkValidity()) {
            const row = input.closest('.contact-panel__row');
            if (row) row.classList.add('is-invalid');
          }
        });
      });
      form.addEventListener('submit', (e) => {
        let valid = true;
        formInputs.forEach(input => {
          const row = input.closest('.contact-panel__row');
          if (!input.checkValidity()) {
            if (row) row.classList.add('is-invalid');
            valid = false;
          } else if (row) {
            row.classList.remove('is-invalid');
          }
        });
        if (!valid) {
          e.preventDefault();
          const firstInvalid = $('.contact-panel__row.is-invalid input, .contact-panel__row.is-invalid textarea', form);
          if (firstInvalid) firstInvalid.focus();
        }
      });
    }

    const open = () => {
      if (isOpen) return;
      isOpen = true;
      lastFocused = document.activeElement;
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      setBodyLock(true);
      document.addEventListener('keydown', trapFocus);

      if (menu && menu.classList.contains('is-open')) {
        const toggle = $('[data-menu-toggle]');
        if (toggle) toggle.click();
      }

      if (prefersReduced || !window.gsap) {
        const firstInput = $('input, textarea', panel);
        if (firstInput) setTimeout(() => firstInput.focus({ preventScroll: true }), 60);
        return;
      }

      if (openTl) openTl.kill();

      gsap.set(backdrop, { opacity: 0 });
      gsap.set(sheet, { clipPath: 'inset(100% 0 0 0)' });
      gsap.set(eyebrow, { yPercent: 100 });
      gsap.set(titleWords, { yPercent: 110, opacity: 0 });
      gsap.set(lede, { autoAlpha: 0, y: 24 });
      gsap.set(fields, { autoAlpha: 0, y: 28, filter: 'blur(6px)' });
      gsap.set(infoRows, { autoAlpha: 0, x: 40 });
      if (socialLinks.length) gsap.set(socialLinks, { autoAlpha: 0, y: 12 });
      if (marqueeTrack) gsap.set(marqueeTrack, { x: 0 });

      openTl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      openTl
        .to(backdrop, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .to(sheet, { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'expo.inOut' }, 0.05)
        .to(eyebrow, { yPercent: 0, duration: 0.9 }, 0.35)
        .to(titleWords, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.07 }, 0.45)
        .to(lede, { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 0.85)
        .to(fields, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.95, stagger: 0.09, ease: 'power3.out' }, 0.9)
        .to(infoRows, { autoAlpha: 1, x: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out' }, 1.1);

      if (socialLinks.length) {
        openTl.to(socialLinks, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' }, 1.45);
      }

      if (marqueeTrack && !marqueeTrack._marqueeAnim) {
        const setupMarquee = () => {
          const width = marqueeTrack.scrollWidth / 2;
          if (width > 0) {
            marqueeTrack._marqueeAnim = gsap.to(marqueeTrack, {
              x: -width,
              duration: 22,
              ease: 'none',
              repeat: -1,
            });
          }
        };
        setTimeout(setupMarquee, 800);
      } else if (marqueeTrack && marqueeTrack._marqueeAnim) {
        marqueeTrack._marqueeAnim.play();
      }

      const firstInput = $('input, textarea', panel);
      if (firstInput) setTimeout(() => firstInput.focus({ preventScroll: true }), 1100);
    };

    const finalizeClose = () => {
      panel.classList.remove('is-open');
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;
      panel.setAttribute('aria-hidden', 'true');
      setBodyLock(false);
      document.removeEventListener('keydown', trapFocus);

      if (prefersReduced || !window.gsap) {
        finalizeClose();
        return;
      }

      if (openTl) openTl.kill();

      if (marqueeTrack && marqueeTrack._marqueeAnim) marqueeTrack._marqueeAnim.pause();

      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: finalizeClose,
      });
      tl
        .to([fields, infoRows, socialLinks].flat(), { autoAlpha: 0, y: 16, duration: 0.35, stagger: 0.02 }, 0)
        .to(titleWords, { yPercent: 110, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power3.in' }, 0.05)
        .to(lede, { autoAlpha: 0, y: 12, duration: 0.35 }, 0.05)
        .to(sheet, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' }, 0.25)
        .to(backdrop, { opacity: 0, duration: 0.5 }, 0.4);
    };

    triggers.forEach(t => {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        open();
      });
    });
    closeBtns.forEach(b => b.addEventListener('click', close));
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  function initPillsWave() {
    const container = $('[data-pills-wave]');
    if (!container) return;
    const pills = $$('[data-pill]', container);
    if (!pills.length) return;
    if (prefersReduced || !window.gsap) return;
    const LIFT = 22;
    const ROT = 4;
    const FALLOFF = 0.5;
    pills.forEach((pill, i) => {
      pill.addEventListener('mouseenter', () => {
        pills.forEach((other, j) => {
          const distance = Math.abs(j - i);
          const factor = Math.pow(FALLOFF, distance);
          const direction = j === i ? 0 : (j < i ? -1 : 1);
          gsap.to(other, {
            y: -LIFT * factor,
            rotate: direction * ROT * factor,
            duration: 0.55,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        });
      });
      pill.addEventListener('mouseleave', () => {
        pills.forEach((other) => {
          gsap.to(other, {
            y: 0,
            rotate: 0,
            duration: 0.7,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        });
      });
    });
  }


  /* ---------- Boot ---------- */
  const boot = () => {
    initIntro();
    initClock();
    initMenu();
    initSplitHero();
    initSplitWords();
    if (!initGsapScroll()) initRevealFallback();
    initHeroInteraction();
    initCarousel();
    initPortfolio();
    initContact();
    initContactPanel();
    initAnchors();
    initPillsWave();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
