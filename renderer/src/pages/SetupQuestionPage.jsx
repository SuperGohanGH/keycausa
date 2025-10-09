import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SetupQuestionPage.css";
import logo512 from "../assets/logo512.png";

export default function SetupQuestionPage() {
  const nav = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confirmAnswer, setConfirmAnswer] = useState("");
  const [error, setError] = useState("");

  // Forza il focus sull'input quando il componente si monta
  useEffect(() => {
    const input = document.querySelector('.setup-input');
    if (input) {
      input.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("La pregunta no puede estar vacía");
      return;
    }

    if (!answer.trim()) {
      setError("La respuesta no puede estar vacía");
      return;
    }

    if (answer !== confirmAnswer) {
      setError("Las respuestas no coinciden");
      return;
    }

    try {
      await window.api.questionsAdd({ question: question.trim(), answer });
      // Marca como autenticado y redirige
      localStorage.setItem("authed", "1");
      nav("/passwords");
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="setup-wrap">
      <div className="setup-card">
        <div className="setup-logo">
          <img src={logo512} alt="KeyCausa Logo" />
          <h1 className="setup-title">Bienvenido a KeyCausa</h1>
        </div>
        <p className="setup-subtitle">
          Para comenzar, configura tu primera pregunta de seguridad.
          Esta pregunta te permitirá acceder a tus contraseñas.
        </p>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="question">Pregunta de seguridad</label>
            <input
              id="question"
              type="text"
              className="setup-input"
              placeholder="Ej: ¿Nombre de tu primera mascota?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="answer">Respuesta</label>
            <input
              id="answer"
              type="password"
              className="setup-input"
              placeholder="Tu respuesta..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmAnswer">Confirmar respuesta</label>
            <input
              id="confirmAnswer"
              type="password"
              className="setup-input"
              placeholder="Repite tu respuesta..."
              value={confirmAnswer}
              onChange={(e) => setConfirmAnswer(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {error && <p className="setup-error">{error}</p>}

          <button type="submit" className="setup-button">
            Crear pregunta y continuar
          </button>
        </form>
      </div>
    </div>
  );
}
