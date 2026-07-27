(function() {
  'use strict';

  const CONFIG = {
    delay: 900,
    lock: true,
    msgs: {
      title: 'Adblocker Detectado',
      line1: 'Hemos detectado que estás usando un bloqueador de anuncios.',
      line2: 'La publicidad nos ayuda a mantener este proyecto gratuito.',
      line3: 'Desactívalo y recarga la página para continuar.',
      btn: 'Recargar Página'
    }
  };

  // ========== INYECTAR CSS ==========
  (function injectCSS() {
    const css = document.createElement('style');
    css.textContent = `
      .adb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);backdrop-filter:blur(10px);z-index:2147483647;display:flex;align-items:center;justify-content:center;animation:adbIn .3s ease}
      @keyframes adbIn{from{opacity:0}to{opacity:1}}
      .adb-box{background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:16px;padding:40px 32px;max-width:420px;width:90%;text-align:center;box-shadow:0 25px 80px rgba(0,0,0,.6);animation:adbUp .4s ease}
      @keyframes adbUp{from{opacity:0;transform:translateY(30px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
      .adb-icon{width:64px;height:64px;margin:0 auto 20px;color:#f85149;background:rgba(248,81,73,.1);border-radius:50%;display:flex;align-items:center;justify-content:center}
      .adb-icon svg{width:32px;height:32px}
      .adb-title{font-size:24px;font-weight:700;color:#f0f6fc;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
      .adb-text{font-size:15px;line-height:1.6;color:#8b949e;margin:0 0 10px;font-family:inherit}
      .adb-warn{color:#58a6ff;font-weight:500;margin-top:16px;padding:12px;background:rgba(56,139,253,.1);border-radius:8px;border:1px solid rgba(56,139,253,.2)}
      .adb-btn{margin-top:24px;padding:12px 28px;background:#238636;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:.2s}
      .adb-btn:hover{background:#2ea043;transform:translateY(-1px);box-shadow:0 4px 12px rgba(35,134,54,.3)}
      html.adb-lock,html.adb-lock body{overflow:hidden!important;height:100%!important;overscroll-behavior:none;touch-action:none}
    `;
    document.head.appendChild(css);
  })();

  // ========== DETECTORES ==========
  function baitElements() {
    return new Promise(r => {
      const classes = ['ad','ads','adsbox','adsbygoogle','ad-unit','ad-zone','banner-ads','textads','pub_300x250'];
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
      const els = classes.map(c => {
        const d = document.createElement('div');
        d.className = c;
        d.style.cssText = 'width:1px;height:1px;position:absolute;';
        wrap.appendChild(d);
        return d;
      });
      document.body.appendChild(wrap);
      setTimeout(() => {
        let blocked = false;
        els.forEach(el => {
          const s = getComputedStyle(el);
          if (!el.parentNode || s.display==='none' || s.visibility==='hidden' || (el.offsetHeight===0 && el.offsetWidth===0 && s.display!=='block')) blocked = true;
        });
        wrap.remove();
        r(blocked);
      }, CONFIG.delay);
    });
  }

  function baitScript() {
    return new Promise(r => {
      const s = document.createElement('script');
      let t = setTimeout(() => { cleanup(); r(false); }, 2000);
      function cleanup() { clearTimeout(t); s.remove(); }
      s.onerror = () => { cleanup(); r(true); };
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456';
      document.head.appendChild(s);
    });
  }

  function baitFetch() {
    return new Promise(r => {
      if (!window.fetch) return r(false);
      const ctrl = new AbortController();
      const t = setTimeout(() => { ctrl.abort(); r(false); }, 2000);
      fetch('https://googleads.g.doubleclick.net/pagead/id', { method:'HEAD', mode:'no-cors', signal:ctrl.signal })
        .then(() => { clearTimeout(t); r(false); })
        .catch(e => { clearTimeout(t); r(e.name !== 'AbortError'); });
    });
  }

  function baitWindow() {
    return new Promise(r => {
      const signs = ['adblock','adblocker','AdBlock','AdGuard','ublock','ublockOrigin'];
      for (let k of signs) if (window[k] !== undefined) return r(true);
      r(false);
    });
  }

  function baitCSS() {
    return new Promise(r => {
      const el = document.createElement('div');
      el.className = 'ad-banner';
      el.style.cssText = 'position:absolute;left:-9999px;width:300px;height:250px;';
      document.body.appendChild(el);
      setTimeout(() => {
        const s = getComputedStyle(el);
        const blocked = s.display==='none' || s.visibility==='hidden' || s.opacity==='0';
        el.remove();
        r(blocked);
      }, 500);
    });
  }

  // ========== UI ==========
  function show() {
    if (document.getElementById('adb-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'adb-overlay';
    ov.className = 'adb-overlay';
    ov.innerHTML = `
      <div class="adb-box">
        <div class="adb-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            <line x1="4" y1="4" x2="20" y2="20"/>
          </svg>
        </div>
        <h2 class="adb-title">${CONFIG.msgs.title}</h2>
        <p class="adb-text">${CONFIG.msgs.line1}</p>
        <p class="adb-text">${CONFIG.msgs.line2}</p>
        <p class="adb-text adb-warn">${CONFIG.msgs.line3}</p>
        <button class="adb-btn" id="adb-reload">${CONFIG.msgs.btn}</button>
      </div>
    `;
    document.body.appendChild(ov);
    document.getElementById('adb-reload').addEventListener('click', () => location.reload());

    if (CONFIG.lock) {
      document.documentElement.classList.add('adb-lock');
      ['wheel','touchmove','keydown','scroll'].forEach(evt => {
        window.addEventListener(evt, e => {
          if (evt==='keydown' && (e.key==='F5' || (e.ctrlKey && e.key==='r'))) return;
          e.preventDefault(); e.stopPropagation(); return false;
        }, { passive:false, capture:true });
      });
    }
  }

  // ========== EJECUCIÓN ==========
  async function init() {
    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }
    const results = await Promise.all([baitElements(), baitScript(), baitFetch(), baitWindow(), baitCSS()]);
    if (results.some(Boolean)) show();
  }

  init();
})();
