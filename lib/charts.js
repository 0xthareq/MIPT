/* ---------- util ---------- */
var NS='http://www.w3.org/2000/svg';
function s(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function h(t,a){a=a||{};var e=document.createElement(t);for(var k in a){if(k==='class')e.className=a[k];else if(k==='text')e.textContent=a[k];else e.setAttribute(k,a[k]);}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null)continue;if(Array.isArray(c))c.forEach(function(x){if(x!=null)e.append(x);});else e.append(c);}return e;}
function fmt(v){return v==null?'–':Number(v).toLocaleString('id-ID');}
function sum(a){return a.reduce(function(x,v){return x+(v||0);},0);}
function sumTo(a,m){return a?sum(a.slice(0,m)):null;}
function has(a){return !!a&&a.some(function(v){return v!=null;});}
function nice(max,ticks){ticks=ticks||4;if(max<=0)return{max:1,step:1};var raw=max/ticks,mag=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/mag;
  var step=(f<=1?1:f<=2?2:f<=5?5:10)*mag;return{max:Math.ceil(max/step-1e-9)*step,step:step};}
function pctTxt(v){return v==null||!isFinite(v)?'–':Math.round(v)+'%';}
function annual(o,y){var a=o[y];return a?sum(a):null;}

/* ---------- tooltip ---------- */
var tip=null;
function ensureTip(){if(!tip){tip=h('div',{class:'tip',role:'status'});document.body.append(tip);}return tip;}
function showTip(x,y,title,rows){
  ensureTip();
  tip.replaceChildren(h('div',{class:'tt',text:title}));
  rows.forEach(function(r){tip.append(h('div',{class:'tr'},r.key?h('span',{class:'key line',style:'background:'+r.key}):null,h('strong',{text:r.value}),h('span',{class:'n',text:r.name})));});
  tip.style.display='block';
  var tw=tip.offsetWidth,th=tip.offsetHeight,px=x+14,py=y-th-12;
  if(px+tw>window.innerWidth-8)px=x-tw-14;
  if(px<8)px=8;
  if(py<8)py=y+16;
  tip.style.left=px+'px';tip.style.top=py+'px';
}
function hideTip(){if(tip)tip.style.display='none';}

function bindHover(svg,hits,onShow,onHide,vertical){
  var ki=-1;
  hits.forEach(function(r,i){
    r.addEventListener('pointermove',function(e){ki=i;onShow(i,e.clientX,e.clientY);});
    r.addEventListener('pointerleave',function(){onHide(i);});
  });
  svg.addEventListener('keydown',function(e){
    var nx=vertical?'ArrowDown':'ArrowRight',pv=vertical?'ArrowUp':'ArrowLeft';
    if(e.key===nx)ki=Math.min(hits.length-1,ki+1);else if(e.key===pv)ki=Math.max(0,ki<0?0:ki-1);
    else if(e.key==='Escape'){hits.forEach(function(_,i){onHide(i);});return;}else return;
    e.preventDefault();var r=hits[ki].getBoundingClientRect();
    hits.forEach(function(_,i){if(i!==ki)onHide(i);});
    onShow(ki,r.left+r.width/2,r.top+Math.min(r.height/2,40));
  });
  svg.addEventListener('blur',function(){hits.forEach(function(_,i){onHide(i);});});
}

