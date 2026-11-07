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
    var target = +el.dataset.count, suffix = el.dataset.suffix || '', start = null, dur = 1400;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
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

  /* ---- projects ---- */
  // Dự án mẫu — thay bằng dự án thật (ảnh đặt trong assets/projects/)
  var PROJECTS = [
    { name: 'Nhà phố 4 tầng hiện đại', meta: '5 × 20 m · 4 tầng · 2024', cat: 'nha-pho', label: 'Nhà phố', tone: '#3f7a3a' },
    { name: 'Biệt thự sân vườn', meta: '280 m² · 3 tầng · 2024', cat: 'biet-thu', label: 'Biệt thự', tone: '#2f5d4f' },
    { name: 'Căn hộ phong cách tối giản', meta: '95 m² · Nội thất trọn gói', cat: 'noi-that', label: 'Nội thất', tone: '#b9692a' },
    { name: 'Cải tạo nhà ống cũ', meta: '4 × 16 m · Nâng tầng', cat: 'cai-tao', label: 'Cải tạo', tone: '#555a60' },
    { name: 'Nhà phố 3 tầng mặt tiền kính', meta: '6 × 18 m · 3 tầng · 2023', cat: 'nha-pho', label: 'Nhà phố', tone: '#d08a32' },
    { name: 'Biệt thự mái thái', meta: '350 m² · 2 tầng · 2023', cat: 'biet-thu', label: 'Biệt thự', tone: '#4b6a8a' }
  ];

  // simple line-art building thumbnail, unique per project
  function thumb(p, i) {
    var floors = 2 + (i % 3);
    var w = 150 + (i % 2) * 40, x = (400 - w) / 2, fh = 46, base = 270;
    var top = base - floors * fh;
    var win = '';
    for (var f = 0; f < floors; f++) {
      for (var c = 0; c < 3; c++) {
        win += '<rect x="' + (x + 18 + c * ((w - 36) / 3)) + '" y="' + (top + f * fh + 12) + '" width="' + ((w - 36) / 3 - 12) + '" height="' + (fh - 24) + '" fill="#fff" opacity=".85"/>';
      }
    }
    var roof = p.cat === 'biet-thu'
      ? '<path d="M' + (x - 14) + ' ' + top + ' L200 ' + (top - 38) + ' L' + (x + w + 14) + ' ' + top + 'Z" fill="#1b1b1b"/>'
      : '<rect x="' + (x - 8) + '" y="' + (top - 10) + '" width="' + (w + 16) + '" height="10" fill="#1b1b1b"/>';
    return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="400" height="300" fill="' + p.tone + '"/>' +
      '<circle cx="' + (320 - i * 8) + '" cy="70" r="30" fill="#fff" opacity=".18"/>' +
      '<rect y="270" width="400" height="30" fill="#111" opacity=".25"/>' +
      '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (floors * fh) + '" fill="#f3f1ec"/>' +
      win + roof +
      '<rect x="' + (200 - 10) + '" y="' + (base - 30) + '" width="20" height="30" fill="#1b1b1b"/>' +
      '</svg>';
  }

  var grid = document.getElementById('projects');
  grid.innerHTML = PROJECTS.map(function (p, i) {
    return '<article class="project reveal" data-cat="' + p.cat + '">' +
      '<div class="thumb">' + thumb(p, i) + '<span class="tag">' + p.label + '</span></div>' +
      '<h3>' + p.name + '</h3><p>' + p.meta + '</p></article>';
  }).join('');
  grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });

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

  /* ---- cost estimator ---- */
  var area = document.getElementById('area');
  var floors = document.getElementById('floors');
  var estValue = document.getElementById('estValue');
  var estRange = document.getElementById('estRange');

  function fmtMoney(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '').replace('.', ',') + ' tỷ';
    return Math.round(n / 1e6).toLocaleString('vi-VN') + ' triệu';
  }
  function estimate() {
    var unit = +document.querySelector('input[name="pack"]:checked').value;
    var a = Math.max(0, +area.value || 0);
    var fl = Math.max(1, +floors.value || 1);
    if (!a) { estValue.textContent = '—'; estRange.textContent = 'Nhập diện tích để xem ước tính.'; return; }
    // diện tích sàn xây dựng ≈ diện tích sàn × số tầng; mái/móng quy đổi thêm ~ 0.9 sàn
    var total = a * fl + a * 0.9;
    var mid = total * unit;
    estValue.innerHTML = fmtMoney(mid) + '<small>VNĐ</small>';
    estRange.textContent = 'Khoảng ' + fmtMoney(mid * 0.92) + ' – ' + fmtMoney(mid * 1.1) + ' · ' + Math.round(total) + ' m² xây dựng';
  }
  ['input', 'change'].forEach(function (ev) {
    document.querySelector('.calc').addEventListener(ev, estimate);
  });
  estimate();

  /* ---- contact form (site tĩnh: mở ứng dụng mail với nội dung điền sẵn) ---- */
  var form = document.getElementById('contactForm');
  var msg = document.getElementById('formMsg');
  var TO = 'info@viocons.vn';
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
    var body = 'Họ tên: ' + name + '\nSĐT: ' + phone + '\nDiện tích: ' + (d.get('area') || '—') + ' m²\nNhu cầu: ' + d.get('need') + '\nGhi chú: ' + (d.get('note') || '—');
    msg.className = 'form-msg';
    msg.textContent = 'Cảm ơn bạn! Ứng dụng email sẽ mở để gửi yêu cầu — hoặc gọi hotline để được hỗ trợ ngay.';
    window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent('Yêu cầu tư vấn từ ' + name) + '&body=' + encodeURIComponent(body);
  });
})();
