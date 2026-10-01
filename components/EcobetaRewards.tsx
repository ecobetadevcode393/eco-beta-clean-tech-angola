"use client";

/*
 * O marketplace verde, nas três leituras que a linha "Recompensas" do menu do perfil abre: os
 * produtos de uma loja parceira (EcobetaRewardsStores), a face de detalhe onde os pontos se trocam
 * (EcobetaRewardsDetail) e a procura que muda de loja (EcobetaRewardsSearch).
 *
 * São faces da folha de reciclagem, mas, como as do Ecoponto, o design trata cada uma como um ecrã
 * de telefone inteiro com cabeçalho próprio — por isso a folha esconde o seu e lhes dá a altura toda
 * (ver `REWARDS_VIEWS` em `EcobetaRecycling`). O material do desenho é mantido: o degradado pêssego
 * com que a capa abre, os cartões brancos de raio 24px com a sombra levantada, a pílula da categoria
 * com o contorno #DECFCF, o bloco #F0F5FA que o carrinho ocupa e o verde #00BF63 do botão. Onde o
 * desenho desenha vectores livres (os pictogramas dos ingredientes, o pin do mapa) entram o conjunto
 * de ícones que o resto da app já usa e as placas de placeholder que o próprio desenho aponta, para
 * que nenhum ecrã peça um ficheiro que o repositório não traz.
 */

import { useState, type ReactNode } from "react";
import {
  Apple,
  Bell,
  Carrot,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Minus,
  Nut,
  Plus,
  RefreshCw,
  Search,
  Sprout,
  Truck,
  Vegan,
} from "lucide-react";

import { formatPoints } from "@/lib/ecobetaRecycling";
import { formatMoment } from "@/lib/ecobetaWallet";
import {
  ECOBETA_MAX_REWARD_QUANTITY,
  ECOBETA_REWARDS,
  ECOBETA_REWARD_STORES,
  EcobetaRewardsError,
  categoryById,
  searchRewards,
  storeById,
  totalPointsFor,
  type EcobetaReward,
  type EcobetaRewardCategoryId,
} from "@/lib/ecobetaRewards";

/** Os valores do desenho, guardados ao lado dos ecrãs que os vestem. */
const INK = "#32343E";
const INK_DEEP = "#181C2E";
const MUTED = "#676767";
const SOFT = "#646982";
const FAINT = "#A0A5BA";
const BRAND_TEAL = "#0097B2";
const BRAND_GREEN = "#059C6A";
const CASH_GREEN = "#00BF63";
const ALERT = "#D20F0F";
const TILE_BG = "#F0F5FA";
const CARD_SHADOW = "12px 12px 30px rgba(150, 150, 154, 0.15)";
/** A placa que o desenho aponta para cada raster; o repositório não traz os renders. */
const PLACEHOLDER = "https://placehold.co";

/** O degradado pêssego com que as duas capas do desenho abrem. */
const SUNRISE =
  "linear-gradient(180deg, #FFE8D8 0%, rgba(255,255,255,0.40) 35%, rgba(255,255,255,0) 100%)";

/** O telefone em que o desenho autoriza cada ecrã: 375 de largura, o seu próprio interior. */
function Frame({ children, height = 812 }: { children: ReactNode; height?: number }) {
  return (
    <div className="relative w-full overflow-hidden bg-white" style={{ height }}>
      {children}
    </div>
  );
}

/** O botão circular de voltar que os ecrãs levam no canto superior esquerdo. */
function BackCircle({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Voltar"
      className="absolute left-[24px] top-[50px] z-10 grid h-[45px] w-[45px] place-items-center rounded-full transition-opacity hover:opacity-85"
      style={{ background: "#ECF0F4", color: INK_DEEP }}
    >
      <ChevronLeft className="h-[22px] w-[22px]" aria-hidden="true" />
    </button>
  );
}

