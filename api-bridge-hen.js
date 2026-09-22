// ============================================================
// api-bridge-hen.js — Frame Perdido
// ============================================================

(function () {
    'use strict';

    const API = "https://hen-api.onrender.com";
    const ID_BASE = 50000;
    const LIMIT = 100;
    const MAX_YEAR = 2008;
    const PAUSA_ENTRE_PAGINAS = 300;

    window.__apiSlugs = window.__apiSlugs || {};
    window.__episodiosExtra = window.__episodiosExtra || {};

    function apiItemAItem(apiItem, indice) {
        const id = ID_BASE + indice;

        window.__apiSlugs[id] = apiItem.slug;

        const generosLower = (apiItem.generos || []).map(g => g.toLowerCase());
        const esAdulto = true;
        const esEcchi = generosLower.some(g =>
            g.includes('ecchi') || g.includes('softcore')
        );

        const tags = [...new Set(generosLower.map(g => g.trim()).filter(Boolean))];

        return {
            id: id,
            title: apiItem.titulo || "Sin título",
            cover: apiItem.portada || "",
            year: apiItem.año || "—",
            type: apiItem.tipo || "OVA",
            duration: "—",
            studio: "—",
            director: "—",
            genre: apiItem.generos || [],
            tags: tags,
            description: apiItem.sinopsis || "Sin descripción disponible.",
            plot: "",
            analysis: "",
            forgotten: "",
            trailer: "",
            saga: null,
            sagaOrder: null,
            related: [],
            category: "animada",
            origin: "Japón",
            rarity: "Común",
            adulto: true,
            hentai: esAdulto,
            ecchi: esEcchi,

            apiSlug: apiItem.slug,
            fromApi: true,
            apiUrl: apiItem.url
        };
    }

    function fusionarConAnimes(nuevas) {
        if (typeof window.animes === 'undefined') {
            console.warn('[api-bridge-hen] `animes` no existe todavía.');
            return false;
        }

        const yaCargadas = new Set(
            window.animes
                .filter(a => a.fromApi && a.apiSlug)
                .map(a => a.apiSlug)
        );

        const filtradas = nuevas.filter(n => !yaCargadas.has(n.apiSlug));

        window.animes.push(...filtradas);

        window.__apiAnimes = window.__apiAnimes || [];
        window.__apiAnimes.push(...filtradas);

        console.log(`[api-bridge-hen] Añadidos ${filtradas.length} items. Total global: ${window.animes.length}`);
        return true;
    }

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
                console.log('[api-bridge-hen] UI refrescada.');
            } catch (e) {
                console.error('[api-bridge-hen] Error al refrescar UI:', e);
            }
        }, 150);
    }

    async function cargarItemsAPI() {
        try {
            const todos = [];
            let page = 1;

            while (true) {
                const url = `${API}/animes?max_year=${MAX_YEAR}&page=${page}&limit=${LIMIT}`;
                console.log(`[api-bridge-hen] Pidiendo ${url}`);

                const r = await fetch(url);
                if (!r.ok) throw new Error(`HTTP ${r.status} en página ${page}`);

                const data = await r.json();
                const items = data.animes || [];

                todos.push(...items);
                console.log(`[api-bridge-hen] Página ${page}: ${items.length} (acumulado: ${todos.length}/${data.total})`);

                if (items.length < LIMIT) break;
                if (page >= data.paginas_totales) break;
                page++;

                await new Promise(res => setTimeout(res, PAUSA_ENTRE_PAGINAS));
            }

            if (!todos.length) {
                console.warn('[api-bridge-hen] La API no devolvió items.');
                return;
            }

            todos.sort((a, b) => {
                const ta = (a.titulo || "").toLowerCase();
                const tb = (b.titulo || "").toLowerCase();
                return ta.localeCompare(tb, 'es');
            });

            const nuevas = todos.map((a, i) => apiItemAItem(a, i));

            if (fusionarConAnimes(nuevas)) {
                refrescarUI();
            }
        } catch (e) {
            console.error('[api-bridge-hen] Error al cargar items:', e);
        }
    }

    async function cargarEpisodiosDeItem(apiSlug) {
        if (!apiSlug) return [];
        if (window.__episodiosExtra[apiSlug]) {
            return window.__episodiosExtra[apiSlug];
        }

        try {
            const r = await fetch(`${API}/animes/${encodeURIComponent(apiSlug)}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();

            window.__episodiosExtra[apiSlug] = data.episodios || [];
            return window.__episodiosExtra[apiSlug];
        } catch (e) {
            console.error(`[api-bridge-hen] Error cargando episodios:`, e);
            return [];
        }
    }

    window.__cargarEpisodiosExtra = cargarEpisodiosDeItem;

    function esperarAnimes(intentos = 20) {
        if (typeof window.animes !== 'undefined' && Array.isArray(window.animes)) {
            cargarItemsAPI();
            return;
        }
        if (intentos <= 0) {
            console.error('[api-bridge-hen] `animes` nunca apareció.');
            return;
        }
        setTimeout(() => esperarAnimes(intentos - 1), 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => esperarAnimes());
    } else {
        esperarAnimes();
    }

})();
