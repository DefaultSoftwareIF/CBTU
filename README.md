# CBTU

RodaTrack: PWA offline para rastrear a usinagem de rodas. O usuário informa as medidas da roda, o app recomenda o perfil que remove menos material e guarda o histórico. Tudo é gravado primeiro no aparelho e sincroniza com a API quando a rede volta.

| Pasta | Conteúdo |
|---|---|
| `frontend/` | PWA em React, TypeScript e Vite ([detalhes e pendências](frontend/README.md)) |
| `backend/` | API em Spring Boot 3, Java 21 e MongoDB |
| `proxy/` | Configuração do Caddy (HTTPS e repasse de `/api`) |

## Pré-requisitos

- Node.js 22 e npm
- Java 21 e Maven 3.9
- Docker com Compose (para o MongoDB e para o ambiente completo)

## Configuração inicial

```bash
cp .env.example .env
```

Troque os valores no `.env`. Use uma senha só com letras e números, porque ela entra na URL de conexão do MongoDB. O `.env` fica fora do git.

## Rodar em desenvolvimento

Use um terminal para cada parte, a partir da raiz do repositório.

**1. MongoDB**, exposto só em `localhost:27017`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mongo
```

**2. API**, em `http://localhost:8080`. Ela só inicia com o MongoDB no ar. Troque `USUARIO` e `SENHA` pelos valores de `MONGO_USER` e `MONGO_PASSWORD` do `.env`:

```bash
cd backend
mvn -DskipTests package
MONGODB_URI='mongodb://USUARIO:SENHA@localhost:27017/rodatrack?authSource=admin' java -jar target/rodatrack-api-0.1.0.jar
```

**3. Front-end**, em `http://localhost:5173`. Ele repassa `/api` para a porta 8080:

```bash
cd frontend
npm install
npm run dev
```

O service worker só existe no build de produção. Para testar o funcionamento offline, use `npm run build` e depois `npm run preview`, em `http://localhost:4173`.

## Rodar o ambiente completo com Docker

Sobe MongoDB, API e Caddy servindo o front-end em HTTPS. **Atenção: este fluxo ainda não foi executado nenhuma vez**, então pode precisar de ajustes.

O Caddy exige os arquivos `certs/server.crt` e `certs/server.key`, emitidos pela CA interna para o nome definido em `SITE_ADDRESS`. A pasta `certs/` fica fora do git.

Só para testar na própria máquina, com `SITE_ADDRESS=localhost` no `.env`, dá para gerar um certificado temporário:

```bash
mkdir -p certs
```

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/server.key -out certs/server.crt -days 30 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost"
```

O navegador vai alertar sobre esse certificado e pode não registrar o service worker, então o teste de uso offline precisa do certificado da CA interna.

Para subir e acessar em `https://` mais o valor de `SITE_ADDRESS`:

```bash
docker compose up -d --build
```

Para parar, mantendo os dados:

```bash
docker compose down
```

O MongoDB não fica exposto fora da rede do Docker nesse modo. Acrescentar `-v` ao `docker compose down` **apaga os dados do banco**.

## Testes

API:

```bash
mvn -f backend/pom.xml test
```

Front-end, a partir de `frontend/`:

```bash
npm test
```

```bash
npm run build
```

Testes de ponta a ponta. A instalação do Chromium só é necessária na primeira vez:

```bash
npx playwright install chromium
```

```bash
npm run test:e2e
```

Os testes da API e do front-end não precisam de MongoDB nem de Docker: a API é simulada nos testes do front-end, e os repositórios nos da API.

## CI

O [GitHub Actions](.github/workflows/ci.yml) roda em cada PR para a `main` e em cada push nela: testes da API, testes e build do front-end, Playwright e build das imagens Docker. O check `CI ok` só passa se todos passarem.

As imagens são construídas, mas ainda não são executadas no CI.

## Regra de branches

- Uma branch por tarefa, com commits pequenos. Prefixos usados até aqui: `fix/`, `ci/` e `test/`.
- Toda mudança entra na `main` por pull request, depois que o check `CI ok` passar.

A `main` é protegida no GitHub:

- O merge exige o check `CI ok`, vindo do GitHub Actions, e a branch atualizada com a `main`.
- A regra vale também para administradores.
- Force push e exclusão da `main` são bloqueados.
- Aprovação de revisor não é obrigatória.

Se o job `CI ok` for renomeado, os merges ficam travados até a proteção ser ajustada.
