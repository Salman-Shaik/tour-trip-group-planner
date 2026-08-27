import { afterEach,describe,expect,it,vi } from "vitest";

const mocks=vi.hoisted(()=>({read:vi.fn(),write:vi.fn(),update:vi.fn()}));
vi.mock("@/lib/firestore-db",()=>({readFirestoreDatabase:mocks.read,writeFirestoreDatabase:mocks.write,updateFirestoreDatabase:mocks.update}));
import { emptyDatabase,readDatabase,updateDatabase,writeDatabase } from "@/lib/db";

describe("database backend selection",()=>{
  afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks()});
  it("delegates reads to Firestore when selected",async()=>{vi.stubEnv("ROAMLY_DB_BACKEND","FiReStOrE");const database=emptyDatabase();mocks.read.mockResolvedValue(database);expect(await readDatabase()).toBe(database);expect(mocks.read).toHaveBeenCalledWith(expect.any(Function),emptyDatabase)});
  it("delegates writes to Firestore when selected",async()=>{vi.stubEnv("ROAMLY_DB_BACKEND","firestore");const database=emptyDatabase();mocks.write.mockResolvedValue(undefined);await writeDatabase(database);expect(mocks.write).toHaveBeenCalledWith(database)});
  it("delegates transactional mutations to Firestore",async()=>{vi.stubEnv("ROAMLY_DB_BACKEND","firestore");const mutation=vi.fn();mocks.update.mockResolvedValue("result");expect(await updateDatabase(mutation)).toBe("result");expect(mocks.update).toHaveBeenCalledWith(expect.any(Function),emptyDatabase,mutation)});
});
