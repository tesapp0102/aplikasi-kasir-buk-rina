(function(){
"use strict";
var KEY="kasir-bu-rina-v1";
function kc(k){return{Makanan:1,Minuman:2,Snack:3}[k]||4}
var TGL="",foto=null,D={products:[],sales:[],seq:0},cart={},kat="Semua",q="",metode="Tunai",editId=null,lastSale=null,hapusSiap=false;
function api(aksi,body){
  var o=body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{};
  return fetch("api.php?aksi="+aksi,o).then(function(r){if(r.status===401){showLogin();throw new Error("Silakan masuk dulu")}return r.json()}).then(function(j){if(j.error)throw new Error(j.error);return j});
}
function muat(){
  return api("data").then(function(j){D.products=j.products;D.sales=j.sales;D.seq=j.seq;D.minggu=j.minggu;D.user=j.user;hideLogin();renderAll()})
  .catch(function(e){toast("Gagal terhubung ke server: "+e.message)});
}
function save(){}
function $(i){return document.getElementById(i)}
function rp(n){return "Rp"+Math.round(n).toLocaleString("id-ID")}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function num(v){return parseInt(String(v).replace(/\D/g,""),10)||0}
function toast(t){var e=$("toast");e.textContent=t;e.className="toast on";clearTimeout(toast.t);toast.t=setTimeout(function(){e.className="toast"},2000)}
function prod(id){return D.products.filter(function(x){return x.id===id})[0]}
function isToday(t){return new Date(t).toDateString()===new Date().toDateString()}
function jam(t){return new Date(t).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}).replace(".",":")}
function cartItems(){return Object.keys(cart).map(function(k){return{p:prod(+k),q:cart[k]}}).filter(function(x){return x.p})}
function cartTotal(){return cartItems().reduce(function(a,x){return a+x.p.h*x.q},0)}

function renderChips(){
  var ks=["Semua"].concat(D.products.map(function(x){return x.k}).filter(function(v,i,a){return a.indexOf(v)===i}));
  $("chips").innerHTML=ks.map(function(k){return '<button class="chip'+(k===kat?' on':'')+'" data-k="'+esc(k)+'">'+esc(k)+'</button>'}).join("");
}
function renderGrid(){
  var l=D.products.filter(function(x){return(kat==="Semua"||x.k===kat)&&x.n.toLowerCase().indexOf(q)>-1});
  $("grid").innerHTML=l.length?l.map(function(x){
    var c=cart[x.id]||0,cls=x.s<=0?" out":x.s<=5?" low":"";
    return '<button class="p'+cls+'" data-id="'+x.id+'"><span class="im k'+kc(x.k)+'">'+(x.f?'<img src="'+esc(x.f)+'" alt="">':esc(x.e))+'</span><span class="n">'+esc(x.n)+'</span><span class="h">'+rp(x.h)+'</span><span class="s">'+(x.s<=0?"Stok habis":"Stok "+x.s)+'</span>'+(c?'<span class="q">'+c+'</span>':'')+'</button>'
  }).join(""):'<div class="empty" style="grid-column:1/-1">Barang tidak ditemukan. Coba kata lain atau tambah di menu Barang.</div>';
}
function renderCart(){
  var it=cartItems(),t=cartTotal(),n=it.reduce(function(a,x){return a+x.q},0);
  $("lines").innerHTML=it.length?it.map(function(x){return '<div class="line"><div class="t"><b>'+esc(x.p.e+" "+x.p.n)+'</b><span>'+rp(x.p.h)+' &times; '+x.q+' = '+rp(x.p.h*x.q)+'</span></div><div class="qty"><button data-m="'+x.p.id+'" aria-label="Kurangi">&minus;</button><i>'+x.q+'</i><button data-a="'+x.p.id+'" aria-label="Tambah">+</button></div></div>'}).join(""):'<div class="empty">Belum ada pesanan. Ketuk barang untuk menambahkan.</div>';
  $("tot").textContent=rp(t);$("bayar").disabled=!it.length;
  $("barN").textContent=n+" barang";$("barT").textContent=n?"Lihat pesanan "+rp(t):"Belum ada pesanan";
  renderGrid();
}
function add(id){
  var x=prod(id);if(!x)return;var c=cart[id]||0;
  if(x.s<=0){toast(x.n+" sudah habis");return}
  if(c>=x.s){toast("Stok "+x.n+" tinggal "+x.s);return}
  cart[id]=c+1;renderCart();
}
function sub(id){if(cart[id]>1)cart[id]--;else delete cart[id];renderCart();if(!cartItems().length)$("cart").classList.remove("open")}

