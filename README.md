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

## Accounts, profiles & leaderboard (optional)
Without setup, the app works offline with no accounts. To turn on logins and a leaderboard for your study group, use Firebase (free):

1. **Create a project.** Go to [console.firebase.google.com](https://console.firebase.google.com), click **Create a project**, and name it (e.g. `socratic-logic-study`). Google Analytics is not needed.
2. **Turn on email logins.** **Build → Authentication → Get started → Email/Password → Enable → Save.**
3. **Create the database.** **Build → Firestore Database → Create database.** Choose a location near you and start in **production mode**.
4. **Add the security rules.** In Firestore, open the **Rules** tab, replace everything with the contents of [`firestore.rules`](firestore.rules), and click **Publish**.
5. **Set your invite code.** In Firestore **Data**, click **+ Start collection**:
   - Collection ID: `meta`
   - Document ID: `group`
   - Field: `inviteCode` · type **string** · value: any code you choose (e.g. `AGORA`)

   Only people who know this code can join. You can change it here at any time; people who already joined keep their accounts.
6. **Allow your site to log in.** **Authentication → Settings → Authorized domains → Add domain:** `emilyemily49.github.io`
7. **Connect the app.** **Project settings (gear icon) → General → Your apps → Web (`</>`)**, register an app (no hosting needed), and copy the `firebaseConfig` values into [`js/firebase-config.js`](js/firebase-config.js), replacing `null`.
8. Commit and push. Open the app, then **Sign in → Create an account** with your invite code.

Points: 10 per correct answer (up to +10 more for answers in a row), +50 for a perfect quiz, +3 per flashcard you knew, and +20–40 for finishing Matching. The weekly leaderboard resets every Monday.

Note: on iPhone, the home-screen app stores its login separately from Safari, so sign in once inside the installed app.

To test the account screens without Firebase, open the app with `?mock=1` at the end of the URL (invite code `AGORA`). It uses fake data stored only in that browser.

## Editing content
Everything you study lives in `js/data.js`:
- `PARTS` / `UNITS`: the book's parts, chapters and sections.
- `LESSONS`: the mini-lesson cards for each chapter.
- `TERMS`: `[chapter, term, definition]` entries.
- `DECKS`: practice questions from the book's exercises (`it(question, answer, explanation, options?)`).

After changing files, bump `VERSION` in `sw.js` so the installed app picks up the update.
