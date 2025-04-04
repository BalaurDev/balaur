// kv_test.ts
try {
  console.log("Attempting to open Deno KV...");
  const kv = await Deno.openKv(); // Use default path
  console.log("Deno KV opened successfully.");
  await kv.close();
  console.log("Deno KV closed.");
  Deno.exit(0);
} catch (error) {
  console.error("Error accessing Deno.openKv:", error);
  Deno.exit(1);
} 