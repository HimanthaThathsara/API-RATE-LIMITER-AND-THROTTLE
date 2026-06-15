export const DEFAULT_HEADERS = {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
};

export function getIP(req: any): string {
    return (
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        'unknown'
    );
}
