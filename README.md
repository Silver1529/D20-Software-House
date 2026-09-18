# D20 Software House

Portfólio da agência. Front-end de produção, refatorado a partir de um mockup de
canvas (`.dc.html`) que não era um projeto executável.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # tsc -b + vite build  ->  dist/
npm run preview    # serve o dist
npm run typecheck
```

O site em si é estático. O **formulário de contato** precisa de variáveis de
ambiente e de uma serverless function — veja [E-mail do formulário](#e-mail-do-formulário).

## Bibliotecas

Quatro dependências de runtime:

| Pacote | Versão | Para quê |
|---|---|---|
| `react` / `react-dom` | 19 | UI |
| `three` | 0.180 | o D20 em WebGL (icosaedro real, 20 faces numeradas) |
| `motion` | 12 | o fade-out do overlay do pré-loader (é o Framer Motion, nome novo) |
| `nodemailer` | 9 | envio dos e-mails do formulário (só no servidor, não vai no bundle) |

Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss` +
`@tailwindcss/vite`, `@types/*`, `vite-node` (roda os verificadores de
matemática), `playwright` (roda as checagens de navegador e gera os favicons).

`three` sai em chunk separado (`manualChunks` no `vite.config.ts`), então o resto
do site não espera por ele: **123 KB gzip** do app + **122 KB gzip** do three.

## A animação do D20

### Como ver

Ela roda sozinha no primeiro carregamento de cada sessão. Para ver de novo:

- abra em uma aba nova, ou
- no DevTools: `sessionStorage.removeItem('d20:rolled')` e recarregue, ou
- **clique no dado do hero** — ele rola de novo ali mesmo.

Durante a rolagem: **clique**, **Esc**, **Enter** ou **Espaço** pulam para o
site; **M** liga/desliga o som. Com `prefers-reduced-motion: reduce` a animação
não acontece — o conteúdo aparece na hora e o dado vira um SVG gravado estático.

### A matemática

O problema central: parar com a **face 20 exatamente de frente**, sem tentativa
e erro.

**1. Construção do icosaedro.** Os 12 vértices são as permutações cíclicas de
`(0, ±1, ±φ)` com `φ = (1+√5)/2`, normalizadas. As 20 faces são derivadas
enumerando todos os trios de vértices cujas três distâncias mútuas são iguais à
aresta mínima — não existe lista de índices escrita à mão, então a construção se
autovalida (`npm run verify` confere `V − E + F = 2`). O sentido de cada
triângulo é corrigido testando `dot(normal, centroide) < 0`, garantindo normais
para fora.

**2. A orientação de aterrissagem.** Para a face *i* com normal `n_i`, a
orientação que encosta essa face na câmera é

```
q_i = Quaternion.setFromUnitVectors(n_i, +Z)
```

Fazer `mesh.quaternion = q_20` põe a face 20 de frente **por construção**. O
verificador mede o erro: `4.44e-16` — epsilon de máquina, não aproximação.

**3. Numerais na vertical, cada um na sua face.** O mesmo `q_i` gera o atlas de
texturas. Rotacionando os 3 vértices da face por `q_i`, eles achatam no plano XY;
essas coordenadas 2D **são** o mapeamento UV para a célula daquela face no atlas
(grade 5×4, célula de 256 px). É por isso que todo numeral fica centrado e na
vertical na própria face, inclusive o 20. A numeração respeita a regra do d20
real: faces opostas somam 21.

**4. A física.** `src/lib/d20-timeline.ts` é uma função pura `sampleD20(t)` — sem
estado, sem three.js, testável isolada.

| Fase | Janela | O que acontece |
|---|---|---|
| queda | 0–880 ms | queda livre de `y = 4.65` sob `g = 12`, girando em **três eixos** (1,4 voltas) |
| impacto | 880 ms | achata 1.20/0.78, clarão horizontal, 26 faíscas, flash |
| quique | 880–1848 ms | dois saltos, restituição `0.40` e `0.15` |
| travada | 880–1848 ms | slerp para `q_20` com `easeOutExpo` — o giro decai *para dentro* da travada |
| brilho | 1848–2268 ms | emissivo da face 20 sobe, arestas acendem, halo floresce |
| espera | 2268–2488 ms | o 20 fica legível |
| saída | 2488–2848 ms | o dado cresce e se dissipa, o overlay faz crossfade |

Altura de queda e alturas de quique não são números escolhidos a dedo: saem de
`h = ½gt²` e `e²h`. O verificador confere essa relação.

