import { access,readFile } from "node:fs/promises";
import path from "node:path";
import { emptyDatabase,parseDatabaseDocument,readDatabase,writeDatabase } from "../lib/db.ts";

const databasePath=path.join(process.cwd(),"data","db.json");

async function main(){
  if(process.env.ROAMLY_DB_BACKEND?.toLowerCase()==="firestore"){await readDatabase();console.log("Firestore database connection verified; initialization is managed through the migration command.");return;}
  try{
    await access(databasePath);
    console.log("Database already exists; leaving data/db.json unchanged.");
  }catch(error){
    if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
    const importPath=process.env.ROAMLY_DB_IMPORT_PATH?.trim();
    if(importPath){const source=path.resolve(importPath);const imported=parseDatabaseDocument(JSON.parse(await readFile(source,"utf8")));await writeDatabase(imported);console.log(`Initialized data/db.json from ${source}.`);}
    else{await writeDatabase(emptyDatabase());console.log("No database JSON was provided; created the default empty template at data/db.json.");}
  }
}

main().catch((error)=>{console.error("Could not initialize the JSON database.",error);process.exitCode=1;});
