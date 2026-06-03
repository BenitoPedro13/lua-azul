# Deploying Lua Azul (Railway)

> Per [ADR-0005](./adr/0005-deploy-railway-fly.md). The bot is a long-running process
> that holds a persistent gateway connection — it needs a host that runs a container
> 24/7 (not serverless). This guide uses **Railway**; a short **Fly.io** appendix is at
> the end.

## What you're deploying

Three services that talk over Railway's private network:

```
   bot  ──REST/WS──▶  Discord
    │
    ├──▶  lavalink   (audio node, private)
    └──▶  postgres   (managed, private)
```

| Service    | Source                          | Public? |
|------------|---------------------------------|---------|
| `postgres` | Railway PostgreSQL plugin       | no      |
| `lavalink` | `infra/lavalink/Dockerfile`     | no      |
| `bot`      | `apps/bot/Dockerfile`           | no      |

None of them need a public domain — the bot reaches Discord outbound, and it reaches
Lavalink/Postgres over the private network.

## Prerequisites

- The repo pushed to **GitHub**.
- A **Railway** account (railway.app) + the [Railway CLI](https://docs.railway.app/guides/cli)
  (`npm i -g @railway/cli`) for the one-off command registration.
- Your Discord **token** + **application ID**.

---

## Step 1 — Push to GitHub

```bash
git init                       # if not already a repo
git add -A && git commit -m "Lua Azul"
git branch -M main
git remote add origin git@github.com:<you>/lua-azul.git
git push -u origin main
```

> Make sure `.env` is **not** committed — it's already in `.gitignore`.

## Step 2 — Create the project + Postgres

1. Railway → **New Project** → **Deploy from GitHub repo** → pick `lua-azul`.
   (You'll fix the build settings in Step 4 — let it create the service for now.)
2. In the project → **+ New** → **Database** → **Add PostgreSQL**.
   Railway provisions it and exposes `DATABASE_URL` on that service.

## Step 3 — Deploy the Lavalink service

1. **+ New** → **GitHub Repo** → same repo (a second service from the same repo).
2. Open the service → **Settings**:
   - **Root Directory**: `infra/lavalink`
   - Railway auto-detects `infra/lavalink/Dockerfile`.
3. **Variables** (this service):
   | Variable | Value |
   |----------|-------|
   | `LAVALINK_SERVER_PASSWORD` | a strong random string (remember it) |
4. Deploy. First boot downloads the plugins (~30–60s). Logs should end with
   `Lavalink is ready to accept connections.`
5. Note this service's **private hostname**: Railway exposes it as
   `${{<service-name>.RAILWAY_PRIVATE_DOMAIN}}` — e.g. `lavalink.railway.internal`.
   You don't need a public domain here.

## Step 4 — Configure the bot service

Open the **bot** service (from Step 1) → **Settings**:

- **Build**: set **Dockerfile Path** to `apps/bot/Dockerfile`.
  (Root Directory stays the repo root `/` — the Dockerfile needs the whole workspace
  as build context.)
- **Deploy**: no start command needed — the Dockerfile's `CMD` already runs
  `prisma migrate deploy` and then boots the bot.

Then set **Variables** on the bot service:

| Variable | Value |
|----------|-------|
| `DISCORD_TOKEN` | your bot token |
| `DISCORD_CLIENT_ID` | your application ID |
| `DISCORD_DEV_GUILD_ID` | **leave unset** → commands register globally |
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference the Postgres service) |
| `LAVALINK_HOST` | `${{lavalink.RAILWAY_PRIVATE_DOMAIN}}` (your Lavalink service name) |
| `LAVALINK_PORT` | `2333` |
| `LAVALINK_PASSWORD` | **same** value as `LAVALINK_SERVER_PASSWORD` above |
| `LAVALINK_SECURE` | `false` |
| `LOGGING_ENABLED` | `false` (or `true` once privileged intents are on in the Portal) |

> The `${{ServiceName.VAR}}` syntax is Railway's variable reference — it wires services
> together without hardcoding secrets. Match the service names exactly.

Deploy. The bot logs should show `module loaded` lines, then `ready`, then
`lavalink node connected`.

## Step 5 — Register global commands (once)

Production uses **global** commands (no dev guild). Run the registration once from your
machine against the production app — it only needs the token + client id:

```bash
# from the repo root, with DISCORD_DEV_GUILD_ID empty so it goes global
DISCORD_DEV_GUILD_ID= DISCORD_TOKEN=<token> DISCORD_CLIENT_ID=<id> \
  pnpm --filter @lua-azul/bot exec tsx src/deploy-commands.ts
```

Or, if you prefer Railway's environment:

```bash
railway link            # select the project + bot service
railway run pnpm --filter @lua-azul/bot run deploy:commands
```

> Global commands take **up to ~1 hour** to appear in all servers (vs. instant for the
> dev guild). Re-run this only when command definitions change — not on every deploy.

## Step 6 — Verify

- Railway → bot service → **Logs**: look for `ready` and `lavalink node connected`.
- In Discord, the bot shows online. After propagation, `/play` works.
- Migrations: the bot runs `prisma migrate deploy` on each boot, so the schema is always
  applied. Check the **Postgres** service's data tab if you want to confirm tables.

## Redeploys & updates

- **Code changes**: `git push` → Railway rebuilds and redeploys the bot automatically.
- **Schema changes**: commit the new Prisma migration; `migrate deploy` applies it on the
  next boot. (Create migrations locally with `pnpm db:migrate`, never `migrate dev` in
  prod.)
- **Command changes**: re-run Step 5.
- **Lavalink/YouTube breakage**: bump the `youtube-plugin` version in
  `infra/lavalink/application.yml`, push, and redeploy the Lavalink service.

## Cost note

Railway bills by usage. Three small services (bot + lavalink + postgres) for a personal
bot typically sit in the low single-digit dollars/month range. Lavalink is the heaviest
(JVM) — give it ~512MB (`_JAVA_OPTIONS=-Xmx512m` is already set for local; set a similar
memory limit on the Railway service).

---

## Appendix — Fly.io (alternative)

Fly works the same way conceptually, via the same Dockerfiles:

- `fly launch --dockerfile apps/bot/Dockerfile` for the bot (don't allocate a public IP —
  it's not a web service).
- A separate Fly app for Lavalink from `infra/lavalink/Dockerfile`.
- `fly postgres create` for the database; `fly secrets set DATABASE_URL=…` etc.
- Bot reaches Lavalink at `<lavalink-app>.internal:2333` over Fly's private 6PN network.
- Set all the same env vars via `fly secrets set`.

The decision to use Railway vs Fly is deliberately left open in
[ADR-0005](./adr/0005-deploy-railway-fly.md) — the Dockerfiles are portable between them.
