(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const config = window.JAYDENN_CONFIG || {};
  const hasSupabaseConfig = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase);
  const db = hasSupabaseConfig ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY) : null;
  const STORAGE_KEY = "jaydenn_hub_demo_resources_v1";
  const seed = [
    {id:"sample-1",title:"Studio UI Helper",game:"Roblox Studio",access:"no-key",description:"A sample learning resource card. Replace this with code you own or may share.",code:"-- JAYDENN sample resource\\nprint('Hello from JAYDENN!')"},
    {id:"sample-2",title:"Safe Checkpoint Example",game:"Roblox Studio",access:"key",description:"A placeholder entry showing the key-required category.",code:"-- Educational placeholder only\\n-- Add your authorized resource here."},
    {id:"sample-3",title:"Community Utility",game:"Community Tools",access:"no-key",description:"A simple placeholder for a community-approved utility.",code:"-- Add your own authorized code here."}
  ];
  let resources = [], filter = "all", category = "all", session = null, toastTimer;
  const demoMode = !db;

  function readDemo() {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(value) ? value : seed; }
    catch { return seed; }
  }
  function saveDemo() { localStorage.setItem(STORAGE_KEY, JSON.stringify(resources)); }
  async function loadResources() {
    if (db) {
      const {data,error} = await db.from("scripts").select("id,title,game,access,description,code,created_at").order("created_at",{ascending:false});
      if (error) throw error;
      resources = data || [];
    } else resources = readDemo();
    render();
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function iconFor(game) {
    const s = String(game || "J").trim();
    return escapeHtml(s.slice(0,2).toUpperCase());
  }
  function filteredResources() {
    const q = $("searchInput").value.trim().toLowerCase();
    return resources.filter(r => (filter === "all" || r.access === filter) &&
      (category === "all" || r.game === category) &&
      [r.title,r.game,r.description].some(v => String(v || "").toLowerCase().includes(q)));
  }
  function render() {
    const list = filteredResources();
    $("scriptGrid").innerHTML = list.map(r => `<article class="script-card">
      <div class="card-banner"><span class="game-icon">${iconFor(r.game)}</span></div>
      <div class="card-body"><div class="card-meta"><span class="badge ${r.access === "key" ? "key" : ""}">${r.access === "key" ? "KEY REQUIRED" : "NO KEY"}</span><span class="game-name">${escapeHtml(r.game)}</span></div>
      <h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.description || "Community-shared resource.")}</p>
      <div class="card-actions"><button class="copy-btn" data-copy="${escapeHtml(r.id)}">Copy resource</button><button class="details-btn" data-details="${escapeHtml(r.id)}">View</button></div></div></article>`).join("");
    $("emptyState").hidden = list.length !== 0;
    $("resultCount").textContent = `${list.length} resource${list.length === 1 ? "" : "s"}`;
    $("statScripts").textContent = resources.length;
    $("statCategories").textContent = new Set(resources.map(r => r.game)).size;
    $("statViews").textContent = localStorage.getItem("jaydenn_local_visits") || "1";
    const cats = ["all",...new Set(resources.map(r => r.game).filter(Boolean))];
    $("categoryRow").innerHTML = cats.map(c => `<button class="category ${category===c?"active":""}" data-category="${escapeHtml(c)}">${c==="all"?"All categories":escapeHtml(c)}</button>`).join("");
  }
  function notify(message) {
    $("toast").textContent = message; $("toast").classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $("toast").classList.remove("show"),2400);
  }
  async function copyResource(id) {
    const r = resources.find(x => String(x.id) === String(id)); if (!r) return;
    try { await navigator.clipboard.writeText(r.code || ""); notify("Resource copied to clipboard."); }
    catch { const t=document.createElement("textarea");t.value=r.code||"";document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();notify("Resource copied."); }
  }
  function showModal() { $("adminModal").hidden=false; $("adminMessage").textContent=demoMode ? "Preview mode: connect Supabase to enable secure admin login and shared publishing." : ""; }
  function closeModal() { $("adminModal").hidden=true; }
  function setLoggedIn(value) { $("loginPanel").hidden=value; $("managePanel").hidden=!value; }
  function resetForm() { $("scriptForm").reset(); $("editId").value=""; $("saveButton").textContent="Save resource"; }
  function renderAdminList() {
    $("adminList").innerHTML = resources.map(r => `<div class="admin-row"><span>${escapeHtml(r.title)} <small>· ${escapeHtml(r.game)}</small></span><span><button data-edit="${escapeHtml(r.id)}">Edit</button> <button class="delete" data-delete="${escapeHtml(r.id)}">Delete</button></span></div>`).join("") || '<p class="muted">No resources yet.</p>';
  }
  async function refreshAdmin() { renderAdminList(); }
  async function login() {
    if (!db) { $("adminMessage").textContent="Connect Supabase first. Demo mode has no admin login."; return; }
    const email=$("adminEmail").value.trim(), password=$("adminPassword").value;
    const {data,error}=await db.auth.signInWithPassword({email,password});
    if(error) { $("adminMessage").textContent=error.message; return; }
    session=data.session; setLoggedIn(true); $("adminMessage").textContent="Signed in."; await refreshAdmin();
  }
  async function logout() { if(db) await db.auth.signOut(); session=null; setLoggedIn(false); resetForm(); $("adminMessage").textContent="Signed out."; }
  async function saveResource(event) {
    event.preventDefault();
    const payload={title:$("scriptTitle").value.trim(),game:$("scriptGame").value.trim(),access:$("scriptAccess").value,description:$("scriptDescription").value.trim(),code:$("scriptCode").value};
    if(!payload.title || !payload.game || !payload.code) return;
    const id=$("editId").value;
    if(db) {
      if(!session) { $("adminMessage").textContent="Please sign in first."; return; }
      const query=id ? db.from("scripts").update(payload).eq("id",id) : db.from("scripts").insert(payload);
      const {error}=await query;
      if(error) { $("adminMessage").textContent=error.message; return; }
      $("adminMessage").textContent="Resource saved to the shared library.";
      await loadResources();
    } else {
      if(id) resources=resources.map(r=>String(r.id)===id?{...r,...payload}:r);
      else resources.unshift({...payload,id:`local-${Date.now()}`,created_at:new Date().toISOString()});
      saveDemo(); render();
      $("adminMessage").textContent="Saved on this device only (preview mode).";
    }
    resetForm(); await refreshAdmin();
  }
  async function deleteResource(id) {
    if(!confirm("Delete this resource?")) return;
    if(db) {
      const {error}=await db.from("scripts").delete().eq("id",id);
      if(error) { $("adminMessage").textContent=error.message; return; }
      await loadResources();
    } else { resources=resources.filter(r=>String(r.id)!==String(id)); saveDemo(); render(); }
    await refreshAdmin();
  }
  async function init() {
    $("year").textContent=new Date().getFullYear();
    const visits=Number(localStorage.getItem("jaydenn_local_visits")||0)+1;localStorage.setItem("jaydenn_local_visits",String(visits));
    try { await loadResources(); } catch(e) { console.error("Resource load failed:",e); notify("Could not load the library. Check Supabase setup."); }
    $("searchInput").addEventListener("input",render);
    document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();}));
    $("categoryRow").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){category=b.dataset.category;render();}});
    $("scriptGrid").addEventListener("click",e=>{const c=e.target.closest("[data-copy]"),v=e.target.closest("[data-details]");if(c)copyResource(c.dataset.copy);if(v){const r=resources.find(x=>String(x.id)===v.dataset.details);if(r)alert(`${r.title}\\n\\n${r.description||""}\\n\\nAccess: ${r.access==="key"?"Key required":"No key"}`);}});
    $("adminOpen").addEventListener("click",showModal);$("adminClose").addEventListener("click",closeModal);
    $("adminModal").addEventListener("click",e=>{if(e.target===$("adminModal"))closeModal();});
    $("loginButton").addEventListener("click",login);$("logoutButton").addEventListener("click",logout);
    $("scriptForm").addEventListener("submit",saveResource);$("resetForm").addEventListener("click",resetForm);
    $("adminList").addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
      if(edit){const r=resources.find(x=>String(x.id)===edit.dataset.edit);if(!r)return;$("editId").value=r.id;$("scriptTitle").value=r.title;$("scriptGame").value=r.game;$("scriptAccess").value=r.access;$("scriptDescription").value=r.description||"";$("scriptCode").value=r.code||"";$("saveButton").textContent="Update resource";$("scriptTitle").focus();}
      if(del)deleteResource(del.dataset.delete);
    });
    if(db){const {data}=await db.auth.getSession();session=data.session;if(session){setLoggedIn(true);await refreshAdmin();}}
  }
  init();
})();
