(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  /* ---- mobile menu ---- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---- reveal on scroll ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- animated counters ---- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || '', start = null, dur = 1200;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.dataset.count + (c.dataset.suffix || ''); });
  }

  /* ---- trang chủ: thanh tab chỉ hiện khi bắt đầu cuộn ---- */
  if (document.body.classList.contains('page-home')) {
    var updateTop = function () { document.body.classList.toggle('at-top', window.scrollY < 40); };
    updateTop();
    window.addEventListener('scroll', updateTop, { passive: true });
  }

  /* ---- hero slider: hình "bung" tròn từ nút bấm + chữ bung từng ký tự; tự chuyển, bấm mũi tên hoặc chấm ---- */
  (function () {
    var hero = document.querySelector('.hero-slider');
    if (!hero) return;
    var slides = [].slice.call(hero.querySelectorAll('.hs-slide'));
    if (slides.length < 2) return;
    var stage = hero.querySelector('.hero-stage');
    var dots = [].slice.call(hero.querySelectorAll('.hs-dot'));
    var idx = 0, busy = false, timer = null, heroVisible = true;
    var DUR = 1500, CYCLE = 5000, AUTO_MS = CYCLE - DUR; // tự đổi: nghỉ 0,2 giây sau khi hình trước bung xong
    var reduced = false; // luôn tự chuyển và có hiệu ứng, kể cả khi hệ điều hành bật 'giảm chuyển động'
    var tagEl = hero.querySelector('.hs-tagline');
    var nextBtn = hero.querySelector('.hs-btn[data-dir="1"]');
    var prevBtn = hero.querySelector('.hs-btn[data-dir="-1"]');

    // chữ chủ đề: tách thành từng ký tự để "bung" lần lượt
    function renderTagline(text, animate) {
      if (!tagEl) return;
      tagEl.setAttribute('aria-label', text);
      tagEl.textContent = '';
      Array.from(text).forEach(function (c, i) {
        var sp = document.createElement('span');
        sp.className = animate ? 'ch' : 'ch ch-static';
        sp.setAttribute('aria-hidden', 'true');
        sp.style.setProperty('--i', i);
        sp.textContent = c === ' ' ? '\u00a0' : c;
        tagEl.appendChild(sp);
      });
    }
    renderTagline(slides[0].getAttribute('data-tagline') || '', true);

    function markDot(n) {
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === n);
        if (i === n) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }

    function originOf(el) {
      var s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
      // hình mới luôn bung ra từ chính giữa khung
      return { x: s.width / 2, y: s.height / 2 };
    }

    function schedule() {
      clearTimeout(timer);
      if (reduced || !heroVisible || document.hidden) return;
      timer = setTimeout(function () { goTo((idx + 1) % slides.length, nextBtn); }, AUTO_MS);
    }

    function goTo(next, originEl) {
      if (busy || next === idx) return;
      var from = slides[idx], to = slides[next];
      busy = true;
      clearTimeout(timer);
      markDot(next);

      var done = false, cleanupOld = function () {};
      function finish() {
        if (done) return;
        done = true;
        cleanupOld();
        from.classList.remove('is-active');
        to.classList.remove('is-entering');
        to.classList.add('is-active');
        idx = next;
        busy = false;
        schedule();
      }

      // chữ cũ mờ đi, chữ mới bung ra từng ký tự
      if (tagEl) {
        tagEl.classList.add('is-out');
        setTimeout(function () {
          renderTagline(to.getAttribute('data-tagline') || '', !reduced);
          tagEl.classList.remove('is-out');
        }, reduced ? 0 : 320);
      }

      if (reduced || !to.animate) { finish(); return; }

      // hình cũ nằm phía trên: to dần và mờ dần (1,5 giây) để lộ hình sau bên dưới, rồi biến mất
      to.classList.add('is-entering');
      from.classList.add('is-leaving');
      var anim = from.animate(
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.3)' }],
        { duration: DUR, easing: 'ease-in', fill: 'both' }
      );
      cleanupOld = function () { try { anim.cancel(); } catch (e) {} from.classList.remove('is-leaving'); };
      anim.onfinish = function () { finish(); };
      setTimeout(finish, DUR + 400); // dự phòng
    }
    function step(dir, el) { goTo((idx + dir + slides.length) % slides.length, el); }

    hero.querySelectorAll('.hs-btn').forEach(function (b) {
      b.addEventListener('click', function () { step(+b.getAttribute('data-dir'), b); });
    });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { goTo(+d.getAttribute('data-i'), d); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      var r = hero.getBoundingClientRect();
      if (r.bottom < innerHeight * 0.4 || r.top > innerHeight * 0.6) return;
      step(e.key === 'ArrowRight' ? 1 : -1, e.key === 'ArrowRight' ? nextBtn : prevBtn);
    });
    // vuốt ngang trên điện thoại
    var x0 = null;
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1, dx < 0 ? nextBtn : prevBtn);
    }, { passive: true });

    // tự chuyển khi headline đang trên màn hình; tạm dừng khi cuộn đi hoặc chuyển tab
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        heroVisible = es[0].isIntersecting;
        document.body.classList.toggle('hero-in-view', heroVisible);
        if (heroVisible) schedule(); else clearTimeout(timer);
      }, { threshold: 0.35 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); else schedule(); });
    schedule();
  })();

  // Các khối dưới đây chỉ chạy trên trang chủ (trang Giới thiệu không có dự án / form)
  if (!document.getElementById('projects')) return;

  /* ---- projects (nguồn: xaydungviocons.com.vn) ---- */
  // group: dan-dung | cong-cong · kind: school | road | water | house
  // Thêm ảnh thật: đặt file vào assets/projects/ và thêm  img: 'assets/projects/ten-file.jpg'
  var PROJECTS = [
    { name: 'ECO RETREAT', meta: 'Khu nhà ở liền kề', group: 'dan-dung', kind: 'house', label: 'Dân dụng' },
    { name: 'The Grand Manhattan', meta: 'Công trình dân dụng', group: 'dan-dung', kind: 'house', label: 'Dân dụng' },
    { name: 'Sửa chữa trường THCS Tăng Bạt Hổ', meta: 'Phường Xóm Chiếu, TP. Hồ Chí Minh', group: 'cong-cong', kind: 'school', label: 'Trường học' },
    { name: 'Sửa chữa trường Mầm non 19/5', meta: 'Quận 8, TP. Hồ Chí Minh', group: 'cong-cong', kind: 'school', label: 'Trường học' },
    { name: 'Sửa chữa trường THCS Lý Thánh Tông', meta: 'Quận 8, TP. Hồ Chí Minh', group: 'cong-cong', kind: 'school', label: 'Trường học' },
    { name: 'Sửa chữa trường Tiểu học Mỹ Lộc', meta: 'Cần Giuộc, Long An', group: 'cong-cong', kind: 'school', label: 'Trường học' },
    { name: 'Đường Tỉnh 826C', meta: 'Đông Thạnh, Cần Giuộc', group: 'cong-cong', kind: 'road', label: 'Hạ tầng' },
    { name: 'Đường Tân Quý – Tân Đại', meta: 'Tân Tập, Cần Giuộc', group: 'cong-cong', kind: 'road', label: 'Hạ tầng' },
    { name: 'Rạch Bảo Định', meta: 'Mỹ Tho, Tiền Giang', group: 'cong-cong', kind: 'water', label: 'Hạ tầng' },
    { name: 'Kè Tân Thành', meta: 'Gò Công Đông, Tiền Giang', group: 'cong-cong', kind: 'water', label: 'Hạ tầng' }
  ];
  // ảnh thật của từng dự án (cùng thứ tự với PROJECTS)
  ['eco-retreat', 'grand-manhattan', 'tang-bat-ho', 'mam-non-19-5', 'ly-thanh-tong', 'my-loc', 'duong-826c', 'tan-quy-tan-dai', 'rach-bao-dinh', 'ke-tan-thanh']
    .forEach(function (f, i) { PROJECTS[i].img = 'assets/projects/' + f + '.png'; });
  var TONES ={ house: '#3f7a3a', school: '#c9722a', road: '#4a4f55', water: '#2f6a86' };

  // line-art thumbnail by project kind (illustration only, until real photos are added)
  function art(p, i) {
    var s = '';
    if (p.kind === 'school') {
      s = '<rect x="90" y="130" width="220" height="140" fill="#f3f1ec"/>' +
          '<path d="M80 130 L200 80 L320 130Z" fill="#1b1b1b"/>' +
          '<rect x="190" y="215" width="20" height="55" fill="#1b1b1b"/>';
      for (var c = 0; c < 4; c++) s += '<rect x="' + (108 + c * 52) + '" y="' + (150 + 0) + '" width="30" height="34" fill="#fff" opacity=".85"/>';
      s += '<path d="M330 270V150M330 150h34v22h-34" fill="#fff" stroke="#fff" stroke-width="3"/>';
    } else if (p.kind === 'road') {
      s = '<path d="M150 150 L250 150 L400 300 L0 300Z" fill="#26282b"/>' +
          '<path d="M200 150 L200 300" stroke="#fff" stroke-width="4" stroke-dasharray="14 14" opacity=".8"/>' +
          '<path d="M0 150H400" stroke="#fff" stroke-width="2" opacity=".25"/>';
    } else if (p.kind === 'water') {
      s = '<path d="M0 190 H400 V300 H0Z" fill="#1d4f66"/>';
      for (var w = 0; w < 4; w++) s += '<path d="M' + (-20 + w * 6) + ' ' + (215 + w * 20) + ' q 25 -12 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" fill="none" stroke="#fff" stroke-width="2.4" opacity=".5"/>';
      s += '<path d="M0 190 L60 160 H400 V190Z" fill="#f3f1ec"/><path d="M60 160 H400" stroke="#1b1b1b" stroke-width="6"/>';
    } else {
      var floors = 3 + (i % 2), w2 = 150 + (i % 2) * 40, x = (400 - w2) / 2, fh = 44, base = 270, top = base - floors * fh;
      s = '<rect x="' + x + '" y="' + top + '" width="' + w2 + '" height="' + (floors * fh) + '" fill="#f3f1ec"/>';
      for (var f = 0; f < floors; f++) for (var k = 0; k < 3; k++) {
        s += '<rect x="' + (x + 18 + k * ((w2 - 36) / 3)) + '" y="' + (top + f * fh + 11) + '" width="' + ((w2 - 36) / 3 - 12) + '" height="' + (fh - 22) + '" fill="#fff" opacity=".85"/>';
      }
      s += '<rect x="' + (x - 8) + '" y="' + (top - 10) + '" width="' + (w2 + 16) + '" height="10" fill="#1b1b1b"/>' +
           '<rect x="190" y="' + (base - 30) + '" width="20" height="30" fill="#1b1b1b"/>';
    }
    return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="400" height="300" fill="' + TONES[p.kind] + '"/>' +
      '<circle cx="' + (320 - i * 6) + '" cy="64" r="28" fill="#fff" opacity=".18"/>' +
      (p.kind === 'road' || p.kind === 'water' ? '' : '<rect y="270" width="400" height="30" fill="#111" opacity=".25"/>') +
      s + '</svg>';
  }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var grid = document.getElementById('projects');
  var ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/></svg>';
  var TYPE = { 'dan-dung': 'Công trình dân dụng', 'cong-cong': 'Công trình công cộng' };
  grid.innerHTML = PROJECTS.map(function (p, i) {
    var bg = p.img ? "background-image:url('" + esc(p.img) + "')" : 'background:' + TONES[p.kind];
    return '<article class="pj-card" data-cat="' + p.group + '" data-i="' + i + '" tabindex="0" role="button" aria-label="Xem ảnh ' + esc(p.name) + '">' +
      '<div class="pj-img" style="' + bg + '"></div>' +
      '<span class="pj-zoom">' + ZOOM + '</span>' +
      '<div class="pj-head"><span class="pj-num">' + (i < 9 ? '0' : '') + (i + 1) + '</span><h3 class="pj-name">' + esc(p.name) + '</h3>' +
      '<p class="pj-meta">' + esc(p.meta) + '</p></div>' +
      '<span class="pj-type">' + TYPE[p.group] + '</span></article>';
  }).join('');

  var filters = document.getElementById('filters');
  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    filters.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === btn); });
    var f = btn.dataset.filter;
    grid.querySelectorAll('.pj-card').forEach(function (el) {
      el.classList.toggle('hide', f !== 'all' && el.dataset.cat !== f);
    });
    grid.scrollTo({ left: 0 });
  });

  // PREV / NEXT: cuộn từng thẻ
  function pjStep(dir) {
    var card = grid.querySelector('.pj-card:not(.hide)');
    var w = card ? card.getBoundingClientRect().width : grid.clientWidth / 4;
    grid.scrollBy({ left: dir * w, behavior: 'smooth' });
  }
  document.querySelector('.pj-prev').addEventListener('click', function () { pjStep(-1); });
  document.querySelector('.pj-next').addEventListener('click', function () { pjStep(1); });

  // bấm vào dự án: phóng to ảnh
  var lb = document.createElement('div');
  lb.className = 'pj-lightbox'; lb.hidden = true;
  lb.innerHTML = '<button type="button" class="pj-close" aria-label="Đóng">×</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(lb);
  function openLb(i) {
    var p = PROJECTS[i];
    var img = lb.querySelector('img');
    if (p.img) { img.src = p.img; img.hidden = false; } else { img.removeAttribute('src'); img.hidden = true; }
    img.alt = p.name;
    lb.querySelector('figcaption').innerHTML = '<b>' + esc(p.name) + '</b><span>' + esc(p.meta) + '</span>';
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('open');
    setTimeout(function () { lb.hidden = true; }, 250);
    document.body.style.overflow = '';
  }
  grid.addEventListener('click', function (e) { var c = e.target.closest('.pj-card'); if (c) openLb(+c.dataset.i); });
  grid.addEventListener('keydown', function (e) {
    var c = e.target.closest('.pj-card');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLb(+c.dataset.i); }
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.pj-close')) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ---- dự toán chi phí ---- */
  // ĐƠN GIÁ THAM KHẢO (VNĐ / m² sàn xây dựng) — chỉnh tại đây cho đúng đơn giá thực tế của VIOCONS.
  var RATES = {
    'new': {
      name: 'Xây mới từ móng',
      items: [['Chi phí thiết kế', 250000], ['Thi công phần thô', 3500000], ['Hoàn thiện', 3000000]]
    },
    'renovate': {
      name: 'Cải tạo thô & hoàn thiện nội thất',
      items: [['Chi phí thiết kế', 200000], ['Cải tạo phần thô', 2200000], ['Hoàn thiện & nội thất', 4000000]]
    },
    'interior': {
      name: 'Chỉ hoàn thiện nội thất',
      items: [['Thiết kế nội thất', 250000], ['Hoàn thiện nội thất', 3500000]]
    }
  };
  var RANGE_LOW = 0.92, RANGE_HIGH = 1.08;

  var estForm = document.getElementById('estForm');
  var estArea = document.getElementById('estArea');
  var estValue = document.getElementById('estValue');
  var estRange = document.getElementById('estRange');
  var estRows = document.getElementById('estRows');
  var estMsg = document.getElementById('estMsg');
  var lastEstimate = null;

  function vnd(n) { return Math.round(n / 100000) * 100000; }
  function fmt(n) { return vnd(n).toLocaleString('vi-VN'); }

  function estimate() {
    var area = +estArea.value || 0;
    var pack = RATES[estForm.querySelector('input[name="pack"]:checked').value];
    if (area < 20) {
      lastEstimate = null;
      estValue.textContent = '—';
      estRange.textContent = 'Nhập diện tích từ 20 m² trở lên để xem dự toán.';
      estRows.innerHTML = '';
      return;
    }
    var total = 0, rows = '';
    pack.items.forEach(function (it) {
      var v = it[1] * area; total += v;
      rows += '<div><dt>' + it[0] + '</dt><dd>' + fmt(v) + ' VNĐ</dd></div>';
    });
    estValue.innerHTML = fmt(total) + '<small>VNĐ</small>';
    estRange.textContent = 'Khoảng ' + fmt(total * RANGE_LOW) + ' – ' + fmt(total * RANGE_HIGH) + ' VNĐ · ' + area + ' m²';
    estRows.innerHTML = rows;
    lastEstimate = { pack: pack.name, area: area, total: total };
  }
  estForm.addEventListener('input', estimate);
  estForm.addEventListener('change', estimate);
  estimate();

  estForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var phone = document.getElementById('estPhone').value.trim();
    var phoneField = document.getElementById('estPhone').closest('.field');
    phoneField.classList.remove('invalid');
    if (!lastEstimate || !/^[0-9+\s().-]{8,15}$/.test(phone)) {
      if (!/^[0-9+\s().-]{8,15}$/.test(phone)) phoneField.classList.add('invalid');
      estMsg.className = 'form-msg err';
      estMsg.textContent = !lastEstimate ? 'Vui lòng nhập diện tích hợp lệ (từ 20 m²).' : 'Vui lòng nhập số điện thoại hợp lệ.';
      return;
    }
    var body = 'ĐĂNG KÝ DỰ TOÁN\nTỉnh/thành phố: ' + document.getElementById('estProvince').value +
      '\nHạng mục: ' + lastEstimate.pack + '\nDiện tích: ' + lastEstimate.area + ' m²' +
      '\nDự toán sơ bộ: ' + fmt(lastEstimate.total) + ' VNĐ\nSĐT: ' + phone;
    estMsg.className = 'form-msg';
    estMsg.textContent = 'Ứng dụng email sẽ mở để gửi đăng ký — hoặc gọi hotline 0979.001.455 để được hỗ trợ ngay.';
    window.location.href = 'mailto:xaydungviocons@gmail.com?subject=' + encodeURIComponent('Đăng ký dự toán - ' + phone) + '&body=' + encodeURIComponent(body);
  });

  /* ---- contact form (site tĩnh: mở ứng dụng mail với nội dung điền sẵn) ---- */
  var form = document.getElementById('contactForm');
  var msg = document.getElementById('formMsg');
  var TO = 'xaydungviocons@gmail.com';
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var name = (d.get('name') || '').trim(), phone = (d.get('phone') || '').trim();
    form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('invalid'); });
    var bad = [];
    if (!name) bad.push('name');
    if (!/^[0-9+\s().-]{8,15}$/.test(phone)) bad.push('phone');
    if (bad.length) {
      bad.forEach(function (n) { form.querySelector('[name="' + n + '"]').closest('.field').classList.add('invalid'); });
      msg.className = 'form-msg err';
      msg.textContent = 'Vui lòng nhập họ tên và số điện thoại hợp lệ.';
      return;
    }
    var body = 'Họ tên: ' + name + '\nSĐT: ' + phone + '\nNhu cầu: ' + d.get('need') + '\nNội dung: ' + (d.get('note') || '—');
    msg.className = 'form-msg';
    msg.textContent = 'Cảm ơn bạn! Ứng dụng email sẽ mở để gửi yêu cầu — hoặc gọi hotline 0979.001.455 để được hỗ trợ ngay.';
    window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent('Yêu cầu tư vấn từ ' + name) + '&body=' + encodeURIComponent(body);
  });
})();
