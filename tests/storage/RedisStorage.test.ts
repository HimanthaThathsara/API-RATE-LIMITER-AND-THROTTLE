import {RedisStorage} from "../../src/storage/RedisStorage";

/**
 * Redis Storage Tests
 * NOTE: These tests require a Redis instance running on localhost:6379
 * Uncomment and run when Redis is available
 */

describe("RedisStorage", () => {
  let storage: RedisStorage;
  let mockRedisClient: any;

  beforeEach(() => {
    // Mock Redis client
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    };

    storage = new RedisStorage(mockRedisClient);
  });

  describe("constructor", () => {
    it("should throw when no client provided", () => {
      expect(() => new RedisStorage(null)).toThrow("Redis client is required");
    });
  });

  describe("setTokens", () => {
    it("should set tokens without TTL", async () => {
      mockRedisClient.set.mockResolvedValue("OK");

      await storage.setTokens("key-1", 10);

      expect(mockRedisClient.set).toHaveBeenCalledWith("key-1", "10");
    });

    it("should set tokens with TTL", async () => {
      mockRedisClient.setex.mockResolvedValue("OK");

      await storage.setTokens("key-2", 10, 5000);

      expect(mockRedisClient.setex).toHaveBeenCalledWith("key-2", 5, "10");
    });
  });

  describe("getTokens", () => {
    it("should get tokens from Redis", async () => {
      mockRedisClient.get.mockResolvedValue("10");

      const tokens = await storage.getTokens("key-3");

      expect(tokens).toBe(10);
      expect(mockRedisClient.get).toHaveBeenCalledWith("key-3");
    });

    it("should throw when key not found", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await expect(storage.getTokens("non-existent")).rejects.toThrow("Key not found");
    });

    it("should throw on invalid token value", async () => {
      mockRedisClient.get.mockResolvedValue("not-a-number");

      await expect(storage.getTokens("invalid")).rejects.toThrow("Invalid token value");
    });
  });

  describe("exists", () => {
    it("should return true when key exists", async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const exists = await storage.exists("key-4");

      expect(exists).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith("key-4");
    });

    it("should return false when key does not exist", async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const exists = await storage.exists("non-existent-2");

      expect(exists).toBe(false);
    });
  });

  describe("deleteKey", () => {
    it("should delete key from Redis", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await storage.deleteKey("key-5");

      expect(mockRedisClient.del).toHaveBeenCalledWith("key-5");
    });
  });
});
