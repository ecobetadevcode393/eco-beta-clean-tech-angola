/**
 * O marketplace verde: as lojas parceiras, as recompensas que cada uma tem e o que custa trocar
 * os pontos por elas.
 *
 * Same shape as `lib/ecobetaRecycling.ts`, `lib/ecobetaWallet.ts` and `lib/ecobetaProfile.ts`, and
 * for the same reason: the site is a static export with no server at runtime, so the screen works
 * with whatever the deployment points it at. `NEXT_PUBLIC_MYECOBETA_API_URL` is that seam:
 *
 *   - set it and `POST <URL>/rewards` answers with the reserva — its reference, the size that was
 *     chosen and the balance the service kept;
 *   - leave it unset and the reserva is built here and kept in memory for the session only, which
 *     is what the GitHub Pages deployment does today.
 *
 * The catalogue lives here rather than inside the screens so the three faces of the rewards flow —
 * os produtos, o detalhe e a procura — cannot disagree about a reward's price, its sizes or the
 * allergens it carries, and so that swapping the authored renders in is a one-line change: the art
 * is the placeholder tile the design itself points at (see `EcobetaReward.art`).
 */

import { MYECOBETA_API_URL, MYECOBETA_IS_LOCAL } from "@/lib/myecobetaAuth";

/* ── as lojas e as categorias ───────────────────────────────────────────── */

/** As três leituras do catálogo que o design autoriza, cada uma com o nome que a capa usa. */
export type EcobetaRewardCategoryId = "padarias" | "roupas" | "mercados";

export type EcobetaRewardCategory = {
  id: EcobetaRewardCategoryId;
  /** O título grande da capa: "Padarias Parceiras". */
  title: string;
  /** A pílula do cabeçalho, que é o nome curto: "PÃO". */
  pill: string;
  /** O que a capa escreve por baixo do título, quando o produto não tem nome próprio. */
  hint: string;
};

/**
 * A primeira categoria é a que a linha "Recompensas" do menu abre: é a leitura que o design
 * desenha com a lista de padarias, e a que dá entrada às outras duas pela procura.
 */
export const ECOBETA_REWARD_CATEGORIES: readonly EcobetaRewardCategory[] = [
  { id: "padarias", title: "Padarias Parceiras", pill: "PÃO", hint: "Padaria disponível" },
  { id: "roupas", title: "Lojas Roupas", pill: "T´SHIRTS", hint: "T´shirts disponível" },
  { id: "mercados", title: "Mercados Parceiros", pill: "ÁGUA", hint: "Mercado disponível" },
];

/** As lojas que o design nomeia, cada uma com a nota e o escalão que a capa imprime. */
export type EcobetaRewardStore = {
  id: string;
  name: string;
  /** A nota de 0 a 5 que o desenho põe ao lado do nome. */
  rating: number;
  /** O escalão ecológico que a ficha da loja mostra. */
  tier: string;
};

export const ECOBETA_REWARD_STORES: readonly EcobetaRewardStore[] = [
  { id: "arreio", name: "Mercado ARREIO", rating: 4.7, tier: "eCO WARRIOR 1.5" },
  { id: "maxi", name: "Mercado MAXI", rating: 4.3, tier: "ECO START 1.0" },
  { id: "kibabo", name: "Mercado KIBABO", rating: 4, tier: "eCO WARRIOR 1.5" },
  { id: "capex", name: "Padarias CAPEX", rating: 4.7, tier: "ECO START 1.0" },
  { id: "uma", name: "Uni Águas", rating: 4.3, tier: "ECO START 1.0" },
  { id: "kikolo", name: "Kikolo Dropshiping", rating: 4, tier: "eCO WARRIOR 1.5" },
];

export function storeById(id: string): EcobetaRewardStore | null {
  return ECOBETA_REWARD_STORES.find((store) => store.id === id) ?? null;
}

export function categoryById(id: EcobetaRewardCategoryId): EcobetaRewardCategory {
  return ECOBETA_REWARD_CATEGORIES.find((category) => category.id === id) ?? ECOBETA_REWARD_CATEGORIES[0];
}

