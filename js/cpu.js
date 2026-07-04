'use strict';

const RN=['zero','ra','sp','gp','tp','t0','t1','t2','s0','s1','a0','a1','a2','a3','a4','a5','a6','a7','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','t3','t4','t5','t6'];
const MEM=1<<23;

class CPU{
  constructor(){this.mem=new Uint8Array(MEM);this.regs=new Int32Array(32);this.pc=0;this.halted=false;this.exitCode=0;this.count=0;this.out=[];this.regs[2]=MEM-4}
  reset(){this.mem.fill(0);this.regs.fill(0);this.regs[2]=MEM-4;this.pc=0;this.halted=false;this.exitCode=0;this.count=0;this.out=[]}
  load(b,a=0){for(let i=0;i<b.length&&a+i<MEM;i++)this.mem[a+i]=b[i]}
  r8(a){return(a>>>=0)<MEM?this.mem[a]:0}
  r16(a){return this.r8(a)|(this.r8(a+1)<<8)}
  r32(a){return(this.r8(a)|(this.r8(a+1)<<8)|(this.r8(a+2)<<16)|(this.r8(a+3)<<24))>>>0}
  w8(a,v){if((a>>>=0)<MEM)this.mem[a]=v&255}
  w16(a,v){this.w8(a,v);this.w8(a+1,(v>>8)&255)}
  w32(a,v){this.w8(a,v);this.w8(a+1,(v>>8)&255);this.w8(a+2,(v>>16)&255);this.w8(a+3,(v>>>24)&255)}
  sx(v,b){const s=32-b;return(v<<s)>>s}
  iI(i){return(i>>20)|((i&0x80000000)?0xFFFFF000:0)}
  iS(i){let v=((i>>25)&127)<<5|(i>>7&31);return(i&0x80000000)?v|0xFFFFF000:v}
  iB(i){let v=((i>>31)&1)<<12|((i>>7)&1)<<11|((i>>25)&63)<<5|((i>>8)&15)<<1;return(i&0x80000000)?v-8192:v}
  iU(i){return i&0xFFFFF000}
  iJ(i){let v=((i>>31)&1)<<20|((i>>12)&255)<<12|((i>>20)&1)<<11|((i>>21)&1023)<<1;return(i&0x80000000)?v-(1<<21):v}

  step(){
    if(this.halted)return;
    const pc=this.pc>>>0,I=this.r32(pc);
    const op=I&127,rd=(I>>7)&31,f3=(I>>12)&7,rs1=(I>>15)&31,rs2=(I>>20)&31,f7=(I>>25)&127;
    let npc=(pc+4)>>>0,rdv=0,wr=false;
    const R=r=>this.regs[r],U=r=>this.regs[r]>>>0;
    switch(op){
      case 0x37:rdv=this.iU(I)>>>0;wr=true;break;
      case 0x17:rdv=(pc+this.iU(I))>>>0;wr=true;break;
      case 0x6F:rdv=npc;npc=(pc+this.iJ(I))>>>0;wr=true;break;
      case 0x67:rdv=npc;npc=((R(rs1)+this.iI(I))&~1)>>>0;wr=true;break;
      case 0x63:{const im=this.iB(I),v1=R(rs1),v2=R(rs2),u1=U(rs1),u2=U(rs2);
        let tk=false;
        if(f3===0)tk=v1===v2;else if(f3===1)tk=v1!==v2;else if(f3===4)tk=v1<v2;
        else if(f3===5)tk=v1>=v2;else if(f3===6)tk=u1<u2;else if(f3===7)tk=u1>=u2;
        if(tk)npc=(pc+im)>>>0;break;}
      case 0x03:{const ad=(R(rs1)+this.iI(I))>>>0;
        if(f3===0)rdv=this.sx(this.r8(ad),8);else if(f3===1)rdv=this.sx(this.r16(ad),16);
        else if(f3===2)rdv=this.r32(ad);else if(f3===4)rdv=this.r8(ad);else if(f3===5)rdv=this.r16(ad);
        wr=true;break;}
      case 0x23:{const ad=(R(rs1)+this.iS(I))>>>0,v=R(rs2);
        if(f3===0)this.w8(ad,v);else if(f3===1)this.w16(ad,v);else if(f3===2)this.w32(ad,v);break;}
      case 0x13:{const im=this.iI(I),s=R(rs1),u=U(rs1);
        if(f3===0)rdv=s+im;else if(f3===2)rdv=s<im?1:0;else if(f3===3)rdv=u<(im>>>0)?1:0;
        else if(f3===4)rdv=s^im;else if(f3===6)rdv=s|im;else if(f3===7)rdv=s&im;
        else if(f3===1)rdv=u<<(im&31);
        else if(f3===5){const sh=im&31;rdv=f7===0x20?s>>sh:u>>sh;}
        wr=true;break;}
      case 0x33:{const v1=R(rs1),v2=R(rs2),u1=U(rs1),u2=U(rs2);
        if(f3===0)rdv=f7===0x20?v1-v2:v1+v2;else if(f3===1)rdv=u1<<(u2&31);
        else if(f3===2)rdv=v1<v2?1:0;else if(f3===3)rdv=u1<u2?1:0;
        else if(f3===4)rdv=v1^v2;
        else if(f3===5){const sh=u2&31;rdv=f7===0x20?v1>>sh:u1>>sh;}
        else if(f3===6)rdv=v1|v2;else if(f3===7)rdv=v1&v2;
        wr=true;break;}
      case 0x73:{const sn=this.regs[17]>>>0;
        if(sn===10||sn===17){this.halted=true;this.exitCode=this.regs[10];}
        else if(sn===1)this.out.push(''+this.regs[10]);
        else if(sn===11)this.out.push(String.fromCharCode(this.regs[10]&255));
        else if(sn===4){let s='',a=this.regs[10]>>>0;for(let i=0;i<512;i++){const c=this.r8(a+i);if(!c)break;s+=String.fromCharCode(c);}this.out.push(s);}
        else this.out.push('[ecall '+sn+' no impl]');
        break;}
      default:
        this.out.push('[ERROR] opcode 0x'+op.toString(16)+' desconocido @ 0x'+pc.toString(16).padStart(8,'0'));
        this.halted=true;
    }
    if(wr&&rd!==0)this.regs[rd]=rdv;
    this.regs[0]=0;
    if(!this.halted)this.pc=npc;
    this.count++;
  }

