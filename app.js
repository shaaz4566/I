const KEY="szc_erp_v1";
const DEFAULTS={
  settings:{businessName:"SZC Websites",website:"szcwebsites.in",email:"shaaz@szcwebsites.in",whatsapp:"+91 9400540669",upi:"9995687641@fam",address:"Kannur, Kerala, India – 670631",currency:"₹",nextInvoice:1,footer:"Thank you for choosing SZC Websites.",signature:"Authorized Signature"},
  customers:[], invoices:[], payments:[], expenses:[], purchases:[], quotations:[], estimates:[], receipts:[], creditNotes:[], debitNotes:[],
  services:[
    ["Website Development","Website Development",25000],["Website Design","Website Design",10000],["Web Application Development","Web Application Development",35000],
    ["Landing Page","Landing Page",7500],["UI/UX Design","UI/UX Design",8000],["HTML Development","HTML Development",5000],
    ["CSS Development","CSS Development",5000],["JavaScript Development","JavaScript Development",7500],["Domain Registration","Domain Registration",999],
    ["Web Hosting","Web Hosting",2000],["Website Maintenance","Website Maintenance",3000],["SEO","SEO",5000],["Custom Software","Custom Software",15000]
  ].map((x,i)=>({id:"svc_"+i,name:x[0],description:x[1],rate:x[2]}))
};
let db=load();
let currentView="dashboard";
let editingInvoice=null;
let toastTimer;

function cloneDefaults(){return JSON.parse(JSON.stringify(DEFAULTS))}
function load(){
  const base=cloneDefaults();
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return base;
    const saved=JSON.parse(raw);
    if(!saved || typeof saved!=="object")return base;
    const merged={...base,...saved,settings:{...base.settings,...(saved.settings||{})}};
    for(const key of ["customers","invoices","payments","expenses","purchases","quotations","estimates","receipts","creditNotes","debitNotes","services"]){
      if(!Array.isArray(merged[key]))merged[key]=base[key];
    }
    if(!Number.isFinite(Number(merged.settings.nextInvoice)) || Number(merged.settings.nextInvoice)<1)merged.settings.nextInvoice=1;
    return merged;
  }catch(err){
    console.warn("SZC ERP local data could not be loaded; starting with safe defaults.",err);
    return base;
  }
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(db));return true}
  catch(err){console.error("SZC ERP could not save local data",err);toast("Could not save locally. Check browser storage permissions.");return false}
}
function resetLocalData(){
  try{localStorage.removeItem(KEY)}catch{}
  db=cloneDefaults(); editingInvoice=null; save(); render(); toast("Local ERP data reset");
}
function showFatalError(err){
  console.error("SZC ERP error",err);
  const content=document.getElementById("content");
  if(!content)return;
  const message=esc(err?.message||String(err)||"Unknown error");
  content.innerHTML=`<div class="card form-card error-card"><div class="error-icon">!</div><div><div class="eyebrow">Application error</div><h1 class="page-title">SZC ERP could not render this page</h1><p class="helper" style="margin-top:10px">The app is still loaded, but one module failed while rendering. Your local data has not been deleted.</p><details style="margin-top:16px"><summary>Technical details</summary><pre class="error-details">${message}</pre></details><div class="actions-row" style="justify-content:flex-start"><button class="primary" onclick="resetLocalData()">Reset local ERP data</button><button class="ghost" onclick="location.reload()">Reload app</button></div></div></div>`;
}
window.addEventListener("error",e=>{if(e.error)showFatalError(e.error)});
window.addEventListener("unhandledrejection",e=>showFatalError(e.reason||new Error("Unhandled promise rejection")));
function money(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function dateStr(v=Date.now()){return new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
function toast(msg){clearTimeout(toastTimer);const e=document.createElement("div");e.className="toast";e.textContent=msg;document.body.appendChild(e);toastTimer=setTimeout(()=>e.remove(),2600)}
function sum(arr,fn=x=>x){return arr.reduce((a,x)=>a+(Number(fn(x))||0),0)}
function statusBadge(s){let c=s==="PAID"?"success":(s==="OVERDUE"||s==="CANCELLED"?"danger":s==="PARTIALLY PAID"?"warning":"");return `<span class="badge ${c}">${esc(s)}</span>`}
function nextInvoice(){let n=String(db.settings.nextInvoice).padStart(4,"0");return `SZC ${new Date().getFullYear()} ${n}`}
function bumpInvoice(){db.settings.nextInvoice++;save()}
function invoiceTotal(inv){return sum(inv.items,i=>i.qty*i.rate*(1-(i.discount||0)/100))}
function thisMonthInvoices(){let d=new Date(),m=d.getMonth(),y=d.getFullYear();return db.invoices.filter(i=>{let x=new Date(i.date);return x.getMonth()===m&&x.getFullYear()===y})}
function setView(v){currentView=v;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===v));render();window.scrollTo({top:0,behavior:"smooth"})}
function bindStatic(){
  document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>setView(b.dataset.view));
  document.getElementById("topCreate")?.addEventListener("click",()=>setView("new-invoice"));
  document.getElementById("themeBtn")?.addEventListener("click",()=>document.body.classList.toggle("dark"));
  document.getElementById("globalSearch")?.addEventListener("input",e=>{if(e.target.value.trim() && currentView!=="invoices")setView("invoices")});
}


