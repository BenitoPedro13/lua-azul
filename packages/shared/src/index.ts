// @lua-azul/shared — intentionally an empty stub for now (see ADR-0002).
//
// When the web dashboard (apps/web) is built, this package will hold the Zod
// schemas and TypeScript types shared by the bot and the dashboard (guild config,
// command metadata, DB-derived view models). Until there's a second consumer, the
// bot does NOT import from here — keeping it empty avoids dual-build wiring hazards.

export {};
