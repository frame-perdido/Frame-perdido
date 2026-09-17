// ============================================================
// api-locomotion-bridge.js
// Agrupa videos de Locomotion por serie
// ============================================================

(function () {
    'use strict';

    const API_LOCO = "https://loc0api.onrender.com";
    const ID_BASE = 20000;

    window.__apiSlugs = window.__apiSlugs || {};
    window.__locoEpisodios = window.__locoEpisodios || {};

    // ------------------------------------------------------------
    function extraerSerie(titulo) {
        const t = titulo.trim();

        const patrones = [
            /\s+-\s+/,
            /\s+–\s+/,
            /\s+CAP\s+/i,
            /\s+Cap\s+/i,
            /\s+cap\s+/i,
            /\s+Ep\s+/i,
            /\s+EP\s+/i,
            /\s+Episodio\s+/i,
            /\s+episodio\s+/i,
            /\s+S\d+E\d+/i,
            /\s+T\d+E\d+/i,
            /\s+T\d+\s+/i,
            /\s+\d{1,3}\s*[-–:]?\s*/,
            /\s+\d{1,3}\s*$/,
        ];

        for (const p of patrones) {
            const m = t.match(p);
            if (m && m.index > 0) {
                return t.slice(0, m.index).trim();
            }
        }

        return t;
    }

    function extraerNumero(titulo) {
        const m = titulo.match(/\d+/);
        return m ? parseInt(m[0]) : 1;
    }

    function extraerNombreEp(titulo) {
        const m = titulo.match(/\d+\s*[-–:]?\s*(.+)/);
        return m ? m[1].trim() : "";
    }

    // ------------------------------------------------------------
    function grupoAAnime(serie, videos, indice) {
        const id = ID_BASE + indice;
        const slug = "loco-" + serie.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 50);

        window.__apiSlugs[id] = slug;

        videos.sort((a, b) => a.num - b.num);

        const episodios = videos.map(v => ({
            num: v.num,
            version: "Episodio",
            url: v.url,
            titulo: v.nombreEp
        }));

        window.__locoEpisodios[id] = episodios;

        return {
            id: id,
            title: serie,
            cover: "",
            year: "—",
            type: "Serie TV",
            duration: `${videos.length} cap${videos.length > 1 ? 's' : ''}`,
            studio: "Locomotion",
            director: "—",
            genre: ["Animación"],
            tags: ["locomotion"],
            description: `Serie del catálogo Locomotion. ${videos.length} episodios.`,
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
            fromLocomotion: true
        };
    }

    // ------------------------------------------------------------
    function fusionarConAnimes(nuevas) {
        if (typeof window.animes === 'undefined') {
            console.warn('[loc0-bridge] `animes` no existe todavía.');
            return false;
        }

        const yaCargadas = new Set(
            window.animes
                .filter(a => a.fromLocomotion)
                .map(a => a.title.toLowerCase())
        );

        const filtradas = nuevas.filter(n => !yaCargadas.has(n.title.toLowerCase()));

        if (filtradas.length === 0) {
            console.log('[loc0-bridge] No hay series nuevas.');
            return true;
        }

        window.animes.push(...filtradas);

        console.log(`[loc0-bridge] Añadidas ${filtradas.length} series de Locomotion. Total: ${window.animes.length}`);
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
                console.log('[loc0-bridge] UI refrescada.');
            } catch (e) {
                console.error('[loc0-bridge] Error refrescando UI:', e);
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
                console.warn('[loc0-bridge] No hay videos.');
                return;
            }

            console.log(`[loc0-bridge] ${videos.length} videos recibidos`);

            // Agrupar por serie
            const grupos = {};
            videos.forEach(v => {
                const serie = extraerSerie(v.title || "");
                if (!serie) return;

                if (!grupos[serie]) grupos[serie] = [];
                grupos[serie].push({
                    num: extraerNumero(v.title || ""),
                    nombreEp: extraerNombreEp(v.title || ""),
                    url: v.url
                });
            });

            console.log(`[loc0-bridge] ${Object.keys(grupos).length} series agrupadas`);

            const series = Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'es'));
            const nuevas = series.map((s, i) => grupoAAnime(s, grupos[s], i));

            if (fusionarConAnimes(nuevas)) {
                refrescarUI();
            }
        } catch (e) {
            console.error('[loc0-bridge] Error cargando videos:', e);
        }
    }

    // ------------------------------------------------------------
    function esperarAnimes(intentos = 20) {
        if (typeof window.animes !== 'undefined' && Array.isArray(window.animes)) {
            cargarVideos();
            return;
        }
        if (intentos <= 0) {
            console.error('[loc0-bridge] `animes` nunca apareció.');
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
