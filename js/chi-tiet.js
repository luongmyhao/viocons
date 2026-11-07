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
  var UPDATING = 'Đang cập nhật';

  document.title = p.name + ' — VIOCONS';
  $('dtCrumb').textContent = p.name;
  var gl = $('dtGroupLink'); gl.textContent = TYPE[p.group]; gl.href = 'du-an.html?nhom=' + p.group;
  $('dtImg').src = p.img; $('dtImg').alt = p.name;
  $('dtBadge').textContent = p.label;
  $('dtType').textContent = TYPE[p.group];
  $('dtName').textContent = p.name;
  $('dtMeta').textContent = p.loc || p.meta;
  var rows = [
    ['Nhóm công trình', TYPE[p.group]],
    ['Hạng mục', p.label],
    ['Địa điểm', p.loc || UPDATING],
    ['Chủ đầu tư', p.investor || UPDATING],
    ['Quy mô', p.scale || UPDATING],
    ['Thời gian', p.year || UPDATING]
  ];
  $('dtList').innerHTML = rows.map(function (r) {
    var upd = r[1] === UPDATING;
    return '<div><dt>' + esc(r[0]) + '</dt><dd' + (upd ? ' class="upd"' : '') + '>' + esc(r[1]) + '</dd></div>';
  }).join('');
  $('dtDesc').textContent = p.desc || ('Một trong những công trình VIOCONS đã thực hiện, thuộc nhóm ' + TYPE[p.group].toLowerCase() + '. Thông tin chi tiết về quy mô, hạng mục và tiến độ đang được cập nhật; liên hệ VIOCONS để biết thêm.');
  $('dtMain').hidden = false;

  if (p.gallery && p.gallery.length) {
    $('dtGallery').innerHTML = p.gallery.map(function (g) { return '<img src="' + esc(g) + '" alt="' + esc(p.name) + '" loading="lazy">'; }).join('');
    $('dtGallery').hidden = false;
  }

  var prev = P[(idx - 1 + P.length) % P.length], next = P[(idx + 1) % P.length];
  $('dtPrev').href = 'du-an-chi-tiet.html?id=' + prev.slug; $('dtPrev').querySelector('b').textContent = prev.name;
  $('dtNext').href = 'du-an-chi-tiet.html?id=' + next.slug; $('dtNext').querySelector('b').textContent = next.name;
  $('dtNav').hidden = false;

  // các dự án khác (cùng nhóm trước, rồi nhóm còn lại), tối đa 4
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
