/* Highlight Digital Contact
   - Desktop by default (>=900px)
   - Mobile can be forced on ANY device with ?view=mobile
   - Employee selected via ?u=employee-id
*/

const EMPLOYEE_JSON_URL = "./employees.json";
const EMPLOYEE_CSV_URL = "./employees.csv";
const QR_API = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=";

function absUrl(relPath) {
  // Robust relative URL resolver (works on GitHub Pages subpaths)
  const base = new URL(".", window.location.href);
  return new URL(relPath, base).toString();
}

function cacheBust(url) {
  const u = new URL(url);
  u.searchParams.set("v", String(Date.now()));
  return u.toString();
}

const els = {
  // Desktop
  deskHeader: document.getElementById("deskHeader"),
  deskCard: document.getElementById("deskCard"),
  employeeSearch: document.getElementById("employeeSearch"),
  openBtn: document.getElementById("openBtn"),
  clearBtn: document.getElementById("clearBtn"),
  nameDesk: document.getElementById("nameDesk"),
  titleDesk: document.getElementById("titleDesk"),
  emailDesk: document.getElementById("emailDesk"),
  phoneDesk: document.getElementById("phoneDesk"),
  webDesk: document.getElementById("webDesk"),
  emailLinkDesk: document.getElementById("emailLinkDesk"),
  phoneLinkDesk: document.getElementById("phoneLinkDesk"),
  webLinkDesk: document.getElementById("webLinkDesk"),
  photoDesk: document.getElementById("photoDesk"),
  saveBtnDesk: document.getElementById("saveBtnDesk"),
  sendBtnDesk: document.getElementById("sendBtnDesk"),

  // Mobile
  mobShell: document.getElementById("mobShell"),
  nameMob: document.getElementById("nameMob"),
  titleMob: document.getElementById("titleMob"),
  emailMob: document.getElementById("emailMob"),
  phoneMob: document.getElementById("phoneMob"),
  webMob: document.getElementById("webMob"),
  emailLinkMob: document.getElementById("emailLinkMob"),
  phoneLinkMob: document.getElementById("phoneLinkMob"),
  webLinkMob: document.getElementById("webLinkMob"),
  photoMob: document.getElementById("photoMob"),
  qrMob: document.getElementById("qrMob"),
  saveBtnMob: document.getElementById("saveBtnMob"),
  shareBtnMob: document.getElementById("shareBtnMob"),
  findBtnMob: document.getElementById("findBtnMob"),

  // Modals
  sendModal: document.getElementById("sendModal"),
  qrDesk: document.getElementById("qrDesk"),
  nativeShareBtn: document.getElementById("nativeShareBtn"),
  copyLinkBtn: document.getElementById("copyLinkBtn"),
  textLinkBtn: document.getElementById("textLinkBtn"),
  emailLinkBtn: document.getElementById("emailLinkBtn"),

  findModal: document.getElementById("findModal"),
  employeeSearchMob: document.getElementById("employeeSearchMob"),
  findResults: document.getElementById("findResults"),
};

let employees = [];
let current = null;

function qs() {
  return new URLSearchParams(location.search);
}

function getSelectedId() {
  return qs().get("u") || "jessica-flanders";
}

function isForcedMobile() {
  return (qs().get("view") || "").toLowerCase() === "mobile";
}

function canonicalUrlForEmployee(id, view) {
  const url = new URL(location.href);
  url.searchParams.set("u", id);
  if (view) url.searchParams.set("view", view);
  else url.searchParams.delete("view");
  return url.toString();
}

function mobileShareUrl(id) {
  // Always force mobile for QR links
  return canonicalUrlForEmployee(id, "mobile");
}

function setForceMobile(flag) {
  document.body.classList.toggle("force-mobile", !!flag);
}

function safeText(val) {
  return (val ?? "").toString().trim();
}