var dTipe="rp";
function diskon(){var v=num($("dk").value),s=cartTotal();return dTipe==="persen"?Math.round(s*Math.min(v,100)/100):Math.min(v,s)}
function netto(){return cartTotal()-diskon()}
function openBayar(){
  if(!cartTotal())return;
  $("dk").value="";dTipe="rp";segD();$("uang").value="";metode="Tunai";setMetode();refreshBayar();$("ovBayar").classList.add("on");
}
function segD(){Array.prototype.forEach.call($("dtipe").children,function(b){b.classList.toggle("on",b.dataset.t===dTipe)})}
function setMetode(){
  Array.prototype.forEach.call($("metode").children,function(b){b.classList.toggle("on",b.dataset.m===metode)});
  $("tunai").style.display=metode==="Tunai"?"block":"none";
}
function refreshBayar(){
  var t=netto(),d=diskon();
  $("pTot").textContent=rp(t);$("pLbl").textContent=d?"Total (hemat "+rp(d)+")":"Total belanja";
  var o=[5000,10000,20000,50000,100000].filter(function(v){return v>t}).slice(0,4);
  $("quick").innerHTML=[t].concat(o).map(function(v,i){return '<button data-u="'+v+'">'+(i===0?"Uang pas":rp(v))+'</button>'}).join("");
  hitungKemb();
}
function hitungKemb(){
  var t=netto(),u=num($("uang").value),k=u-t,e=$("kemb");
  e.className="change"+(u&&k<0?" bad":"");
  e.innerHTML=u&&k<0?"<span>Uang kurang</span><b>"+rp(-k)+"</b>":"<span>Kembalian</span><b>"+rp(Math.max(k,0))+"</b>";
}
function selesai(){
  var t=netto(),u=metode==="Tunai"?num($("uang").value):t;
  if(metode==="Tunai"&&u<t){toast("Uang yang diterima masih kurang");return}
  var items=cartItems().map(function(x){return{id:x.p.id,q:x.q}});
  $("selesai").disabled=true;
  api("bayar",{items:items,metode:metode,bayar:u,diskon:{tipe:dTipe,nilai:num($("dk").value)}}).then(function(sale){
    lastSale=sale;cart={};
    $("ovBayar").classList.remove("on");$("cart").classList.remove("open");
    showStruk(sale);return muat();
  }).catch(function(e){toast(e.message)}).then(function(){$("selesai").disabled=false});
}
function strukHTML(s){
  var d=new Date(s.t).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"});
  return '<div class="c"><b>WARUNG BU RINA</b><br>Struk #'+String(s.no).padStart(4,"0")+'<br>'+d+' '+jam(s.t)+'<br>Kasir: '+esc(s.kasir||"-")+'</div><hr>'+
  s.items.map(function(i){return '<div class="l"><span>'+esc(i.n)+' x'+i.q+'</span><span>'+rp(i.h*i.q)+'</span></div>'}).join("")+'<hr>'+
  (s.diskon?'<div class="l"><span>Diskon</span><span>-'+rp(s.diskon)+'</span></div>':'')+
  '<div class="l"><b>Total</b><b>'+rp(s.total)+'</b></div><div class="l"><span>'+s.metode+'</span><span>'+rp(s.bayar)+'</span></div>'+
  (s.metode==="Tunai"?'<div class="l"><span>Kembali</span><span>'+rp(s.kemb)+'</span></div>':'')+'<hr><div class="c">Terima kasih, silakan datang lagi!</div>';
}
function showStruk(s){$("struk").innerHTML=strukHTML(s);$("ovStruk").classList.add("on")}
function strukTeks(s){
  return "*Warung Bu Rina* - Struk #"+String(s.no).padStart(4,"0")+"\n"+s.items.map(function(i){return i.n+" x"+i.q+" = "+rp(i.h*i.q)}).join("\n")+"\n*Total: "+rp(s.total)+"* ("+s.metode+")\nTerima kasih, silakan datang lagi!";
}