/* ── as recompensas ─────────────────────────────────────────────────────── */

/** O que o desenho escreve no cartão de cada recompensa. */
export type EcobetaRewardStatus = "Disponível" | "Esgotado";

/** Um ingrediente da linha "contêm", com a alergia que o design anota por baixo quando a há. */
export type EcobetaRewardAllergen = {
  label: string;
  /** O "(Alergy)" do desenho; ausente no ingrediente que não é alergia. */
  allergy?: boolean;
};

export type EcobetaReward = {
  id: string;
  /** O nome do produto, como o cartão o escreve. */
  name: string;
  /** A loja que o vende — o nome por baixo do produto. */
  storeId: string;
  category: EcobetaRewardCategoryId;
  /** O que a recompensa custa em pontos: a linha verde dos cartões. */
  points: number;
  rating: number;
  /** O preço em kwanzas, como o detalhe o escreve ("450 kzs"). */
  price: string;
  /** A entrega: "Free" quando é do ecobeta, "1 h" quando a loja cobra tempo. */
  delivery: string;
  status: EcobetaRewardStatus;
  /** A descrição da face de detalhe. */
  description: string;
  /** Os tamanhos que o desenho põe nos chips; vazio quando o produto não os tem. */
  sizes: readonly string[];
  allergens: readonly EcobetaRewardAllergen[];
  /**
   * A placa que o desenho aponta para esta recompensa — `"129x126"` é o placeholder que ele próprio
   * referencia. As três faces leem daqui, por isso trocar o render é uma linha só.
   */
  art: string;
};
/**
 * As recompensas do catálogo, na ordem em que a capa as lista. Os valores são os das três leituras
 * do design: os cartões a 50 pts, a entrega "Free" / "1 h" e as notas 4.0 / 4.3 / 4.7.
 */
