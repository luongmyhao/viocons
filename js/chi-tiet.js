(function () {
  'use strict';
  var P = window.VIOCONS_PROJECTS || [];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var $ = function (id) { return document.getElementById(id); };
  var TYPE = { 'dan-dung': 'Công trình dân dụng', 'cong-cong': 'Công trình công cộng' };
  var id = new URLSearchParams(location.search).get('id');
  var idx = -1;
  P.forEach(function (p, i) { if (p.slug === id) idx = i; });
  if (idx < 0) { $('dtMissing').hidden = false; $('dtCrumb').textContent = 'Không tìm thấy'; return; }
  var p = P[idx];

  document.title = p.name + ' — VIOCONS';
  $('dtCrumb').textContent = p.name;
  var gl = $('dtGroupLink'); gl.textContent = TYPE[p.group]; gl.href = 'du-an.html?nhom=' + p.group;
  $('dtImg').src = p.img; $('dtImg').alt = p.name;
  $('dtBadge').textContent = p.label;
  $('dtType').textContent = TYPE[p.group];
  $('dtName').textContent = p.name;
  $('dtMeta').textContent = p.loc || p.meta;

  // chỉ hiện những mục có thông tin thật
  var rows = [
    ['Nhóm công trình', TYPE[p.group]],
    ['Hạng mục', p.label],
    ['Địa điểm', p.loc],
    ['Khách hàng / Nhà thầu chính', p.client],
    ['Tình trạng', p.status],
    ['Nguồn vốn', p.funding],
    ['Quy mô', p.scale],
    ['Thời gian', p.year]
  ].filter(function (r) { return r[1]; });
  $('dtList').innerHTML = rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');

  var bits = ['Một trong những công trình VIOCONS đã thực hiện, thuộc nhóm ' + TYPE[p.group].toLowerCase() + '.'];
  if (p.client) bits.push('Khách hàng / nhà thầu chính: ' + p.client + '.');
  if (p.status) bits.push('Tình trạng: ' + p.status.toLowerCase() + (p.funding ? ', ' + p.funding.toLowerCase() : '') + '.');
  $('dtDesc').textContent = p.desc || bits.join(' ');
  $('dtMain').hidden = false;

  // thư viện ảnh + trình xem ảnh
  var G = p.gallery || [];
  if (G.length) {
    $('dtGalleryCount').textContent = '(' + G.length + ')';
    $('dtGalleryGrid').innerHTML = G.map(function (g, i) {
      return '<button type="button" class="dt-thumb" data-i="' + i + '" aria-label="Xem ảnh ' + (i + 1) + '"><img src="' + esc(g) + '" alt="' + esc(p.name) + ' — ảnh ' + (i + 1) + '" loading="lazy"></button>';
    }).join('');
    $('dtGallery').hidden = false;

    var lb = document.createElement('div');
    lb.className = 'pj-lightbox pj-viewer'; lb.hidden = true;
    lb.innerHTML = '<button type="button" class="pj-close" aria-label="Đóng">×</button>' +
      '<button type="button" class="pv-nav pv-prev" aria-label="Ảnh trước">‹</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="pv-nav pv-next" aria-label="Ảnh sau">›</button>';
    document.body.appendChild(lb);
    var cur = 0;
    function show(i) {
      cur = (i + G.length) % G.length;
      var im = lb.querySelector('img'); im.src = G[cur]; im.alt = p.name;
      lb.querySelector('figcaption').innerHTML = '<b>' + esc(p.name) + '</b><span>' + (cur + 1) + ' / ' + G.length + '</span>';
    }
    function open(i) { show(i); lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('open'); }); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('open'); setTimeout(function () { lb.hidden = true; }, 250); document.body.style.overflow = ''; }
    $('dtGalleryGrid').addEventListener('click', function (e) { var b = e.target.closest('.dt-thumb'); if (b) open(+b.dataset.i); });
    $('dtImg').style.cursor = 'zoom-in';
    $('dtImg').addEventListener('click', function () { open(0); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.closest('.pj-close')) close();
      else if (e.target.closest('.pv-prev')) show(cur - 1);
      else if (e.target.closest('.pv-next')) show(cur + 1);
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  var prev = P[(idx - 1 + P.length) % P.length], next = P[(idx + 1) % P.length];
  $('dtPrev').href = 'du-an-chi-tiet.html?id=' + prev.slug; $('dtPrev').querySelector('b').textContent = prev.name;
  $('dtNext').href = 'du-an-chi-tiet.html?id=' + next.slug; $('dtNext').querySelector('b').textContent = next.name;
  $('dtNav').hidden = false;

  var others = P.filter(function (q) { return q.slug !== p.slug; });
  others.sort(function (a, b) { return (b.group === p.group) - (a.group === p.group); });
  others = others.slice(0, 4);
  $('dtMoreGrid').innerHTML = others.map(function (q) {
    return '<a class="pj-card" href="du-an-chi-tiet.html?id=' + q.slug + '" aria-label="' + esc(q.name) + '">' +
      '<div class="pj-img" style="background-image:url(\'' + esc(q.img) + '\')"></div>' +
      '<div class="pj-head"><h3 class="pj-name">' + esc(q.name) + '</h3><p class="pj-meta">' + esc(q.loc || q.meta) + '</p></div>' +
      '<span class="pj-type">' + TYPE[q.group] + '</span></a>';
  }).join('');
  $('dtMore').hidden = false;
})();
