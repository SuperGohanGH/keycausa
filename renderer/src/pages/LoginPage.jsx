import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import appLogo from "../assets/logo512.png";

export default function LoginPage({ onLogin, errorMsg }) {
  const [question, setQuestion] = useState("Cargando pregunta...");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [verse, setVerse] = useState({ html: "Cargando versículo...", reference: "" });
  const navigate = useNavigate();

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
    const input = document.querySelector('.login-input');
    if (input) {
      input.focus();
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

  return (
    <div className="login-background">
      <div className="login-card">
        <div className="logo-space">
          <img src={appLogo} alt="KeyCausa Logo" className="login-logo" />
          <span className="login-brand">KeyCausa</span>
        </div>

        <h2 className="login-title">{question}</h2>

        <p className="login-verse" dangerouslySetInnerHTML={{ __html: verse.html }} />
        {verse.reference && <div className="login-verse-ref">{verse.reference}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            className="login-input"
            placeholder="Tu respuesta..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button type="submit" className="login-button">Entrar</button>
        </form>

        {error && <p className="error">{error}</p>}
        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>
    </div>
  );
}
