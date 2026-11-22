// Question generators for the logic-practice games.
// Each generator returns { prompt, body?, options, correct: [..], why, unit }.

(function () {
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const NOUNS = [
    "philosophers", "Greeks", "mortals", "poets", "athletes", "teachers", "students",
    "musicians", "saints", "logicians", "sailors", "farmers", "artists", "doctors",
    "soldiers", "scientists", "kings", "heroes", "readers", "dreamers", "liars", "thinkers",
  ];
  const threeTerms = () => { const t = shuffle(NOUNS); return { S: t[0], P: t[1], M: t[2] }; };

  // ---- Categorical propositions ----
  const TYPES = ["A", "E", "I", "O"];
  const NAMES = { A: "universal affirmative", E: "universal negative", I: "particular affirmative", O: "particular negative" };
  function sentence(type, s, p) {
    switch (type) {
      case "A": return `All ${s} are ${p}`;
      case "E": return `No ${s} are ${p}`;
      case "I": return `Some ${s} are ${p}`;
      case "O": return `Some ${s} are not ${p}`;
    }
  }
  const distSubj = (t) => t === "A" || t === "E";
  const distPred = (t) => t === "E" || t === "O";
  const isNeg = (t) => t === "E" || t === "O";
  const isPart = (t) => t === "I" || t === "O";

  function genPropType() {
    const { S, P } = threeTerms();
    const t = pick(TYPES);
    if (Math.random() < 0.5) {
      return {
        unit: 5, prompt: "What type of proposition is this?",
        body: sentence(t, S, P) + ".",
        options: ["A", "E", "I", "O"].map((x) => `${x} — ${NAMES[x]}`),
        correct: [`${t} — ${NAMES[t]}`],
        why: `Quantity: ${isPart(t) ? "particular" : "universal"}; quality: ${isNeg(t) ? "negative" : "affirmative"}.`,
      };
    }
    const ans = distSubj(t) && distPred(t) ? "Both" : distSubj(t) ? "Subject only" : distPred(t) ? "Predicate only" : "Neither";
    return {
      unit: 5, prompt: "Which terms are distributed?",
      body: sentence(t, S, P) + ".",
      options: ["Subject only", "Predicate only", "Both", "Neither"],
      correct: [ans],
      why: `It's an ${t} proposition. Universals distribute the subject; negatives distribute the predicate.`,
    };
  }

  // ---- Square of opposition (Ch. VII; the traditional Square, as Kreeft teaches it) ----
  // SQUARE[given][value] -> {A,E,I,O: true|false|null}
  const SQUARE = {
    A: { true: { A: true, E: false, I: true, O: false }, false: { A: false, E: null, I: null, O: true } },
    E: { true: { A: false, E: true, I: false, O: true }, false: { A: null, E: false, I: true, O: null } },
    I: { true: { A: null, E: false, I: true, O: null }, false: { A: false, E: true, I: false, O: true } },
    O: { true: { A: false, E: null, I: null, O: true }, false: { A: true, E: false, I: true, O: false } },
  };
  const RELATION = (x, y) => {
    const k = [x, y].sort().join("");
    return { AO: "Contradictories", EI: "Contradictories", AE: "Contraries", IO: "Subcontraries", AI: "Subalternation", EO: "Subalternation" }[k];
  };
  const tvLabel = (v) => (v === null ? "Unknown" : v ? "True" : "False");

  function genSquare() {
    const { S, P } = threeTerms();
    const g = pick(TYPES);
    const others = TYPES.filter((x) => x !== g);
    const tgt = pick(others);
    if (Math.random() < 0.25) {
      const rel = RELATION(g, tgt);
      return {
        unit: 7, prompt: "What kind of opposition is this?",
        body: `${sentence(g, S, P)}.<br>${sentence(tgt, S, P)}.`,
        options: ["Contradictories", "Contraries", "Subcontraries", "Subalternation"],
        correct: [rel],
        why: `${g} and ${tgt}: ${rel.toLowerCase()}.`,
      };
    }
    if (Math.random() < 0.3) {
      // Kreeft's second kind of Square exercise: evaluate a completed inference.
      const val2 = Math.random() < 0.5;
      const res2 = SQUARE[g][val2][tgt];
      const claim = Math.random() < 0.5;
      const ok = res2 === claim;
      return {
        unit: 7, prompt: "Evaluate this inference:",
        body: `Since it is ${val2 ? "true" : "false"} that “${sentence(g, S, P)},” it must be ${claim ? "true" : "false"} that “${sentence(tgt, S, P)}.”`,
        options: ["Valid", "Invalid"], correct: [ok ? "Valid" : "Invalid"],
        why: `${g} and ${tgt}: ${RELATION(g, tgt).toLowerCase()}. Given that, the ${tgt} is ${tvLabel(res2).toLowerCase()}. ${squareTip(g, val2, tgt)}`,
      };
    }
    const val = Math.random() < 0.5;
    const res = SQUARE[g][val][tgt];
    return {
      unit: 7, prompt: `If it is <b>${val ? "TRUE" : "FALSE"}</b> that “${sentence(g, S, P)},” then…`,
      body: `“${sentence(tgt, S, P)}” is:`,
      options: ["True", "False", "Unknown"],
      correct: [tvLabel(res)],
      why: `${g} and ${tgt}: ${RELATION(g, tgt).toLowerCase()}. ${squareTip(g, val, tgt)}`,
    };
  }
  function squareTip(g, val, tgt) {
    const rel = RELATION(g, tgt);
    if (rel === "Contradictories") return "Contradictories always have opposite truth values.";
    if (rel === "Contraries") return "Contraries can't both be true, but can both be false.";
    if (rel === "Subcontraries") return "Subcontraries can't both be false, but can both be true.";
    const down = g === "A" || g === "E";
    return down
      ? "Truth flows down from universal to particular; falsity does not."
      : "Falsity flows up from particular to universal; truth does not.";
  }

  // ---- Immediate inference (Ch. VI, Kreeft's tables) ----
  // Conversion: E→E, I→I, A→I, E→O; an O cannot be converted.
  // Obversion: A→E, E→A, I→O, O→I.
  // Full contraposition: A→All non-P is non-S; E→Some non-P is not non-S; O→Some non-P is not non-S; I has none.
  function genImmediate() {
    const { S, P } = threeTerms();
    const t = pick(TYPES);
    const op = pick(["conversion", "obversion", "obversion", "contraposition"]);
    const non = (x) => `non-${x}`;
    const obv = { A: "E", E: "A", I: "O", O: "I" };
    const NOT = "It cannot be done";
    let correct = [];
    if (op === "conversion") {
      correct = { A: [`Some ${P} are ${S}`], E: [sentence("E", P, S), sentence("O", P, S)], I: [sentence("I", P, S)], O: [] }[t];
    } else if (op === "obversion") {
      correct = [sentence(obv[t], S, non(P))];
    } else {
      correct = { A: [sentence("A", non(P), non(S))], E: [sentence("O", non(P), non(S))], I: [], O: [sentence("O", non(P), non(S))] }[t];
    }
    const wrong = new Set([
      sentence(t, P, S), sentence(obv[t], S, P), sentence(t, non(P), non(S)), sentence(t, non(S), non(P)),
      sentence(obv[t], P, S), sentence("A", P, S), sentence("O", P, S), sentence(t, S, non(P)),
    ]);
    correct.forEach((c) => wrong.delete(c));
    const shown = correct.length ? [pick(correct)] : [];
    const options = shuffle([...shown, ...shuffle([...wrong]).slice(0, 3), NOT]);
    const why = {
      conversion: "Valid conversions: E→E, I→I, A→I (\"by limitation\"), and E→O. An O cannot be converted, and an A cannot be converted simply: either would distribute in the conclusion a term undistributed in the premise.",
      obversion: "Obversion: (1) change the quality of the proposition and (2) negate the predicate. A→E, E→A, I→O, O→I.",
      contraposition: "Contraposition: obvert, convert, obvert. A becomes All non-P is non-S; E and O become Some non-P is not non-S; an I has no contrapositive (you'd have to convert an O).",
    }[op];
    return {
      unit: 6, prompt: `What is the valid <b>${op === "contraposition" ? "full contrapositive" : op}</b> of this proposition?`,
      body: sentence(t, S, P) + ".",
      options, correct: correct.length ? shown : [NOT], why,
    };
  }

  // ---- Categorical syllogisms ----
  const VALID_FORMS = [
    "AAA-1", "EAE-1", "AII-1", "EIO-1", "AAI-1", "EAO-1",
    "EAE-2", "AEE-2", "EIO-2", "AOO-2", "EAO-2", "AEO-2",
    "AAI-3", "IAI-3", "AII-3", "EAO-3", "OAO-3", "EIO-3",
    "AAI-4", "AEE-4", "IAI-4", "EAO-4", "EIO-4", "AEO-4",
  ];
  const FORM_NAMES = {
    "AAA-1": "Barbara", "EAE-1": "Celarent", "AII-1": "Darii", "EIO-1": "Ferio",
    "EAE-2": "Cesare", "AEE-2": "Camestres", "EIO-2": "Festino", "AOO-2": "Baroko",
    "AAI-3": "Darapti", "IAI-3": "Disamis", "AII-3": "Datisi", "EAO-3": "Felapton", "OAO-3": "Bokardo", "EIO-3": "Ferison",
    "AAI-4": "Bramantip", "AEE-4": "Camenes", "IAI-4": "Dimaris", "EAO-4": "Fesapo", "EIO-4": "Fresison",
  };
  // positions of terms per figure: [major premise subj, pred], [minor premise subj, pred]
  const FIG = { 1: [["M", "P"], ["S", "M"]], 2: [["P", "M"], ["S", "M"]], 3: [["M", "P"], ["M", "S"]], 4: [["P", "M"], ["M", "S"]] };

  // Aristotle's six rules and two corollaries, as named in Kreeft Ch. XI.
  const RULES = {
    mid: "Undistributed Middle (Rule 3)",
    maj: "Illicit Major (Rule 4)",
    min: "Illicit Minor (Rule 4)",
    neg2: "Two Negative Premises (Rule 5)",
    negmis: "Rule 6 (negative premise ⇔ negative conclusion)",
    part2: "Two particular premises (Corollary 1)",
    partUniv: "Particular premise, universal conclusion (Corollary 2)",
  };

  function checkSyllogism(mood, fig) {
    const [m1, m2, c] = mood.split("");
    const [[a1, b1], [a2, b2]] = FIG[fig];
    const dist = (type, subj, pred) => ({ [subj]: distSubj(type), [pred]: distPred(type) });
    const d1 = dist(m1, a1, b1), d2 = dist(m2, a2, b2), dc = dist(c, "S", "P");
    const v = [];
    if (!d1.M && !d2.M) v.push(RULES.mid);
    if (dc.P && !d1.P) v.push(RULES.maj);
    if (dc.S && !d2.S) v.push(RULES.min);
    if (isNeg(m1) && isNeg(m2)) v.push(RULES.neg2);
    const negPrem = isNeg(m1) || isNeg(m2);
    if (negPrem !== isNeg(c) && !(isNeg(m1) && isNeg(m2))) v.push(RULES.negmis);
    if (isPart(m1) && isPart(m2)) v.push(RULES.part2);
    if ((isPart(m1) || isPart(m2)) && !isPart(c) && !(isPart(m1) && isPart(m2))) v.push(RULES.partUniv);
    return v;
  }

  function randomSyllogism() {
    let mood, fig;
    if (Math.random() < 0.45) {
      const f = pick(VALID_FORMS); mood = f.slice(0, 3); fig = +f[4];
    } else {
      do { mood = pick(TYPES) + pick(TYPES) + pick(TYPES); fig = 1 + rand(4); }
      while (checkSyllogism(mood, fig).length === 0);
    }
    return { mood, fig };
  }

  function renderSyllogism(mood, fig, T) {
    const [[a1, b1], [a2, b2]] = FIG[fig];
    return [
      sentence(mood[0], T[a1], T[b1]) + ".",
      sentence(mood[1], T[a2], T[b2]) + ".",
      "∴ " + sentence(mood[2], T.S, T.P) + ".",
    ].join("<br>");
  }

  function genSyllogism() {
    const { mood, fig } = randomSyllogism();
    const T = threeTerms();
    const viol = checkSyllogism(mood, fig);
    const body = renderSyllogism(mood, fig, T);
    const form = `${mood}-${fig}`;
    const termKey = `<span class="small">S = ${T.S}, P = ${T.P}, M = ${T.M}</span>`;
    if (Math.random() < 0.3) {
      const opts = new Set([form]);
      while (opts.size < 4) {
        opts.add(Math.random() < 0.5 ? `${mood}-${1 + rand(4)}` : `${pick(TYPES)}${pick(TYPES)}${pick(TYPES)}-${fig}`);
      }
      return {
        unit: 11, prompt: "What are the mood and figure?", body,
        options: shuffle([...opts]), correct: [form],
        why: `Mood ${mood} (major premise, minor premise, conclusion); figure ${fig} (${FIG[fig].map((p) => p.join("-")).join(", ")}).${FORM_NAMES[form] ? ` Its traditional name is <b>${FORM_NAMES[form]}</b>.` : ""}<br>${termKey}`,
      };
    }
    const options = ["Valid", RULES.mid, RULES.maj, RULES.min, RULES.neg2, RULES.negmis, RULES.part2];
    return {
      unit: 11, prompt: "Valid, or which rule does it break?", body, options,
      correct: viol.length ? viol : ["Valid"],
      why: (viol.length
        ? `Invalid (${form}). Broken rule${viol.length > 1 ? "s" : ""}: ${viol.join("; ")}.`
        : `Valid: ${form}${FORM_NAMES[form] ? ` (${FORM_NAMES[form]})` : ""}.`) + `<br>${termKey}`,
    };
  }

  // ---- Compound (hypothetical / disjunctive / conjunctive) arguments ----
  const PAIRS = [
    { p: "it is raining", np: "it is not raining", q: "the streets are wet", nq: "the streets are not wet" },
    { p: "Socrates is a man", np: "Socrates is not a man", q: "Socrates is mortal", nq: "Socrates is not mortal" },
    { p: "you study logic", np: "you do not study logic", q: "you will reason well", nq: "you will not reason well" },
    { p: "the soul is immortal", np: "the soul is not immortal", q: "death is not the end", nq: "death is the end" },
    { p: "the battery is dead", np: "the battery is not dead", q: "the car won't start", nq: "the car will start" },
    { p: "God exists", np: "God does not exist", q: "the universe has a cause", nq: "the universe has no cause" },
  ];
  const ARG_FORMS = [
    { name: "Affirming the Antecedent (valid)", f: (x) => [`If ${x.p}, then ${x.q}.`, `${cap(x.p)}.`, `∴ ${cap(x.q)}.`], why: "p ⊃ q; p; ∴ q. One of the two valid forms of the mixed hypothetical syllogism." },
    { name: "Denying the Consequent (valid)", f: (x) => [`If ${x.p}, then ${x.q}.`, `${cap(x.nq)}.`, `∴ ${cap(x.np)}.`], why: "p ⊃ q; ~q; ∴ ~p. Valid; when q is absurd, this is a reductio ad absurdum." },
    { name: "Affirming the Consequent (invalid)", f: (x) => [`If ${x.p}, then ${x.q}.`, `${cap(x.q)}.`, `∴ ${cap(x.p)}.`], why: "Invalid: more than one cause can produce the same effect." },
    { name: "Denying the Antecedent (invalid)", f: (x) => [`If ${x.p}, then ${x.q}.`, `${cap(x.np)}.`, `∴ ${cap(x.nq)}.`], why: "Invalid: q might still be true for another reason." },
    { name: "Disjunctive: denying an alternative (valid)", f: (x) => [`Either ${x.p} or ${x.q}.`, `${cap(x.np)}.`, `∴ ${cap(x.q)}.`], why: "The negative form of the disjunctive syllogism is valid." },
    { name: "Disjunctive: affirming an alternative (invalid)", f: (x) => [`Either ${x.p} or ${x.q}.`, `${cap(x.p)}.`, `∴ ${cap(x.nq)}.`], why: "The affirmative form is invalid for a weak disjunction (at least one, maybe both)." },
    { name: "Conjunctive: affirming one (valid)", f: (x) => [`Not both ${x.p} and ${x.nq}.`, `${cap(x.p)}.`, `∴ ${cap(x.q)}.`], why: "~(p & q); p; ∴ ~q. The valid form of the conjunctive syllogism." },
    { name: "Conjunctive: denying one (invalid)", f: (x) => [`Not both ${x.p} and ${x.q}.`, `${cap(x.np)}.`, `∴ ${cap(x.q)}.`], why: "~(p & q); ~p; ∴ q is invalid: both could be false." },
  ];
  function genArgForm() {
    const form = pick(ARG_FORMS);
    const x = pick(PAIRS);
    const others = shuffle(ARG_FORMS.filter((f) => f !== form)).slice(0, 3).map((f) => f.name);
    return {
      unit: 13, prompt: "Name this compound syllogism.", body: form.f(x).join("<br>"),
      options: shuffle([form.name, ...others]), correct: [form.name], why: form.why,
    };
  }

  window.LOGIC = { genPropType, genSquare, genImmediate, genSyllogism, genArgForm, checkSyllogism, shuffle, pick, VALID_FORMS };
})();
