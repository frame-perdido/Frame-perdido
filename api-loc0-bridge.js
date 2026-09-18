// ============================================================
// api-loc0-bridge.js
// Trae videos de Locomotion, agrupa por serie, saca portada de Jikan
// ============================================================

(function () {
    'use strict';

    const API_LOCO = "https://loc0api.onrender.com";
    const ID_BASE = 20000;

    // ------------------------------------------------------------
    // LISTA MAESTRA DE SERIES (57)
    // ------------------------------------------------------------
    const SERIES = [
        "Aeon Flux",
        "AIKa",
        "Alexander Senki",
        "Arjuna",
        "Tetsuwan Birdy",
        "Blue Seed",
        "Blue Submarine No. 6",
        "Bob y Margaret",
        "Boogiepop Phantom",
        "Bubblegum Crisis Tokyo 2040",
        "Burn Up Express",
        "Burn Up W",
        "CUTTLAS",
        "Candidate for Goddess",
        "Those Who Hunt Elves",
        "Cowboy Bebop",
        "Cyber Team in Akihabara",
        "Cybuster",
        "Dirty Pair",
        "Duckman",
        "EX Driver",
        "Eat-Man",
        "Eat-Man '98",
        "Red Baron",
        "The Critic",
        "Gasaraki",
        "Geneshaft",
        "Gogs",
        "Gunsmith Cats",
        "Initial D",
        "The Legend of Ellcia",
        "Labyrinth of Flames",
        "Let's Dance with Papa",
        "Lupin III",
        "Aa! Megami-sama",
        "Neo Ranga",
        "Neon Genesis Evangelion",
        "Nightwalker",
        "Ninja Resurrection",
        "Oh My Goddess",
        "Petshop of Horrors",
        "Quads",
        "The Ren & Stimpy Show",
        "Robotech",
        "Saber Marionette J",
        "Saber Marionette J to X",
        "Saber Marionette R",
        "Sakura Diaries",
        "Serial Experiments Lain",
        "Silent Mobius",
        "Soul Hunter",
        "South Park",
        "Tenamonya Voyagers",
        "The Maxx",
        "Villas Crapston",
        "Virgin Fleet",
        "If I See You in My Dreams"
    ];

    window.__apiSlugs = window.__apiSlugs || {};
    window.__locoEpisodios = window.__locoEpisodios || {};

    // ------------------------------------------------------------
    function norm(s) {
        return String(s || "").toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }

    // ------------------------------------------------------------
    function encontrarSerie(tituloVideo) {
        const tNorm = norm(tituloVideo);
        let mejor = null;

        for (const serie of SERIES) {
            const sNorm = norm(serie);
            if (!sNorm) continue;
            if (tNorm.startsWith(sNorm)) {
                if (!mejor || serie.length > mejor.length) {
                    mejor = serie;
                }
            }
        }
        return mejor;
    }

    function extraerNumero(titulo, serie) {
        const resto = titulo.slice(serie.length).trim();
        const m = resto.match(/\d+/);
        return m ? parseInt(m[0]) : 1;
    }

    function extraerTituloEp(titulo, serie) {
        const resto = titulo.slice(serie.length).trim();
        const m = resto.match(/\d+\s*[-–:]?\s*(.+)/);
        return m ? m[1].trim() : "";
    }

    // ------------------------------------------------------------
    // Buscar portada en Jikan (MyAnimeList)
    // ------------------------------------------------------------
    async function buscarPortada(titulo) {
        try {
            const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(titulo)}&limit=1`;
            const r = await fetch(url);
            if (!r.ok) return "";
            const data = await r.json();
            const img = data?.data?.[0]?.images?.jpg?.large_image_url
                     || data?.data?.[0]?.images?.jpg?.image_url
                     || "";
            return img;
        } catch (e) {
            console.warn(`[loc0-bridge] Sin portada para "${titulo}"`);
            return "";
        }
    }

    // ------------------------------------------------------------
    // Buscar todas las portadas (con pausa para no saturar Jikan)
    // ------------------------------------------------------------
    async function cargarPortadas(series) {
        const portadas = {};
        for (const s of series) {
            portadas[s] = await buscarPortada(s);
            // Pausa de 400ms entre peticiones (Jikan permite 3/segundo)
            await new Promise(r => setTimeout(r, 400));
        }
        console.log(`[loc0-bridge] Portadas cargadas: ${Object.values(portadas).filter(Boolean).length}/${series.length}`);
        return portadas;
    }

    // ------------------------------------------------------------
    function grupoAAnime(serie, videos, indice, portada) {
        const id = ID_BASE + indice;
        const slug = "loco-" + norm(serie).slice(0, 50);

        window.__apiSlugs[id] = slug;

        videos.sort((a, b) => a.num - b.num);

        const episodios = videos.map(v => ({
            num: v.num,
            version: "Episodio",
            url: v.url,
            titulo: v.tituloEp
        }));

        window.__locoEpisodios[id] = episodios;

        return {
            id: id,
            title: serie,
            cover: portada || "",
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

            const grupos = {};
            let sinClasificar = 0;

            videos.forEach(v => {
                const titulo = v.title || "";
                const serie = encontrarSerie(titulo);

                if (!serie) {
                    sinClasificar++;
                    return;
                }

                if (!grupos[serie]) grupos[serie] = [];

                grupos[serie].push({
                    num: extraerNumero(titulo, serie),
                    tituloEp: extraerTituloEp(titulo, serie),
                    url: v.url
                });
            });

            console.log(`[loc0-bridge] ${Object.keys(grupos).length} series agrupadas`);
            console.log(`[loc0-bridge] ${sinClasificar} videos sin clasificar`);

            const series = Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'es'));

            // Buscar portadas en Jikan
            console.log(`[loc0-bridge] Buscando portadas en Jikan...`);
            const portadas = await cargarPortadas(series);

            // Crear animes
            const nuevas = series.map((s, i) => grupoAAnime(s, grupos[s], i, portadas[s]));

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
