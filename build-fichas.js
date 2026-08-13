const fs = require('fs');
const path = require('path');

console.log('🚀 Generando páginas de fichas...');

// Leer data.js
const dataContent = fs.readFileSync('./data.js', 'utf8');
const match = dataContent.match(/const\s+animes\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
  console.error('❌ No se encontró el array "animes" en data.js');
  process.exit(1);
}
const animes = eval(match[1]);
console.log(`📚 Cargados ${animes.length} animes`);

// Leer template
const template = fs.readFileSync('./template-ficha.html', 'utf8');

// Crear carpeta
const outputDir = './expediente';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generar páginas
let sitemapEntries = [];

animes.forEach(anime => {
  const schemaType = anime.type === 'Película' ? 'Movie' : 'TVSeries';
  const durationNum = parseInt(anime.duration) || 0;
  const durationISO = durationNum ? `PT${durationNum}M` : '';
  
  const genreTags = (anime.genre || []).map(g => `<span class="tag">${g}</span>`).join('');
  const genreArray = JSON.stringify(anime.genre || []);
  const genreList = (anime.genre || []).join(', ');
  
  let relatedLinks = '';
  if (anime.related && anime.related.length > 0) {
    relatedLinks = anime.related
      .map(relId => {
        const rel = animes.find(a => a.id === relId);
        if (!rel) return '';
        return `
          <a href="${rel.id}.html" class="related-card">
            <strong>${rel.title}</strong><br>
            <small>${rel.year} · ${rel.type}</small>
          </a>
        `;
      })
      .filter(Boolean)
      .join('');
  }
  
  let html = template
    .replace(/{{ID}}/g, anime.id)
    .replace(/{{TITLE}}/g, anime.title)
    .replace(/{{YEAR}}/g, anime.year)
    .replace(/{{DESCRIPTION}}/g, (anime.description || ''))
    .replace(/{{PLOT}}/g, (anime.plot || 'Sin información disponible.'))
    .replace(/{{ANALYSIS}}/g, (anime.analysis || 'Sin información disponible.'))
    .replace(/{{COVER}}/g, (anime.cover || ''))
    .replace(/{{TYPE}}/g, (anime.type || ''))
    .replace(/{{DURATION}}/g, (anime.duration || ''))
    .replace(/{{DURATION_ISO}}/g, durationISO)
    .replace(/{{STUDIO}}/g, (anime.studio || ''))
    .replace(/{{DIRECTOR}}/g, (anime.director || ''))
    .replace(/{{SCHEMA_TYPE}}/g, schemaType)
    .replace(/{{GENRE_ARRAY}}/g, genreArray)
    .replace(/{{GENRE_TAGS}}/g, genreTags)
    .replace(/{{GENRE_LIST}}/g, genreList)
    .replace(/{{RELATED_LINKS}}/g, relatedLinks || '<p style="color:#5a5a6a;">No hay obras relacionadas.</p>');
  
  fs.writeFileSync(path.join(outputDir, `${anime.id}.html`), html);
  console.log(`✅ ${anime.id}.html → ${anime.title}`);
  
  sitemapEntries.push({
    loc: `https://frame-perdido.github.io/Frame-perdido/expediente/${anime.id}.html`,
    lastmod: new Date().toISOString().split('T')[0]
  });
});

// Sitemap
const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://frame-perdido.github.io/Frame-perdido/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${sitemapEntries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
fs.writeFileSync('./sitemap.xml', sitemapXML);
console.log(`\n🗺️  Sitemap: ${sitemapEntries.length} URLs`);

// Robots.txt
const robots = `User-agent: *
Allow: /
Sitemap: https://frame-perdido.github.io/Frame-perdido/sitemap.xml`;
fs.writeFileSync('./robots.txt', robots);
console.log('🤖 robots.txt creado');

console.log('\n✨ ¡TODO LISTO!');
