import "dotenv/config";
import { db, queryClient, categories, articles } from "../db/client.js";

async function run() {
  const [cat] = await db
    .insert(categories)
    .values({ name: "Electrodomesticos", description: "Test", imageUrl: "http://x.com/img.jpg" })
    .returning();
  console.log("[OK] INSERT category →", cat.id, cat.name);

  const [art] = await db
    .insert(articles)
    .values({ name: "Lavadora", description: "Samsung 10kg", imageUrl: "http://x.com/img.jpg", categoryId: cat.id, stock: 1 })
    .returning();
  console.log("[OK] INSERT article  →", art.id, art.name);

  const rows = await db.select().from(articles);
  console.log("[OK] SELECT articles →", rows.length, "row(s)");

  await db.delete(articles);
  await db.delete(categories);
  console.log("[OK] CLEANUP done");
  console.log("\n✓ Smoke test PASSED");
}

run()
  .catch((e) => { console.error("FAILED:", e.message); process.exitCode = 1; })
  .finally(() => queryClient.end());
