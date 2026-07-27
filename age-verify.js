// ============================================================
// VENTANA DE VERIFICACIÓN DE EDAD (+18)
// ============================================================

// Crear el HTML del overlay
function crearOverlayEdad() {
    const overlay = document.createElement('div');
    overlay.id = 'age-verify-overlay';
    overlay.innerHTML = `
        <div class="age-box">
            <div class="age-icon">🔞</div>
            <h2>Verificación de edad</h2>
            <p class="age-sub">Este sitio contiene contenido para adultos<br>y anuncios que pueden no ser aptos para menores.</p>
            <div class="age-warning">
                ⚠️ <strong>Debes tener 18 años o más</strong> para acceder a Frame Perdido.<br>
                Al hacer clic en "Soy mayor de edad" aceptas nuestros <a href="https://frame-perdido.github.io/Frame-perdido/privacidad.html" style="color:var(--accent);text-decoration:underline;">términos de privacidad</a>.
            </div>
            <div class="age-buttons">
                <button class="age-btn age-btn-yes" onclick="aceptarEdad()">✔️ Soy mayor de edad</button>
                <button class="age-btn age-btn-no" onclick="rechazarEdad()">✖️ Salir</button>
            </div>
        </div>
    `;
    return overlay;
}

function aceptarEdad() {
    document.getElementById('age-verify-overlay').classList.add('hidden');
    localStorage.setItem('ageVerified', 'true');
}

function rechazarEdad() {
    window.location.href = 'https://www.google.com';
}

// ============================================================
// INYECTAR EL OVERLAY Y LOS ESTILOS AL CARGAR
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya verificó antes
    if (localStorage.getItem('ageVerified') === 'true') {
        return; // No hacer nada
    }

    // Crear y agregar estilos
    const styles = document.createElement('style');
    styles.textContent = `
        #age-verify-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.92);
            backdrop-filter: blur(15px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            transition: opacity 0.5s ease;
        }
        #age-verify-overlay.hidden {
            opacity: 0;
            pointer-events: none;
        }
        .age-box {
            background: var(--bg-card, #12121a);
            border: 1px solid var(--border, #2a2a3a);
            border-radius: 24px;
            padding: 50px 40px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            box-shadow: 0 30px 80px rgba(0,0,0,0.8);
            animation: ageFadeIn 0.6s ease;
        }
        @keyframes ageFadeIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .age-box .age-icon {
            font-size: 4rem;
            margin-bottom: 12px;
        }
        .age-box h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--text, #e8e8f0);
            margin-bottom: 8px;
        }
        .age-box .age-sub {
            color: var(--text-muted, #8a8a9a);
            font-size: 0.95rem;
            margin-bottom: 6px;
            line-height: 1.6;
        }
        .age-box .age-warning {
            color: #fbbf24;
            font-size: 0.85rem;
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.2);
            padding: 10px 16px;
            border-radius: 10px;
            margin: 16px 0 24px;
            line-height: 1.5;
        }
        .age-box .age-warning strong {
            color: #fbbf24;
        }
        .age-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .age-btn {
            padding: 14px 40px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            font-family: 'Inter', sans-serif;
            transition: all 0.3s;
            min-width: 120px;
        }
        .age-btn-yes {
            background: var(--accent, #ff6b35);
            color: #fff;
            box-shadow: 0 4px 20px var(--accent-glow, rgba(255,107,53,0.4));
        }
        .age-btn-yes:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px var(--accent-glow, rgba(255,107,53,0.5));
        }
        .age-btn-no {
            background: var(--bg-elevated, #1a1a25);
            color: var(--text-muted, #8a8a9a);
            border: 1px solid var(--border, #2a2a3a);
        }
        .age-btn-no:hover {
            background: var(--border, #2a2a3a);
            color: var(--text, #e8e8f0);
        }
        @media (max-width: 480px) {
            .age-box { padding: 30px 20px; }
            .age-box h2 { font-size: 1.4rem; }
            .age-btn { padding: 12px 24px; min-width: 100px; }
        }
    `;
    document.head.appendChild(styles);

    // Crear y agregar el overlay
    const overlay = crearOverlayEdad();
    document.body.prepend(overlay);
});
