# Eco Beta — Clean Tech Angola

Economia circular, ecopontos eletrónicos inteligentes e tecnologia eletromecânica para valorização de resíduos em Angola.

A app é uma página única que monta uma cena 3D interativa (o mundo *Sylva / Living Green*) a partir da landing page autoral já existente em `public/landing-pages/`. O documento autoral nunca é reescrito no disco: é carregado numa moldura isolada (iframe) ou servido por `srcdoc` com as variantes derivadas aplicadas em memória. Por cima da cena, a app monta o ecrã de conta do `myEcobetaApp` (ver [Conta myEcobetaApp](#conta-myecobetaapp)).

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
- `components/MyEcobetaAuth.tsx` → ecrã de conta (entrar / criar conta) sobre a cena
- `components/EcobetaRecycling.tsx` → a folha de reciclagem e todas as suas faces
- `components/EcobetaProfileMenu.tsx` → menu do perfil e caixa de notificações
- `components/EcobetaPersonalInfo.tsx` → os dados do perfil: leitura e formulário
- `components/EcobetaAddress.tsx` → os endereços: lista e formulário
- `components/EcobetaRewards.tsx` → o marketplace verde: produtos, detalhe e procura
- `lib/myecobetaAuth.ts` → validação da conta e o seam para o serviço real
- `lib/ecobetaRecycling.ts` → materiais, pontos, escalões e o seam do serviço
- `lib/ecobetaProfile.ts` → perfil, endereços, validação e o seam do serviço
- `lib/ecobetaRewards.ts` → lojas parceiras, catálogo de recompensas e o seam do serviço
- `hooks/use-ecobeta-recycling.ts` → o saldo da sessão
- `hooks/use-ecobeta-profile.ts` → o perfil da sessão
- `src/shaders/` → pacote de cenas e landing pages (`threeui`)
  - `sylva-living-world/` → o mundo *Living Green* e as variantes derivadas
  - `landing-pages/` → moldura isolada, tipografia e catálogo de páginas autorais
- `public/landing-pages/` → página autoral `inner-green-3d.html` e os seus assets
- `.github/workflows/` → CI e deploy para GitHub Pages

## Conta myEcobetaApp

O dock do header autoral tem uma pílula `myEcobetaApp` que abre o ecrã de **entrar** e **criar conta**. A pílula vive dentro da moldura isolada: não pode desenhar o ecrã nem navegar a janela de topo (a sandbox não inclui `allow-top-navigation`), por isso limita-se a enviar `postMessage` com `myecobetaapp:open`, e o componente `components/MyEcobetaAuth.tsx` — montado em `app/page.tsx`, por cima do frame — responde com o ecrã.

O ecrã funciona sem servidor: valida os campos em `lib/myecobetaAuth.ts` e mantém a sessão apenas em memória, o que é o que o deploy em GitHub Pages faz hoje. Para ligar o serviço real basta definir `NEXT_PUBLIC_MYECOBETA_API_URL`: o mesmo formulário passa a fazer `POST` para `<URL>/sign-in` e `<URL>/sign-up` com `credentials: "include"`, e uma resposta `{ message, fieldErrors }` volta diretamente ao formulário.

## Folha de reciclagem, perfil e endereços

Depois de entrar, o ecrã de conta dá lugar à *folha* de reciclagem — 375 × 812 px centrada num desktop, ecrã inteiro num telefone. É onde os pontos se ganham e onde o menu do perfil vive, e todas as faces que o menu abre são faces da mesma folha, com o cabeçalho da folha a fazer de cabeçalho de todas elas.

As duas linhas do menu que já têm ecrã próprio abrem-no dentro da folha (`components/EcobetaRecycling.tsx` decide qual das faces está à vista):

- **Info Pessoal** → `components/EcobetaPersonalInfo.tsx` mostra o nome completo, o NIF e o número de telefone, com a linha **EDITAR** no cabeçalho a abrir o formulário que os escreve — e que também escolhe a fotografia de perfil (lida como data URL, guardada só na sessão).
- **Endereço** → `components/EcobetaAddress.tsx` lista os endereços guardados; tocar num cartão abre esse endereço no formulário para o alterar ou remover, e **ADICIONAR NOVO ENDEREÇO** abre o mesmo formulário vazio, com os chips CASA / SERVIÇO / OUTRO. O bloco do mapa é desenhado, porque este build não fala com nenhum serviço de tiles: a pílula sobre ele é que diz o que o browser respondeu quando lhe foi pedida a posição, e a posição só é pedida quando a pílula é tocada.

## Marketplace verde

A linha **Recompensas** do menu do perfil abre o marketplace verde, dentro da mesma folha (`components/EcobetaRewards.tsx`, com as regras e o seam do serviço em `lib/ecobetaRewards.ts`). São três ecrãs, todos desenhados como ecrãs de telefone inteiros com o seu próprio cabeçalho — por isso a folha esconde o cabeçalho deles e lhes dá a altura toda, tal como faz com os ecrãs dos Ecopontos:

- **Produtos** → a capa de uma loja parceira (padarias, roupas ou mercados): os cartões com o preço em pontos, a nota e a entrega, a calha "Entrega Disponível" e o saldo da sessão em baixo. Tocar num cartão abre o detalhe; a lupa e **Ver Todos** levam à procura.
- **Detalhe** → a recompensa em grande, a pílula da loja, os chips de tamanho, a linha **contêm** com os ingredientes e o bloco do carrinho com a quantidade e **Adicionar ao carrinho**. O preço mostrado é o total — o da unidade vezes a quantidade — e é esse total que sai do saldo.
- **Procura** → o campo do desenho, as pesquisas recentes em pílula, a sugestão de lojas com as suas notas e o ranking do dia. Uma loja ou uma pesquisa recente abre a capa da sua categoria; um resultado abre o detalhe.

Trocar uma recompensa tira os pontos do saldo: a face de detalhe pede a reserva, a folha escreve-a em `redeemReward` (`lib/ecobetaRewards.ts`) e é ela que chama `onRedeemPoints` no ledger da sessão (`hooks/use-ecobeta-recycling.ts`), por isso nenhum ecrã do marketplace mexe no saldo por si. As regras correm sempre, com ou sem serviço: uma recompensa esgotada, um tamanho que o produto não tem, mais unidades do que o teto ou um saldo que não chega para o total são recusados antes de escrever seja o que for, e a recusa aparece na linha do botão — que só se desliga no que não é decisão da pessoa (esgotado, ou a reserva a caminho). Sem `NEXT_PUBLIC_MYECOBETA_API_URL` a reserva é montada localmente e fica só nesta sessão; com o serviço definido a mesma face faz `POST <URL>/rewards` e a resposta dele é a que fica.

O perfil vive acima da folha, ao lado da conta a que pertence (`hooks/use-ecobeta-profile.ts`), tal como o saldo vive em `hooks/use-ecobeta-recycling.ts`: as regras e o seam do serviço estão em `lib/ecobetaProfile.ts`, e sem `NEXT_PUBLIC_MYECOBETA_API_URL` o perfil começa com o nome da conta e tudo o resto por preencher, ficando o que for escrito só nesta sessão. Com o serviço definido, o mesmo ecrã lê `GET <URL>/profile` e escreve `PATCH <URL>/profile`, `POST` / `PATCH <URL>/profile/addresses` e `DELETE <URL>/profile/addresses/:id`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Nenhuma variável é obrigatória para construir ou servir a app: a cena é 100% do lado do cliente e não faz chamadas ao Gemini em runtime.

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `GEMINI_API_KEY` | Não | Injetada pelo AI Studio; não é usada em runtime no código atual |
| `APP_URL` | Não | URL onde o applet está hospedado (links próprios/OAuth) |
| `DISABLE_HMR` | Não | `true` desliga o file watching (usado pelo AI Studio) |
| `NEXT_PUBLIC_BASE_PATH` | Não | Prefixo do subcaminho de publicação, ex. `/eco-beta-clean-tech-angola` |
| `NEXT_OUTPUT` | Não | `export` gera o site estático em `out/` em vez do bundle `standalone` |
| `NEXT_PUBLIC_MYECOBETA_API_URL` | Não | Base do serviço de contas do myEcobetaApp; sem ela o ecrã valida e guarda a sessão localmente |

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