function buildPhoneDisplay(emp) {
  const base = safeText(emp.phone);
  const ext = safeText(emp.ext);
  if (!base) return "—";
  return ext ? `${base} x${ext}` : base;
}

function resolvePhoto(emp) {
  const photo = safeText(emp.photo);
  if (photo) return photo;
  return safeText(emp.fallbackPhoto) || "./assets/building.jpg";
}

function setImg(imgEl, src, alt) {
  imgEl.src = src;
  imgEl.alt = alt || "";
  imgEl.loading = "lazy";
}

function setLink(aEl, href) {
  aEl.href = href || "#";
}

function setQr(imgEl, url) {
  imgEl.src = QR_API + encodeURIComponent(url);
}

function renderEmployee(emp) {
  current = emp;

  // Desktop text
  if (els.nameDesk) els.nameDesk.textContent = emp.name || "—";
  if (els.titleDesk) els.titleDesk.textContent = emp.title || "—";
  if (els.emailDesk) els.emailDesk.textContent = emp.email || "—";
  if (els.phoneDesk) els.phoneDesk.textContent = buildPhoneDisplay(emp);
  if (els.webDesk) els.webDesk.textContent = emp.website ? new URL(emp.website).hostname : "—";

  // Desktop links
  setLink(els.emailLinkDesk, emp.email ? `mailto:${emp.email}` : "#");
  setLink(els.phoneLinkDesk, emp.phone ? `tel:${emp.phone}` : "#");
  setLink(els.webLinkDesk, emp.website || "#");

  // Desktop photo
  const photoSrc = resolvePhoto(emp);
  setImg(els.photoDesk, photoSrc, `${emp.name || "Employee"} photo`);

  // Mobile text
  if (els.nameMob) els.nameMob.textContent = emp.name || "—";
  if (els.titleMob) els.titleMob.textContent = emp.title || "—";
  if (els.emailMob) els.emailMob.textContent = emp.email || "—";
  if (els.phoneMob) els.phoneMob.textContent = buildPhoneDisplay(emp);
  if (els.webMob) els.webMob.textContent = emp.website ? new URL(emp.website).hostname : "—";

  // Mobile links
  setLink(els.emailLinkMob, emp.email ? `mailto:${emp.email}` : "#");
  setLink(els.phoneLinkMob, emp.phone ? `tel:${emp.phone}` : "#");
  setLink(els.webLinkMob, emp.website || "#");

  // Mobile photo
  setImg(els.photoMob, photoSrc, `${emp.name || "Employee"} photo`);

  // Mobile QR (always present)
  if (els.qrMob) setQr(els.qrMob, mobileShareUrl(emp.id));

  // Update desktop send-to-phone QR if modal opens later
  if (els.qrDesk) setQr(els.qrDesk, mobileShareUrl(emp.id));

  // Sync search boxes
  if (els.employeeSearch) els.employeeSearch.value = emp.name || emp.id;
  if (els.employeeSearchMob) els.employeeSearchMob.value = "";
  if (els.findResults) els.findResults.innerHTML = "";

  // Update URL (keep view param)
  const url = new URL(location.href);
  url.searchParams.set("u", emp.id);
  history.replaceState({}, "", url.toString());
}

function findEmployeeByNameOrId(q) {
  const needle = (q || "").trim().toLowerCase();
  if (!needle) return null;

  // exact id
  let hit = employees.find(e => (e.id || "").toLowerCase() === needle);
  if (hit) return hit;

  // exact name
  hit = employees.find(e => (e.name || "").toLowerCase() === needle);
  if (hit) return hit;

  // partial name
  hit = employees.find(e => (e.name || "").toLowerCase().includes(needle));
  return hit || null;
}

function downloadTextFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function vcardFor(emp) {
  const cleanPhone = safeText(emp.phone).replace(/[^\d+]/g, "");
  const phoneLine = cleanPhone ? `TEL;TYPE=WORK,VOICE:${cleanPhone}` : "";
  const org = "Highlight Industries, Inc.";
  const url = safeText(emp.website);
  const title = safeText(emp.title);
  const email = safeText(emp.email);
  const name = safeText(emp.name);

  // Minimal vCard 3.0 (widely supported)
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `N:${name};;;;`,
    `ORG:${org}`,
    title ? `TITLE:${title}` : "",
    email ? `EMAIL;TYPE=INTERNET,WORK:${email}` : "",
    phoneLine,
    url ? `URL:${url}` : "",
    "END:VCARD"
  ].filter(Boolean).join("\n");
}

async function nativeShare({ title, text, url }) {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch {
    return false;
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied!");
    return true;
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast("Copied!");
    return true;
  }
}

let toastTimer = null;
function toast(msg) {
  clearTimeout(toastTimer);
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "18px";
    el.style.transform = "translateX(-50%)";
    el.style.background = "rgba(0,0,0,.85)";
    el.style.color = "#fff";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "999px";
    el.style.fontWeight = "700";
    el.style.zIndex = "9999";
    el.style.boxShadow = "0 10px 24px rgba(0,0,0,.22)";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  toastTimer = setTimeout(() => { el.style.opacity = "0"; }, 1600);
}

function wireDesktopControls() {
  if (els.openBtn) {
    els.openBtn.addEventListener("click", () => {
      const hit = findEmployeeByNameOrId(els.employeeSearch.value);
      if (hit) renderEmployee(hit);
      else toast("No match found.");
    });
  }

  if (els.employeeSearch) {
    els.employeeSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        els.openBtn?.click();
      }
    });
  }

  if (els.clearBtn) {
    els.clearBtn.addEventListener("click", () => {
      els.employeeSearch.value = "";
      els.employeeSearch.focus();
    });
  }

  if (els.saveBtnDesk) {
    els.saveBtnDesk.addEventListener("click", () => {
      if (!current) return;
      downloadTextFile(`${current.id}.vcf`, vcardFor(current), "text/vcard;charset=utf-8");
    });
  }

  if (els.sendBtnDesk && els.sendModal) {
    els.sendBtnDesk.addEventListener("click", () => {
      if (!current) return;
      setQr(els.qrDesk, mobileShareUrl(current.id));
      els.sendModal.showModal?.();
    });
  }

  // Modal share buttons
  els.nativeShareBtn?.addEventListener("click", async () => {
    if (!current) return;
    const url = mobileShareUrl(current.id);
    const ok = await nativeShare({
      title: current.name,
      text: `${current.name} — ${current.title}`,
      url
    });
    if (!ok) toast("Sharing not supported here. Try Copy Link.");
  });

  els.copyLinkBtn?.addEventListener("click", async () => {
    if (!current) return;
    await copyToClipboard(mobileShareUrl(current.id));
  });

  els.textLinkBtn?.addEventListener("click", () => {
    if (!current) return;
    const url = mobileShareUrl(current.id);
    const msg = encodeURIComponent(`Here’s the contact for ${current.name}: ${url}`);
    // sms: works best on phones; still okay on desktop (may open an app)
    location.href = `sms:?&body=${msg}`;
  });

  els.emailLinkBtn?.addEventListener("click", () => {
    if (!current) return;
    const url = mobileShareUrl(current.id);
    const subject = encodeURIComponent(`Contact: ${current.name}`);
    const body = encodeURIComponent(`${current.name} — ${current.title}\n\n${url}`);
    location.href = `mailto:?subject=${subject}&body=${body}`;
  });
}

