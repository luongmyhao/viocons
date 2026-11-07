(function () {
  'use strict';

  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');
  var csrf = '';
  var me = null;
  var meta = { kinds: {}, groups: {} };
  var unread = 0;
  var tab = 'projects';

  /* ---------- tiện ích ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { add(el, x); });
    el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function toast(msg, bad) {
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (bad ? ' bad' : '');
    toastEl.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.hidden = true; }, bad ? 5000 : 2600);
  }
  var src = function (p) { return p ? '/' + p : ''; };

  function api(method, url, body) {
    var opt = { method: method, headers: {}, credentials: 'same-origin' };
    if (csrf) opt.headers['X-CSRF-Token'] = csrf;
    if (body instanceof FormData) opt.body = body;
    else if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(url, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401 && url.indexOf('/login') < 0) { me = null; renderLogin('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'); throw new Error('auth'); }
        if (r.status === 403 && j.mustChange) { me.mustChange = true; renderMustChange(); throw new Error('must'); }
        if (!r.ok) throw new Error(j.error || 'Có lỗi xảy ra, vui lòng thử lại.');
        return j;
      });
    });
  }
  function fail(e) { if (e && e.message !== 'auth' && e.message !== 'must') toast(e.message, true); }

  /* ---------- đăng nhập ---------- */
  function renderLogin(note) {
    clear(app);
    var err = h('p', { class: 'err' }, note || '');
    var user = h('input', { type: 'text', autocomplete: 'username', required: true, autofocus: true });
    var pass = h('input', { type: 'password', autocomplete: 'current-password', required: true });
    var btn = h('button', { class: 'btn', type: 'submit', style: 'width:100%' }, 'Đăng nhập');
    var form = h('form', { onsubmit: function (e) {
      e.preventDefault();
      btn.disabled = true; err.textContent = '';
      api('POST', '/api/admin/login', { username: user.value, password: pass.value }).then(function (r) {
        csrf = r.csrf; me = r.user; start();
      }).catch(function (x) { err.textContent = x.message; btn.disabled = false; });
    } },
      h('label', { class: 'field' }, h('span', null, 'Tên đăng nhập'), user),
      h('label', { class: 'field' }, h('span', null, 'Mật khẩu'), pass),
      err, btn);
    app.appendChild(h('div', { class: 'login-wrap' }, h('div', { class: 'login' },
      h('img', { src: '/assets/logo.png', alt: 'VIOCONS' }),
      h('h1', null, 'Khu quản trị website'),
      h('p', { class: 'sub' }, 'Đăng nhập để cập nhật dự án và thông tin công ty'),
      form)));
  }

  function renderMustChange() {
    clear(app);
    app.appendChild(h('div', { class: 'login-wrap' }, h('div', { class: 'login' },
      h('img', { src: '/assets/logo.png', alt: 'VIOCONS' }),
      h('h1', null, 'Đặt mật khẩu mới'),
      h('p', { class: 'sub' }, 'Đây là lần đăng nhập đầu tiên. Vui lòng đổi mật khẩu tạm thời sang mật khẩu của riêng bạn.'),
      passwordForm(function () { me.mustChange = false; start(); }, true))));
  }

  function passwordForm(done, plain) {
    var cur = h('input', { type: 'password', autocomplete: 'current-password', required: true });
    var n1 = h('input', { type: 'password', autocomplete: 'new-password', required: true, minlength: '8' });
    var n2 = h('input', { type: 'password', autocomplete: 'new-password', required: true, minlength: '8' });
    var err = h('p', { class: 'err' });
    var btn = h('button', { class: 'btn', type: 'submit' }, 'Đổi mật khẩu');
    return h('form', { onsubmit: function (e) {
      e.preventDefault();
      err.textContent = '';
      if (n1.value !== n2.value) { err.textContent = 'Hai lần nhập mật khẩu mới chưa giống nhau.'; return; }
      btn.disabled = true;
      api('POST', '/api/admin/password', { current: cur.value, next: n1.value }).then(function (r) {
        csrf = r.csrf; toast('Đã đổi mật khẩu.'); cur.value = n1.value = n2.value = ''; btn.disabled = false; done();
      }).catch(function (x) { err.textContent = x.message; btn.disabled = false; });
    } },
      h('label', { class: 'field' }, h('span', null, plain ? 'Mật khẩu tạm (đã được cấp)' : 'Mật khẩu hiện tại'), cur),
      h('label', { class: 'field' }, h('span', null, 'Mật khẩu mới ', h('small', null, '(ít nhất 8 ký tự)')), n1),
      h('label', { class: 'field' }, h('span', null, 'Nhập lại mật khẩu mới'), n2),
      err, btn);
  }

  /* ---------- khung chính ---------- */
  function shell() {
    clear(app);
    var content = h('main', { class: 'main', id: 'content' });
    var nav = h('nav', { class: 'side' },
      h('div', { class: 'brand' }, h('img', { src: '/assets/logo.png', alt: '' }), h('span', null, 'Quản trị')),
      navBtn('projects', 'Dự án'),
      navBtn('settings', 'Thông tin công ty'),
      navBtn('messages', 'Tin nhắn từ khách'),
      navBtn('account', 'Tài khoản'),
      h('div', { class: 'spacer' }),
      h('a', { class: 'nav-btn', href: '/', target: '_blank', rel: 'noopener' }, 'Xem website ↗'),
      h('div', { class: 'who' }, 'Đang đăng nhập: ', h('b', null, me.username)),
      h('button', { class: 'nav-btn', type: 'button', onclick: function () {
        api('POST', '/api/admin/logout').finally(function () { me = null; csrf = ''; renderLogin(); });
      } }, 'Đăng xuất'));
    app.appendChild(h('div', { class: 'shell' }, nav, content));
    return content;
  }
  function navBtn(id, label) {
    var b = h('button', { class: 'nav-btn' + (tab === id ? ' on' : ''), type: 'button', 'data-tab': id, onclick: function () { go(id); } }, h('span', null, label));
    if (id === 'messages' && unread) b.appendChild(h('span', { class: 'badge' }, String(unread)));
    return b;
  }
  function go(id) {
    tab = id;
    var content = shell();
    ({ projects: viewProjects, settings: viewSettings, messages: viewMessages, account: viewAccount })[id](content);
    window.scrollTo(0, 0);
  }

  function start() {
    if (me.mustChange) return renderMustChange();
    api('GET', '/api/admin/meta').then(function (m) { meta = m; })
      .then(function () { return api('GET', '/api/admin/messages'); })
      .then(function (list) { unread = list.filter(function (x) { return !x.read; }).length; go(tab); })
      .catch(fail);
  }

  /* ---------- Dự án: danh sách ---------- */
  function viewProjects(content) {
    clear(content);
    var list = h('div', { class: 'plist' }, h('p', { class: 'hint' }, 'Đang tải…'));
    content.appendChild(h('header', null,
      h('div', null, h('h2', null, 'Dự án'), h('p', { class: 'hint' }, 'Thêm, sửa, ẩn hoặc xóa dự án hiển thị trên website. Thứ tự ở đây cũng là thứ tự trên trang chủ.')),
      h('button', { class: 'btn', type: 'button', onclick: function () { editProject(content, null); } }, '+ Thêm dự án')));
    content.appendChild(list);
    api('GET', '/api/admin/projects').then(function (items) {
      clear(list);
      if (!items.length) return list.appendChild(h('div', { class: 'empty' }, 'Chưa có dự án nào. Nhấn "Thêm dự án" để bắt đầu.'));
      items.forEach(function (p, i) {
        function move(d) {
          var slugs = items.map(function (x) { return x.slug; });
          var j = i + d;
          var t = slugs[i]; slugs[i] = slugs[j]; slugs[j] = t;
          api('POST', '/api/admin/projects/reorder', { slugs: slugs }).then(function () { viewProjects(content); }).catch(fail);
        }
        list.appendChild(h('div', { class: 'prow' + (p.hidden ? ' is-hidden' : '') },
          p.img ? h('img', { src: src(p.img), alt: '', loading: 'lazy' }) : h('div', { class: 'noimg' }),
          h('div', null,
            h('div', { class: 't' }, p.name),
            h('div', { class: 'm' }, (p.loc || '—'), ' · ', (p.gallery || []).length + ' ảnh'),
            h('div', null,
              h('span', { class: 'tag' }, meta.groups[p.group] || p.group),
              h('span', { class: 'tag' }, p.status || 'Chưa ghi tình trạng'),
              p.hidden ? h('span', { class: 'tag off' }, 'Đang ẩn') : null)),
          h('div', { class: 'acts' },
            h('button', { class: 'btn ghost', type: 'button', title: 'Đưa lên', disabled: i === 0, onclick: function () { move(-1); } }, '↑'),
            h('button', { class: 'btn ghost', type: 'button', title: 'Đưa xuống', disabled: i === items.length - 1, onclick: function () { move(1); } }, '↓'),
            h('a', { class: 'btn ghost', href: '/du-an-chi-tiet.html?id=' + encodeURIComponent(p.slug), target: '_blank', rel: 'noopener' }, 'Xem'),
            h('button', { class: 'btn', type: 'button', onclick: function () { editProject(content, p); } }, 'Sửa'),
            h('button', { class: 'btn danger', type: 'button', onclick: function () {
              if (!confirm('Xóa dự án "' + p.name + '"?\nThao tác này không thể hoàn tác.')) return;
              api('DELETE', '/api/admin/projects/' + encodeURIComponent(p.slug)).then(function () { toast('Đã xóa dự án.'); viewProjects(content); }).catch(fail);
            } }, 'Xóa'))));
      });
    }).catch(fail);
  }

  /* ---------- Dự án: biểu mẫu ---------- */
  function resizeImage(file) {
    // thu nhỏ ảnh lớn ngay trên máy trước khi tải lên (nhẹ hơn, trang web tải nhanh hơn)
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var MAX = 1800, w = img.naturalWidth, hgt = img.naturalHeight;
        if (Math.max(w, hgt) <= MAX && file.size < 700 * 1024) return resolve(file);
        var k = Math.min(1, MAX / Math.max(w, hgt));
        var c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(hgt * k);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { resolve(b && b.size < file.size ? new File([b], 'anh.jpg', { type: 'image/jpeg' }) : file); }, 'image/jpeg', 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }
  function uploadImage(file) {
    return resizeImage(file).then(function (f) {
      var fd = new FormData(); fd.append('file', f);
      return api('POST', '/api/admin/upload', fd);
    }).then(function (r) { return r.path; });
  }

  function editProject(content, p) {
    var isNew = !p;
    var d = Object.assign({ name: '', group: 'dan-dung', kind: 'house', loc: '', client: '', status: 'Hoàn thành', funding: '', scale: '', year: '', desc: '', img: '', gallery: [], hidden: false }, p || {});
    d.gallery = (d.gallery || []).slice();
    clear(content);

    function inp(key, label, opts) {
      opts = opts || {};
      var el = h('input', { type: 'text', value: d[key], maxlength: opts.max || 200, list: opts.list, placeholder: opts.ph, oninput: function () { d[key] = el.value; } });
      return h('label', { class: 'field' }, h('span', null, label, opts.hint ? h('small', null, ' ' + opts.hint) : null), el);
    }
    function sel(key, label, options) {
      var el = h('select', { onchange: function () { d[key] = el.value; } },
        options.map(function (o) { return h('option', { value: o[0], selected: o[0] === d[key] }, o[1]); }));
      return h('label', { class: 'field' }, h('span', null, label), el);
    }

    var coverBox = h('div', { class: 'cover' });
    var galBox = h('div', { class: 'thumbs' });
    var fileCover = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', hidden: true });
    var fileGal = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, hidden: true });
    var busy = h('span', { class: 'hint' });

    function drawImages() {
      clear(coverBox);
      coverBox.appendChild(d.img ? h('img', { src: src(d.img), alt: '' }) : h('div', { class: 'empty', style: 'padding:30px 20px' }, 'Chưa có ảnh đại diện'));
      coverBox.appendChild(h('div', null,
        h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { fileCover.click(); } }, d.img ? 'Đổi ảnh đại diện' : 'Chọn ảnh đại diện'),
        h('p', { class: 'hint' }, 'Ảnh hiển thị ở danh sách dự án và đầu trang chi tiết. Nên dùng ảnh ngang.')));
      clear(galBox);
      d.gallery.forEach(function (g, i) {
        galBox.appendChild(h('div', { class: 'thumb' },
          g === d.img ? h('span', { class: 'star' }, 'Đại diện') : null,
          h('img', { src: src(g), alt: '', loading: 'lazy' }),
          h('div', { class: 'tb' },
            h('button', { type: 'button', title: 'Đặt làm ảnh đại diện', onclick: function () { d.img = g; drawImages(); } }, '★'),
            h('button', { type: 'button', title: 'Sang trái', disabled: i === 0, onclick: function () { swap(i, i - 1); } }, '←'),
            h('button', { type: 'button', title: 'Sang phải', disabled: i === d.gallery.length - 1, onclick: function () { swap(i, i + 1); } }, '→'),
            h('button', { class: 'x', type: 'button', title: 'Bỏ ảnh này', onclick: function () { d.gallery.splice(i, 1); drawImages(); } }, '✕'))));
      });
      if (!d.gallery.length) galBox.appendChild(h('p', { class: 'hint' }, 'Chưa có ảnh nào trong thư viện.'));
    }
    function swap(a, b) { var t = d.gallery[a]; d.gallery[a] = d.gallery[b]; d.gallery[b] = t; drawImages(); }

    fileCover.addEventListener('change', function () {
      var f = fileCover.files[0]; fileCover.value = '';
      if (!f) return;
      busy.textContent = 'Đang tải ảnh lên…';
      uploadImage(f).then(function (path) { d.img = path; busy.textContent = ''; drawImages(); }).catch(function (e) { busy.textContent = ''; fail(e); });
    });
    fileGal.addEventListener('change', function () {
      var files = Array.prototype.slice.call(fileGal.files); fileGal.value = '';
      var i = 0;
      (function next() {
        if (i >= files.length) { busy.textContent = ''; drawImages(); return; }
        busy.textContent = 'Đang tải ảnh ' + (i + 1) + '/' + files.length + '…';
        uploadImage(files[i++]).then(function (path) { d.gallery.push(path); if (!d.img) d.img = path; next(); })
          .catch(function (e) { busy.textContent = ''; fail(e); drawImages(); });
      })();
    });

    var err = h('p', { class: 'err' });
    var saveBtn = h('button', { class: 'btn', type: 'submit' }, isNew ? 'Thêm dự án' : 'Lưu thay đổi');
    var descEl = h('textarea', { maxlength: '4000', placeholder: 'Mô tả ngắn về công trình (không bắt buộc). Để trống thì website tự tạo câu mô tả từ các thông tin ở trên.', oninput: function () { d.desc = descEl.value; } });
    descEl.value = d.desc || '';

    var form = h('form', { onsubmit: function (e) {
      e.preventDefault();
      err.textContent = '';
      saveBtn.disabled = true;
      var req = isNew ? api('POST', '/api/admin/projects', d) : api('PUT', '/api/admin/projects/' + encodeURIComponent(p.slug), d);
      req.then(function () { toast(isNew ? 'Đã thêm dự án.' : 'Đã lưu thay đổi.'); viewProjects(content); })
        .catch(function (x) { err.textContent = x.message; saveBtn.disabled = false; fail(x); });
    } },
      h('div', { class: 'card' }, h('h3', null, 'Thông tin chính'),
        inp('name', 'Tên dự án *', { max: 150, ph: 'VD: Trường Tiểu học Mỹ Lộc' }),
        h('div', { class: 'grid2' },
          sel('group', 'Nhóm công trình *', Object.keys(meta.groups).map(function (k) { return [k, meta.groups[k]]; })),
          sel('kind', 'Loại hạng mục *', Object.keys(meta.kinds).map(function (k) { return [k, meta.kinds[k].name]; }))),
        inp('loc', 'Địa điểm', { ph: 'VD: Cần Giuộc, Long An' }),
        inp('client', 'Khách hàng / Chủ đầu tư', { max: 250 }),
        h('div', { class: 'grid2' },
          sel('status', 'Tình trạng', [['Hoàn thành', 'Hoàn thành'], ['Đang thực hiện', 'Đang thực hiện'], ['', '(Không ghi)']]),
          inp('funding', 'Nguồn vốn', { list: 'fundingList', ph: 'VD: Vốn nhà nước' })),
        h('div', { class: 'grid2' },
          inp('scale', 'Quy mô', { ph: 'VD: 3 tầng, 1.200 m²' }),
          inp('year', 'Thời gian thực hiện', { ph: 'VD: 2024' })),
        h('label', { class: 'field' }, h('span', null, 'Mô tả'), descEl),
        h('datalist', { id: 'fundingList' }, ['Vốn nhà nước', 'Vốn tư nhân', 'Vốn ODA'].map(function (v) { return h('option', { value: v }); }))),
      h('div', { class: 'card' }, h('h3', null, 'Ảnh đại diện'), coverBox, fileCover),
      h('div', { class: 'card' }, h('h3', null, 'Thư viện ảnh công trình'),
        galBox,
        h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { fileGal.click(); } }, '+ Thêm ảnh'), ' ', busy, fileGal,
        h('p', { class: 'hint' }, 'Chọn được nhiều ảnh một lúc (JPG, PNG, WebP). Ảnh lớn sẽ tự được thu nhỏ trước khi tải lên.')),
      h('div', { class: 'card' },
        h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: d.hidden, onchange: function (e) { d.hidden = e.target.checked; } }),
          h('span', null, 'Ẩn dự án này khỏi website (vẫn giữ lại để hiện sau)'))),
      err,
      h('div', { class: 'acts', style: 'justify-content:flex-start' }, saveBtn,
        h('button', { class: 'btn ghost', type: 'button', onclick: function () { viewProjects(content); } }, 'Hủy')));

    content.appendChild(h('header', null, h('h2', null, isNew ? 'Thêm dự án' : 'Sửa dự án')));
    content.appendChild(form);
    drawImages();
  }

  /* ---------- Thông tin công ty ---------- */
  function viewSettings(content) {
    clear(content);
    content.appendChild(h('header', null, h('div', null, h('h2', null, 'Thông tin công ty'),
      h('p', { class: 'hint' }, 'Số điện thoại, email, địa chỉ và liên kết mạng xã hội. Lưu xong, mọi trang trên website được cập nhật ngay.'))));
    api('GET', '/api/admin/settings').then(function (s) {
      var fields = [
        ['phone1', 'Số điện thoại (hotline chính)', 'VD: 0979.001.455'],
        ['phone2', 'Số điện thoại 2', ''],
        ['email', 'Email nhận liên hệ', ''],
        ['address1', 'Địa chỉ trụ sở', ''],
        ['address2', 'Văn phòng đại diện', ''],
        ['facebook', 'Liên kết Facebook', 'https://…'],
        ['messenger', 'Liên kết Messenger', 'https://m.me/…'],
        ['zalo', 'Liên kết Zalo', 'https://zalo.me/…'],
      ];
      var inputs = {};
      var err = h('p', { class: 'err' });
      var btn = h('button', { class: 'btn', type: 'submit' }, 'Lưu thông tin');
      var form = h('form', { class: 'card', onsubmit: function (e) {
        e.preventDefault(); err.textContent = ''; btn.disabled = true;
        var body = {}; fields.forEach(function (f) { body[f[0]] = inputs[f[0]].value; });
        api('PUT', '/api/admin/settings', body).then(function () { toast('Đã lưu thông tin công ty.'); btn.disabled = false; })
          .catch(function (x) { err.textContent = x.message; btn.disabled = false; });
      } },
        fields.map(function (f) {
          inputs[f[0]] = h('input', { type: 'text', value: s[f[0]], maxlength: '300', placeholder: f[2] });
          return h('label', { class: 'field' }, h('span', null, f[1]), inputs[f[0]]);
        }), err, btn);
      content.appendChild(form);
    }).catch(fail);
  }

  /* ---------- Tin nhắn ---------- */
  function fmtDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  function viewMessages(content) {
    clear(content);
    content.appendChild(h('header', null,
      h('div', null, h('h2', null, 'Tin nhắn từ khách'), h('p', { class: 'hint' }, 'Yêu cầu tư vấn và đăng ký dự toán gửi từ website.')),
      h('a', { class: 'btn ghost', href: '/api/admin/messages.csv' }, 'Tải về (Excel/CSV)')));
    var box = h('div', null, h('p', { class: 'hint' }, 'Đang tải…'));
    content.appendChild(box);
    api('GET', '/api/admin/messages').then(function (list) {
      clear(box);
      unread = list.filter(function (x) { return !x.read; }).length;
      refreshBadge();
      if (!list.length) return box.appendChild(h('div', { class: 'empty' }, 'Chưa có tin nhắn nào.'));
      list.forEach(function (m) {
        var rows = [];
        if (m.kind === 'estimate' && m.est) {
          rows = [['Tỉnh/thành', m.est.province], ['Hạng mục', m.est.pack], ['Diện tích', m.est.area + ' m²'], ['Dự toán sơ bộ', m.est.total]];
        } else if (m.need) rows = [['Nhu cầu', m.need]];
        box.appendChild(h('div', { class: 'msg' + (m.read ? '' : ' unread') },
          h('div', { class: 'top' },
            h('span', null, h('span', { class: 'tag' }, m.kind === 'estimate' ? 'Đăng ký dự toán' : 'Liên hệ'), fmtDate(m.at)),
            m.read ? null : h('b', { style: 'color:var(--orange)' }, 'Mới')),
          h('div', { class: 'who' }, m.name || '(Không ghi tên)', ' · ', h('a', { href: 'tel:' + m.phone.replace(/[^0-9+]/g, '') }, m.phone)),
          rows.length ? h('dl', null, rows.map(function (r) { return [h('dt', null, r[0]), h('dd', null, r[1])]; })) : null,
          m.note ? h('div', { class: 'body' }, m.note) : null,
          h('div', { class: 'acts', style: 'justify-content:flex-start' },
            h('button', { class: 'btn ghost sm', type: 'button', onclick: function () {
              api('POST', '/api/admin/messages/' + m.id + '/read', { read: !m.read }).then(function () { viewMessages(content); }).catch(fail);
            } }, m.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'),
            h('button', { class: 'btn danger sm', type: 'button', onclick: function () {
              if (!confirm('Xóa tin nhắn này?')) return;
              api('DELETE', '/api/admin/messages/' + m.id).then(function () { viewMessages(content); }).catch(fail);
            } }, 'Xóa'))));
      });
    }).catch(fail);
  }
  function refreshBadge() {
    var b = document.querySelector('[data-tab="messages"]');
    if (!b) return;
    var old = b.querySelector('.badge'); if (old) old.remove();
    if (unread) b.appendChild(h('span', { class: 'badge' }, String(unread)));
  }

  /* ---------- Tài khoản ---------- */
  function viewAccount(content) {
    clear(content);
    content.appendChild(h('header', null, h('h2', null, 'Tài khoản')));
    content.appendChild(h('div', { class: 'card' }, h('h3', null, 'Đổi mật khẩu của bạn'), passwordForm(function () {})));

    var usersCard = h('div', { class: 'card' }, h('h3', null, 'Người quản trị'));
    content.appendChild(usersCard);
    function loadUsers() {
      api('GET', '/api/admin/users').then(function (users) {
        clear(usersCard);
        usersCard.appendChild(h('h3', null, 'Người quản trị'));
        usersCard.appendChild(h('table', null, h('tbody', null, users.map(function (u) {
          return h('tr', null,
            h('td', null, h('b', null, u.username), u.self ? h('span', { class: 'tag', style: 'margin-left:8px' }, 'Bạn') : null),
            h('td', null, u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ''),
            h('td', { style: 'text-align:right' }, u.self ? null : h('button', { class: 'btn danger sm', type: 'button', onclick: function () {
              if (!confirm('Xóa tài khoản "' + u.username + '"?')) return;
              api('DELETE', '/api/admin/users/' + u.id).then(function () { toast('Đã xóa tài khoản.'); loadUsers(); }).catch(fail);
            } }, 'Xóa')));
        }))));
        var nu = h('input', { type: 'text', required: true, autocomplete: 'off', placeholder: 'tên không dấu, VD: nhanvien1' });
        var np = h('input', { type: 'text', required: true, autocomplete: 'off', minlength: '8', placeholder: 'mật khẩu tạm, ít nhất 8 ký tự' });
        var err = h('p', { class: 'err' });
        usersCard.appendChild(h('form', { style: 'margin-top:18px', onsubmit: function (e) {
          e.preventDefault(); err.textContent = '';
          api('POST', '/api/admin/users', { username: nu.value, password: np.value }).then(function () { toast('Đã thêm người quản trị. Họ sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.'); loadUsers(); })
            .catch(function (x) { err.textContent = x.message; });
        } },
          h('h3', null, 'Thêm người quản trị'),
          h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', null, 'Tên đăng nhập'), nu), h('label', { class: 'field' }, h('span', null, 'Mật khẩu tạm'), np)),
          err, h('button', { class: 'btn', type: 'submit' }, 'Thêm tài khoản')));
      }).catch(fail);
    }
    loadUsers();

    content.appendChild(h('div', { class: 'card' }, h('h3', null, 'Sao lưu dữ liệu'),
      h('p', { class: 'hint', style: 'margin-bottom:12px' }, 'Tải về một bản sao thông tin công ty, dự án và tin nhắn (dạng file JSON). Nên làm định kỳ. Ảnh tải lên nằm trong thư mục data/uploads trên máy chủ.'),
      h('a', { class: 'btn ghost', href: '/api/admin/backup' }, 'Tải bản sao lưu')));
  }

  /* ---------- khởi động ---------- */
  api('GET', '/api/admin/me').then(function (r) { csrf = r.csrf; me = r.user; start(); }).catch(function () { renderLogin(); });
})();
