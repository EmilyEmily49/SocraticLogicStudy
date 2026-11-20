// Silly stuff: a cartoon Socrates mascot, quips, and confetti.
(function () {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // mood: "happy" | "sad" | "think" | "wow"
  function socrates(mood = "happy", size = 90) {
    const mouth = {
      happy: '<path d="M50 74 Q60 84 70 74" stroke="#5b2d1a" stroke-width="3" fill="#ff8a8a" stroke-linecap="round"/>',
      wow: '<ellipse cx="60" cy="77" rx="6" ry="8" fill="#5b2d1a"/>',
      sad: '<path d="M50 80 Q60 71 70 80" stroke="#5b2d1a" stroke-width="3" fill="none" stroke-linecap="round"/>',
      think: '<path d="M52 77 L68 75" stroke="#5b2d1a" stroke-width="3" stroke-linecap="round"/>',
    }[mood];
    const eyes = mood === "happy"
      ? '<path d="M41 52 Q46 46 51 52" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M69 52 Q74 46 79 52" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
      : mood === "think"
      ? '<circle cx="47" cy="51" r="4.5" fill="#222"/><circle cx="76" cy="48" r="4.5" fill="#222"/><path d="M68 40 L82 36" stroke="#888" stroke-width="3" stroke-linecap="round"/>'
      : '<circle cx="46" cy="51" r="6" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="74" cy="51" r="6" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="47" cy="52" r="3" fill="#222"/><circle cx="75" cy="52" r="3" fill="#222"/>';
    const extra = mood === "sad"
      ? '<path d="M88 38 Q92 46 88 50 Q84 46 88 38Z" fill="#7cc8ff"/>'
      : mood === "wow"
      ? '<text x="92" y="30" font-size="16">✨</text>'
      : mood === "think"
      ? '<text x="90" y="28" font-size="18" font-weight="bold" fill="#7a5cff">?</text>'
      : "";
    return `<svg class="soc ${mood}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
      <path d="M22 120 Q24 92 60 92 Q96 92 98 120Z" fill="#fff" stroke="#c9b9a0" stroke-width="2"/>
      <path d="M40 96 L80 118" stroke="#7a5cff" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="60" cy="56" rx="34" ry="36" fill="#f7c9a0"/>
      <ellipse cx="25" cy="58" rx="7" ry="9" fill="#f7c9a0"/><ellipse cx="95" cy="58" rx="7" ry="9" fill="#f7c9a0"/>
      <path d="M24 46 Q20 30 32 28 Q26 40 30 50Z" fill="#eee" stroke="#ccc"/>
      <path d="M96 46 Q100 30 88 28 Q94 40 90 50Z" fill="#eee" stroke="#ccc"/>
      <ellipse cx="48" cy="26" rx="8" ry="4" fill="#fff" opacity=".6"/>
      <path d="M30 66 Q28 104 60 106 Q92 104 90 66 Q80 74 60 72 Q40 74 30 66Z" fill="#f2f2f2" stroke="#cfcfcf" stroke-width="2"/>
      <path d="M44 66 Q60 60 76 66" stroke="#ddd" stroke-width="7" fill="none" stroke-linecap="round"/>
      ${mouth}
      <ellipse cx="60" cy="62" rx="9" ry="6" fill="#ef9f7a"/>
      <circle cx="38" cy="62" r="5" fill="#ff9e9e" opacity=".5"/><circle cx="82" cy="62" r="5" fill="#ff9e9e" opacity=".5"/>
      ${eyes}
      <path d="M38 42 Q46 37 53 41" stroke="#bbb" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M67 41 Q74 37 82 42" stroke="#bbb" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${extra}
    </svg>`;
  }

  const QUIPS = {
    hello: [
      "Ready to examine some life? 🏛️",
      "I know that I know nothing. Let's fix that for you.",
      "Hemlock? No thanks. Logic? Yes please!",
      "Let's go poke some premises! 👉",
      "Today we syllogize! (Is that a word? It is now.)",
      "The unexamined flashcard is not worth flipping.",
      "Ask me a question. Actually, I'll ask YOU.",
    ],
    right: [
      "By Zeus, correct!", "Valid AND sound! 🎉", "Aristotle is taking notes.", "Ding ding! Truth located.",
      "You have reasoned... wisely. 🦉", "Even Plato would write that down.", "Big brain energy. 🧠",
      "The Oracle of Delphi is jealous.", "Nailed it. Like a fallacy in a debate.", "Opa! 🥳",
    ],
    wrong: [
      "Hmm, let us examine that... 🤔", "A noble error! Now you know.", "Oops! Even I drank the hemlock.",
      "Not quite — but now you're wiser.", "My toga is in shambles.", "Aporia! Delicious, delicious aporia.",
      "That premise has fled to Thebes.", "Close! Let's dialogue about it.",
    ],
    great: ["You are officially a philosopher-king! 👑", "The Agora gives you a standing ovation!", "Socrates approves! Go have some olives. 🫒"],
    ok: ["Solid reasoning! A few more laps around the Agora.", "Wise-ish! Very wise-ish.", "Good! The owl of Athena nods at you. 🦉"],
    low: ["Knowing you don't know is the beginning of wisdom!", "Back to the Lyceum! You've got this.", "Plato failed his first quiz too. (Probably.)"],
  };
  const quip = (k) => pick(QUIPS[k]);

  const CONF = ["🎉", "⭐", "🫒", "🏛️", "🦉", "✨", "📜", "🍇"];
  const COLORS = ["#ff6b9a", "#ffd23f", "#3ec7ff", "#7a5cff", "#4cd98a", "#ff9f43"];
  function confetti(n = 24) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.createElement("div");
    box.className = "confetti";
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      if (Math.random() < 0.35) { s.textContent = pick(CONF); s.className = "emo"; }
      else s.style.background = pick(COLORS);
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDelay = Math.random() * 0.3 + "s";
      s.style.animationDuration = 1.1 + Math.random() * 1.1 + "s";
      s.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
      s.style.setProperty("--spin", (Math.random() * 720 - 360) + "deg");
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2600);
  }

  window.FUN = { socrates, quip, confetti };
})();
