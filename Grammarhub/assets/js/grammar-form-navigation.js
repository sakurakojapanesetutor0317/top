/* Exact form-name search on level maps; the shared registry drives all results. */
(function(){
 const store=window.GRAMMAR_CONNECTIONS, q=document.getElementById('q'), results=document.getElementById('results');
 if(!store||!q||!results)return;
 const lv=document.title.match(/N[345]/)?.[0];
 const norm=x=>String(x).normalize('NFKC').toLowerCase().replace(/[\s_−–—-]/g,'');
 function showForm(){
  const f=Object.entries(store.forms).find(([,v])=>[v.en,...v.aliases].some(x=>norm(x)===norm(q.value)))?.[0];
  if(!f)return;
  const list=store.grammar.filter(x=>x.lv===lv&&x.forms.includes(f));results.replaceChildren();
  list.forEach(x=>{const a=document.createElement('a');a.className='result';a.href=x.u;const b=document.createElement('b');b.textContent=x.ja;const em=document.createElement('em');em.textContent=x.en;a.append(b,em);results.append(a)});
  if(!list.length){const p=document.createElement('p');p.textContent='No grammar in this level uses this form.';results.append(p)}
 }
 q.addEventListener('input',showForm);showForm();
})();