function render(){
 const names={"dashboard":"Dashboard","invoices":"Invoices","quotations":"Quotations","estimates":"Estimates","receipts":"Receipts","customers":"Customers","projects":"Projects","services":"Services","payments":"Payments","expenses":"Expenses","purchases":"Purchases","credit-notes":"Credit Notes","debit-notes":"Debit Notes","reports":"Reports","settings":"Settings","backup":"Backup & Restore","new-invoice":"Create Invoice"};
 document.getElementById("crumb").textContent=names[currentView]||"Dashboard";
 const c=document.getElementById("content");
 const f={dashboard:dashboard,invoices:invoiceList,quotations:()=>docList("quotations","Quotation"),estimates:()=>docList("estimates","Estimate"),receipts:()=>docList("receipts","Receipt"),customers:customers,projects:projects,services:services,payments:payments,expenses:expenses,purchases:purchases,"credit-notes":()=>docList("creditNotes","Credit Note"),"debit-notes":()=>docList("debitNotes","Debit Note"),reports:reports,settings:settings,backup:backup,"new-invoice":invoiceForm}[currentView]||dashboard;
 c.innerHTML=f();
 bindDynamic();
}

function dashboard(){
 const mi=thisMonthInvoices(), revenue=sum(mi,invoiceTotal), paid=sum(db.invoices.filter(i=>i.status==="PAID"),invoiceTotal), outstanding=sum(db.invoices.filter(i=>["UNPAID","PARTIALLY PAID","SENT","OVERDUE"].includes(i.status)),invoiceTotal), expenses=sum(db.expenses,e=>e.amount), profit=paid-expenses;
 const paidCount=db.invoices.filter(i=>i.status==="PAID").length, unpaidCount=db.invoices.filter(i=>["UNPAID","SENT","PARTIALLY PAID"].includes(i.status)).length, overdueCount=db.invoices.filter(i=>i.status==="OVERDUE").length;
 return `<div class="page-head"><div><div class="eyebrow">SZC Websites · Local workspace</div><h1 class="page-title">Dashboard</h1></div><div class="page-actions"><button class="ghost" onclick="setView('reports')">View Reports</button><button class="primary" onclick="setView('new-invoice')">+ Create Invoice</button></div></div>
 <div class="grid stats">
  ${stat("This Month",money(revenue),"Revenue")}
  ${stat("Paid",money(paid),"Collected")}
  ${stat("Outstanding",money(outstanding),"Receivable")}
  ${stat("Expenses",money(expenses),"Recorded")}
 </div>
 <div class="grid dashboard-grid">
  <div class="card wide"><div class="card-head"><div><h3>Revenue Analytics</h3><small>Monthly invoice value</small></div><span class="badge">2026</span></div><div class="card-body">${chart()}</div></div>
  <div class="card wide"><div class="card-head"><h3>Invoice Overview</h3><small>${db.invoices.length} total</small></div><div class="card-body">
    ${row("Paid",paidCount,"success")}${row("Unpaid / Sent",unpaidCount,"warning")}${row("Overdue",overdueCount,"danger")}${row("Profit",money(profit),"success")}
  </div></div>
 </div>
 <div class="grid overview-grid">
  <div class="card"><div class="card-head"><h3>Quick Actions</h3></div><div class="card-body"><div class="actions-row" style="justify-content:flex-start"><button class="primary" onclick="setView('new-invoice')">New Invoice</button><button class="ghost" onclick="openCustomerModal()">Add Customer</button><button class="ghost" onclick="setView('services')">Manage Services</button></div></div></div>
  <div class="card"><div class="card-head"><h3>Payment Method</h3></div><div class="card-body"><div class="status-row"><span>UPI</span><strong>${esc(db.settings.upi)}</strong></div><div class="helper">Every invoice QR is generated from the current invoice total.</div></div></div>
 </div>
 ${recentInvoices()}
 `;
}
function stat(label,value,sub){return `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div><div class="trend">● ${sub}</div></div>`}
function row(a,b,c=""){return `<div class="status-row"><span>${a}</span><span class="badge ${c}">${b}</span></div>`}
function chart(){
 const vals=Array.from({length:12},(_,m)=>sum(db.invoices.filter(i=>new Date(i.date).getMonth()===m&&new Date(i.date).getFullYear()===new Date().getFullYear()),invoiceTotal));
 const max=Math.max(...vals,1), w=900,h=230,p=20;
 const points=vals.map((v,i)=>`${p+i*(w-2*p)/11},${h-p-(v/max)*(h-2*p)}`).join(" ");
 const bars=vals.map((v,i)=>{let x=p+i*(w-2*p)/11;let bh=(v/max)*(h-2*p);return `<rect x="${x-8}" y="${h-p-bh}" width="16" height="${bh}" rx="5" fill="rgba(20,20,25,.08)"/>`}).join("");
 return `<div class="legend"><span><i class="dot" style="background:#16161a"></i>Invoice value</span><span>${money(sum(vals))} this year</span></div><div class="chart-wrap"><svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="20" y1="210" x2="880" y2="210" stroke="var(--line)"/><line x1="20" y1="120" x2="880" y2="120" stroke="var(--line)"/><line x1="20" y1="30" x2="880" y2="30" stroke="var(--line)"/>${bars}<polyline fill="none" stroke="currentColor" stroke-width="3" points="${points}" vector-effect="non-scaling-stroke"/></svg></div>`;
}
function recentInvoices(){
 const list=[...db.invoices].sort((a,b)=>b.date-a.date).slice(0,7);
 return `<div class="card table-card"><div class="card-head"><h3>Recent Invoices</h3><button class="ghost" onclick="setView('invoices')">View all</button></div><div class="table-wrap">${list.length?invoiceTable(list):`<div class="empty">No invoices yet. Create your first invoice.</div>`}</div></div>`;
}
function invoiceTable(list){
 return `<table class="table"><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th><th></th></tr></thead><tbody>${list.map(i=>`<tr><td><strong>${esc(i.number)}</strong></td><td>${esc(i.customer.name||"Walk-in customer")}</td><td>${dateStr(i.date)}</td><td>${statusBadge(i.status)}</td><td class="amount">${money(invoiceTotal(i))}</td><td><button class="ghost" onclick="openInvoice('${i.id}')">View</button></td></tr>`).join("")}</tbody></table>`;
}

