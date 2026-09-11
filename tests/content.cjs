const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.FR_JSDOM_PATH||'jsdom');
for(const choice of [null,{analytics:false,ads:false},{analytics:true,ads:false},{analytics:false,ads:true}]){
 const dom=new JSDOM('<!doctype html><body><footer class="footer"></footer></body>',{url:'https://futuresradar.org',runScripts:'outside-only'}),w=dom.window;
 if(choice)w.localStorage.setItem('fr_cookie_consent_v4',JSON.stringify(choice));
 w.eval(fs.readFileSync('consent.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const srcs=[...w.document.scripts].map(s=>s.src);
 assert.equal(srcs.some(s=>s.includes('googletagmanager')),!!choice?.analytics);
 assert.equal(srcs.some(s=>s.includes('googlesyndication')),!!choice?.ads);
 if(!choice)assert(w.document.getElementById('sharedConsent'));
 dom.window.close();
}
const dom=new JSDOM('<body><div id="topSignals"></div></body>',{url:'https://futuresradar.org',runScripts:'outside-only'}),w=dom.window;
w.eval('let allRows=[];let currentLang="en";window.render=function(){};window.setLang=function(){};');w.eval(fs.readFileSync('data-help.js','utf8'));
assert(w.document.getElementById('dataHelp').open);assert(w.document.getElementById('dataHelp').textContent.includes('No market data'));
w.eval('allRows=[{symbol:"TEST"}];render()');assert.equal(w.document.getElementById('dataHelp').open,false);dom.window.close();
console.log('PASS optional script gating: unset/reject/analytics/ads; no-data help and collapse on data');
