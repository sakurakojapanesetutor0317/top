/* Shared navigation markup and behavior. */
(() => {
  'use strict';
  const markup = "\n<div class=\"wrap head-in\">\n<a aria-label=\"Sakura Japanese home\" class=\"header-brand\" href=\"https://sakurakojapanesetutor0317.github.io/top/index.html\"><img alt=\"Sakura Japanese\" src=\"https://sakurakojapanesetutor0317.github.io/top/assets/tea-logo-transparent.png\"/></a>\n<button aria-controls=\"menu\" aria-expanded=\"false\" aria-label=\"Open menu\" class=\"menu-btn\" id=\"menuBtn\"><span></span><span></span><span></span></button>\n<nav aria-label=\"Main\" class=\"menu\" id=\"menu\">\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/index.html\">Home</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/Grammarhub/minna-top.html\">Minna no Nihongo</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/Grammarhub/N5grammarmap.html\">JLPT</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/Grammarhub/index.html\">Grammar</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/wordgame/index.html\" rel=\"noopener\">Games</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/reading/index.html\" rel=\"noopener\">Reading</a>\n<a href=\"https://sakurakojapanesetutor0317.github.io/top/listening/\">Listening</a>\n</nav>\n<a aria-label=\"Search\" class=\"search\" href=\"https://sakurakojapanesetutor0317.github.io/top/Grammarhub/index.html\"><svg fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"7\"></circle><path d=\"M20 20l-4-4\"></path></svg></a>\n</div>\n";
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
    menu.querySelectorAll('a').forEach(link => {
      const destination = new URL(link.href).pathname.replace(/index\.html$/, '').replace(/\/$/, '');
      if (path === destination) link.setAttribute('aria-current', 'page');
    });
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
