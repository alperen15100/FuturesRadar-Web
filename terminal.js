/* Presentation-only extension. Never writes to allRows or changes scanner rules. */
(() => {
  const words={en:{marketTitle:'Market overview',market:'Market',favorites:'Favorites',tools:'Trading tools',academy:'Academy',deviceOnly:'Saved on this device',share:'Copy coin link',calculate:'Calculate P&L',chartTitle:'15m closing prices · last 120 candles',favorite:'Add favorite',remove:'Remove favorite',empty:'No favorites yet. Open a coin and tap Add favorite to keep it here.',unavailable:'Not in the current scan',copied:'Link copied',copyFailed:'Copy this address:',chartError:'Chart unavailable. Open TradingView to inspect this market.',chartLoading:'Loading chart…',chartUpdated:'Chart updated',waiting:'Waiting for market data',scanTime:'Last successful scan',noResults:'No matching symbols in this scan.'},tr:{marketTitle:'Piyasaya genel bakış',market:'Piyasa',favorites:'Favoriler',tools:'Hesaplama araçları',academy:'Akademi',deviceOnly:'Bu cihazda saklanır',share:'Coin bağlantısını kopyala',calculate:'Kâr / zarar hesapla',chartTitle:'15dk kapanış fiyatları · son 120 mum',favorite:'Favoriye ekle',remove:'Favoriden çıkar',empty:'Henüz favori yok. Bir coini açıp Favoriye ekle düğmesine dokunun.',unavailable:'Mevcut taramada yok',copied:'Bağlantı kopyalandı',copyFailed:'Bu adresi kopyalayın:',chartError:'Grafik alınamadı. Piyasayı incelemek için TradingView bağlantısını açın.',chartLoading:'Grafik yükleniyor…',chartUpdated:'Grafik güncellendi',waiting:'Piyasa verisi bekleniyor',scanTime:'Son başarılı tarama',noResults:'Bu taramada eşleşen coin bulunamadı.'}};
  const t=k=>(words[currentLang]||words.en)[k]||k;
  let favorites;try{favorites=new Set(JSON.parse(localStorage.getItem('fr_favorites_v1')||'[]').filter(x=>typeof x==='string'&&/^[A-Z0-9_]+USDT$/.test(x)))}catch{favorites=new Set()}
  let lastRows=null,lastScan=null,chartSymbol=null,chartToken=0;
  const chartCache=new Map();
  const $=id=>document.getElementById(id);
  const nativeRender=window.render;
  const nativeSetLang=window.setLang;
  const nativeSelect=window.selectSymbol;
  let pendingSymbol=new URLSearchParams(location.search).get('symbol');
  if(pendingSymbol&&!/^[A-Z0-9_]+USDT$/.test(pendingSymbol))pendingSymbol=null;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function translate(){document.querySelectorAll('[data-terminal]').forEach(el=>el.textContent=t(el.dataset.terminal));renderFavorites();updateDetail();}
  function renderFavorites(){
    const box=$('favoritesList');box.replaceChildren();
    if(!favorites.size){box.innerHTML=`<p class="empty-state">${t('empty')}</p>`;return;}
    for(const symbol of favorites){const row=allRows.find(r=>r.symbol===symbol);const div=document.createElement('div');div.className='favorite-row';
      div.innerHTML=`<div>${row?`<a href="#intel">${escape(symbol)}</a>`:`<b>${escape(symbol)}</b>`}<small>${row?`RSI ${row.rsi.toFixed(2)} · OB ${row.obCount} · Score ${row.score}`:t('unavailable')}</small></div><span>${row?fmt(row.price,6)+' USDT':'—'}</span><button type="button" aria-label="${t('remove')}: ${escape(symbol)}">★</button>`;
      div.querySelector('a')?.addEventListener('click',()=>{showView('market');window.selectSymbol(symbol)});
      div.querySelector('button').addEventListener('click',()=>toggleFavorite(symbol));box.append(div);
    }
  }
  function toggleFavorite(symbol){if(!symbol)return;favorites.has(symbol)?favorites.delete(symbol):favorites.add(symbol);try{localStorage.setItem('fr_favorites_v1',JSON.stringify([...favorites]))}catch{$('actionNotice').textContent=currentLang==='tr'?'Tercih bu cihazda kaydedilemedi.':'Could not save preference on this device.'}renderFavorites();updateDetail();}
  function updateDetail(){const row=allRows.find(r=>r.symbol===selectedSymbol);$('favoriteSelected').disabled=!row;$('shareSelected').disabled=!row;$('favoriteSelected').textContent=(favorites.has(selectedSymbol)?'★ ':'☆ ')+t(favorites.has(selectedSymbol)?'remove':'favorite');$('favoriteSelected').setAttribute('aria-pressed',String(favorites.has(selectedSymbol)));$('calculateSelected').href='tools/profit-loss.html'+(row?'?entry='+encodeURIComponent(row.price):'');
    if(row){const components=[Math.min(30,Math.log10(row.volume+1)*3.6),Math.min(25,Math.max(0,row.change)*3.2),row.rsi>=65?Math.min(25,(row.rsi-55)*1.2):Math.max(4,row.rsi/10),Math.min(20,row.obCount*2.3)];const labels=currentLang==='tr'?['Hacim','24s değişim','RSI','OB sayımı']:['Volume','24h change','RSI','OB count'];$('scoreBreakdown').innerHTML=`<h3>${currentLang==='tr'?'Skorun bileşenleri':'Score breakdown'} · ${row.score}/100</h3><div>${components.map((v,i)=>`<span>${labels[i]}<b>${v.toFixed(1)} / ${[30,25,25,20][i]}</b></span>`).join('')}</div><p>${currentLang==='tr'?'Toplam en yakın tam sayıya yuvarlanır. Skor, kazanma olasılığı değildir.':'The total is rounded to the nearest whole number. Score is not a probability of profit.'}</p>`;}
  }
  function showView(view){const fav=view==='favorites';$('favoritesPanel').hidden=!fav;document.querySelector('.layout').hidden=fav;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelectorAll('.mobile-dock a').forEach(a=>a.classList.toggle('active',a.hash===(fav?'#favorites':'#dashboard')));}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{showView(b.dataset.view);history.replaceState(null,'',b.dataset.view==='favorites'?'#favorites':'#dashboard')}));
  function route(){showView(location.hash==='#favorites'?'favorites':'market')}
  window.addEventListener('hashchange',route);
  $('favoriteSelected').addEventListener('click',()=>toggleFavorite(selectedSymbol));
  $('shareSelected').addEventListener('click',async()=>{const u=new URL(location.href);u.search='';u.searchParams.set('symbol',selectedSymbol);u.hash='intel';try{await navigator.clipboard.writeText(u.href);$('actionNotice').textContent=t('copied')}catch{$('actionNotice').textContent=t('copyFailed')+' '+u.href}});
  function drawChart(data){const values=data.values;const lo=Math.min(...values),hi=Math.max(...values),range=hi-lo||1;const points=values.map((v,i)=>`${(i/(values.length-1)*800).toFixed(2)},${(130-(v-lo)/range*115).toFixed(2)}`).join(' ');$('coinChart').innerHTML=`<svg viewBox="0 0 800 150" role="img" aria-label="${escape(chartSymbol)} 15 minute closing prices"><path d="M0 140H800 M0 75H800 M0 10H800" stroke="#24303a" fill="none"/><polyline points="${points}" stroke="#b7ff3c" stroke-width="2" fill="none" vector-effect="non-scaling-stroke"/></svg>`;$('chartState').textContent=`${t('chartUpdated')} ${new Date(data.time).toLocaleTimeString(currentLang==='tr'?'tr-TR':'en-US')}`;}
  async function chart(symbol){if(!symbol)return;chartSymbol=symbol;const token=++chartToken;const cached=chartCache.get(symbol);if(cached&&Date.now()-cached.time<60000){drawChart(cached);return}$('coinChart').innerHTML=`<p>${t('chartLoading')}</p>`;$('chartState').textContent='';const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);try{const response=await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${encodeURIComponent(symbol)}&interval=15m&limit=120`,{signal:controller.signal});if(!response.ok)throw Error('chart');const bars=await response.json();const values=bars.map(b=>Number(b[4]));if(values.length<2||!values.every(Number.isFinite))throw Error('chart');const data={values,time:Date.now()};chartCache.set(symbol,data);if(token===chartToken)drawChart(data)}catch{if(token===chartToken)$('coinChart').innerHTML=`<p>${t('chartError')}</p>`}finally{clearTimeout(timer)}}
  function refresh(){
    if(lastRows!==allRows&&allRows.length){lastRows=allRows;lastScan=new Date();}
    if(lastScan){$('updated').textContent=lastScan.toLocaleTimeString(currentLang==='tr'?'tr-TR':'en-US');$('sideUpdated').textContent=$('updated').textContent;$('updated').title=t('scanTime');}
    renderFavorites();updateDetail();
    if(allRows.length&&!allRows.some(r=>r.symbol.includes($('search').value.toUpperCase()))){$('mobileSignals').innerHTML=`<p class="empty-state">${t('noResults')}</p>`;$('signals').innerHTML=`<tr><td colspan="9">${t('noResults')}</td></tr>`;}
    if(selectedSymbol!==chartSymbol||(chartCache.has(selectedSymbol)&&Date.now()-chartCache.get(selectedSymbol).time>=60000))chart(selectedSymbol);
  }
  window.render=function(rows){nativeRender(rows);refresh();if(pendingSymbol&&rows.some(r=>r.symbol===pendingSymbol)){const symbol=pendingSymbol;pendingSymbol=null;window.selectSymbol(symbol)}};
  window.selectSymbol=function(symbol){nativeSelect(symbol);$('actionNotice').textContent='';const u=new URL(location.href);u.searchParams.set('symbol',symbol);history.replaceState(null,'',u);};
  window.setLang=function(lang){nativeSetLang(lang);translate();refresh();if(chartSymbol&&chartCache.has(chartSymbol))drawChart(chartCache.get(chartSymbol));};
  // Keyboard access for legacy footer actions and dialog dismissal.
  document.querySelectorAll('.legal-links a:not([href])').forEach(a=>{a.tabIndex=0;a.setAttribute('role','button');a.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();a.click()}})});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){hideLegal();hideArticle();closeLangMenu()}});
  route();translate();refresh();
})();
