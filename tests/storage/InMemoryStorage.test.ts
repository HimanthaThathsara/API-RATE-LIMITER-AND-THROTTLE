import { InMemoryStorage } from '../../src/storage/InMemoryStorage';

describe('InMemoryStorage', () => {
    let storage: InMemoryStorage;

    beforeEach(() => {
        storage = new InMemoryStorage(0);
    });

    afterEach(() => {
        storage.destroy();
    });

    it('should store and retrieve data', async () => {
        const key = 'test-key';
        const state = { tokens: 10, lastRefill: Date.now() };

        await storage.set(key, state);
        const retrieved = await storage.get(key);

        expect(retrieved).toEqual(state);
    });

    it('should return null for non-existent keys', async () => {
        const retrieved = await storage.get('non-existent');
        expect(retrieved).toBeNull();
    });

    it('should delete keys', async () => {
        const key = 'test-key';
        const state = { tokens: 10, lastRefill: Date.now() };

        await storage.set(key, state);
        await storage.delete(key);
        const retrieved = await storage.get(key);

        expect(retrieved).toBeNull();
    });
});
