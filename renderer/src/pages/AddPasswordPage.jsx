import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import IconPickerModal from "../components/IconPickerModal";
import "./AddPasswordPage.css";

export default function AddPasswordPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    service: "", username: "", password: "", category: "", iconPath: ""
  });
  const [iconPreview, setIconPreview] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleIconSelect = (pathOrBase64) => {
    setIconPreview(pathOrBase64);
    setForm({ ...form, iconPath: pathOrBase64 });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

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

        {/* Selector de Icono */}
        <div className="icon-input-wrapper">
          <label className="icon-label">
            Icono (opcional)
          </label>

          <div className="icon-selection-area">
            <button
              type="button"
              className="select-icon-btn"
              onClick={() => setShowIconPicker(true)}
            >
              {iconPreview ? "Cambiar Icono" : "Seleccionar Icono"}
            </button>

            {iconPreview && (
              <div className="icon-preview">
                <img src={iconPreview} alt="Preview icono" />
                <button
                  type="button"
                  className="remove-icon-btn"
                  onClick={() => {
                    setIconPreview("");
                    setForm({ ...form, iconPath: "" });
                  }}
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="add-actions">
          <button type="button" onClick={() => nav("/passwords")}>Cancelar</button>
          <button type="submit" className="primary">Guardar</button>
        </div>
        {err && <p className="err">{err}</p>}
      </form>

      <IconPickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={handleIconSelect}
      />
    </div>
  );
}
