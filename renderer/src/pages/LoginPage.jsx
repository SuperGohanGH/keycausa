import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import appLogo from "../assets/logo512.png";

export default function LoginPage({ onLogin, errorMsg }) {
  const [question, setQuestion] = useState("Cargando pregunta...");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [verse, setVerse] = useState({ html: "Cargando versículo...", reference: "" });
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    // Verificar si hay preguntas configuradas
    checkQuestionsSetup();

    // Cargar verso
    window.api.getVerse().then(setVerse).catch(() =>
      setVerse({ html: "No se pudo cargar el versículo 🙏", reference: "" })
    );
  }, []);

  // Forza il focus sull'input quando il componente si monta
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const checkQuestionsSetup = async () => {
    try {
      const count = await window.api.questionsCount();
      if (count === 0) {
        // No hay preguntas, redirigir al setup inicial
        navigate("/setup-question", { replace: true });
        return;
      }
      // Cargar pregunta aleatoria
      const q = await window.api.getRandomQuestion();
      setQuestion(q || "No se pudo cargar la pregunta");
    } catch (err) {
      setQuestion("Error al cargar la pregunta");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const ok = await window.api.validateAnswer({ question, answer });
    if (ok) {
      localStorage.setItem("authed", "1");
      navigate("/passwords");
    } else {
      setError("Respuesta incorrecta ❌");
    }
  };

  const handleExport = async () => {
    try {
      const ok = await window.api.backupExport();
      if (ok) {
        setSuccess("Backup guardado correctamente");
        setTimeout(() => setSuccess(""), 3000);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setError("Error al exportar: " + err);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleImportClick = () => {
    setShowImportConfirm(true);
  };

  const performImport = async () => {
    setShowImportConfirm(false);
    try {
      await window.api.backupImport();
      // La app se reiniciará si tiene éxito
    } catch (err) {
      setError("Error al importar: " + err.message);
      setTimeout(() => setError(""), 3000);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="login-background">
      <div className="login-card">
        <div className="logo-space">
          <img
            src={appLogo}
            alt="KeyCausa Logo"
            className="login-logo"
          />
          <span className="login-brand">KeyCausa</span>
        </div>        <h2 className="login-title">{question}</h2>

        <p className="login-verse" dangerouslySetInnerHTML={{ __html: verse.html }} />
        {verse.reference && <div className="login-verse-ref">{verse.reference}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            ref={inputRef}
            type="password"
            className="login-input"
            placeholder="Tu respuesta..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button type="submit" className="login-button">Entrar</button>
        </form>

        {showImportConfirm ? (
          <div className="import-confirm-box">
            <p>¿Sobrescribir datos?</p>
            <div className="confirm-actions">
              <button onClick={performImport} className="confirm-yes">Sí</button>
              <button onClick={() => setShowImportConfirm(false)} className="confirm-no">No</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button
              onClick={handleImportClick}
              className="action-button"
              title="Importar claves"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Importar</span>
            </button>

            <button
              onClick={handleExport}
              className="action-button"
              title="Exportar claves"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Exportar</span>
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        {error && <p className="error">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>
    </div>
  );
}