**Por que `g = 12` e não 26.** A queda precisa durar perto de 900 ms para ser
vista, e o dado precisa estar dentro do quadro no instante da soltura (ponta
inferior abaixo de 3,4 unidades). Com `g = 26` essas duas condições são
incompatíveis: ou a queda dura 600 ms, ou o dado entra no quadro atrasado.
Baixar a gravidade resolve as duas — e como os quiques usam o mesmo `g`, a
relação `e²h` continua exata.

**A rotação em três eixos.** O dado gira em torno de um eixo principal
(`SPIN_AXIS`, 10 rad/s) e de dois secundários com razões irracionais em relação
ao principal: `0.618` (tombo) e `0.43` (rolagem). As três rotações são compostas
por quaternion a cada quadro. Como as razões não são frações simples, os eixos
nunca entram em fase — o dado tomba de verdade em 3D em vez de balançar num
padrão repetido. O verificador confere que nenhuma razão está a menos de
`1e-3` de `p/q` com `p, q ≤ 6`.

Duas coisas que **não** são óbvias e estão resolvidas no código:

- O giro é a **integral** da velocidade angular decrescente
  (`ω₀(τ − τ³/3T²)`), não o ângulo multiplicado pelo decaimento. Fazer o segundo
  faz o dado contra-rotacionar visivelmente no fim.
- O `origin` do loop de animação usa sentinela `null`, não `if (!origin)`. Com um
  timestamp `0` o teste falsy nunca trava e a animação reinicia todo quadro.

**5. Câmera.** Fica reta em `+Z` — senão a face 20 não estaria de frente. Por
isso o impacto **não** é um anel no chão: em câmera reta um anel no plano ficaria
invisível de perfil, e um anel de frente lê como spinner de loading. É um
**clarão elíptico horizontal**: quente no ponto de contato, decaindo para os
lados, expandindo. Lê como batida num plano sem sair do enquadramento. A câmera
também faz um dolly de 1.2× para 1.0× durante a queda.

### O som

- `public/sounds/dice-roll.mp3` toca **no impacto no chão** (600 ms), não na
  soltura — dado caindo no ar não faz som.
- `public/sounds/critical-hit.mp3` toca quando o dado para no 20, limitado a
  **1,5 s** com fade de 340 ms no fim (corte seco estala).
- O áudio é singleton de módulo com tempo de vida da página, não do overlay:
  senão o `dispose()` do desmonte cortaria o som de sucesso em 890 ms.
- Há um piso de 520 ms entre os dois sons. Num aparelho lento um único quadro
  pode saltar impacto e repouso juntos e empilhar os áudios.
- O botão de mudo no HUD persiste em `localStorage` (`d20:muted`). Atalho: **M**.

#### Autoplay — leia antes de reportar que o som não sai

Chrome, Edge, Safari e Firefox **bloqueiam áudio no primeiro carregamento** se o
visitante ainda não interagiu com a página. Não é bug do código, é política do
navegador e não existe como contornar. O que o projeto faz a respeito:

1. Tenta tocar. Se o navegador recusar, falha em silêncio — sem erro no console.
2. Arma escuta única de `pointerdown` / `keydown` / `touchstart`. Se o visitante
   interagir dentro da janela útil (620 ms para o dado, 1,4 s para o crítico), o
   som toca a partir dali.
3. O HUD mostra **"ativar som"** em cobre quando o navegador recusou, então o
   visitante sabe que existe som e pode ligar.
4. **Clicar no dado do hero rola de novo** — e clique é gesto do usuário, então
   aí o som toca sempre. Esse é o caminho garantido para ouvir os dois sons.

Para testar em desenvolvimento: clique uma vez em qualquer lugar da página e
depois clique no dado do hero.

Se você quiser som garantido já na abertura, a única forma é trocar a abertura
automática por um gesto explícito — um botão "rolar o dado" no overlay. Diga se
preferir assim; é uma troca pequena.

### Se o WebGL não existir

`D20Engraved` é um SVG gravado mostrando 20, usado quando o WebGL falha, quando o
usuário pede menos movimento e no hero como fallback. Nunca sobra tela em branco.

## Logo e favicons

A logo vive em `public/icons/d20-logo-source.jpg`. Ela vem com fundo branco, o
que num site escuro apareceria como um quadrado branco, então os assets usados
são gerados a partir dela:

```bash
npm run icons
```

O script (`scripts/build-icons.cjs`) remove o fundo por **flood fill a partir das
bordas** — keyar todo pixel branco perfuraria os numerais brancos do dado, que
não tocam a borda. A transparência é proporcional à luminância, então a auréola
da logo sai suave em vez de recortada. Depois recorta no conteúdo, centraliza em
quadrado e exporta:

| Arquivo | Uso |
|---|---|
| `public/favicon-16.png` / `-32` / `-48` / `-192` | favicon |
| `public/apple-touch-icon.png` | iOS, com o fundo da marca embutido (iOS não lida bem com transparência) |
| `public/icons/d20-mark.png` | header (34 px) e rodapé (44 px) |
| `public/icons/d20-logo.png` | Open Graph |

Trocou a logo? Substitua o `-source.jpg` e rode `npm run icons`.

Uma observação honesta: a logo é uma ilustração 3D brilhante e o resto da
interface é uma superfície usinada e fosca — são linguagens visuais diferentes.
Ela está aplicada como você pediu; se um dia quiser um símbolo vetorial que
converse com o resto, é uma boa próxima tarefa.

## E-mail do formulário

O formulário envia **dois** e-mails por contato, via Nodemailer sobre o SMTP do
Gmail:

1. **Aviso interno** para `MAIL_TO` com os dados do lead. O `replyTo` aponta para
   o e-mail de quem preencheu, então apertar Responder já fala com a pessoa.
2. **Confirmação para o cliente**, com cópia do que ele enviou e o que acontece
   agora. O `replyTo` aponta de volta para `MAIL_TO`.

### Como isso roda

O site é estático, e **Nodemailer é Node.js — não roda no navegador**. O envio
mora em `api/contact.ts`, uma serverless function da Vercel. Em
desenvolvimento, um plugin do Vite (`contactApi` no `vite.config.ts`) monta o
mesmo handler em `/api/contact`, então `npm run dev` testa o fluxo completo sem
precisar do `vercel dev`.

