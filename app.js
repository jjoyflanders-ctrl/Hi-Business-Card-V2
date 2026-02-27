/* Highlight Digital Contact - New Design (CSV powered)
   - Employees loaded from ./employees.csv
   - Search employees via query param ?u=slug
   - Share + Send to Phone (QR + share sheet)
   - Save to Contacts (vCard download)
*/

let EMPLOYEES = [];
const FALLBACK_PHOTO = "./assets/building.jpg";

const $ = (sel) => document.querySelector(sel);

function showLoadError(msg){
  const el = $("#loadError");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("is-open");
}

function clearLoadError(){
  const el = $("#loadError");
  if (!el) return;
  el.textContent = "";
  el.classList.remove("is-open");
}

function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function setParam(name, value){
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.replaceState({}, "", url);
}

function slugify(s){
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fullName(emp){
  return `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
}

function formatPhone(emp){
  return emp.phoneExt ? `${emp.phone} x ${emp.phoneExt}` : (emp.phone || "");
}

function baseDir(){
  // Always resolve relative to current page location (works on GitHub Pages subpaths)
  const u = new URL(window.location.href);
  u.hash = "";
  // Ensure we end with a trailing slash directory
  const p = u.pathname;
  if (p.endsWith("/")) return u;
  u.pathname = p.substring(0, p.lastIndexOf("/") + 1);
  return u;
}

function contactUrl(){
  const url = new URL(window.location.href);
  if (!url.searchParams.get("u") && EMPLOYEES[0]?.slug) url.searchParams.set("u", EMPLOYEES[0].slug);
  return url.toString();
}

function qrUrlFor(text, size=220){
  const u = new URL("https://quickchart.io/qr");
  u.searchParams.set("text", text);
  u.searchParams.set("size", String(size));
  u.searchParams.set("margin", "2");
  return u.toString();
}

/* ---------------- CSV loading ----------------
   employees.csv headers:
   slug,firstName,lastName,title,company,phone,phoneExt,email,website,photo
*/
function parseCSV(text){
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;

  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "") { row = []; return; }
    rows.push(row); row = [];
  };

  while (i < text.length){
    const c = text[i];

    if (inQuotes){
      if (c === '"'){
        if (text[i+1] === '"'){ field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }

    if (c === '"'){ inQuotes = true; i++; continue; }

    // escaped commas: \,
    if (c === "\\" && text[i+1] === ","){ field += ","; i += 2; continue; }

    if (c === ","){ pushField(); i++; continue; }
    if (c === "\r"){ i++; continue; }
    if (c === "\n"){ pushField(); pushRow(); i++; continue; }

    field += c; i++;
  }

  pushField();
  pushRow();

  if (!rows.length) return [];

  const headers = rows[0].map(h => (h || "").trim());
  const items = [];

  for (let r = 1; r < rows.length; r++){
    const rec = {};
    for (let c = 0; c < headers.length; c++){
      rec[headers[c]] = (rows[r][c] ?? "").trim();
    }
    if (!rec.slug) continue;
    items.push(rec);
  }
  return items;
}

async function loadEmployees(){
  clearLoadError();
  const dir = baseDir();
  const csvUrl = new URL("./employees.csv", dir);
  // cache-bust so service worker can't trap older CSV
  csvUrl.searchParams.set("v", String(Date.now()));

  try{
    const res = await fetch(csvUrl.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parsed = parseCSV(text);

    EMPLOYEES = parsed.map(e => ({
      slug: e.slug,
      firstName: e.firstName,
      lastName: e.lastName,
      title: e.title,
      company: e.company,
      phone: e.phone,
      phoneExt: e.phoneExt,
      email: e.email,
      website: e.website,
      photo: e.photo
    }));

    if (!EMPLOYEES.length) throw new Error("employees.csv has no rows");
  }catch(err){
    showLoadError("Employee list failed to load. Make sure employees.csv is in the same folder as index.html, then refresh.");
    // fallback so UI still works
    EMPLOYEES = [{
      slug: "jessica-flanders",
      firstName: "Jessica",
      lastName: "Flanders",
      title: "E‑commerce & Inventory Administrator",
      company: "Highlight Industries, Inc.",
      phone: "616-531-2464",
      phoneExt: "242",
      email: "jessicaf@highlightindustries.com",
      website: "https://www.highlightindustries.com",
      photo: "./assets/jessica-flanders.jpg"
    }];
  }
}

/* ---------------- UI rendering ---------------- */
function renderEmployee(emp){
  const name = fullName(emp);
  const title = emp.title || "";
  const phone = formatPhone(emp);
  const email = emp.email || "";
  const web = emp.website || "";

  // Desktop
  $("#empName").textContent = name || "—";
  $("#empTitle").textContent = title || "—";
  $("#empPhone").textContent = phone || "—";
  $("#empEmail").textContent = email || "—";
  $("#empWeb").textContent = web ? web.replace(/^https?:\/\//, "") : "—";

  $("#phoneLink").href = emp.phone ? `tel:${(emp.phone||"").replace(/[^0-9+]/g,"")}` : "#";
  $("#emailLink").href = email ? `mailto:${email}` : "#";
  $("#webLink").href = web || "#";

  // Mobile
  $("#mName").textContent = name || "—";
  $("#mTitle").textContent = title || "—";
  $("#mPhone").textContent = phone || "—";
  $("#mEmail").textContent = email || "—";
  $("#mWeb").textContent = web ? web.replace(/^https?:\/\//, "") : "—";

  $("#mPhoneLink").href = emp.phone ? `tel:${(emp.phone||"").replace(/[^0-9+]/g,"")}` : "#";
  $("#mEmailLink").href = email ? `mailto:${email}` : "#";
  $("#mWebLink").href = web || "#";

  // Photo with fallback
  const src = emp.photo ? emp.photo : FALLBACK_PHOTO;
  $("#heroImg").src = src;
  $("#mHeroImg").src = src;

  // Mobile QR between photo and name
  const url = contactUrl();
  $("#mQrImg").src = qrUrlFor(url, 220);

  // Modal defaults
  $("#shareLink").value = url;
  $("#modalQr").src = qrUrlFor(url, 260);
}

function findEmployeeBySlug(slug){
  return EMPLOYEES.find(e => e.slug === slug) || EMPLOYEES[0];
}

function buildSearchResults(items){
  const box = $("#searchResults");
  box.innerHTML = "";
  if (!items.length){
    const div = document.createElement("div");
    div.className = "search__item";
    div.textContent = "No matches";
    box.appendChild(div);
    return;
  }
  items.slice(0, 10).forEach(emp => {
    const row = document.createElement("div");
    row.className = "search__item";
    row.setAttribute("role", "option");
    row.dataset.slug = emp.slug;

    const left = document.createElement("div");
    left.textContent = fullName(emp);

    const right = document.createElement("div");
    right.className = "search__meta";
    right.textContent = emp.title || "";

    row.appendChild(left);
    row.appendChild(right);

    row.addEventListener("click", () => {
      loadEmployee(emp.slug);
      closeSearchResults();
      $("#searchInput").blur();
    });

    box.appendChild(row);
  });
}

function openSearchResults(){ $("#searchResults").classList.add("is-open"); }
function closeSearchResults(){ $("#searchResults").classList.remove("is-open"); }

function wireSearch(){
  const input = $("#searchInput");
  const btn = $("#searchBtn");

  const run = () => {
    const q = (input.value || "").trim().toLowerCase();
    const matches = EMPLOYEES.filter(e => {
      const n = fullName(e).toLowerCase();
      const t = (e.title || "").toLowerCase();
      return n.includes(q) || t.includes(q) || (e.slug || "").includes(q);
    });
    buildSearchResults(matches);
    openSearchResults();
  };

  input.addEventListener("input", () => {
    if ((input.value || "").trim().length === 0){
      closeSearchResults();
      return;
    }
    run();
  });

  input.addEventListener("focus", () => {
    if ((input.value || "").trim().length > 0) run();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter"){
      e.preventDefault();
      const q = (input.value || "").trim();
      if (!q) return;
      const guess = slugify(q);
      const direct =
        EMPLOYEES.find(e => e.slug === guess) ||
        EMPLOYEES.find(e => fullName(e).toLowerCase() === q.toLowerCase());
      if (direct){
        loadEmployee(direct.slug);
        closeSearchResults();
      } else {
        run();
      }
    }
    if (e.key === "Escape"){
      closeSearchResults();
      input.blur();
    }
  });

  btn.addEventListener("click", () => {
    if ((input.value || "").trim().length === 0){
      buildSearchResults(EMPLOYEES);
      openSearchResults();
      return;
    }
    run();
  });

  document.addEventListener("click", (e) => {
    const inSearch = e.target.closest(".search");
    if (!inSearch) closeSearchResults();
  });
}

function vcardFor(emp){
  const name = fullName(emp);
  const phoneDigits = (emp.phone || "").replace(/[^0-9+]/g,"");
  const url = emp.website || "";
  const org = emp.company || "Highlight Industries, Inc.";
  const title = emp.title || "";

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${emp.lastName || ""};${emp.firstName || ""};;;`,
    `FN:${name}`,
    `ORG:${org}`,
    title ? `TITLE:${title}` : "",
    phoneDigits ? `TEL;TYPE=WORK,VOICE:${phoneDigits}` : "",
    emp.phoneExt ? `X-ABLabel:Ext ${emp.phoneExt}` : "",
    emp.email ? `EMAIL;TYPE=INTERNET,WORK:${emp.email}` : "",
    url ? `URL:${url}` : "",
    "END:VCARD"
  ].filter(Boolean).join("\n");
}

