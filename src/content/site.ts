import { BUDGET_RANGES, PROJECT_KINDS } from '../../shared/contact-options'

export const TODO = '__TODO__' as const

export type Pending<T> = T | typeof TODO

export const isPending = <T,>(value: Pending<T>): value is typeof TODO =>
  value === TODO

export const company = {
  name: 'D20 Software House',
  shortName: 'D20',
  tagline: 'Vinte faces. Um resultado.',
  email: TODO as Pending<string>,
  phone: TODO as Pending<string>,
  whatsapp: TODO as Pending<string>,
  city: TODO as Pending<string>,
  cnpj: TODO as Pending<string>,
  foundedYear: TODO as Pending<number>,
}

export const hero = {
  kicker: 'Software house',
  headline: ['Software que', 'aguenta o', 'seu negócio'],
  lede:
    'Construímos sistemas sob medida, aplicativos e WordPress avançado. Um time de engenharia, não uma revenda de template — arquitetura, código, deploy e manutenção com um responsável técnico só.',
  primaryAction: { label: 'Começar um projeto', href: '#contato' },
  secondaryAction: { label: 'Ver como trabalhamos', href: '#processo' },
  dieHint: 'clique para rolar',
}

export type Capability = {
  id: string
  name: string
  summary: string
  detail: string
  deliverables: string[]
  stack: string[]
}

export const capabilities: Capability[] = [
  {
    id: 'sob-medida',
    name: 'Sistemas sob medida',
    summary:
      'Quando nenhum produto de prateleira encaixa no seu processo, o software se molda ao processo — não o contrário.',
    detail:
      'Levantamos a operação real antes de escrever a primeira linha. O resultado é um sistema com o seu vocabulário, as suas regras de negócio e integração com o que já roda na empresa.',
    deliverables: [
      'Levantamento e modelagem do domínio',
      'API e banco de dados próprios',
      'Painel administrativo operável pelo seu time',
      'Integrações com ERP, CRM e gateways',
      'Documentação técnica e handover',
    ],
    stack: ['TypeScript', 'Node.js', 'React', 'PostgreSQL'],
  },
  {
    id: 'aplicativos',
    name: 'Aplicativos',
    summary:
      'App que sua equipe usa em campo e seu cliente usa no bolso, publicado nas duas lojas.',
    detail:
      'Base de código única para iOS e Android, com o que precisa ser nativo sendo nativo: notificações, câmera, localização e funcionamento offline.',
    deliverables: [
      'App iOS e Android',
      'Publicação nas lojas',
      'Notificações e modo offline',
      'Painel de acompanhamento',
    ],
    stack: ['React Native', 'Expo', 'TypeScript'],
  },
  {
    id: 'wordpress',
    name: 'WordPress avançado',
    summary:
      'Tema e plugins escritos por nós. Sem construtor visual pesado, sem 40 plugins de terceiros.',
    detail:
      'Performance medida, painel limpo e código que o próximo desenvolvedor entende. Quando faz sentido, WordPress só como CMS e o front-end separado.',
    deliverables: [
      'Tema proprietário',
      'Plugins sob demanda',
      'Otimização de Core Web Vitals',
      'Migração e hardening',
    ],
    stack: ['PHP', 'WordPress', 'ACF', 'MySQL'],
  },
]

export type ProcessStep = {
  step: number
  name: string
  duration: string
  body: string
  output: string
}

