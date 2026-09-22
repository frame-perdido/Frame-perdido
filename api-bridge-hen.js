// ============================================================
// ahen — Frame Perdido
// ============================================================

(function () {
    'use strict';

    const API = "https://hen-api.onrender.com";
    const ID_BASE = 50000;
    const LIMIT = 100;
    const MAX_YEAR = 2008;
    const PAUSA_ENTRE_PAGINAS = 300;

    window.__apiSlugs = window.__apiSlugs || {};
    window.__hentaiEpisodios = window.__hentaiEpisodios || {};

    function apiAnimeAAnime(apiAnime, indice) {
        const id = ID_BASE + indice;

        window.__apiSlugs[id] = apiAnime.slug;

        const generosLower = (apiAnime.generos || []).map(g => g.toLowerCase());
        const esHentai = true;
        const esEcchi = generosLower.some(g =>
            g.includes('ecchi') || g.includes('softcore')
        );

        const tags = [...new Set(generosLower.map(g => g.trim()).filter(Boolean))];

        return {
            id: id,
            title: apiAnime.titulo || "Sin título",
            cover: apiAnime.portada || "",
            year: apiAnime.año || "—",
            type: apiAnime.tipo || "OVA",
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

        console.log(`[api-bridge-hentai] Añadidos ${filtradas.length} animes. Total global: ${window.animes.length}`);
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
                console.log('[api-bridge-hentai] UI refrescada.');
            } catch (e) {
                console.error('[api-bridge-hentai] Error al refrescar UI:', e);
            }
        }, 150);
    }

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
                console.log(`[api-bridge-hentai] Página ${page}: ${items.length} (acumulado: ${todas.length}/${data.total})`);

                if (items.length < LIMIT) break;
                if (page >= data.paginas_totales) break;
                page++;

                await new Promise(res => setTimeout(res, PAUSA_ENTRE_PAGINAS));
            }

            if (!todas.length) {
                console.warn('[api-bridge-hentai] La API no devolvió animes.');
                return;
            }

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
            console.error('[api-bridge-hentai] Error al cargar animes:', e);
        }
    }

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
            console.error(`[api-bridge-hentai] Error cargando episodios:`, e);
            return [];
        }
    }

    window.__cargarEpisodiosHentai = cargarEpisodiosDeAnime;

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => esperarAnimes());
    } else {
        esperarAnimes();
    }

})();
