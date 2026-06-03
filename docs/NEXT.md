# Continuar daqui 👈 (handoff)

> Última sessão: **2026-06-03**. Onde paramos e o que fazer a seguir.

## Estado atual — o que está pronto

| Fase | O quê | Status |
|------|-------|--------|
| 0–1 | Workspace, config tipada (Zod), logger (pino), Prisma, framework de módulos/comandos/eventos, `/ping` | ✅ rodando |
| 2 | **Música** via Lavalink: `/play /skip /stop /queue /nowplaying /volume` | ✅ **tocando som ao vivo** (YouTube/SoundCloud) |
| 3 | **Logging**: `/logging` + eventos (delete/edit/join/leave) → `AuditLog` + canal | ✅ codado, atrás da flag `LOGGING_ENABLED` |
| Deploy | Guia Railway + Dockerfile do Lavalink | ✅ documentado em [`DEPLOYMENT.md`](./DEPLOYMENT.md) |

Bot online no Discord como **DailyBot**. 7 comandos registrados no guild de dev (8 quando o logging liga).

## Como subir o ambiente (começo de sessão)

```bash
cd /Users/benitopedro/Documents/personal/lua-azul
pnpm infra:up        # postgres + lavalink (docker)
pnpm dev             # liga o bot (hot reload)
```

(Se mudar comando: `pnpm deploy:commands`. Se mudar schema: `pnpm db:migrate`.)

## Decisão em aberto — escolher a próxima frente

1. **Phase 4 — engagement**: `/rank`, contadores de atividade por usuário (já tem a tabela `EngagementCounter`), tags.
2. **Polir a música**: DJ role, pause/resume, shuffle/loop, autocomplete no `/play`, paginação da fila.
3. **Fazer o deploy no Railway** seguindo o `DEPLOYMENT.md` (3 serviços: bot + lavalink + postgres).

## Passos manuais pendentes (quando quiser)

- **Ligar o logging**: no Portal do Discord → Bot → ligar **Server Members Intent** + **Message Content Intent** e **Save**. Depois `LOGGING_ENABLED=true` no `.env` e reiniciar `pnpm dev`. Aí `/logging setup channel:#x`.
- **Deploy**: seguir `docs/DEPLOYMENT.md`.

## Restrições / coisas a lembrar

- **Spotify desativado de propósito** — agora exige Spotify Premium pra ter Web API. Música funciona via YouTube/SoundCloud sem chave. (`spotify: false` no `application.yml`.)
- **Plugin do YouTube quebra periodicamente** — quando a música parar de sair som, subir a versão do `youtube-plugin` em `infra/lavalink/application.yml` e recriar o container (`docker compose up -d --force-recreate lavalink`). Hoje está na `1.18.1`.
- **`.env` fica na raiz do repo** (não em `apps/bot/`); os scripts do Prisma usam `dotenv -e ../../.env`.
- **`pnpm deploy:commands`** (não `pnpm deploy` — colide com comando interno do pnpm).
- Tem um `my-turborepo/` (projeto separado) dentro da pasta — não faz parte do workspace, dá pra mover pra fora.

## Mapa rápido do código

```
apps/bot/src/
├─ index.ts            boot
├─ client.ts           intents (privilegiadas atrás de LOGGING_ENABLED)
├─ config/env.ts       env validado por Zod
├─ core/               contracts + loader + roteador de interações
├─ lib/                logger, db (prisma), guild-config, format
└─ modules/
   ├─ misc/            /ping
   ├─ music/           lavalink.ts + 6 comandos
   └─ logging/         util.ts (dispatchLog) + /logging + 4 eventos
```
