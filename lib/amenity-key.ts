import { createHash } from "node:crypto";
export function amenityKey(label:string){const slug=label.normalize("NFKC").toLocaleLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/(^-|-$)/g,"");return slug||`amenity-${createHash("sha256").update(label).digest("hex").slice(0,16)}`;}
