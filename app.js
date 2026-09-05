/* ============================================================================
 * kk tools · 应用逻辑（密码生成器 + 编解码）
 *   - ES5 兼容（IE11+）
 *   - 不依赖外部库
 *   - 0 网络请求
 * ============================================================================ */
(function () {
  'use strict';

  /* ============================================================================
   * i18n 双语支持（与 lang.js 配套）
   *   - HTML 中带 data-zh / data-en 的静态文本由 lang.js 接管
   *   - app.js 动态产生的文本（toast / placeholder / aria-label）走 t()
   *   - 模板字符串：用 <span data-count>5</span> 这种占位会复杂，这里用 sprintf 风格 {n}
   * ============================================================================ */
  var LANG = 'zh'; // 默认值，DOMContentLoaded 后会被 lang.js 同步

  function detectLang() {
    try {
      var stored = localStorage.getItem('kk-lang');
      if (stored === 'zh' || stored === 'en') return stored;
    } catch (e) {}
    var nav = (navigator.language || 'zh').toLowerCase();
    return /^en/i.test(nav) ? 'en' : 'zh';
  }
  LANG = detectLang();

  var I18N = {
    'no.charset':           { zh: '至少勾选一个字符集',     en: 'Pick at least one charset' },
    'charset.not.enough':   { zh: '字符集不足 {n} 个不重复字符（当前 {k}）', en: 'Not enough unique chars: need {n}, have {k}' },
    'strength.none':        { zh: '未生成',                 en: 'Not generated' },
    'strength.weak':        { zh: '弱',                     en: 'Weak' },
    'strength.medium':      { zh: '中',                     en: 'Medium' },
    'strength.good':        { zh: '良',                     en: 'Good' },
    'strength.strong':      { zh: '强',                     en: 'Strong' },
    'strength.epic':        { zh: '极强',                   en: 'Epic' },
    'copied':               { zh: '已复制',                 en: 'Copied' },
    'copy.fail':            { zh: '复制失败',               en: 'Copy failed' },
    'no.pwd':               { zh: '还没有密码',             en: 'No password yet' },
    'no.output':            { zh: '还没有结果',             en: 'No result yet' },
    'cleared':              { zh: '已清空',                 en: 'Cleared' },
    'swapped':              { zh: '已交换',                 en: 'Swapped' },
    'paste.fail':           { zh: '读取剪贴失败',           en: 'Read clipboard failed' },
    'paste.unsupported':    { zh: '当前浏览器不支持剪贴读取', en: 'Clipboard read not supported' },
    'placeholder.pw':       { zh: '点击下方「生成」…',     en: 'Click Generate…' },
    'placeholder.codec.in': { zh: '输入要编码或解码的文本…', en: 'Type text to encode/decode…' },
    'placeholder.codec.out':{ zh: '结果会显示在这里…',     en: 'Result will appear here…' },
    'history.count':        { zh: '{n} 条',                 en: '{n} entries' },
    'meta.chars':           { zh: '{n} 字符',               en: '{n} chars' },
    'status.calc':          { zh: '计算中…',               en: 'Computing…' },
    'status.ok':            { zh: 'OK',                     en: 'OK' },
    'codec.help.default':   { zh: '提示：在左侧输入原文，右侧会自动显示编码或解码结果。点击 ⇅ 可把结果送到左边继续处理。',
                              en: 'Hint: type on the left, the right side updates live. Click ⇅ to send the result back to the left.' },
    'codec.help.b64-detect':{ zh: '🔍 检测到 Base64 输入，已自动解码为原文。', en: '🔍 Detected Base64 input, decoded to text.' },
    'codec.help.b64-encode':{ zh: '📦 已编码为 Base64。',  en: '📦 Encoded to Base64.' },
    'codec.help.b64-auto':  { zh: '输入文本自动检测方向：原样→编码；Base64 字符→解码。',
                              en: 'Auto-detect direction: plain text → encode; Base64 → decode.' },
    'codec.help.url-detect':{ zh: '🔗 检测到 URL 编码，已自动解码。', en: '🔗 Detected URL encoding, decoded.' },
    'codec.help.url-encode':{ zh: '🔗 已 URL 编码。',       en: '🔗 URL encoded.' },
    'codec.help.html-detect':{ zh: '🔍 检测到 HTML 实体，已自动解码。', en: '🔍 Detected HTML entities, decoded.' },
    'codec.help.html-encode':{ zh: '🔤 已编码为 HTML 实体（& < > " \' / 转义）。', en: '🔤 HTML entities encoded.' },
    'codec.help.json-pretty':{ zh: '✨ JSON 已格式化（缩进 2 空格）。', en: '✨ JSON formatted (2-space indent).' },
    'codec.help.json-mini': { zh: '📐 JSON 已压缩（去除空白）。', en: '📐 JSON minified.' },
    'codec.help.json-not-json':{ zh: '不是合法 JSON',     en: 'Not valid JSON' },
    'codec.help.jwt':       { zh: '🔐 JWT 解析：header + payload + signature。仅展示，不验证签名。',
                              en: '🔐 JWT parsed: header + payload + signature. Display only, no signature verification.' },
    'codec.help.hash-empty':{ zh: '🔒 输入文本，下面会同时计算 SHA-1 / SHA-256 / SHA-512。',
                              en: '🔒 Type text to compute SHA-1 / SHA-256 / SHA-512.' },
    'codec.help.hash-running':{ zh: '🔒 同步计算 SHA-1 / SHA-256 / SHA-512（需要 HTTPS 或 localhost）。',
                                en: '🔒 Computing SHA-1 / SHA-256 / SHA-512 (requires HTTPS or localhost).' },
    'jwt.error':            { zh: 'JWT 必须是 3 段（header.payload.signature）', en: 'JWT must have 3 parts (header.payload.signature)' },
    'hash.unsupported':     { zh: '当前浏览器不支持 SubtleCrypto。请用 HTTPS 或现代浏览器。',
                              en: 'SubtleCrypto not supported. Use HTTPS or a modern browser.' },
    'hash.fail':            { zh: '计算失败',               en: 'Hash failed' },
    'sha.unsupported':      { zh: '不支持',                 en: 'unsupported' },
    'codec.fail':           { zh: '处理失败',               en: 'Failed' }
  };
  function t(key, vars) {
    var entry = I18N[key];
    if (!entry) return key;
    var s = entry[LANG] || entry.zh;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : '{' + k + '}'; });
    }
    return s;
  }
  // 供外部（lang.js / 手动）调用：设置当前语言并通知刷新
  window.kkApplyLang = function (next) {
    if (next !== 'zh' && next !== 'en') return;
    LANG = next;
    try {
      document.dispatchEvent(new CustomEvent('kk:lang-changed', { detail: { lang: next } }));
    } catch (e) {}
  };
  // 同步初始化当前语言（防止页面中静态 data-zh/data-en 已被 lang.js 改写后，app.js 仍用旧 zh）
  if (window.kkSetLang) {
    try { window.kkSetLang(LANG); } catch (e) {}
  }

  // 监听 lang.js 切换语言，重渲染 app.js 产生的动态文案
  document.addEventListener('kk:lang-changed', function (e) {
    var next = e && e.detail && e.detail.lang;
    if (next !== 'zh' && next !== 'en') return;
    LANG = next;
    // 重新计算动态文案
    try {
      var pwOut = document.getElementById('pw-output');
      if (pwOut && pwOut.value) {
        renderStrength(pwOut.value);
      } else {
        var sl = document.getElementById('pw-strength-label');
        if (sl) sl.textContent = t('strength.none');
      }
      var histCount = document.getElementById('pw-history-count');
      if (histCount) histCount.textContent = t('history.count', { n: pwState.history.length });
      // 历史列表里每行的“复制”按钮文案
      qsa('.pw-history-list .btn-mini').forEach(function (b) {
        b.textContent = LANG === 'en' ? 'Copy' : '复制';
      });
      updateInputMeta();
      updateOutputMeta();
      // codec-help 与 codec-status 需重新跑一遍当前输入
      processCodec();
    } catch (err) {}
  });

  /* ===== 工具函数 ===== */
  function $(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function toast(msg) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  // 安全随机（用 crypto.getRandomValues）
  function randomBytes(n) {
    var arr = new Uint8Array(n);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(arr);
    } else {
      for (var i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }
  function pickRandom(charset) {
    var arr = randomBytes(2);
    var max = Math.floor(65536 / charset.length) * charset.length;
    var n;
    do {
      if (charset.length > 256) {
        arr = randomBytes(2);
        n = (arr[0] << 8) | arr[1];
      } else {
        arr = randomBytes(1);
        n = arr[0];
      }
    } while (n >= max);
    return charset.charAt(n % charset.length);
  }

  /* ============================================================================
   * 密码生成器
   * ============================================================================ */
  var pwState = {
    history: [],
    maxHistory: 10
  };

  var CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digit: '0123456789',
    symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\''
  };
  var AMBIGUOUS = '0OoIl1|`\'"';

  function getCharset() {
    var cs = '';
    if ($('pw-upper').checked)   cs += CHARSETS.upper;
    if ($('pw-lower').checked)   cs += CHARSETS.lower;
    if ($('pw-digit').checked)   cs += CHARSETS.digit;
    if ($('pw-symbol').checked) cs += CHARSETS.symbol;
    if ($('pw-no-ambiguous').checked) {
      var keep = '';
      for (var i = 0; i < cs.length; i++) {
        if (AMBIGUOUS.indexOf(cs.charAt(i)) < 0) keep += cs.charAt(i);
      }
      cs = keep;
    }
    return cs;
  }

  function generatePassword() {
    var length = parseInt($('pw-length').value, 10);
    var charset = getCharset();
    if (!charset) {
      toast(t('no.charset'));
      return null;
    }
    if ($('pw-no-repeat').checked && length > charset.length) {
      toast(t('charset.not.enough', { n: length, k: charset.length }));
      return null;
    }
    var pwd = '';
    var used = {};
    for (var i = 0; i < length; i++) {
      var ch;
      if ($('pw-no-repeat').checked) {
        // 不重复模式：循环取直到取到未用过的
        var attempts = 0;
        do {
          ch = pickRandom(charset);
          attempts++;
          if (attempts > 200) { used = {}; } // 防死循环
        } while (used[ch]);
        used[ch] = true;
      } else {
        ch = pickRandom(charset);
      }
      pwd += ch;
    }
    return pwd;
  }

  function calcStrength(pwd) {
    if (!pwd) return { score: 0, label: t('strength.none'), color: '#ccc' };
    var len = pwd.length;
    var charsetSize = 0;
    if (/[a-z]/.test(pwd)) charsetSize += 26;
    if (/[A-Z]/.test(pwd)) charsetSize += 26;
    if (/[0-9]/.test(pwd)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 33;
    var entropy = len * Math.log(charsetSize || 1) / Math.LN2;

    var score;
    var text;
    if (entropy < 40)        { score = 0.2; text = t('strength.weak'); }
    else if (entropy < 60)   { score = 0.4; text = t('strength.medium'); }
    else if (entropy < 80)   { score = 0.6; text = t('strength.good'); }
    else if (entropy < 120)  { score = 0.8; text = t('strength.strong'); }
    else                     { score = 1.0; text = t('strength.epic'); }

    return { score: score, label: text + ' · ' + Math.round(entropy) + ' bit' }; // 强度 label 格式不变（"X · 128 bit" 在中英文都通）
  }

  function renderStrength(pwd) {
    var fill = $('pw-strength-fill');
    var label = $('pw-strength-label');
    var s = calcStrength(pwd);
    fill.style.width = (s.score * 100) + '%';
    label.textContent = s.label;
  }

  function renderHistory() {
    var ul = $('pw-history-list');
    var cnt = $('pw-history-count');
    ul.innerHTML = '';
    pwState.history.forEach(function (item, idx) {
      var li = document.createElement('li');
      var txt = document.createElement('span');
      txt.className = 'pw-history-text';
      txt.textContent = item.pwd;
      var meta = document.createElement('span');
      meta.className = 'pw-history-meta';
      meta.textContent = item.strength;
      var copyBtn = document.createElement('button');
      copyBtn.className = 'btn-mini btn-ghost';
      copyBtn.textContent = t('copied') === 'Copied' ? 'Copy' : '复制'; // 历史行中文永远是“复制”，EN 永远是“Copy”
      copyBtn.style.fontSize = '10px';
      copyBtn.style.padding = '2px 8px';
      copyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        copyText(item.pwd);
      });
      li.appendChild(txt);
      li.appendChild(copyBtn);
      li.appendChild(meta);
      li.addEventListener('click', function () {
        $('pw-output').value = item.pwd;
        renderStrength(item.pwd);
      });
      ul.appendChild(li);
    });
    cnt.textContent = t('history.count', { n: pwState.history.length });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(t('copied')); },
        function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(t('copied')); }
    catch (e) { toast(t('copy.fail')); }
    document.body.removeChild(ta);
  }

  function doGenerate() {
    var pwd = generatePassword();
    if (!pwd) return;
    $('pw-output').value = pwd;
    renderStrength(pwd);
    // 入栈
    var s = calcStrength(pwd);
    pwState.history.unshift({ pwd: pwd, strength: s.label.split(' · ')[0] });
    if (pwState.history.length > pwState.maxHistory) pwState.history.pop();
    renderHistory();
  }

  function bindPassword() {
    $('pw-length').addEventListener('input', function () {
      $('pw-length-val').textContent = this.value;
    });
    $('pw-generate').addEventListener('click', doGenerate);
    $('pw-regen').addEventListener('click', doGenerate);
    $('pw-copy').addEventListener('click', function () {
      var v = $('pw-output').value;
      if (!v) { toast(t('no.pwd')); return; }
      copyText(v);
    });
    $('pw-output').addEventListener('click', function () { this.select(); });
    $('pw-history-clear').addEventListener('click', function () {
      pwState.history = [];
      renderHistory();
      toast(t('cleared'));
    });
    // 字符集变化时若当前有密码，重算强度
    ['pw-upper','pw-lower','pw-digit','pw-symbol','pw-no-ambiguous','pw-no-repeat'].forEach(function (id) {
      $(id).addEventListener('change', function () {
        var v = $('pw-output').value;
        if (v) renderStrength(v);
      });
    });
    // 初始
    $('pw-length-val').textContent = $('pw-length').value;
  }

  /* ============================================================================
   * 编解码
   * ============================================================================ */
  var codecState = {
    mode: 'base64',
    // 当前模式对应的输入、输出缓存（用于 swap）
    lastInput: '',
    lastOutput: ''
  };

  function utf8Encode(str) {
    // TextEncoder 是现代 API，回退自己实现
    if (window.TextEncoder) {
      try { return new TextEncoder().encode(str); } catch (e) {}
    }
    var arr = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) arr.push(c);
      else if (c < 0x800) arr.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      else if (c < 0xD800 || c >= 0xE000) arr.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      else {
        i++;
        var c2 = str.charCodeAt(i);
        var cp = 0x10000 + (((c & 0x3FF) << 10) | (c2 & 0x3FF));
        arr.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F),
                 0x80 | ((cp >> 6) & 0x3F),  0x80 | (cp & 0x3F));
      }
    }
    return new Uint8Array(arr);
  }
  function utf8Decode(bytes) {
    if (window.TextDecoder) {
      try { return new TextDecoder('utf-8', { fatal: false }).decode(bytes); } catch (e) {}
    }
    var str = '', i = 0;
    while (i < bytes.length) {
      var b = bytes[i];
      if (b < 0x80) { str += String.fromCharCode(b); i++; }
      else if (b < 0xC0) { str += '?'; i++; }
      else if (b < 0xE0) {
        str += String.fromCharCode(((b & 0x1F) << 6) | (bytes[i + 1] & 0x3F)); i += 2;
      } else if (b < 0xF0) {
        str += String.fromCharCode(((b & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F)); i += 3;
      } else {
        var cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) |
                 ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F);
        cp -= 0x10000;
        str += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF)); i += 4;
      }
    }
    return str;
  }
  function base64Encode(str) {
    var bytes = utf8Encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function base64Decode(str) {
    var bin = atob(str);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return utf8Decode(bytes);
  }
  function urlEncode(str) {
    return encodeURIComponent(str);
  }
  function urlDecode(str) {
    return decodeURIComponent(str);
  }
  function htmlEncode(str) {
    return str.replace(/[&<>"'\/]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;', '/':'&#x2F;' }[c];
    });
  }
  function htmlDecode(str) {
    var ta = document.createElement('textarea');
    ta.innerHTML = str;
    return ta.value;
  }
  function jsonPretty(str) {
    var obj = JSON.parse(str);
    return JSON.stringify(obj, null, 2);
  }
  function jsonMinify(str) {
    var obj = JSON.parse(str);
    return JSON.stringify(obj);
  }
  // JWT 解析
  function parseJwt(token) {
    var parts = token.trim().split('.');
    if (parts.length !== 3) throw new Error(t('jwt.error'));
    function b64urlDecode(s) {
      var pad = s.length % 4;
      if (pad === 2) s += '==';
      else if (pad === 3) s += '=';
      else if (pad === 1) throw new Error('Base64URL 长度异常');
      s = s.replace(/-/g, '+').replace(/_/g, '/');
      var bin = atob(s);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return utf8Decode(bytes);
    }
    var header = b64urlDecode(parts[0]);
    var payload = b64urlDecode(parts[1]);
    var sig = parts[2];
    var sigBytes = Math.floor((sig.length * 6) / 8);
    var prettyHeader = '', prettyPayload = '';
    try { prettyHeader = JSON.stringify(JSON.parse(header), null, 2); } catch (e) { prettyHeader = header; }
    try { prettyPayload = JSON.stringify(JSON.parse(payload), null, 2); } catch (e) { prettyPayload = payload; }
    return '━━━ Header ━━━\n' + prettyHeader +
           '\n\n━━━ Payload ━━━\n' + prettyPayload +
           '\n\n━━━ Signature ━━━\n' + sig +
           '  (' + sigBytes + ' bytes, 不验证)';
  }
  // 文本 Hash（SHA-1/256/512 等，不支持则提示）
  async function textHash(str, algo) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error(t('hash.unsupported'));
    }
    var bytes = utf8Encode(str);
    var buf = await window.crypto.subtle.digest(algo, bytes);
    var hex = '';
    var view = new Uint8Array(buf);
    for (var i = 0; i < view.length; i++) {
      hex += (view[i] < 16 ? '0' : '') + view[i].toString(16);
    }
    return hex;
  }

  function setStatus(msg, cls) {
    var s = $('codec-status');
    s.textContent = msg || '';
    s.className = 'codec-status' + (cls ? ' ' + cls : '');
  }

  function processCodec() {
    var input = $('codec-input').value;
    var output = '';
    var help = t('codec.help.default');
    try {
      switch (codecState.mode) {
        case 'base64':
          // 启发式判断方向（输入像是 base64 → 解码）
          var looksB64 = /^[A-Za-z0-9+/\s]+=*\s*$/.test(input) && input.length > 0;
          if (looksB64) {
            try { output = base64Decode(input); help = t('codec.help.b64-detect'); }
            catch (e) { output = base64Encode(input); help = t('codec.help.b64-encode'); }
          } else if (input === '') {
            help = t('codec.help.b64-auto');
          } else {
            output = base64Encode(input);
            help = t('codec.help.b64-encode');
          }
          setStatus(t('status.ok'), 'ok'); break;

        case 'url':
          try { output = urlDecode(input); help = t('codec.help.url-detect'); }
          catch (e) { output = urlEncode(input); help = t('codec.help.url-encode'); }
          setStatus(t('status.ok'), 'ok'); break;

        case 'html':
          if (/&(amp|lt|gt|quot|#39|#x2F);/.test(input)) {
            output = htmlDecode(input);
            help = t('codec.help.html-detect');
          } else {
            output = htmlEncode(input);
            help = t('codec.help.html-encode');
          }
          setStatus(t('status.ok'), 'ok'); break;

        case 'json':
          var trimmed = input.replace(/^\s+|\s+$/g, '');
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            // 解析 + 格式化
            try { output = jsonPretty(input); help = t('codec.help.json-pretty'); }
            catch (e) { output = jsonMinify(input); help = t('codec.help.json-mini'); }
          } else {
            try {
              JSON.parse(input);
              output = jsonMinify(input);
              help = t('codec.help.json-mini');
            } catch (e) {
              throw new Error(t('codec.help.json-not-json'));
            }
          }
          setStatus(t('status.ok'), 'ok'); break;

        case 'jwt':
          output = parseJwt(input);
          help = t('codec.help.jwt');
          setStatus(t('status.ok'), 'ok'); break;

        case 'hash':
          if (!input) { output = ''; help = t('codec.help.hash-empty'); setStatus('', ''); break; }
          // 异步执行
          setStatus(t('status.calc'), '');
          Promise.all([
            textHash(input, 'SHA-1').then(function (h) { return 'SHA-1:\n' + h; }).catch(function (e) { return 'SHA-1: (' + t('sha.unsupported') + ')'; }),
            textHash(input, 'SHA-256').then(function (h) { return 'SHA-256:\n' + h; }).catch(function (e) { return 'SHA-256: (' + t('sha.unsupported') + ')'; }),
            textHash(input, 'SHA-512').then(function (h) { return 'SHA-512:\n' + h; }).catch(function (e) { return 'SHA-512: (' + t('sha.unsupported') + ')'; })
          ]).then(function (results) {
            $('codec-output').value = results.join('\n\n');
            codecState.lastOutput = $('codec-output').value;
            updateOutputMeta();
            setStatus(t('status.ok'), 'ok');
          }).catch(function (e) {
            setStatus(e.message || t('hash.fail'), 'error');
          });
          help = t('codec.help.hash-running');
          break; // 落到同步赋值帮助文案
      }
      $('codec-output').value = output;
      codecState.lastOutput = output;
      $('codec-help').textContent = help;
    } catch (e) {
      $('codec-output').value = '';
      codecState.lastOutput = '';
      setStatus(e.message || '错误', 'error');
      $('codec-help').textContent = '❌ ' + (e.message || t('codec.fail'));
    }
    updateOutputMeta();
  }

  function updateInputMeta() {
    var v = $('codec-input').value;
    $('codec-input-meta').textContent = t('meta.chars', { n: v.length });
  }
  function updateOutputMeta() {
    var v = $('codec-output').value;
    $('codec-output-meta').textContent = t('meta.chars', { n: v.length });
  }

  function bindCodec() {
    $('codec-input').addEventListener('input', function () {
      updateInputMeta();
      processCodec();
    });
    $('codec-copy').addEventListener('click', function () {
      var v = $('codec-output').value;
      if (!v) { toast(t('no.output')); return; }
      copyText(v);
    });
    $('codec-input-clear').addEventListener('click', function () {
      $('codec-input').value = '';
      $('codec-output').value = '';
      updateInputMeta(); updateOutputMeta();
      processCodec();
    });
    $('codec-swap').addEventListener('click', function () {
      var a = $('codec-input').value;
      var b = $('codec-output').value;
      $('codec-input').value = b;
      $('codec-output').value = a;
      updateInputMeta(); updateOutputMeta();
      processCodec();
      toast(t('swapped'));
    });
    $('codec-input-paste').addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (t) {
          $('codec-input').value = t;
          updateInputMeta();
          processCodec();
        }, function () { toast(t('paste.fail')); });
      } else {
        toast(t('paste.unsupported'));
      }
    });
    // 模式切换
    qsa('.codec-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        qsa('.codec-tab').forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
        this.setAttribute('aria-selected', 'true');
        codecState.mode = this.getAttribute('data-mode');
        processCodec();
      });
    });
  }

  /* ============================================================================
   * 顶部 tabs
   * ============================================================================ */
  function bindTopTabs() {
    qsa('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tool = this.getAttribute('data-tool');
        qsa('.tab').forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
        this.setAttribute('aria-selected', 'true');
        qsa('.panel').forEach(function (p) { p.classList.add('hidden'); });
        $('panel-' + tool).classList.remove('hidden');
      });
    });
  }

  /* ============================================================================
   * 涟漪
   * ============================================================================ */
  function bindRipple() {
    document.addEventListener('click', function (e) {
      var target = e.target;
      // 跳过按钮/输入区
      var skip = target.closest && target.closest('button, input, textarea, a, select, .codec-tab');
      if (skip) return;
      // 仅在 .stage 内或 .title 上触发
      if (!target.closest('.stage')) return;
      var dot = document.createElement('div');
      dot.className = 'ripple';
      dot.style.left = e.clientX + 'px';
      dot.style.top  = e.clientY + 'px';
      document.body.appendChild(dot);
      dot.addEventListener('animationend', function () {
        if (dot.parentNode) dot.parentNode.removeChild(dot);
      });
    });
  }

  /* ============================================================================
   * 后台标签暂停动画
   * ============================================================================ */
  function bindVisibility() {
    document.addEventListener('visibilitychange', function () {
      var orbits = qsa('.orbit');
      orbits.forEach(function (o) {
        o.style.animationPlayState = document.hidden ? 'paused' : 'running';
      });
    });
  }

  /* ============================================================================
   * 启动
   * ============================================================================ */
  function init() {
    if (!document.addEventListener) return;
    document.addEventListener('DOMContentLoaded', function () {
      bindPassword();
      bindCodec();
      bindTopTabs();
      bindRipple();
      bindVisibility();
      // 初始化 codec
      processCodec();
      // 默认生成一个密码
      doGenerate();
    });
  }
  init();

})();