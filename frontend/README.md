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

## Pendências

- Editar ou apagar registro (exige sincronizar exclusões). Até lá, um registro recusado pela API fica no aparelho e não pode ser corrigido pelo app: as telas pedem para avisar o suporte.

### A decidir

- **Limite de descarte:** hoje uma roda no diâmetro mínimo configurado, ou abaixo dele, ainda pode receber usinagem; ela só aparece como "Descarte" na lista de rodas. Decidir se o registro deve ser barrado. O diâmetro mínimo começa em branco, não tem valor padrão e é configurado em cada aparelho (tela Config).
- **Remoção estimada:** é arredondada para 1 casa decimal (`calcularRemocaoMm`), enquanto as medidas têm até 3. O diâmetro depois da usinagem é calculado com esse valor arredondado. Faz parte da fórmula provisória: definir a precisão ao validar a fórmula real com a oficina.
