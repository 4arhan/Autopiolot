// AUTOPILOT LABS — shared interactions
(function () {
  'use strict';

  // Scroll progress bar
  const prog = document.querySelector('.scroll-prog');
  if (prog) {
    const updateProg = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
      prog.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProg, { passive: true });
    updateProg();
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // ---- Topbar scroll state ----
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const onScroll = () => {
      topbar.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Mobile fullscreen menu ----
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  // Move .mobile-nav out of .topbar so position:fixed is relative to the
  // viewport, not the topbar (topbar has backdrop-filter which creates a
  // containing block for fixed descendants).
  if (mobileNav && mobileNav.parentElement && mobileNav.parentElement.classList.contains('topbar')) {
    document.body.appendChild(mobileNav);
  }
  if (toggle && mobileNav) {
    let lastFocus = null;
    let savedScrollY = 0;

    // Inject a visible close (X) button inside the drawer if one isn't present.
    // This fixes the "menu can open but not close" confusion on touch devices
    // where users don't realize the hamburger has become an X.
    let closeBtn = mobileNav.querySelector('.mnav-close');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'mnav-close';
      closeBtn.setAttribute('aria-label', 'Close menu');
      closeBtn.innerHTML = '<span aria-hidden="true">Close</span><span class="x" aria-hidden="true">×</span>';
      mobileNav.insertBefore(closeBtn, mobileNav.firstChild);
    }

    const openMenu = () => {
      lastFocus = document.activeElement;
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      // Pin body so iOS Safari can't scroll under the menu
      document.body.style.top = `-${savedScrollY}px`;
      document.body.classList.add('nav-locked');
      mobileNav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      const first = mobileNav.querySelector('a, button');
      if (first) setTimeout(() => first.focus(), 180);
    };
    const closeMenu = () => {
      mobileNav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('nav-locked');
      document.body.style.top = '';
      // Restore scroll position (html is scroll-smooth; use instant jump)
      const prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScrollY);
      document.documentElement.style.scrollBehavior = prevBehavior;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (mobileNav.classList.contains('open')) closeMenu(); else openMenu();
    });

    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    });

    // Esc closes, focus trap on Tab
    document.addEventListener('keydown', (e) => {
      if (!mobileNav.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key === 'Tab') {
        const focusables = mobileNav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Close when a link or explicitly-tagged close control is clicked.
    mobileNav.addEventListener('click', (e) => {
      const a = e.target.closest('a[href], [data-mnav-close]');
      if (a) closeMenu();
    });

    // Backdrop close: tap directly on the drawer background (not on children)
    mobileNav.addEventListener('click', (e) => {
      if (e.target === mobileNav) closeMenu();
    });

    // Close on any resize change when the menu is open (desktop or narrower).
    let resizeRaf = null;
    window.addEventListener('resize', () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (window.innerWidth > 1024 && mobileNav.classList.contains('open')) closeMenu();
      });
    });

    // Swipe-up-to-close (mobile gesture)
    let touchStartY = null;
    mobileNav.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
    }, { passive: true });
    mobileNav.addEventListener('touchend', (e) => {
      if (touchStartY == null) return;
      const endY = (e.changedTouches[0] && e.changedTouches[0].clientY) || touchStartY;
      if (touchStartY - endY > 90 && mobileNav.scrollTop <= 0) closeMenu();
      touchStartY = null;
    }, { passive: true });
  }

  // Mark active nav link from current path
  let navPath = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  if (!navPath) navPath = 'index';
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.getAttribute('data-nav') === navPath) {
      a.classList.add('is-active');
    }
  });

  // Word rotator on hero (any element with data-rotate="a,b,c")
  document.querySelectorAll('[data-rotate]').forEach((el) => {
    const words = el.getAttribute('data-rotate').split(',').map((s) => s.trim());
    if (!words.length) return;
    let i = 0;
    el.textContent = words[0];
    setInterval(() => {
      i = (i + 1) % words.length;
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = 'rotateWord .6s cubic-bezier(.22,.61,.36,1)';
      el.textContent = words[i];
    }, 2600);
  });

  // Pricing calculator (pricing.html)
  const calc = document.querySelector('[data-calculator]');
  if (calc) {
    const volEl = calc.querySelector('[name="volume"]');
    const tierEl = calc.querySelector('[name="tier"]');
    const volVal = calc.querySelector('[data-val="volume"]');
    const price = calc.querySelector('[data-val="price"]');
    const base = calc.querySelector('[data-val="base"]');
    const perTask = calc.querySelector('[data-val="per-task"]');
    const savings = calc.querySelector('[data-val="savings"]');
    const curEl = calc.querySelector('[data-val="cur"]');

    const CUR = 'AUD';
    const fmt = (n) => n.toLocaleString('en-AU', { maximumFractionDigits: 0 });

    const tiers = {
      starter: { rate: 4.80, base: 0,    label: 'Outcome' },
      growth:  { rate: 3.20, base: 1800, label: 'Hybrid' },
      scale:   { rate: 1.95, base: 4800, label: 'Hybrid · volume' }
    };

    const compute = () => {
      const volume = parseInt(volEl.value, 10);
      const tier = tiers[tierEl.value] || tiers.starter;
      const variable = volume * tier.rate;
      const total = tier.base + variable;
      const saved = Math.round(volume * 18 - total);
      volVal.textContent = fmt(volume);
      price.textContent = fmt(total);
      base.textContent = fmt(tier.base);
      perTask.textContent = tier.rate.toFixed(2);
      savings.textContent = fmt(Math.max(saved, 0));
      if (curEl) curEl.textContent = CUR;
    };

    [volEl, tierEl].forEach((e) => e && e.addEventListener('input', compute));
    compute();
  }

  // Directory / solutions switcher
  const dirRoot = document.querySelector('[data-directory]');
  if (dirRoot) {
    const items = dirRoot.querySelectorAll('[data-dir-item]');
    const panels = dirRoot.querySelectorAll('[data-dir-panel]');
    items.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-dir-item');
        items.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((p) => p.classList.toggle('active', p.getAttribute('data-dir-panel') === key));
      });
    });
  }

  // Accordion (FAQ)
  document.querySelectorAll('[data-accordion] [data-q]').forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('[data-item]');
      item.classList.toggle('open');
    });
  });

  // Live clock for status bar — real Melbourne time, updates every clock instance
  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    let fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-AU', {
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: 'Australia/Melbourne'
      });
    } catch (_) { fmt = null; }
    const tick = () => {
      const d = new Date();
      let text;
      if (fmt) {
        text = fmt.format(d) + ' AEST';
      } else {
        const hh = String(d.getUTCHours() + 10).padStart(2, '0').slice(-2);
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        text = hh + ':' + mm + ' AEST';
      }
      clocks.forEach((c) => { c.textContent = text; });
    };
    tick();
    setInterval(tick, 30000);
  }

  // Chip radio groups — keep .is-on in sync via change events (keyboard-friendly)
  document.querySelectorAll('[data-chip-group]').forEach((group) => {
    const chips = group.querySelectorAll('.chip');
    const sync = () => {
      chips.forEach((c) => {
        const i = c.querySelector('input');
        c.classList.toggle('is-on', !!(i && i.checked));
      });
    };
    chips.forEach((chip) => {
      const input = chip.querySelector('input');
      if (!input) return;
      input.addEventListener('change', sync);
    });
    sync();
  });

  // Inject @keyframes rotateWord once
  if (!document.getElementById('autopilotlabs-dyn-kf')) {
    const style = document.createElement('style');
    style.id = 'autopilotlabs-dyn-kf';
    style.textContent = '@keyframes rotateWord {0%{opacity:0;transform:translateY(12px);filter:blur(3px)}100%{opacity:1;transform:none;filter:none}}';
    document.head.appendChild(style);
  }

  // ---- Auto-stagger: apply incremental transition-delay to direct .reveal
  //      children of any [data-stagger] container. Motion.css has a CSS
  //      fallback; this handles counts > 8 and lets us keep things tidy.
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    document.querySelectorAll('[data-stagger]').forEach((container) => {
      const step = parseInt(container.getAttribute('data-stagger-step') || '60', 10);
      const max = parseInt(container.getAttribute('data-stagger-max') || '8', 10);
      const children = container.querySelectorAll(':scope > .reveal');
      children.forEach((child, i) => {
        const n = Math.min(i, max);
        child.style.transitionDelay = (n * step) + 'ms';
      });
    });
  }

  // ---- Count-up stats — animate any [data-count-to] element when it
  //      enters the viewport. Supports integers and decimals; preserves
  //      a leading sign or trailing symbol via data-prefix / data-suffix.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('[data-count-to]');
    if (targets.length) {
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const animate = (el) => {
        const to = parseFloat(el.getAttribute('data-count-to'));
        if (isNaN(to)) return;
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = parseInt(el.getAttribute('data-duration') || '1200', 10);
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const v = to * easeOutCubic(t);
          el.textContent = prefix + v.toFixed(decimals) + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else el.classList.add('settled');
        };
        requestAnimationFrame(tick);
      };
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target);
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
      targets.forEach((el) => {
        el.classList.add('count-up');
        el.textContent = (el.getAttribute('data-prefix') || '') + '0' + (el.getAttribute('data-suffix') || '');
        io.observe(el);
      });
    }
  }

  // ---- Lazy fade-in for images marked .lazy-fade
  document.querySelectorAll('img.lazy-fade').forEach((img) => {
    if (img.complete) {
      img.classList.add('ready');
    } else {
      img.addEventListener('load', () => img.classList.add('ready'), { once: true });
      img.addEventListener('error', () => img.classList.add('ready'), { once: true });
    }
  });

  // ---- Card cascade: when a grid enters the viewport, its children
  //      fade in one after another. Works without modifying child markup.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const grids = [
      '.roles-grid',
      '.cs-list',
      '.press-grid',
      '.archive .grid',
      '.int-grid'
    ];
    const selector = grids.join(',');
    const nodes = document.querySelectorAll(selector);
    if (nodes.length) {
      const style = document.createElement('style');
      style.textContent =
        '.cascade > *{opacity:0;transform:translateY(10px);transition:opacity 520ms cubic-bezier(0.4,0,0.1,1),transform 520ms cubic-bezier(0.4,0,0.1,1)}' +
        '.cascade.run > *{opacity:1;transform:none}';
      document.head.appendChild(style);

      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const grid = e.target;
          const kids = grid.children;
          for (let i = 0; i < kids.length; i++) {
            const delay = Math.min(i * 55, 440);
            kids[i].style.transitionDelay = delay + 'ms';
          }
          grid.classList.add('run');
          io.unobserve(grid);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

      nodes.forEach((g) => {
        g.classList.add('cascade');
        io.observe(g);
      });
    }
  }
})();
