/* ============================================================
   MELANI VILA — script.js
   Vanilla JS + GSAP / ScrollTrigger / Lenis (CDN)
   Progressive enhancement: the page is fully readable without
   any of this. Animation only ever adds.
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  /* ---------- small helpers ---------- */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function splitWords(el) {
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = tok;
            frag.appendChild(s);
            out.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    })(el);
    return out;
  }

  function splitChars(el) {
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var word = document.createElement('span');
            word.style.display = 'inline-block';
            word.style.whiteSpace = 'nowrap';
            tok.split('').forEach(function (c) {
              var s = document.createElement('span');
              s.className = 'ch';
              s.textContent = c;
              word.appendChild(s);
              out.push(s);
            });
            frag.appendChild(word);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    })(el);
    return out;
  }

  /* ============================================================
     1. LENIS — smooth scroll on GSAP's ticker (one RAF loop)
     ============================================================ */
  function initLenis() {
    if (REDUCED || !window.Lenis || !hasGSAP) return;
    var L = window.Lenis.default || window.Lenis;
    lenis = new L({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ============================================================
     2. PRELOADER — hard capped at 1.4s
     ============================================================ */
  function initPreloader(done) {
    var pre = $('#preloader');
    var bar = $('.preloader__bar i');
    var count = $('#preCount');
    if (!pre) { done(); return; }

    if (REDUCED || !hasGSAP) {
      pre.parentNode.removeChild(pre);
      root.classList.add('loaded');
      done();
      return;
    }

    var o = { v: 0 };
    var tl = gsap.timeline();
    tl.to(bar, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0)
      .to(o, {
        v: 100, duration: 1.2, ease: 'power2.inOut',
        onUpdate: function () { count.textContent = String(Math.round(o.v)).padStart(3, '0'); }
      }, 0)
      .to('.preloader__inner, .preloader__count', { opacity: 0, duration: .3, ease: 'power2.out' }, 1.15)
      .to(pre, {
        clipPath: 'inset(0 0 100% 0)',
        duration: .9,
        ease: 'expo.inOut',
        onStart: function () { root.classList.add('loaded'); done(); },
        onComplete: function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }
      }, 1.25);
  }

  /* ============================================================
     3. CUSTOM CURSOR — magnetic, pointer:fine only
     ============================================================ */
  function initCursor() {
    if (REDUCED || !hasGSAP) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var cur = $('#cursor');
    var label = $('.cursor__label', cur);
    if (!cur) return;
    root.classList.add('has-cursor');

    gsap.set(cur, { xPercent: -50, yPercent: -50 });
    var xTo = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' });
    var yTo = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });

    window.addEventListener('pointermove', function (e) {
      xTo(e.clientX);
      yTo(e.clientY);
    }, { passive: true });

    function grow(size, text) {
      gsap.to(cur, { width: size, height: size, duration: .35, ease: 'power3.out' });
      gsap.to(label, { opacity: text ? 1 : 0, duration: .25 });
      label.textContent = text || '';
    }

    $$('a, button').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        grow(44, '');
        gsap.to(cur, { backgroundColor: 'rgba(108,75,245,.85)', duration: .3 });
      });
      el.addEventListener('pointerleave', function () {
        grow(7, '');
        gsap.to(cur, { backgroundColor: '#6C4BF5', duration: .3 });
        gsap.to(el, { x: 0, y: 0, duration: .5, ease: 'elastic.out(1,.5)' });
      });
    });

    /* magnetic pull on buttons */
    $$('.btn, .header__cta, .cta__copy').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * .25,
          y: (e.clientY - (r.top + r.height / 2)) * .35,
          duration: .4, ease: 'power3.out'
        });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' });
      });
    });
  }

  /* ============================================================
     4. HEADER — velocity hide/show + anchor scrolling
     ============================================================ */
  function initHeader() {
    /* anchors work with or without GSAP */
    $$('[data-scroll]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id.charAt(0) !== '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
        else target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
      });
    });

    if (REDUCED || !hasGSAP) return;
    var header = $('#header');
    var last = 0;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        if (y < 80) { gsap.to(header, { yPercent: 0, duration: .4, ease: 'power3.out' }); last = y; return; }
        if (y > last + 6) gsap.to(header, { yPercent: -130, duration: .45, ease: 'power3.out' });
        else if (y < last - 6) gsap.to(header, { yPercent: 0, duration: .45, ease: 'power3.out' });
        last = y;
      }
    });
  }

  /* ============================================================
     5. PROGRESS RAIL
     ============================================================ */
  function initProgressRail() {
    if (REDUCED || !hasGSAP) return;
    var fill = $('#railFill');
    ScrollTrigger.create({
      start: 0, end: 'max', scrub: true,
      onUpdate: function (self) { gsap.set(fill, { scaleY: self.progress }); }
    });
  }

  /* ============================================================
     6. VIDEO — lazy attach + scroll scrub
     ============================================================ */
  function lightNetwork() {
    var c = navigator.connection;
    if (!c) return false;
    if (c.saveData) return true;
    return /(^|-)2g$/.test(c.effectiveType || '');
  }

  function attachVideo(video) {
    if (!video || video.dataset.attached) return;
    if (lightNetwork()) return;                 /* posters only */
    video.dataset.attached = '1';

    var mobile = window.matchMedia('(max-width: 768px)').matches;
    var webm = video.dataset.srcWebm;
    var mp4 = mobile && video.dataset.srcMobile ? video.dataset.srcMobile : video.dataset.src;

    if (webm && !mobile) {
      var s1 = document.createElement('source');
      s1.src = webm; s1.type = 'video/webm';
      video.appendChild(s1);
    }
    var s2 = document.createElement('source');
    s2.src = mp4; s2.type = 'video/mp4';
    video.appendChild(s2);

    /* If a file is missing or the codec is unsupported, the poster stays and
       the section still reads — the scrub guards on readyState anyway. */
    s2.addEventListener('error', function () { video.dataset.failed = '1'; });

    /* 'auto', not 'metadata': with metadata only, every seek costs an HTTP
       range request and the scrub stutters on the network. These files are
       ~3MB, so buffering them whole is the cheaper trade. */
    video.preload = 'auto';
    video.load();
  }

  function observeVideos() {
    var vids = $$('video[data-src]');
    if (!('IntersectionObserver' in window)) { vids.forEach(attachVideo); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { attachVideo(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '150% 0px' });
    vids.forEach(function (v) { io.observe(v); });
  }

  var FPS = 24;                    /* all three films are encoded at 24fps */

  function scrubVideo(video, trigger, start, end) {
    if (!video || REDUCED || !hasGSAP) return;

    var target = -1;
    var lastFrame = -1;

    /* Scroll updates only record where the film should be; the seek itself
       happens here, at most one at a time. Assigning currentTime on every
       scroll tick interrupts the seek already in flight, which thrashes the
       decoder and can leave the video frozen on a single frame.
       Quantising to real frames also drops the sub-frame seeks that would
       decode the same picture twice. */
    function apply() {
      if (target < 0 || video.seeking) return;
      if (video.readyState < 2 || !isFinite(video.duration)) return;
      var frame = Math.round(target * FPS);
      if (frame === lastFrame) return;
      lastFrame = frame;
      try { video.currentTime = frame / FPS; } catch (e) { /* not seekable yet */ }
    }
    gsap.ticker.add(apply);

    ScrollTrigger.create({
      trigger: trigger,
      start: start || 'top top',
      end: end || 'bottom bottom',
      scrub: true,               /* Lenis already smooths; scrubbing again lags */
      onUpdate: function (self) {
        if (!isFinite(video.duration)) return;
        target = Math.min(self.progress, 0.9999) * video.duration;
      }
    });
  }

  /* ============================================================
     7. HERO
     ============================================================ */
  function initHero() {
    var hero = $('#hero');
    if (!hero) return;

    var eyebrow = $('.hero__eyebrow');
    if (eyebrow && hasGSAP && !REDUCED) {
      var chars = splitChars(eyebrow);
      gsap.set(chars, { opacity: 0 });
      gsap.to(chars, { opacity: 1, duration: .5, stagger: .015, ease: 'power2.out', delay: 1.9 });
    }

    if (!hasGSAP || REDUCED) return;

    /* entrance */
    gsap.to('.hero__title .line__i', {
      y: '0%', duration: 1.2, ease: 'expo.out', stagger: .09, delay: 1.75
    });
    gsap.to('.hero__aside [data-reveal]', {
      opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .08, delay: 2.15
    });

    /* scroll exit */
    var tl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .8 }
    });
    tl.to('.hero__title .line:nth-child(1)', { yPercent: -18, ease: 'none' }, 0)
      .to('.hero__title .line:nth-child(2)', { yPercent: -34, ease: 'none' }, 0)
      .to('.hero__aside', { yPercent: -44, ease: 'none' }, 0)
      .to('.hero__media', { scale: 1.08, ease: 'none' }, 0)
      .to('.hero__content', { opacity: 0, ease: 'none' }, .55)
      .to('.hero__foot', { opacity: 0, ease: 'none' }, 0);

    scrubVideo($('#videoHero'), hero);
  }

  /* ============================================================
     8. STATS — count-up + marquee
     ============================================================ */
  function initStats() {
    if (!hasGSAP || REDUCED) return;

    $$('.stat__num[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: function () {
          gsap.to(o, {
            v: target, duration: 1.6, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(o.v) + suffix; }
          });
        }
      });
    });

    gsap.from('.stat', {
      y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08,
      scrollTrigger: { trigger: '.stats__grid', start: 'top 85%' }
    });

    gsap.to('.stat__num--inf', {
      rotate: 8, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.stat__num--inf', start: 'top 85%' }
    });

    /* marquee */
    var track = $('.marquee__track');
    if (track) {
      var loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
      var mq = $('#marquee');
      mq.addEventListener('pointerenter', function () { gsap.to(loop, { timeScale: .5, duration: .4 }); });
      mq.addEventListener('pointerleave', function () { gsap.to(loop, { timeScale: 1, duration: .4 }); });
      if (lenis) {
        lenis.on('scroll', function (e) {
          var dir = e.direction || 1;
          loop.timeScale(dir >= 0 ? 1 : -1);
        });
      }
    }
  }

  /* ============================================================
     9. WORLD SHIFT — VOID ⇄ PAPER
     Handled entirely in CSS (`[data-world]` scopes its own palette) so the
     cut always lands on the section boundary and never leaves a paragraph
     stranded on the wrong background. No JS needed.
     ============================================================ */

  /* ============================================================
     10. MISSION — kinetic word resolve
     ============================================================ */
  function initMission() {
    var el = $('[data-words]');
    if (!el || !hasGSAP || REDUCED) return;
    var words = splitWords(el);
    gsap.to(words, {
      opacity: 1,
      ease: 'none',
      stagger: { each: .35 },
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  }

  /* ============================================================
     11. PILLARS — horizontal pin (desktop) / stack (mobile)
     ============================================================ */
  function initPillars() {
    var section = $('#pillars');
    var track = $('#pillarsTrack');
    if (!section || !track || !hasGSAP || REDUCED) return;

    $$('.pillar__title').forEach(function (title) {
      var chars = splitChars(title);
      gsap.set(chars, { yPercent: 100, rotateX: -70, opacity: 0 });
      gsap.to(chars, {
        yPercent: 0, rotateX: 0, opacity: 1,
        duration: .9, ease: 'expo.out', stagger: .03,
        scrollTrigger: { trigger: title, start: 'top 85%' }
      });
    });

    var mm = gsap.matchMedia();

    mm.add('(min-width: 769px)', function () {
      var distance = function () { return track.scrollWidth - window.innerWidth; };

      var st = gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + distance(); },
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          /* This pin adds ~2500px of spacing to the page. Every trigger below
             it has to be measured AFTER that spacing exists, or their start/end
             land thousands of pixels too high — which leaves the CTA film
             frozen on its last frame. A higher priority refreshes it first. */
          refreshPriority: 10
        }
      });

      $$('.pillar').forEach(function (p, i) {
        gsap.to($('.pillar__index', p), {
          y: -60, ease: 'none',
          scrollTrigger: {
            trigger: section, start: 'top top',
            end: function () { return '+=' + distance(); },
            scrub: 1
          }
        });
        gsap.to($('.pillar__rule', p), {
          scaleX: 1, duration: 1, ease: 'expo.out',
          scrollTrigger: {
            trigger: section,
            start: function () { return 'top top-=' + (distance() / 3) * i; },
            toggleActions: 'play none none reverse'
          }
        });
      });

      scrubVideo($('#videoBuilder'), section, 'top top',
                 function () { return '+=' + distance(); });

      return function () { st.scrollTrigger && st.scrollTrigger.kill(); st.kill(); };
    });

    mm.add('(max-width: 768px)', function () {
      gsap.set(track, { x: 0 });
      var tweens = $$('.pillar').map(function (p) {
        return gsap.to($('.pillar__rule', p), {
          scaleX: 1, duration: 1, ease: 'expo.out',
          scrollTrigger: { trigger: p, start: 'top 70%' }
        });
      });
      scrubVideo($('#videoBuilder'), section, 'top bottom', 'bottom top');
      return function () { tweens.forEach(function (t) { t.kill(); }); };
    });
  }

  /* ============================================================
     12. STORY — timeline draw + quote
     ============================================================ */
  function initStory() {
    if (!hasGSAP || REDUCED) return;
    var tl = $('.story__timeline');
    if (!tl) return;

    gsap.to('.story__title .line__i', {
      y: '0%', duration: 1.1, ease: 'expo.out', stagger: .08,
      scrollTrigger: { trigger: '.story__title', start: 'top 85%' }
    });

    gsap.to('#storyLine', {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: tl, start: 'top 70%', end: 'bottom 85%', scrub: .5 }
    });

    $$('.chapter__dot').forEach(function (dot) {
      gsap.to(dot, {
        scale: 1, duration: .6, ease: 'expo.out',
        scrollTrigger: { trigger: dot.parentNode, start: 'top 80%' }
      });
    });

    gsap.fromTo('#quote',
      { scale: .94, opacity: .2 },
      {
        scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '#quote', start: 'top 90%', end: 'center 55%', scrub: .6 }
      });
  }

  /* ============================================================
     13. CTA — scrub + copy to clipboard
     ============================================================ */
  function initCopyEmail() {
    var btn = $('#copyEmail');
    if (btn) {
      var span = $('span', btn);
      var original = span.textContent;
      btn.addEventListener('click', function () {
        var email = btn.dataset.email;
        var finish = function () {
          span.textContent = 'Copied ✓';
          btn.classList.add('is-copied');
          setTimeout(function () { span.textContent = original; btn.classList.remove('is-copied'); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(finish).catch(finish);
        } else {
          var ta = document.createElement('textarea');
          ta.value = email; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          finish();
        }
      });
    }

  }

  function initCTA() {
    var section = $('#contact');
    if (!section || !hasGSAP || REDUCED) return;

    var title = $('[data-words-rise]');
    if (title) {
      var words = splitWords(title);
      gsap.set(words, { opacity: 0, yPercent: 60 });
      gsap.to(words, {
        opacity: 1, yPercent: 0, duration: 1, ease: 'expo.out', stagger: .06,
        scrollTrigger: { trigger: section, start: 'top 40%' }
      });
    }

    gsap.from('.cta__content .lead, .cta__mail, .cta__links, .cta__note', {
      opacity: 0, y: 24, duration: .9, ease: 'expo.out', stagger: .08,
      scrollTrigger: { trigger: section, start: 'top 30%' }
    });

    scrubVideo($('#videoLead'), section);
  }

  /* ============================================================
     15. FOOTER — live clock + wordmark
     ============================================================ */
  function initFooter() {
    var clock = $('#clock');
    if (clock) {
      var fmt;
      try {
        fmt = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false, timeZone: 'America/Argentina/Buenos_Aires'
        });
      } catch (e) {
        fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      }
      var tick = function () { clock.textContent = fmt.format(new Date()) + ' ART'; };
      tick();
      setInterval(tick, 1000);
    }

    if (!hasGSAP || REDUCED) return;
    gsap.from('.footer__wordmark span', {
      yPercent: 40, opacity: 0, duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: '.footer__wordmark', start: 'top 95%' }
    });
  }

  /* ============================================================
     GENERIC REVEALS
     ============================================================ */
  function initReveals() {
    if (!hasGSAP || REDUCED) return;
    $$('[data-reveal]').forEach(function (el) {
      if (el.closest('.hero')) return;           /* hero handles its own */
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    hasGSAP = !!(window.gsap && window.ScrollTrigger);
    if (hasGSAP) {
      gsap.registerPlugin(ScrollTrigger);
      if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
      root.classList.add('js-ready');
      initLenis();
    }

    /* always-on, framework-free behaviour */
    initHeader();
    initFooter();
    initCopyEmail();
    observeVideos();

    if (!hasGSAP) { root.classList.remove('js-ready'); return; }

    try {
      initReveals();
      initHero();
      initStats();
      initMission();
      initPillars();
      initStory();
      initCTA();          /* created after the pin, in document order */
      initCursor();
      initProgressRail();

      initPreloader(function () { ScrollTrigger.refresh(); });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      }
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    } catch (err) {
      /* never leave the page hidden because animation failed */
      root.classList.remove('js-ready');
      var pre = $('#preloader');
      if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
      if (window.console) console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