export const process: ProcessStep[] = [
  {
    step: 1,
    name: 'Diagnóstico',
    duration: 'Semana 1',
    body:
      'Conversamos com quem opera, não só com quem contrata. Mapeamos o processo atual, onde ele trava e o que é ganho real contra o que é preferência.',
    output: 'Escopo escrito, com o que fica fora dele',
  },
  {
    step: 2,
    name: 'Arquitetura',
    duration: 'Semana 2',
    body:
      'Definimos modelo de dados, integrações, ambientes e o caminho de deploy antes de codificar. É aqui que decisões caras deixam de ser caras.',
    output: 'Documento técnico e estimativa por entrega',
  },
  {
    step: 3,
    name: 'Construção',
    duration: 'Ciclos de 2 semanas',
    body:
      'Você recebe uma versão navegável a cada ciclo, em ambiente de homologação. Nada de sumir por três meses e reaparecer com uma surpresa.',
    output: 'Build em homologação a cada ciclo',
  },
  {
    step: 4,
    name: 'Operação',
    duration: 'Contínuo',
    body:
      'Deploy, monitoramento e correção. Você fica com o código, o acesso e a documentação — inclusive se decidir seguir sem nós.',
    output: 'Produção monitorada e repositório seu',
  },
]

export type CaseStudy = {
  id: string
  name: string
  kind: string
  segment: string
  summary: string
  features: string[]
  metrics: Pending<{ label: string; value: string }[]>
  stack: string[]
  image: Pending<string>
  imageAlt: Pending<string>
  href: Pending<string>
}

export const cases: CaseStudy[] = [
  {
    id: 'foco-arte',
    name: 'Foco Arte',
    kind: 'Site institucional',
    segment: 'Gesso e drywall · São Paulo',
    summary:
      'Site de uma empresa de forros, sancas e divisórias em atividade desde 2014. Apresenta os oito serviços, o sistema de trabalho em seis etapas, a galeria da obra entregue para a Shopee e leva o orçamento direto ao WhatsApp da equipe.',
    features: [
      'Abertura animada com a marca antes do conteúdo',
      'Formulário que monta o pedido e envia pelo WhatsApp',
      'Galeria de obra com doze fotos legendadas',
      'Depoimentos, indicadores da empresa e três canais de contato',
    ],
    metrics: TODO,
    stack: ['Next.js', 'React', 'Tailwind CSS', 'Vercel'],
    image: '/cases/foco-arte.webp',
    imageAlt:
      'Página inicial do site Foco Arte: título "Soluções em gesso & drywall" em letras metálicas sobre fundo grafite, ao lado da logo da empresa.',
    href: 'https://foco-arte.vercel.app/',
  },
  {
    id: 'iacontabil',
    name: 'Iacontábil',
    kind: 'Site institucional',
    segment: 'Contabilidade digital · São Paulo',
    summary:
      'Site multipágina de um escritório de contabilidade digital fundado em 2017. Organiza quatro frentes de serviço, apresenta o sócio fundador, aponta para o aplicativo do cliente nas lojas e recebe pedidos de orçamento.',
    features: [
      'Abertura com mockup de celular navegando pelo próprio site',
      'Atendente virtual para dúvidas, com saída para o WhatsApp',
      'Formulário protegido por Cloudflare Turnstile e honeypot',
      'Dados estruturados Schema.org para busca local',
    ],
    metrics: TODO,
    stack: ['Next.js', 'React', 'Tailwind CSS', 'Vercel'],
    image: '/cases/iacontabil.webp',
    imageAlt:
      'Página inicial do site Iacontábil: título "Contabilidade muito mais inteligente" em fundo claro, cartão com quatro frentes de serviço e mascote ilustrado.',
    href: 'https://iacontabil.vercel.app/',
  },
  {
    id: 'gmais-arte',
    name: 'G+ARTE',
    kind: 'Site institucional',
    segment: 'Design editorial e comunicação visual',
    summary:
      'Site do estúdio de Gabriel Moraes, que faz design editorial e comunicação visual para quem ensina, pesquisa e publica. Cinco grupos de serviço, cada um com o pedido de orçamento já preenchido no WhatsApp.',
    features: [
      'Botões de WhatsApp com mensagem pré-preenchida por serviço',
      'Formulário com consentimento LGPD e Cloudflare Turnstile',
      'Página de política de privacidade',
      'Open Graph e metadados completos para compartilhamento',
    ],
    metrics: TODO,
    stack: ['Next.js', 'React', 'CSS Modules', 'Vercel'],
    image: '/cases/gmais-arte.webp',
    imageAlt:
      'Página inicial do site G+ARTE: título "Design editorial e comunicação visual" em branco sobre azul-marinho, com a logo em ciano e feixes de luz.',
    href: 'https://gmais-arte-black.vercel.app/',
  },
]