export const ECOBETA_REWARDS: readonly EcobetaReward[] = [
  {
    id: "pao-normal-arreio",
    name: "Pão Normal",
    storeId: "arreio",
    category: "padarias",
    points: 50,
    rating: 4.7,
    price: "450 kzs",
    delivery: "Free",
    status: "Disponível",
    description: "Pão delicioso feito com os melhores cuidados para nós.",
    sizes: ["10”", "14”", "16”"],
    allergens: [
      { label: "Sal" },
      { label: "onion", allergy: true },
      { label: "Garlic" },
      { label: "Pappers", allergy: true },
      { label: "Ginger" },
      { label: "Broccoli" },
      { label: "Orange" },
      { label: "Walnut" },
    ],
    art: "100x98",
  },
  {
    id: "pao-frances-maxi",
    name: "Pão Francês",
    storeId: "maxi",
    category: "padarias",
    points: 50,
    rating: 4.3,
    price: "350 kzs",
    delivery: "Free",
    status: "Disponível",
    description: "Pão francês de casca estalada, feito no dia e entregue pelo ecobeta.",
    sizes: ["10”", "14”", "16”"],
    allergens: [
      { label: "Sal" },
      { label: "onion", allergy: true },
      { label: "Garlic" },
      { label: "Pappers", allergy: true },
      { label: "Ginger" },
      { label: "Broccoli" },
      { label: "Orange" },
      { label: "Walnut" },
    ],
    art: "94x112",
  },
  {
    id: "pao-normal-kibabo",
    name: "Pão Normal",
    storeId: "kibabo",
    category: "padarias",
    points: 50,
    rating: 4,
    price: "450 kzs",
    delivery: "Free",
    status: "Disponível",
    description: "Pão de forma do Mercado KIBABO, feito no dia e entregue pelo ecobeta.",
    sizes: ["10”", "14”", "16”"],
    allergens: [
      { label: "Sal" },
      { label: "onion", allergy: true },
      { label: "Garlic" },
      { label: "Pappers", allergy: true },
      { label: "Ginger" },
      { label: "Broccoli" },
      { label: "Orange" },
      { label: "Walnut" },
    ],
    art: "114x130",
  },
  {
    id: "tshirt-eco-white-arreio",
    name: "T´shirts ECO-white",
    storeId: "arreio",
    category: "roupas",
    points: 50,
    rating: 4.7,
    price: "9.500 kzs",
    delivery: "1 h",
    status: "Disponível",
    description: "T´shirt de algodão certificado, de corte amplo e lavagem em água fria.",
    sizes: ["S", "M", "L"],
    allergens: [],
    art: "100x98",
  },
  {
    id: "tshirt-eco-black-maxi",
    name: "T´shirts ECO-Black",
    storeId: "maxi",
    category: "roupas",
    points: 50,
    rating: 4.3,
    price: "9.500 kzs",
    delivery: "1 h",
    status: "Disponível",
    description: "T´shirt preta com estampa em serigrafia de tinta à base de água.",
    sizes: ["S", "M", "L"],
    allergens: [],
    art: "114x130",
  },
  {
    id: "tshirt-eco-white-kibabo",
    name: "T´shirts ECO-white",
    storeId: "kibabo",
    category: "roupas",
    points: 50,
    rating: 4,
    price: "8.900 kzs",
    delivery: "1 h",
    status: "Disponível",
    description: "T´shirt branca com o selo do ecobeta bordado no peito.",
    sizes: ["S", "M", "L"],
    allergens: [],
    art: "93x113",
  },
  {
    id: "agua-uma",
    name: "Água Mineral 1,5L",
    storeId: "uma",
    category: "mercados",
    points: 30,
    rating: 4.3,
    price: "600 kzs",
    delivery: "Free",
    status: "Disponível",
    description: "Garrafa de água mineral de fonte, entregue pelo ecobeta em Luanda.",
    sizes: ["6 × 1,5L"],
    allergens: [],
    art: "132x127",
  },
  {
    id: "agua-kikolo",
    name: "Água Mineral 1,5L",
    storeId: "kikolo",
    category: "mercados",
    points: 30,
    rating: 4,
    price: "550 kzs",
    delivery: "Free",
    status: "Disponível",
    description: "Pack de seis garrafas, com o contentor devolvido ao ecoponto na recolha.",
    sizes: ["6 × 1,5L"],
    allergens: [],
    art: "132x127",
  },
  {
    id: "bolsa-tela-ecossistema",
    name: "Bolsa de Tela ECO",
    storeId: "capex",
    category: "mercados",
    points: 40,
    rating: 4.7,
    price: "4.200 kzs",
    delivery: "Free",
    status: "Esgotado",
    description: "Bolsa de algodão reutilizável, costurada com fio reciclado.",
    sizes: ["Único"],
    allergens: [],
    art: "129x126",
  },
];

export function rewardById(id: string | null): EcobetaReward | null {
  return ECOBETA_REWARDS.find((reward) => reward.id === id) ?? null;
}

export function rewardsByCategory(category: EcobetaRewardCategoryId): EcobetaReward[] {
  return ECOBETA_REWARDS.filter((reward) => reward.category === category);
}

/**
 * O que a procura devolve: as recompensas cujo nome, loja ou ingrediente casa com o que foi escrito.
 * A query é comparada sem acentos e em minúsculas, para que "pao" encontre "Pão" — o teclado do
 * telemóvel em Angola raramente tem o til à mão.
 */
export function searchRewards(query: string): EcobetaReward[] {
  const needle = normalize(query);
  if (!needle) return [];
  return ECOBETA_REWARDS.filter((reward) => {
    const store = storeById(reward.storeId)?.name ?? "";
    const haystack = [
      reward.name,
      store,
      categoryById(reward.category).title,
      ...reward.allergens.map((allergen) => allergen.label),
    ]
      .map(normalize)
      .join(" ");
    return haystack.includes(needle);
  });
}

/**
 * `normalize("T´shirts")` → `"tshirts"`. O `String.normalize` tira o til e os acentos presos à letra,
 * mas o acento agudo do desenho (`T´shirts`, U+00B4) é um carácter sozinho e não se decompõe — por
 * isso é removido à mão, senão "tshirt" não encontra o produto que o ecrã escreve "T´shirt".
 */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u00b4\u02b9\u0060]/g, "")
    .trim()
    .toLowerCase();
}
/* ── o que a folha do detalhe manda trocar ───────────────────────────────── */

