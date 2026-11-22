// "OH NO! There's a silly goose on the loose!"
// A goose occasionally waddles across the screen. Tap it to catch it.
(function () {
  let active = false;

  function gooseSVG(size = 96) {
    return `<svg class="goose-svg" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
      <g class="g-legs">
        <path class="leg l1" d="M52 92 L50 108 L42 112 L56 112 L54 108" fill="#e8892c" stroke="#c8691a" stroke-width="1.5" stroke-linejoin="round"/>
        <path class="leg l2" d="M66 92 L66 108 L58 112 L72 112 L69 108" fill="#e8892c" stroke="#c8691a" stroke-width="1.5" stroke-linejoin="round"/>
      </g>
      <g class="g-body">
        <path d="M18 70 Q14 56 28 58 Q30 48 40 54 Q60 50 78 60 Q92 70 86 84 Q78 98 54 96 Q30 96 22 84 Q16 78 18 70Z" fill="#fbfaf6" stroke="#2a2320" stroke-width="2.2"/>
        <path d="M34 70 Q50 64 66 74 Q56 84 40 80" fill="none" stroke="#c9c2b4" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M74 62 Q80 42 82 30 Q84 16 96 16 Q106 17 106 28 Q105 34 99 36 Q92 38 92 46 Q92 56 86 66" fill="#fbfaf6" stroke="#2a2320" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M104 24 Q116 25 117 29 Q115 33 104 32Z" fill="#e8892c" stroke="#c8691a" stroke-width="1.5"/>
        <circle cx="99" cy="23" r="2.6" fill="#2a2320"/><circle cx="100" cy="22" r=".9" fill="#fff"/>
        <circle cx="96" cy="30" r="3" fill="#f2a0a0" opacity=".55"/>
        <path d="M80 50 L74 46 L74 56Z M80 50 L86 46 L86 56Z" fill="#7a2f2f"/><circle cx="80" cy="51" r="2" fill="#5a1f1f"/>
      </g>
    </svg>`;
  }

  // Show the goose. onCatch() is called if the user taps it in time.
  function loose(onCatch) {
    if (active) return;
    active = true;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const banner = document.createElement("div");
    banner.className = "goose-banner";
    banner.innerHTML = `<b>OH NO!</b> There's a silly goose on the loose! <span>Tap it to catch it!</span>`;
    const goose = document.createElement("button");
    goose.className = "goose" + (reduce ? " still" : "");
    goose.setAttribute("aria-label", "Catch the silly goose");
    goose.innerHTML = `<span class="honk">HONK!</span>${gooseSVG()}`;
    goose.style.top = 35 + Math.random() * 35 + "vh";
    document.body.append(banner, goose);

    let done = false;
    const finish = (caught) => {
      if (done) return;
      done = true;
      goose.classList.add(caught ? "caught" : "gone");
      banner.classList.add(caught ? "won" : "lost");
      banner.innerHTML = caught
        ? `<b>Gotcha!</b> You caught the silly goose. <span>${onCatch ? onCatch() || "" : ""}</span>`
        : `<b>Oh no…</b> The silly goose got away. <span>Honk honk.</span>`;
      setTimeout(() => banner.classList.add("out"), 2200);
      setTimeout(() => { banner.remove(); goose.remove(); active = false; }, 2700);
    };
    goose.addEventListener("click", (e) => { e.stopPropagation(); finish(true); });
    goose.addEventListener("animationend", (e) => { if (e.animationName === "waddle-across") finish(false); });
    if (reduce) setTimeout(() => finish(false), 6000);
  }

  // Random chance helper.
  const maybe = (chance, onCatch) => { if (!active && Math.random() < chance) { setTimeout(() => loose(onCatch), 700); return true; } return false; };

  window.GOOSE = { loose, maybe, gooseSVG, get active() { return active; } };
})();
