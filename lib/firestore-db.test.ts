import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  collectionGet: vi.fn(), legacyGet: vi.fn(), listDocuments: vi.fn(),
  writerSet: vi.fn(), writerDelete: vi.fn(), writerClose: vi.fn(),
  transactionGet: vi.fn(), transactionSet: vi.fn(), transactionDelete: vi.fn(),
  runTransaction: vi.fn(), entityDoc: vi.fn(),
}));

vi.mock("@google-cloud/firestore", () => ({
  Firestore: class {
    collection() {
      return { doc: () => ({
        _kind: "legacy",
        get: mocks.legacyGet,
        collection: (key: string) => ({
          _kind: "collection",
          _key: key,
          get: mocks.collectionGet,
          listDocuments: mocks.listDocuments,
          doc: mocks.entityDoc,
        }),
      }) };
    }
    bulkWriter() { return { set: mocks.writerSet, delete: mocks.writerDelete, close: mocks.writerClose }; }
    runTransaction(callback: (transaction: unknown) => unknown) { return mocks.runTransaction(callback); }
  },
}));

import { readFirestoreDatabase, updateFirestoreDatabase, writeFirestoreDatabase } from "@/lib/firestore-db";

const empty = (): Database => ({ users: [], trips: [], participants: [], listings: [], amenities: [], listingAmenities: [], votes: [], comments: [], preferences: [], participantPreferences: [] });
const parse = vi.fn((value: unknown) => value as Database);
const comment = { id: "c", participantId: "p", listingId: "l", body: "Hi", createdAt: "", updatedAt: "" };

describe("Firestore database adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collectionGet.mockResolvedValue({ docs: [] });
    mocks.legacyGet.mockResolvedValue({ exists: false, data: () => undefined });
    mocks.listDocuments.mockResolvedValue([]);
    mocks.entityDoc.mockImplementation((id: string) => ({ id }));
    mocks.writerClose.mockResolvedValue(undefined);
    mocks.transactionGet.mockImplementation(async (reference: { _kind?: string }) => reference._kind === "collection" ? { docs: [] } : { exists: false, data: () => undefined });
    mocks.runTransaction.mockImplementation(async (callback: (transaction: { get: typeof mocks.transactionGet; set: typeof mocks.transactionSet; delete: typeof mocks.transactionDelete }) => unknown) => callback({ get: mocks.transactionGet, set: mocks.transactionSet, delete: mocks.transactionDelete }));
  });

  it("returns an empty database when Firestore has not been initialized", async () => expect(await readFirestoreDatabase(parse, empty)).toEqual(empty()));

  it("reads records from entity collections", async () => {
    mocks.collectionGet.mockResolvedValueOnce({ docs: [{ data: () => ({ id: "u" }) }] });
    const result = await readFirestoreDatabase(parse, empty);
    expect(parse).toHaveBeenCalled();
    expect((result.users[0] as { id: string }).id).toBe("u");
  });

  it("falls back to the legacy database document", async () => {
    const database = empty();
    mocks.legacyGet.mockResolvedValue({ exists: true, data: () => database });
    expect(await readFirestoreDatabase(parse, empty)).toBe(database);
  });

  it("writes records as separate entity documents", async () => {
    const database = empty();
    database.comments.push(comment);
    await writeFirestoreDatabase(database);
    expect(mocks.writerSet).toHaveBeenCalledWith({ id: "c" }, comment);
    expect(mocks.writerClose).toHaveBeenCalled();
  });

  it("uses deterministic IDs for relationship records", async () => {
    const database = empty();
    database.listingAmenities.push({ listingId:"listing", amenityId:"wifi" });
    database.participantPreferences.push({ participantId:"participant", preferenceId:"price", importance:"IMPORTANT", createdAt:"", updatedAt:"" });
    await writeFirestoreDatabase(database);
    expect(mocks.entityDoc).toHaveBeenCalledWith("listing__wifi");
    expect(mocks.entityDoc).toHaveBeenCalledWith("participant__price");
  });

  it("rejects a record without a stable identifier", async () => {
    const database = empty();
    database.users.push({} as Database["users"][number]);
    await expect(writeFirestoreDatabase(database)).rejects.toThrow('record in "users" does not have a stable identifier');
  });

  it("removes stale documents during a complete import", async () => {
    mocks.listDocuments.mockResolvedValueOnce([{ id:"stale" }]);
    await writeFirestoreDatabase(empty());
    expect(mocks.writerDelete).toHaveBeenCalledWith({ id:"stale" });
  });

  it("writes only changed records in a transaction", async () => {
    const result = await updateFirestoreDatabase(parse, empty, (database) => { database.comments.push(comment); return "done"; });
    expect(result).toBe("done");
    expect(mocks.transactionSet).toHaveBeenCalledWith({ id: "c" }, comment);
  });

  it("deletes records removed by a mutation", async () => {
    mocks.transactionGet.mockImplementation(async (reference: { _kind?: string; _key?: string }) => reference._kind === "collection"
      ? { docs: reference._key === "comments" ? [{ data: () => comment }] : [] }
      : { exists: false, data: () => undefined });
    await updateFirestoreDatabase(parse, empty, (database) => { database.users = []; database.trips = []; database.participants = []; database.listings = []; database.amenities = []; database.listingAmenities = []; database.votes = []; database.comments = []; database.preferences = []; database.participantPreferences = []; });
    expect(mocks.transactionDelete).toHaveBeenCalledWith({ id: "c" });
  });

  it("does not rewrite an unchanged record", async () => {
    mocks.transactionGet.mockImplementation(async (reference: { _kind?: string; _key?: string }) => reference._kind === "collection"
      ? { docs: reference._key === "comments" ? [{ data: () => comment }] : [] }
      : { exists: false, data: () => undefined });
    await updateFirestoreDatabase(parse, empty, () => undefined);
    expect(mocks.transactionSet).not.toHaveBeenCalled();
    expect(mocks.transactionDelete).not.toHaveBeenCalled();
  });
});