export type EcobetaRewardValues = {
  rewardId: string;
  /** O tamanho escolhido nos chips; "" quando o produto não os tem. */
  size: string;
  /** Quantas unidades vão na mesma reserva — o stepper do bloco do carrinho. */
  quantity: number;
};

export type EcobetaRewardField = "rewardId" | "size" | "quantity";

export type EcobetaRewardFieldErrors = Partial<Record<EcobetaRewardField, string>>;

/**
 * Quantas unidades uma só reserva pode levar. A face do detalhe para no mesmo número, e a regra
 * confirma: o teto vive nos dois lados para que um ecrã redesenhado não consiga passar por cima.
 */
export const ECOBETA_MAX_REWARD_QUANTITY = 5;

/**
 * Uma reserva: o que foi trocado, por quanto e com que referência. É o que o botão "Adicionar ao
 * carrinho" produz, e o que faz o saldo descer — nenhuma tela escreve no saldo por ela mesma.
 */
export type EcobetaRewardRedemption = {
  id: string;
  rewardId: string;
  /** O nome do produto e a loja, copiados do catálogo para a reserva não depender dele depois. */
  reward: string;
  store: string;
  size: string;
  /** Quantas unidades foram reservadas. */
  quantity: number;
  /** Os pontos que a reserva tirou do saldo — o preço de uma unidade vezes a quantidade. */
  points: number;
  /** O estado que a face do detalhe escreve: reservada, à espera da loja. */
  status: "reservada";
  /** A referência que a loja lê ao entregar, derivada do id como no comprovativo do wallet. */
  reference: string;
  createdAt: string;
};

/** A mesma forma de erro das outras faces: a mensagem da regra e a de cada campo. */
export class EcobetaRewardsError extends Error {
  fieldErrors: EcobetaRewardFieldErrors;

  constructor(message: string, fieldErrors: EcobetaRewardFieldErrors = {}) {
    super(message);
    this.name = "EcobetaRewardsError";
    this.fieldErrors = fieldErrors;
  }
}

/** O que a face do detalhe precisa de saber para validar antes de mandar a reserva. */
export type EcobetaRewardBalance = {
  /** Os pontos do saldo da sessão, os mesmos que a carteira e a capa imprimem. */
  points: number;
};

/**
 * As regras da troca, todas locais: uma recusa que a pessoa pode resolver não depende de haver
 * serviço. A reserva só passa quando o produto existe, ainda está disponível, tem o tamanho que o
 * catálogo lhe dá, a quantidade está dentro do teto e o saldo chega para a total.
 */
export function validateReward(
  values: EcobetaRewardValues,
  balance: EcobetaRewardBalance,
): EcobetaRewardFieldErrors {
  const errors: EcobetaRewardFieldErrors = {};
  const reward = rewardById(values.rewardId);

  if (!reward) {
    errors.rewardId = "Esta recompensa já não está disponível.";
    return errors;
  }
  if (reward.status !== "Disponível") {
    errors.rewardId = "Esgotado por agora.";
    return errors;
  }
  if (reward.sizes.length > 0 && !reward.sizes.includes(values.size)) {
    errors.size = "Escolha um tamanho.";
  }

  const quantity = normalizeQuantity(values.quantity);
  if (quantity < 1 || quantity > ECOBETA_MAX_REWARD_QUANTITY) {
    errors.quantity = `Escolha de 1 a ${ECOBETA_MAX_REWARD_QUANTITY} unidades.`;
    return errors;
  }

  // O saldo é comparado contra o total, não contra uma unidade: é o total que vai sair dele.
  const total = totalPointsFor(reward, quantity);
  if (balance.points < total) {
    errors.rewardId = `Faltam ${formatShort(total - balance.points)} pts para esta recompensa.`;
  }

  return errors;
}

