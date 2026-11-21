// Accounts + cloud data. Three modes:
//  - "firebase": real accounts (when js/firebase-config.js has a config)
//  - "mock":     local fake backend for testing (add ?mock=1 to the URL)
//  - "off":      no accounts; the app works offline as before
//
// Firestore layout:
//  meta/group          { inviteCode }     — created by you in the console; unreadable by clients
//  members/{uid}       { code, joined }   — proves the user knew the invite code
//  profiles/{uid}      public profile shown on the leaderboard (no email)
//  progress/{uid}      private flashcard/chapter progress (owner only)
(function () {
  const FB_VERSION = "10.12.2";
  const listeners = [];
  const B = {
    mode: "off",
    user: null, // { uid, email }
    onAuth(fn) { listeners.push(fn); },
  };
  const emit = () => listeners.forEach((fn) => fn(B.user));

  const ERRORS = {
    "auth/email-already-in-use": "That email already has an account. Try signing in.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Please use a password of at least 6 characters.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "No account with that email.",
    "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    "permission-denied": "That invite code isn't right.",
    "bad-code": "That invite code isn't right.",
  };
  B.message = (e) => ERRORS[e && e.code] || (e && e.message) || "Something went wrong.";

  // ---------------- Firebase ----------------
  async function initFirebase(cfg) {
    const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;
    const [appMod, authMod, fs] = await Promise.all([
      import(`${base}/firebase-app.js`), import(`${base}/firebase-auth.js`), import(`${base}/firebase-firestore.js`),
    ]);
    const app = appMod.initializeApp(cfg);
    const auth = authMod.getAuth(app);
    let db;
    try { db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache() }); } catch { db = fs.getFirestore(app); }
    const d = (...p) => fs.doc(db, ...p);

    B.signUp = async ({ name, email, password, code }) => {
      const cred = await authMod.createUserWithEmailAndPassword(auth, email, password);
      try {
        await fs.setDoc(d("members", cred.user.uid), { code: String(code).trim(), joined: fs.serverTimestamp() });
      } catch (e) {
        await authMod.deleteUser(cred.user).catch(() => {});
        throw { code: "bad-code" };
      }
      await fs.setDoc(d("profiles", cred.user.uid), { ...window.SCORE.newMe(name.trim()), updatedAt: fs.serverTimestamp() });
      emit(); // re-load now that membership and profile exist
    };
    B.signIn = ({ email, password }) => authMod.signInWithEmailAndPassword(auth, email, password);
    B.resetPassword = (email) => authMod.sendPasswordResetEmail(auth, email);
    B.signOut = () => authMod.signOut(auth);
    B.loadProfile = async () => (await fs.getDoc(d("profiles", B.user.uid))).data() || null;
    B.loadProgress = async () => (await fs.getDoc(d("progress", B.user.uid))).data() || null;
    B.saveProfile = (p) => fs.setDoc(d("profiles", B.user.uid), { ...p, updatedAt: fs.serverTimestamp() });
    B.saveProgress = (p) => fs.setDoc(d("progress", B.user.uid), p);
    B.profiles = async () => {
      const snap = await fs.getDocs(fs.query(fs.collection(db, "profiles"), fs.limit(300)));
      return snap.docs.map((x) => ({ uid: x.id, ...x.data() }));
    };
    authMod.onAuthStateChanged(auth, (u) => { B.user = u ? { uid: u.uid, email: u.email } : null; emit(); });
    B.mode = "firebase";
  }

  // ---------------- Mock (local testing) ----------------
  function initMock() {
    const K = "sls-mock-db";
    const load = () => { try { return JSON.parse(localStorage.getItem(K)) || null; } catch { return null; } };
    let db = load();
    if (!db) {
      const S = window.SCORE;
      const other = (name, points, weekPoints, streak, badges) => ({ ...S.newMe(name), points, weekPoints, streak, bestStreak: streak, lastDay: S.dayKey(), badges, counts: { correct: Math.round(points / 12) } });
      db = { code: "AGORA", users: {}, profiles: {
        u_alex: other("Alex", 1840, 220, 5, ["first", "hundred", "barbara", "streak3"]),
        u_sam: other("Sam", 960, 410, 9, ["first", "gadfly", "streak3", "streak7", "perfect"]),
        u_jo: other("Jo", 315, 0, 0, ["first"]),
      }, progress: {}, session: null };
    }
    const persist = () => localStorage.setItem(K, JSON.stringify(db));
    const fail = (code) => { throw { code }; };
    const later = (v) => new Promise((r) => setTimeout(() => r(v), 120));
    B.signUp = async ({ name, email, password, code }) => {
      if (Object.values(db.users).some((u) => u.email === email)) fail("auth/email-already-in-use");
      if (password.length < 6) fail("auth/weak-password");
      if (String(code).trim() !== db.code) fail("bad-code");
      const uid = "u_" + Math.random().toString(36).slice(2, 8);
      db.users[uid] = { email, password };
      db.profiles[uid] = window.SCORE.newMe(name.trim());
      db.session = uid; persist();
      B.user = { uid, email }; emit();
    };
    B.signIn = async ({ email, password }) => {
      const e = Object.entries(db.users).find(([, u]) => u.email === email && u.password === password);
      if (!e) fail("auth/invalid-credential");
      db.session = e[0]; persist();
      B.user = { uid: e[0], email }; emit();
    };
    B.resetPassword = async () => later();
    B.signOut = async () => { db.session = null; persist(); B.user = null; emit(); };
    B.loadProfile = async () => later(db.profiles[B.user.uid] || null);
    B.loadProgress = async () => later(db.progress[B.user.uid] || null);
    B.saveProfile = async (p) => { db.profiles[B.user.uid] = p; persist(); };
    B.saveProgress = async (p) => { db.progress[B.user.uid] = p; persist(); };
    B.profiles = async () => later(Object.entries(db.profiles).map(([uid, p]) => ({ uid, ...p })));
    B.mode = "mock";
    setTimeout(() => { if (db.session) B.user = { uid: db.session, email: db.users[db.session].email }; emit(); }, 0);
  }

  B.init = async () => {
    const mock = new URLSearchParams(location.search).has("mock");
    try {
      if (mock) initMock();
      else if (window.FIREBASE_CONFIG) await initFirebase(window.FIREBASE_CONFIG);
      else emit();
    } catch (e) {
      console.warn("Accounts unavailable:", e);
      B.mode = "off"; B.unavailable = true; emit();
    }
  };

  window.BACKEND = B;
})();
