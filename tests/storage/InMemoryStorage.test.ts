import {InMemoryStorage} from "../../src/storage/InMemoryStorage";

describe("InMemoryStorage", () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  describe("setTokens and getTokens", () => {
    it("should store and retrieve tokens", async () => {
      await storage.setTokens("key-1", 10);
      const tokens = await storage.getTokens("key-1");
      expect(tokens).toBe(10);
    });

    it("should throw when getting non-existent key", async () => {
      await expect(storage.getTokens("non-existent")).rejects.toThrow("Key not found");
    });

    it("should update existing tokens", async () => {
      await storage.setTokens("key-2", 10);
      await storage.setTokens("key-2", 5);
      const tokens = await storage.getTokens("key-2");
      expect(tokens).toBe(5);
    });
  });

  describe("exists", () => {
    it("should return true for existing key", async () => {
      await storage.setTokens("key-3", 10);
      const exists = await storage.exists("key-3");
      expect(exists).toBe(true);
    });

    it("should return false for non-existent key", async () => {
      const exists = await storage.exists("non-existent-2");
      expect(exists).toBe(false);
    });
  });

  describe("deleteKey", () => {
    it("should delete key from storage", async () => {
      await storage.setTokens("key-4", 10);
      await storage.deleteKey("key-4");
      const exists = await storage.exists("key-4");
      expect(exists).toBe(false);
    });
  });

  describe("TTL/Expiration", () => {
    it("should expire keys with TTL", async (done) => {
      await storage.setTokens("key-5", 10, 100); // 100ms TTL

      setTimeout(async () => {
        const exists = await storage.exists("key-5");
        expect(exists).toBe(false);
        done();
      }, 150);
    });

    it("should throw when accessing expired key", async (done) => {
      await storage.setTokens("key-6", 10, 100);

      setTimeout(async () => {
        await expect(storage.getTokens("key-6")).rejects.toThrow("Key expired");
        done();
      }, 150);
    });
  });

  describe("clear", () => {
    it("should clear all data", async () => {
      await storage.setTokens("key-7", 10);
      await storage.setTokens("key-8", 20);
      await storage.clear();

      expect(await storage.exists("key-7")).toBe(false);
      expect(await storage.exists("key-8")).toBe(false);
    });
  });

  describe("getSize", () => {
    it("should return correct store size", async () => {
      expect(storage.getSize()).toBe(0);

      await storage.setTokens("key-9", 10);
      expect(storage.getSize()).toBe(1);

      await storage.setTokens("key-10", 20);
      expect(storage.getSize()).toBe(2);

      await storage.deleteKey("key-9");
      expect(storage.getSize()).toBe(1);
    });
  });
});
