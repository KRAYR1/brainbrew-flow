// Runs on every non-BrainBrews page. Reads the mirrored state and, if the
// current host is on the blocked list during a running WORK Pomodoro, injects
// the Whiskers overlay.
(function () {
  const SUPABASE_URL = "https://jkoctfltndapqerdmgvn.supabase.co";
  const ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprb2N0Zmx0bmRhcHFlcmRtZ3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjU5MjksImV4cCI6MjA5MzEwMTkyOX0.8hDmgk-CKEYBw3nBIceqALfQYwlAY5wWR6tE27tXkwA";
  const BRAINBREWS_URL = "https://brainbrew-flow.lovable.app/";

  let host = null; // shadow host element
  let currentSites = [];

  function hostMatches(hostname, sites) {
    return sites.some((s) => {
      const url = (s.url || "").toLowerCase();
      if (!url) return false;
      return hostname === url || hostname.endsWith("." + url);
    });
  }

  function shouldBlock(state) {
    if (!state) return false;
    if (!state.isRunning) return false;
    if (state.mode !== "work") return false;
    if (!state.blockerEnabled) return false;
    return hostMatches(location.hostname.replace(/^www\./, ""), state.sites || []);
  }

  function removeOverlay() {
    if (host && host.parentNode) host.parentNode.removeChild(host);
    host = null;
  }

  function injectOverlay(state) {
    if (host) return;
    currentSites = state.sites || [];
    host = document.createElement("div");
    host.id = "whiskers-guard-root";
    host.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;pointer-events:auto;";
    const shadow = host.attachShadow({ mode: "closed" });

    shadow.innerHTML = `
      <style>
        :host, .wrap { all: initial; }
        .wrap {
          position: fixed; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: radial-gradient(ellipse at 50% 40%, #1a1040 0%, #0a0820 60%, #050410 100%);
          font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
          color: #fff; text-align: center; padding: 24px; overflow: auto;
          animation: fadein .3s ease;
        }
        @keyframes fadein { from{opacity:0} to{opacity:1} }
        @keyframes twinkle { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
        @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .stars { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
        .star { position:absolute; background:#fff; border-radius:50%; }
        .cat { font-size: 110px; animation: floaty 3s ease-in-out infinite;
               filter: drop-shadow(0 0 30px rgba(140,110,255,.6)); margin-bottom: 4px; }
        h1 { font-size: 1.8rem; font-weight: 900; margin: 4px 0 2px;
             text-shadow: 0 0 24px rgba(120,100,255,.9), 0 2px 4px rgba(0,0,0,.5);
             letter-spacing: 2px; }
        .sub { font-size: .95rem; color:#9988ff; font-weight:700; margin-bottom:14px;
               text-shadow: 0 0 12px rgba(150,120,255,.6); }
        .card { width: min(520px, 100%); background: rgba(255,255,255,.06);
                border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:18px;
                backdrop-filter: blur(10px); text-align:left; }
        .label { font-size:.7rem; text-transform:uppercase; letter-spacing:1.4px;
                 color:#a8b3ff; font-weight:700; margin-bottom:8px; }
        .prompt { font-size:.95rem; margin-bottom:12px; line-height:1.45; }
        textarea { width:100%; padding:10px 12px; background:rgba(0,0,0,.35);
                   border:1px solid rgba(255,255,255,.18); border-radius:10px;
                   color:#fff; font-size:.9rem; resize:vertical; font-family:inherit; outline:none;
                   box-sizing: border-box; }
        button { padding:11px 16px; font-size:.95rem; font-weight:700; color:#fff;
                 border:none; border-radius:10px; cursor:pointer; font-family:inherit; }
        button:disabled { cursor:not-allowed; opacity:.5; }
        .ask { margin-top:10px; width:100%;
               background:linear-gradient(135deg,#7c3aed,#4f46e5); }
        .result { margin-top:14px; padding:14px; border-radius:12px; }
        .r-ent { background:linear-gradient(135deg,rgba(255,60,90,.18),rgba(255,120,60,.12));
                 border:1px solid rgba(255,120,150,.45); }
        .r-stu { background:linear-gradient(135deg,rgba(80,200,140,.18),rgba(60,180,255,.12));
                 border:1px solid rgba(120,220,180,.4); }
        .r-label { font-size:.7rem; font-weight:800; letter-spacing:1.4px;
                   text-transform:uppercase; margin-bottom:6px; }
        .r-ent .r-label { color:#ffb0c4; } .r-stu .r-label { color:#a8f0c8; }
        .r-body { font-size:.95rem; line-height:1.5; }
        .chips { margin-top:14px; max-width:520px; display:flex; flex-wrap:wrap;
                 gap:6px; justify-content:center; }
        .chip { font-size:.7rem; padding:3px 9px; border-radius:999px;
                background:rgba(255,90,120,.18); color:#ffd0dc;
                border:1px solid rgba(255,120,150,.35); }
        .actions { display:flex; gap:10px; margin-top:18px; flex-wrap:wrap; justify-content:center; }
        .btn-back { padding:12px 28px; border-radius:50px;
                    background:linear-gradient(135deg,#10b981,#059669);
                    box-shadow:0 4px 24px rgba(16,185,129,.45); }
        .btn-back:disabled { background:rgba(255,255,255,.08); box-shadow:none;
                             color:rgba(255,255,255,.4); }
        .btn-go { padding:12px 28px; border-radius:50px;
                  background:linear-gradient(135deg,#7c3aed,#4f46e5);
                  box-shadow:0 4px 24px rgba(120,60,255,.55); }
        .err { margin-top:10px; color:#ffb0b0; font-size:.85rem; }
      </style>
      <div class="wrap">
        <div class="stars" id="stars"></div>
        <div class="cat">🐱</div>
        <h1>WHISKERS IS WATCHING</h1>
        <p class="sub">This site is blocked during your BrainBrews Pomodoro.</p>
        <div class="card">
          <p class="label">🐱 Whiskers asks:</p>
          <p class="prompt">What were you about to do? Tell me your intent and I'll decide if it can wait until the timer ends.</p>
          <textarea id="intent" rows="2" placeholder="e.g. 'watch one quick video' or 'look up a chemistry formula'"></textarea>
          <button class="ask" id="askBtn">Ask Whiskers 🐾</button>
          <p class="err" id="err" style="display:none;"></p>
          <div id="result"></div>
        </div>
        <div class="chips" id="chips"></div>
        <div class="actions">
          <button class="btn-back" id="backBtn" disabled title="Whiskers must approve first">Locked 🔒</button>
          <button class="btn-go" id="goBtn" style="display:none;">Take me to BrainBrews →</button>
        </div>
      </div>
    `;

    // Starfield
    const starsEl = shadow.getElementById("stars");
    for (let i = 0; i < 60; i++) {
      const s = document.createElement("span");
      s.className = "star";
      const sz = 1 + Math.random() * 2;
      s.style.cssText = `top:${Math.random()*100}%;left:${Math.random()*100}%;
        width:${sz}px;height:${sz}px;
        animation: twinkle ${2+Math.random()*3}s ease-in-out infinite;`;
      starsEl.appendChild(s);
    }

    // Chips
    const chipsEl = shadow.getElementById("chips");
    currentSites.slice(0, 10).forEach((s) => {
      const c = document.createElement("span");
      c.className = "chip";
      c.textContent = s.label || s.url;
      chipsEl.appendChild(c);
    });

    const intentEl = shadow.getElementById("intent");
    const askBtn = shadow.getElementById("askBtn");
    const backBtn = shadow.getElementById("backBtn");
    const goBtn = shadow.getElementById("goBtn");
    const resultEl = shadow.getElementById("result");
    const errEl = shadow.getElementById("err");

    backBtn.addEventListener("click", () => {
      if (!backBtn.disabled) removeOverlay();
    });
    goBtn.addEventListener("click", () => {
      window.location.href = BRAINBREWS_URL;
    });

    let submitting = false;
    askBtn.addEventListener("click", async () => {
      const intent = intentEl.value.trim();
      if (!intent || submitting) return;
      submitting = true;
      askBtn.textContent = "Whiskers is thinking…";
      askBtn.disabled = true;
      intentEl.disabled = true;
      errEl.style.display = "none";

      try {
        const siteList = currentSites.map((s) => s.label || s.url).join(", ");
        const res = await fetch(`${SUPABASE_URL}/functions/v1/cat-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": ANON_KEY,
            "Authorization": `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({ intent, site: siteList || location.hostname }),
        });
        if (!res.ok) throw new Error("AI error " + res.status);
        const data = await res.json();
        const cls = data.classification === "study" ? "study" : "entertainment";
        const reply = data.reply ||
          (cls === "entertainment"
            ? "Meow! Come back to BrainBrews and finish the timer. 🐾"
            : "Purr — try BrainBrews' own study tools first. 🐾");

        const div = document.createElement("div");
        div.className = "result " + (cls === "entertainment" ? "r-ent" : "r-stu");
        div.innerHTML = `
          <p class="r-label">${cls === "entertainment"
            ? "🚫 Entertainment detected — Blocked"
            : "📚 Study intent — Proceed mindfully"}</p>
          <p class="r-body"></p>
        `;
        div.querySelector(".r-body").textContent = reply;
        resultEl.appendChild(div);
        askBtn.style.display = "none";

        if (cls === "study") {
          backBtn.disabled = false;
          backBtn.textContent = "Back to studying 📚";
        } else {
          goBtn.style.display = "inline-block";
        }
      } catch (e) {
        errEl.textContent = "Whiskers couldn't reach the AI. Stay focused anyway! 🐾";
        errEl.style.display = "block";
        askBtn.disabled = false;
        askBtn.textContent = "Ask Whiskers 🐾";
        intentEl.disabled = false;
        submitting = false;
      }
    });

    (document.documentElement || document.body).appendChild(host);
  }

  function apply(state) {
    if (shouldBlock(state)) {
      injectOverlay(state);
    } else {
      removeOverlay();
    }
  }

  // Initial check
  chrome.storage.local.get("bb_state", (r) => apply(r.bb_state));

  // Live updates
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.bb_state) return;
    apply(changes.bb_state.newValue);
  });
})();
