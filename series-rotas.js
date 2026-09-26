// ============================================================
// series-rotas.js
// Formato: por ID (único de cada obra, no choca entre APIs)
// ============================================================

window.SERIES_ROTAS = [
    // Por ahora solo esta para probar
    70005,  // space-academy
];

window.estaRota = function (obra) {
    if (!obra || !window.SERIES_ROTAS) return false;
    return window.SERIES_ROTAS.includes(obra.id);
};
