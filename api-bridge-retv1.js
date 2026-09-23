// ============================================================
// api-bridge-retv1.js — Frame Perdido 
// ============================================================

(function () {
    'use strict';

    const API = "https://retv1.onrender.com";
    const ID_BASE = 70000;
    const LIMIT = 100;
    const PAUSA_ENTRE_PAGINAS = 300;

    window.__apiSlugs = window.__apiSlugs || {};
    window.__episodiosExtra = window.__episodiosExtra || {};

    function apiItemAItem(apiItem, indice) {
        const id = ID_BASE + indice;
        const slug = apiItem.url.split('/').filter(Boolean).pop();

        window.__apiSlugs[id] = slug;

        const generos = apiItem.generos || [];
        const generosLower = generos.map(g => g.toLowerCase());

        return {
            id: id,
            title: apiItem.titulo || "Sin título",
            cover: apiItem.imagen_hd || "",
            year: apiItem.primera_emision
                ? apiItem.primera_emision.split('-').pop()
                : (apiItem.anio || "—"),
            type: "Serie",
            duration: apiItem.duracion || "—",
            studio: "—",
            director: (apiItem.directores || []).join(', ') || "—",
            genre: generos,
            tags: [...new Set(generosLower.map(g => g.trim()).filter(Boolean))],
            description: apiItem.sinopsis || "Sin descripción disponible.",
            plot: "",
            analysis: "",
            forgotten: "",
            trailer: "",
            saga: null,
            sagaOrder: null,
            related: [],
            category: "retro",
            origin: "—",
            rarity: "Común",
            adulto: false,
            hentai: false,
            ecchi: false,

            apiSlug: slug,
            fromApi: true,
            apiUrl: apiItem.url,
            totalTemporadas: apiItem.total_temporadas || 0,
            totalEpisodios: apiItem.total_episodios || 0
        };
    }

    function fusionarConAnimes(nuevas) {
        if (typeof window.animes === 'undefined') {
            console.warn('[api-bridge-retv1] `animes` no existe todavía.');
            return false;
        }

        const yaCargadas = new Set(
            window.animes
                .filter(a => a.fromApi && a.apiUrl && a.apiUrl.includes('retrotve'))
                .map(a => a.apiSlug)
        );

        const filtradas = nuevas.filter(n => !yaCargadas.has(n.apiSlug));
        window.animes.push(...filtradas);

        window.__apiAnimesRetv1 = window.__apiAnimesRetv1 || [];
        window.__apiAnimesRetv1.push(...filtradas);

        console.log(`[api-bridge-retv1] Añadidos ${filtradas.length}. Total global: ${window.animes.length}`);
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
                console.log('[api-bridge-retv1] UI refrescada.');
            } catch (e) {
                console.error('[api-bridge-retv1] Error al refrescar UI:', e);
            }
        }, 150);
    }

    async function cargarItemsAPI() {
        try {
            const todos = [];
            let offset = 0;

            while (true) {
                const url = `${API}/series?limit=${LIMIT}&offset=${offset}`;
                console.log(`[api-bridge-retv1] Pidiendo ${url}`);

                const r = await fetch(url);
                if (!r.ok) throw new Error(`HTTP ${r.status} en offset ${offset}`);

                const data = await r.json();
                const items = data.resultados || [];
                todos.push(...items);
                console.log(`[api-bridge-retv1] offset ${offset}: ${items.length} (acum: ${todos.length}/${data.total})`);

                if (items.length < LIMIT) break;
                if (todos.length >= data.total) break;
                offset += LIMIT;

                await new Promise(res => setTimeout(res, PAUSA_ENTRE_PAGINAS));
            }

            if (!todos.length) {
                console.warn('[api-bridge-retv1] La API no devolvió items.');
                return;
            }

            todos.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", 'es'));

            const nuevas = todos.map((a, i) => apiItemAItem(a, i));

            if (fusionarConAnimes(nuevas)) {
                refrescarUI();
            }
        } catch (e) {
            console.error('[api-bridge-retv1] Error al cargar items:', e);
        }
    }

    async function cargarEpisodiosDeItem(apiSlug) {
        if (!apiSlug) return [];
        if (window.__episodiosExtra[apiSlug]) return window.__episodiosExtra[apiSlug];

        try {
            const r = await fetch(`${API}/series/${encodeURIComponent(apiSlug)}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();

            const episodios = [];
            (data.temporadas || []).forEach(t => {
                (t.episodios || []).forEach(e => {
                    episodios.push({
                        num: e.episodio,
                        temporada: e.temporada,
                        version: (data.total_temporadas > 1) ? `T${e.temporada}` : "Episodio",
                        url: e.url_directa,
                        url_pagina: e.url_pagina
                    });
                });
            });

            window.__episodiosExtra[apiSlug] = episodios;
            return episodios;
        } catch (e) {
            console.error(`[api-bridge-retv1] Error cargando episodios:`, e);
            return [];
        }
    }

    window.__cargarEpisodiosRetv1 = cargarEpisodiosDeItem;

    function esperarAnimes(intentos = 20) {
        if (typeof window.animes !== 'undefined' && Array.isArray(window.animes)) {
            cargarItemsAPI();
            return;
        }
        if (intentos <= 0) {
            console.error('[api-bridge-retv1] `animes` nunca apareció.');
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
