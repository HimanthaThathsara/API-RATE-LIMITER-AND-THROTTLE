import {TokenBucketRateLimiter} from "../src/TokenBucketRateLimiter";
import {InMemoryStorage} from "../src/storage/InMemoryStorage";

describe("TokenBucketRateLimiter", () => {
  let limiter: TokenBucketRateLimiter;
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
    limiter = new TokenBucketRateLimiter({
      capacity: 10,
      refillRate: 5,
      refillInterval: 1000,
      storage,
    });
  });

  afterEach(() => {
    limiter.destroy();
  });

  describe("checkLimit", () => {
    it("should allow requests within capacity", async () => {
      const result = await limiter.checkLimit("test-key", 1);
      expect(result.allowed).toBe(true);
      expect(result.tokensRemaining).toBe(9);
    });

    it("should block requests exceeding capacity", async () => {
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit("test-key-2", 1);
      }

      // This request should be blocked
      const result = await limiter.checkLimit("test-key-2", 1);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it("should allow consuming multiple tokens at once", async () => {
      const result = await limiter.checkLimit("test-key-3", 5);
      expect(result.allowed).toBe(true);
      expect(result.tokensRemaining).toBe(5);
    });

    it("should throw on invalid token requirement", async () => {
      await expect(limiter.checkLimit("test-key", 0)).rejects.toThrow();
    });

    it("should calculate correct retry-after time", async () => {
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit("test-key-4", 1);
      }

      const result = await limiter.checkLimit("test-key-4", 5);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe("getTokenCount", () => {
    it("should return capacity for new key", async () => {
      const count = await limiter.getTokenCount("new-key");
      expect(count).toBe(10);
    });

    it("should return reduced count after consumption", async () => {
      await limiter.checkLimit("test-key-5", 3);
      const count = await limiter.getTokenCount("test-key-5");
      expect(count).toBe(7);
    });
  });

  describe("reset", () => {
    it("should reset tokens to capacity", async () => {
      await limiter.checkLimit("test-key-6", 7);
      await limiter.reset("test-key-6");
      const count = await limiter.getTokenCount("test-key-6");
      expect(count).toBe(10);
    });
  });

  describe("constructor validation", () => {
    it("should throw on invalid capacity", () => {
      expect(
        () =>
          new TokenBucketRateLimiter({
            capacity: 0,
            refillRate: 1,
            refillInterval: 1000,
            storage,
          })
      ).toThrow("Capacity must be greater than 0");
    });

    it("should throw on invalid refillRate", () => {
      expect(
        () =>
          new TokenBucketRateLimiter({
            capacity: 10,
            refillRate: 0,
            refillInterval: 1000,
            storage,
          })
      ).toThrow("Refill rate must be greater than 0");
    });

    it("should throw on invalid refillInterval", () => {
      expect(
        () =>
          new TokenBucketRateLimiter({
            capacity: 10,
            refillRate: 1,
            refillInterval: 0,
            storage,
          })
      ).toThrow("Refill interval must be greater than 0");
    });
  });
});
