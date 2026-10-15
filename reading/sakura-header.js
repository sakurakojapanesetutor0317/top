/* Sakura Japanese — shared header v1.0. Vanilla JS; works on GitHub Pages. */
(function () {
  'use strict';
  var ROOT = 'https://sakurakojapanesetutor0317.github.io/top/';
  var mount = document.querySelector('[data-sakura-header]');
  if (!mount || mount.dataset.sakuraReady === 'true') return;
  mount.dataset.sakuraReady = 'true';
  var current = mount.getAttribute('data-current') || 'home';
  var links = [
    ['home','Home',ROOT+'index.html'],
    ['minna','Minna no Nihongo',null],
    ['jlpt','JLPT',null],
    ['grammar','Grammar',null],
    ['games','Games',ROOT+'wordgame/index.html'],
    ['reading','Reading',ROOT+'reading/index.html']
  ];
  function el(tag, className, text) { var n=document.createElement(tag); if(className)n.className=className; if(text)n.textContent=text; return n; }
  var header=el('header','sj-header');
  var inner=el('div','sj-inner');
  var brand=el('a','sj-brand'); brand.href=ROOT+'index.html';brand.setAttribute('aria-label','Sakura Japanese home');
  var logo=el('img');logo.src=ROOT+'assets/tea-logo-transparent.png';logo.alt='Sakura Japanese';brand.appendChild(logo);
  var btn=el('button','sj-menu-btn');btn.type='button';btn.setAttribute('aria-label','Open menu');btn.setAttribute('aria-expanded','false');
  var menuId='sj-menu';btn.setAttribute('aria-controls',menuId);
  for(var i=0;i<3;i++)btn.appendChild(el('span'));
  var nav=el('nav','sj-menu');nav.id=menuId;nav.setAttribute('aria-label','Main');
  var toast=el('div','sj-toast');toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
  toast.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:9999;background:white;color:#54485f;border:1px solid #FBD3E0;border-radius:99px;padding:10px 16px;font:600 14px Poppins,sans-serif;box-shadow:0 6px 20px #b98da333;display:none;max-width:90vw;text-align:center';
  var toastTimer;
  function showDraft(label){toast.textContent=label+' — this page is coming soon.';toast.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(function(){toast.style.display='none'},2400);}
  links.forEach(function (data) {
    var a=el('a','',data[1]);a.href=data[2]||'#';
    if(current===data[0])a.setAttribute('aria-current','page');
    if(!data[2])a.addEventListener('click',function(e){e.preventDefault();showDraft(data[1]);});
    nav.appendChild(a);
  });
  var search=el('a','sj-search');search.href='#';search.setAttribute('aria-label','Search');
  search.innerHTML='<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>';
  search.addEventListener('click',function(e){e.preventDefault();showDraft('Search');});
  inner.appendChild(brand);inner.appendChild(btn);inner.appendChild(nav);inner.appendChild(search);header.appendChild(inner);mount.appendChild(header);mount.appendChild(toast);
  function close(){nav.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Open menu');}
  btn.addEventListener('click',function(){var open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'Close menu':'Open menu');});
  nav.addEventListener('click',function(e){if(e.target.closest('a'))close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  document.addEventListener('click',function(e){if(!header.contains(e.target))close();});
})();
