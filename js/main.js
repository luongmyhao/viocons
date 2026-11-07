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
  var TONES = { house: '#3f7a3a', school: '#c9722a', road: '#4a4f55', water: '#2f6a86' };

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
  grid.innerHTML = PROJECTS.map(function (p, i) {
    var media = p.img
      ? '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">'
      : art(p, i);
    return '<article class="project reveal in" data-cat="' + p.group + '">' +
      '<div class="thumb">' + media + '<span class="tag">' + esc(p.label) + '</span></div>' +
      '<h3>' + esc(p.name) + '</h3><p>' + esc(p.meta) + '</p></article>';
  }).join('');

  var filters = document.getElementById('filters');
  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    filters.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('active', c === btn); });
    var f = btn.dataset.filter;
    grid.querySelectorAll('.project').forEach(function (el) {
      el.classList.toggle('hide', f !== 'all' && el.dataset.cat !== f);
    });
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