function invoiceList(){
 const q=(document.getElementById("globalSearch")?.value||"").toLowerCase();
 let list=[...db.invoices].sort((a,b)=>b.date-a.date);
 if(q) list=list.filter(i=>(i.number+" "+i.customer.name+" "+i.status).toLowerCase().includes(q));
 return `<div class="page-head"><div><div class="eyebrow">Sales</div><h1 class="page-title">Invoices</h1></div><div class="page-actions"><button class="ghost" onclick="exportCSV('invoices')">Export CSV</button><button class="primary" onclick="setView('new-invoice')">+ Create Invoice</button></div></div>
 <div class="card table-card" style="margin-top:0"><div class="card-head"><h3>All invoices</h3><small>${list.length} records</small></div><div class="table-wrap">${list.length?invoiceTable(list):`<div class="empty">No invoices found.</div>`}</div></div>`;
}
function openInvoice(id){const i=db.invoices.find(x=>x.id===id); if(!i)return; showInvoiceActions(i)}
function showInvoiceActions(i){
 document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)this.remove()"><div class="modal"><div class="modal-head"><strong>${esc(i.number)}</strong><button class="icon-btn" onclick="this.closest('.modal-backdrop').remove()">×</button></div><div class="modal-body"><div class="status-row"><span>Customer</span><strong>${esc(i.customer.name)}</strong></div><div class="status-row"><span>Total</span><strong>${money(invoiceTotal(i))}</strong></div><div class="status-row"><span>Status</span><span>${statusBadge(i.status)}</span></div><div class="actions-row"><button class="ghost" onclick="editInvoice('${i.id}')">Edit</button><button class="ghost" onclick="printInvoice('${i.id}')">Print / Save PDF</button><button class="primary" onclick="markPaid('${i.id}')">Mark Paid</button></div></div></div></div>`;
}
function markPaid(id){const i=db.invoices.find(x=>x.id===id);if(i){i.status="PAID";db.payments.push({id:"pay_"+Date.now(),invoiceId:id,amount:invoiceTotal(i),date:Date.now(),method:"UPI"});save();document.querySelector(".modal-backdrop")?.remove();toast("Invoice marked as paid");render()}}
function editInvoice(id){document.querySelector(".modal-backdrop")?.remove();editingInvoice=id;setView("new-invoice")}
function invoiceForm(){
 const inv=editingInvoice?db.invoices.find(i=>i.id===editingInvoice):null;
 const customer=inv?.customer||{name:"",company:"",phone:""};
 const items=inv?.items||[{description:"",qty:1,rate:0,discount:0}];
 return `<div class="page-head"><div><div class="eyebrow">Sales · ${inv?"Edit":"New"}</div><h1 class="page-title">${inv?"Edit Invoice":"Create Invoice"}</h1></div><div class="page-actions">${inv?`<button class="ghost" onclick="printInvoice('${inv.id}')">Print / Save PDF</button>`:""}<button class="ghost" onclick="setView('invoices')">Cancel</button></div></div>
 <div class="card form-card">
  <div class="form-grid three">
   <div class="field"><label>Invoice number</label><input id="f_number" value="${esc(inv?.number||nextInvoice())}" ${inv?"disabled":""}></div>
   <div class="field"><label>Invoice date</label><input id="f_date" type="date" value="${inv?new Date(inv.date).toISOString().slice(0,10):new Date().toISOString().slice(0,10)}"></div>
   <div class="field"><label>Status</label><select id="f_status">${["DRAFT","SENT","UNPAID","PARTIALLY PAID","PAID","OVERDUE","CANCELLED"].map(s=>`<option ${s===(inv?.status||"DRAFT")?"selected":""}>${s}</option>`).join("")}</select></div>
  </div>
  <div style="height:1px;background:var(--line);margin:20px 0"></div>
  <div class="form-grid three">
   <div class="field"><label>Customer name *</label><input id="f_name" value="${esc(customer.name)}" placeholder="Customer name"></div>
   <div class="field"><label>Company name</label><input id="f_company" value="${esc(customer.company)}" placeholder="Company name"></div>
   <div class="field"><label>Phone number</label><input id="f_phone" value="${esc(customer.phone)}" placeholder="+91..."></div>
  </div>
  <div class="item-editor"><div class="card-head" style="padding:12px 0;border:0"><h3>Services / Items</h3><button class="ghost" onclick="addInvoiceRow()">+ Add item</button></div><div id="items">${items.map((x,n)=>itemRow(x,n)).join("")}</div></div>
  <div class="invoice-total"><div class="total-line"><span>Subtotal</span><strong id="subtotal">₹0</strong></div><div class="total-line"><span>Discount</span><strong id="discountTotal">₹0</strong></div><div class="total-line grand"><span>Total</span><strong id="grandTotal">₹0</strong></div></div>
  <div class="qr-box"><div class="qr-preview" id="qrPreview"><span class="helper">Enter an amount</span></div><div><h3 style="margin:0 0 7px">UPI payment QR</h3><p class="helper">The QR is generated from the invoice total and your UPI ID <strong>${esc(db.settings.upi)}</strong>. The customer sees the amount pre-filled in their UPI app.</p><div class="status-row"><span>Payment method</span><strong>UPI</strong></div><div class="status-row"><span>Invoice total</span><strong id="qrAmount">₹0</strong></div></div></div>
  <div class="actions-row"><button class="ghost" onclick="saveInvoice('DRAFT')">Save Draft</button><button class="ghost" onclick="saveInvoice()">Save Invoice</button><button class="primary" onclick="saveAndPrint()">Save & Print / Save PDF</button></div>
 </div>`;
}
function itemRow(x,n){return `<div class="item-row" data-index="${n}"><div><label>Description</label><select class="it-desc" onchange="serviceChanged(this)"><option value="">Custom item...</option>${db.services.map(s=>`<option value="${esc(s.id)}" ${s.name===x.description?"selected":""}>${esc(s.name)}</option>`).join("")}</select><input class="it-custom" value="${esc(x.description)}" placeholder="Custom service" style="margin-top:6px"></div><div><label>Qty</label><input class="it-qty" type="number" min="0" step="1" value="${x.qty||1}"></div><div><label>Rate</label><input class="it-rate" type="number" min="0" step="0.01" value="${x.rate||0}"></div><div><label>Discount %</label><input class="it-discount" type="number" min="0" max="100" step="0.01" value="${x.discount||0}"></div><button class="icon-btn" onclick="this.parentElement.remove();calcInvoice()">×</button></div>`}
function serviceChanged(sel){const row=sel.closest(".item-row"),s=db.services.find(x=>x.id===sel.value);if(s){row.querySelector(".it-custom").value=s.name;row.querySelector(".it-rate").value=s.rate}calcInvoice()}
function addInvoiceRow(){document.getElementById("items").insertAdjacentHTML("beforeend",itemRow({description:"",qty:1,rate:0,discount:0},document.querySelectorAll(".item-row").length));bindDynamic();calcInvoice()}
function bindDynamic(){document.querySelectorAll(".it-qty,.it-rate,.it-discount,.it-custom").forEach(e=>e.oninput=calcInvoice);if(document.getElementById("items"))calcInvoice()}
function readInvoiceForm(statusOverride){
 const rows=[...document.querySelectorAll(".item-row")].map(r=>({description:r.querySelector(".it-custom").value.trim()||"Custom service",qty:Number(r.querySelector(".it-qty").value)||0,rate:Number(r.querySelector(".it-rate").value)||0,discount:Number(r.querySelector(".it-discount").value)||0})).filter(x=>x.qty>0);
 return {id:editingInvoice||"inv_"+Date.now(),number:document.getElementById("f_number").value.trim(),date:new Date(document.getElementById("f_date").value+"T12:00:00").getTime(),status:statusOverride||document.getElementById("f_status").value,customer:{name:document.getElementById("f_name").value.trim(),company:document.getElementById("f_company").value.trim(),phone:document.getElementById("f_phone").value.trim()},items:rows}
}
function calcInvoice(){
 const rows=[...document.querySelectorAll(".item-row")];let sub=0,disc=0;
 rows.forEach(r=>{const q=Number(r.querySelector(".it-qty")?.value)||0,rate=Number(r.querySelector(".it-rate")?.value)||0,d=Number(r.querySelector(".it-discount")?.value)||0;base=q*rate;sub+=base;disc+=base*d/100});
 const total=sub-disc;
 ["subtotal","discountTotal","grandTotal","qrAmount"].forEach((id,i)=>{const e=document.getElementById(id);if(e)e.textContent=money([sub,disc,total,total][i])});
 const qr=document.getElementById("qrPreview");if(qr){qr.innerHTML="";const uri=`upi://pay?pa=${encodeURIComponent(db.settings.upi)}&pn=${encodeURIComponent(db.settings.businessName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(document.getElementById("f_number")?.value||"SZC Invoice")}`;if(window.QRCode&&total>0){QRCode.toCanvas(uri,{width:200,margin:1},(err,canvas)=>{if(!err){canvas.title=uri;qr.appendChild(canvas)}})}else if(total>0){qr.innerHTML=`<div class="helper">QR library unavailable.<br>UPI: ${esc(db.settings.upi)}<br>Amount: ${money(total)}</div>`}else qr.innerHTML='<span class="helper">Enter an amount</span>'}
}
function saveInvoice(statusOverride){
 const inv=readInvoiceForm(statusOverride);
 if(!inv.customer.name){toast("Customer name is required");return}
 if(!inv.items.length){toast("Add at least one service");return}
 const exists=db.invoices.findIndex(x=>x.id===inv.id);
 if(exists>=0)db.invoices[exists]=inv;else{db.invoices.push(inv);if(!editingInvoice)bumpInvoice()}
 save();editingInvoice=null;toast("Invoice saved");setView("invoices");
}
function saveAndPrint(){const before=editingInvoice;const inv=readInvoiceForm();if(!inv.customer.name||!inv.items.length){toast("Add customer and at least one item");return}const idx=db.invoices.findIndex(x=>x.id===inv.id);if(idx>=0)db.invoices[idx]=inv;else{db.invoices.push(inv);bumpInvoice()}save();editingInvoice=null;printInvoice(inv.id)}
function printInvoice(id){
 const i=db.invoices.find(x=>x.id===id);if(!i)return;
 const total=invoiceTotal(i), uri=`upi://pay?pa=${encodeURIComponent(db.settings.upi)}&pn=${encodeURIComponent(db.settings.businessName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(i.number)}`;
 let qrData="";
 if(window.QRCode) QRCode.toDataURL(uri,{width:180,margin:1},(err,url)=>{qrData=err?"":url;printNow(i,total,qrData)});
 else printNow(i,total,"");
}
function printNow(i,total,qrData){
 const rows=i.items.map((x,n)=>`<tr><td>${n+1}</td><td>${esc(x.description)}</td><td>${x.qty}</td><td>${money(x.rate)}</td><td>${x.discount||0}%</td><td>${money(x.qty*x.rate*(1-(x.discount||0)/100))}</td></tr>`).join("");
 const logo=document.querySelector(".brand img")?.src||"assets/szc-logo.png";
 document.querySelector(".print-only")?.remove();
 const d=document.createElement("div");d.className="print-only print-invoice";d.innerHTML=`<div class="print-head"><div class="print-brand"><img src="${logo}"><div><h1>${esc(db.settings.businessName)}</h1><p>${esc(db.settings.website)}</p><p>${esc(db.settings.email)} · ${esc(db.settings.whatsapp)}</p><p>${esc(db.settings.address)}</p></div></div><div class="print-meta"><p><strong>${esc(i.number)}</strong></p><p>${dateStr(i.date)}</p><p>${statusBadge(i.status).replace(/<[^>]+>/g,"")}</p></div></div><h2 class="print-title">INVOICE</h2><div class="bill-box"><div><h4>Bill To</h4><p><strong>${esc(i.customer.name)}</strong></p><p>${esc(i.customer.company)}</p><p>${esc(i.customer.phone)}</p></div><div><h4>Payment</h4><p>Method: <strong>UPI</strong></p><p>UPI ID: ${esc(db.settings.upi)}</p></div></div><table class="print-table"><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="print-bottom"><div>${qrData?`<div class="print-qr"><img src="${qrData}"><div>Scan to pay ${money(total)}</div></div>`:""}<div class="signature">For ${esc(db.settings.businessName)}<br><br>________________________<br>${esc(db.settings.signature)}</div></div><div class="print-total"><div><span>Subtotal</span><span>${money(sum(i.items,x=>x.qty*x.rate))}</span></div><div><span>Discount</span><span>${money(sum(i.items,x=>x.qty*x.rate*x.discount/100))}</span></div><div class="grand"><span>Total</span><span>${money(total)}</span></div></div></div><div class="print-foot"><span>${esc(db.settings.footer)}</span><span>Designed & developed by ${esc(db.settings.businessName)} · ${esc(db.settings.website)}</span></div>`;
 document.body.appendChild(d);setTimeout(()=>window.print(),100);
}

