/* Highlight Digital Contact – v4
   - Loads employees from ./employees.csv
   - Uses ?u=slug to select employee
   - Mobile actions: QR, Share, Find, Add to Contacts
*/

const DEFAULTS = {
  company: "Highlight Industries, Inc.",
  website: "https://www.highlightindustries.com",
  parts_label: "Machine Parts",
};

let EMPLOYEES = [];
let CURRENT = null;

const $ = (sel) => document.querySelector(sel);
const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");

function openModal(title, html){
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.setAttribute("aria-hidden","false");
}
function closeModal(){
  modal.setAttribute("aria-hidden","true");
  modalBody.innerHTML = "";
}
modal.addEventListener("click", (e)=>{
  if(e.target?.dataset?.close) closeModal();
});

function qsParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function setParam(name, value){
  const u = new URL(location.href);
  if(value) u.searchParams.set(name, value);
  else u.searchParams.delete(name);
  history.replaceState({}, "", u.toString());
}

function slugify(s){
  return String(s||"")
    .trim().toLowerCase()
    .replace(/['"]/g,"")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/(^-|-$)/g,"");
}

function parseCSV(text){
  // Small CSV parser (handles quoted fields)
  const rows = [];
  let row = [], cur = "", inQ = false;
  for(let i=0;i<text.length;i++){
    const c = text[i];
    const n = text[i+1];
    if(c === '"'){
      if(inQ && n === '"'){ cur += '"'; i++; }
      else inQ = !inQ;
      continue;
    }
    if(!inQ && (c === "," || c === "\n" || c === "\r")){
      if(c === ","){ row.push(cur); cur=""; continue; }
      // newline
      if(c === "\r" && n === "\n"){ /* swallow */ i++; }
      row.push(cur); cur="";
      if(row.some(v=>v.length>0)) rows.push(row);
      row = [];
      continue;
    }
    cur += c;
  }
  row.push(cur);
  if(row.some(v=>v.length>0)) rows.push(row);
  if(!rows.length) return [];
  const header = rows.shift().map(h=>h.trim());
  return rows.map(r=>{
    const obj = {};
    header.forEach((h, idx)=> obj[h] = (r[idx] ?? "").trim());
    return obj;
  });
}

async function loadEmployees(){
  const res = await fetch("./employees.csv", {cache:"no-store"});
  if(!res.ok) throw new Error("Could not load employees.csv");
  const text = await res.text();
  const items = parseCSV(text);

  // Normalize
  EMPLOYEES = items.map(e=>{
    const first = e.first || e.first_name || "";
    const last  = e.last  || e.last_name  || "";
    const slug  = e.slug || slugify(first + "-" + last);
    const photo = e.photo || e.headshot || "";
    const phone = e.phone || "";
    const email = e.email || "";
    const title = e.title || e.role || "";
    const website = e.website || DEFAULTS.website;
    const parts_url = e.parts_url || e.machine_parts || "";
    const parts_label = e.parts_label || DEFAULTS.parts_label;
    const ext = e.ext || "";
    const displayPhone = (phone && ext) ? `${phone} x ${ext}` : (phone || "—");

    return { ...e, first, last, slug, photo, phone, ext, displayPhone, email, title, website, parts_url, parts_label };
  }).filter(e => e.first || e.last);

  // Sort alphabetically
  EMPLOYEES.sort((a,b)=> (a.last+a.first).localeCompare(b.last+b.first));
}

function currentUrl(){
  return new URL(location.href).toString();
}

function pickEmployee(){
  const slug = qsParam("u");
  if(slug){
    const found = EMPLOYEES.find(e => e.slug === slug);
    if(found) return found;
  }
  return EMPLOYEES[0] || null;
}

function applyEmployee(emp){
  if(!emp) return;
  CURRENT = emp;

  // Photo
  const fallback = "./assets/building.jpg";
  const photoSrc = emp.photo ? emp.photo : fallback;

  const dimg = $("#deskPhoto");
  const mimg = $("#mobPhoto");

  // Swap images cleanly + fall back if a headshot path is wrong
  if(dimg){
    dimg.onerror = () => { dimg.onerror = null; dimg.src = fallback; };
    dimg.src = photoSrc;
  }
  if(mimg){
    mimg.onerror = () => { mimg.onerror = null; mimg.src = fallback; };
    mimg.src = photoSrc;
  }

  // Names/titles
  $("#deskFirst").textContent = emp.first || "";
  $("#deskLast").textContent  = emp.last  || "";
  $("#deskRole").textContent  = (emp.title || "").toUpperCase() || "—";

  $("#mobFirst").textContent = emp.first || "";
  $("#mobLast").textContent  = emp.last  || "";
  $("#mobRole").textContent  = emp.title || "—";

  // Phone / email / websites
  $("#deskPhone").textContent = emp.displayPhone || "—";
  $("#mobPhone").textContent = emp.displayPhone || "—";

  const phoneHref = emp.phone ? `tel:${emp.phone}` : "#";
  $("#mobPhone").href = phoneHref;

  const mailHref = emp.email ? `mailto:${emp.email}` : "#";
  $("#deskEmail").textContent = emp.email || "—";
  $("#deskEmail").href = mailHref;

  $("#mobEmailLink").textContent = emp.email || "—";
  $("#mobEmailLink").href = mailHref;

  $("#deskWebsite").textContent = stripProto(emp.website);
  $("#deskWebsite").href = emp.website || DEFAULTS.website;

  $("#mobWebsite").textContent = stripProto(emp.website);
  $("#mobWebsite").href = emp.website || DEFAULTS.website;

  // Optional parts link
  const hasParts = !!emp.parts_url;
  const partsWrap = $("#mobPartsWrap");
  const deskLabel = $("#deskPartsLabel");
  const deskParts = $("#deskParts");

  if(hasParts){
    partsWrap.classList.remove("optional");
    $("#mobPartsLabel").textContent = emp.parts_label || DEFAULTS.parts_label;
    $("#mobParts").textContent = stripProto(emp.parts_url);
    $("#mobParts").href = emp.parts_url;

    deskLabel.textContent = (emp.parts_label || DEFAULTS.parts_label).toUpperCase();
    deskParts.textContent = stripProto(emp.parts_url);
    deskParts.href = emp.parts_url;

    deskLabel.classList.remove("optional");
    deskParts.parentElement.classList.remove("optional");
  }else{
    partsWrap.classList.add("optional");
    deskLabel.classList.add("optional");
    deskParts.parentElement.classList.add("optional");
  }

  // Wire mobile quick buttons
  $("#mobCall").onclick = () => { if(emp.phone) location.href = phoneHref; };
  $("#mobEmail").onclick = () => { if(emp.email) location.href = mailHref; };
  $("#mobWeb").onclick = () => { window.open(emp.website || DEFAULTS.website, "_blank", "noopener"); };

  // Update URL param (keep consistent)
  setParam("u", emp.slug);

  // Update search input value
  const q = `${emp.first} ${emp.last}`.trim();
  const input = $("#employeeSearch");
  if(input) input.value = q;

  document.title = `${q || "Highlight"} – Digital Contact`;
}

function stripProto(url){
  return String(url||"").replace(/^https?:\/\//i,"").replace(/\/$/,"");
}

function buildDropdown(list){
  const dd = $("#searchDropdown");
  dd.innerHTML = "";
  list.slice(0,12).forEach(emp=>{
    const el = document.createElement("div");
    el.className = "searchItem";
    el.setAttribute("role","option");
    el.innerHTML = `<div>${emp.first} ${emp.last}</div><small>${emp.title || ""}</small>`;
    el.addEventListener("click", ()=>{
      dd.style.display = "none";
      applyEmployee(emp);
      window.scrollTo({top:0, behavior:"smooth"});
    });
    dd.appendChild(el);
  });
  dd.style.display = list.length ? "block" : "none";
}

function setupSearch(){
  const input = $("#employeeSearch");
  const openBtn = $("#openSearch");
  const dd = $("#searchDropdown");

  const run = ()=>{
    const q = (input.value||"").trim().toLowerCase();
    if(!q){ buildDropdown(EMPLOYEES); return; }
    const results = EMPLOYEES.filter(e=>{
      const hay = `${e.first} ${e.last} ${e.title}`.toLowerCase();
      return hay.includes(q);
    });
    buildDropdown(results);
  };

  input.addEventListener("input", run);
  input.addEventListener("focus", run);
  input.addEventListener("blur", ()=> setTimeout(()=> dd.style.display="none", 140));
  openBtn.addEventListener("click", ()=>{
    input.focus();
    input.value = "";
    buildDropdown(EMPLOYEES);
  });
}

/* vCard */
function vcardFor(emp){
  const full = `${emp.first} ${emp.last}`.trim();
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${emp.last};${emp.first};;;`,
    `FN:${full}`,
    emp.title ? `TITLE:${emp.title}` : "",
    `ORG:${DEFAULTS.company}`,
    emp.phone ? `TEL;TYPE=WORK,VOICE:${emp.phone}${emp.ext ? "x"+emp.ext : ""}` : "",
    emp.email ? `EMAIL;TYPE=INTERNET,WORK:${emp.email}` : "",
    emp.website ? `URL:${emp.website}` : "",
    "END:VCARD"
  ].filter(Boolean);
  return lines.join("\n");
}
function downloadVCard(emp){
  const blob = new Blob([vcardFor(emp)], {type:"text/vcard;charset=utf-8"});
  const a = document.createElement("a");
  const safe = slugify(`${emp.first}-${emp.last}`) || "contact";
  a.href = URL.createObjectURL(blob);
  a.download = `${safe}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(a.href), 5000);
}

/* Share */
async function shareCurrent(){
  const url = currentUrl();
  const name = `${CURRENT?.first || ""} ${CURRENT?.last || ""}`.trim();
  const title = name ? `${name} – Highlight Contact` : "Highlight Contact";

  if(navigator.share){
    try{
      await navigator.share({title, text: title, url});
      return;
    }catch(e){
      // user cancelled → do nothing
      if(String(e).includes("AbortError")) return;
    }
  }

  // Fallback modal with copy
  openModal("Share", `
    <p><strong>Copy link</strong></p>
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <input id="shareLink" style="flex:1; min-width:220px; height:44px; padding:0 12px; border-radius:12px; border:1px solid #ddd;" value="${escapeHtml(url)}" />
      <button id="copyBtn" style="height:44px; padding:0 14px; border-radius:12px; border:none; background:#3F845B; color:#fff; font-weight:800; cursor:pointer;">Copy</button>
    </div>
    <div class="note">Tip: On iPhone, use the share sheet to AirDrop or message the link.</div>
  `);
  setTimeout(()=>{
    const link = $("#shareLink");
    const btn = $("#copyBtn");
    if(!link || !btn) return;
    btn.onclick = async ()=>{
      try{ await navigator.clipboard.writeText(url); btn.textContent = "Copied"; }
      catch{ link.select(); document.execCommand("copy"); btn.textContent = "Copied"; }
    };
    link.focus(); link.select();
  }, 10);
}


/* Share + QR combined (desktop share / enhanced mobile share) */
async function shareWithQR(){
  const url = currentUrl();
  const name = `${CURRENT?.first || ""} ${CURRENT?.last || ""}`.trim();
  const title = name ? `${name} – Highlight Contact` : "Highlight Contact";

  // Try native share first when available
  if(navigator.share){
    try{
      await navigator.share({title, text: title, url});
      return;
    }catch(e){
      if(String(e).includes("AbortError")) return;
    }
  }

  // Modal with QR + copy + (if available) a native-share button
  openModal("Share", `
    <div style="display:grid; gap:14px;">
      <div>
        <div style="font-weight:900; margin-bottom:8px;">QR Code</div>
        <div id="shareQrMount" style="display:grid; place-items:center; padding:8px 0;"></div>
        <div class="note">Scan to open this exact contact.</div>
      </div>

      <div>
        <div style="font-weight:900; margin-bottom:8px;">Share link</div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <input id="shareLink" style="flex:1; min-width:220px; height:44px; padding:0 12px; border-radius:12px; border:1px solid #ddd;" value="${escapeHtml(url)}" />
          <button id="copyBtn" style="height:44px; padding:0 14px; border-radius:12px; border:none; background:#3F845B; color:#fff; font-weight:800; cursor:pointer;">Copy</button>
        </div>
        <div class="note">Tip: On iPhone, use the share sheet to AirDrop or message the link.</div>
      </div>

      ${navigator.share ? `
      <button id="nativeShareBtn" style="height:46px; border-radius:14px; border:none; background:#111; color:#fff; font-weight:900; cursor:pointer;">
        Open Share Sheet
      </button>` : ``}
    </div>
  `);

  setTimeout(()=>{
    // QR render
    const mount = $("#shareQrMount");
    if(mount){
      if(typeof window.QRCode !== "undefined"){
        mount.innerHTML = "";
        new QRCode(mount, {text: url, width: 240, height: 240});
      }else{
        const img = document.createElement("img");
        img.alt = "QR code";
        img.width = 240; img.height = 240;
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
        mount.appendChild(img);
      }
    }

    const link = $("#shareLink");
    const btn = $("#copyBtn");
    if(link && btn){
      btn.onclick = async ()=>{
        try{ await navigator.clipboard.writeText(url); btn.textContent = "Copied"; }
        catch{ link.select(); document.execCommand("copy"); btn.textContent = "Copied"; }
      };
      link.focus(); link.select();
    }

    const ns = $("#nativeShareBtn");
    if(ns){
      ns.onclick = async ()=> {
        try{ await navigator.share({title, text: title, url}); }
        catch(e){ /* ignore */ }
      };
    }
  }, 10);
}


/* QR */
function showQR(){
  const url = currentUrl();
  // If QRCode library loaded, render it.
  const hasLib = typeof window.QRCode !== "undefined";

  const mount = document.createElement("div");
  mount.style.display = "grid";
  mount.style.placeItems = "center";
  mount.style.padding = "8px 0 4px";

  openModal("QR Code", `
    <div id="qrMount" style="display:grid; place-items:center;"></div>
    <div class="note">Scan this on your phone to open the exact contact.</div>
  `);

  const mountEl = $("#qrMount");
  if(!mountEl) return;

  if(hasLib){
    mountEl.innerHTML = "";
    new QRCode(mountEl, {text: url, width: 260, height: 260});
  }else{
    // Fallback to a QR image API
    const img = document.createElement("img");
    img.alt = "QR code";
    img.width = 260; img.height = 260;
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}`;
    mountEl.appendChild(img);
  }
}

/* Find (mobile) */
function showFind(){
  const list = EMPLOYEES.map(e=>`
    <button class="findRow" data-slug="${e.slug}" type="button">
      <div class="n">${escapeHtml(e.first)} ${escapeHtml(e.last)}</div>
      <div class="t">${escapeHtml(e.title || "")}</div>
    </button>
  `).join("");

  openModal("Find an Employee", `
    <input id="findInput" placeholder="Type a name…" style="width:100%; height:44px; padding:0 12px; border-radius:12px; border:1px solid #ddd; margin-bottom:10px;" />
    <div id="findList" style="display:grid; gap:10px; max-height:55vh; overflow:auto;">
      ${list}
    </div>
    <style>
      .findRow{ text-align:left; border:1px solid #eee; background:#fff; padding:12px; border-radius:14px; cursor:pointer; }
      .findRow .n{ font-weight:900; }
      .findRow .t{ color:#666; margin-top:2px; }
      .findRow:hover{ background:#fafafa; }
    </style>
  `);

  const input = $("#findInput");
  const listEl = $("#findList");
  if(!input || !listEl) return;

  const rerender = ()=>{
    const q = input.value.trim().toLowerCase();
    const filtered = !q ? EMPLOYEES : EMPLOYEES.filter(e => (`${e.first} ${e.last} ${e.title}`.toLowerCase()).includes(q));
    listEl.innerHTML = filtered.map(e=>`
      <button class="findRow" data-slug="${e.slug}" type="button">
        <div class="n">${escapeHtml(e.first)} ${escapeHtml(e.last)}</div>
        <div class="t">${escapeHtml(e.title || "")}</div>
      </button>
    `).join("");
    wireRows();
  };

  const wireRows = ()=>{
    listEl.querySelectorAll("[data-slug]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const slug = btn.getAttribute("data-slug");
        const emp = EMPLOYEES.find(e=>e.slug===slug);
        if(emp){ closeModal(); applyEmployee(emp); window.scrollTo({top:0, behavior:"smooth"}); }
      });
    });
  };

  input.addEventListener("input", rerender);
  wireRows();
  setTimeout(()=> input.focus(), 10);
}

/* Safety */
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}

/* Buttons wiring */
function setupActions(){
  const saveDesktop = $("#saveDesktop");
  const sendDesktop = $("#sendDesktop");
  const deskPillSave = $("#deskPillSave");
  const deskPillSend = $("#deskPillSend");

  const save = ()=> { if(CURRENT) downloadVCard(CURRENT); };
  const send = ()=> { showQR(); };

  saveDesktop.addEventListener("click", save);
  deskPillSave.addEventListener("click", save);

  sendDesktop.addEventListener("click", send);
  deskPillSend.addEventListener("click", send);

  // Mobile bottom actions
  $("#btnQR").addEventListener("click", showQR);
  $("#btnShare").addEventListener("click", shareWithQR);
  $("#btnFind").addEventListener("click", showFind);
  $("#btnAdd").addEventListener("click", ()=> { if(CURRENT) downloadVCard(CURRENT); });
}

/* Init */
(async function init(){
  try{
    await loadEmployees();
  }catch(err){
    console.error(err);
    openModal("Missing employees.csv", `
      <p>Couldn't load <strong>employees.csv</strong>. Make sure it exists in the repo root.</p>
      <div class="note">${escapeHtml(String(err))}</div>
    `);
    return;
  }

  setupSearch();
  setupActions();

  const emp = pickEmployee();
  applyEmployee(emp);

  // Close modal with Escape
  window.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeModal(); });
})();