  disasm(I,pc){
    const op=I&127,rd=(I>>7)&31,f3=(I>>12)&7,rs1=(I>>15)&31,rs2=(I>>20)&31,f7=(I>>25)&127;
    const n=RN,h=v=>'0x'+(v>>>0).toString(16).padStart(8,'0');
    const iI=this.iI(I),iS=this.iS(I),iB=this.iB(I),iJ=this.iJ(I),uU=((this.iU(I))>>>12)&0xFFFFF;
    switch(op){
      case 0x37:return['lui',`${n[rd]}, 0x${uU.toString(16)}`,'U'];
      case 0x17:return['auipc',`${n[rd]}, 0x${uU.toString(16)}`,'U'];
      case 0x6F:return['jal',`${n[rd]}, ${h(pc+iJ)}`,'J'];
      case 0x67:return['jalr',`${n[rd]}, ${n[rs1]}, ${iI}`,'J'];
      case 0x63:{const t={0:'beq',1:'bne',4:'blt',5:'bge',6:'bltu',7:'bgeu'}[f3]||'b?';return[t,`${n[rs1]}, ${n[rs2]}, ${h(pc+iB)}`,'B'];}
      case 0x03:{const t={0:'lb',1:'lh',2:'lw',4:'lbu',5:'lhu'}[f3]||'l?';return[t,`${n[rd]}, ${iI}(${n[rs1]})`,'L'];}
      case 0x23:{const t={0:'sb',1:'sh',2:'sw'}[f3]||'s?';return[t,`${n[rs2]}, ${iS}(${n[rs1]})`,'S'];}
      case 0x13:{
        if(f3===1)return['slli',`${n[rd]}, ${n[rs1]}, ${iI&31}`,'I'];
        if(f3===5)return[f7===0x20?'srai':'srli',`${n[rd]}, ${n[rs1]}, ${iI&31}`,'I'];
        const t={0:'addi',2:'slti',3:'sltiu',4:'xori',6:'ori',7:'andi'}[f3]||'i?';
        return[t,`${n[rd]}, ${n[rs1]}, ${iI}`,'I'];}
      case 0x33:{
        if(f3===0)return[f7===0x20?'sub':'add',`${n[rd]}, ${n[rs1]}, ${n[rs2]}`,'R'];
        if(f3===5)return[f7===0x20?'sra':'srl',`${n[rd]}, ${n[rs1]}, ${n[rs2]}`,'R'];
        const t={1:'sll',2:'slt',3:'sltu',4:'xor',6:'or',7:'and'}[f3]||'r?';
        return[t,`${n[rd]}, ${n[rs1]}, ${n[rs2]}`,'R'];}
      case 0x73:return['ecall','','SYS'];
      default:return['???',`op=0x${op.toString(16)}`,'?'];
    }
  }
}