function todaySales(){return D.sales.filter(function(s){return isToday(s.t)})}
function renderLaporan(){
  var ts=todaySales(),omzet=0,laba=0,n=0,map={};
  ts.forEach(function(s){omzet+=s.total;laba-=s.diskon||0;s.items.forEach(function(i){laba+=(i.h-i.m)*i.q;n+=i.q;map[i.n]=(map[i.n]||0)+i.q})});
  $("hOmzet").textContent=rp(omzet);$("chart").innerHTML=chartSVG();
  $("stats").innerHTML='<div class="stat hero"><span>Omzet</span><b>'+rp(omzet)+'</b></div><div class="stat"><span>Perkiraan untung</span><b>'+rp(laba)+'</b></div><div class="stat"><span>Transaksi</span><b>'+ts.length+'</b></div><div class="stat"><span>Barang terjual</span><b>'+n+'</b></div>';
  var b=Object.keys(map).sort(function(a,c){return map[c]-map[a]}).slice(0,5);
  $("best").innerHTML=b.length?b.map(function(k,i){return '<div class="row"><div class="t"><b>'+(i+1)+'. '+esc(k)+'</b></div><div class="r">'+map[k]+' terjual</div></div>'}).join(""):'<div class="empty">Belum ada penjualan hari ini.</div>';
  $("hist").innerHTML=ts.length?ts.slice().reverse().map(function(s){
    return '<button class="row" data-s="'+s.no+'"><div class="t"><b>#'+String(s.no).padStart(4,"0")+' &middot; '+jam(s.t)+'</b><span>'+s.items.map(function(i){return esc(i.n)+" x"+i.q}).join(", ")+'</span></div><div class="r">'+rp(s.total)+'<br><span class="tag">'+s.metode+'</span></div></button>'
  }).join(""):'<div class="empty">Belum ada transaksi. Mulai dari menu Kasir.</div>';
}
function laporanTeks(){
  var ts=todaySales(),o=0,l=0;ts.forEach(function(s){o+=s.total;s.items.forEach(function(i){l+=(i.h-i.m)*i.q})});
  return "Laporan Warung Bu Rina\n"+new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+"\nTransaksi: "+ts.length+"\nOmzet: "+rp(o)+"\nPerkiraan untung: "+rp(l);
}
function renderProduk(){
  $("plist").innerHTML=D.products.length?D.products.map(function(x){
    return '<button class="row" data-e="'+x.id+'"><span class="th k'+kc(x.k)+'">'+(x.f?'<img src="'+esc(x.f)+'" alt="">':esc(x.e))+'</span><div class="t"><b>'+esc(x.n)+'</b><span>'+esc(x.k)+' &middot; modal '+rp(x.m)+'</span></div><div class="r">'+rp(x.h)+'<br><span class="tag'+(x.s<=5?' w':'')+'">'+(x.s<=0?"Habis":x.s<=5?"Menipis: "+x.s:"Stok "+x.s)+'</span></div></button>'
  }).join(""):'<div class="empty">Belum ada barang. Ketuk Tambah barang.</div>';
}
function openProd(id){
  editId=id;hapusSiap=false;foto=null;var x=id?prod(id):null;var pv=$("fPrev");pv.src=x&&x.f?x.f:"";pv.style.display=x&&x.f?"block":"none";$("fF").value="";
  $("pjudul").textContent=x?"Ubah barang":"Tambah barang";
  $("fE").value=x?x.e:"";$("fK").value=x?x.k:"Makanan";$("fN").value=x?x.n:"";
  $("fH").value=x?x.h:"";$("fM").value=x?x.m:"";$("fS").value=x?x.s:"";
  var h=$("hapus");h.style.display=x?"block":"none";h.textContent="Hapus barang";
  $("ovProd").classList.add("on");
}
function simpanProd(){
  var n=$("fN").value.trim(),h=num($("fH").value);
  if(!n){toast("Isi nama barang dulu");return}
  if(!h){toast("Isi harga jual dulu");return}
  var o={e:$("fE").value.trim()||"🛒",k:$("fK").value,n:n,h:h,m:num($("fM").value),s:num($("fS").value)};
  o.id=editId||0;if(foto)o.foto_data=foto;
  api("simpan",o).then(function(){$("ovProd").classList.remove("on");toast("Barang tersimpan");return muat()}).catch(function(e){toast(e.message)});
}
function hapusProd(){
  if(!hapusSiap){hapusSiap=true;$("hapus").textContent="Ketuk lagi untuk menghapus";return}
  delete cart[editId];
  api("hapus",{id:editId}).then(function(){$("ovProd").classList.remove("on");toast("Barang dihapus");return muat()}).catch(function(e){toast(e.message)});
}
function renderAll(){
  var adm=D.user&&D.user.role==="admin";
  document.querySelector('nav [data-v="produk"]').style.display=adm?"":"none";
  $("csv").style.display=adm?"":"none";
  $("tgl").textContent=TGL+(D.user?" - "+D.user.nama:"");
  renderChips();renderCart();renderLaporan();renderProduk();
}
function showLogin(){$("login").style.display="flex"}
function hideLogin(){$("login").style.display="none";$("lerr").textContent="";$("lp").value=""}
function chartSVG(){
  var m={},days=[],mx=1,i;(D.minggu||[]).forEach(function(r){m[r.d]=r.t});
  for(i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var k=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2),v=m[k]||0;mx=Math.max(mx,v);days.push({l:d.toLocaleDateString("id-ID",{weekday:"short"}),v:v})}
  return '<svg viewBox="0 0 350 145" width="100%" role="img" aria-label="Grafik omzet 7 hari">'+days.map(function(x,i){
    var h=Math.round(x.v/mx*90),X=i*50+8;
    return '<rect x="'+X+'" y="'+(112-h)+'" width="34" height="'+Math.max(h,3)+'" rx="8" fill="'+(i===6?'var(--acc)':'var(--pri)')+'"/><text x="'+(X+17)+'" y="132" text-anchor="middle" font-size="11" fill="var(--mute)">'+x.l+'</text>'+(x.v?'<text x="'+(X+17)+'" y="'+(106-h)+'" text-anchor="middle" font-size="10" font-weight="700" fill="var(--ink)">'+(x.v>=1000?Math.round(x.v/1000)+"rb":x.v)+'</text>':'');
  }).join("")+'</svg>';
}
function view(v){
  Array.prototype.forEach.call(document.querySelectorAll(".view"),function(s){s.classList.toggle("on",s.id===v)});
  Array.prototype.forEach.call(document.querySelectorAll("nav button"),function(b){b.setAttribute("aria-selected",b.dataset.v===v)});
  $("bar").style.display=v==="kasir"?"":"none";
  if(v!=="kasir")$("cart").classList.remove("open");
}