function customers(){return `<div class="page-head"><div><div class="eyebrow">Customer management</div><h1 class="page-title">Customers</h1></div><button class="primary" onclick="openCustomerModal()">+ Add Customer</button></div><div class="card table-card" style="margin-top:0"><div class="card-head"><h3>Customer directory</h3><small>${db.customers.length} customers</small></div><div class="table-wrap">${db.customers.length?`<table class="table"><thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Invoices</th><th>Total billed</th><th></th></tr></thead><tbody>${db.customers.map(c=>{let inv=db.invoices.filter(i=>i.customer.name===c.name);return `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.company)}</td><td>${esc(c.phone)}</td><td>${inv.length}</td><td class="amount">${money(sum(inv,invoiceTotal))}</td><td><button class="danger-btn" onclick="deleteCustomer('${c.id}')">Delete</button></td></tr>`}).join("")}</tbody></table>`:`<div class="empty">No customers yet.</div>`}</div></div>`}
function openCustomerModal(){document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><strong>Add Customer</strong><button class="icon-btn" onclick="this.closest('.modal-backdrop').remove()">×</button></div><div class="modal-body"><div class="form-grid"><div><label>Name</label><input id="cm_name"></div><div><label>Company</label><input id="cm_company"></div><div><label>Phone</label><input id="cm_phone"></div></div><div class="actions-row"><button class="primary" onclick="saveCustomer()">Save Customer</button></div></div></div></div>`}
function saveCustomer(){const name=document.getElementById("cm_name").value.trim();if(!name)return toast("Name required");db.customers.push({id:"cus_"+Date.now(),name,company:document.getElementById("cm_company").value.trim(),phone:document.getElementById("cm_phone").value.trim()});save();document.querySelector(".modal-backdrop").remove();toast("Customer added");render()}
function deleteCustomer(id){db.customers=db.customers.filter(c=>c.id!==id);save();render()}
function services(){return `<div class="page-head"><div><div class="eyebrow">Catalogue</div><h1 class="page-title">Services</h1></div><button class="primary" onclick="openServiceModal()">+ Add Service</button></div><div class="card table-card" style="margin-top:0"><div class="table-wrap"><table class="table"><thead><tr><th>Service</th><th>Description</th><th>Default rate</th><th></th></tr></thead><tbody>${db.services.map(s=>`<tr><td><strong>${esc(s.name)}</strong></td><td>${esc(s.description)}</td><td class="amount">${money(s.rate)}</td><td><button class="danger-btn" onclick="deleteService('${s.id}')">Delete</button></td></tr>`).join("")}</tbody></table></div></div>`}
function openServiceModal(){document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><strong>Add Service</strong><button class="icon-btn" onclick="this.closest('.modal-backdrop').remove()">×</button></div><div class="modal-body"><div class="form-grid"><div><label>Name</label><input id="sm_name"></div><div><label>Default rate</label><input id="sm_rate" type="number"></div><div class="field full"><label>Description</label><input id="sm_desc"></div></div><div class="actions-row"><button class="primary" onclick="saveService()">Save Service</button></div></div></div></div>`}
function saveService(){const n=document.getElementById("sm_name").value.trim();if(!n)return toast("Service name required");db.services.push({id:"svc_"+Date.now(),name:n,description:document.getElementById("sm_desc").value.trim(),rate:Number(document.getElementById("sm_rate").value)||0});save();document.querySelector(".modal-backdrop").remove();render()}
function deleteService(id){db.services=db.services.filter(s=>s.id!==id);save();render()}

