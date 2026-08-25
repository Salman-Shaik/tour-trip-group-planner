import { access } from "node:fs/promises";
import path from "node:path";
import { emptyDatabase,writeDatabase } from "../lib/db.ts";

const databasePath=path.join(process.cwd(),"data","db.json");

async function main(){
  try{
    await access(databasePath);
    console.log("Database already exists; leaving data/db.json unchanged.");
  }catch(error){
    if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
    await writeDatabase(emptyDatabase());
    console.log("Created an empty database at data/db.json.");
  }
}

main().catch((error)=>{console.error("Could not initialize the JSON database.",error);process.exitCode=1;});