function downloadText(filename, text, mime){
  const blob = new Blob([text], {type: mime || "text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}

function openModal(title, hint){
  $("#modalTitle").textContent = title || "Share";
  $("#modalHint").textContent = hint || "Scan the QR code or copy the link.";
  $("#modal").classList.add("is-open");
}
function closeModal(){ $("#modal").classList.remove("is-open"); }

async function tryNativeShare(){
  const url = contactUrl();
  const empSlug = getParam("u") || EMPLOYEES[0]?.slug;
  const emp = findEmployeeBySlug(empSlug);
  const title = `${fullName(emp)} — ${emp.title || "Highlight Industries"}`;

  if (navigator.share){
    try{
      await navigator.share({title, text: title, url});
      return true;
    }catch{
      return false;
    }
  }
  return false;
}

function wireActions(){
  const save = () => {
    const emp = findEmployeeBySlug(getParam("u") || EMPLOYEES[0]?.slug);
    const vcf = vcardFor(emp);
    downloadText(`${emp.slug}.vcf`, vcf, "text/vcard");
  };

  $("#saveBtn")?.addEventListener("click", save);
  $("#mSaveBtn")?.addEventListener("click", save);

  const share = async () => {
    const ok = await tryNativeShare();
    if (ok) return;
    const url = contactUrl();
    $("#shareLink").value = url;
    $("#modalQr").src = qrUrlFor(url, 260);
    openModal("Share", "Scan the QR code, or copy the link.");
  };

  $("#shareBtn")?.addEventListener("click", share);
  $("#mShareBtn")?.addEventListener("click", share);

  const send = () => {
    const url = contactUrl();
    $("#shareLink").value = url;
    $("#modalQr").src = qrUrlFor(url, 260);
    openModal("Send to Phone", "Scan this QR code with your phone to open the contact.");
  };

  $("#sendBtn")?.addEventListener("click", send);

  $("#copyBtn")?.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText($("#shareLink").value);
      $("#copyBtn").textContent = "Copied!";
      setTimeout(() => $("#copyBtn").textContent = "Copy", 900);
    }catch{
      $("#shareLink").select();
      document.execCommand("copy");
      $("#copyBtn").textContent = "Copied!";
      setTimeout(() => $("#copyBtn").textContent = "Copy", 900);
    }
  });

  $("#modal")?.addEventListener("click", (e) => {
    const close = e.target?.getAttribute?.("data-close");
    if (close) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  $("#mFindBtn")?.addEventListener("click", () => {
    const q = prompt("Search employees (name or title):");
    if (!q) return;
    const qq = q.trim().toLowerCase();
    const emp = EMPLOYEES.find(e =>
      fullName(e).toLowerCase().includes(qq) ||
      (e.title||"").toLowerCase().includes(qq) ||
      (e.slug||"").includes(slugify(qq))
    );
    if (emp) loadEmployee(emp.slug);
    else alert("No match found.");
  });
}

function loadEmployee(slug){
  setParam("u", slug);
  const emp = findEmployeeBySlug(slug);
  renderEmployee(emp);
}

function registerSW(){ /* disabled in v5 to prevent stale caching during iteration */ }

async function main(){
  $("#year").textContent = String(new Date().getFullYear());

  await loadEmployees();

  wireSearch();
  wireActions();

  const slug = getParam("u") || EMPLOYEES[0]?.slug || "jessica-flanders";
  loadEmployee(slug);

  registerSW();
}

main();