/* ---------- grafik garis ---------- */
function drawLine(sp,w){
  var H=sp.height||250,m={l:38,r:16,t:12,b:26},iw=w-m.l-m.r,ih=H-m.t-m.b,n=sp.cats.length;
  var vals=[];sp.series.forEach(function(q){q.values.forEach(function(v){if(v!=null)vals.push(v);});});
  var sc=nice(Math.max(1,Math.max.apply(null,vals.concat([1])))*1.04),max=sc.max,step=sc.step;
  var X=function(i){return m.l+(n>1?i*iw/(n-1):iw/2);},Yv=function(v){return m.t+ih-v/max*ih;};
  var svg=s('svg',{viewBox:'0 0 '+w+' '+H,width:w,height:H,class:'chart',role:'img','aria-label':sp.aria||'Grafik garis',tabindex:'0'});
  if(sp.hiX!=null&&sp.hiX>=0){var bw=iw/Math.max(1,n-1);s('rect',{x:Math.max(m.l,X(sp.hiX)-bw/2),y:m.t,width:Math.min(bw,iw),height:ih,class:'band'},svg);}
  for(var v=0;v<=max+1e-9;v+=step){s('line',{x1:m.l,x2:w-m.r,y1:Yv(v),y2:Yv(v),class:v===0?'axis':'grid'},svg);
    var t=s('text',{x:m.l-6,y:Yv(v)+4,'text-anchor':'end',class:'tick'},svg);t.textContent=sp.yfmt?sp.yfmt(v):fmt(v);}
  var every=iw/n<30?2:1;
  sp.cats.forEach(function(c,i){if(i%every===0||i===n-1&&every===1){var t=s('text',{x:X(i),y:H-8,'text-anchor':'middle',class:'tick'},svg);t.textContent=c;}});
  sp.series.forEach(function(q){
    var d='',pen=false,li=-1;
    q.values.forEach(function(v,i){if(v==null){pen=false;return;}d+=(pen?'L':'M')+X(i).toFixed(1)+' '+Yv(v).toFixed(1);pen=true;li=i;});
    if(d)s('path',{d:d,fill:'none',stroke:q.color,'stroke-width':2,'stroke-linejoin':'round','stroke-linecap':'round'},svg);
    if(li>=0)s('circle',{cx:X(li),cy:Yv(q.values[li]),r:4,fill:q.color,stroke:'var(--surface)','stroke-width':2},svg);
  });
  var cross=s('line',{y1:m.t,y2:m.t+ih,class:'cross',style:'display:none'},svg);
  var dots=sp.series.map(function(q){return s('circle',{r:4,fill:q.color,stroke:'var(--surface)','stroke-width':2,style:'display:none'},svg);});
  var hit=s('rect',{x:m.l,y:m.t,width:iw,height:ih,fill:'transparent'},svg);
  function at(i,cx,cy){
    cross.setAttribute('x1',X(i));cross.setAttribute('x2',X(i));cross.style.display='';
    dots.forEach(function(d,k){var v=sp.series[k].values[i];if(v==null)d.style.display='none';else{d.setAttribute('cx',X(i));d.setAttribute('cy',Yv(v));d.style.display='';}});
    showTip(cx,cy,sp.tt?sp.tt(i):sp.cats[i],sp.series.map(function(q){return{key:q.color,name:q.name,value:q.values[i]==null?'–':(sp.vfmt?sp.vfmt(q.values[i]):fmt(q.values[i]))};}));
  }
  function off(){cross.style.display='none';dots.forEach(function(d){d.style.display='none';});hideTip();}
  hit.addEventListener('pointermove',function(e){var r=svg.getBoundingClientRect(),px=(e.clientX-r.left)*(w/r.width);
    var i=Math.max(0,Math.min(n-1,Math.round((px-m.l)/(iw/Math.max(1,n-1)))));at(i,e.clientX,e.clientY);});
  hit.addEventListener('pointerleave',off);
  var ki=n-1;
  svg.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight')ki=Math.min(n-1,ki+1);else if(e.key==='ArrowLeft')ki=Math.max(0,ki-1);else if(e.key==='Escape'){off();return;}else return;
    e.preventDefault();var r=svg.getBoundingClientRect();at(ki,r.left+X(ki)*r.width/w,r.top+r.height/2);});
  svg.addEventListener('blur',off);
  return svg;
}

