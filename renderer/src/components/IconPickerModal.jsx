import React, { useState, useEffect } from 'react';
import './IconPickerModal.css';

const IconPickerModal = ({ isOpen, onClose, onSelect }) => {
    const [defaultLogos, setDefaultLogos] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // Cargar logos dinámicamente desde src/assets/logos
            const modules = import.meta.glob('../assets/logos/*.(png|jpg|jpeg|svg)', { eager: true });

            const logos = Object.keys(modules).map(path => ({
                path: modules[path].default, // URL resuelta por Vite
                name: path.split('/').pop()
            }));

            setDefaultLogos(logos);
        }
    }, [isOpen]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Convertir a base64 o URL local para previsualización
            const reader = new FileReader();
            reader.onloadend = () => {
                onSelect(reader.result);
                onClose();
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="icon-picker-overlay" onClick={onClose}>
            <div className="icon-picker-modal" onClick={e => e.stopPropagation()}>
                <div className="icon-picker-header">
                    <h2>Seleccionar Icono</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="icon-picker-content">
                    <div className="upload-section">
                        <label className="upload-btn-large">
                            <span className="upload-icon">📂</span>
                            <span>Subir imagen desde dispositivo</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    <div className="default-logos-section">
                        <h3>Logos Predeterminados</h3>
                        {defaultLogos.length > 0 ? (
                            <div className="logos-grid">
                                {defaultLogos.map((logo, index) => (
                                    <div
                                        key={index}
                                        className="logo-item"
                                        onClick={() => {
                                            onSelect(logo.path);
                                            onClose();
                                        }}
                                    >
                                        <img src={logo.path} alt={logo.name} title={logo.name} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-logos-msg">
                                No hay logos en src/assets/logos
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IconPickerModal;