TGL=new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"});$("tgl").textContent=TGL;
document.querySelector("nav").addEventListener("click",function(e){var b=e.target.closest("button");if(b)view(b.dataset.v)});
$("chips").addEventListener("click",function(e){var b=e.target.closest("button");if(b){kat=b.dataset.k;renderChips();renderGrid()}});
$("cari").addEventListener("input",function(){q=this.value.toLowerCase().trim();renderGrid()});
$("grid").addEventListener("click",function(e){var b=e.target.closest(".p");if(b)add(+b.dataset.id)});
$("lines").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.a)add(+b.dataset.a);if(b.dataset.m)sub(+b.dataset.m)});
$("kosong").addEventListener("click",function(){cart={};renderCart();$("cart").classList.remove("open")});
$("bukaCart").addEventListener("click",function(){$("cart").classList.add("open")});
$("tutup").addEventListener("click",function(){$("cart").classList.remove("open")});
$("bayar").addEventListener("click",openBayar);
$("metode").addEventListener("click",function(e){var b=e.target.closest("button");if(b){metode=b.dataset.m;setMetode()}});
$("uang").addEventListener("input",function(){var v=num(this.value);this.value=v?v.toLocaleString("id-ID"):"";hitungKemb()});
$("quick").addEventListener("click",function(e){var b=e.target.closest("button");if(b){$("uang").value=(+b.dataset.u).toLocaleString("id-ID");hitungKemb()}});
$("selesai").addEventListener("click",selesai);
$("wa").addEventListener("click",function(){if(lastSale)window.open("https://wa.me/?text="+encodeURIComponent(strukTeks(lastSale)),"_blank")});
$("cetak").addEventListener("click",function(){window.print()});
$("hist").addEventListener("click",function(e){var b=e.target.closest(".row");if(!b)return;var s=D.sales.filter(function(x){return x.no===+b.dataset.s})[0];if(s){lastSale=s;showStruk(s)}});
$("salin").addEventListener("click",function(){var t=laporanTeks();try{navigator.clipboard.writeText(t).then(function(){toast("Laporan disalin")},function(){toast("Gagal menyalin")})}catch(e){toast("Gagal menyalin")}});
$("tambah").addEventListener("click",function(){openProd(null)});
$("plist").addEventListener("click",function(e){var b=e.target.closest(".row");if(b)openProd(+b.dataset.e)});
$("simpan").addEventListener("click",simpanProd);
$("hapus").addEventListener("click",hapusProd);
Array.prototype.forEach.call(document.querySelectorAll("[data-close]"),function(b){b.addEventListener("click",function(){b.closest(".ov").classList.remove("on")})});
Array.prototype.forEach.call(document.querySelectorAll(".ov"),function(o){o.addEventListener("click",function(e){if(e.target===o)o.classList.remove("on")})});
document.addEventListener("keydown",function(e){if(e.key==="Escape")Array.prototype.forEach.call(document.querySelectorAll(".ov.on"),function(o){o.classList.remove("on")})});
$("dk").addEventListener("input",refreshBayar);
$("dtipe").addEventListener("click",function(e){var b=e.target.closest("button");if(b){dTipe=b.dataset.t;segD();refreshBayar()}});
function masuk(){api("login",{u:$("lu").value,p:$("lp").value}).then(muat).catch(function(e){$("lerr").textContent=e.message})}
$("masuk").addEventListener("click",masuk);
$("lp").addEventListener("keydown",function(e){if(e.key==="Enter")masuk()});
$("keluar").addEventListener("click",function(){api("logout",{}).then(function(){D={products:[],sales:[],seq:0};cart={};renderAll();showLogin()})});
$("fF").addEventListener("change",function(){
  var f=this.files[0];if(!f)return;var r=new FileReader();
  r.onload=function(){var im=new Image();im.onload=function(){
    var c=document.createElement("canvas"),k=Math.min(1,320/Math.max(im.width,im.height));
    c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
    foto=c.toDataURL("image/jpeg",.8);$("fPrev").src=foto;$("fPrev").style.display="block"};im.onerror=function(){toast("Foto tidak bisa dibaca. Coba format JPG atau PNG")};im.src=r.result};
  r.readAsDataURL(f);
});
renderAll();muat();
})();
