import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePtaxYuan,getPtaxQuote,getPtaxYuan} from '../src/ptax.ts';
test('BCB CSV converts decimal commas and validates CNY currency/date',()=>{const csv='30/09/2026;220;A;USD;5,18;5,19;1;1\n30/09/2026;795;A;CNY;0,77260000;0,77270000;6,70450000;6,70460000';assert.equal(parsePtaxYuan(csv,'2026-09-30').sell,.7727);assert.throws(()=>parsePtaxYuan(csv,'2026-09-29'));assert.throws(()=>parsePtaxYuan('30/09/2026;795;A;CNY;0;0;0;0','2026-09-30'));});
if(process.env.PTAX_LIVE==='1'){const dollar=await getPtaxQuote('USD');const yuan=await getPtaxYuan(dollar.quotedAt);console.log({dollar,yuan});assert.equal(dollar.quotedAt.slice(0,10),yuan.quotedAt.slice(0,10));assert.ok(dollar.sell>0&&yuan.sell>0);}
