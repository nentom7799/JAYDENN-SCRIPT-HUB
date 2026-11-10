
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const config = window.JAYDENN_CONFIG || {};

  const hasSupabaseConfig = Boolean(
    config.SUPABASE_URL &&
    config.SUPABASE_ANON_KEY &&
    window.supabase
  );

  const db = hasSupabaseConfig
    ? window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_ANON_KEY
      )
    : null;

  const STORAGE_KEY = "jaydenn_hub_demo_resources_v1";
  const BUCKET = "script-images";
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  const seed = [
    {
      id: "sample-1",
      title: "Studio UI Helper",
      game: "Roblox Studio",
      access: "no-key",
      description: "A sample learning resource.",
      code: "-- JAYDENN sample resource\nprint('Hello from JAYDENN!')"
    },
    {
      id: "sample-2",
      title: "Safe Checkpoint Example",
      game: "Roblox Studio",
      access: "key",
      description: "A placeholder entry.",
      code: "-- Educational placeholder only"
    },
    {
      id: "sample-3",
      title: "Community Utility",
      game: "Community Tools",
      access: "no-key",
      description: "A community-approved utility.",
      code: "-- Add your own authorized code here."
    }
  ];

  let resources = [];
  let filter = "all";
  let category = "all";
  let session = null;
  let toastTimer;

  const demoMode = !db;

  function readDemo() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value : seed;
    } catch {
      return seed;
    }
  }

  function saveDemo() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function iconFor(game) {
    return escapeHtml(String(game || "J").trim().slice(0, 2).toUpperCase());
  }

  async function loadResources() {
    if (db) {
      const { data, error } = await db
        .from("scripts")
        .select(
          "id,title,game,access,description,code,created_at,cover_image_url,thumbnail_image_url"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      resources = data || [];
    } else {
      resources = readDemo();
    }

    render();
  }

  function filteredResources() {
    const q = $("searchInput").value.trim().toLowerCase();

    return resources.filter(r =>
      (filter === "all" || r.access === filter) &&
      (category === "all" || r.game === category) &&
      [r.title, r.game, r.description].some(v =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }

  function render() {
    const list = filteredResources();

    $("scriptGrid").innerHTML = list.map(r => `
      <article class="script-card">

        <div class="card-banner"
          ${r.cover_image_url
            ? `style="background-image:url('${escapeHtml(r.cover_image_url)}');background-size:cover;background-position:center;"`
            : ""}>
          ${!r.cover_image_url
            ? `<span class="game-icon">${iconFor(r.game)}</span>`
            : ""}
        </div>

        <div class="card-body">

          <div class="card-meta">
            <span class="badge ${r.access === "key" ? "key" : ""}">
              ${r.access === "key" ? "KEY REQUIRED" : "NO KEY"}
            </span>
            <span class="game-name">${escapeHtml(r.game)}</span>
          </div>

          <div class="resource-heading">
            ${r.thumbnail_image_url
              ? `<img class="resource-thumbnail"
                  src="${escapeHtml(r.thumbnail_image_url)}"
                  alt="Resource thumbnail">`
              : ""}
            <h3>${escapeHtml(r.title)}</h3>
          </div>

          <p>${escapeHtml(r.description || "Community-shared resource.")}</p>

          <div class="card-actions">
            <button class="copy-btn" data-copy="${escapeHtml(r.id)}">
              Copy resource
            </button>
            <button class="details-btn" data-details="${escapeHtml(r.id)}">
              View
            </button>
          </div>

        </div>
      </article>
    `).join("");

    $("emptyState").hidden = list.length !== 0;

    $("resultCount").textContent =
      `${list.length} resource${list.length === 1 ? "" : "s"}`;

    $("statScripts").textContent = resources.length;

    $("statCategories").textContent =
      new Set(resources.map(r => r.game)).size;

    $("statViews").textContent =
      localStorage.getItem("jaydenn_local_visits") || "1";

    const cats = [
      "all",
      ...new Set(resources.map(r => r.game).filter(Boolean))
    ];

    $("categoryRow").innerHTML = cats.map(c => `
      <button class="category ${category === c ? "active" : ""}"
        data-category="${escapeHtml(c)}">
        ${c === "all" ? "All categories" : escapeHtml(c)}
      </button>
    `).join("");
  }

  function notify(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      $("toast").classList.remove("show");
    }, 2400);
  }

  async function copyResource(id) {
    const r = resources.find(x => String(x.id) === String(id));
    if (!r) return;

    try {
      await navigator.clipboard.writeText(r.code || "");
      notify("Resource copied to clipboard.");
    } catch {
      const t = document.createElement("textarea");
      t.value = r.code || "";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
      notify("Resource copied.");
    }
  }

  function showModal() {
    $("adminModal").hidden = false;

    $("adminMessage").textContent = demoMode
      ? "Preview mode: connect Supabase to enable secure admin login and shared publishing."
      : "";
  }

  function closeModal() {
    $("adminModal").hidden = true;
  }

  function setLoggedIn(value) {
    $("loginPanel").hidden = value;
    $("managePanel").hidden = !value;
  }

  function clearPreview(id) {
    const img = $(id);
    if (img) {
      img.removeAttribute("src");
      img.hidden = true;
    }
  }

  function showPreview(id, url) {
    const img = $(id);
    if (!img || !url) return;

    img.src = url;
    img.hidden = false;
  }

  function resetForm() {
    $("scriptForm").reset();
    $("editId").value = "";
    $("saveButton").textContent = "Save resource";

    clearPreview("coverPreview");
    clearPreview("thumbnailPreview");
  }

  function setupPreview(inputId, previewId) {
    const input = $(inputId);
    const preview = $(previewId);

    if (!input || !preview) return;

    input.addEventListener("change", () => {
      const file = input.files[0];

      if (!file) {
        clearPreview(previewId);
        return;
      }

      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (!allowed.includes(file.type)) {
        alert("Please select a JPG, PNG, or WebP image.");
        input.value = "";
        clearPreview(previewId);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        alert("Image must be 5 MB or smaller.");
        input.value = "";
        clearPreview(previewId);
        return;
      }

      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
    });
  }

  function renderAdminList() {
    $("adminList").innerHTML = resources.map(r => `
      <div class="admin-row">
        <span>
          ${escapeHtml(r.title)}
          <small>· ${escapeHtml(r.game)}</small>
        </span>
        <span>
          <button data-edit="${escapeHtml(r.id)}">Edit</button>
          <button class="delete" data-delete="${escapeHtml(r.id)}">
            Delete
          </button>
        </span>
      </div>
    `).join("") || '<p class="muted">No resources yet.</p>';
  }

  async function refreshAdmin() {
    renderAdminList();
  }

  async function login() {
    if (!db) {
      $("adminMessage").textContent =
        "Connect Supabase first. Demo mode has no admin login.";
      return;
    }

    const email = $("adminEmail").value.trim();
    const password = $("adminPassword").value;

    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      $("adminMessage").textContent = error.message;
      return;
    }

    session = data.session;
    setLoggedIn(true);
    $("adminMessage").textContent = "Signed in.";

    await refreshAdmin();
  }

  async function logout() {
    if (db) await db.auth.signOut();

    session = null;
    setLoggedIn(false);
    resetForm();

    $("adminMessage").textContent = "Signed out.";
  }

  async function uploadImage(file, type) {
    if (!file) return null;

    if (!db || !session) {
      throw new Error("Please sign in to upload images.");
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowed.includes(file.type)) {
      throw new Error("Only JPG, PNG, and WebP images are allowed.");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("Image must be 5 MB or smaller.");
    }

    const extension = file.type === "image/jpeg"
      ? "jpg"
      : file.type.split("/")[1];

    const uniqueName = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const path = `${type}/${uniqueName}.${extension}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) throw error;

    const { data } = db.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function saveResource(event) {
    event.preventDefault();

    const saveButton = $("saveButton");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
      const payload = {
        title: $("scriptTitle").value.trim(),
        game: $("scriptGame").value.trim(),
        access: $("scriptAccess").value,
        description: $("scriptDescription").value.trim(),
        code: $("scriptCode").value
      };

      if (!payload.title || !payload.game || !payload.code) {
        $("adminMessage").textContent =
          "Please complete title, game and resource code.";
        return;
      }

      const id = $("editId").value;

      const coverFile = $("coverImage")?.files?.[0];
      const thumbnailFile = $("thumbnailImage")?.files?.[0];

      if (db) {
        if (!session) {
          $("adminMessage").textContent = "Please sign in first.";
          return;
        }

        if (coverFile) {
          payload.cover_image_url = await uploadImage(
            coverFile,
            "covers"
          );
        }

        if (thumbnailFile) {
          payload.thumbnail_image_url = await uploadImage(
            thumbnailFile,
            "thumbnails"
          );
        }

        const query = id
          ? db.from("scripts").update(payload).eq("id", id)
          : db.from("scripts").insert(payload);

        const { error } = await query;

        if (error) throw error;

        $("adminMessage").textContent =
          "Resource and images saved successfully.";

        await loadResources();

      } else {
        if (coverFile || thumbnailFile) {
          throw new Error(
            "Image upload requires Supabase. Please connect Supabase first."
          );
        }

        if (id) {
          resources = resources.map(r =>
            String(r.id) === id
              ? { ...r, ...payload }
              : r
          );
        } else {
          resources.unshift({
            ...payload,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString()
          });
        }

        saveDemo();
        render();

        $("adminMessage").textContent =
          "Saved on this device only (preview mode).";
      }

      resetForm();
      await refreshAdmin();

    } catch (error) {
      console.error("Save failed:", error);
      $("adminMessage").textContent =
        error.message || "Could not save resource.";
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = $("editId").value
        ? "Update resource"
        : "Save resource";
    }
  }

  async function deleteResource(id) {
    if (!confirm("Delete this resource?")) return;

    try {
      if (db) {
        if (!session) {
          $("adminMessage").textContent = "Please sign in first.";
          return;
        }

        const { error } = await db
          .from("scripts")
          .delete()
          .eq("id", id);

        if (error) throw error;

        await loadResources();

      } else {
        resources = resources.filter(
          r => String(r.id) !== String(id)
        );

        saveDemo();
        render();
      }

      await refreshAdmin();

      $("adminMessage").textContent = "Resource deleted.";

    } catch (error) {
      $("adminMessage").textContent =
        error.message || "Could not delete resource.";
    }
  }

  async function init() {
    $("year").textContent = new Date().getFullYear();

    const visits =
      Number(localStorage.getItem("jaydenn_local_visits") || 0) + 1;

    localStorage.setItem(
      "jaydenn_local_visits",
      String(visits)
    );

    setupPreview("coverImage", "coverPreview");
    setupPreview("thumbnailImage", "thumbnailPreview");

    try {
      await loadResources();
    } catch (e) {
      console.error("Resource load failed:", e);
      notify("Could not load the library. Check Supabase setup.");
    }

    $("searchInput").addEventListener("input", render);

    document.querySelectorAll(".filter").forEach(b => {
      b.addEventListener("click", () => {
        filter = b.dataset.filter;

        document.querySelectorAll(".filter").forEach(x => {
          x.classList.toggle("active", x === b);
        });

        render();
      });
    });

    $("categoryRow").addEventListener("click", e => {
      const b = e.target.closest("[data-category]");

      if (b) {
        category = b.dataset.category;
        render();
      }
    });

    $("scriptGrid").addEventListener("click", e => {
      const c = e.target.closest("[data-copy]");
      const v = e.target.closest("[data-details]");

      if (c) copyResource(c.dataset.copy);

      if (v) {
        const r = resources.find(
          x => String(x.id) === v.dataset.details
        );

        if (r) {
          alert(
            `${r.title}\n\n${r.description || ""}\n\nAccess: ${
              r.access === "key" ? "Key required" : "No key"
            }`
          );
        }
      }
    });

    $("adminOpen").addEventListener("click", showModal);
    $("adminClose").addEventListener("click", closeModal);

    $("adminModal").addEventListener("click", e => {
      if (e.target === $("adminModal")) closeModal();
    });

    $("loginButton").addEventListener("click", login);
    $("logoutButton").addEventListener("click", logout);

    $("scriptForm").addEventListener("submit", saveResource);
    $("resetForm").addEventListener("click", resetForm);

    $("adminList").addEventListener("click", e => {
      const edit = e.target.closest("[data-edit]");
      const del = e.target.closest("[data-delete]");

      if (edit) {
        const r = resources.find(
          x => String(x.id) === edit.dataset.edit
        );

        if (!r) return;

        $("editId").value = r.id;
        $("scriptTitle").value = r.title;
        $("scriptGame").value = r.game;
        $("scriptAccess").value = r.access;
        $("scriptDescription").value = r.description || "";
        $("scriptCode").value = r.code || "";

        $("saveButton").textContent = "Update resource";

        clearPreview("coverPreview");
        clearPreview("thumbnailPreview");

        if (r.cover_image_url) {
          showPreview("coverPreview", r.cover_image_url);
        }

        if (r.thumbnail_image_url) {
          showPreview(
            "thumbnailPreview",
            r.thumbnail_image_url
          );
        }

        $("scriptTitle").focus();
      }

      if (del) {
        deleteResource(del.dataset.delete);
      }
    });

    if (db) {
      const { data } = await db.auth.getSession();

      session = data.session;

      if (session) {
        setLoggedIn(true);
        await refreshAdmin();
      }
    }
  }

  init();

})();
