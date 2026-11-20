# Socratic Logic Study

A study app for Peter Kreeft's *Socratic Logic* (3rd ed.). It's a web app you can install on an iPhone, and it works offline.

## Activities
**Memorize**
- **Flashcards** with spaced repetition (Leitner boxes). They go term → definition or definition → term.
- **Term Quiz**: multiple choice in both directions.
- **Matching**: pair terms with definitions against the clock.
- **Chapter Challenge**: 15 mixed questions from the chapters you selected.

**Practice the concepts**
- Proposition Sorter (A/E/I/O, distribution)
- Square of Opposition (true / false / undetermined)
- Conversion, Obversion, Contraposition
- Syllogism Judge: valid or not, which rule is broken, mood & figure. It generates unlimited syllogisms and checks them against the traditional rules.
- Argument Forms: modus ponens and tollens, and their fallacies
- Fallacy Hunter, Definition Doctor, Predicables, Univocal/Equivocal/Analogical, Translate to Logical Form, Deduction or Induction?, Find the Conclusion, Mill's Methods, Answer the Dilemma

Choose chapters on the home screen. Progress is saved on your device.

## Put it on your iPhone
1. Host it with GitHub Pages: repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and `/ (root)`, then Save.
2. Open the Pages URL in **Safari** on your iPhone.
3. Tap **Share → Add to Home Screen**.

## Editing content
Everything you study lives in `js/data.js`:
- `UNITS`: chapter titles. Rename these to match your book's table of contents.
- `TERMS`: `[unit, term, definition]` entries.
- `DECKS`: scenario questions (fallacies, definitions, translations…).

After changing files, bump `VERSION` in `sw.js` so the installed app picks up the update.
