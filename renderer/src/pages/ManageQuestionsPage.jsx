import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageQuestionsPage.css";

export default function ManageQuestionsPage() {
  const nav = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [confirmAnswer, setConfirmAnswer] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  // Forza il focus sugli input quando il componente si monta o cambia
  useEffect(() => {
    const inputs = document.querySelectorAll('.manage-input');
    if (inputs.length > 0) {
      inputs[0].focus();
    }
  }, [questions]);

  const loadQuestions = async () => {
    try {
      const list = await window.api.questionsList();
      setQuestions(list);
    } catch (err) {
      setError("Error al cargar las preguntas");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newQuestion.trim()) {
      setError("La pregunta no puede estar vacía");
      return;
    }

    if (!newAnswer.trim()) {
      setError("La respuesta no puede estar vacía");
      return;
    }

    if (newAnswer !== confirmAnswer) {
      setError("Las respuestas no coinciden");
      return;
    }

    try {
      await window.api.questionsAdd({ 
        question: newQuestion.trim(), 
        answer: newAnswer 
      });
      setSuccess("¡Pregunta agregada correctamente!");
      setNewQuestion("");
      setNewAnswer("");
      setConfirmAnswer("");
      setShowForm(false);
      loadQuestions();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDelete = async (question) => {
    if (questions.length <= 1) {
      setError("Debe mantener al menos una pregunta de seguridad");
      return;
    }

    // RIMOSSO IL POPUP CONFIRM - elimina direttamente
    try {
      await window.api.questionsDelete(question);
      setSuccess("¡Pregunta eliminada correctamente!");
      await loadQuestions();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="manage-wrap">
      <h1 className="page-title">Gestionar Preguntas de Seguridad</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="manage-content">
        <div className="questions-section">
          <div className="section-header">
            <h2>Tus preguntas</h2>
            <div className="header-actions">
              <button onClick={() => nav("/passwords")} className="back-btn">
                ← Volver
              </button>
              <button 
                onClick={() => setShowForm(!showForm)} 
                className="add-question-btn"
              >
                {showForm ? "Cancelar" : "+ Agregar pregunta"}
              </button>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleAdd} className="question-form" key="add-question-form">
              <div className="form-group">
                <label htmlFor="newQuestion">Nueva pregunta</label>
                <input
                  id="newQuestion"
                  type="text"
                  className="manage-input"
                  placeholder="Ej: ¿Nombre de tu mejor amigo de la infancia?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newAnswer">Respuesta</label>
                <input
                  id="newAnswer"
                  type="password"
                  className="manage-input"
                  placeholder="Tu respuesta..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  required
                  autoComplete="off"
                />
                <small className="form-hint">
                  No distingue entre mayúsculas/minúsculas ni tildes
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmAnswer">Confirmar respuesta</label>
                <input
                  id="confirmAnswer"
                  type="password"
                  className="manage-input"
                  placeholder="Repite tu respuesta..."
                  value={confirmAnswer}
                  onChange={(e) => setConfirmAnswer(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <button type="submit" className="submit-btn">
                Agregar pregunta
              </button>
            </form>
          )}

          <div className="questions-list">
            {questions.length === 0 ? (
              <p className="empty-message">No hay preguntas configuradas</p>
            ) : (
              questions.map((q, idx) => (
                <div key={idx} className="question-item">
                  <div className="question-text">
                    <span className="question-number">{idx + 1}.</span>
                    {q.question}
                  </div>
                  <button
                    onClick={() => handleDelete(q.question)}
                    className="delete-btn"
                    disabled={questions.length <= 1}
                    title={questions.length <= 1 ? "Debe mantener al menos una pregunta" : "Eliminar pregunta"}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}