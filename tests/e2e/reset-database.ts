import { execFileSync } from "node:child_process";

export function resetTestDatabase(){
  execFileSync(process.execPath,["--no-warnings","--experimental-strip-types","scripts/seed.ts"],{cwd:process.cwd(),stdio:"pipe",env:{...process.env,ROAMLY_DB_BACKEND:"json"}});
}
