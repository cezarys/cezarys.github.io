(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- small helpers ---------- */
  document.querySelectorAll('.year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- scroll progress ---------- */
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  /* ---------- cursor ---------- */
  var cursor = document.querySelector('.cursor');
  var mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  if (finePointer) {
    var dotX = gsap.quickTo('.cursor-dot', 'x', { duration: .1 });
    var dotY = gsap.quickTo('.cursor-dot', 'y', { duration: .1 });
    var ringX = gsap.quickTo('.cursor-ring', 'x', { duration: .45, ease: 'power3' });
    var ringY = gsap.quickTo('.cursor-ring', 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
    });
    document.querySelectorAll('a, button, .card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
    });
  }

  /* ---------- magnetic ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      var yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .35);
        yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- hero canvas: interactive dot field ---------- */
  (function dotField() {
    var canvas = document.querySelector('.hero-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, dots = [], gap = 34, visible = true;
    var local = { x: -9999, y: -9999 };

    function build() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = w < 600 ? 26 : 34;
      dots = [];
      for (var y = gap / 2; y < h; y += gap) {
        for (var x = gap / 2; x < w; x += gap) dots.push({ ox: x, oy: y, x: x, y: y });
      }
    }

    canvas.parentElement.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      local.x = e.clientX - r.left; local.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('mouseleave', function () { local.x = local.y = -9999; });

    ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: function (s) { visible = s.isActive; } });

    var t = 0;
    function draw() {
      if (visible) {
        t += reduced ? 0 : .012;
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < dots.length; i++) {
          var d = dots[i];
          var wave = Math.sin(d.ox * .008 + t) * Math.cos(d.oy * .01 + t * .8);
          var dx = d.ox - local.x, dy = d.oy - local.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var force = Math.max(0, 1 - dist / 170);
          var tx = d.ox + (dist ? dx / dist : 0) * force * 46;
          var ty = d.oy + (dist ? dy / dist : 0) * force * 46 + wave * 6;
          d.x += (tx - d.x) * .12;
          d.y += (ty - d.y) * .12;
          var a = .12 + (wave + 1) * .08 + force * .7;
          ctx.fillStyle = force > .05 ? 'rgba(212,255,58,' + a + ')' : 'rgba(242,239,233,' + a + ')';
          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.2 + force * 2.4, 0, 6.283);
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    }

    build();
    draw();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
  })();

  /* ---------- text splits ---------- */
  var heroSplit = new SplitText('.hero-title .split', { type: 'chars', charsClass: 'char' });
  var statementSplit = new SplitText('.statement-text', { type: 'words', wordsClass: 'word' });
  var headingSplits = [];
  document.querySelectorAll('.split-words').forEach(function (el) {
    headingSplits.push(new SplitText(el, { type: 'lines,words', linesClass: 'line', wordsClass: 'word' }));
  });

  /* ---------- preloader → hero intro ---------- */
  function heroIntro() {
    var tl = gsap.timeline();
    tl.from(heroSplit.chars, { yPercent: 115, rotate: 12, duration: 1.2, ease: 'expo.out', stagger: .045 })
      .from('.hero-badge', { scale: 0, rotate: -90, duration: .9, ease: 'back.out(2)' }, '-=.7')
      .from('.hero-eyebrow', { y: 20, opacity: 0, duration: .8, ease: 'power3.out' }, '-=.9')
      .from('.hero-scroll', { y: 30, opacity: 0, duration: .9, ease: 'power3.out' }, '-=.7')
      // slide only (no fade): the lead is the LCP element and must count as painted under the loader
      .from('.hero-lead', { y: 40, duration: 1, ease: 'power3.out' }, '<')
      .from('.nav > *', { y: -30, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08 }, '-=.9')
      .from('.hero-canvas', { opacity: 0, duration: 1.4 }, '-=1.2');
    return tl;
  }

  function finishLoading() {
    document.body.classList.remove('is-loading');
    ScrollTrigger.refresh();
  }

  if (reduced) {
    document.querySelector('.loader').remove();
    finishLoading();
  } else {
    var counter = { v: 0 };
    var slots = document.querySelectorAll('.loader-num i');
    gsap.timeline({ onComplete: finishLoading })
      .to(counter, {
        v: 100, duration: 1.1, ease: 'power2.inOut',
        onUpdate: function () {
          var d = String(Math.round(counter.v)).padStart(3, ' ');
          for (var i = 0; i < 3; i++) slots[i].textContent = d[i] === ' ' ? '' : d[i];
        }
      })
      .to('.loader-bar i', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
      .to('.loader-count, .loader-name', { yPercent: -40, opacity: 0, duration: .5, ease: 'power2.in' })
      .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=.15')
      .add(heroIntro(), '-=.55')
      .set('.loader', { display: 'none' });
  }

  if (reduced) return; // everything below is motion-only

  /* ---------- hero exit on scroll ---------- */
  gsap.to('.hero-title', {
    yPercent: -30, scale: .92, opacity: .15, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero-badge', { rotate: 200, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- velocity marquee ---------- */
  document.querySelectorAll('.marquee-track').forEach(function (track, i) {
    var row = track.querySelector('.marquee-row');
    for (var c = 0; c < 3; c++) track.appendChild(row.cloneNode(true));
    var dir = i === 0 ? -1 : 1;
    var tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -25 }, { xPercent: dir < 0 ? -25 : 0, duration: 22, ease: 'none', repeat: -1 });
    var skewTo = gsap.quickTo(track, 'skewX', { duration: .4, ease: 'power3' });
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var v = self.getVelocity();
        gsap.to(tween, { timeScale: 1 + Math.min(Math.abs(v) / 300, 6), duration: .3, overwrite: true });
        skewTo(gsap.utils.clamp(-12, 12, v / -120));
        clearTimeout(track._t);
        track._t = setTimeout(function () { gsap.to(tween, { timeScale: 1, duration: .8 }); skewTo(0); }, 140);
      }
    });
  });

  /* ---------- statement words light up ---------- */
  gsap.to(statementSplit.words, {
    opacity: 1, stagger: .1, ease: 'none',
    scrollTrigger: { trigger: '.statement', start: 'top 75%', end: 'bottom 55%', scrub: true }
  });

  /* ---------- headings ---------- */
  headingSplits.forEach(function (s) {
    gsap.from(s.words, {
      yPercent: 110, rotate: 6, duration: 1, ease: 'expo.out', stagger: .06,
      scrollTrigger: { trigger: s.elements[0], start: 'top 85%' }
    });
  });

  document.querySelectorAll('.eyebrow').forEach(function (el) {
    if (el.closest('.hero')) return;
    gsap.from(el, { x: -30, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- stats counters ---------- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = +el.dataset.count, o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString('en-US'); }
    });
  });
  gsap.from('.stat', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

  /* ---------- services: horizontal pin on desktop ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function () {
    var track = document.querySelector('.services-track');
    var dist = function () { return track.scrollWidth - innerWidth; };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: '.services-pin', start: 'center center', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true }
    });
  });
  mm.add('(max-width: 900px)', function () {
    gsap.utils.toArray('.card').forEach(function (c) {
      gsap.from(c, { y: 60, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 90%' } });
    });
  });

  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      gsap.to(card, { rotateY: ((e.clientX - r.left) / r.width - .5) * 8, rotateX: -((e.clientY - r.top) / r.height - .5) * 8, transformPerspective: 900, duration: .5, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', function () { gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,.5)' }); });
  });

  gsap.from('.card-icon svg > *', {
    drawSVG: 0, duration: 1.4, ease: 'power2.inOut', stagger: .05,
    scrollTrigger: { trigger: '.services-track', start: 'top 80%' }
  });

  /* ---------- process line ---------- */
  gsap.from('.process-line path', {
    drawSVG: 0, ease: 'none',
    scrollTrigger: { trigger: '.process-wrap', start: 'top 70%', end: 'bottom 60%', scrub: true }
  });
  gsap.utils.toArray('.process-steps li').forEach(function (li) {
    gsap.from(li.children, { y: 40, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: li, start: 'top 82%' } });
  });

  /* ---------- work list + floating preview ---------- */
  gsap.from('.work-item', { y: 50, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.work-list', start: 'top 85%' } });

  if (finePointer) {
    var preview = document.querySelector('.work-preview');
    var pX = gsap.quickTo(preview, 'x', { duration: .6, ease: 'power3' });
    var pY = gsap.quickTo(preview, 'y', { duration: .6, ease: 'power3' });
    var pRot = gsap.quickTo(preview, 'rotation', { duration: .6, ease: 'power3' });
    document.querySelectorAll('.work-item').forEach(function (a) { new Image().src = a.dataset.img; });
    var lastX = 0;
    window.addEventListener('mousemove', function (e) { pX(e.clientX); pY(e.clientY); pRot(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * .6)); lastX = e.clientX; });

    document.querySelectorAll('.work-item').forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        preview.querySelector('img').src = item.dataset.img;
        gsap.to(preview, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out' });
        gsap.fromTo(preview.querySelector('img'), { scale: 1.25 }, { scale: 1, duration: .9, ease: 'expo.out' });
        cursor.classList.add('is-view');
      });
      item.addEventListener('mouseleave', function () {
        gsap.to(preview, { opacity: 0, scale: .6, duration: .4, ease: 'power3.in' });
        cursor.classList.remove('is-view');
      });
    });
  }

  /* ---------- reviews: stacked cards shrink as the next one arrives ---------- */
  var reviews = gsap.utils.toArray('.review');
  reviews.forEach(function (card, i) {
    gsap.from(card.querySelector('blockquote'), { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 75%' } });
    if (i === reviews.length - 1) return;
    gsap.to(card, {
      scale: .9 - (reviews.length - i) * .01, filter: 'brightness(.55)', ease: 'none',
      scrollTrigger: { trigger: reviews[i + 1], start: 'top bottom', end: 'top 14%', scrub: true }
    });
  });

  /* ---------- about ---------- */
  ScrollTrigger.create({
    trigger: '.timeline', start: 'top 75%', end: 'bottom 60%', scrub: true,
    onUpdate: function (s) { document.querySelector('.timeline').style.setProperty('--p', s.progress.toFixed(3)); }
  });
  gsap.utils.toArray('.timeline li').forEach(function (li) {
    gsap.from(li, { x: 40, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 85%' } });
  });
  gsap.from('.badges li', { scale: .6, opacity: 0, duration: .6, ease: 'back.out(2)', stagger: .08, scrollTrigger: { trigger: '.badges', start: 'top 90%' } });

  /* ---------- contact ---------- */
  gsap.utils.toArray('.ct-line').forEach(function (line, i) {
    gsap.fromTo(line, { xPercent: i % 2 ? 30 : -30 }, {
      xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center center', scrub: true }
    });
  });
  gsap.to('.ct-outline', {
    color: '#d4ff3a', ease: 'none',
    scrollTrigger: { trigger: '.contact-title', start: 'top 60%', end: 'bottom 50%', scrub: true }
  });
  gsap.from('.contact-actions > *', { y: 40, opacity: 0, duration: .9, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '.contact-actions', start: 'top 92%' } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