/** A pílula da categoria no cabeçalho: o nome curto que o desenho põe ao lado do botão do QR. */
function CategoryPill({ category }: { category: EcobetaRewardCategoryId }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-[86px] top-[51px] grid h-[45px] w-[102px] place-items-center rounded-[33px] text-[12px] font-bold uppercase"
      style={{ border: "1px #DECFCF solid", color: INK_DEEP }}
    >
      {categoryById(category).pill}
    </span>
  );
}

/** O sino do canto direito, com o número que o desenho lhe põe. */
function BellBadge({ count }: { count: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute left-[303px] top-[54px] grid h-[45px] w-[45px] place-items-center rounded-full"
        style={{ background: INK_DEEP, color: "#FFFFFF" }}
      >
        <Bell className="h-[19px] w-[19px]" />
      </span>
      <span
        aria-hidden="true"
        className="absolute left-[322px] top-[49px] grid h-[25px] min-w-[25px] place-items-center rounded-full px-[5px] text-[15px] font-bold text-white"
        style={{ background: BRAND_TEAL }}
      >
        {count > 9 ? "9+" : count}
      </span>
    </>
  );
}

/**
 * A placa que o desenho aponta para o produto, dentro do cartão ou da face de detalhe. Uma loja sem
 * recompensas no catálogo não tem o que pintar: o desenho reserva ali um quadrado liso.
 */
function Art({ reward, className }: { reward: EcobetaReward | undefined; className?: string }) {
  if (!reward) return <span aria-hidden="true" className={className} />;

  return (
    <img
      src={`${PLACEHOLDER}/${reward.art}`}
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
    />
  );
}
/* ── os produtos de uma loja parceira ───────────────────────────────────── */

export type EcobetaRewardsStoresProps = {
  /** O saldo da sessão: a capa diz o que falta para trocar o que ainda não dá. */
  points: number;
  /** A categoria à vista — a que a linha "Recompensas" abre é a primeira. */
  category: EcobetaRewardCategoryId;
  /** De volta ao menu do perfil, um passo atrás. */
  onBack: () => void;
  /** Um cartão abre o detalhe da recompensa. */
  onOpenReward: (rewardId: string) => void;
  /** A lupa e a pílula da categoria levam à procura. */
  onOpenSearch: () => void;
};

/** A nota mais alta da capa, mostrada na calha de entrega como o desenho a mostra. */
const CAPA_RATING = 4.7;

