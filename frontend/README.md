# RodaTrack — front-end (PWA offline)

React + TypeScript + Vite + `vite-plugin-pwa`, React Hook Form e Dexie (IndexedDB).
Os dados ficam no aparelho e sincronizam com a API (`POST /api/sync`, `GET /api/sync?since=`) quando a rede volta.

```bash
npm install
npm run dev        # http://localhost:5173 (repassa /api para localhost:8080)
npm test           # Vitest + Testing Library
npm run build      # tsc + vite build (gera o service worker)
npm run test:e2e   # Playwright (npx playwright install chromium antes)
```

Provisório: a fórmula de remoção e os alvos dos perfis (`src/domain/calculo.ts`) são fictícios e precisam ser validados com a oficina.
Sem autenticação ainda (`src/auth.ts`).
