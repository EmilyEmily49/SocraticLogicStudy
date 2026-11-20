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

  // ---- Square of opposition (traditional, with existential import) ----
  // SQUARE[given][value] -> {A,E,I,O: true|false|null}
  const SQUARE = {
    A: { true: { A: true, E: false, I: true, O: false }, false: { A: false, E: null, I: null, O: true } },
    E: { true: { A: false, E: true, I: false, O: true }, false: { A: null, E: false, I: true, O: null } },
    I: { true: { A: null, E: false, I: true, O: null }, false: { A: false, E: true, I: false, O: true } },
    O: { true: { A: false, E: null, I: null, O: true }, false: { A: true, E: false, I: true, O: false } },
  };
  const RELATION = (x, y) => {
    const k = [x, y].sort().join("");
    return { AO: "Contradictories", EI: "Contradictories", AE: "Contraries", IO: "Subcontraries", AI: "Subalterns", EO: "Subalterns" }[k];
  };
  const tvLabel = (v) => (v === null ? "Undetermined" : v ? "True" : "False");

  function genSquare() {
    const { S, P } = threeTerms();
    const g = pick(TYPES);
    const others = TYPES.filter((x) => x !== g);
    const tgt = pick(others);
    if (Math.random() < 0.25) {
      const rel = RELATION(g, tgt);
      return {
        unit: 6, prompt: "What is the relationship between these two?",
        body: `${sentence(g, S, P)}.<br>${sentence(tgt, S, P)}.`,
        options: ["Contradictories", "Contraries", "Subcontraries", "Subalterns"],
        correct: [rel],
        why: `${g} and ${tgt} are ${rel.toLowerCase()}.`,
      };
    }
    const val = Math.random() < 0.5;
    const res = SQUARE[g][val][tgt];
    return {
      unit: 6, prompt: `If it is <b>${val ? "TRUE" : "FALSE"}</b> that “${sentence(g, S, P)},” then…`,
      body: `“${sentence(tgt, S, P)}” is:`,
      options: ["True", "False", "Undetermined"],
      correct: [tvLabel(res)],
      why: `${g} and ${tgt} are ${RELATION(g, tgt).toLowerCase()}. ${squareTip(g, val, tgt)}`,
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

  // ---- Immediate inference ----
  function genImmediate() {
    const { S, P } = threeTerms();
    const t = pick(TYPES);
    const op = pick(["conversion", "obversion", "contraposition"]);
    const non = (x) => `non-${x}`;
    const obv = { A: "E", E: "A", I: "O", O: "I" };
    let correct, valid = true;
    if (op === "conversion") {
      if (t === "A") correct = `Some ${P} are ${S}`;
      else if (t === "O") { valid = false; }
      else correct = sentence(t, P, S);
    } else if (op === "obversion") {
      correct = sentence(obv[t], S, non(P));
    } else {
      if (t === "A" || t === "O") correct = sentence(t, non(P), non(S));
      else valid = false;
    }
    const cand = new Set([
      sentence(t, P, S), sentence(obv[t], S, non(P)), sentence(t, non(P), non(S)),
      sentence(obv[t], P, S), sentence(t, non(S), non(P)), `Some ${P} are ${S}`,
    ]);
    const NOT = "No valid inference";
    if (correct) cand.delete(correct);
    const options = shuffle([...(valid ? [correct] : []), ...shuffle([...cand]).slice(0, 3), NOT]);
    const why = {
      conversion: "Conversion swaps S and P: valid for E and I, for A only by limitation, never for O.",
      obversion: "Obversion changes the quality and negates the predicate; it's valid for all four types.",
      contraposition: "Contraposition swaps S and P and negates both; it's valid for A and O only.",
    }[op];
    return {
      unit: 6, prompt: `What is the valid <b>${op}</b> of this proposition?`,
      body: sentence(t, S, P) + ".",
      options, correct: [valid ? correct : NOT], why,
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
    "EAE-2": "Cesare", "AEE-2": "Camestres", "EIO-2": "Festino", "AOO-2": "Baroco",
    "AAI-3": "Darapti", "IAI-3": "Disamis", "AII-3": "Datisi", "EAO-3": "Felapton", "OAO-3": "Bocardo", "EIO-3": "Ferison",
    "AAI-4": "Bramantip", "AEE-4": "Camenes", "IAI-4": "Dimaris", "EAO-4": "Fesapo", "EIO-4": "Fresison",
  };
  // positions of terms per figure: [major premise subj, pred], [minor premise subj, pred]
  const FIG = { 1: [["M", "P"], ["S", "M"]], 2: [["P", "M"], ["S", "M"]], 3: [["M", "P"], ["M", "S"]], 4: [["P", "M"], ["M", "S"]] };

  const RULES = {
    mid: "Undistributed middle",
    maj: "Illicit major",
    min: "Illicit minor",
    neg2: "Two negative premises",
    negmis: "Negative / affirmative mismatch",
    part2: "Two particular premises",
    partUniv: "Universal conclusion from a particular premise",
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
        unit: 8, prompt: "What are the mood and figure?", body,
        options: shuffle([...opts]), correct: [form],
        why: `Mood ${mood} (major premise, minor premise, conclusion); figure ${fig} (${FIG[fig].map((p) => p.join("-")).join(", ")}).${FORM_NAMES[form] ? ` Its traditional name is <b>${FORM_NAMES[form]}</b>.` : ""}<br>${termKey}`,
      };
    }
    const options = ["Valid", RULES.mid, RULES.maj, RULES.min, RULES.neg2, RULES.negmis, RULES.part2];
    return {
      unit: 8, prompt: "Valid — or which rule does it break?", body, options,
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
    { name: "Modus ponens (valid)", f: (x) => [`If ${x.p}, then ${x.q}.`, `${cap(x.p)}.`, `∴ ${cap(x.q)}.`] },
    { name: "Modus tollens (valid)", f: (x) => [`If ${x.p}, then ${x.q}.`, `${cap(x.nq)}.`, `∴ ${cap(x.np)}.`] },
    { name: "Affirming the consequent (invalid)", f: (x) => [`If ${x.p}, then ${x.q}.`, `${cap(x.q)}.`, `∴ ${cap(x.p)}.`] },
    { name: "Denying the antecedent (invalid)", f: (x) => [`If ${x.p}, then ${x.q}.`, `${cap(x.np)}.`, `∴ ${cap(x.nq)}.`] },
    { name: "Disjunctive syllogism (valid)", f: (x) => [`Either ${x.p} or ${x.q}.`, `${cap(x.np)}.`, `∴ ${cap(x.q)}.`] },
    { name: "Affirming a disjunct (invalid)", f: (x) => [`Either ${x.p} or ${x.q} (or both).`, `${cap(x.p)}.`, `∴ ${cap(x.nq)}.`] },
    { name: "Conjunctive syllogism (valid)", f: (x) => [`It is not the case that both ${x.p} and ${x.nq}.`, `${cap(x.p)}.`, `∴ ${cap(x.q)}.`] },
  ];
  const ARG_WHY = {
    "Modus ponens (valid)": "Affirming the antecedent guarantees the consequent.",
    "Modus tollens (valid)": "If the consequent is false, the antecedent must be false.",
    "Affirming the consequent (invalid)": "The consequent could be true for another reason.",
    "Denying the antecedent (invalid)": "The consequent could still be true for another reason.",
    "Disjunctive syllogism (valid)": "If one alternative is denied, the other must hold.",
    "Affirming a disjunct (invalid)": "With an inclusive \"or,\" both could be true.",
    "Conjunctive syllogism (valid)": "If two can't both be true and one is, the other is false.",
  };
  function genArgForm() {
    const form = pick(ARG_FORMS);
    const x = pick(PAIRS);
    const others = shuffle(ARG_FORMS.filter((f) => f !== form)).slice(0, 3).map((f) => f.name);
    return {
      unit: 9, prompt: "Name this argument form.", body: form.f(x).join("<br>"),
      options: shuffle([form.name, ...others]), correct: [form.name], why: ARG_WHY[form.name],
    };
  }

  window.LOGIC = { genPropType, genSquare, genImmediate, genSyllogism, genArgForm, checkSyllogism, shuffle, pick, VALID_FORMS };
})();