/* ---------- grafik kolom (tunggal, bertumpuk, persen) ---------- */
function roundTop(x,y,w,hh,r){x=+x;y=+y;w=+w;hh=+hh;r=Math.min(r,hh,w/2);return'M'+x+','+(y+hh)+' V'+(y+r)+' a'+r+','+r+' 0 0 1 '+r+',-'+r+' H'+(x+w-r)+' a'+r+','+r+' 0 0 1 '+r+','+r+' V'+(y+hh)+' Z';}
function drawCol(sp,w){
  var gl=sp.groups?20:0,H=sp.height||250,m={l:38,r:12,t:18,b:26+gl},iw=w-m.l-m.r,ih=H-m.t-m.b,n=sp.cats.length,slot=iw/n;
  var pc=!!sp.percent,stack=sp.series.length>1;
  var tot=function(i){return sp.series.reduce(function(a,q){return a+(q.values[i]||0);},0);};
  var mx=1;for(var i0=0;i0<n;i0++)mx=Math.max(mx,tot(i0));(sp.targets||[]).forEach(function(v){if(v!=null)mx=Math.max(mx,v);});
  var sc=pc?{max:100,step:25}:nice(mx*1.06),max=sc.max,step=sc.step;
  var Yv=function(v){return m.t+ih-v/max*ih;},bw=Math.min(sp.maxBar||24,slot*0.64);
  var svg=s('svg',{viewBox:'0 0 '+w+' '+H,width:w,height:H,class:'chart',role:'img','aria-label':sp.aria||'Grafik kolom',tabindex:'0'});
  if(sp.hiX!=null&&sp.hiX>=0)s('rect',{x:m.l+slot*sp.hiX,y:m.t,width:slot,height:ih,class:'band'},svg);
  for(var v=0;v<=max+1e-9;v+=step){s('line',{x1:m.l,x2:w-m.r,y1:Yv(v),y2:Yv(v),class:v===0?'axis':'grid'},svg);
    var t=s('text',{x:m.l-6,y:Yv(v)+4,'text-anchor':'end',class:'tick'},svg);t.textContent=pc?v+'%':fmt(v);}
  var every=Math.max(1,Math.ceil(26/slot));
  sp.cats.forEach(function(c,i){if(i%every===0){var t=s('text',{x:m.l+slot*(i+.5),y:m.t+ih+15,'text-anchor':'middle',class:'tick'},svg);t.textContent=c;}});
  if(sp.groups)sp.groups.forEach(function(g){var x0=m.l+slot*g.from+3,x1=m.l+slot*(g.to+1)-3,yy=m.t+ih+24;
    s('line',{x1:x0,x2:x1,y1:yy,y2:yy,class:'grp'},svg);var t=s('text',{x:(x0+x1)/2,y:yy+12,'text-anchor':'middle',class:'glab'},svg);t.textContent=g.label;});
  var groups=[],hits=[];
  for(var i=0;i<n;i++){
    var g=s('g',{class:'bar-g'},svg),cx=m.l+slot*(i+.5),cum=0,first=true,T=tot(i),lastK=-1;
    sp.series.forEach(function(q,k){if(q.values[i])lastK=k;});
    sp.series.forEach(function(q,k){
      var val=q.values[i];if(!val)return;
      var share=pc?val/T*100:val,y0=Yv(cum),y1=Yv(cum+share),hh=y0-y1-(first?0:2);cum+=share;first=false;
      if(hh<=0)return;
      if(k===lastK)s('path',{d:roundTop((cx-bw/2).toFixed(1),y1.toFixed(1),bw.toFixed(1),hh.toFixed(1),4),fill:q.color},g);
      else s('rect',{x:cx-bw/2,y:y1,width:bw,height:hh,fill:q.color},g);
    });
    if(sp.targets&&sp.targets[i]!=null)s('line',{x1:cx-bw/2-3,x2:cx+bw/2+3,y1:Yv(sp.targets[i]),y2:Yv(sp.targets[i]),stroke:'var(--ink)','stroke-width':2,'stroke-linecap':'round'},g);
    if(sp.labelIdx&&sp.labelIdx.indexOf(i)>=0&&T>0&&!pc){var lt=s('text',{x:cx,y:Yv(T)-6,'text-anchor':'middle',class:'val'},g);lt.textContent=fmt(T);}
    var hit=s('rect',{x:m.l+slot*i,y:m.t,width:slot,height:ih,fill:'transparent'},g);
    groups.push(g);hits.push(hit);
  }
  function show(i,cx,cy){
    svg.classList.add('has-hov');groups.forEach(function(g,k){g.classList.toggle('is-hov',k===i);});
    var rows=sp.series.map(function(q){return{key:q.color,name:q.name,value:fmt(q.values[i])+(pc&&tot(i)>0?' ('+Math.round((q.values[i]||0)/tot(i)*100)+'%)':'')};});
    if(stack)rows.push({name:'Total',value:fmt(tot(i))});
    if(sp.targets&&sp.targets[i]!=null)rows.push({name:'Target',value:fmt(sp.targets[i])});
    showTip(cx,cy,sp.tt?sp.tt(i):sp.cats[i],rows);
  }
  function hide(){svg.classList.remove('has-hov');groups.forEach(function(g){g.classList.remove('is-hov');});hideTip();}
  bindHover(svg,hits,show,hide,false);
  return svg;
}

