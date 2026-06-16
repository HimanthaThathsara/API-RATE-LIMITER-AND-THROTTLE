# API Rate Limiter & Throttle

A compact, configurable Node.js toolkit for API rate limiting and throttling.
Supports multiple algorithms, pluggable storage (in-memory + Redis), and an
Express middleware adapter with production-friendly headers and hooks.

## About

This project provides a single, well-documented npm package that ships
multiple rate-limiting algorithms behind a common interface. It is designed to
work for single-node apps (in-memory) and distributed deployments (Redis).

Key goals:
- Easy middleware integration for Express (expandable to Fastify/Koa)
- Pluggable key generation (IP / user / API key / custom header)
- Observable responses via `RateLimit-*` and `Retry-After` headers
- Flexible hooks for logging, alerts, CAPTCHA, or ban actions

## Features

- Algorithms: Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log,
  Sliding Window Counter (additional algorithms can be added)
- Storage adapters: In-memory and Redis (atomic checks via Lua can be added)
- Per-route and per-method configuration
- Configurable response body, status code, and headers
- Hooks: `onAllowed`, `onBlocked`, `onLimitExceeded` for custom integrations

## Configuration options (recommended)

- `algorithm` — 'token-bucket' | 'sliding-window' | 'fixed-window' | ...
- `limit` — maximum requests for the window
- `windowMs` — window length in milliseconds
- `capacity` / `refillRate` — token-bucket specific options
- `keyGenerator(req)` — function to derive the limiter key (IP, user id, api key)
- `store` — memory or redis client / adapter
- `failOpen` — boolean: allow requests when store is unavailable
- `headers` — enable `RateLimit-*` / legacy `X-RateLimit-*`
- `responseBody` — function to build JSON error payload
- `onLimitExceeded(req, result)` — hook for alerts, caps, or external bans

Defaults should be simple (limit, windowMs) with advanced options opt-in.

## Quickstart

Install and start Redis (if using Redis store):

```bash
npm install
# On Debian/Ubuntu
sudo apt update && sudo apt install redis-server
sudo systemctl start redis-server
redis-cli ping # should print PONG
```

Run the example app:

```bash
node index.js
# Visit http://localhost:3000
```

Use `curl -i` to inspect headers on a rate-limited route.

## Development & Running

For local development the project supports the standard Node workflow. For more
complex integration (end-to-end, multi-service), a Docker-compose setup is
recommended.

Example: start local development services with Docker Compose:

```bash
docker-compose -f ./docker-compose.Development.Infrastructure.yaml up -d
```

Or start individual dev services as needed (e.g., Redis via Docker).

## Tests

Unit and integration tests are expected. Add and run tests with your preferred
test runner (e.g., `npm test`).

## Contributing

The project welcomes contributions. Please follow these steps before opening a
PR:

1. Read the `CONTRIBUTING.md` guide (if present) and the project coding style.
2. Open an issue first to discuss large changes or new algorithms.
3. Fork the repo, create a feature branch, and write tests for new behavior.
4. Keep commits small and descriptive; follow the repo's commit message style.
5. Submit a pull request and link it to the issue; maintainers will review it.

Reporting security vulnerabilities: do not post details in public issues —
contact the maintainers directly.

## License

This repository includes work under the repository license. See the `LICENSE` file
for full details.

## Authors & Acknowledgements

This project is inspired by several community projects and patterns. Thanks to
the open-source projects and authors whose ideas shaped this toolkit.

