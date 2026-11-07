(function () {
  'use strict';
  var P = window.VIOCONS_PROJECTS || [];
  var gDan = document.getElementById('pjDan'), gCong = document.getElementById('pjCong');
  if (!gDan || !gCong) return;
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/></svg>';
  var TYPE = { 'dan-dung': 'Công trình dân dụng', 'cong-cong': 'Công trình công cộng' };
  function card(p, i) {
    return '<article class="pj-card" data-i="' + i + '" tabindex="0" role="button" aria-label="Xem ảnh ' + esc(p.name) + '">' +
      '<div class="pj-img" style="background-image:url(\'' + esc(p.img) + '\')"></div>' +
      '<span class="pj-zoom">' + ZOOM + '</span>' +
      '<div class="pj-head"><span class="pj-num">' + (i < 9 ? '0' : '') + (i + 1) + '</span><h3 class="pj-name">' + esc(p.name) + '</h3><p class="pj-meta">' + esc(p.meta) + '</p></div>' +
      '<span class="pj-type">' + TYPE[p.group] + '</span></article>';
  }
  var nDan = 0, nCong = 0;
  gDan.innerHTML = P.map(function (p, i) { return p.group === 'dan-dung' ? (nDan++, card(p, i)) : ''; }).join('');
  gCong.innerHTML = P.map(function (p, i) { return p.group === 'cong-cong' ? (nCong++, card(p, i)) : ''; }).join('');
  document.getElementById('cntDan').textContent = '(' + nDan + ')';
  document.getElementById('cntCong').textContent = '(' + nCong + ')';

  // rê chuột: ảnh zoom từ từ, chữ chạy lên rồi biến mất (cùng hiệu ứng ở trang chủ)
  document.querySelectorAll('.pj-card').forEach(function (c) {
    var img = c.querySelector('.pj-img'), anim = null;
    function scaleNow() { var m = /matrix\(([^,]+),/.exec(getComputedStyle(img).transform); return m ? parseFloat(m[1]) : 1; }
    c.addEventListener('mouseenter', function () {
      c.classList.add('is-hover');
      if (!img.animate) return;
      var from = scaleNow(); if (anim) anim.cancel();
      anim = img.animate([{ transform: 'scale(' + from + ')' }, { transform: 'scale(1.75)' }], { duration: 14000, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
    });
    c.addEventListener('mouseleave', function () {
      c.classList.remove('is-hover');
      if (!img.animate) return;
      var cur = scaleNow(); if (anim) anim.cancel();
      anim = img.animate([{ transform: 'scale(' + cur + ')' }, { transform: 'scale(1)' }], { duration: 1400, easing: 'cubic-bezier(.22,.8,.2,1)', fill: 'none' });
    });
  });

  // bấm vào dự án: phóng to ảnh
  var lb = document.createElement('div');
  lb.className = 'pj-lightbox'; lb.hidden = true;
  lb.innerHTML = '<button type="button" class="pj-close" aria-label="Đóng">×</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(lb);
  function openLb(i) {
    var p = P[i];
    var im = lb.querySelector('img'); im.src = p.img; im.alt = p.name;
    lb.querySelector('figcaption').innerHTML = '<b>' + esc(p.name) + '</b><span>' + esc(p.meta) + '</span>';
    lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { lb.classList.remove('open'); setTimeout(function () { lb.hidden = true; }, 250); document.body.style.overflow = ''; }
  document.querySelector('.pj-page').addEventListener('click', function (e) { var c = e.target.closest('.pj-card'); if (c) openLb(+c.dataset.i); });
  document.querySelector('.pj-page').addEventListener('keydown', function (e) {
    var c = e.target.closest('.pj-card');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLb(+c.dataset.i); }
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.pj-close')) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
})();