export function EcobetaRewardsStores({
  points,
  category,
  onBack,
  onOpenReward,
  onOpenSearch,
}: EcobetaRewardsStoresProps) {
  const rewards = ECOBETA_REWARDS.filter((reward) => reward.category === category);
  const reading = categoryById(category);

  return (
    <Frame>
      {/* O amanhecer pêssego com que a capa abre. */}
      <span aria-hidden="true" className="absolute left-0 top-[-1px] h-[813px] w-[375px]" style={{ background: SUNRISE }} />

      <BackCircle onBack={onBack} />
      <CategoryPill category={category} />

      {/* A lupa que o desenho põe junto da pílula: abre a procura. */}
      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Procurar recompensas"
        className="absolute left-[249px] top-[50px] grid h-[46px] w-[46px] place-items-center rounded-full transition-opacity hover:opacity-85"
        style={{ background: "#121223", color: "#FFFFFF" }}
      >
        <Search className="h-[19px] w-[19px]" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Ver todas as lojas parceiras"
        className="absolute left-[305px] top-[50px] grid h-[46px] w-[46px] place-items-center rounded-full transition-opacity hover:opacity-85"
        style={{ background: "#ECF0F4", color: INK_DEEP }}
      >
        <RefreshCw className="h-[19px] w-[19px]" aria-hidden="true" />
      </button>

      <p className="absolute left-[24px] top-[120px] text-[20px] capitalize" style={{ color: INK }}>
        {reading.title}
      </p>

      {/* A grelha de cartões: dois à frente e o terceiro por baixo, como o desenho os dispõe. */}
      {rewards.map((reward, index) => {
        const positions = [
          "left-[24px] top-[218px]",
          "left-[198px] top-[218px]",
          "left-[24px] top-[411px]",
        ];
        const store = storeById(reward.storeId);
        return (
          <button
            key={reward.id}
            type="button"
            onClick={() => onOpenReward(reward.id)}
            aria-label={`${reward.name} · ${store?.name ?? ""} · ${formatPoints(reward.points)} pts`}
            className={`absolute h-[130px] w-[153px] rounded-[24px] bg-white p-[10px] text-left transition-opacity hover:opacity-95 ${
              positions[index % positions.length]
            }`}
            style={{ boxShadow: CARD_SHADOW }}
          >
            <Art reward={reward} className="mx-auto h-[86px] w-full object-contain" />
            <p className="mt-[2px] truncate text-[15px] font-bold capitalize" style={{ color: INK }}>
              {reward.name}
            </p>
            <p className="truncate text-[13px] capitalize" style={{ color: SOFT }}>
              {store?.name ?? ""}
            </p>
            <span className="absolute right-[12px] top-[104px] text-[16px]" style={{ color: BRAND_GREEN }}>
              {formatPoints(reward.points)} pts
            </span>
            {/* O ponto de estado que o desenho põe no canto do cartão. */}
            <span
              aria-hidden="true"
              className="absolute bottom-[14px] right-[14px] h-[12px] w-[12px] rounded-full"
              style={{ background: reward.status === "Disponível" ? BRAND_TEAL : FAINT }}
            />
          </button>
        );
      })}

      <p className="absolute left-[24px] top-[573px] text-[20px] capitalize" style={{ color: INK }}>
        {reading.hint}
      </p>
      <button
        type="button"
        onClick={onOpenSearch}
        className="absolute left-[261px] top-[518px] flex w-[81px] items-center justify-center gap-[4px] text-[16px]"
        style={{ color: "#333333" }}
      >
        Ver Todos
        <ChevronRight className="h-[12px] w-[12px]" style={{ color: FAINT }} aria-hidden="true" />
      </button>

      {/* A calha da entrega: o mapa que o desenho desenha e a linha de nota, custo e tempo. */}
      <span
        aria-hidden="true"
        className="absolute left-[24px] top-[613px] h-[140px] w-[327px] overflow-hidden rounded-[11px]"
        style={{ background: "#98A8B8" }}
      >
        <img src={`${PLACEHOLDER}/328x140`} alt="" className="h-full w-full object-cover" draggable={false} />
      </span>

      <p className="absolute left-[24px] top-[767px] text-[20px] capitalize" style={{ color: INK_DEEP }}>
        Entrega Disponível
      </p>
      <Truck className="absolute left-[103px] top-[800px] h-[18px] w-[23px]" style={{ color: BRAND_TEAL }} aria-hidden="true" />
      <p className="absolute left-[48px] top-[802px] text-[16px] font-bold" style={{ color: INK_DEEP }}>
        {CAPA_RATING}
      </p>
      <p className="absolute left-[136px] top-[801px] text-[14px]" style={{ color: INK_DEEP }}>
        Free
      </p>
      <Clock className="absolute left-[186px] top-[799px] h-[20px] w-[20px]" style={{ color: BRAND_TEAL }} aria-hidden="true" />
      <p className="absolute left-[215px] top-[801px] text-[14px]" style={{ color: INK_DEEP }}>
        1 h
      </p>

      {/* O saldo da sessão, a linha que diz se a troca de hoje é possível. */}
      <p className="absolute left-[24px] top-[828px] text-[13px] capitalize" style={{ color: MUTED }}>
        Meus pontos: {formatPoints(points)} pts
      </p>
    </Frame>
  );
}
/* ── o detalhe da recompensa ────────────────────────────────────────────── */

export type EcobetaRewardsDetailProps = {
  reward: EcobetaReward;
  /** O saldo da sessão: decide se o botão pode ser tocado e escreve o que falta. */
  points: number;
  /** De volta à capa da loja parceira, um passo atrás. */
  onBack: () => void;
  /**
   * Manda a reserva. A folha é que a escreve e é que tira os pontos do saldo — esta face só
   * pede e escreve a resposta, para que nenhum ecrã do marketplace mexa no saldo por si.
   */
  onAdd: (rewardId: string, size: string, quantity: number) => Promise<void>;
};

