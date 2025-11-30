const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fetch = require("node-fetch"); // v2
const fs = require("fs");
const CryptoJS = require("crypto-js");
const Database = require("better-sqlite3");
const crypto = require("crypto");

const VAULT_DB = path.join(app.getPath("userData"), "vault.db");
const KEY_FILE = path.join(app.getPath("userData"), "vault.key"); // clave simétrica del cofre

// ----- preguntas protegidas -----
const QUESTIONS_FILE = path.join(app.getPath("userData"), "questions.enc");
const SECRET_KEY = "paisanajacinta";

// Normaliza entrada: quita tildes, baja a minúsculas, recorta y colapsa espacios
function normalize(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Hash siempre sobre el texto normalizado
function hash(str) {
  return CryptoJS.SHA256(normalize(str)).toString();
}

const defaultQuestions = [
  // Vuoto intenzionalmente - l'utente deve creare la prima domanda
];

function saveQuestions(questions) {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(questions),
    SECRET_KEY
  ).toString();
  fs.writeFileSync(QUESTIONS_FILE, encrypted, "utf8");
}

function loadQuestions() {
  if (!fs.existsSync(QUESTIONS_FILE)) {
    saveQuestions(defaultQuestions);
    return defaultQuestions;
  }
  const encrypted = fs.readFileSync(QUESTIONS_FILE, "utf8");
  const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(
    CryptoJS.enc.Utf8
  );
  return JSON.parse(decrypted);
}
function initDb() {
  const db = new Database(VAULT_DB);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE
    );
    CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY,
      service TEXT NOT NULL,
      username TEXT NOT NULL,
      enc_data TEXT NOT NULL,   -- JSON con {iv,tag,data}
      category_id INTEGER,
      icon_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );
    CREATE INDEX IF NOT EXISTS idx_passwords_service ON passwords(service);
    CREATE INDEX IF NOT EXISTS idx_passwords_username ON passwords(username);
  `);
  return db;
}
const db = initDb();

function getCategoryId(name) {
  if (!name) return null;
  const ins = db.prepare("INSERT OR IGNORE INTO categories(name) VALUES (?)");
  ins.run(name);
  const row = db.prepare("SELECT id FROM categories WHERE name = ?").get(name);
  return row?.id ?? null;
}

// Devuelve SOLO una pregunta aleatoria
ipcMain.handle("get-random-question", () => {
  const arr = loadQuestions();
  if (!arr.length) return null; // 👈 devuelve null si no hay preguntas
  const i = Math.floor(Math.random() * arr.length);
  return arr[i].question;
});

// Valida respuesta (case/acentos/espacios ignorados)
ipcMain.handle("validate-answer", (event, { question, answer }) => {
  const arr = loadQuestions();
  const found = arr.find((x) => x.question === question);
  if (!found) return false;
  return found.answer === hash(answer); // hash() ya normaliza
});

// Devuelve el conteo de preguntas
ipcMain.handle("questions:count", () => {
  const arr = loadQuestions();
  return arr.length;
});

// Devuelve lista de preguntas (sin respuestas)
ipcMain.handle("questions:list", () => {
  const arr = loadQuestions();
  return arr.map((q) => ({ question: q.question }));
});

// Agrega una nueva pregunta
ipcMain.handle("questions:add", (event, { question, answer }) => {
  if (!question || !answer)
    throw new Error("Pregunta y respuesta son obligatorias");
  const arr = loadQuestions();

  // Verifica si ya existe
  const exists = arr.find(
    (q) => q.question.toLowerCase().trim() === question.toLowerCase().trim()
  );
  if (exists) throw new Error("Esta pregunta ya existe");

  arr.push({
    question: question.trim(),
    answer: hash(answer), // normaliza y hashea
  });
  saveQuestions(arr);
  return true;
});

// Elimina una pregunta
ipcMain.handle("questions:delete", (event, question) => {
  let arr = loadQuestions();
  const originalLength = arr.length;
  arr = arr.filter((q) => q.question !== question);

  if (arr.length === originalLength) {
    throw new Error("Pregunta no encontrada");
  }

  saveQuestions(arr);
  return true;
});

// ----- verso (como ya lo tenías) -----
let VERSES = ["JHN.3.16", "ROM.8.28", "ISA.41.10", "PSA.23.1", "PHP.4.13"];
try {
  VERSES = JSON.parse(
    fs.readFileSync(path.join(__dirname, "verse.json"), "utf8")
  );
} catch {}
const API_KEY = "ad4f0e6ae193b95241077609613ace6c";
const BIBLE_ID = "592420522e16049f-01";

ipcMain.handle("get-verse", async () => {
  try {
    const verseId = VERSES[Math.floor(Math.random() * VERSES.length)];
    const url = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/verses/${verseId}`;
    const res = await fetch(url, { headers: { "api-key": API_KEY } });
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
    const data = await res.json();

    let html = data?.data?.content || "";
    html = html.replace(/<sup[^>]*>.*?<\/sup>/gi, "");
    html = html.replace(
      /<span[^>]*class="[^"]*v(?:ers)?[^"]*"[^>]*>.*?<\/span>/gi,
      ""
    );

    return { html, reference: data?.data?.reference || "" };
  } catch (err) {
    console.error("Error al obtener verso:", err);
    return { html: "No se pudo cargar el versículo 🙏", reference: "" };
  }
});
// Listar (con búsqueda opcional). No devuelve el password en claro.
ipcMain.handle("pw:list", (e, { query = "" } = {}) => {
  const q = `%${query.trim()}%`;
  const rows = query
    ? db
        .prepare(
          `
        SELECT p.id, p.service, p.username, p.icon_path, c.name AS category
        FROM passwords p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.service LIKE ? OR p.username LIKE ? OR IFNULL(c.name,'') LIKE ?
        ORDER BY p.service ASC, p.created_at ASC
      `
        )
        .all(q, q, q)
    : db
        .prepare(
          `
        SELECT p.id, p.service, p.username, p.icon_path, c.name AS category
        FROM passwords p
        LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY p.service ASC, p.created_at ASC
      `
        )
        .all();

  // Convertir icon_path (base64 o null) a formato utilizzabile dal frontend
  return rows.map((row) => ({
    ...row,
    icon_path: row.icon_path || null,
  }));
});

