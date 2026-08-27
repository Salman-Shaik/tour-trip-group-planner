import { Firestore, type DocumentData, type Transaction } from "@google-cloud/firestore";
import type { Database } from "@/lib/types";

type DatabaseKey = keyof Database;
type DatabaseRecord = Database[DatabaseKey][number];

const databaseKeys: DatabaseKey[] = [
  "users", "trips", "participants", "listings", "amenities",
  "listingAmenities", "votes", "comments", "preferences", "participantPreferences",
];

let client: Firestore | undefined;
const firestore = () => client ??= new Firestore(process.env.GOOGLE_CLOUD_PROJECT ? { projectId: process.env.GOOGLE_CLOUD_PROJECT } : undefined);
const namespace = () => firestore().collection(process.env.ROAMLY_FIRESTORE_COLLECTION?.trim() || "roamly_internal").doc("database");
const entityCollection = (key: DatabaseKey) => namespace().collection(key);

function recordId(key: DatabaseKey, value: DatabaseRecord): string {
  const record = value as unknown as Record<string, string>;
  if (record.id) return record.id;
  if (key === "listingAmenities") return `${record.listingId}__${record.amenityId}`;
  if (key === "participantPreferences") return `${record.participantId}__${record.preferenceId}`;
  throw new Error(`A Firestore record in "${key}" does not have a stable identifier.`);
}

async function readCollections(get: (key: DatabaseKey) => Promise<{ docs: Array<{ data(): DocumentData }> }>): Promise<Partial<Database>> {
  const entries = await Promise.all(databaseKeys.map(async (key) => [key, (await get(key)).docs.map((document) => document.data())] as const));
  return Object.fromEntries(entries) as Partial<Database>;
}

export async function readFirestoreDatabase(parse: (value: unknown) => Database, empty: () => Database) {
  const value = await readCollections((key) => entityCollection(key).get());
  if (databaseKeys.some((key) => value[key]?.length)) return parse(value);

  // Compatibility with the original adapter, which stored all arrays in one document.
  const legacy = await namespace().get();
  return legacy.exists ? parse(legacy.data()) : empty();
}

export async function writeFirestoreDatabase(database: Database) {
  const writer = firestore().bulkWriter();
  for (const key of databaseKeys) {
    const existing = await entityCollection(key).listDocuments();
    const desired = new Set(database[key].map((record) => recordId(key, record)));
    for (const reference of existing) if (!desired.has(reference.id)) writer.delete(reference);
    for (const record of database[key]) writer.set(entityCollection(key).doc(recordId(key, record)), record);
  }
  await writer.close();
}

function documentsById(key: DatabaseKey, records: Database[DatabaseKey]) {
  return new Map(records.map((record) => [recordId(key, record), record]));
}

export async function updateFirestoreDatabase<T>(
  parse: (value: unknown) => Database,
  empty: () => Database,
  mutation: (database: Database) => T | Promise<T>,
) {
  return firestore().runTransaction(async (transaction: Transaction) => {
    const originalValue = await readCollections((key) => transaction.get(entityCollection(key)));
    let database: Database;
    if (databaseKeys.some((key) => originalValue[key]?.length)) database = parse(originalValue);
    else {
      const legacy = await transaction.get(namespace());
      database = legacy.exists ? parse(legacy.data()) : empty();
    }

    const original = structuredClone(database);
    const result = await mutation(database);
    for (const key of databaseKeys) {
      const before = documentsById(key, original[key]);
      const after = documentsById(key, database[key]);
      for (const [id, record] of after) {
        if (JSON.stringify(before.get(id)) !== JSON.stringify(record)) transaction.set(entityCollection(key).doc(id), record);
      }
      for (const id of before.keys()) if (!after.has(id)) transaction.delete(entityCollection(key).doc(id));
    }
    return result;
  });
}