export function EcobetaRewardsDetail({ reward, points, onBack, onAdd }: EcobetaRewardsDetailProps) {
  /** O tamanho escolhido; o desenho abre no do meio, que é o que o cartão mostra. */
  const [size, setSize] = useState(reward.sizes[1] ?? reward.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  /** A linha de estado do botão: a recusa da regra, ou a reserva que foi feita. */
  const [notice, setNotice] = useState<{ tone: "alerta" | "ok"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const store = storeById(reward.storeId);
  /** O que a troca custa: o preço de uma unidade vezes a quantidade, o mesmo que sai do saldo. */
  const total = totalPointsFor(reward, quantity);
  const affordable = points >= total && reward.status === "Disponível";

  async function onSubmit() {
    if (pending) return;
    setPending(true);
    setNotice(null);

    try {
      await onAdd(reward.id, size, quantity);
      setNotice({
        tone: "ok",
        text: `${quantity > 1 ? `${quantity} reservados · ` : "Reservado · "}${size ? `tamanho ${size} · ` : ""}−${formatPoints(total)} pts`,
      });
    } catch (error) {
      // Uma recusa da regra traz a mensagem do campo; a do serviço traz a sua.
      const fieldMessages =
        error instanceof EcobetaRewardsError
          ? Object.values(error.fieldErrors).filter(Boolean)
          : [];
      setNotice({
        tone: "alerta",
        text:
          fieldMessages.length > 0
            ? fieldMessages.join(" ")
            : error instanceof Error
              ? error.message
              : "Algo falhou. Tente novamente.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Frame height={903}>
      <BackCircle onBack={onBack} />
      <p className="absolute left-[85px] top-[62px] text-[17px] leading-[22px]" style={{ color: INK_DEEP }}>
        Detalhes da Recompensa
      </p>

      {/* O render do produto, na moldura que o desenho lhe dá. */}
      <span
        aria-hidden="true"
        className="absolute left-[29px] top-[109px] h-[223px] w-[327px] overflow-hidden rounded-[32px]"
        style={{ background: "#98A8B8" }}
      >
        <Art reward={reward} className="h-full w-full object-cover" />
      </span>

      {/* A pílula da loja, com a marca dela ao lado. */}
      <span
        aria-hidden="true"
        className="absolute left-[24px] top-[347px] grid h-[47px] w-[201px] place-items-center rounded-[50px] text-[14px] capitalize"
        style={{ background: "#FFFFFF", border: "1px #E9E9E9 solid", color: INK_DEEP }}
      >
        <span className="flex items-center gap-[10px] pl-[10px]">
          <span className="h-[21px] w-[21px] rounded-full" style={{ background: BRAND_TEAL }} />
          {store?.name ?? ""}
        </span>
      </span>

      <p className="absolute left-[24px] top-[414px] text-[20px] font-bold capitalize" style={{ color: INK_DEEP }}>
        {reward.name}
      </p>
      <p className="absolute left-[24px] top-[445px] w-[307px] text-[14px] leading-[24px]" style={{ color: FAINT }}>
        {reward.description}
      </p>

      {/* A linha que o desenho põe sobre o título: nota, preço e tempo. */}
      <Truck className="absolute left-[24px] top-[513px] h-[18px] w-[23px]" style={{ color: BRAND_TEAL }} aria-hidden="true" />
      <p className="absolute left-[54px] top-[513px] text-[16px] font-bold" style={{ color: INK_DEEP }}>
        {reward.rating}
      </p>
      <p className="absolute left-[113px] top-[514px] text-[14px]" style={{ color: INK_DEEP }}>
        {reward.price}
      </p>
      <Clock className="absolute left-[212px] top-[513px] h-[20px] w-[20px]" style={{ color: BRAND_TEAL }} aria-hidden="true" />
      <p className="absolute left-[242px] top-[514px] text-[14px]" style={{ color: INK_DEEP }}>
        {reward.delivery === "Free" ? "20 min" : reward.delivery}
      </p>
{/* Os chips de tamanho: o escolhido é o que o desenho pinta de branco sobre teal. */}
      {reward.sizes.length > 0 ? (
        <>
          <p className="absolute left-[24px] top-[574px] text-[13px] uppercase" style={{ color: INK }}>
            Size:
          </p>
          {reward.sizes.map((option, index) => {
            const left = [88, 145, 204][index] ?? 204;
            const selected = option === size;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSize(option)}
                aria-pressed={selected}
                className="absolute top-[571px] h-[30px] w-[40px] text-center text-[16px]"
                style={{ left, color: selected ? "#FFFFFF" : "#121223" }}
              >
                {selected ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[15px]"
                    style={{ background: BRAND_TEAL }}
                  />
                ) : null}
                <span className="relative">{option}</span>
              </button>
            );
          })}
        </>
      ) : null}

      {/* A linha "contêm": os pictogramas que o desenho desenha um a um, em duas filas. */}
      {reward.allergens.length > 0 ? (
        <>
          <p className="absolute left-[24px] top-[627px] w-[85px] text-[13px] uppercase" style={{ color: INK }}>
            contêm
          </p>
          {reward.allergens.map((allergen, index) => (
            <span
              key={allergen.label}
              className="absolute w-[56px] text-center"
              style={{ left: 24 + (index % 4) * 69, top: 662 + Math.floor(index / 4) * 99 }}
            >
              <span
                aria-hidden="true"
                className="mx-auto grid h-[50px] w-[50px] place-items-center rounded-full"
                style={{ background: "#FFEBE4", color: "#FB6D3A" }}
              >
                <AllergenGlyph label={allergen.label} />
              </span>
              <span className="mt-[5px] block text-[12px] capitalize" style={{ color: "#747783" }}>
                {allergen.label}
                {allergen.allergy ? (
                  <span className="block text-[8px] capitalize" style={{ color: "#747783" }}>
                    (Alergy)
                  </span>
                ) : null}
              </span>
            </span>
          ))}
        </>
      ) : null}
{/* O bloco do carrinho: o que a troca custa, a quantidade e o botão verde. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-[719px] h-[184px] w-[375px]"
        style={{ background: TILE_BG, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      />

      <p className="absolute left-[24px] top-[746px] text-[28px]" style={{ color: INK_DEEP }}>
        {formatPoints(total)} pts
      </p>

      {/* A quantidade, nos dois controlos que o desenho põe à direita do preço. */}
      <div className="absolute left-[236px] top-[745px] flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          disabled={quantity <= 1}
          aria-label="Menos uma unidade"
          className="grid h-[32px] w-[32px] place-items-center rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: "#FFFFFF" }}
        >
          <Minus className="h-[15px] w-[15px]" style={{ color: INK_DEEP }} aria-hidden="true" />
        </button>
        <span className="w-[16px] text-center text-[16px] font-bold" style={{ color: INK_DEEP }}>
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((current) => Math.min(ECOBETA_MAX_REWARD_QUANTITY, current + 1))}
          disabled={quantity >= ECOBETA_MAX_REWARD_QUANTITY}
          aria-label="Mais uma unidade"
          className="grid h-[32px] w-[32px] place-items-center rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: "#FFFFFF" }}
        >
          <Plus className="h-[15px] w-[15px]" style={{ color: INK_DEEP }} aria-hidden="true" />
        </button>
      </div>

      {/*
        * A linha da troca: o que faltava antes de tocar, e depois a recusa ou a reserva que saiu
        * daqui. O botão não se desliga quando o saldo não chega — a regra escreve a razão, que é o
        * mesmo caminho que a carteira usa, e é mais útil do que um botão morto.
        */}
      <p
        role="status"
        className="absolute left-[24px] top-[786px] w-[327px] text-[12px] leading-[16px]"
        style={{ color: notice?.tone === "ok" ? BRAND_GREEN : ALERT }}
      >
        {notice?.text ??
          (!affordable && reward.status === "Disponível"
            ? `Faltam ${formatPoints(total - points)} pts para esta recompensa.`
            : "")}
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={pending || reward.status !== "Disponível"}
        className="absolute left-[24px] top-[811px] flex h-[62px] w-[327px] items-center justify-center gap-[10px] rounded-[12px] text-[16px] font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: CASH_GREEN }}
      >
        {pending ? <Loader2 className="h-[16px] w-[16px] animate-spin" aria-hidden="true" /> : null}
        {reward.status === "Disponível" ? "Adicionar ao carrinho" : "Esgotado"}
      </button>
    </Frame>
  );
}

/**
 * O pictograma de cada ingrediente. O desenho compõe os seus com dezenas de vectores soltos; aqui
 * entram os do conjunto que o resto da app já usa, com o mesmo laranja #FB6D3A no fundo #FFEBE4.
 */
function AllergenGlyph({ label }: { label: string }) {
  const icon = ALLERGEN_ICONS[label.toLowerCase()];
  const Icon = icon ?? Vegan;
  return <Icon className="h-[22px] w-[22px]" aria-hidden="true" />;
}

const ALLERGEN_ICONS: Record<string, typeof Vegan> = {
  sal: Vegan,
  onion: Sprout,
  garlic: Sprout,
  pappers: Carrot,
  ginger: Sprout,
  broccoli: Apple,
  orange: Apple,
  walnut: Nut,
};
/* ── a procura ──────────────────────────────────────────────────────────── */

export type EcobetaRewardsSearchProps = {
  /** De volta à capa das lojas parceiras, um passo atrás. */
  onBack: () => void;
  /** Um resultado abre o detalhe da recompensa. */
  onOpenReward: (rewardId: string) => void;
  /** Uma loja ou uma pesquisa recente abre a capa da sua categoria. */
  onOpenCategory: (category: EcobetaRewardCategoryId) => void;
};

/** As pesquisas recentes que o desenho põe em pílula por baixo da caixa. */
const RECENT_SEARCHES = [
  { label: "Pão", category: "padarias" as const },
  { label: "Água", category: "mercados" as const },
  { label: "T´shirt", category: "roupas" as const },
];

/** A recompensa que uma loja tem: a capa da loja mostra a primeira. */
function rewardsOfStore(storeId: string): EcobetaReward[] {
  return ECOBETA_REWARDS.filter((reward) => reward.storeId === storeId);
}

export function EcobetaRewardsSearch({ onBack, onOpenReward, onOpenCategory }: EcobetaRewardsSearchProps) {
  const [query, setQuery] = useState("");
  const results = searchRewards(query);

  return (
    <Frame height={903}>
      {/* O fundo #F0F5FA em que o desenho escreve a procura. */}
      <span aria-hidden="true" className="absolute inset-0" style={{ background: TILE_BG }} />

      <BackCircle onBack={onBack} />
      <p className="absolute left-[85px] top-[62px] text-[17px] leading-[22px]" style={{ color: INK_DEEP }}>
        Procurar
      </p>

      {/* O campo: o que a pessoa escreve manda a lista abaixo, como no desenho. */}
      <div
        className="absolute left-[24px] top-[123px] flex h-[62px] w-[327px] items-center gap-[12px] rounded-[10px] px-[14px]"
        style={{ background: "#FFFFFF" }}
      >
        <Search className="h-[20px] w-[20px] flex-none" style={{ color: FAINT }} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Procurar por produtos ou serviços..."
          aria-label="Procurar recompensas"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          style={{ color: INK_DEEP }}
        />
      </div>

      <BellBadge count={results.length} />

      <p className="absolute left-[24px] top-[209px] text-[20px] capitalize" style={{ color: INK }}>
        {query ? "Resultados" : "Pesquisas recentes"}
      </p>

      {query ? (
        <ul className="absolute left-[24px] top-[258px] w-[327px] space-y-[10px]">
          {results.length > 0 ? (
            results.map((reward) => (
              <li key={reward.id}>
                <button
                  type="button"
                  onClick={() => onOpenReward(reward.id)}
                  className="flex w-full items-center gap-[12px] rounded-[16px] p-[10px] text-left transition-opacity hover:opacity-90"
                  style={{ background: "#FFFFFF" }}
                >
                  <Art reward={reward} className="h-[48px] w-[48px] flex-none rounded-[10px] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] capitalize" style={{ color: INK }}>
                      {reward.name}
                    </span>
                    <span className="block truncate text-[13px] capitalize" style={{ color: SOFT }}>
                      {storeById(reward.storeId)?.name ?? ""}
                    </span>
                  </span>
                  <span className="flex-none text-[14px]" style={{ color: BRAND_GREEN }}>
                    {formatPoints(reward.points)} pts
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="rounded-[16px] p-[16px] text-[14px]" style={{ background: "#FFFFFF", color: MUTED }}>
              Nada encontrado para “{query}”. Tente “pão”, “água” ou “t´shirt”.
            </li>
          )}
        </ul>
      ) : (
        <>
          {/* As três pesquisas que o desenho mostra em pílula. */}
          <div className="absolute left-[24px] top-[245px] flex flex-wrap gap-[10px]">
            {RECENT_SEARCHES.map((recent) => (
              <button
                key={recent.label}
                type="button"
                onClick={() => onOpenCategory(recent.category)}
                className="flex h-[46px] items-center rounded-[33px] px-[20px] text-[16px] capitalize transition-opacity hover:opacity-85"
                style={{ border: "2px #EDEDED solid", color: INK_DEEP }}
              >
                {recent.label}
              </button>
            ))}
          </div>
          {/* A sugestão de lojas: as três que o desenho lista com a sua nota. */}
          <p className="absolute left-[24px] top-[323px] text-[20px] capitalize" style={{ color: INK }}>
            Sugestão de Lojas
          </p>
          {ECOBETA_REWARD_STORES.slice(0, 3).map((store, index) => (
            <button
              key={store.id}
              type="button"
              onClick={() => onOpenCategory(rewardsOfStore(store.id)[0]?.category ?? "padarias")}
              className="absolute left-[24px] flex w-[327px] items-center gap-[12px] border-b py-[10px] text-left transition-opacity hover:opacity-80"
              style={{ top: 352 + index * 79, borderColor: "#EBEBEB" }}
            >
              <span
                aria-hidden="true"
                className="grid h-[60px] w-[60px] flex-none place-items-center overflow-hidden rounded-[12px]"
                style={{ background: "#FFBF6D" }}
              >
                <Art reward={rewardsOfStore(store.id)[0]} className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] capitalize" style={{ color: INK }}>
                  {store.name}
                </span>
                <span className="block text-[16px]" style={{ color: INK_DEEP }}>
                  {store.rating}
                </span>
              </span>
            </button>
          ))}

          {/* O ranking que o desenho imprime com a data em que foi fechado. */}
          <p className="absolute left-[24px] top-[619px] text-[20px] capitalize" style={{ color: INK_DEEP }}>
            Ranking - {formatMoment(new Date().toISOString())}
          </p>
          {ECOBETA_REWARD_STORES.slice(3, 5).map((store, index) => (
            <button
              key={store.id}
              type="button"
              onClick={() => onOpenCategory(rewardsOfStore(store.id)[0]?.category ?? "padarias")}
              className="absolute flex h-[102px] items-center gap-[12px] rounded-[24px] p-[14px] text-left transition-opacity hover:opacity-90"
              style={{ left: 24 + index * 174, top: 696, width: 153, background: "#FFFFFF", boxShadow: CARD_SHADOW }}
            >
              <span
                aria-hidden="true"
                className="grid h-[60px] w-[60px] flex-none place-items-center overflow-hidden rounded-full"
                style={{ background: BRAND_TEAL }}
              >
                <Art reward={rewardsOfStore(store.id)[0]} className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold capitalize" style={{ color: INK }}>
                  {store.name}
                </span>
                <span className="block text-[13px] capitalize" style={{ color: SOFT }}>
                  {store.tier}
                </span>
              </span>
            </button>
          ))}
        </>
      )}
    </Frame>
  );
}