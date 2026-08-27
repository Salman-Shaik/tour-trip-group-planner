import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseDatabaseDocument,writeDatabase } from "../lib/db.ts";

async function main(){
  if(process.env.ROAMLY_DB_BACKEND?.toLowerCase()!=="firestore")throw new Error("Set ROAMLY_DB_BACKEND=firestore before running this migration.");
  const source=path.resolve(process.argv[2]??"data/db.json");const database=parseDatabaseDocument(JSON.parse(await readFile(source,"utf8")));
  if(!process.argv.includes("--confirm"))throw new Error(`This replaces the Firestore database document with ${source}. Re-run with --confirm.`);
  await writeDatabase(database);console.log(`Migrated ${database.trips.length} trips and ${database.participants.length} participants from ${source} into Firestore entity collections.`);
}
main().catch((error)=>{console.error(error);process.exitCode=1;});
