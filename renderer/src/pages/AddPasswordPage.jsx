import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddPasswordPage.css";

export default function AddPasswordPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    service: "", username: "", password: "", category: "", iconPath: ""
  });
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [err, setErr] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setIconFile(null);
      setIconPreview("");
      setErr("");
      return;
    }

    // Validazione: solo immagini
    if (!file.type.startsWith('image/')) {
      setErr("Per favore seleziona un file immagine valido (PNG, JPG, SVG, etc.)");
      setIconFile(null);
      setIconPreview("");
      e.target.value = ""; // Reset input
      return;
    }

    setErr("");
    setIconFile(file);

    // Converti in base64 per preview e salvataggio
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setIconPreview(base64);
      setForm({ ...form, iconPath: base64 });
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    // Validazione: icona obbligatoria
    if (!form.iconPath) {
      setErr("L'icona è obbligatoria. Per favore seleziona un'immagine.");
      return;
    }

    try {
      await window.api.pwAdd(form);
      nav("/passwords");
    } catch (e2) {
      setErr(String(e2));
    }
  };

  return (
    <div className="add-wrap">
      <h2>Agregar contraseña</h2>
      <form onSubmit={submit} className="add-form">
        <input 
          name="service" 
          placeholder="Servicio (Google, GitHub…)" 
          value={form.service} 
          onChange={onChange} 
          required 
        />
        <input 
          name="username" 
          placeholder="Usuario / correo" 
          value={form.username} 
          onChange={onChange} 
          required 
        />
        <input 
          name="password" 
          placeholder="Contraseña" 
          value={form.password} 
          onChange={onChange} 
          required 
        />
        <input 
          name="category" 
          placeholder="Categoría (opcional)" 
          value={form.category} 
          onChange={onChange} 
        />
        
        {/* Input per icona - obbligatorio */}
        <div className="icon-input-wrapper">
          <label htmlFor="iconInput" className="icon-label">
            Icona (obbligatoria) *
          </label>
          <input 
            id="iconInput"
            type="file" 
            accept="image/*" 
            onChange={handleIconChange}
            required
            className="icon-file-input"
          />
          {iconPreview && (
            <div className="icon-preview">
              <img src={iconPreview} alt="Preview icona" />
            </div>
          )}
        </div>

        <div className="add-actions">
          <button type="button" onClick={() => nav("/passwords")}>Cancelar</button>
          <button type="submit" className="primary">Guardar</button>
        </div>
        {err && <p className="err">{err}</p>}
      </form>
    </div>
  );
}
