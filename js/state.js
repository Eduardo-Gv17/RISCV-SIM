// ── Estado global ──────────────────────────────────────────
const cpu=new CPU();
let prev=new Int32Array(32);
let memAddr=0;
const p8=v=>'0x'+(v>>>0).toString(16).padStart(8,'0');
const ph=v=>(v>>>0).toString(16).padStart(8,'0');

