# Socratic Logic Study

A study app for Peter Kreeft's *Socratic Logic* (3rd ed.). It's a web app you can install on an iPhone, and it works offline.

## How it's organized
The app follows Peter Kreeft's *Socratic Logic* (Edition 3.1) exactly: the **Introduction and Chapters I–XVI**, grouped by Kreeft's three acts of the mind (Understanding, Judgment, Reasoning) plus the Applications. Each chapter lists Kreeft's own sections, marked basic (B) or philosophical (P).

Tap a chapter to open:
- a **mini-lesson**: short cards summarizing Kreeft's sections in our own words
- **flashcards, a term quiz and matching** for that chapter's terms (213 terms across the book)
- **practice games built from the book's exercises and examples**, e.g. Term/Proposition/Argument (p. 34), Univocal/Equivocal/Analogical (p. 49), the Ten Categories (p. 55), Predicables (p. 61), Rules of Division (p. 64), Fallacy Hunter (Kreeft's 49 material fallacies), Definition Doctor (p. 131), Logical Form (pp. 148–62), the Snarks & Boojums Square (p. 179), the Four Causes (p. 205), Test by the Six Rules (p. 253), Enthymemes (p. 271), and Mill's Methods. Answers follow the book's answer key where it gives one.
- **generated practice** using Kreeft's rules: A/E/I/O and distribution, conversion/obversion/contraposition, the Square of Opposition, the Syllogism Judge (Aristotle's six rules, mood and figure), and compound syllogisms

Tick chapters on the home screen to mix them in **Mixed Review**.

**OH NO! There's a silly goose on the loose!** Every so often during a quiz or flashcards, a goose waddles across the screen. Tap it before it escapes for +25 points and the *Silly Goose* and *Goose Wrangler* badges. (Secret: tap the title on the home screen three times to release one just for fun.)

Progress is saved on your device.

## Put it on your iPhone
1. Host it with GitHub Pages: repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and `/ (root)`, then Save.
2. Open the Pages URL in **Safari** on your iPhone.
3. Tap **Share → Add to Home Screen**.

## Accounts & leaderboard
When the app runs on Cloudflare (see `wrangler.jsonc` and `worker.js`), accounts and scores work automatically. There's nothing to set up: the Worker stores everything in a built-in SQLite Durable Object.

- **Sign in → Create an account** with a display name, username, password, and the **invite code** (set in `wrangler.jsonc` → `vars.INVITE_CODE`, currently `SILLYGOOSE`).
- You stay signed in on that device. Signing in on another device brings your points and flashcard progress with you.
- The **leaderboard** compares everyone in the group: all-time points, this week (resets Mondays), and current streak.
- Points: 10 per correct answer (up to +10 more for answers in a row), +50 for a perfect quiz, +3 per flashcard you knew, +20–40 for Matching, and +25 for catching a silly goose.
- There's no self-service password reset; ask Claude (or edit the database in the Cloudflare dashboard) if someone forgets theirs.

Optional alternative: Firebase. If `js/firebase-config.js` has a config, the app uses Firebase instead (see `firestore.rules`). To try the account screens with fake data, add `?mock=1` to the URL (invite code `AGORA`).

## Editing content
Everything you study lives in `js/data.js`:
- `PARTS` / `UNITS`: the book's parts, chapters and sections.
- `LESSONS`: the mini-lesson cards for each chapter.
- `TERMS`: `[chapter, term, definition]` entries.
- `DECKS`: practice questions from the book's exercises (`it(question, answer, explanation, options?)`).

After changing files, bump `VERSION` in `sw.js` so the installed app picks up the update.
