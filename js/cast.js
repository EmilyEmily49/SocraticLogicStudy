// The cast: Peter Kreeft (your host) and the philosophers the book leans on.
// Portraits are stylized illustrations, not likenesses.
// `quotes` are real, attributed quotations. `lines` are in-app coaching banter
// written for this app, not quotations.
(function () {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  const CAST = {
    kreeft: {
      name: "Peter Kreeft", role: "Your host", era: "b. 1937",
      look: { bg: "#d9cbb0", skin: "#f1c9a5", hair: "kreeft", hairColor: "#eceae6", beard: null, glasses: "round", garment: "jacket", garmentColor: "#6b5a45", accent: "#7a2f2f" },
      quotes: [],
      lines: {
        hello: ["Welcome back. Shall we think together?", "Clear terms, true premises, valid reasoning. Let's practice all three.", "Pick a chapter and let's begin.", "Logic is simply thinking well. Let's do some."],
        right: ["Exactly right.", "Well reasoned.", "That follows.", "Good — clear and correct."],
        wrong: ["Not quite. Look again at the reasoning.", "A useful mistake — read the explanation.", "Close. Check the terms."],
      },
    },
    socrates: {
      name: "Socrates", role: "The questioner", era: "c. 470–399 BC",
      look: { bg: "#c9d4c2", skin: "#e8b48f", hair: "bald", hairColor: "#d8d4cc", beard: "full", beardColor: "#dcd8d0", garment: "toga", garmentColor: "#efe8da", accent: "#9a8b6a", nose: "snub" },
      quotes: [
        { text: "The unexamined life is not worth living.", src: "in Plato's Apology 38a" },
        { text: "Wonder is the feeling of a philosopher, and philosophy begins in wonder.", src: "in Plato's Theaetetus 155d" },
      ],
      lines: {
        right: ["So you do know. Splendid.", "Just so.", "You have answered well, my friend.", "By the dog, that is correct!"],
        wrong: ["Then let us examine it together.", "Are you sure? Look again.", "An honest error — the beginning of wisdom."],
      },
    },
    plato: {
      name: "Plato", role: "The idealist", era: "c. 428–348 BC",
      look: { bg: "#c3cfdc", skin: "#e9bb96", hair: "full", hairColor: "#8d8378", beard: "full", beardColor: "#8f857a", garment: "toga", garmentColor: "#4e6a8a", accent: "#e9e2d2" },
      quotes: [
        { text: "The beginning is the most important part of the work.", src: "Republic II, 377a" },
      ],
      lines: {
        right: ["You have grasped the Form of it.", "Rightly seen.", "The soul recollects the truth."],
        wrong: ["A shadow on the cave wall. Turn around.", "Not the thing itself — look higher.", "Let us ascend more carefully."],
      },
    },
    aristotle: {
      name: "Aristotle", role: "The logician", era: "384–322 BC",
      look: { bg: "#e0c7b0", skin: "#e6b38c", hair: "short", hairColor: "#5a4a3c", beard: "trim", beardColor: "#5a4a3c", garment: "toga", garmentColor: "#9a4b32", accent: "#efe3cf" },
      quotes: [
        { text: "All men by nature desire to know.", src: "Metaphysics I.1" },
        { text: "To say of what is that it is, and of what is not that it is not, is true.", src: "Metaphysics IV.7" },
      ],
      lines: {
        right: ["Necessarily so.", "Correct — and the conclusion follows.", "Precisely the right distinction."],
        wrong: ["Look again at the form of it.", "Distinguish more carefully.", "Check the form, not just the content."],
      },
    },
    augustine: {
      name: "St. Augustine", role: "The seeker", era: "354–430",
      look: { bg: "#d7c8a6", skin: "#a97553", hair: "short", hairColor: "#2f2a26", beard: "full", beardColor: "#4a443e", garment: "cope", garmentColor: "#8a2f35", accent: "#c9a24a", hat: "mitre" },
      quotes: [
        { text: "Understanding is the reward of faith.", src: "Tractates on John 29.6" },
        { text: "Believe that you may understand.", src: "Sermon 43" },
      ],
      lines: {
        right: ["Truth found is a delight.", "Rightly judged.", "Well said — and well understood."],
        wrong: ["Keep seeking — the truth is worth it.", "Seek, and you will find. Look once more.", "Not yet — but keep seeking."],
      },
    },
    aquinas: {
      name: "St. Thomas Aquinas", role: "The systematizer", era: "1225–1274",
      look: { bg: "#d6d2c4", skin: "#eec1a0", hair: "tonsure", hairColor: "#5b4636", beard: null, garment: "habit", garmentColor: "#f4f1ea", accent: "#262626", round: true },
      quotes: [
        { text: "A small error in the beginning is a great one in the end.", src: "On Being and Essence, prologue (after Aristotle)" },
      ],
      lines: {
        right: ["I answer that it is so.", "Rightly distinguished.", "Correct, for the reasons given."],
        wrong: ["Objection noted — but the reply goes otherwise.", "We must make a distinction here.", "Not so. Consider the reply."],
      },
    },
    chesterton: {
      name: "G. K. Chesterton", role: "The paradoxer", era: "1874–1936",
      look: { bg: "#cfc7d9", skin: "#f0c4a2", hair: "wavy", hairColor: "#6a5a4c", beard: null, mustache: true, glasses: "pince", garment: "cape", garmentColor: "#2e2a33", accent: "#e7e1d4", round: true },
      quotes: [
        { text: "The object of opening the mind, as of opening the mouth, is to shut it again on something solid.", src: "Autobiography" },
        { text: "Thinking means connecting things, and stops if they cannot be connected.", src: "Orthodoxy" },
      ],
      lines: {
        right: ["Splendid! A fallacy caught red-handed.", "Quite right — and rather fun.", "You have shut your mind on something solid."],
        wrong: ["A paradox — but not a good one. Again!", "The fallacy has slipped away.", "Not quite. Sophistry is slippery."],
      },
    },
    lewis: {
      name: "C. S. Lewis", role: "The reasoner", era: "1898–1963",
      look: { bg: "#cbd3c0", skin: "#efc1a0", hair: "receding", hairColor: "#4b3d33", beard: null, garment: "jacket", garmentColor: "#7b6a4f", accent: "#3f4a3a", round: true },
      quotes: [
        { text: "Logic! Why don't they teach logic at these schools?", src: "The Lion, the Witch and the Wardrobe (Professor Kirke)" },
      ],
      lines: {
        right: ["Quite right. Logic!", "Sound as a bell.", "That argument holds."],
        wrong: ["Hm — a premise has gone missing.", "Not quite. Back to first principles.", "Let's be more logical about it."],
      },
    },
  };

  // Which character guides each chapter.
  // Which character guides each chapter of the book (0 = Introduction, then I–XVI).
  const GUIDES = { 0: "kreeft", 1: "plato", 2: "aristotle", 3: "chesterton", 4: "socrates", 5: "aquinas", 6: "augustine", 7: "lewis", 8: "aquinas", 9: "aristotle", 10: "aristotle", 11: "lewis", 12: "chesterton", 13: "socrates", 14: "augustine", 15: "socrates", 16: "kreeft" };

  // ---------- portrait illustration ----------
  // mood: "neutral" | "pleased" | "concerned"
  function portrait(id, mood = "neutral", size = 56) {
    const c = CAST[id], L = c.look;
    const uid = id + Math.random().toString(36).slice(2, 7);
    const ink = "#2a2320";
    const headRx = L.round ? 19.5 : 17.5;
    const parts = [];

    // garment / shoulders
    const shoulders = "M14 100 Q16 78 50 76 Q84 78 86 100Z";
    parts.push(`<path d="${shoulders}" fill="${L.garmentColor}"/>`);
    if (L.garment === "toga") parts.push(`<path d="M30 79 Q48 88 62 100" stroke="${L.accent}" stroke-width="3.5" fill="none" opacity=".7"/>`);
    if (L.garment === "jacket") parts.push(`<path d="M42 77 L50 92 L58 77" fill="#f3efe6"/><path d="M48 80 L50 96 L52 80Z" fill="${L.accent}"/><path d="M42 77 L48 100 M58 77 L52 100" stroke="#00000030" stroke-width="1.5"/>`);
    if (L.garment === "habit") parts.push(`<path d="M14 100 Q16 80 36 77 L44 100Z M86 100 Q84 80 64 77 L56 100Z" fill="${L.accent}"/><path d="M38 76 Q50 84 62 76" stroke="#d8d2c4" stroke-width="5" fill="none"/>`);
    if (L.garment === "cape") parts.push(`<path d="M42 77 L50 88 L58 77" fill="${L.accent}"/>`);
    if (L.garment === "cope") parts.push(`<path d="M40 77 L46 100 M60 77 L54 100" stroke="${L.accent}" stroke-width="5"/><circle cx="50" cy="86" r="3" fill="${L.accent}"/>`);

    // neck, ears, head
    parts.push(`<rect x="44" y="62" width="12" height="16" rx="5" fill="${L.skin}"/>`);
    parts.push(`<path d="M44 72 Q50 76 56 72" stroke="#00000022" stroke-width="2" fill="none"/>`);
    parts.push(`<ellipse cx="${50 - headRx}" cy="46" rx="3.5" ry="5" fill="${L.skin}"/><ellipse cx="${50 + headRx}" cy="46" rx="3.5" ry="5" fill="${L.skin}"/>`);
    parts.push(`<ellipse cx="50" cy="44" rx="${headRx}" ry="21" fill="${L.skin}"/>`);

    // hair
    const H = L.hairColor;
    const hair = {
      bald: `<path d="M31 46 Q30 36 35 33 Q33 42 35 50Z M69 46 Q70 36 65 33 Q67 42 65 50Z" fill="${H}"/><ellipse cx="44" cy="28" rx="6" ry="2.5" fill="#fff" opacity=".35"/>`,
      full: `<path d="M31 46 Q28 20 50 19 Q72 20 69 46 Q66 32 58 29 Q50 33 40 29 Q33 33 31 46Z" fill="${H}"/>`,
      short: `<path d="M33 40 Q32 22 50 21 Q68 22 67 40 Q63 29 50 28 Q37 29 33 40Z" fill="${H}"/>`,
      tonsure: `<path d="M30.5 44 Q29 26 36 27 Q40 31 50 31 Q60 31 64 27 Q71 26 69.5 44 Q66 34 50 35 Q34 34 30.5 44Z" fill="${H}"/>`,
      wavy: `<path d="M30 46 Q24 22 44 18 Q52 14 62 19 Q76 24 70 46 Q68 34 62 31 Q60 36 54 32 Q48 37 42 32 Q37 36 34 33 Q31 38 30 46Z" fill="${H}"/>`,
      receding: `<path d="M32 44 Q30 28 38 25 Q37 33 38 38 Z M68 44 Q70 28 62 25 Q63 33 62 38Z M40 25 Q50 22 60 25 Q50 26 40 25Z" fill="${H}"/>`,
      kreeft: `<path d="M31.5 44 Q29 24 42 21 Q50 19 58 21 Q71 24 68.5 44 Q66 32 60 29 Q52 30 46 28 Q36 30 31.5 44Z" fill="${H}"/>`,
    }[L.hair] || "";
    parts.push(hair);

    // brows
    const browY = 37;
    const tilt = mood === "concerned" ? 2.5 : mood === "pleased" ? -1 : 0;
    const browCol = L.hair === "bald" ? L.hairColor : L.hairColor;
    parts.push(`<path d="M37 ${browY + tilt} Q42 ${browY - 2} 46 ${browY - tilt * 0.3}" stroke="${browCol}" stroke-width="2.2" fill="none" stroke-linecap="round" filter="brightness(.8)"/>`);
    parts.push(`<path d="M54 ${browY - tilt * 0.3} Q58 ${browY - 2} 63 ${browY + tilt}" stroke="${browCol}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);

    // eyes
    if (mood === "pleased") {
      parts.push(`<path d="M38.5 44 Q42 41 45.5 44 M54.5 44 Q58 41 61.5 44" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
    } else {
      parts.push(`<ellipse cx="42" cy="43.5" rx="1.9" ry="2.2" fill="${ink}"/><ellipse cx="58" cy="43.5" rx="1.9" ry="2.2" fill="${ink}"/>`);
    }
    // glasses
    if (L.glasses === "round") parts.push(`<g stroke="#3b3430" stroke-width="1.4" fill="#ffffff22"><circle cx="42" cy="43.5" r="5.2"/><circle cx="58" cy="43.5" r="5.2"/><path d="M47.2 43 Q50 41.5 52.8 43" fill="none"/></g>`);
    if (L.glasses === "pince") parts.push(`<g stroke="#3b3430" stroke-width="1.1" fill="none"><ellipse cx="42" cy="44" rx="4.4" ry="3.8"/><ellipse cx="58" cy="44" rx="4.4" ry="3.8"/><path d="M46.4 43.5 Q50 42 53.6 43.5"/><path d="M62 45 Q66 52 64 60"/></g>`);

    // nose
    parts.push(L.nose === "snub"
      ? `<path d="M47 52 Q50 56 53 52" stroke="#00000035" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="51" rx="4.5" ry="3" fill="#00000012"/>`
      : `<path d="M50 45 Q48.5 51 47.5 53 Q50 54.5 52.5 53" stroke="#00000035" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);
    // cheeks
    parts.push(`<circle cx="38" cy="53" r="3.5" fill="#d46a5a" opacity=".14"/><circle cx="62" cy="53" r="3.5" fill="#d46a5a" opacity=".14"/>`);

    // beard
    if (L.beard === "full") parts.push(`<path d="M32 48 Q31 76 50 80 Q69 76 68 48 Q64 58 58 57 Q50 55 42 57 Q36 58 32 48Z" fill="${L.beardColor}"/><path d="M42 56 Q50 53 58 56" stroke="${L.beardColor}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    if (L.beard === "trim") parts.push(`<path d="M33.5 50 Q34 70 50 72 Q66 70 66.5 50 Q63 59 57 58.5 Q50 57 43 58.5 Q37 59 33.5 50Z" fill="${L.beardColor}"/><path d="M43 57 Q50 54.5 57 57" stroke="${L.beardColor}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    if (L.mustache) parts.push(`<path d="M40 58 Q45 53 50 56 Q55 53 60 58 Q55 57 50 58.5 Q45 57 40 58Z" fill="${L.hairColor}"/>`);

    // mouth
    const my = L.beard ? 61 : 60;
    const mouth = mood === "pleased"
      ? `<path d="M44.5 ${my} Q50 ${my + 4.5} 55.5 ${my}" stroke="${ink}" stroke-width="1.6" fill="#7a3b32" stroke-linecap="round"/>`
      : mood === "concerned"
      ? `<path d="M45.5 ${my + 2} Q50 ${my - 0.5} 54.5 ${my + 2}" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      : `<path d="M45.5 ${my + 0.5} Q50 ${my + 2} 54.5 ${my + 0.5}" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    parts.push(mouth);

    // headwear
    if (L.hat === "mitre") parts.push(`<path d="M34 30 Q34 12 50 4 Q66 12 66 30 Q50 26 34 30Z" fill="#efe6cf" stroke="${L.accent}" stroke-width="1.5"/><path d="M50 6 L50 28 M42 17 L58 17" stroke="${L.accent}" stroke-width="2"/>`);

    return `<svg class="portrait ${mood}" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${c.name}">
      <defs><clipPath id="c${uid}"><circle cx="50" cy="50" r="48"/></clipPath></defs>
      <circle cx="50" cy="50" r="49" fill="${L.bg}"/>
      <g clip-path="url(#c${uid})">${parts.join("")}</g>
      <circle cx="50" cy="50" r="48.5" fill="none" stroke="#2a232055" stroke-width="1.5"/>
    </svg>`;
  }

  const guideFor = (unit) => GUIDES[unit] || "kreeft";
  function line(id, kind) {
    const c = CAST[id];
    return pick((c.lines[kind] && c.lines[kind].length ? c.lines : CAST.kreeft.lines)[kind]);
  }
  function quote(id) {
    const q = CAST[id].quotes;
    return q.length ? pick(q) : pick(CAST[pick(["socrates", "aristotle", "chesterton", "lewis", "plato", "augustine", "aquinas"])].quotes);
  }
  function quoteAnyone() {
    const ids = Object.keys(CAST).filter((k) => CAST[k].quotes.length);
    const id = pick(ids);
    return { id, ...pick(CAST[id].quotes) };
  }

  // Subtle gold-leaf flourish for a strong result.
  function flourish(n = 26) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.createElement("div");
    box.className = "flourish";
    const cols = ["#c9a24a", "#e2c477", "#9a7a2e", "#6f7f5a"];
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.style.background = pick(cols);
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDelay = Math.random() * 0.4 + "s";
      s.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
      s.style.setProperty("--drift", Math.random() * 80 - 40 + "px");
      s.style.setProperty("--spin", Math.random() * 540 - 270 + "deg");
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3200);
  }

  window.CAST = { CAST, GUIDES, portrait, guideFor, line, quote, quoteAnyone, flourish };
})();