function docList(key,title){const list=db[key]||[];return `<div class="page-head"><div><div class="eyebrow">Sales documents</div><h1 class="page-title">${title}s</h1></div><button class="primary" onclick="toast('Create this document type from the invoice workflow in this version.')">+ New ${title}</button></div><div class="card"><div class="empty">${list.length?`${list.length} ${title.toLowerCase()} records stored locally.`:`No ${title.toLowerCase()} records yet.`}</div></div>`}
function payments(){return `<div class="page-head"><div><div class="eyebrow">Finance</div><h1 class="page-title">Payments</h1></div></div><div class="card"><div class="table-wrap">${db.payments.length?`<table class="table"><thead><tr><th>Date</th><th>Invoice</th><th>Method</th><th>Amount</th></tr></thead><tbody>${db.payments.map(p=>{let i=db.invoices.find(x=>x.id===p.invoiceId);return `<tr><td>${dateStr(p.date)}</td><td>${esc(i?.number||"—")}</td><td>UPI</td><td class="amount">${money(p.amount)}</td></tr>`}).join("")}</tbody></table>`:`<div class="empty">No payments recorded.</div>`}</div></div>`}
function expenses(){return simpleMoneyPage("Expenses","expenses","Add Expense")}
function purchases(){return simpleMoneyPage("Purchases","purchases","Add Purchase")}
function simpleMoneyPage(title,key,button){return `<div class="page-head"><div><div class="eyebrow">Finance</div><h1 class="page-title">${title}</h1></div><button class="primary" onclick="openMoneyModal('${key}')">+ ${button}</button></div><div class="card"><div class="table-wrap">${db[key].length?`<table class="table"><thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead><tbody>${db[key].map(x=>`<tr><td>${dateStr(x.date)}</td><td>${esc(x.description)}</td><td class="amount">${money(x.amount)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">No records yet.</div>`}</div></div>`}
function openMoneyModal(key){document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><strong>Add Record</strong><button class="icon-btn" onclick="this.closest('.modal-backdrop').remove()">×</button></div><div class="modal-body"><label>Description</label><input id="mm_desc"><label style="margin-top:12px">Amount</label><input id="mm_amount" type="number"><div class="actions-row"><button class="primary" onclick="saveMoney('${key}')">Save</button></div></div></div></div>`}
function saveMoney(key){const d=document.getElementById("mm_desc").value.trim(),a=Number(document.getElementById("mm_amount").value)||0;if(!d||!a)return toast("Enter description and amount");db[key].push({id:key+"_"+Date.now(),date:Date.now(),description:d,amount:a});save();document.querySelector(".modal-backdrop").remove();render()}
function reports(){const rev=sum(db.invoices.filter(i=>i.status==="PAID"),invoiceTotal), exp=sum(db.expenses,e=>e.amount);return `<div class="page-head"><div><div class="eyebrow">Analytics</div><h1 class="page-title">Reports</h1></div><button class="ghost" onclick="exportCSV('invoices')">Export invoices CSV</button></div><div class="grid stats">${stat("Collected",money(rev),"Paid invoices")}${stat("Expenses",money(exp),"Recorded expenses")}${stat("Net",money(rev-exp),"Collected less expenses")}${stat("Invoices",db.invoices.length,"All time")}</div><div class="grid dashboard-grid"><div class="card"><div class="card-head"><h3>Revenue by status</h3></div><div class="card-body">${["PAID","PARTIALLY PAID","UNPAID","SENT","OVERDUE","CANCELLED"].map(s=>row(s,db.invoices.filter(i=>i.status===s).length,s==="PAID"?"success":s==="OVERDUE"?"danger":"")).join("")}</div></div><div class="card"><div class="card-head"><h3>Service catalogue</h3></div><div class="card-body">${db.services.slice(0,8).map(s=>row(s.name,money(s.rate))).join("")}</div></div></div>`}
function settings(){return `<div class="page-head"><div><div class="eyebrow">System</div><h1 class="page-title">Settings</h1></div><button class="primary" onclick="saveSettings()">Save Settings</button></div><div class="card form-card"><div class="form-grid"><div><label>Business name</label><input id="st_name" value="${esc(db.settings.businessName)}"></div><div><label>Website</label><input id="st_web" value="${esc(db.settings.website)}"></div><div><label>Email</label><input id="st_email" value="${esc(db.settings.email)}"></div><div><label>WhatsApp</label><input id="st_phone" value="${esc(db.settings.whatsapp)}"></div><div><label>UPI ID</label><input id="st_upi" value="${esc(db.settings.upi)}"></div><div><label>Invoice next sequence</label><input id="st_seq" type="number" value="${db.settings.nextInvoice}"></div><div class="field full"><label>Address</label><input id="st_address" value="${esc(db.settings.address)}"></div><div class="field full"><label>Invoice footer</label><textarea id="st_footer">${esc(db.settings.footer)}</textarea></div><div class="field full"><label>Signature label</label><input id="st_sig" value="${esc(db.settings.signature)}"></div></div><div style="margin-top:18px" class="helper">No tax engine is enabled in this local SZC ERP. Payment method is UPI only.</div></div>`}
function saveSettings(){Object.assign(db.settings,{businessName:document.getElementById("st_name").value.trim(),website:document.getElementById("st_web").value.trim(),email:document.getElementById("st_email").value.trim(),whatsapp:document.getElementById("st_phone").value.trim(),upi:document.getElementById("st_upi").value.trim(),nextInvoice:Number(document.getElementById("st_seq").value)||1,address:document.getElementById("st_address").value.trim(),footer:document.getElementById("st_footer").value,signature:document.getElementById("st_sig").value.trim()});save();toast("Settings saved")}
function backup(){return `<div class="page-head"><div><div class="eyebrow">System</div><h1 class="page-title">Backup & Restore</h1></div></div><div class="grid overview-grid"><div class="card form-card"><h3>Export backup</h3><p class="helper">Downloads all local customers, invoices, services, payments, expenses and settings as a JSON backup.</p><button class="primary" onclick="downloadBackup()">Download Backup</button></div><div class="card form-card"><h3>Restore backup</h3><p class="helper">Choose a previously exported SZC ERP JSON file. This replaces the current local dataset.</p><input type="file" id="restoreFile" accept=".json"><button class="ghost" style="margin-top:10px" onclick="restoreBackup()">Restore Selected File</button></div></div>`}
function downloadBackup(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`szc-erp-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
function restoreBackup(){const f=document.getElementById("restoreFile").files[0];if(!f)return toast("Choose a backup file");const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);db=x;save();toast("Backup restored");render()}catch{toast("Invalid backup file")}};r.readAsText(f)}
function exportCSV(key){const rows=db[key]||[];let csv="Invoice,Customer,Date,Status,Total\n"+rows.map(i=>`"${i.number}","${i.customer.name}","${dateStr(i.date)}","${i.status}","${invoiceTotal(i).toFixed(2)}"`).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="szc-invoices.csv";a.click()}

window.setView=setView;window.openCustomerModal=openCustomerModal;window.saveCustomer=saveCustomer;window.deleteCustomer=deleteCustomer;window.openServiceModal=openServiceModal;window.saveService=saveService;window.deleteService=deleteService;window.addInvoiceRow=addInvoiceRow;window.serviceChanged=serviceChanged;window.calcInvoice=calcInvoice;window.saveInvoice=saveInvoice;window.saveAndPrint=saveAndPrint;window.openInvoice=openInvoice;window.editInvoice=editInvoice;window.printInvoice=printInvoice;window.markPaid=markPaid;window.openMoneyModal=openMoneyModal;window.saveMoney=saveMoney;window.saveSettings=saveSettings;window.downloadBackup=downloadBackup;window.restoreBackup=restoreBackup;window.exportCSV=exportCSV;window.resetLocalData=resetLocalData;
function boot(){try{bindStatic();render()}catch(err){showFatalError(err)}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();