function wireMobileControls() {
  els.saveBtnMob?.addEventListener("click", () => {
    if (!current) return;
    downloadTextFile(`${current.id}.vcf`, vcardFor(current), "text/vcard;charset=utf-8");
  });

  // Mobile share: try native share first (AirDrop/Messages/Mail on iOS/macOS Safari),
  // otherwise fall back to the same share modal used on desktop.
  els.shareBtnMob?.addEventListener("click", async () => {
    if (!current) return;
    const url = mobileShareUrl(current.id);
    const ok = await nativeShare({
      title: current.name,
      text: `${current.name} — ${current.title}`,
      url,
    });
    if (ok) return;

    // Fallback: show the share modal
    if (els.sendModal) {
      setQr(els.qrDesk, url);
      els.sendModal.showModal?.();
    } else {
      await copyToClipboard(url);
    }
  });

  els.findBtnMob?.addEventListener("click", () => {
    els.findModal?.showModal?.();
    setTimeout(() => els.employeeSearchMob?.focus(), 50);
    renderFindResults("");
  });

  els.employeeSearchMob?.addEventListener("input", (e) => {
    renderFindResults(e.target.value);
  });
}

function renderFindResults(query) {
  if (!els.findResults) return;

  const q = (query || "").trim().toLowerCase();
  const list = employees
    .filter(e => !q || (e.name || "").toLowerCase().includes(q) || (e.dept || "").toLowerCase().includes(q))
    .slice(0, 25);

  els.findResults.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.style.color = "#666";
    empty.style.padding = "12px 4px";
    empty.textContent = "No matches.";
    els.findResults.appendChild(empty);
    return;
  }

  for (const e of list) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "find-item";
    item.innerHTML = `<div><strong>${e.name}</strong><br><span>${e.title || ""}</span></div><span>Open →</span>`;
    item.addEventListener("click", () => {
      renderEmployee(e);
      els.findModal?.close?.();
    });
    els.findResults.appendChild(item);
  }
}

function parseCSV(text) {
  // Minimal CSV parser with quotes + commas + newlines
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { // escaped quote
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        cur += ch;
      }
    }
  }
  // last cell
  row.push(cur);
  rows.push(row);

  // Drop empty trailing row
  if (rows.length && rows[rows.length - 1].every(v => String(v).trim() === "")) rows.pop();

  return rows;
}

function normalizeEmployee(e) {
  const out = { ...e };

  // Back-compat: if CSV provides first/last, build name
  if (!out.name) {
    const fn = (out.firstName || "").trim();
    const ln = (out.lastName || "").trim();
    out.name = [fn, ln].filter(Boolean).join(" ").trim();
  }

  // Defaults
  if (!out.fallbackPhoto) out.fallbackPhoto = "./assets/building.jpg";

  // Normalize photo empty -> null
  if (out.photo === "") out.photo = null;

  return out;
}

async function loadEmployees() {
  // Prefer CSV so the team can edit in Excel/Sheets easily.
  // Fallback to employees.json if CSV isn't present.
  try {
    const res = await fetch(cacheBust(absUrl("employees.csv")), { cache: "no-store" });
    if (!res.ok) throw new Error("No CSV");
    const text = await res.text();
    const rows = parseCSV(text);
    if (!rows.length) throw new Error("Empty CSV");

    const headers = rows[0].map(h => h.trim());
    const list = [];
    for (let r = 1; r < rows.length; r++) {
      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        const key = headers[c];
        obj[key] = (rows[r][c] ?? "").trim();
      }

      // Cast common fields
      if (obj.photo === "") obj.photo = null;

      list.push(normalizeEmployee(obj));
    }

    employees = list;
    return;
  } catch (err) {
    // JSON fallback (still supported)
    const res = await fetch(cacheBust(absUrl("employees.json")), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load employees data");
    const list = await res.json();
    employees = list.map(normalizeEmployee);
  }
}

function pickAndRenderInitialEmployee() {
  const id = getSelectedId();
  const emp = employees.find(e => e.id === id) || employees[0];
  renderEmployee(emp);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

(async function init() {
  setForceMobile(isForcedMobile());

  try {
    await loadEmployees();
    pickAndRenderInitialEmployee();
  } catch (e) {
    console.error(e);
    toast("Couldn’t load employee data.");
  }

  wireDesktopControls();
  wireMobileControls();
  registerServiceWorker();
})();
