// Socratic Logic Study — app UI
(function () {
  const { shuffle, pick } = window.LOGIC;
  const UNITS = window.UNITS;
  const TERMS = window.TERMS.map(([unit, term, def], i) => ({ id: `t${i}:${term}`, unit, term, def }));
  const DECKS = window.DECKS;
  const $app = document.getElementById("app");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- storage ----------
  const KEY = "sls-v1";
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { state = {}; }
  state.units ||= UNITS.map((u) => u.id);
  state.cards ||= {};
  state.stats ||= {};
  state.best ||= {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const record = (unit, ok) => {
    const s = (state.stats[unit] ||= { r: 0, w: 0 });
    ok ? s.r++ : s.w++;
    save();
  };

  // ---------- activities ----------
  const GEN = [
    { id: "propType", name: "Proposition Sorter", icon: "🅰️", units: [5], desc: "Classify A/E/I/O and spot distributed terms.", gen: window.LOGIC.genPropType },
    { id: "square", name: "Square of Opposition", icon: "⬛", units: [6], desc: "If this is true, what about that?", gen: window.LOGIC.genSquare },
    { id: "immediate", name: "Conversion, Obversion, Contraposition", icon: "🔄", units: [6], desc: "Find the valid immediate inference.", gen: window.LOGIC.genImmediate },
    { id: "syllogism", name: "Syllogism Judge", icon: "⚖️", units: [8], desc: "Valid? Which rule is broken? Mood & figure?", gen: window.LOGIC.genSyllogism },
    { id: "argform", name: "Argument Forms", icon: "🔗", units: [9], desc: "Modus ponens, tollens, and their fallacies.", gen: window.LOGIC.genArgForm },
  ];
  for (const d of DECKS) {
    GEN.push({
      id: d.id, name: d.name, icon: d.icon, units: [d.unit], desc: d.desc,
      gen: () => {
        const it = pick(d.items);
        const opts = it.opts || shuffle([it.a, ...shuffle(d.pool.filter((o) => o !== it.a)).slice(0, Math.min(5, d.pool.length - 1))]);
        return { unit: d.unit, prompt: d.desc, body: esc(it.q), options: it.opts ? shuffle(opts) : opts, correct: [it.a], why: esc(it.why) };
      },
    });
  }

  const selTerms = () => TERMS.filter((t) => state.units.includes(t.unit));
  const selGens = () => GEN.filter((g) => g.units.some((u) => state.units.includes(u)));

  function termQuestion(pool) {
    const t = pick(pool);
    const same = TERMS.filter((x) => x !== t && x.unit === t.unit);
    const others = TERMS.filter((x) => x !== t && x.unit !== t.unit);
    const distract = shuffle(same).slice(0, 3);
    while (distract.length < 3) distract.push(pick(others.filter((o) => !distract.includes(o))));
    if (Math.random() < 0.5) {
      return { unit: t.unit, prompt: "Which term matches this definition?", body: esc(t.def), options: shuffle([t, ...distract].map((x) => x.term)), correct: [t.term], why: `<b>${esc(t.term)}</b>: ${esc(t.def)}` };
    }
    return { unit: t.unit, prompt: "What does this term mean?", body: `<b>${esc(t.term)}</b>`, options: shuffle([t, ...distract].map((x) => x.def)), correct: [t.def], why: `<b>${esc(t.term)}</b>: ${esc(t.def)}`, long: true };
  }

  // ---------- views ----------
  function home() {
    const terms = selTerms();
    const gens = selGens();
    const unitRow = (u) => {
      const ts = TERMS.filter((t) => t.unit === u.id);
      const mastered = ts.filter((t) => (state.cards[t.id]?.box || 0) >= 3).length;
      const st = state.stats[u.id];
      const acc = st && st.r + st.w ? Math.round((100 * st.r) / (st.r + st.w)) + "%" : "—";
      const on = state.units.includes(u.id);
      return `<button class="unit ${on ? "on" : ""}" data-unit="${u.id}">
        <span class="check">${on ? "✓" : ""}</span>
        <span class="utext"><span class="utitle">${u.id}. ${esc(u.title)}</span>
        <span class="umeta">${mastered}/${ts.length} cards mastered · accuracy ${acc}</span>
        <span class="bar"><span style="width:${ts.length ? (100 * mastered) / ts.length : 0}%"></span></span></span>
      </button>`;
    };
    $app.innerHTML = `
      <header class="top"><div class="hero">${FUN.socrates("happy", 96)}<div class="bubble">${FUN.quip("hello")}</div></div>
        <h1>Socratic Logic <span class="wiggle">Study</span>!</h1><p class="sub">Pick your chapters, then pick your game. 🎲</p></header>
      <section class="card">
        <div class="row"><h2>📚 Chapters</h2><span class="links"><a data-all>All</a> · <a data-none>None</a></span></div>
        <div class="units">${UNITS.map(unitRow).join("")}</div>
      </section>
      <h2 class="section">🧠 Memorize</h2>
      <div class="grid">
        ${tile("flash", "🃏", "Flashcards", `${terms.length} cards · spaced repetition`, terms.length)}
        ${tile("quiz", "❓", "Term Quiz", "Multiple choice, both directions", terms.length >= 4)}
        ${tile("match", "🧩", "Matching", "Pair terms with definitions", terms.length >= 4)}
        ${tile("challenge", "🏆", "Chapter Challenge", "15 mixed questions", terms.length >= 4 || gens.length)}
      </div>
      <h2 class="section">🤸 Practice the concepts</h2>
      <div class="grid">${GEN.map((g) => tile("gen:" + g.id, g.icon, g.name, `Ch. ${g.units.join(", ")} · ${g.desc}`, g.units.some((u) => state.units.includes(u)))).join("")}</div>
      <p class="foot">Progress is saved on this device. <a data-reset>Reset progress</a></p>`;
    $app.querySelectorAll("[data-unit]").forEach((b) => b.onclick = () => {
      const id = +b.dataset.unit;
      state.units = state.units.includes(id) ? state.units.filter((x) => x !== id) : [...state.units, id].sort((a, b) => a - b);
      save(); home();
    });
    $app.querySelector("[data-all]").onclick = () => { state.units = UNITS.map((u) => u.id); save(); home(); };
    $app.querySelector("[data-none]").onclick = () => { state.units = []; save(); home(); };
    $app.querySelector("[data-reset]").onclick = () => {
      if (confirm("Erase all saved progress?")) { state.cards = {}; state.stats = {}; state.best = {}; save(); home(); }
    };
    $app.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => go(b.dataset.go));
  }
  function tile(go, icon, name, desc, enabled) {
    return `<button class="tile" data-go="${go}" ${enabled ? "" : "disabled"}><span class="icon">${icon}</span><span class="tname">${esc(name)}</span><span class="tdesc">${esc(desc)}</span></button>`;
  }
  function go(where) {
    window.scrollTo(0, 0);
    if (where === "flash") return flashcards();
    if (where === "quiz") return runQuiz("Term Quiz", () => termQuestion(selTerms()), 10, "quiz");
    if (where === "match") return matching();
    if (where === "challenge") return challenge();
    const g = GEN.find((x) => "gen:" + x.id === where);
    runQuiz(g.name, g.gen, 10, g.id);
  }
  const header = (title, extra = "") => `<header class="bar-top"><button class="back" data-back>‹ Home</button><span class="ttl">${esc(title)}</span><span class="extra">${extra}</span></header>`;
  const bindBack = () => ($app.querySelector("[data-back]").onclick = home);

  // ---------- quiz runner ----------
  function runQuiz(title, gen, total, key) {
    let n = 0, score = 0, streak = 0;
    const next = () => {
      if (n >= total) return finish();
      n++;
      const q = gen();
      $app.innerHTML = header(title, `${n}/${total} · 🔥${streak}`) + `
        <div class="qwrap">
          <p class="prompt">${q.prompt}</p>
          ${q.body ? `<div class="qbody">${q.body}</div>` : ""}
          <div class="opts ${q.long ? "long" : ""}">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join("")}</div>
          <div class="feedback" hidden></div>
        </div>`;
      bindBack();
      const btns = [...$app.querySelectorAll(".opt")];
      btns.forEach((b) => b.onclick = () => {
        const choice = q.options[+b.dataset.i];
        const ok = q.correct.includes(choice);
        ok ? (score++, streak++) : (streak = 0);
        record(q.unit, ok);
        btns.forEach((x) => {
          x.disabled = true;
          if (q.correct.includes(q.options[+x.dataset.i])) x.classList.add("right");
        });
        if (!ok) b.classList.add("wrong");
        const fb = $app.querySelector(".feedback");
        fb.hidden = false;
        if (ok) FUN.confetti(18); else $app.querySelector(".qwrap").classList.add("shake");
        fb.innerHTML = `<div class="fb-head">${FUN.socrates(ok ? "wow" : "sad", 64)}<div class="bubble small-b ${ok ? "good" : "bad"}">${FUN.quip(ok ? "right" : "wrong")}</div></div><p>${q.why || ""}</p><button class="primary" data-next>${n >= total ? "See results" : "Next ›"}</button>`;
        fb.querySelector("[data-next]").onclick = next;
        fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    };
    const finish = () => {
      const pct = Math.round((100 * score) / total);
      if (pct >= 60) setTimeout(() => FUN.confetti(pct >= 90 ? 60 : 30), 150);
      const prev = state.best[key] || 0;
      if (pct > prev) { state.best[key] = pct; save(); }
      $app.innerHTML = header(title) + `<div class="done">
        ${FUN.socrates(pct >= 70 ? "happy" : pct >= 40 ? "think" : "sad", 140)}
        <div class="bubble">${FUN.quip(pct >= 90 ? "great" : pct >= 60 ? "ok" : "low")}</div>
        <div class="big">${pct}%</div><p>${score} of ${total} correct${pct > prev && prev ? " — new best! 🏅" : ""}</p>
        <p class="small">Best: ${Math.max(pct, prev)}%</p>
        <button class="primary" data-again>Play again</button></div>`;
      bindBack();
      $app.querySelector("[data-again]").onclick = () => runQuiz(title, gen, total, key);
    };
    next();
  }

  function challenge() {
    const terms = selTerms();
    const gens = selGens();
    const gen = () => (terms.length >= 4 && (!gens.length || Math.random() < 0.4) ? termQuestion(terms) : pick(gens).gen());
    runQuiz("Chapter Challenge", gen, 15, "challenge:" + state.units.join(","));
  }

  // ---------- flashcards (Leitner spaced repetition) ----------
  const DAY = 864e5;
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  function flashcards() {
    const now = Date.now();
    const pool = selTerms();
    const due = pool.filter((t) => (state.cards[t.id]?.due || 0) <= now);
    let queue = shuffle(due).sort((a, b) => (state.cards[a.id]?.box || 0) - (state.cards[b.id]?.box || 0)).slice(0, 20);
    let reverse = state.reverse || false;
    let done = 0;
    if (!queue.length) {
      $app.innerHTML = header("Flashcards") + `<div class="done">${FUN.socrates("think", 130)}<div class="bubble">All caught up! Even I need a nap sometimes. 😴</div><p>Nothing due right now in these chapters.</p>
        <button class="primary" data-cram>Review all anyway</button></div>`;
      bindBack();
      $app.querySelector("[data-cram]").onclick = () => { queue = shuffle(pool).slice(0, 20); show(); };
      return;
    }
    function show() {
      if (!queue.length) {
        $app.innerHTML = header("Flashcards") + `<div class="done">${FUN.socrates("happy", 140)}<div class="bubble">${FUN.quip("great")}</div><p>Session complete — ${done} cards reviewed. 🎉</p><button class="primary" data-again>Keep going</button></div>`;
        bindBack();
        $app.querySelector("[data-again]").onclick = flashcards;
        return;
      }
      const t = queue[0];
      const box = state.cards[t.id]?.box || 0;
      const front = reverse ? esc(t.def) : `<b>${esc(t.term)}</b>`;
      const back = reverse ? `<b>${esc(t.term)}</b>` : esc(t.def);
      $app.innerHTML = header("Flashcards", `${queue.length} left`) + `
        <div class="fc-tools"><button class="chip" data-flip-mode>${reverse ? "Definition → Term" : "Term → Definition"} ⇄</button><span class="small">Ch. ${t.unit} · box ${box}/6</span></div>
        <div class="flash" data-flip><div class="face f-front">${front}<span class="hint">👆 Tap to flip!</span></div><div class="face f-back">${back}</div></div>
        <div class="fc-actions" hidden>
          <button class="miss" data-r="0">😵 Missed it</button><button class="hit" data-r="1">😎 Knew it</button>
        </div>`;
      bindBack();
      const card = $app.querySelector(".flash");
      card.onclick = () => { card.classList.toggle("flipped"); $app.querySelector(".fc-actions").hidden = false; };
      $app.querySelector("[data-flip-mode]").onclick = () => { reverse = !reverse; state.reverse = reverse; save(); show(); };
      $app.querySelectorAll("[data-r]").forEach((b) => b.onclick = () => {
        const ok = b.dataset.r === "1";
        const c = (state.cards[t.id] ||= { box: 0, due: 0 });
        queue.shift();
        if (ok) FUN.confetti(10);
        if (ok) { c.box = Math.min(6, c.box + 1); c.due = Date.now() + INTERVALS[c.box] * DAY; done++; }
        else { c.box = 0; c.due = 0; queue.splice(Math.min(3, queue.length), 0, t); }
        record(t.unit, ok);
        save(); show();
      });
    }
    show();
  }

  // ---------- matching ----------
  function matching() {
    const set = shuffle(selTerms()).slice(0, 6);
    const left = shuffle(set), right = shuffle(set);
    let sel = null, matched = 0, misses = 0;
    const start = Date.now();
    $app.innerHTML = header("Matching", `<span data-timer>0s</span>`) + `
      <p class="prompt center">Tap a term, then its definition.</p>
      <div class="match"><div class="col">${left.map((t) => `<button class="m term" data-id="${esc(t.id)}">${esc(t.term)}</button>`).join("")}</div>
      <div class="col">${right.map((t) => `<button class="m def" data-id="${esc(t.id)}">${esc(t.def)}</button>`).join("")}</div></div>`;
    bindBack();
    const timerEl = $app.querySelector("[data-timer]");
    const timer = setInterval(() => { if (!document.body.contains(timerEl)) return clearInterval(timer); timerEl.textContent = Math.round((Date.now() - start) / 1000) + "s"; }, 500);
    $app.querySelectorAll(".m").forEach((b) => b.onclick = () => {
      if (b.classList.contains("ok")) return;
      if (!sel || sel.classList.contains(b.classList.contains("term") ? "term" : "def")) {
        $app.querySelectorAll(".m.sel").forEach((x) => x.classList.remove("sel"));
        sel = b; b.classList.add("sel"); return;
      }
      const t = TERMS.find((x) => x.id === b.dataset.id);
      if (sel.dataset.id === b.dataset.id) {
        sel.classList.remove("sel"); sel.classList.add("ok"); b.classList.add("ok");
        sel.disabled = b.disabled = true; matched++; record(t.unit, true);
      } else {
        misses++; const s = sel; s.classList.add("bad"); b.classList.add("bad");
        setTimeout(() => { s.classList.remove("bad", "sel"); b.classList.remove("bad"); }, 450);
      }
      sel = null;
      if (matched === set.length) {
        clearInterval(timer); FUN.confetti(40);
        const secs = Math.round((Date.now() - start) / 1000);
        setTimeout(() => {
          $app.innerHTML = header("Matching") + `<div class="done">${FUN.socrates("wow", 140)}<div class="bubble">${secs < 30 ? "Speedy as Hermes! ⚡" : "All matched! Well paired."}</div><div class="big">${secs}s</div><p>${misses} miss${misses === 1 ? "" : "es"}</p><button class="primary" data-again>Play again</button></div>`;
          bindBack(); $app.querySelector("[data-again]").onclick = matching;
        }, 400);
      }
    });
  }

  home();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