### Configuração

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | O que é |
|---|---|
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_SECURE` | `smtp.gmail.com`, `465`, `true` |
| `MAIL_USER` | a conta Gmail que envia |
| `MAIL_PASS` | **senha de app** de 16 caracteres, não a senha da conta |
| `MAIL_FROM` | remetente exibido, ex. `D20 Software House <voce@gmail.com>` |
| `MAIL_TO` | onde cai o aviso de novo contato |
| `SITE_URL` | usado nos links e no logo dos e-mails |

A senha de app se cria em **myaccount.google.com/apppasswords** (exige 2FA
ligado na conta). O Google mostra ela em quatro blocos de quatro; os espaços são
só visuais — o código remove qualquer espaço antes de usar.

### Em produção você precisa cadastrar as variáveis na Vercel

`.env` está no `.gitignore` e **não vai para o deploy**. Sem cadastrar as
variáveis no painel, o formulário responde 500 em produção:

Vercel → seu projeto → **Settings → Environment Variables** → adicione as sete
(Production, Preview e Development) → **Redeploy**.

### O que o endpoint faz

- Aceita só `POST`; qualquer outro método recebe 405.
- **Revalida tudo no servidor** com as mesmas regras do front. Nunca confia no
  cliente: um 422 volta com erro por campo e o front realoca o foco.
- **Honeypot**: um campo `company` oculto e fora da ordem de tabulação. Se vier
  preenchido, responde 200 sem enviar nada — o bot acha que funcionou.
- **Rate limit** de 4 por minuto por IP (429). É por instância da função, então
  não é uma barreira forte; serve contra abuso trivial.
- **Escapa todo o input** antes de montar o HTML do e-mail. Sem isso o corpo do
  e-mail seria um vetor de injeção.
- Se o aviso interno sai mas a confirmação falha, responde `200` com
  `receipt: false` — o lead não se perde por causa do e-mail secundário.

### Por que os e-mails são claros e não escuros

O site é escuro, mas e-mail HTML é outro terreno: o modo escuro do Gmail inverte
cores, o Outlook ignora `background` em vários elementos, e não existe grid,
variável CSS nem `oklch`. Um e-mail escuro quebra de formas difíceis de prever.
Então os templates usam o padrão que funciona em todo cliente: **corpo claro com
faixa de marca escura no topo**, layout em tabela, estilos inline e cores em hex.
Cada e-mail também vai com alternativa em texto puro.

Os templates ficam em `api/_lib/templates/`. Para revisar visualmente, altere um
template e rode:

```bash
npm run dev
npm run check:contact
```

## Estrutura

```
src/
├── lib/
│   ├── d20-geometry.ts    icosaedro, normais, quaternions por face, UVs
│   ├── d20-atlas.ts       atlas de 20 células em canvas (albedo + emissivo)
│   ├── d20-timeline.ts    física pura, sampleD20(t)
│   ├── d20-scene.ts       cena three.js, materiais, luzes, clarão, faíscas
│   ├── audio.ts           som do dado e do crítico, mudo, fades, desbloqueio
│   └── easing.ts
├── content/site.ts        TODA a copy e os dados, em um arquivo
├── styles/                tokens.css, base.css, surfaces.css, controls.css
├── components/
│   ├── preloader/         D20Preloader, D20Canvas, D20Engraved
│   ├── layout/            SiteHeader, SiteFooter
│   ├── sections/          Hero, Capabilities, Process, Work, Contact
│   └── ui/                Pending, CaseSchematic
└── App.tsx
```

## Conteúdo pendente

`src/content/site.ts` é a única fonte de texto e dados. Nada nesta página é
inventado: não há cliente fictício, logo emprestado nem número que não tenha sido
medido.

### A seção Projetos tem dois estados

`cases` hoje tem **três sites publicados** (Foco Arte, Iacontábil e G+ARTE). O
primeiro item da lista vira o card em destaque, de largura inteira; os demais
entram numa grade de duas colunas. Cada card é um link único para o site
publicado, em nova aba.

Se `cases` voltar a ficar vazio, a seção assume o estado honesto: diz que o
estúdio é novo, lista o que cada case vai trazer e apresenta este próprio site
como o material avaliável.

```ts
export const cases: CaseStudy[] = [
  {
    id: 'foco-arte',
    name: 'Foco Arte',
    kind: 'Site institucional',
    segment: 'Gesso e drywall · São Paulo',
    summary: 'O que o site faz, em duas frases, sem adjetivo',
    features: ['Só o que dá para clicar e conferir no site publicado'],
    metrics: TODO,
    stack: ['Next.js', 'React', 'Tailwind CSS', 'Vercel'],
    image: '/cases/foco-arte.webp',
    imageAlt: 'Descrição da primeira tela do site',
    href: 'https://foco-arte.vercel.app/',
  },
]
```

Regras que valem para os cards de cliente:

- **Só informação verificável no site publicado.** Segmento, o que o site faz,
  funcionalidades clicáveis e a stack visível no código-fonte da página
  (`/_next/`, classes do Tailwind, CSS Modules, Turnstile, JSON-LD). Nada de
  resultado, prazo ou número que o cliente não tenha fornecido.
- `metrics: TODO` esconde a linha de métricas em vez de inventar um número.
  Quando houver resultado medido e autorizado, preencha e ele aparece.
- `image`/`imageAlt` pendentes fazem o card cair no esquema técnico em SVG.
- Thumbnails são capturas da primeira tela em **1280×800 WebP** (~40 KB cada),
  em `public/cases/`. Para regerar, capture o site em 1440×900 e reamostre.

### Os números da seção Projetos

As linhas de "avalie este site" vivem em `work.evidence.rows`. **Se você mexer no
projeto, confira se elas continuam verdadeiras** — o valor da seção é justamente
serem verificáveis. `npm run build` dá o peso, `npm run check:browser` dá as
larguras e o console, `npm run verify` dá o número de checagens.

### Dados da empresa

Ainda faltam em `company`: `email`, `whatsapp`, `city`, `cnpj`. Todos aparecem
como ausência visível no rodapé e na seção de contato até serem preenchidos.

O formulário de contato está ligado e enviando — veja
[E-mail do formulário](#e-mail-do-formulário).

## Verificação

```bash
npm run verify          # 48 checagens de geometria e física, sem navegador
npm run check:browser   # 3 viewports: overflow, alvos de toque, landmarks, alt
npm run check:states    # teclado, tablist, validação, reduced-motion, skip link
npm run check:audio     # timing dos sons, janela de 1,5 s, mudo, autoplay bloqueado
npm run check:contact   # formulário: honeypot, payload, 422, 429, 502, rede caída
npm run icons           # regera favicons e marcas a partir da logo
```

`npm run verify` é o que importa se você mexer na animação: ele confere que a
face 20 continua caindo de frente, que as alturas de quique seguem a física da
restituição, que o giro nunca inverte, que os três eixos de rotação não entram
em fase, que a queda fica entre 800 e 1000 ms e que o dado nunca atravessa o
chão.

Contraste foi **calculado**, não estimado. Todo primeiro plano passa WCAG AA
sobre toda superfície; os números estão em `DESIGN.md`. Botões usam texto escuro
sobre metal porque branco sobre `--steel` dá 2.82:1 e reprova.

## Documentos

- `PRODUCT.md` — registro, público, personalidade, anti-referências, princípios
- `DESIGN.md` — paleta OKLCH com contrastes medidos, tipografia, geometria,
  movimento, a sequência do D20

## Convenção

Sem comentários no código-fonte, por pedido. Nomes, módulos pequenos e estes
documentos carregam a explicação.
