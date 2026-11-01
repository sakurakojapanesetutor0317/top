/* Shared navigation markup and behavior. */
(() => {
  'use strict';
  const markup = "\n<div class=\"head-in\">\n<a aria-label=\"Sakura Japanese home\" class=\"header-brand\" href=\"https://sakurakojapanesetutor0317.github.io/top/index.html\"><img alt=\"Sakura Japanese\" src=\"https://sakurakojapanesetutor0317.github.io/top/assets/tea-logo-transparent.png\"/></a>\n<button aria-controls=\"menu\" aria-expanded=\"false\" aria-label=\"Open menu\" class=\"menu-btn\" id=\"menuBtn\"><span></span><span></span><span></span></button>\n<nav aria-label=\"Main\" class=\"menu\" id=\"menu\">\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/index.html\">Home</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/Grammarhub/minna-top.html\">Minna no Nihongo</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/Grammarhub/N5grammarmap.html\">JLPT</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/Grammarhub/index.html\">Grammar</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/wordgame/index.html\" rel=\"noopener\">Games</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/reading/index.html\" rel=\"noopener\">Reading</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/listening/\">Listening</a>\n</nav>\n<a aria-label=\"Search\" class=\"site-header-search\" href=\"https://sakurakojapanesetutor0317.github.io/top/Grammarhub/index.html\"><svg fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"7\"></circle><path d=\"M20 20l-4-4\"></path></svg></a>\n<a aria-label=\"Support Sakura Japanese on Buy Me a Coffee\" title=\"Buy Me a Coffee\" class=\"site-header-coffee\" href=\"https://buymeacoffee.com/sakurakojapanese0317\" target=\"_blank\" rel=\"noopener noreferrer\"><svg aria-hidden=\"true\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"80\" height=\"80\" rx=\"19\" fill=\"#986C59\"/><path d=\"M57 35h5c16 0 14 22-5 22\" fill=\"none\" stroke=\"#fff\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M17 31h41v21c0 11-8 17-20.5 17S17 63 17 52Z\" fill=\"#fff\"/><ellipse cx=\"37.5\" cy=\"31.5\" rx=\"20.5\" ry=\"5\" fill=\"#EAD4C5\"/><ellipse cx=\"37.5\" cy=\"31.5\" rx=\"17\" ry=\"3\" fill=\"#76503E\"/><path d=\"M29 47c0-5 6-7 9-2 3-5 9-3 9 2 0 5-9 11-9 11s-9-6-9-11Z\" fill=\"#F3A9BF\"/></svg></a>\n</div>\n";
  document.querySelectorAll('[data-site-header]').forEach(header => {
    header.innerHTML = markup;
    const button = header.querySelector('.menu-btn');
    const menu = header.querySelector('.menu');
    const setOpen = open => {
      menu.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
    };
    button.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    menu.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); button.focus(); }
    });
    document.addEventListener('click', event => { if (!header.contains(event.target)) setOpen(false); });
    const path = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
    const links = [...menu.querySelectorAll('a')];
    let best = null, longest = -1;
    links.forEach(link => {
      const destination = new URL(link.href).pathname.replace(/index\.html$/, '').replace(/\/$/, '');
      const matches = path === destination || (destination !== '/top' && path.startsWith(destination + '/'));
      if (matches && destination.length > longest) { best = link; longest = destination.length; }
    });
    if (best) best.setAttribute('aria-current', 'page');
  });
  const toast = document.getElementById('toast');
  let timer;
  document.querySelectorAll('[data-draft]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    if (!toast) return;
    toast.textContent = link.dataset.draft + ' — this page is coming soon.';
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }));
})();
