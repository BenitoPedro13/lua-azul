# Lavalink as a deployable service (Railway/Fly). Bakes our application.yml into the
# official image so the node boots fully configured. Build context = this directory:
#   docker build -t lua-azul-lavalink infra/lavalink
#
# On Railway: set this service's Root Directory to `infra/lavalink` and it auto-detects
# this Dockerfile. Plugins (youtube-source, lavasrc) download on first boot.
FROM ghcr.io/lavalink-devs/lavalink:4

# Bind to all interfaces is already set in application.yml (address: 0.0.0.0).
COPY application.yml /opt/Lavalink/application.yml
