// src/pages/PasswordsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PasswordPage.css";
import CopyButton from "../components/CopyPss";
import appLogo from "../assets/logo512.png";

export default function PasswordsPage() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);

  async function load(q = "") {
    const data = await window.api.pwList(q); // ← viene del main (SQLite)
    setItems(data);
  }

  async function handleDelete(id, serviceName) {
    try {
      await window.api.pwDelete(id);
      // Mensaje de éxito temporal
      const successMsg = document.createElement('div');
      successMsg.className = 'delete-success-msg';
      successMsg.textContent = `✓ ${serviceName} eliminado`;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
      // Recargar lista
      await load(query);
    } catch (err) {
      alert("Error al eliminar la contraseña: " + err);
    }
  }

  useEffect(() => { load(""); }, []);

  // pequeño debounce al escribir
  useEffect(() => {
    const t = setTimeout(() => load(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="pw-wrap">
      <header className="pw-header">
        <h1>
          <img src={appLogo} alt="KeyCausa Logo" className="app-logo" />
          KeyCausa
        </h1>
        
        <div className="pw-actions">
          <input
            className="pw-search"
            placeholder="Buscar servicio, usuario o categoría…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="pw-add" onClick={() => nav("/add")}>Agregar</button>
          <button className="pw-manage-questions" onClick={() => nav("/manage-questions")}>
            Gestionar Preguntas
          </button>
          <button
            className="pw-logout"
            onClick={() => {
              localStorage.removeItem("authed");
              window.location.hash = "#/"; // vuelve al login
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="pw-main">
        {/* Wrap cards in a centered grid container so we can control side spacing */}
        <div className="pw-grid">
          {items.length === 0 ? (
            <div className="pw-empty-state">
              <div className="empty-icon">
                <img src={appLogo} alt="KeyCausa Logo" />
              </div>
              <h2>No hay contraseñas guardadas</h2>
              <p>Dale a <strong>Agregar</strong> para comenzar a agregar contraseñas</p>
            </div>
          ) : (
            items.map((it) => (
              <div className="pw-card" key={it.id}>
                <CopyButton
                  serviceName={it.service}
                  email={it.username}
                  iconPath={it.icon_path}
                  onCopy={async () => {
                    const pass = await window.api.pwGet(it.id);
                    await navigator.clipboard.writeText(pass);
                    return pass;
                  }}
                  onDelete={() => handleDelete(it.id, it.service)}
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}