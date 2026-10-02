import {spawn} from "node:child_process";
const BASE="https://fapi.binance.com";const j=async p=>{let r=await fetch(BASE+p);if(!r.ok)throw new Error(String(r.status));return r.json()};
const run=(s,tf)=>new Promise(res=>{let o="",e="";let p=spawn(process.execPath,["src/walkforward.mjs",s,tf],{cwd:process.cwd()});p.stdout.on("data",d=>o+=d);p.stderr.on("data",d=>e+=d);p.on("close",c=>{try{res(JSON.parse(o))}catch{res({symbol:s,interval:tf,error:e||"exit "+c})}})});
const ex=await j("/fapi/v1/exchangeInfo"),tick=await j("/fapi/v1/ticker/24hr"),vol=new Map(tick.map(x=>[x.symbol,+x.quoteVolume]));
const minVol=+(process.env.MIN_QUOTE_VOLUME||5e6),max=+(process.env.MAX_MARKETS||0);
let syms=ex.symbols.filter(x=>x.status==="TRADING"&&x.contractType==="PERPETUAL"&&x.quoteAsset==="USDT"&&(vol.get(x.symbol)||0)>=minVol).sort((a,b)=>(vol.get(b.symbol)||0)-(vol.get(a.symbol)||0)).map(x=>x.symbol);if(max>0)syms=syms.slice(0,max);
const tfs=(process.env.TIMEFRAMES||"15m,1h").split(","),jobs=syms.flatMap(s=>tfs.map(tf=>[s,tf]));let results=[];
for(let i=0;i<jobs.length;i+=2){results.push(...await Promise.all(jobs.slice(i,i+2).map(([s,tf])=>run(s,tf))));await new Promise(r=>setTimeout(r,300))}
const valid=results.filter(x=>!x.error&&x.outOfSample&&x.outOfSample.trades>=20);
const survivors=valid.filter(x=>x.outOfSample.profitFactor>=1.15&&x.outOfSample.returnPct>0&&x.outOfSample.maxDD<=20).sort((a,b)=>b.outOfSample.profitFactor-a.outOfSample.profitFactor);
console.log(JSON.stringify({generatedAt:new Date().toISOString(),mode:"RESEARCH_ONLY",universe:{symbols:syms.length,timeframes:tfs,jobs:jobs.length},gates:{minOosTrades:20,minOosProfitFactor:1.15,positiveOosReturn:true,maxOosDrawdownPct:20},survivors,all:results},null,2));