/** O preço de uma unidade vezes a quantidade — o número que sai do saldo e o que o ecrã imprime. */
export function totalPointsFor(reward: EcobetaReward, quantity: number): number {
  return reward.points * normalizeQuantity(quantity);
}

/** A quantidade tal como a regra a lê: inteira, e nunca menos do que uma unidade. */
function normalizeQuantity(quantity: number): number {
  return Math.max(1, Math.round(quantity));
}

/** `50` → `"50,00"`: a diferença que a recusa escreve, sem os milhares que `formatPoints` acrescenta. */
function formatShort(value: number): string {
  return value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── o único sítio onde estas faces falam com um serviço ──────────────────── */

/** O que o serviço pode responder. Tudo é opcional: o serviço é o dono da verdade. */
type EcobetaRewardServiceRedemption = {
  id?: string;
  rewardId?: string;
  reward?: string;
  store?: string;
  size?: string;
  quantity?: number;
  points?: number;
  status?: "reservada";
  reference?: string;
  createdAt?: string;
};

/**
 * Reserva uma recompensa. As regras correm nos dois modos e, com serviço, a resposta dele é a que
 * fica — uma tabela de pontos que mudou no servidor aparece aqui sem estas telas saberem dela.
 */
export async function redeemReward(
  values: EcobetaRewardValues,
  balance: EcobetaRewardBalance,
): Promise<EcobetaRewardRedemption> {
  const fieldErrors = validateReward(values, balance);
  if (Object.keys(fieldErrors).length > 0) {
    throw new EcobetaRewardsError("Verifique a recompensa indicada.", fieldErrors);
  }

  const reward = rewardById(values.rewardId) as EcobetaReward;
  const quantity = normalizeQuantity(values.quantity);
  const local = buildRedemption(reward, values.size, quantity);

  if (MYECOBETA_IS_LOCAL) return local;

  const payload = await post<EcobetaRewardServiceRedemption>("/rewards", {
    rewardId: local.rewardId,
    size: local.size,
    quantity: local.quantity,
    points: local.points,
    reference: local.reference,
  });

  return {
    id: payload.id ?? local.id,
    rewardId: payload.rewardId ?? local.rewardId,
    reward: payload.reward ?? local.reward,
    store: payload.store ?? local.store,
    size: payload.size ?? local.size,
    quantity: payload.quantity ?? local.quantity,
    points: payload.points ?? local.points,
    status: payload.status ?? local.status,
    reference: payload.reference ?? local.reference,
    createdAt: payload.createdAt ?? local.createdAt,
  };
}

/** O mesmo contrato das outras faces: um corpo `{ message, fieldErrors }` é respeitado. */
async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${MYECOBETA_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // A cookie de sessão é do serviço, não desta origem.
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new EcobetaRewardsError("Não foi possível contactar o serviço. Verifique a ligação.");
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; fieldErrors?: EcobetaRewardFieldErrors })
    | null;

  if (!response.ok || !payload) {
    throw new EcobetaRewardsError(
      payload?.message ?? "O serviço recusou a reserva. Tente novamente.",
      payload?.fieldErrors ?? {},
    );
  }

  return payload;
}
/** A reserva sem serviço: lida do catálogo, com a referência derivada do id como no comprovativo. */
function buildRedemption(
  reward: EcobetaReward,
  size: string,
  quantity: number,
): EcobetaRewardRedemption {
  const id = newRedemptionId();

  return {
    id,
    rewardId: reward.id,
    reward: reward.name,
    store: storeById(reward.storeId)?.name ?? "",
    size,
    quantity,
    points: totalPointsFor(reward, quantity),
    status: "reservada",
    reference: referenceFor(id),
    createdAt: new Date().toISOString(),
  };
}

/**
 * A referência que a loja lê ao entregar (e.g. `"01464788730"`): os mesmos 11 dígitos do
 * comprovativo do wallet, derivados do id da reserva, para a mesma reserva ter sempre a mesma
 * referência onde quer que apareça.
 */
export function referenceFor(id: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `014${String(Math.abs(hash) % 100_000_000).padStart(8, "0")}`;
}

function newRedemptionId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `ebr-${uuid}`;
  return `ebr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}