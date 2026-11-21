// Points, streaks, weekly totals, and badges.
(function () {
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
  // Week id = the date of that week's Monday (local time).
  const weekKey = (d = new Date()) => { const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return dayKey(m); };

  const newMe = (name = "") => ({ name, points: 0, weekPoints: 0, weekId: weekKey(), streak: 0, bestStreak: 0, lastDay: "", counts: {}, badges: [], mastered: 0 });

  // Current streak, counting it as broken if the last study day was before yesterday.
  const liveStreak = (p) => (p.lastDay === dayKey() || p.lastDay === yesterdayKey() ? p.streak || 0 : 0);
  const liveWeek = (p) => (p.weekId === weekKey() ? p.weekPoints || 0 : 0);

  const BADGES = [
    { id: "first", name: "First Principles", desc: "Answer your first question correctly.", test: (m) => (m.counts.correct || 0) >= 1 },
    { id: "hundred", name: "A Hundred Truths", desc: "100 correct answers.", test: (m) => (m.counts.correct || 0) >= 100 },
    { id: "thousand", name: "Summa", desc: "1,000 correct answers.", test: (m) => (m.counts.correct || 0) >= 1000 },
    { id: "barbara", name: "Barbara", desc: "10 correct answers in Syllogism Judge.", test: (m) => (m.counts.syllogism || 0) >= 10 },
    { id: "gadfly", name: "Gadfly", desc: "Spot 25 fallacies.", test: (m) => (m.counts.fallacies || 0) >= 25 },
    { id: "square", name: "Squared Away", desc: "25 correct on the Square of Opposition.", test: (m) => (m.counts.square || 0) >= 25 },
    { id: "perfect", name: "Philosopher-King", desc: "A perfect score on any quiz.", test: (m) => (m.counts.perfect || 0) >= 1 },
    { id: "laureate", name: "Lyceum Laureate", desc: "Ten perfect quizzes.", test: (m) => (m.counts.perfect || 0) >= 10 },
    { id: "streak3", name: "Habit of Mind", desc: "Study 3 days in a row.", test: (m) => (m.bestStreak || 0) >= 3 },
    { id: "streak7", name: "Peripatetic", desc: "Study 7 days in a row.", test: (m) => (m.bestStreak || 0) >= 7 },
    { id: "streak30", name: "Daily Examen", desc: "Study 30 days in a row.", test: (m) => (m.bestStreak || 0) >= 30 },
    { id: "scribe", name: "Diligent Scribe", desc: "Review 100 flashcards you knew.", test: (m) => (m.counts.cards || 0) >= 100 },
    { id: "memoria", name: "Memoria", desc: "Master 25 flashcards.", test: (m) => (m.mastered || 0) >= 25 },
    { id: "quick", name: "Quick Study", desc: "Finish Matching in under 30s with no misses.", test: (m) => (m.counts.fastMatch || 0) >= 1 },
  ];

  // Apply an activity. Returns the list of newly earned badges.
  // act = { points, counts: { key: n } }
  function apply(me, act) {
    const today = dayKey();
    if (me.lastDay !== today) {
      me.streak = me.lastDay === yesterdayKey() ? (me.streak || 0) + 1 : 1;
      me.lastDay = today;
      me.bestStreak = Math.max(me.bestStreak || 0, me.streak);
    }
    if (me.weekId !== weekKey()) { me.weekId = weekKey(); me.weekPoints = 0; }
    const pts = Math.max(0, Math.round(act.points || 0));
    me.points = (me.points || 0) + pts;
    me.weekPoints = (me.weekPoints || 0) + pts;
    me.counts ||= {};
    for (const [k, v] of Object.entries(act.counts || {})) me.counts[k] = (me.counts[k] || 0) + v;
    return checkBadges(me);
  }
  function checkBadges(me) {
    me.badges ||= [];
    const fresh = BADGES.filter((b) => !me.badges.includes(b.id) && b.test(me));
    me.badges.push(...fresh.map((b) => b.id));
    return fresh;
  }

  // Points for one correct quiz answer given the current in-a-row count.
  const answerPoints = (inARow) => 10 + Math.min(10, 2 * Math.max(0, inARow - 1));

  window.SCORE = { dayKey, weekKey, newMe, liveStreak, liveWeek, BADGES, apply, checkBadges, answerPoints };
})();
