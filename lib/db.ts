import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "db.json");
const temporaryPath = path.join(dataDirectory, "db.tmp.json");
let writeQueue: Promise<void> = Promise.resolve();

export function emptyDatabase(): Database {
  return { users:[], trips:[], participants:[], listings:[], amenities:[], listingAmenities:[], votes:[], comments:[], preferences:[], participantPreferences:[] };
}

function normalizeDatabase(value:Partial<Database>):Database {
  return { ...emptyDatabase(), ...value, users:value.users ?? [], trips:(value.trips ?? []).map((trip) => ({ ...trip, creatorUserId:trip.creatorUserId ?? null, creatorTokenHash:trip.creatorTokenHash ?? "", status:trip.status ?? "ACTIVE", completedAt:trip.completedAt ?? null })) };
}

const requiredRecordFields:Record<keyof Database,readonly string[]>={
  users:["id","googleSubject","email","name","imageUrl","createdAt","updatedAt"],
  trips:["id","inviteCode","name","destination","startDate","endDate","travellerCount","accommodationBudget","currency","selectedListingId","createdAt","updatedAt"],
  participants:["id","tripId","name","sessionHash","createdAt","updatedAt"],
  listings:["id","tripId","url","platform","propertyName","imageUrl","totalPrice","currency","maxGuests","bedrooms","beds","bathrooms","rating","reviewCount","location","distanceNote","notes","tags","createdAt","updatedAt"],
  amenities:["id","key","label"],
  listingAmenities:["listingId","amenityId"],
  votes:["id","participantId","listingId","value","createdAt","updatedAt"],
  comments:["id","participantId","listingId","body","createdAt","updatedAt"],
  preferences:["id","key","label","description","createdAt"],
  participantPreferences:["participantId","preferenceId","importance","createdAt","updatedAt"],
};

export function parseDatabaseDocument(value:unknown):Database {
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Database JSON must be an object.");
  const record=value as Record<string,unknown>;const required=Object.keys(emptyDatabase()) as Array<keyof Database>;
  for(const key of required){
    const entries=record[key];
    if(entries===undefined)continue;
    if(!Array.isArray(entries))throw new Error(`Database field "${key}" must be an array.`);
    entries.forEach((entry,index)=>{
      const location=`${key}[${index}]`;
      if(!entry||typeof entry!=="object"||Array.isArray(entry))throw new Error(`Database entry "${location}" must be an object.`);
      const item=entry as Record<string,unknown>;
      for(const field of requiredRecordFields[key])if(!(field in item))throw new Error(`Database entry "${location}" is missing required field "${field}".`);
    });
  }
  return normalizeDatabase(record as Partial<Database>);
}

export async function readDatabase(): Promise<Database> {
  try {
    return parseDatabaseDocument(JSON.parse(await readFile(databasePath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyDatabase();
    throw error;
  }
}

export function writeDatabase(database: Database): Promise<void> {
  const write = async () => {
    await mkdir(dataDirectory, { recursive:true });
    await writeFile(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
    await rename(temporaryPath, databasePath);
  };
  writeQueue = writeQueue.then(write, write);
  return writeQueue;
}

export async function updateDatabase<T>(mutation: (database: Database) => T | Promise<T>): Promise<T> {
  let result!: T;
  const update = async () => {
    const database = await readDatabase();
    result = await mutation(database);
    await mkdir(dataDirectory, { recursive:true });
    await writeFile(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
    await rename(temporaryPath, databasePath);
  };
  writeQueue = writeQueue.then(update, update);
  await writeQueue;
  return result;
}

export async function findTripByInviteCode(inviteCode: string) {
  return (await readDatabase()).trips.find((trip) => trip.inviteCode === inviteCode) ?? null;
}
