// src/components/CopyPss.jsx
import React, { useState } from "react";
import "./CopyPss.css";

const CopyButton = ({
  serviceName = "Google",
  email = "ade*********@gmail.com",
  iconPath = "",           // 👈 nueva prop para la ruta de la icona
  onCopy,                  // 👈 función async para copiar
  onDelete,                // 👈 nueva prop para eliminar
}) => {
  const [showFeedback, setShowFeedback] = useState(false);

  // Truncate email/username to first 8 chars + ***
  const truncateEmail = (text) => {
    if (!text) return "";
    if (text.length <= 8) return text;
    return text.substring(0, 8) + "***";
  };

  const handleCopy = async () => {
    try {
      let text = "";
      if (onCopy) {
        // onCopy ya copia al clipboard en la página padre; aquí igual obtengo el texto por si quieres usarlo
        text = await onCopy();
      }
      // fallback por si no copió arriba
      if (text) {
        await navigator.clipboard.writeText(text);
      }
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 2000);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Evita que se active el copy
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <>
      <div className="copy-button-wrapper">
        <button className="copy-button" onClick={handleCopy}>
          <div className="avatar-container">
            <img 
              src={iconPath || '/default-icon.svg'} 
              alt={serviceName}
              className="avatar-icon"
              onError={(e) => { 
                e.currentTarget.src = '/default-icon.svg'; 
              }}
            />
          </div>
          <div className="button-content">
            <h3 className="service-name">{serviceName}</h3>
            <p className="email-text">{truncateEmail(email)}</p>
          </div>
        </button>
        
        {onDelete && (
          <button 
            className="delete-password-btn" 
            onClick={handleDelete}
            title="Eliminar contraseña"
          >
            🗑️
          </button>
        )}
      </div>

      <div className={`copy-feedback ${showFeedback ? "show" : ""}`}>
        ¡Copiado!
      </div>
    </>
  );
};

export default CopyButton;
