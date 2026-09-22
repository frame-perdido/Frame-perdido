// ============================================================
// api-bridge-hentai.js — Frame Perdido
// Carga animes clásicos de HentaiLa API y los fusiona con animes
// ============================================================

(function () {
    'use strict';

    const API = "https://hen-api.onrender.com";
    const ID_BASE = 50000;         // Rango de IDs para no chocar con los de data.js
    const LIMIT = 100;             // Animes por página
    const MAX_YEAR = 2008;         // Solo clásicos
    const PAUSA_ENTRE_PAGINAS = 300;

    window.__apiSlugs = window.__apiSlugs || {};
    window.__hentaiEpisodios = window.__hentaiEpisodios || {};

    // ------------------------------------------------------------
    // Convierte un anime de la API al formato de Frame Perdido
    // ------------------------------------------------------------
    function apiAnimeAAnime(apiAnime, indice) {
        const id = ID_BASE + indice;

        window.__apiSlugs[id] = apiAnime.slug;

        // Detectar si el género incluye hentai/ecchi/adulto
        const generosLower = (apiAnime.generos || []).map(g => g.toLowerCase());
        const esHentai = true;  // Todo HentaiLa es hentai por definición
        const esEcchi = generosLower.some(g =>
            g.includes('ecchi') || g.includes('softcore')
        );

        // Tags a partir de géneros (lowercase y sin duplicados)
        const tags = [...new Set(generosLower.map(g => g.trim()).filter(Boolean))];

        return {
            id: id,
            title: apiAnime.titulo || "Sin título",
            cover: "",                          // HentaiLa no da portada; usamos placeholder
            year: apiAnime.año || "—",
            type: apiAnime.tipo || "OVA",       // OVA, TV, Movie...
            duration: "—",
            studio: "—",
            director: "—",
            genre: apiAnime.generos || [],
            tags: tags,
            description: apiAnime.sinopsis || "Sin descripción disponible.",
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
            hentai: esHentai,
            ecchi: esEcchi,

            apiSlug: apiAnime.slug,
            fromApi: true,
            apiUrl: apiAnime.url
        };
    }

    // ------------------------------------------------------------
    // Fusiona nuevos animes con window.animes evitando duplicados
    // ------------------------------------------------------------
    function fusionarConAnimes(nuevas) {
        if (typeof window.animes === 'undefined') {
            console.warn('[api-bridge-hentai] `animes` no existe todavía.');
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

        console.log(`[api-bridge-hentai] Añadidos ${filtradas.length} animes de HentaiLa. Total global: ${window.animes.length}`);
        return true;
    }

    // ------------------------------------------------------------
    // Refresca la UI (mismas funciones que en tu bridge original)
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
                console.log('[api-bridge-hentai] UI refrescada.');
            } catch (e) {
                console.error('[api-bridge-hentai] Error al refrescar UI:', e);
            }
        }, 150);
    }

    // ------------------------------------------------------------
    // Carga paginada de animes clásicos desde la API
    // ------------------------------------------------------------
    async function cargarAnimesAPI() {
        try {
            const todas = [];
            let page = 1;

            while (true) {
                const url = `${API}/animes?max_year=${MAX_YEAR}&page=${page}&limit=${LIMIT}`;
                console.log(`[api-bridge-hentai] Pidiendo ${url}`);

                const r = await fetch(url);
                if (!r.ok) throw new Error(`HTTP ${r.status} en página ${page}`);

                const data = await r.json();
                const items = data.animes || [];

                todas.push(...items);
                console.log(`[api-bridge-hentai] Página ${page}: ${items.length} animes (acumulado: ${todas.length}/${data.total})`);

                if (items.length < LIMIT) break;
                if (page >= data.paginas_totales) break;
                page++;

                await new Promise(res => setTimeout(res, PAUSA_ENTRE_PAGINAS));
            }

            if (!todas.length) {
                console.warn('[api-bridge-hentai] La API no devolvió animes.');
                return;
            }

            // Ordenar alfabéticamente por título
            todas.sort((a, b) => {
                const ta = (a.titulo || "").toLowerCase();
                const tb = (b.titulo || "").toLowerCase();
                return ta.localeCompare(tb, 'es');
            });

            const nuevas = todas.map((a, i) => apiAnimeAAnime(a, i));

            if (fusionarConAnimes(nuevas)) {
                refrescarUI();
            }
        } catch (e) {
            console.error('[api-bridge-hentai] Error al cargar animes de la API:', e);
        }
    }

    // ------------------------------------------------------------
    // Carga los episodios (con players) de un anime concreto
    // Se llama cuando el usuario abre un anime de la API
    // ------------------------------------------------------------
    async function cargarEpisodiosDeAnime(apiSlug) {
        if (!apiSlug) return [];
        if (window.__hentaiEpisodios[apiSlug]) {
            return window.__hentaiEpisodios[apiSlug];
        }

        try {
            const r = await fetch(`${API}/animes/${encodeURIComponent(apiSlug)}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();

            window.__hentaiEpisodios[apiSlug] = data.episodios || [];
            return window.__hentaiEpisodios[apiSlug];
        } catch (e) {
            console.error(`[api-bridge-hentai] Error cargando episodios de ${apiSlug}:`, e);
            return [];
        }
    }

    window.__cargarEpisodiosHentai = cargarEpisodiosDeAnime;

    // ------------------------------------------------------------
    // Espera a que `animes` exista antes de cargar
    // ------------------------------------------------------------
    function esperarAnimes(intentos = 20) {
        if (typeof window.animes !== 'undefined' && Array.isArray(window.animes)) {
            cargarAnimesAPI();
            return;
        }
        if (intentos <= 0) {
            console.error('[api-bridge-hentai] `animes` nunca apareció.');
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
