# Eco Beta — Clean Tech Angola

Economia circular, ecopontos eletrónicos inteligentes e tecnologia eletromecânica para valorização de resíduos em Angola.

A app é uma página única que monta uma cena 3D interativa (o mundo *Sylva / Living Green*) a partir da landing page autoral já existente em `public/landing-pages/`. O documento autoral nunca é reescrito no disco: é carregado numa moldura isolada (iframe) ou servido por `srcdoc` com as variantes derivadas aplicadas em memória.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **three.js** — runtime carregado de dentro do documento autoral
- **motion**, **lucide-react**, **class-variance-authority**, **tailwind-merge**

O pacote `@designcodeio/threeui` não vem do registo npm: é resolvido localmente para `src/shaders` pelos `paths` do `tsconfig.json` e pelos `resolve.alias` do `next.config.ts`.

## Como executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Scripts

- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — executar o build de produção
- `npm run lint` — ESLint
- `npm run typecheck` — verificação de tipos (`tsc --noEmit`)
- `npm run clean` — remover `.next`

## Estrutura principal

- `app/` → rotas do App Router (`layout.tsx`, `page.tsx`, `globals.css`)
- `components/Scene.tsx` → liga a página ao `SylvaHero`
- `src/shaders/` → pacote de cenas e landing pages (`threeui`)
  - `sylva-living-world/` → o mundo *Living Green* e as variantes derivadas
  - `landing-pages/` → moldura isolada, tipografia e catálogo de páginas autorais
- `public/landing-pages/` → página autoral `inner-green-3d.html` e os seus assets
- `.github/workflows/` → CI e deploy para GitHub Pages

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Nenhuma variável é obrigatória para construir ou servir a app: a cena é 100% do lado do cliente e não faz chamadas ao Gemini em runtime.

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `GEMINI_API_KEY` | Não | Injetada pelo AI Studio; não é usada em runtime no código atual |
| `APP_URL` | Não | URL onde o applet está hospedado (links próprios/OAuth) |
| `DISABLE_HMR` | Não | `true` desliga o file watching (usado pelo AI Studio) |
| `NEXT_PUBLIC_BASE_PATH` | Não | Prefixo do subcaminho de publicação, ex. `/eco-beta-clean-tech-angola` |
| `NEXT_OUTPUT` | Não | `export` gera o site estático em `out/` em vez do bundle `standalone` |

## Deploy

### Vercel

Importe o repositório em [vercel.com/new](https://vercel.com/new) e aceite os valores por omissão — a Vercel deteta o Next.js, corre `npm run build` e serve a app na raiz do domínio. Não é preciso `vercel.json` nem variáveis de ambiente.

### GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` publica o site estático em <https://ecobetadevcode393.github.io/eco-beta-clean-tech-angola/> a cada push para `main`.

Pré-requisito, uma única vez: em **Settings → Pages**, definir **Source = GitHub Actions**.

O workflow corre o build com `NEXT_OUTPUT=export` e `NEXT_PUBLIC_BASE_PATH=/<nome-do-repo>`, o que faz com que todos os URLs de assets, incluindo os da cena, vivam sob esse subcaminho. Para reproduzir localmente:

```bash
# Linux / macOS
NEXT_OUTPUT=export NEXT_PUBLIC_BASE_PATH=/eco-beta-clean-tech-angola npm run build
```

```powershell
# Windows (PowerShell)
$env:NEXT_OUTPUT='export'; $env:NEXT_PUBLIC_BASE_PATH='/eco-beta-clean-tech-angola'; npm run build
```

O resultado fica em `out/`.

### AI Studio / Cloud Run

`npm run build` sem variáveis produz o bundle `standalone` (valor por omissão de `output`), que é o que o AI Studio consome. Nesse caminho a app continua servida na raiz.

## Integração contínua

`.github/workflows/ci.yml` corre em cada push para `main` e em cada pull request: `npm ci`, `npm run lint`, `npm run typecheck` e `npm run build`.
