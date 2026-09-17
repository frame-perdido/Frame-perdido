// ============================================================
// api-bridge.js — Frame Perdido
// Fusiona el catálogo de la API con el catálogo local (data.js)
// ============================================================

(function () {
    'use strict';

    const API = "https://frik-api.onrender.com";
    const ID_BASE = 10000;   // Los IDs de la API empiezan aquí
    const LIMIT = 200;       // máximo que acepta la API

    // Mapa global: id local -> slug de la API
    window.__apiSlugs = window.__apiSlugs || {};

    // ------------------------------------------------------------
    // Convertir una serie de la API al formato de `animes`
    // ------------------------------------------------------------
    function serieAAnime(serie, indice) {
        const id = ID_BASE + indice;

        // Guardar el slug para watch.html
        window.__apiSlugs[id] = serie.slug;

        // Portada en alta resolución (Filmaffinity: msmall → large)
        let portada = serie.imagen || "";
        if (portada.includes("pics.filmaffinity.com")) {
            portada = portada.replace("msmall.jpg", "large.jpg");
        }

        return {
            id: id,
            title: serie.titulo || "Sin título",
            cover: portada,
            year: serie.fecha || "—",
            type: "Serie TV",
            duration: serie.numCapitulosDisponibles
                ? `${serie.numCapitulosDisponibles} caps`
                : "—",
            studio: "—",
            director: "—",
            genre: [],
            tags: [],
            description: serie.descripcion || "Sin descripción disponible.",
            plot: "",
            analysis: "",
            forgotten: "",
            trailer: "",
            saga: null,
            sagaOrder: null,
            related: [],
            category: "animada",
            origin: "",
            rarity: "Común",
            adulto: false,
            hentai: false,
            ecchi: false,

            apiSlug: serie.slug,
            fromApi: true
        };
    }

    // ------------------------------------------------------------
    // Fusionar con el array global `animes`
    // ------------------------------------------------------------
    function fusionarConAnimes(nuevas) {
        if (typeof window.animes === 'undefined') {
            console.warn('[api-bridge] `animes` no existe todavía.');
            return false;
        }

        const yaCargadas = new Set(
            window.animes
                .filter(a => a.fromApi)
                .map(a => a.apiSlug)
        );

        const filtradas = nuevas.filter(n => !yaCargadas.has(n.apiSlug));

        if (filtradas.length === 0) {
            console.log('[api-bridge] No hay series nuevas para agregar.');
            return true;
        }

        window.animes.push(...filtradas);

        window.__apiAnimes = window.__apiAnimes || [];
        window.__apiAnimes.push(...filtradas);

        console.log(`[api-bridge] Añadidas ${filtradas.length} series de la API. Total: ${window.animes.length}`);
        return true;
    }

    // ------------------------------------------------------------
    // Refrescar la UI después de fusionar
    // ------------------------------------------------------------
    function refrescarUI() {
        setTimeout(() => {
            try {
                if (typeof window.actualizarContadoresTabs === 'function') window.actualizarContadoresTabs();
                if (typeof window.renderCards === 'function') window.renderCards();
                if (typeof window.updateStats === 'function') window.updateStats();
                if (typeof window.renderizarVibes === 'function') window.renderizarVibes();
                if (typeof window.setupListas === 'function') window.setupListas();
                if (typeof window.actualizarHero === 'function') window.actualizarHero();
                if (typeof window.setupTrailerDelDia === 'function') window.setupTrailerDelDia();
                console.log('[api-bridge] UI refrescada.');
            } catch (e) {
                console.error('[api-bridge] Error al refrescar UI:', e);
            }
        }, 150);
    }

    // ------------------------------------------------------------
    // Cargar TODAS las series desde la API (paginado) + orden A-Z
    // ------------------------------------------------------------
    async function cargarSeriesAPI() {
        try {
            const todas = [];
            let page = 1;

            while (true) {
                const r = await fetch(`${API}/series?page=${page}&limit=${LIMIT}`);
                if (!r.ok) throw new Error(`HTTP ${r.status} en página ${page}`);

                const data = await r.json();
                const items = data.items || [];

                todas.push(...items);
                console.log(`[api-bridge] Página ${page}: ${items.length} series (acumulado: ${todas.length})`);

                if (items.length < LIMIT) break;   // ya no hay más
                page++;
                if (page > 10) break;              // seguro anti-loop
            }

            if (!todas.length) {
                console.warn('[api-bridge] La API no devolvió series.');
                return;
            }

            // ORDEN ALFABÉTICO A-Z por título (respeta acentos y ñ)
            todas.sort((a, b) => {
                const ta = (a.titulo || "").toLowerCase();
                const tb = (b.titulo || "").toLowerCase();
                return ta.localeCompare(tb, 'es');
            });

            const nuevas = todas.map((s, i) => serieAAnime(s, i));

            if (fusionarConAnimes(nuevas)) {
                refrescarUI();
            }
        } catch (e) {
            console.error('[api-bridge] Error al cargar series de la API:', e);
        }
    }

    // ------------------------------------------------------------
    // Esperar a que data.js y data-02.js estén listos
    // ------------------------------------------------------------
    function esperarAnimes(intentos = 20) {
        if (typeof window.animes !== 'undefined' && Array.isArray(window.animes)) {
            cargarSeriesAPI();
            return;
        }
        if (intentos <= 0) {
            console.error('[api-bridge] `animes` nunca apareció.');
            return;
        }
        setTimeout(() => esperarAnimes(intentos - 1), 100);
    }

    // ------------------------------------------------------------
    // Arranque
    // ------------------------------------------------------------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => esperarAnimes());
    } else {
        esperarAnimes();
    }

})();