/* ---------- grafik batang horizontal ---------- */
function roundRight(x,y,w,hh,r){x=+x;y=+y;w=+w;hh=+hh;r=Math.min(r,w,hh/2);return'M'+x+','+y+' H'+(x+w-r)+' a'+r+','+r+' 0 0 1 '+r+','+r+' V'+(y+hh-r)+' a'+r+','+r+' 0 0 1 -'+r+','+r+' H'+x+' Z';}
function drawH(sp,w){
  var rows=sp.rows,ns=sp.series.length,grp=sp.mode==='group';
  var bh=grp?11:22,bg=grp?3:0,rh=grp?ns*bh+(ns-1)*bg+14:bh+16;
  var longest=0;rows.forEach(function(r){longest=Math.max(longest,r.label.length);});
  var lm=Math.min(w*0.4,longest*6.4+14),m={l:lm,r:40,t:4,b:22},iw=w-m.l-m.r,H=m.t+m.b+rows.length*rh;
  var rv=function(r){return grp?Math.max.apply(null,r.values.map(function(v){return v||0;}).concat([0])):sum(r.values);};
  var mx=1;rows.forEach(function(r){mx=Math.max(mx,rv(r));});
  var sc=nice(mx*1.05),max=sc.max,step=sc.step,X=function(v){return m.l+v/max*iw;};
  var svg=s('svg',{viewBox:'0 0 '+w+' '+H,width:w,height:H,class:'chart',role:'img','aria-label':sp.aria||'Grafik batang',tabindex:'0'});
  for(var v=0;v<=max+1e-9;v+=step){s('line',{x1:X(v),x2:X(v),y1:m.t,y2:H-m.b,class:v===0?'axis':'grid'},svg);
    var t=s('text',{x:X(v),y:H-6,'text-anchor':'middle',class:'tick'},svg);t.textContent=fmt(v);}
  var groups=[],hits=[];
  rows.forEach(function(r,ri){
    var g=s('g',{class:'bar-g'},svg),top=m.t+ri*rh,y0=top+(grp?7:8);
    var lt=s('text',{x:m.l-8,y:top+rh/2+4,'text-anchor':'end',class:'rlab'},g);lt.textContent=r.label;
    if(!grp){
      var cum=0,first=true,lastK=-1;r.values.forEach(function(v2,k){if(v2)lastK=k;});
      r.values.forEach(function(v2,k){
        if(!v2)return;var x0=X(cum)+(first?0:2),x1=X(cum+v2),wv=x1-x0;cum+=v2;first=false;if(wv<=0)return;
        if(k===lastK)s('path',{d:roundRight(x0.toFixed(1),y0,wv.toFixed(1),bh,4),fill:sp.series[k].color},g);
        else s('rect',{x:x0,y:y0,width:wv,height:bh,fill:sp.series[k].color},g);
        if(wv>=String(v2).length*7+12){var tx=s('text',{x:x0+wv/2,y:y0+bh/2+4,'text-anchor':'middle',class:'inlab',fill:sp.series[k].on||'#fff'},g);tx.textContent=v2;}
      });
      var tt=s('text',{x:X(cum)+6,y:y0+bh/2+4,class:'val'},g);tt.textContent=fmt(cum);
    }else{
      r.values.forEach(function(v2,k){
        var yy=y0+k*(bh+bg),wv=Math.max(0,X(v2||0)-m.l);
        if(wv>0)s('path',{d:roundRight(m.l,yy,wv.toFixed(1),bh,4),fill:sp.series[k].color},g);
        if(sp.labelSeries===k&&v2){var tx=s('text',{x:m.l+wv+5,y:yy+bh/2+4,class:'val'},g);tx.textContent=fmt(v2);}
      });
    }
    var hit=s('rect',{x:0,y:top,width:w,height:rh,fill:'transparent'},g);
    groups.push(g);hits.push(hit);
  });
  function show(i,cx,cy){
    svg.classList.add('has-hov');groups.forEach(function(g,k){g.classList.toggle('is-hov',k===i);});
    var r=rows[i],list=sp.series.map(function(q,k){return{key:q.color,name:q.name,value:fmt(r.values[k])};});
    if(!grp)list.push({name:'Total',value:fmt(sum(r.values))});
    showTip(cx,cy,r.label,list);
  }
  function hide(){svg.classList.remove('has-hov');groups.forEach(function(g){g.classList.remove('is-hov');});hideTip();}
  bindHover(svg,hits,show,hide,true);
  return svg;
}

export { s, h, fmt, sum, sumTo, has, nice, pctTxt, drawLine, drawCol, drawH, hideTip };