// Obtener password descifrado (para mostrar/copiar)
ipcMain.handle("pw:get", (e, id) => {
  const row = db.prepare(`SELECT enc_data FROM passwords WHERE id = ?`).get(id);
  if (!row) return null;
  const payload = JSON.parse(row.enc_data);
  return dec(payload); // devuelve el password en claro
});

// Crear
ipcMain.handle(
  "pw:add",
  (e, { service, username, password, category, iconPath }) => {
    if (!service || !username || !password)
      throw new Error("Faltan campos obligatorios");
    if (!iconPath) throw new Error("La icona es obligatoria");

    // Validazione base64: deve iniziare con data:image/
    if (!iconPath.startsWith("data:image/")) {
      throw new Error(
        "La icona deve essere un'immagine valida in formato base64"
      );
    }

    const encPayload = JSON.stringify(enc(password));
    const category_id = getCategoryId(category);
    const stmt = db.prepare(`
    INSERT INTO passwords(service, username, enc_data, category_id, icon_path)
    VALUES (?, ?, ?, ?, ?)
  `);
    const info = stmt.run(service, username, encPayload, category_id, iconPath);
    return info.lastInsertRowid;
  }
);

// Actualizar
ipcMain.handle(
  "pw:update",
  (e, { id, service, username, password, category, iconPath }) => {
    const existing = db.prepare(`SELECT * FROM passwords WHERE id = ?`).get(id);
    if (!existing) throw new Error("No existe el registro");

    const enc_data = password
      ? JSON.stringify(enc(password))
      : existing.enc_data;
    const category_id = category
      ? getCategoryId(category)
      : existing.category_id;

    db.prepare(
      `
    UPDATE passwords
    SET service = ?, username = ?, enc_data = ?, category_id = ?, icon_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
    ).run(
      service ?? existing.service,
      username ?? existing.username,
      enc_data,
      category_id,
      iconPath ?? existing.icon_path,
      id
    );
    return true;
  }
);

// Eliminar
ipcMain.handle("pw:delete", (e, id) => {
  db.prepare(`DELETE FROM passwords WHERE id = ?`).run(id);
  return true;
});

// ----- BACKUP / RESTORE -----
ipcMain.handle("backup:export", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Selecciona carpeta para guardar el backup",
    properties: ["openDirectory"],
  });
  if (canceled || !filePaths.length) return false;

  const destDir = filePaths[0];
  try {
    if (fs.existsSync(VAULT_DB))
      fs.copyFileSync(VAULT_DB, path.join(destDir, "vault.db"));
    if (fs.existsSync(KEY_FILE))
      fs.copyFileSync(KEY_FILE, path.join(destDir, "vault.key"));
    if (fs.existsSync(QUESTIONS_FILE))
      fs.copyFileSync(QUESTIONS_FILE, path.join(destDir, "questions.enc"));
    return true;
  } catch (err) {
    console.error("Backup export error:", err);
    throw err;
  }
});

ipcMain.handle("backup:import", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title:
      "Selecciona los 3 archivos de backup (vault.db, vault.key, questions.enc)",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "KeyCausa Backup", extensions: ["db", "key", "enc"] }],
  });
  if (canceled || !filePaths.length) return false;

  const files = filePaths.map((p) => ({ path: p, name: path.basename(p) }));
  const dbFile = files.find((f) => f.name === "vault.db");
  const keyFile = files.find((f) => f.name === "vault.key");
  const qFile = files.find((f) => f.name === "questions.enc");

  if (!dbFile || !keyFile || !qFile) {
    throw new Error(
      "Debes seleccionar los 3 archivos: vault.db, vault.key y questions.enc"
    );
  }

  try {
    fs.copyFileSync(dbFile.path, VAULT_DB);
    fs.copyFileSync(keyFile.path, KEY_FILE);
    fs.copyFileSync(qFile.path, QUESTIONS_FILE);

    app.relaunch();
    app.exit(0);
    return true;
  } catch (err) {
    console.error("Backup import error:", err);
    throw err;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 720,
    useContentSize: true,
    resizable: true,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0f1115",
    icon: path.join(__dirname, "assets", "logo512.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.setMenuBarVisibility(false);
  // 💡 Detecta si estás empaquetado o en desarrollo
  if (app.isPackaged) {
    // producción: cargar el HTML generado por Vite
    win.loadFile(path.join(__dirname, "renderer", "dist", "index.html"));
  } else {
    // desarrollo: Vite dev server
    win.loadURL("http://localhost:5173");
  }

  win.webContents.on("did-fail-load", (e, code, desc, url) => {
    console.error("did-fail-load", code, desc, url);
  });
}
function getVaultKey() {
  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE);
  }
  const key = crypto.randomBytes(32); // 32 bytes = 256 bits
  fs.writeFileSync(KEY_FILE, key, { mode: 0o600 });
  return key;
}
const VAULT_KEY = getVaultKey();

function enc(plain) {
  const iv = crypto.randomBytes(12); // GCM usa IV de 12 bytes
  const cipher = crypto.createCipheriv("aes-256-gcm", VAULT_KEY, iv);
  const enc1 = Buffer.concat([
    cipher.update(String(plain), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: enc1.toString("base64"),
  };
}

function dec({ iv, tag, data }) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    VAULT_KEY,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const dec1 = Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]);
  return dec1.toString("utf8");
}

app.whenReady().then(createWindow);
