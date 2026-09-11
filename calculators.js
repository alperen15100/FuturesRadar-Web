(function(root){
'use strict';
function calculate(kind,v){
  const check=(name,min=0,strict=false)=>{const x=v[name];if(typeof x!=='number'||!Number.isFinite(x)||(strict?x<=min:x<min))throw Error('Enter valid positive values. Fees may be zero.');return x};
  const fee=()=>{const x=check('fee');if(x>=100)throw Error('Fee must be below 100%.');return x/100};
  if(kind==='position-sizing'){const balance=check('balance',0,true),risk=check('risk',0,true),entry=check('entry',0,true),stop=check('stop',0,true);if(risk>100)throw Error('Risk cannot exceed 100% of balance.');if(entry===stop)throw Error('Entry and stop must be different.');const budget=balance*risk/100,quantity=budget/Math.abs(entry-stop);return{headline:quantity,unit:'units',items:[['Risk budget',budget,'USDT'],['Position notional',quantity*entry,'USDT'],['Stop distance',Math.abs(entry-stop)/entry*100,'%']]}}
  if(kind==='profit-loss'){const entry=check('entry',0,true),exit=check('exit',0,true),quantity=check('quantity',0,true),f=fee();const gross=(exit-entry)*quantity*(v.direction==='short'?-1:1),fees=(entry+exit)*quantity*f;return{headline:gross-fees,unit:'USDT net P&L',items:[['Gross P&L',gross,'USDT'],['Trading fees',fees,'USDT'],['Entry notional',entry*quantity,'USDT']]}}
  if(kind==='break-even'){const entry=check('entry',0,true),f=fee();const price=v.direction==='short'?entry*(1-f)/(1+f):entry*(1+f)/(1-f);return{headline:price,unit:'USDT break-even price',items:[['Price change needed',Math.abs(price-entry)/entry*100,'%'],['Fee per side',f*100,'%']]}}
  if(kind==='funding-cost'){const notional=check('notional',0,true),periods=check('periods',0,true);if(!Number.isInteger(periods))throw Error('Use a whole number of funding payments.');if(!Number.isFinite(v.rate)||Math.abs(v.rate)>100)throw Error('Enter a funding rate between -100% and 100%.');const payment=notional*v.rate/100*(v.direction==='short'?-1:1);return{headline:payment*periods,unit:'USDT funding cost',items:[['Cost per payment',payment,'USDT'],['Number of payments',periods,''],['Position notional',notional,'USDT']]}}
  throw Error('Unknown calculator');
}
if(typeof module!=='undefined')module.exports={calculate};root.FRCalculate=calculate;
if(typeof document==='undefined')return;
const form=document.querySelector('[data-calculator]');if(!form)return;const result=document.getElementById('result');
const param=Number(new URLSearchParams(location.search).get('entry'));if(param>0&&Number.isFinite(param)&&form.elements.entry)form.elements.entry.value=param;
function update(){try{const values={};for(const el of form.elements)if(el.name)values[el.name]=el.tagName==='SELECT'?el.value:(el.value.trim()===''?NaN:Number(el.value));const r=calculate(form.dataset.calculator,values);if(!Number.isFinite(r.headline)||r.items.some(i=>!Number.isFinite(i[1])))throw Error('Values are too large. Use smaller inputs.');const fmt=n=>n.toLocaleString('en-US',{maximumFractionDigits:8});result.className='';result.innerHTML=`<span>Estimated result</span><b>${fmt(r.headline)}</b><span>${r.unit}</span><dl>${r.items.map(i=>`<dt>${i[0]}</dt><dd>${fmt(i[1])} ${i[2]}</dd>`).join('')}</dl>`}catch(e){result.className='error';result.textContent=e.message}}
form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
})(typeof window!=='undefined'?window:globalThis);