export const work = {
  heading: 'Projetos',
  lede:
    'Sites entregues e em produção, construídos do zero para clientes reais. Cada card abre o endereço publicado: avalie o resultado no próprio site, não só no print.',
  status: (count: number) =>
    count === 1 ? '1 site em produção' : `${count} sites em produção`,
  linkLabel: 'Abrir o site',
  empty: {
    label: 'cases publicados: 0',
    heading: 'O que vai aparecer aqui',
    body:
      'Assim que o primeiro projeto entrar em produção, ele vira um case nesta página — com autorização do cliente e sem maquiagem. Cada um vai trazer exatamente isto:',
    promise: [
      'O problema que a empresa tinha, na linguagem dela',
      'O que construímos e por que decidimos daquele jeito',
      'A stack e a arquitetura, sem esconder o que deu trabalho',
      'Um resultado medido — não adjetivo, número',
      'O contato do cliente, para você pedir a referência direto',
    ],
  },
  evidence: {
    label: 'material disponível hoje',
    heading: 'Enquanto isso, avalie este site',
    body:
      'Ele é nosso: pesquisa, arquitetura, código, o 3D do dado, a acessibilidade e o deploy. Se ele for bem feito, é a melhor amostra que temos para oferecer. Tudo abaixo foi medido, não estimado.',
    rows: [
      {
        label: 'Primeiro carregamento',
        value: '255 KB',
        note: 'comprimidos, dos quais 122 KB são o motor 3D em chunk separado; as thumbnails dos cases carregam depois, sob demanda',
      },
      {
        label: 'Acessibilidade',
        value: 'WCAG 2.2 AA',
        note: 'contraste calculado por script, alvos de toque de 44 px, navegação completa por teclado',
      },
      {
        label: 'Responsividade',
        value: '320 a 1440 px',
        note: 'quatro larguras auditadas, nenhum conteúdo cortado ou fora da tela',
      },
      {
        label: 'Animação do dado',
        value: '48 verificações',
        note: 'a face 20 cai de frente por cálculo de quaternion, com erro de 4,4e-16',
      },
      {
        label: 'Degradação',
        value: 'sem WebGL, sem som',
        note: 'funciona com movimento reduzido, sem placa 3D e com áudio bloqueado',
      },
      {
        label: 'Console em produção',
        value: 'zero erros',
        note: 'verificado nas quatro larguras, incluindo requisições de rede',
      },
    ],
  },
  invite: {
    text: 'Quer ser o próximo case?',
    body:
      'Todo projeto entra nesta página com autorização do cliente e link para o site publicado. Nada de logo emprestada ou número inventado.',
    action: { label: 'Falar sobre isso', href: '#contato' },
  },
}

export const principles = [
  {
    title: 'O código é seu',
    body:
      'Repositório, credenciais e documentação no seu nome desde o primeiro commit. Sem refém técnico.',
  },
  {
    title: 'Estimativa por entrega',
    body:
      'Preço e prazo por bloco navegável, não um número único no fim de um PDF de trinta páginas.',
  },
  {
    title: 'Um responsável técnico',
    body:
      'A mesma pessoa que desenhou a arquitetura atende você depois do deploy. Não existe repasse para o suporte nível 1.',
  },
]

export const contact = {
  heading: 'Conte o problema, não a solução',
  lede:
    'Descreva onde a operação trava hoje. Respondemos em até um dia útil com uma primeira leitura técnica — sem compromisso e sem proposta genérica.',
  budgets: BUDGET_RANGES,
  kinds: PROJECT_KINDS,
}

export const nav = [
  { label: 'Serviços', href: '#servicos' },
  { label: 'Processo', href: '#processo' },
  { label: 'Projetos', href: '#projetos' },
  { label: 'Contato', href: '#contato' },
]
