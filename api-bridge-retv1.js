// ============================================================
// api-bridge-retv1.js — Frame Perdido → RetroTVE API
// ============================================================

(function () {
    'use strict';

    const API = "https://retv1.onrender.com";
    const ID_BASE_SERIES = 70000;
    const ID_BASE_PELIS  = 71000;
    const LIMIT = 100;
    const PAUSA = 300;

    window.__apiSlugs = window.__apiSlugs || {};
    window.__episodiosExtra = window.__episodiosExtra || {};

    // ---------------------------------------------------------
    // Detectar si es live action:
    //   1) Si está en la lista LIVE_ACTION_SLUGS
    //   2) O si tiene "Live Action" en los géneros
    // ---------------------------------------------------------
    function esLiveAction(slug, generos) {
        // Lista manual
        if (Array.isArray(window.LIVE_ACTION_SLUGS) && window.LIVE_ACTION_SLUGS.includes(slug)) {
            return true;
        }
        // Género "Live Action"
        if (Array.isArray(generos)) {
            return generos.some(g => g.toLowerCase().includes('live action'));
        }
        return false;
    }

    // ---------------------------------------------------------
    // Convertir item de la API al formato de tu web
    // ---------------------------------------------------------
    function apiItemAItem(apiItem, id, tipo) {
        const slug = apiItem.url.split('/').filter(Boolean).pop();
        window.__apiSlugs[id] = slug;

        const generos = apiItem.generos || [];
        const esLive = esLiveAction(slug, generos);
        const category = esLive ? 'live-action' : 'animada';
        const type = (tipo === 'pelicula') ? 'Película' : 'Serie TV';

        let year = '—';
        if (apiItem.primera_emision) year = apiItem.primera_emision.split('-').pop();
        else if (apiItem.fecha_lanzamiento) year = apiItem.fecha_lanzamiento.split('-').pop();
        else if (apiItem.anio) year = apiItem.anio;

        return {
            id: id,
            title: apiItem.titulo || "Sin título",
            cover: apiItem.imagen_hd || "",
            year: year,
            type: type,
            duration: apiItem.duracion || "—",
            studio: "—",
            director: (apiItem.directores || []).join(', ') || "—",
            genre: generos,
            tags: [...new Set(generos.map(g => g.toLowerCase().trim()).filter(Boolean))],
            description: apiItem.sinopsis || "Sin descripción disponible.",
            plot: "",
            analysis: "",
            forgotten: "",
            trailer: "",
            saga: null,
            sagaOrder: null,
            related: [],
            category: category,
            origin: "—",
            rarity: "Común",
            adulto: false,
            hentai: false,
            ecchi: false,

            apiSlug: slug,
            fromApi: true,
            apiUrl: apiItem.url,
            apiTipo: tipo,
            totalTemporadas: apiItem.total_temporadas || 0,
            totalEpisodios: apiItem.total_episodios || 0
        };
    }

    // ---------------------------------------------------------
    // Fusionar con window.animes
    // ---------------------------------------------------------
    function fusionarConAnimes(nuevas) {
        if (typeof window.animes === 'undefined') return false;

        const yaCargadas = new Set(
            window.animes
                .filter(a => a.fromApi && a.apiUrl && a.apiUrl.includes('retrotve'))
                .map(a => a.apiSlug + '|' + a.apiTipo)
        );

        const filtradas = nuevas.filter(n => !yaCargadas.has(n.apiSlug + '|' + n.apiTipo));
        window.animes.push(...filtradas);

        window.__apiAnimesRetv1 = window.__apiAnimesRetv1 || [];
        window.__apiAnimesRetv1.push(...filtradas);

        console.log(`[api-bridge-retv1] Añadidos ${filtradas.length}. Total global: ${window.animes.length}`);
        return true;
    }

    // ---------------------------------------------------------
    // Refrescar UI
    // ---------------------------------------------------------
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
                console.error('[api-bridge-retv1] Error refrescando UI:', e);
            }
        }, 150);
    }

    // ---------------------------------------------------------
    // Cargar todas las páginas de una colección
    // ---------------------------------------------------------
    async function cargarColeccion(endpoint) {
        const todos = [];
        let offset = 0;

        while (true) {
            const url = `${API}${endpoint}?limit=${LIMIT}&offset=${offset}`;
            console.log(`[api-bridge-retv1] Pidiendo ${url}`);

            const r = await fetch(url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);

            const data = await r.json();
            const items = data.resultados || [];
            todos.push(...items);
            console.log(`[api-bridge-retv1] ${endpoint} offset ${offset}: ${items.length} (acum: ${todos.length}/${data.total})`);

            if (items.length < LIMIT) break;
            if (todos.length >= data.total) break;
            offset += LIMIT;

            await new Promise(res => setTimeout(res, PAUSA));
        }
        return todos;
    }

    // ---------------------------------------------------------
    // Cargar TODO: series + pelis, independientes
    // ---------------------------------------------------------
    async function cargarTodo() {
        let nuevasSeries = [];
        let nuevasPelis = [];

        // ----- SERIES -----
        try {
            console.log('[api-bridge-retv1] Cargando SERIES...');
            const series = await cargarColeccion("/series");
            series.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", 'es'));
            nuevasSeries = series.map((a, i) => apiItemAItem(a, ID_BASE_SERIES + i, "serie"));
            console.log(`[api-bridge-retv1] Series listas: ${nuevasSeries.length}`);
        } catch (e) {
            console.error('[api-bridge-retv1] Error cargando series:', e);
        }

        // ----- PELÍCULAS -----
        try {
            console.log('[api-bridge-retv1] Cargando PELÍCULAS...');
            const pelis = await cargarColeccion("/peliculas");
            pelis.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", 'es'));
            nuevasPelis = pelis.map((a, i) => apiItemAItem(a, ID_BASE_PELIS + i, "pelicula"));
            console.log(`[api-bridge-retv1] Películas listas: ${nuevasPelis.length}`);
        } catch (e) {
            console.error('[api-bridge-retv1] Error cargando películas:', e);
        }

        const todas = [...nuevasSeries, ...nuevasPelis];
        if (todas.length === 0) {
            console.warn('[api-bridge-retv1] No se cargó nada');
            return;
        }

        const animadas = todas.filter(x => x.category === 'animada').length;
        const liveAction = todas.filter(x => x.category === 'live-action').length;
        console.log(`[api-bridge-retv1] Total: ${todas.length} (${nuevasSeries.length} series + ${nuevasPelis.length} pelis)`);
        console.log(`[api-bridge-retv1] Categorías: ${animadas} animadas · ${liveAction} live action`);

        if (fusionarConAnimes(todas)) refrescarUI();
    }

    // ---------------------------------------------------------
    // Cargar episodios de un item
    // ---------------------------------------------------------
    async function cargarEpisodiosDeItem(apiSlug, tipo) {
        if (!apiSlug) return [];
        const cacheKey = tipo + ':' + apiSlug;
        if (window.__episodiosExtra[cacheKey]) return window.__episodiosExtra[cacheKey];

        try {
            const endpoint = tipo === 'pelicula' ? 'peliculas' : 'series';
            const r = await fetch(`${API}/${endpoint}/${encodeURIComponent(apiSlug)}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();

            let episodios = [];

            if (tipo === 'pelicula') {
                const urls = data.urls_directas || [];
                episodios = urls.map((u, i) => ({
                    num: i + 1,
                    temporada: 1,
                    version: urls.length > 1 ? `Opción ${i + 1}` : "Película",
                    url: u,
                    url_pagina: data.url
                }));
                if (episodios.length === 0) {
                    episodios = [{ num: 1, temporada: 1, version: "Película", url: null, url_pagina: data.url }];
                }
            } else {
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
            }

            window.__episodiosExtra[cacheKey] = episodios;
            return episodios;
        } catch (e) {
            console.error(`[api-bridge-retv1] Error cargando episodios:`, e);
            return [];
        }
    }

    window.__cargarEpisodiosRetv1 = cargarEpisodiosDeItem;

    // ---------------------------------------------------------
    // Esperar `animes` y arrancar
    // ---------------------------------------------------------
    function esperarAnimes(intentos = 20) {
        if (typeof window.animes !== 'undefined' && Array.isArray(window.animes)) {
            cargarTodo();
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
