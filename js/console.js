// ── Consola ────────────────────────────────────────────────
const cout=document.getElementById('console-out');
function clog(msg,cls='co-dim'){
  const d=document.createElement('div');d.className='co-line '+cls;d.textContent=msg;
  cout.appendChild(d);cout.scrollTop=cout.scrollHeight;
}
function flushOut(){if(cpu.out.length){cpu.out.forEach(s=>clog(s,'co-out'));cpu.out=[];}}

function execCmd(raw){
  raw=raw.trim();if(!raw)return;
  const parts=raw.split(/\s+/),cmd=parts[0].toLowerCase();
  clog('› '+raw,'co-cmd');
  const parseA=s=>{s=(s||'').trim();return(s.startsWith('0x')||s.startsWith('0X'))?parseInt(s,16)>>>0:parseInt(s,10)>>>0;};
  switch(cmd){
    case 'step':case 's':{
      const n=parseInt(parts[1])||1;
      prev.set(cpu.regs);
      for(let i=0;i<n&&!cpu.halted;i++)cpu.step();
      flushOut();renderAll();
      clog(`PC=${p8(cpu.pc)}  instrucciones=${cpu.count}`,'co-dim');
      if(cpu.halted)clog(`Programa detenido. Código de salida: ${cpu.exitCode}`,'co-info');
      break;}
    case 'run':case 'r':{
      prev.set(cpu.regs);let n=0;
      while(!cpu.halted&&n<5000000){cpu.step();n++;}
      flushOut();renderAll();
      clog(`Ejecutadas ${n.toLocaleString()} instrucciones. Exit: ${cpu.exitCode}`,'co-info');break;}
    case 'pc':clog(`pc = ${p8(cpu.pc)}`,'co-ok');break;
    case 'regs':
      if(parts[1]){
        for(let i=1;i<parts.length;i++){const t=parts[i];
          for(let r=0;r<32;r++)if(t==='x'+r||t===RN[r])clog(`x${r} (${RN[r]}) = ${p8(cpu.regs[r])}  (${cpu.regs[r]})`,'co-ok');}
      } else {
        clog(`pc = ${p8(cpu.pc)}`,'co-ok');
        for(let i=0;i<32;i++)clog(`x${i.toString().padStart(2)} (${RN[i].padEnd(4)}) = ${ph(cpu.regs[i]>>>0)}  (${cpu.regs[i]})`,'co-ok');}
      break;
    case 'mem':{
      const a=parseA(parts[1]);const end=parts[2]?parseA(parts[2]):a+15;
      renderMem(a);
      for(let row=a;row<=end;row+=16){let ln='';
        for(let i=0;i<16&&row+i<=end;i++)ln+=cpu.mem[(row+i)>>>0].toString(16).padStart(2,'0')+' ';
        clog(`${ph(row)}: ${ln.trim()}`,'co-ok');}
      break;}
    case 'disasm':case 'd':{
      const a=parseA(parts[1])||cpu.pc,n=parseInt(parts[2])||8;
      for(let i=0;i<n;i++){const addr=(a+i*4)>>>0;const I=cpu.r32(addr);const[mn,ops]=cpu.disasm(I,addr);
        clog(`${addr===cpu.pc>>>0?'▶':' '} ${ph(addr)}  ${ph(I)}  ${mn} ${ops}`,'co-ok');}
      break;}
    case 'reset':cpu.reset();prev.fill(0);memAddr=0;renderAll();clog('Simulador reseteado.','co-info');break;
    case 'info':
      clog(`PC=${p8(cpu.pc)} | count=${cpu.count} | halted=${cpu.halted} | exit=${cpu.exitCode}`,'co-info');
      clog(`sp=${p8(cpu.regs[2])} | ra=${p8(cpu.regs[1])} | a0=${p8(cpu.regs[10])}`,'co-info');break;
    case 'help':
      ['step [N]        — ejecutar N instrucciones (default 1)',
       'run             — ejecutar hasta halt (máx 5M instrucciones)',
       'pc              — mostrar PC actual',
       'regs [x0..x31] — mostrar registros (sin args: todos)',
       'mem <addr> [end]— ver memoria en hex',
       'disasm [addr] N — desensamblar N instrucciones',
       'reset           — reiniciar simulador completo',
       'info            — estado general del simulador'
      ].forEach(l=>clog(l,'co-dim'));break;
    default:clog(`Comando desconocido: '${cmd}'. Escribe 'help'.`,'co-err');
  }
}

