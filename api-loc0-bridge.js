// ============================================================
// api-locomotion-bridge.js
// Fusiona los videos de Locomotion (loc0api) al catálogo
// ============================================================

(function () {
    'use strict';

    const API_LOCO = "https://loc0api.onrender.com";
    const ID_BASE = 20000;   // IDs desde 20000 (no choca con frikiserie)

    window.__apiSlugs = window.__apiSlugs || {};

    // ------------------------------------------------------------
    function videoAAnime(video, indice) {
        const id = ID_BASE + indice;
        const titulo = video.title || "Sin título";

        // Duración formateada
        let dur = "—";
        if (video.durationSeconds) {
            const min = Math.floor(video.durationSeconds / 60);
            const seg = video.durationSeconds % 60;
            dur = `${min}:${String(seg).padStart(2, "0")}`;
        }

        return {
            id: id,
            title: titulo,
            cover: video.thumbnail || video.imagen || "",
            year: "—",
            type: "Serie TV",
            duration: dur,
            studio: "Locomotion",
            director: "—",
            genre: ["Animación"],
            tags: ["locomotion"],
            description: video.description || "Contenido de Locomotion.",
            plot: "",
            analysis: "",
            forgotten: "",
            trailer: "",
            saga: null,
            sagaOrder: null,
            related: [],
            category: "animada",
            origin: "Locomotion",
            rarity: "Común",
            adulto: false,
            hentai: false,
            ecchi: false,

            // Info para el reproductor
            locoUrl: video.url,
            fromLocomotion: true
        };
    }

    // ------------------------------------------------------------
    function fusionarConAnimes(nuevas) {
        if (typeof window.animes === 'undefined') {
            console.warn('[loco-bridge] `animes` no existe todavía.');
            return false;
        }

        const yaCargadas = new Set(
            window.animes
                .filter(a => a.fromLocomotion)
                .map(a => a.title)
        );

        const filtradas = nuevas.filter(n => !yaCargadas.has(n.title));

        if (filtradas.length === 0) {
            console.log('[loco-bridge] No hay videos nuevos.');
            return true;
        }

        window.animes.push(...filtradas);

        console.log(`[loco-bridge] Añadidos ${filtradas.length} videos. Total: ${window.animes.length}`);
        return true;
    }

    // ------------------------------------------------------------
    function refrescarUI() {
        setTimeout(() => {
            try {
                if (typeof window.actualizarContadoresTabs === 'function') window.actualizarContadoresTabs();
                if (typeof window.renderCards === 'function') window.renderCards();
                if (typeof window.updateStats === 'function') window.updateStats();
                if (typeof window.actualizarHero === 'function') window.actualizarHero();
                console.log('[loco-bridge] UI refrescada.');
            } catch (e) {
                console.error('[loco-bridge] Error refrescando UI:', e);
            }
        }, 150);
    }

    // ------------------------------------------------------------
    async function cargarVideos() {
        try {
            const r = await fetch(`${API_LOCO}/locomotion/contenido`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);

            const data = await r.json();
            const videos = data.contenido || [];

            if (!videos.length) {
                console.warn('[loco-bridge] No hay videos.');
                return;
            }

            // Orden A-Z
            videos.sort((a, b) => {
                const ta = (a.title || "").toLowerCase();
                const tb = (b.title || "").toLowerCase();
                return ta.localeCompare(tb, 'es');
            });

            const nuevas = videos.map((v, i) => videoAAnime(v, i));

            if (fusionarConAnimes(nuevas)) {
                refrescarUI();
            }
        } catch (e) {
            console.error('[loco-bridge] Error cargando videos:', e);
        }
    }

    // ------------------------------------------------------------
    function esperarAnimes(intentos = 20) {
        if (typeof window.animes !== 'undefined' && Array.isArray(window.animes)) {
            cargarVideos();
            return;
        }
        if (intentos <= 0) {
            console.error('[loco-bridge] `animes` nunca apareció.');
            return;
        }
        setTimeout(() => esperarAnimes(intentos - 1), 100);
    }

    // ------------------------------------------------------------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => esperarAnimes());
    } else {
        esperarAnimes();
    }

})();
