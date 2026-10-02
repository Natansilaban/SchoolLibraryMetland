const { searchCatalog } = require('./src/lib/search/catalog-search');

async function run() {
  const query = "Cariin buku tentang koding";
  console.log('Query:', query);
  const result = await searchCatalog({ query, limit: 100 });
  console.log(`Found ${result.total} results. Mode: ${result.mode}`);
  result.data.slice(0, 10).forEach((b) => {
    console.log(`- ${b.judul} | Score: ${b._relevance?.score} | SemScore: ${b._relevance?.semanticScore}`);
  });
}
run();
