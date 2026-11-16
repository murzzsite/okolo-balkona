const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/GLNTZGRGEZ';
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const safe = fn => { try { fn(); } catch (e) { console.error(e); } };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  const fmtT = n => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0') + '°';
  const fmtR = n => 'от ' + Math.round(n).toLocaleString('ru-RU').replace(/[\s ]/g, ' ') + ' ₽';

  /* sticky bar */
  safe(() => {
    const bar = $('#bar');
    const f = () => bar.classList.toggle('show', scrollY > 60);
    addEventListener('scroll', f, { passive: true }); f();
  });

  /* heading masks: words rise out of a mask */
  safe(() => {
    const hs = $$('[data-mask]');
    hs.forEach(h => {
      const words = h.textContent.trim().split(/\s+/);
      h.setAttribute('aria-label', words.join(' '));
      h.innerHTML = words.map((w, i) => `<span class="mw" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
    });
    if (reduce || !('IntersectionObserver' in window)) { hs.forEach(h => h.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    hs.forEach(h => io.observe(h));
  });

  /* hero: three states of the balcony */
  safe(() => {
    const view = $('#view'), tv = $('#tv'), cap = $('#cap');
    const T = [-9, 3, 20];
    const C = [
      'Холодный балкон: иней на стекле, сквозняк, зимой там не посидеть.',
      'После остекления: ветра и снега нет, но стены и пол всё ещё холодные.',
      'После утепления и отделки: стекло чистое, на балконе можно сидеть с кофе.'
    ];
    let shown = T[0], raf;
    const tween = to => {
      cancelAnimationFrame(raf);
      const from = shown, t0 = performance.now();
      const step = t => {
        const p = clamp((t - t0) / (reduce ? 1 : 900));
        shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
        tv.textContent = fmtT(Math.round(shown));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    $$('[data-s]', $('.hero__ctl')).forEach(b => b.addEventListener('click', () => {
      const s = +b.dataset.s;
      view.dataset.s = s; cap.textContent = C[s]; tween(T[s]);
    }));
  });

  /* marquee: speed follows scroll velocity */
  safe(() => {
    const tr = $('#run'); if (!tr || reduce) return;
    let x = 24, last = scrollY, v = 0;
    const loop = () => {
      const dy = scrollY - last; last = scrollY;
      v += (Math.abs(dy) - v) * 0.08;
      x -= 0.7 + v * 0.35;
      const half = tr.scrollWidth / 2;
      if (-x >= half) x += half;
      tr.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  /* manifest: words light up with scroll */
  safe(() => {
    const el = $('#mf'), sec = $('#manifest');
    if (!el || reduce) return;
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map(w => `<span class="mf-w" aria-hidden="true">${w}</span>`).join(' ');
    const ws = $$('.mf-w', el);
    const f = () => {
      const r = sec.getBoundingClientRect(), vh = innerHeight;
      const p = clamp((vh * 0.8 - r.top) / (r.height * 0.55));
      const n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle('lit', i < n));
    };
    addEventListener('scroll', f, { passive: true }); addEventListener('resize', f); f();
  });

  /* pictures drift slowly with scroll */
  safe(() => {
    const imgs = $$('.pic img, .band img'); if (!imgs.length || reduce) return;
    const f = () => imgs.forEach(im => {
      const r = im.parentElement.getBoundingClientRect(), vh = innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const t = (r.top + r.height / 2 - vh / 2) / vh;
      im.style.transform = `translate3d(0,${(-t * 36).toFixed(1)}px,0) scale(1.14)`;
    });
    addEventListener('scroll', f, { passive: true }); f();
  });

  /* stairs grow in */
  safe(() => {
    const st = $('.stairs'); if (!st) return;
    if (reduce || !('IntersectionObserver' in window)) { st.classList.add('in'); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { st.classList.add('in'); io.disconnect(); } }), { threshold: .35 });
    io.observe(st);
  });

  /* layers: 3D wall pie, scroll drives layers, temperature and the colour of the page */
  safe(() => {
    const sec = $('#layers'), rig = $('#rig'), stage = $('.layers__stage'), scene = $('#scene');
    const steps = $$('.step', sec), thv = $('#thv'), thf = $('#thf');
    const COLD = [220, 233, 240], WARM = [253, 229, 214];
    const shade = (hex, f) => '#' + [1, 3, 5].map(i => Math.round(clamp(parseInt(hex.substr(i, 2), 16) * f, 0, 255)).toString(16).padStart(2, '0')).join('');
    const box = (w, h, d, color, tex) => {
      const b = document.createElement('div'); b.className = 'bx';
      const f = (cls, ww, hh, tf, c, bg) => {
        const e = document.createElement('div');
        e.style.cssText = `width:${ww}px;height:${hh}px;margin:${-hh / 2}px 0 0 ${-ww / 2}px;background:${bg || c};transform:${tf}`;
        b.appendChild(e);
      };
      f('f', w, h, `translateZ(${d / 2}px)`, shade(color, .93));
      f('k', w, h, `rotateY(180deg) translateZ(${d / 2}px)`, shade(color, .8));
      f('r', d, h, `rotateY(90deg) translateZ(${w / 2}px)`, color, tex);
      f('l', d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, color, tex);
      f('t', w, d, `rotateX(90deg) translateZ(${h / 2}px)`, shade(color, 1.07));
      f('b', w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, shade(color, .75));
      return b;
    };
    const H = 300, D = 300;
    const L = [
      { w: 64, parts: [{ z: 0, d: D, c: '#aab8c2' }] },
      { w: 46, parts: [{ z: 0, d: D, c: '#f5cf72' }] },
      { w: 5, parts: [{ z: 0, d: D, c: '#dfe8ee' }] },
      { w: 16, parts: [-111, -37, 37, 111].map(z => ({ z, d: 26, c: '#c79a68' })) },
      { w: 14, parts: [-125, -75, -25, 25, 75, 125].map(z => ({ z, d: 47, c: '#fffaf2' })) }
    ];
    L.forEach(l => {
      l.el = document.createElement('div'); l.el.className = 'bx';
      l.parts.forEach(p => { const b = box(l.w, H, p.d, p.c, p.tex); b.style.transform = `translate3d(0,0,${p.z}px)`; l.el.appendChild(b); });
      rig.appendChild(l.el);
    });
    let mx = 0, my = 0, tx = 0, ty = 0;
    if (!reduce && matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
    let P = reduce ? 1 : 0, cur = -1;
    const draw = () => {
      mx += (tx - mx) * .06; my += (ty - my) * .06;
      const gap = 8 + 84 * (1 - ease(clamp((P - .8) / .2)));
      const total = L.reduce((s, l) => s + l.w, 0) + gap * (L.length - 1);
      let x = -total / 2;
      L.forEach((l, i) => {
        const q = i === 0 ? 1 : clamp((P * 5 - i) / .6);
        const off = (1 - ease(q)) * 560;
        l.el.style.transform = `translate3d(${x + l.w / 2 + off}px,0,0)`;
        l.el.style.opacity = i === 0 ? 1 : Math.min(1, q * 3);
        x += l.w + gap;
      });
      const sc = Math.min(1, stage.clientWidth / 640, stage.clientHeight / 460) * (innerWidth < 900 ? 1.05 : 1);
      rig.style.transform = `scale(${sc}) rotateX(${-14 + my * -8}deg) rotateY(${-54 + P * 16 + mx * 12}deg)`;
    };
    const apply = () => {
      const e = ease(P);
      const c = COLD.map((v, i) => Math.round(v + (WARM[i] - v) * e));
      root.style.setProperty('--field', `rgb(${c})`);
      const t = Math.round(-12 + 33 * e);
      thv.textContent = fmtT(t); thf.style.height = (8 + 92 * e) + '%';
      const idx = clamp(Math.floor(P * 5), 0, 4);
      if (idx !== cur) { cur = idx; steps.forEach((s, i) => s.classList.toggle('on', i === idx)); }
      draw();
    };
    const onScroll = () => {
      if (reduce) return;
      const r = sec.getBoundingClientRect();
      P = clamp(-r.top / (r.height - innerHeight));
      apply();
    };
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
    onScroll(); apply();
    if (!reduce) { const loop = () => { draw(); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  });

  /* calculator */
  safe(() => {
    const g = $('#oGlass'), f = $('#oFinish'), w = $('#oWin'), sum = $('#sum'), txt = $('#sumTxt');
    let shown = 110000, raf;
    const tween = to => {
      cancelAnimationFrame(raf);
      const from = shown, t0 = performance.now();
      const step = t => {
        const p = clamp((t - t0) / (reduce ? 1 : 500));
        shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
        sum.textContent = fmtR(shown);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const upd = () => {
      const v = (g.checked ? 60000 : 0) + (f.checked ? 50000 : 0);
      const parts = [g.checked && 'остекление', f.checked && 'утепление и отделка', w.checked && 'окна в квартире'].filter(Boolean);
      if (v) { tween(v); txt.textContent = 'Ваш проект: ' + parts.join(', ') + '. ' + (w.checked ? 'Окна считаем по замеру отдельно. ' : '') + 'Это цена «от»: точную называем после замера.'; }
      else { shown = 0; sum.textContent = w.checked ? 'по замеру' : 'выберите работы'; txt.textContent = w.checked ? 'Окна в квартире: цену называем после замера.' : 'Отметьте, что нужно сделать.'; }
    };
    [g, f, w].forEach(c => c.addEventListener('change', upd));
  });

  /* phone mask */
  safe(() => {
    const input = $('input[name="phone"]'); if (!input) return;
    input.addEventListener('input', e => {
      const raw = e.target.value;
      if (/[a-zA-Zа-яА-Я@_]/.test(raw)) return;
      let v = raw.replace(/\D/g, '');
      if (!v) { e.target.value = ''; return; }
      if (v[0] === '8') v = '7' + v.slice(1);
      if (v[0] !== '7') v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });

  /* form */
  const form = $('#leadForm');
  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]'), orig = btn.textContent;
    const payload = {}; new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { btn.textContent = 'Заполните имя и контакт'; setTimeout(() => btn.textContent = orig, 2500); return; }
    const kind = ($('[data-kind].is-active', form) || {}).dataset.kind || 'Балкон';
    const what = [$('#oGlass').checked && 'остекление', $('#oFinish').checked && 'утепление и отделка', $('#oWin').checked && 'окна в квартире'].filter(Boolean).join(', ') || 'не выбрано';
    payload.comment = `Тип: ${kind}. Нужно: ${what}. Расчёт на сайте: ${$('#sum').textContent}`;
    btn.disabled = true; btn.textContent = 'Отправляем...';
    try {
      const r = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      btn.textContent = 'Заявка отправлена'; form.reset();
    } catch (err) { console.error(err); btn.textContent = 'Ошибка, попробуйте ещё раз'; }
    finally { setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000); }
  });
})();
