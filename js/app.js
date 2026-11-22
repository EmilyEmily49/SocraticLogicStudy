// Socratic Phanatic — app UI
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
  state.read ||= {};
  // The chapters were reorganized to match the book exactly; start chapter progress fresh once.
  if (state.bookV !== 1) { state.units = UNITS.map((u) => u.id); state.cards = {}; state.stats = {}; state.best = {}; state.read = {}; state.bookV = 1; }
  state.units = state.units.filter((id) => UNITS.some((u) => u.id === id));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const record = (unit, ok) => {
    const s = (state.stats[unit] ||= { r: 0, w: 0 });
    ok ? s.r++ : s.w++;
    save();
  };

  // ---------- accounts, points & sync ----------
  const B = window.BACKEND, S = window.SCORE;
  let user = null, view = "home", pushTimer = null;
  const masteredCount = () => TERMS.filter((t) => (state.cards[t.id]?.box || 0) >= 3).length;
  function pushSoon() {
    if (!user || !state.me) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 1500);
  }
  function pushNow() {
    clearTimeout(pushTimer);
    if (!user || !state.me) return;
    state.me.mastered = masteredCount();
    B.saveProfile({ ...state.me }).catch((e) => console.warn("sync", e));
    B.saveProgress({ cards: state.cards, stats: state.stats, best: state.best }).catch((e) => console.warn("sync", e));
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pushNow(); });

  async function pullCloud(u) {
    const [profile, progress] = await Promise.all([B.loadProfile(), B.loadProgress()]);
    const keepLocal = state.uid === u.uid && state.me && profile && (state.me.points || 0) > (profile.points || 0);
    state.me = keepLocal ? state.me : profile || S.newMe("Student");
    state.uid = u.uid;
    if (progress) {
      for (const [id, c] of Object.entries(progress.cards || {})) {
        if (!state.cards[id] || (c.box || 0) > (state.cards[id].box || 0)) state.cards[id] = c;
      }
      for (const [u2, st] of Object.entries(progress.stats || {})) {
        const mine = (state.stats[u2] ||= { r: 0, w: 0 });
        mine.r = Math.max(mine.r, st.r || 0); mine.w = Math.max(mine.w, st.w || 0);
      }
      for (const [k, v] of Object.entries(progress.best || {})) state.best[k] = Math.max(state.best[k] || 0, v);
    }
    state.me.mastered = masteredCount();
    S.checkBadges(state.me);
    save(); pushSoon();
  }
  B.onAuth(async (u) => {
    user = u;
    if (u) { try { await pullCloud(u); } catch (e) { console.warn("pull", e); } }
    else { state.me = null; state.uid = null; save(); }
    if (view === "home") home();
    else if (view === "auth" && u) profilePage();
  });

  // Award points for an activity (only when signed in). Returns points awarded.
  function award(points, counts = {}) {
    if (!user || !state.me) return 0;
    state.me.mastered = masteredCount();
    const fresh = S.apply(state.me, { points, counts });
    save(); pushSoon();
    fresh.forEach((b, i) => setTimeout(() => toast(`<b>Badge earned</b> · ${esc(b.name)}`), 400 + i * 1200));
    return points;
  }
  // A caught goose is worth 25 points (when signed in).
  function catchGoose() {
    const pts = award(25, { geese: 1 });
    return pts ? `+${pts} points` : "Honk!";
  }
  function toast(html) {
    const t = document.createElement("div");
    t.className = "toast"; t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("out"), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  const monogram = (name, size = 36) => `<span class="mono" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${esc((name || "?").trim().charAt(0).toUpperCase())}</span>`;

  // ---------- activities ----------
  const GEN = [
    { id: "propType", name: "A, E, I, O & Distribution", icon: "A", units: [5], desc: "Classify propositions and spot distributed terms (V.3, V.7).", gen: window.LOGIC.genPropType },
    { id: "immediate", name: "Conversion, Obversion, Contraposition", icon: "↻", units: [6], desc: "Apply Kreeft's tables of valid immediate inference.", gen: window.LOGIC.genImmediate },
    { id: "square", name: "The Square of Opposition", icon: "□", units: [7], desc: "True, false, or unknown? Valid or invalid?", gen: window.LOGIC.genSquare },
    { id: "syllogism", name: "Syllogism Judge", icon: "∴", units: [11], desc: "Test by Aristotle's six rules; name the mood and figure.", gen: window.LOGIC.genSyllogism },
    { id: "argform", name: "Compound Syllogisms", icon: "⊃", units: [13], desc: "Hypothetical, disjunctive, and conjunctive forms.", gen: window.LOGIC.genArgForm },
  ];
  for (const d of DECKS) {
    GEN.push({
      id: d.id, name: d.name, icon: d.icon || "·", units: [d.unit], desc: d.desc,
      gen: () => {
        const it = pick(d.items);
        const opts = it.opts || shuffle([it.a, ...shuffle(d.pool.filter((o) => o !== it.a)).slice(0, Math.min(5, d.pool.length - 1))]);
        return { unit: d.unit, prompt: d.desc, body: esc(it.q), options: it.opts ? shuffle(opts) : opts, correct: [it.a], why: esc(it.why) };
      },
    });
  }

  // `focus` is set while studying a single chapter from its chapter page.
  let focus = null;
  const inScope = (unit) => (focus !== null ? unit === focus : state.units.includes(unit));
  const selTerms = () => TERMS.filter((t) => inScope(t.unit));
  const selGens = () => GEN.filter((g) => g.units.some(inScope));
  const unitLabel = (u) => (u.num === "Intro" ? "Introduction" : `Chapter ${u.num}`);

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
      return `<div class="unit ${on ? "on" : ""}">
        <button class="check" data-unit="${u.id}" aria-label="Include ${esc(unitLabel(u))} in mixed review">${on ? "✓" : ""}</button>
        <button class="uopen" data-open="${u.id}">${CAST.portrait(CAST.guideFor(u.id), "neutral", 36)}
        <span class="utext"><span class="unum">${esc(unitLabel(u))}${state.read[u.id] ? ` <i class="readmark">✓ lesson read</i>` : ""}</span><span class="utitle">${esc(u.title)}</span>
        <span class="umeta">${mastered}/${ts.length} mastered · accuracy ${acc}</span>
        <span class="bar"><span style="width:${ts.length ? (100 * mastered) / ts.length : 0}%"></span></span></span><span class="chev">›</span></button>
      </div>`;
    };
    view = "home"; focus = null;
    const acct = B.mode === "off" ? "" : user && state.me
      ? `<button class="acct" data-profile>${monogram(state.me.name, 26)}<span>${esc(state.me.name)}</span><b>${(state.me.points || 0).toLocaleString()} pts</b></button>`
      : `<button class="acct" data-signin>Sign in</button>`;
    const community = B.mode === "off" ? "" : `
      <h2 class="section">Compete</h2>
      <div class="grid">
        ${tile("leaderboard", "Ⅰ", "Leaderboard", user ? "All-time, this week, and streaks" : "Sign in to see your group", true)}
        ${tile("profile", user && state.me ? esc(state.me.name.charAt(0).toUpperCase()) : "?", user ? "Your profile" : "Sign in", user ? `${S.liveStreak(state.me || {})}-day streak · ${(state.me?.badges || []).length} badges` : "Earn points, streaks and badges", true)}
      </div>`;
    $app.innerHTML = `
      <div class="acct-row">${acct}</div>
      <header class="top">
        <p class="eyebrow">A companion to Kreeft's <i>Socratic Logic</i></p>
        <h1 data-title>Socratic Phanatic</h1>
        <div class="host">${CAST.portrait("kreeft", "pleased", 64)}<div><div class="who">Peter Kreeft <span>· your host</span></div><div class="said">${esc(CAST.line("kreeft", "hello"))}</div></div></div>
        ${quoteCard()}
      </header>
${community}
      <h2 class="section">Your guides</h2>
      <div class="cast-strip">${Object.keys(CAST.CAST).map((id) => `<button data-cast="${id}">${CAST.portrait(id, "neutral", 60)}${esc(CAST.CAST[id].name)}</button>`).join("")}</div>
      <section class="card">
        <div class="row"><h2>Chapters</h2><span class="links"><a data-all>All</a> · <a data-none>None</a></span></div>
        <p class="small hint-row">Tap a chapter to open its mini-lesson and practice. Tick chapters to include them in the mixed review below.</p>
        ${window.PARTS.map((p) => `<div class="part"><h3 class="partname">${esc(p.name)}</h3><div class="units">${p.units.map((id) => unitRow(UNITS[id])).join("")}</div></div>`).join("")}
      </section>
      <h2 class="section">Mixed review <span class="count">${state.units.length} chapter${state.units.length === 1 ? "" : "s"} ticked</span></h2>
      <div class="grid">
        ${tile("flash", "⧉", "Flashcards", `${terms.length} cards · spaced repetition`, terms.length)}
        ${tile("quiz", "?", "Term Quiz", "Multiple choice, both directions", terms.length >= 4)}
        ${tile("match", "⇄", "Matching", "Pair terms with definitions", terms.length >= 4)}
        ${tile("challenge", "★", "Chapter Challenge", "15 mixed questions", terms.length >= 4 || gens.length)}
      </div>
      <p class="foot">Progress is saved on this device${user ? " and synced to your account" : ""}. <a data-reset>Reset progress</a></p>`;
    $app.querySelector("[data-profile]")?.addEventListener("click", profilePage);
    // Secret: tap the title three times to release a goose (for fun; no points).
    let taps = 0, tapTimer;
    $app.querySelector("[data-title]").onclick = () => {
      clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 900);
      if (++taps >= 3) { taps = 0; GOOSE.loose(() => "Honk honk!"); }
    };
    $app.querySelector("[data-signin]")?.addEventListener("click", () => authPage("signin"));
    $app.querySelectorAll("[data-unit]").forEach((b) => b.onclick = () => {
      const id = +b.dataset.unit;
      state.units = state.units.includes(id) ? state.units.filter((x) => x !== id) : [...state.units, id].sort((a, b) => a - b);
      save(); home();
    });
    $app.querySelectorAll("[data-open]").forEach((b) => b.onclick = () => chapterPage(+b.dataset.open));
    $app.querySelector("[data-all]").onclick = () => { state.units = UNITS.map((u) => u.id); save(); home(); };
    $app.querySelector("[data-none]").onclick = () => { state.units = []; save(); home(); };
    $app.querySelector("[data-reset]").onclick = () => {
      if (confirm("Erase all saved progress?")) { state.cards = {}; state.stats = {}; state.best = {}; state.read = {}; save(); home(); }
    };
    $app.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => go(b.dataset.go));
    $app.querySelectorAll("[data-cast]").forEach((b) => b.onclick = () => castPage(b.dataset.cast));
  }
  function castPage(id) {
    window.scrollTo(0, 0);
    view = "cast";
    const c = CAST.CAST[id];
    const chapters = UNITS.filter((u) => CAST.guideFor(u.id) === id);
    $app.innerHTML = header(c.name) + `<div class="bio">
      ${CAST.portrait(id, "pleased", 140)}
      <p class="who">${esc(c.name)}</p><p class="role">${esc(c.role)} · ${esc(c.era)}</p>
      ${chapters.length ? `<p class="small">Guides: ${chapters.map((u) => esc(unitLabel(u))).join(", ")}</p>` : ""}
      ${c.quotes.map((q) => quoteCard({ id, ...q })).join("")}
      ${id === "kreeft" ? `<p class="small" style="margin-top:16px">Author of <i>Socratic Logic</i> and longtime professor of philosophy at Boston College.</p>` : ""}
    </div>`;
    bindBack();
  }
  function quoteCard(q = CAST.quoteAnyone()) {
    return `<figure class="quote">${CAST.portrait(q.id, "neutral", 40)}<div><blockquote>“${esc(q.text)}”</blockquote><figcaption>— ${esc(CAST.CAST[q.id].name)}, <i>${esc(q.src)}</i></figcaption></div></figure>`;
  }
  function tile(go, icon, name, desc, enabled) {
    return `<button class="tile" data-go="${go}" ${enabled ? "" : "disabled"}><span class="icon">${icon}</span><span class="tname">${esc(name)}</span><span class="tdesc">${esc(desc)}</span></button>`;
  }
  function go(where) {
    window.scrollTo(0, 0);
    view = where;
    if (where === "flash") return flashcards();
    if (where === "quiz") return runQuiz("Term Quiz", () => termQuestion(selTerms()), 10, "quiz");
    if (where === "match") return matching();
    if (where === "challenge") return challenge();
    if (where === "leaderboard") return user ? leaderboardPage() : authPage("signin");
    if (where === "profile") return user ? profilePage() : authPage("signin");
    const g = GEN.find((x) => "gen:" + x.id === where);
    runQuiz(g.name, g.gen, 10, g.id);
  }
  const header = (title, extra = "") => `<header class="bar-top"><button class="back" data-back>‹ ${focus !== null ? "Chapter" : "Home"}</button><span class="ttl">${esc(title)}</span><span class="extra">${extra}</span></header>`;
  const bindBack = () => ($app.querySelector("[data-back]").onclick = () => (focus !== null ? chapterPage(focus) : home()));

  // ---------- chapter page & mini-lessons ----------
  function chapterPage(id) {
    window.scrollTo(0, 0);
    view = "chapter"; focus = id;
    const u = UNITS[id], gid = CAST.guideFor(id);
    const terms = selTerms(), gens = selGens();
    const lessons = (window.LESSONS[id] || []).length;
    $app.innerHTML = header(unitLabel(u)) + `
      <div class="chap-head">${CAST.portrait(gid, "pleased", 64)}<div><p class="eyebrow">${esc(unitLabel(u))}</p><h1 class="chap-title">${esc(u.title)}</h1>
        <p class="small">Your guide: ${esc(CAST.CAST[gid].name)}</p></div></div>
      <ol class="sections">${u.sections.map((sec) => {
        const m = sec.match(/\s\((B|P)\)$/);
        return `<li>${esc(m ? sec.slice(0, -4) : sec)}${m ? ` <span class="tag ${m[1]}">${m[1] === "B" ? "basic" : "philosophical"}</span>` : ""}</li>`;
      }).join("")}</ol>
      ${lessons ? `<button class="primary" data-lesson>${state.read[id] ? "Review" : "Start"} the mini-lesson · ${lessons} card${lessons === 1 ? "" : "s"}</button>` : ""}
      <h2 class="section">Memorize this chapter</h2>
      <div class="grid">
        ${tile("flash", "⧉", "Flashcards", `${terms.length} cards`, terms.length)}
        ${tile("quiz", "?", "Term Quiz", "Multiple choice", terms.length >= 4)}
        ${tile("match", "⇄", "Matching", "Terms ↔ definitions", terms.length >= 4)}
        ${tile("challenge", "★", "Chapter Challenge", "15 mixed questions", terms.length >= 4 || gens.length)}
      </div>
      ${gens.length ? `<h2 class="section">Practice from the book</h2><div class="grid">${gens.map((g) => tile("gen:" + g.id, g.icon, g.name, g.desc, true)).join("")}</div>` : ""}`;
    const back = $app.querySelector("[data-back]");
    back.textContent = "‹ Home";
    back.onclick = home;
    $app.querySelector("[data-lesson]")?.addEventListener("click", () => lessonPage(id, 0));
    $app.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => go(b.dataset.go));
  }
  function lessonPage(id, i) {
    window.scrollTo(0, 0);
    view = "lesson"; focus = id;
    const cards = window.LESSONS[id], c = cards[i], last = i === cards.length - 1;
    const u = UNITS[id], gid = CAST.guideFor(id);
    if (last) { state.read[id] = true; save(); }
    $app.innerHTML = header(`${unitLabel(u)} · Lesson`, `${i + 1}/${cards.length}`) + `
      <article class="lesson">
        <p class="eyebrow">${esc(c.s)}</p>
        <div class="lesson-body">${c.b}</div>
      </article>
      <div class="dots">${cards.map((_, k) => `<span class="${k === i ? "on" : ""}"></span>`).join("")}</div>
      ${last ? `<div class="fb-head lesson-end">${CAST.portrait(gid, "pleased", 52)}<div class="said"><b>${esc(CAST.CAST[gid].name)}:</b> That's the chapter. Now put it into practice.</div></div>` : ""}
      <div class="lesson-nav">
        <button class="secondary-btn" data-prev ${i === 0 ? "disabled" : ""}>‹ Back</button>
        <button class="primary" data-next>${last ? "Practice this chapter" : "Next ›"}</button>
      </div>`;
    bindBack();
    $app.querySelector("[data-prev]").onclick = () => lessonPage(id, i - 1);
    $app.querySelector("[data-next]").onclick = () => (last ? chapterPage(id) : lessonPage(id, i + 1));
  }

  // ---------- quiz runner ----------
  function runQuiz(title, gen, total, key) {
    let n = 0, score = 0, streak = 0, lastUnit = 1, gooseSeen = false;
    const next = () => {
      if (n >= total) return finish();
      n++;
      if (n > 1 && !gooseSeen) gooseSeen = GOOSE.maybe(0.1, catchGoose);
      const q = gen();
      $app.innerHTML = header(title, `${n}/${total}${streak > 1 ? ` · ${streak} in a row` : ""}`) + `
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
        const gained = ok ? award(S.answerPoints(streak), { correct: 1, ...(key.includes(":") ? {} : { [key]: 1 }) }) : 0;
        btns.forEach((x) => {
          x.disabled = true;
          if (q.correct.includes(q.options[+x.dataset.i])) x.classList.add("right");
        });
        if (!ok) b.classList.add("wrong");
        const fb = $app.querySelector(".feedback");
        fb.hidden = false;
        lastUnit = q.unit;
        const gid = CAST.guideFor(q.unit);
        fb.className = "feedback " + (ok ? "is-good" : "is-bad");
        fb.innerHTML = `<div class="fb-head">${CAST.portrait(gid, ok ? "pleased" : "concerned", 52)}<div><div class="verdict ${ok ? "good" : "bad"}">${ok ? "Correct" : "Not quite"}${gained ? ` <span class="pts">+${gained}</span>` : ""}</div><div class="said"><b>${esc(CAST.CAST[gid].name)}:</b> ${esc(CAST.line(gid, ok ? "right" : "wrong"))}</div></div></div><p>${q.why || ""}</p><button class="primary" data-next>${n >= total ? "See results" : "Next ›"}</button>`;
        fb.querySelector("[data-next]").onclick = next;
        fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    };
    const finish = () => {
      const pct = Math.round((100 * score) / total);
      if (pct >= 90) setTimeout(() => CAST.flourish(), 150);
      const gid = CAST.guideFor(lastUnit);
      const prev = state.best[key] || 0;
      if (pct > prev) { state.best[key] = pct; save(); pushSoon(); }
      const bonus = score === total ? award(50, { perfect: 1 }) : 0;
      $app.innerHTML = header(title) + `<div class="done">
        ${CAST.portrait(gid, pct >= 60 ? "pleased" : "concerned", 110)}
        <p class="who">${esc(CAST.CAST[gid].name)}</p>
        <div class="big">${pct}%</div><p>${score} of ${total} correct${pct > prev && prev ? " — a new best" : ""}</p>
        <p class="small">Best: ${Math.max(pct, prev)}%</p>
        ${bonus ? `<p class="pts-line">Perfect score bonus <span class="pts">+${bonus}</span></p>` : ""}
        ${B.mode !== "off" && !user ? `<p class="small"><a data-signin2>Sign in</a> to earn points and climb the leaderboard.</p>` : ""}
        ${quoteCard(CAST.CAST[gid].quotes.length ? { id: gid, ...CAST.quote(gid) } : undefined)}
        <button class="primary" data-again>Play again</button></div>`;
      bindBack();
      $app.querySelector("[data-again]").onclick = () => runQuiz(title, gen, total, key);
      $app.querySelector("[data-signin2]")?.addEventListener("click", () => authPage("signin"));
    };
    next();
  }

  function challenge() {
    const terms = selTerms();
    const gens = selGens();
    const gen = () => (terms.length >= 4 && (!gens.length || Math.random() < 0.4) ? termQuestion(terms) : pick(gens).gen());
    runQuiz(focus !== null ? `${unitLabel(UNITS[focus])} Challenge` : "Mixed Review", gen, 15, "challenge:" + (focus !== null ? focus : state.units.join(",")));
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
    let done = 0, gooseSeen = false;
    if (!queue.length) {
      $app.innerHTML = header("Flashcards") + `<div class="done">${CAST.portrait("kreeft", "pleased", 110)}<p class="who">All caught up</p><p>Nothing is due right now in these chapters.</p>
        <button class="primary" data-cram>Review all anyway</button></div>`;
      bindBack();
      $app.querySelector("[data-cram]").onclick = () => { queue = shuffle(pool).slice(0, 20); show(); };
      return;
    }
    function show() {
      if (!queue.length) {
        $app.innerHTML = header("Flashcards") + `<div class="done">${CAST.portrait("kreeft", "pleased", 110)}<p class="who">Session complete</p><p>${done} cards reviewed.</p>${quoteCard()}<button class="primary" data-again>Keep going</button></div>`;
        bindBack();
        $app.querySelector("[data-again]").onclick = flashcards;
        return;
      }
      if (done > 0 && !gooseSeen) gooseSeen = GOOSE.maybe(0.06, catchGoose);
      const t = queue[0];
      const box = state.cards[t.id]?.box || 0;
      const front = reverse ? esc(t.def) : `<b>${esc(t.term)}</b>`;
      const back = reverse ? `<b>${esc(t.term)}</b>` : esc(t.def);
      $app.innerHTML = header("Flashcards", `${queue.length} left`) + `
        <div class="fc-tools"><button class="chip" data-flip-mode>${reverse ? "Definition → Term" : "Term → Definition"} ⇄</button><span class="small">Ch. ${t.unit} · box ${box}/6</span></div>
        <div class="flash" data-flip><div class="face f-front">${front}<span class="hint">Tap to reveal</span></div><div class="face f-back">${back}</div></div>
        <div class="fc-actions" hidden>
          <button class="miss" data-r="0">Missed it</button><button class="hit" data-r="1">Knew it</button>
        </div>`;
      bindBack();
      const card = $app.querySelector(".flash");
      card.onclick = () => { card.classList.toggle("flipped"); $app.querySelector(".fc-actions").hidden = false; };
      $app.querySelector("[data-flip-mode]").onclick = () => { reverse = !reverse; state.reverse = reverse; save(); show(); };
      $app.querySelectorAll("[data-r]").forEach((b) => b.onclick = () => {
        const ok = b.dataset.r === "1";
        const c = (state.cards[t.id] ||= { box: 0, due: 0 });
        queue.shift();
        if (ok) { c.box = Math.min(6, c.box + 1); c.due = Date.now() + INTERVALS[c.box] * DAY; done++; award(3, { cards: 1 }); }
        else { c.box = 0; c.due = 0; queue.splice(Math.min(3, queue.length), 0, t); }
        record(t.unit, ok);
        save(); pushSoon(); show();
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
        clearInterval(timer); if (!misses) CAST.flourish(16);
        const secs = Math.round((Date.now() - start) / 1000);
        const gained = award(misses ? 20 : 40, { matches: 1, ...(!misses && secs < 30 ? { fastMatch: 1 } : {}) });
        setTimeout(() => {
          $app.innerHTML = header("Matching") + `<div class="done">${CAST.portrait("aristotle", "pleased", 110)}<p class="who">All matched</p><div class="big">${secs}s</div><p>${misses} miss${misses === 1 ? "" : "es"}</p>${gained ? `<p class="pts-line"><span class="pts">+${gained}</span></p>` : ""}<button class="primary" data-again>Play again</button></div>`;
          bindBack(); $app.querySelector("[data-again]").onclick = matching;
        }, 400);
      }
    });
  }

  // ---------- auth ----------
  function authPage(mode = "signin") {
    window.scrollTo(0, 0);
    view = "auth";
    const title = { signin: "Sign in", signup: "Create account", reset: "Reset password" }[mode];
    $app.innerHTML = header(title) + `<form class="form" novalidate>
      <div class="host">${CAST.portrait("kreeft", "pleased", 56)}<div class="said">${
        mode === "signup" ? "Join your study group. You'll need the invite code from whoever set up the app."
        : mode === "reset" ? "Enter your email and we'll send you a link to choose a new password."
        : "Welcome back. Sign in to earn points and see the leaderboard."}</div></div>
      ${mode === "signup" ? `<label>Display name<input name="name" maxlength="24" autocomplete="nickname" required placeholder="Shown on the leaderboard"></label>` : ""}
      <label>${B.idLabel}<input name="email" type="${B.idLabel === "Email" ? "email" : "text"}" autocapitalize="none" autocorrect="off" autocomplete="${B.idLabel === "Email" ? "email" : "username"}" required></label>
      ${mode !== "reset" ? `<label>Password<input name="password" type="password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}" required minlength="6"></label>` : ""}
      ${mode === "signup" ? `<label>Invite code<input name="code" autocapitalize="characters" autocomplete="off" required></label>` : ""}
      <p class="err" hidden></p>
      <button class="primary" type="submit">${title}</button>
      <p class="alt">${
        mode === "signin" ? `New here? <a data-mode="signup">Create an account</a>${B.canReset ? ` · <a data-mode="reset">Forgot password?</a>` : ""}`
        : `<a data-mode="signin">Back to sign in</a>`}</p>
    </form>`;
    bindBack();
    $app.querySelectorAll("[data-mode]").forEach((a) => a.onclick = () => authPage(a.dataset.mode));
    const form = $app.querySelector("form"), err = $app.querySelector(".err"), btn = form.querySelector("button[type=submit]");
    form.onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      err.hidden = true;
      const bad = (m) => { err.textContent = m; err.hidden = false; };
      if (mode === "signup" && !f.name.trim()) return bad("Please choose a display name.");
      if (!f.email.trim()) return bad(`Please enter your ${B.idLabel.toLowerCase()}.`);
      if (mode !== "reset" && !f.password) return bad("Please enter your password.");
      if (mode === "signup" && !f.code.trim()) return bad("Please enter the invite code.");
      btn.disabled = true; btn.textContent = "One moment…";
      try {
        if (mode === "signup") await B.signUp({ name: f.name, email: f.email.trim(), password: f.password, code: f.code });
        else if (mode === "signin") await B.signIn({ email: f.email.trim(), password: f.password });
        else { await B.resetPassword(f.email.trim()); toast("Check your email for a reset link."); return authPage("signin"); }
      } catch (ex) {
        bad(B.message(ex)); btn.disabled = false; btn.textContent = title;
      }
    };
  }

  // ---------- profile ----------
  function profilePage() {
    if (!user || !state.me) return authPage("signin");
    window.scrollTo(0, 0);
    view = "profile";
    const me = state.me;
    me.mastered = masteredCount();
    const stat = (label, value) => `<div class="stat"><div class="sv">${value}</div><div class="sl">${label}</div></div>`;
    const chapters = UNITS.map((u) => {
      const st = state.stats[u.id] || { r: 0, w: 0 };
      const n = st.r + st.w, pct = n ? Math.round((100 * st.r) / n) : 0;
      return `<div class="crow"><span class="cname">${u.num === "Intro" ? "Intro" : u.num + "."} ${esc(u.short)}</span><span class="bar"><span style="width:${pct}%"></span></span><span class="cpct">${n ? pct + "%" : "—"}</span></div>`;
    }).join("");
    $app.innerHTML = header("Your profile") + `
      <div class="pro-head">${monogram(me.name, 64)}<div>
        <div class="who">${esc(me.name)}</div><div class="small">${esc(user.email || "")}</div>
        <a data-rename>Change display name</a></div></div>
      <div class="stats">
        ${stat("Total points", (me.points || 0).toLocaleString())}
        ${stat("This week", S.liveWeek(me).toLocaleString())}
        ${stat("Day streak", S.liveStreak(me))}
        ${stat("Best streak", me.bestStreak || 0)}
        ${stat("Correct answers", (me.counts?.correct || 0).toLocaleString())}
        ${stat("Cards mastered", `${me.mastered}/${TERMS.length}`)}
      </div>
      <h2 class="section">Badges <span class="count">${me.badges.length}/${S.BADGES.length}</span></h2>
      ${badgeGrid(me.badges)}
      <h2 class="section">Accuracy by chapter</h2>
      <div class="chapters">${chapters}</div>
      <button class="secondary" data-signout>Sign out</button>`;
    bindBack();
    $app.querySelector("[data-signout]").onclick = async () => { pushNow(); await B.signOut(); home(); };
    $app.querySelector("[data-rename]").onclick = () => {
      const name = (prompt("New display name (max 24 characters):", me.name) || "").trim().slice(0, 24);
      if (name) { me.name = name; save(); pushNow(); profilePage(); }
    };
  }
  function badgeGrid(earned) {
    return `<div class="badges">${S.BADGES.map((b) => `<div class="badge ${earned.includes(b.id) ? "on" : ""}">
      <span class="medal">${earned.includes(b.id) ? "✦" : "·"}</span><b>${esc(b.name)}</b><span>${esc(b.desc)}</span></div>`).join("")}</div>`;
  }

  // ---------- leaderboard ----------
  async function leaderboardPage(tab = "all") {
    window.scrollTo(0, 0);
    view = "leaderboard";
    const tabs = [["all", "All-time"], ["week", "This week"], ["streak", "Streak"]];
    $app.innerHTML = header("Leaderboard") + `
      <div class="seg">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${l}</button>`).join("")}</div>
      <div class="board"><p class="small center">Loading…</p></div>`;
    bindBack();
    $app.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => leaderboardPage(b.dataset.tab));
    pushNow();
    let rows;
    try { rows = await B.profiles(); } catch (e) {
      $app.querySelector(".board").innerHTML = `<p class="err">${esc(B.message(e))}</p>`; return;
    }
    if (view !== "leaderboard") return;
    const val = (p) => tab === "all" ? p.points || 0 : tab === "week" ? S.liveWeek(p) : S.liveStreak(p);
    const unit = (v) => (tab === "streak" ? (v === 1 ? "day" : "days") : "pts");
    rows = rows.map((p) => (p.uid === user.uid ? { ...p, ...state.me } : p)).sort((a, b) => val(b) - val(a) || (b.points || 0) - (a.points || 0));
    let rank = 0, last = null;
    $app.querySelector(".board").innerHTML = rows.map((p, i) => {
      if (val(p) !== last) { rank = i + 1; last = val(p); }
      return `<button class="lrow ${p.uid === user.uid ? "me" : ""}" data-uid="${esc(p.uid)}">
        <span class="rank ${rank <= 3 ? "r" + rank : ""}">${rank}</span>${monogram(p.name, 34)}
        <span class="lname">${esc(p.name)}${p.uid === user.uid ? " <i>(you)</i>" : ""}</span>
        <span class="lval">${val(p).toLocaleString()} <small>${unit(val(p))}</small></span></button>`;
    }).join("") || `<p class="small center">No one here yet.</p>`;
    $app.querySelectorAll("[data-uid]").forEach((b) => b.onclick = () => {
      const p = rows.find((r) => r.uid === b.dataset.uid);
      if (p.uid === user.uid) return profilePage();
      memberPage(p, tab);
    });
  }
  function memberPage(p, tab) {
    window.scrollTo(0, 0);
    view = "member";
    const badges = p.badges || [];
    $app.innerHTML = header(p.name) + `
      <div class="pro-head">${monogram(p.name, 64)}<div><div class="who">${esc(p.name)}</div></div></div>
      <div class="stats">
        <div class="stat"><div class="sv">${(p.points || 0).toLocaleString()}</div><div class="sl">Total points</div></div>
        <div class="stat"><div class="sv">${S.liveWeek(p).toLocaleString()}</div><div class="sl">This week</div></div>
        <div class="stat"><div class="sv">${S.liveStreak(p)}</div><div class="sl">Day streak</div></div>
      </div>
      <h2 class="section">Badges <span class="count">${badges.length}/${S.BADGES.length}</span></h2>
      ${badgeGrid(badges)}`;
    $app.querySelector("[data-back]").textContent = "‹ Leaderboard";
    $app.querySelector("[data-back]").onclick = () => leaderboardPage(tab);
  }

  home();
  B.init();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
