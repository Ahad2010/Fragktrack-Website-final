(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ============ PRELOADER ============ */
  const preloader = $('#preloader');
  const barSpan   = preloader ? $('.preloader__bar span') : null;
  const pctEl     = preloader ? $('.preloader__pct') : null;
  const letters   = $$('.preloader__word span');

  const runPreloader = () => new Promise(resolve => {
    if (!preloader) { resolve(); return; }

    if (window.gsap) {
      gsap.to(letters, { y: 0, opacity: 1, duration: .9, stagger: .05, ease: 'expo.out', delay: .1 });
    } else {
      letters.forEach(l => { l.style.transform = 'translateY(0)'; l.style.opacity = 1; });
    }

    let pct = 0;
    const tick = setInterval(() => {
      pct += Math.random() * 14 + 4;
      if (pct >= 100) { pct = 100; clearInterval(tick); done(); }
      if (barSpan) barSpan.style.width = pct + '%';
      if (pctEl) pctEl.textContent = String(Math.floor(pct)).padStart(2, '0');
    }, 90);

    // Safety net: never let the preloader hang forever
    const hardStop = setTimeout(() => { clearInterval(tick); done(); }, 4000);

    const done = () => {
      clearTimeout(hardStop);
      setTimeout(() => {
        if (window.gsap) {
          gsap.to(preloader, {
            yPercent: -100, duration: 1, ease: 'expo.inOut',
            onComplete: () => {
              preloader.style.display = 'none';
              preloader.removeAttribute('role');
              document.body.classList.remove('no-scroll');
              document.body.style.overflow = '';
              resolve();
            }
          });
        } else {
          preloader.style.display = 'none';
          preloader.removeAttribute('role');
          document.body.classList.remove('no-scroll');
          document.body.style.overflow = '';
          resolve();
        }
      }, 300);
    };
  });

  /* ============ LENIS + GSAP INIT ============ */
  const initScroll = () => {
    let lenis;
    if (window.Lenis) {
      lenis = new Lenis({
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);

      $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -80, duration: 1.5 });
      }));

      if (window.ScrollTrigger && window.gsap) {
        lenis.on('scroll', ScrollTrigger.update);
      }
    }
    return lenis;
  };

  /* ============ SCROLL PROGRESS ============ */
  const progress = $('#scroll-progress span');
  const onScrollProgress = () => {
    if (!progress) return;
    const h = document.documentElement;
    const p = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight);
    progress.style.width = Math.max(0, Math.min(1, p)) * 100 + '%';
  };
  window.addEventListener('scroll', onScrollProgress, { passive: true });

  /* ============ NAV ============ */
  const nav = $('#nav');
  const setNav = () => { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 30); };
  window.addEventListener('scroll', setNav, { passive: true });

  const links = $$('.nav__link');
  const sections = links.map(l => {
    const href = l.getAttribute('href');
    if (href && href.startsWith('#')) return document.querySelector(href);
    return null;
  }).filter(Boolean);

  const setActive = () => {
    const y = window.scrollY + 120;
    let idx = 0;
    sections.forEach((s, i) => { if (s && s.offsetTop <= y) idx = i; });
    links.forEach(l => l.classList.remove('active'));
    if (links[idx]) links[idx].classList.add('active');
  };
  window.addEventListener('scroll', setActive, { passive: true });

  /* ============ BURGER MENU ============ */
  const burger = $('#burger');
  const mm = $('#mobile-menu');
  if (burger && mm) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('on');
      mm.classList.toggle('on');
      mm.setAttribute('aria-hidden', !isOpen);
      burger.setAttribute('aria-expanded', isOpen);
      $$('#mobile-menu a').forEach(a => a.setAttribute('tabindex', isOpen ? '0' : '-1'));
    });

    $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('on');
      mm.classList.remove('on');
      mm.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      $$('#mobile-menu a').forEach(el => el.setAttribute('tabindex', '-1'));
    }));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mm.classList.contains('on')) {
        burger.click();
        burger.focus();
      }
    });
  }

  /* ============ CUSTOM CURSOR ============ */
  const cursor = $('#cursor');
  if (cursor) {
    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    const cursorRaf = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (dot) dot.style.transform = `translate(${mx}px, ${my}px)`;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(cursorRaf);
    };
    cursorRaf();

    const hoverTargets = 'a, button, .feature, .price, .tcard, .a-card, .ai-card, .floater, .d-card';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverTargets)) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverTargets)) cursor.classList.remove('is-hover');
    });
  }

  /* ============ INTERSECTION OBSERVER REVEAL ============ */
  const initReveals = () => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || 0);
          setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    // Line masked reveal
    $$('.line__inner').forEach((el, i) => {
      if (el.closest('.hero')) return;
      el.style.transform = 'translateY(110%)';
      el.style.transition = `transform 1.1s cubic-bezier(.2,.8,.2,1)`;
      el.dataset.delay = (i % 3) * 80;
      io.observe(el);
    });

    // Section card reveals
    const cardSelectors = [
      '.stat', '.feature', '.timeline li', '.a-card', '.ai-card',
      '.price', '.tcard', '.d-card', '.d-panel'
    ];

    cardSelectors.forEach(sel => {
      $$(sel).forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.9s cubic-bezier(.2,.8,.2,1), transform 0.9s cubic-bezier(.2,.8,.2,1)`;
        el.dataset.delay = (i % 4) * 50;
        io.observe(el);
      });
    });

    // Chapter heads
    $$('.chapter__head').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity 0.9s cubic-bezier(.2,.8,.2,1), transform 0.9s cubic-bezier(.2,.8,.2,1)`;
      io.observe(el);
    });

    // Dashboard frame
    const df = $('.dashboard__frame');
    if (df) {
      df.style.opacity = '0';
      df.style.transform = 'scale(0.92)';
      df.style.transition = `opacity 1.4s cubic-bezier(.2,.8,.2,1), transform 1.4s cubic-bezier(.2,.8,.2,1)`;
      io.observe(df);
    }

    // Footer giant
    const fg = $('.footer__giant');
    if (fg) {
      fg.style.opacity = '0';
      fg.style.transform = 'translateY(80px)';
      fg.style.transition = `opacity 1.4s cubic-bezier(.2,.8,.2,1), transform 1.4s cubic-bezier(.2,.8,.2,1)`;
      io.observe(fg);
    }

    // Bars grow
    $$('.a-bars i, .mockup__bars i').forEach(bar => {
      const h = bar.style.height;
      bar.style.height = '0%';
      bar.style.transition = `height 1.2s cubic-bezier(.2,.8,.2,1)`;
      const barIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            bar.style.height = h;
            barIo.unobserve(bar);
          }
        });
      }, { threshold: 0.3 });
      barIo.observe(bar);
    });

    // SAFETY NET: if an observer never fires (slow preview / iframe env),
    // force every hidden reveal element visible after 2.5s so content
    // never gets stuck at opacity:0.
    setTimeout(() => {
      $$('.line__inner, .stat, .feature, .timeline li, .a-card, .ai-card, .price, .tcard, .d-card, .d-panel, .chapter__head, .dashboard__frame, .footer__giant')
        .forEach(el => {
          if (el.style.opacity === '0' || el.style.transform.includes('110%') || el.style.transform.includes('30px') || el.style.transform.includes('80px') || el.style.transform.includes('0.92')) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }
        });
    }, 2500);
  };

  /* ============ GSAP FALLBACK REVEALS ============ */
  const initGsapReveals = () => {
    if (!window.gsap || !window.ScrollTrigger) return;

    // Hero immediate reveal
    setTimeout(() => {
      $$('.hero .line__inner').forEach((el, i) => {
        gsap.to(el, { y: 0, duration: 1.1, ease: 'expo.out', delay: i * 0.08 });
      });
    }, 100);

    // Hero fade-in elements
    ['.hero__sub', '.hero__cta', '.hero__proof', '.hero__topline'].forEach((sel, i) => {
      const el = $(sel);
      if (el) gsap.from(el, { opacity: 0, y: 24, duration: 1, delay: 0.6 + i * 0.1, ease: 'expo.out' });
    });

    // Hero mockup + floaters
    gsap.from('.mockup', { opacity: 0, y: 60, scale: 0.94, duration: 1.3, delay: 0.4, ease: 'expo.out' });
    gsap.from('.floater', { opacity: 0, y: 30, duration: 1, delay: 0.9, stagger: 0.15, ease: 'expo.out' });

    // Blobs subtle parallax
    gsap.utils.toArray('.hero__bg .blob').forEach((b, i) => {
      gsap.to(b, { y: (i + 1) * 40, scrollTrigger: { trigger: '.hero', scrub: true } });
    });
  };

  /* ============ COUNTERS ============ */
  const initCounters = () => {
    const counters = $$('.counter');
    if (!counters.length) return;

    const format = (n, decimals = 0) => {
      if (decimals > 0) return n.toFixed(decimals);
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
      return Math.floor(n).toString();
    };

    counters.forEach(el => {
      const target = parseFloat(el.dataset.count);
      if (isNaN(target)) return; // skip counters with missing/invalid data-count

      const dec = parseInt(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || '';
      const obj = { v: 0 };
      let done = false;

      const animate = () => {
        if (done) return;
        done = true;
        if (window.gsap) {
          gsap.to(obj, {
            v: target, duration: 2.4, ease: 'expo.out',
            onUpdate: () => { el.textContent = format(obj.v, dec) + suffix; },
            onComplete: () => { el.textContent = format(target, dec) + suffix; },
          });
        } else {
          el.textContent = format(target, dec) + suffix;
        }
      };

      const counterIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animate();
            counterIo.unobserve(el);
          }
        });
      }, { threshold: 0.3 });
      counterIo.observe(el);

      // SAFETY NET: some preview/iframe environments delay or never
      // fire IntersectionObserver correctly. If element is already in
      // the viewport or the observer hasn't fired within 2.5s, force it.
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        const inViewport = r.top < window.innerHeight && r.bottom > 0;
        if (!done && inViewport) animate();
      }, 300);

      setTimeout(() => { if (!done) animate(); }, 2500);
    });
  };

  /* ============ FEATURE MOUSE GLOW ============ */
  $$('.feature').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ============ PARALLAX ============ */
  const parallaxRoot = $('.hero__right');
  if (parallaxRoot) {
    window.addEventListener('mousemove', e => {
      const r = parallaxRoot.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;

      $$('.floater').forEach(f => {
        const d = parseInt(f.dataset.float || 1);
        f.style.transform = `translate(${dx * -20 * d}px, ${dy * -20 * d}px)`;
      });
      const mk = $('.mockup');
      if (mk) {
        mk.style.transform = `translate(-50%,-50%) rotateY(${dx * 6}deg) rotateX(${dy * -6}deg)`;
      }
    });
    const mk = $('.mockup');
    if (mk) {
      mk.style.transformStyle = 'preserve-3d';
      mk.style.transition = 'transform .4s ease-out';
    }
  }

  /* ============ FAQ ACCORDION ============ */
  $$('.accordion > li').forEach(li => {
    const btn = li.querySelector('button');
    if (btn) {
      btn.addEventListener('click', () => {
        const wasOpen = li.classList.contains('on');
        $$('.accordion > li').forEach(x => {
          x.classList.remove('on');
          const b = x.querySelector('button');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          li.classList.add('on');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  /* ============ TESTIMONIAL SLIDER ============ */
  const track = $('#tslider-track');
  const prev = $('.tprev');
  const next = $('.tnext');
  if (track && prev && next) {
    const step = () => {
      const card = track.querySelector('.tcard');
      return card ? card.getBoundingClientRect().width + 20 : 320;
    };
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  }

  /* ============ INTERACTIVE CHARTS ============ */
  $$('.chart-interactive').forEach(chart => {
    const paths = chart.querySelectorAll('path');
    paths.forEach(p => {
      p.style.cursor = 'pointer';
      p.style.transition = 'opacity 0.3s, filter 0.3s';
      p.addEventListener('mouseenter', () => {
        p.style.opacity = '0.8';
        p.style.filter = 'brightness(1.3)';
      });
      p.addEventListener('mouseleave', () => {
        p.style.opacity = '1';
        p.style.filter = 'none';
      });
    });
  });

  /* ============ BAR HOVER TOOLTIPS ============ */
  $$('.a-bars > div').forEach(bar => {
    const val = bar.dataset.value;
    if (!val) return;
    bar.style.position = 'relative';
    bar.style.cursor = 'pointer';
    bar.addEventListener('mouseenter', () => {
      bar.style.transform = 'scaleY(1.05)';
      bar.style.transformOrigin = 'bottom';
      const tooltip = document.createElement('div');
      tooltip.className = 'bar-tooltip';
      tooltip.textContent = val + '%';
      tooltip.style.cssText = `
        position:absolute; top:-28px; left:50%; transform:translateX(-50%);
        background:var(--purple); color:#fff; padding:4px 10px; border-radius:8px;
        font-size:11px; font-family:var(--font-mono); white-space:nowrap;
        pointer-events:none; z-index:10; opacity:0; animation:fadeIn .2s forwards;
      `;
      bar.appendChild(tooltip);
    });
    bar.addEventListener('mouseleave', () => {
      bar.style.transform = '';
      const tip = bar.querySelector('.bar-tooltip');
      if (tip) tip.remove();
    });
  });

  /* ============ KEYBOARD NAVIGATION ============ */
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') document.body.classList.add('keyboard-nav');
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });

  /* ============ NEWSLETTER FORM ============ */
  const newsletterForm = $('.newsletter__form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value.trim()) {
        const btn = newsletterForm.querySelector('button');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.disabled = false;
          input.value = '';
        }, 2000);
      }
    });
  }

  /* ============ BOOT ============ */
  // Each step is isolated in its own try/catch so that ONE broken step
  // (e.g. a missing element, a CDN script that failed to load) can never
  // block the rest of the boot sequence. This is what was silently
  // killing initCounters()/initReveals() before.
  const safe = (name, fn) => {
    try { fn(); }
    catch (err) { console.error(`[app.js] "${name}" failed:`, err); }
  };

  window.addEventListener('load', async () => {
    document.body.classList.add('no-scroll');
    try {
      await runPreloader();
    } catch (err) {
      console.error('[app.js] runPreloader failed:', err);
      if (preloader) preloader.style.display = 'none';
    }
    document.body.classList.remove('no-scroll');

    safe('initReveals', initReveals);
    safe('initCounters', initCounters);
    safe('initScroll', initScroll);
    safe('initGsapReveals', initGsapReveals);
    safe('setNav', setNav);
    safe('setActive', setActive);
    safe('onScrollProgress', onScrollProgress);
  });
})();