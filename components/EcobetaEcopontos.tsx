"use client";

/*
 * The Ecoponto flow, in the seven readings the profile menu's "Ecopontos" row reaches: the points
 * around the account (EcobetaEcopontoList), the search that narrows them (EcobetaEcopontoSearch),
 * one point read in full (EcobetaEcopontoDetail), the route laid to it (EcobetaEcopontoRoute), the
 * same route once an agent has picked it up (EcobetaEcopontoAgentRoute), the call being placed to
 * that agent (EcobetaEcopontoCall), and the thread that follows it (EcobetaEcopontoMessages).
 *
 * They are faces of the recycling sheet, but unlike the sheet's other faces they draw their own
 * chrome: the design authors each one as a whole phone screen, header and all, so the sheet hands
 * them the full height and steps out of their way (see `ECOPONTO_VIEWS` in `EcobetaRecycling`). The
 * design's own material is kept — the peach gradient the list opens on, the white cards with their
 * 24px radius and lifted shadow, the #F0F5FA block the search and the thread are typed into, the
 * teal/red the statuses wear, and the dark #121223 call pill. Where the design draws free-standing
 * vector art (the map, the produce glyphs) it is stood in for by the icon set the rest of the app
 * already uses and by the placeholder tiles the design itself points at, so no screen asks for an
 * asset the repository does not carry.
 */

import type { ReactNode } from "react";
import {
  Apple,
  Bell,
  Carrot,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  MapPin,
  MessageCircle,
  MicOff,
  Nut,
  Pencil,
  Phone,
  PhoneOff,
  QrCode,
  Search,
  Send,
  Snowflake,
  Sprout,
  Vegan,
  Volume2,
} from "lucide-react";

/** The design's values, kept beside the screens that wear them. */
const INK = "#32343E";
const INK_DEEP = "#181C2E";
const MUTED = "#646982";
const FAINT = "#A0A5BA";
const BRAND_TEAL = "#0097B2";
const BRAND_GREEN = "#059C6A";
const ALERT = "#D20F0F";
const FIELD_BG = "#F0F5FA";
const CARD_SHADOW = "12px 12px 30px rgba(150, 150, 154, 0.15)";
/** The long placeholder the design references for every raster it draws, kept in one place. */
const PLACEHOLDER = "https://placehold.co";

/** Deployment subpath, needed by every URL this module points at. See next.config.ts. */
const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/*
 * The FPC-ECO pictures the cards and the map markers wear. They are the products the landing page
 * already ships — the same renders its grid lists under `public/landing-pages/inner-green-assets/`
 * — so the sheet never asks for an asset the repository does not carry. Every screen reads its
 * picture from here, which is what makes swapping in a different render a one-line change: point
 * the constant at the new file (e.g. drop the authored cut-outs in `public/ecopontos/` and use
 * `${PUBLIC_BASE_PATH}/ecopontos/fpc-eco-h10.png`) and the cards, the markers and the detail
 * screen all follow at once.
 */
const ECOPONTO_ART_BASE = `${PUBLIC_BASE_PATH}/landing-pages/inner-green-assets`;
const ECOPONTO_ART = {
  /** FPC ECO SERIES H10 PRO — the campus/market flagship. */
  h10pro: `${ECOPONTO_ART_BASE}/prod-h10pro.svg`,
  /** FPC ECO SERIES EPSON — the compact, high-capacity unit. */
  epson: `${ECOPONTO_ART_BASE}/prod-epson.svg`,
  /** FPC ECO NGOLO — the institutional/teaching unit. */
  ngolo: `${ECOPONTO_ART_BASE}/prod-ngolo.svg`,
  /** FPC ECO AVENTOR — the connected urban unit. */
  aventor: `${ECOPONTO_ART_BASE}/prod-aventor.svg`,
} as const;

/** The phone frame every screen is authored in: 375 wide, its own chrome inside. */
function Frame({ children, height = 812 }: { children: ReactNode; height?: number }) {
  return (
    <div className="relative w-full overflow-hidden bg-white" style={{ height }}>
      {children}
    </div>
  );
}

/**
 * The circular back control the screens carry at their top-left. The design draws it as a chevron
 * in a soft circle; the screens that open over the dark call backdrop wear it dark instead.
 */
function BackCircle({ onBack, tone = "light" }: { onBack: () => void; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Voltar"
      className="absolute left-[24px] top-[50px] z-10 grid h-[45px] w-[45px] place-items-center rounded-full transition-opacity hover:opacity-85"
      style={{ background: dark ? "#212029" : "#ECF0F4", color: dark ? "#FFFFFF" : INK_DEEP }}
    >
      <ChevronLeft className="h-[22px] w-[22px]" aria-hidden="true" />
    </button>
  );
}

/* ── the points near the account ──────────────────────────────────────── */

export type EcobetaEcopontoListProps = {
  /** Back to the profile menu, one step out. */
  onBack: () => void;
  /** A card (or the QR pill) opens the point it names. */
  onOpenPoint: () => void;
  /** The magnifier in the header opens the search face. */
  onOpenSearch: () => void;
};

/**
 * The three points the design lays around the account, in the places it puts them, each carrying
 * the FPC-ECO render that goes on its card.
 */
const HOME_POINTS = [
  {
    id: "ipil",
    name: "FPC-ECO IPIL",
    place: "Instituto Politécnico Industrial de Luanda",
    status: "Disponível" as const,
    dot: "#2790C3",
    art: ECOPONTO_ART.ngolo,
    left: 198,
    top: 218,
  },
  {
    id: "uma",
    name: "FPC-ECO UMA",
    place: "Universidade Metodista de Angola",
    status: "Fechado" as const,
    dot: ALERT,
    art: ECOPONTO_ART.aventor,
    left: 24,
    top: 411,
  },
  {
    id: "kikolo",
    name: "FPC-ECO KIKOLO",
    place: "Mercado KIKOLO",
    status: "Disponível" as const,
    dot: BRAND_TEAL,
    art: ECOPONTO_ART.epson,
    left: 198,
    top: 411,
  },
];

export function EcobetaEcopontoList({ onBack, onOpenPoint, onOpenSearch }: EcobetaEcopontoListProps) {
  return (
    <Frame>
      {/* The peach sunrise the list opens on, and the map trough it settles into. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-[-1px] h-[813px] w-[375px]"
        style={{
          background:
            "linear-gradient(180deg, #FFE8D8 0%, rgba(255,255,255,0.40) 35%, rgba(255,255,255,0) 100%)",
        }}
      />

      <BackCircle onBack={onBack} />

      {/* The title pill, the QR shortcut, and the refresh the design keeps beside them. */}
      <span
        aria-hidden="true"
        className="absolute left-[86px] top-[51px] grid h-[45px] w-[102px] place-items-center rounded-[33px] text-[12px] font-bold uppercase"
        style={{ border: "1px #DECFCF solid", color: INK_DEEP }}
      >
        FPC-ECO
      </span>
      <button
        type="button"
        onClick={onOpenPoint}
        aria-label="Ler código QR do ecoponto"
        className="absolute left-[249px] top-[50px] grid h-[46px] w-[46px] place-items-center rounded-full transition-opacity hover:opacity-85"
        style={{ background: "#121223" }}
      >
        <QrCode className="h-[20px] w-[20px] text-white" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Procurar ecopontos"
        className="absolute left-[305px] top-[50px] grid h-[46px] w-[46px] place-items-center rounded-full transition-opacity hover:opacity-85"
        style={{ background: "#ECF0F4", color: INK_DEEP }}
      >
        <Search className="h-[19px] w-[19px]" aria-hidden="true" />
      </button>

      <p className="absolute left-[24px] top-[120px] text-[20px] capitalize" style={{ color: INK }}>
        FPC-ECO
      </p>
      <p className="absolute left-[12px] top-[186px] text-[10px] capitalize" style={{ color: "#FF3326" }}>
        Os FPCs são disponibilizados,
        <br /> pela sua localização atual.
      </p>

      {HOME_POINTS.map((point) => (
        <button
          key={point.id}
          type="button"
          onClick={onOpenPoint}
          className="absolute h-[130px] w-[153px] rounded-[24px] bg-white text-left transition-transform hover:-translate-y-[2px]"
          style={{ left: point.left, top: point.top, boxShadow: CARD_SHADOW }}
        >
          {/*
            The card now carries the unit's own picture, so the type steps down from the design's
            original 15/13/14px to make room for it while keeping the three readings distinct: the
            model name stays the anchor at 12px bold, the address — the longest string on the card,
            "Instituto Politécnico Industrial de Luanda" — drops to 10px and clamps to two lines so
            it can never run under the status, and the status sits at 11px, one step above the
            address because it is the card's verdict rather than its detail. The 44x64 thumb keeps
            the unit legible at the card's 153px width without pushing the text block past the two
            lines it needs above the status.
          */}
          <span
            aria-hidden="true"
            className="absolute left-[12px] top-[12px] grid h-[64px] w-[44px] place-items-center overflow-hidden rounded-[10px]"
            style={{ background: FIELD_BG }}
          >
            <img src={point.art} alt="" className="h-full w-full object-contain" draggable={false} />
          </span>
          <span className="absolute left-[62px] top-[15px] block w-[79px]">
            <span
              className="line-clamp-2 block text-[12px] font-bold capitalize leading-[1.15]"
              style={{ color: INK }}
            >
              {point.name}
            </span>
            <span
              className="mt-[3px] line-clamp-2 block text-[10px] capitalize leading-[1.25]"
              style={{ color: MUTED }}
            >
              {point.place}
            </span>
          </span>
          <span
            className="absolute bottom-[14px] left-[12px] text-[11px] capitalize"
            style={{ color: point.status === "Disponível" ? BRAND_GREEN : ALERT }}
          >
            {point.status}
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-[14px] right-[14px] h-[18px] w-[18px] rounded-full"
            style={{ background: point.dot }}
          />
        </button>
      ))}

      {/* The trough the design parks the located point in, with the artwork it references. */}
      <p className="absolute left-[24px] top-[573px] text-[20px] capitalize" style={{ color: INK }}>
        FPC-ECO Disponível
      </p>
      <span
        aria-hidden="true"
        className="absolute left-[24px] top-[613px] h-[140px] w-[327px] overflow-hidden rounded-[11px]"
        style={{ background: "#98A8B8" }}
      >
        <img src={`${PLACEHOLDER}/328x140`} alt="" className="h-full w-full object-cover" draggable={false} />
      </span>

      {/* The two unit cut-outs the design floats over the map, taken from the same artwork set. */}
      <img
        src={ECOPONTO_ART.ngolo}
        alt=""
        aria-hidden="true"
        className="absolute left-[66px] top-[354px] h-[102px] w-[69px] object-contain"
        draggable={false}
      />
      <img
        src={ECOPONTO_ART.epson}
        alt=""
        aria-hidden="true"
        className="absolute left-[247px] top-[156px] h-[102px] w-[52px] object-contain"
        draggable={false}
      />
    </Frame>
  );
}

/* ── the search ───────────────────────────────────────────────────────── */

export type EcobetaEcopontoSearchProps = {
  /** Back to the list of points, one step out. */
  onBack: () => void;
  /** A suggestion row opens the point it names. */
  onOpenPoint: () => void;
};

/** The suggestions the design lists under the filters, with the note each one carries. */
const SUGGESTIONS = [
  { id: "ipil", name: "FPC-ECO IPIL", place: "Instituto Politécnico", value: "5.0", status: "Disponível" as const, art: ECOPONTO_ART.ngolo, top: 352, sep: 431 },
  { id: "uma", name: "FPC-ECO UMA", place: "Universidade Metodista", value: "5.0", status: "Fechado" as const, art: ECOPONTO_ART.aventor, top: 437, sep: 509 },
  { id: "kikolo", name: "FPC-ECO KIKOLO", place: "Mercado KIKOLO", value: "1.0", status: "Disponível" as const, art: ECOPONTO_ART.epson, top: 514, sep: 587 },
];

export function EcobetaEcopontoSearch({ onBack, onOpenPoint }: EcobetaEcopontoSearchProps) {
  return (
    <Frame>
      <BackCircle onBack={onBack} />

      <p className="absolute left-[85px] top-[62px] text-[17px] leading-[22px]" style={{ color: INK_DEEP }}>
        Procurar
      </p>

      {/* The bell the design keeps at the right, with its count. */}
      <span
        aria-hidden="true"
        className="absolute left-[303px] top-[51px] grid h-[45px] w-[45px] place-items-center rounded-full"
        style={{ background: "#181C2E", color: "#FFFFFF" }}
      >
        <Bell className="h-[19px] w-[19px]" aria-hidden="true" />
      </span>
      <span
        aria-hidden="true"
        className="absolute left-[322px] top-[46px] grid h-[25px] w-[25px] place-items-center rounded-full text-[15px] font-bold text-white"
        style={{ background: BRAND_TEAL }}
      >
        2
      </span>

      {/* The field, seeded with the standing search the design types in. */}
      <div
        className="absolute left-[24px] top-[123px] flex h-[62px] w-[327px] items-center gap-[12px] rounded-[10px] px-[20px]"
        style={{ background: "#F6F6F6" }}
      >
        <Search className="h-[20px] w-[20px] flex-none" style={{ color: FAINT }} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[14px]" style={{ color: INK_DEEP }}>
          Ecoponto <span style={{ color: MUTED }}>da Kikolo</span>
        </span>
        <button
          type="button"
          onClick={onBack}
          aria-label="Limpar pesquisa"
          className="grid h-[20px] w-[20px] flex-none place-items-center rounded-full transition-opacity hover:opacity-85"
          style={{ background: "#CDCDCF" }}
        >
          <ChevronRight className="h-[12px] w-[12px] rotate-45 text-white" aria-hidden="true" />
        </button>
      </div>

      <p className="absolute left-[25px] top-[205px] text-[20px] capitalize" style={{ color: INK }}>
        Pesquisas recentes
      </p>

      {/* The two filters the design pairs under the heading. */}
      <span
        aria-hidden="true"
        className="absolute left-[24px] top-[245px] grid h-[46px] w-[89px] place-items-center rounded-[33px] text-[16px]"
        style={{ outline: "2px #EDEDED solid", outlineOffset: "-1px", color: INK_DEEP }}
      >
        Fechados
      </span>
      <span
        aria-hidden="true"
        className="absolute left-[123px] top-[245px] grid h-[46px] w-[102px] place-items-center rounded-[33px] text-[16px]"
        style={{ outline: "2px #EDEDED solid", outlineOffset: "-1px", color: INK_DEEP }}
      >
        Disponível
      </span>

      <p className="absolute left-[30px] top-[323px] text-[20px] capitalize" style={{ color: INK }}>
        Sugestão de Ecopontos
      </p>

      {/* The suggestions, each with the round map thumb the design gives it and the separator
          under it. Tapping one opens the point it names. */}
      {SUGGESTIONS.map((row) => (
        <div key={row.id}>
          <button
            type="button"
            onClick={onOpenPoint}
            className="absolute left-[18px] flex h-[67px] w-[339px] items-center gap-[14px] text-left"
            style={{ top: row.top }}
          >
            <span
              aria-hidden="true"
              className="grid h-[67px] w-[67px] flex-none place-items-center overflow-hidden rounded-full"
              style={{ background: FIELD_BG }}
            >
              <img src={row.art} alt="" className="h-full w-full object-contain" draggable={false} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px]" style={{ color: INK }}>
                {row.name}
              </span>
              <span className="mt-[2px] block text-[16px]" style={{ color: INK_DEEP }}>
                {row.value}
                <span className="ml-[8px] text-[13px]" style={{ color: MUTED }}>
                  {row.place}
                </span>
              </span>
            </span>
            <span
              className="flex-none text-[16px] capitalize"
              style={{ color: row.status === "Disponível" ? BRAND_GREEN : ALERT }}
            >
              {row.status}
            </span>
          </button>
          <span
            aria-hidden="true"
            className="absolute left-[30px] w-[326px]"
            style={{ top: row.sep, borderTop: "1px #EBEBEB solid" }}
          />
        </div>
      ))}

      {/* The two leaders the design keeps under the suggestions. */}
      <p className="absolute left-[24px] top-[619px] text-[20px] capitalize" style={{ color: INK_DEEP }}>
        Ranking - 19 / 08 / 2025
      </p>
      {[
        { id: "adelia", name: "Adelia Vela", plan: "eCO WARRIOR 1.5", left: 24 },
        { id: "joao", name: "João Catumbila", plan: "ECO START 1.0", left: 198 },
      ].map((lead) => (
        <span
          key={lead.id}
          className="absolute h-[102px] w-[153px] rounded-[24px] bg-white px-[12px] pt-[40px]"
          style={{ left: lead.left, top: 712, boxShadow: CARD_SHADOW }}
        >
          <span className="block truncate text-[15px] font-bold capitalize" style={{ color: INK }}>
            {lead.name}
          </span>
          <span className="mt-[4px] block truncate text-[13px] capitalize" style={{ color: MUTED }}>
            {lead.plan}
          </span>
        </span>
      ))}
    </Frame>
  );
}

/* ── one point read in full ───────────────────────────────────────────── */

export type EcobetaEcopontoDetailProps = {
  /** Back to the list of points, one step out. */
  onBack: () => void;
  /** The green button opens the route face. */
  onShowRoute: () => void;
};

/** The two columns of "RESTRIÇÃO", as the design draws them, glyphs stood in for by the icon set. */
const DETAIL_RESTRICTIONS: { id: string; label: string; icon: typeof Apple; tint: string }[] = [
  { id: "salt", label: "Salt", icon: Snowflake, tint: "#0097B2" },
  { id: "onion", label: "onion", icon: Vegan, tint: "#0097B2" },
  { id: "garlic", label: "Garlic", icon: Sprout, tint: "#0097B2" },
  { id: "pappers", label: "Pappers", icon: Flame, tint: "#0097B2" },
  { id: "ginger", label: "Ginger", icon: Carrot, tint: "#FB6D3A" },
  { id: "broccoli", label: "Broccoli", icon: Vegan, tint: "#FB6D3A" },
  { id: "orange", label: "Orange", icon: Apple, tint: "#FB6D3A" },
  { id: "walnut", label: "Walnut", icon: Nut, tint: "#FB6D3A" },
];

export function EcobetaEcopontoDetail({ onBack, onShowRoute }: EcobetaEcopontoDetailProps) {
  return (
    <Frame height={903}>
      <BackCircle onBack={onBack} />

      <p className="absolute left-[85px] top-[62px] text-[17px] leading-[22px]" style={{ color: INK_DEEP }}>
        Detalhes da FPC-ECO H10
      </p>

      {/* The point's own portrait, the place it stands in, and the one-line brief. */}
      <img
        src={ECOPONTO_ART.h10pro}
        alt="FPC-ECO IPIL"
        className="absolute left-[121px] top-[86px] h-[263px] w-[135px] object-contain"
        draggable={false}
      />
      <span
        className="absolute left-[24px] top-[347px] flex h-[47px] w-[317px] items-center gap-[14px] rounded-[50px] bg-white px-[18px]"
        style={{ border: "1px #E9E9E9 solid" }}
      >
        <Apple className="h-[21px] w-[21px] flex-none" style={{ color: INK_DEEP }} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[10px] capitalize" style={{ color: INK_DEEP }}>
          INSTITUTO POLITÉCNICO INDUSTRIAL DE LUANDA
        </span>
      </span>

      <p className="absolute left-[24px] top-[414px] text-[20px] font-bold capitalize" style={{ color: INK_DEEP }}>
        FPC-ECO IPIL
      </p>
      <p
        className="absolute left-[24px] top-[445px] w-[307px] text-[14px] leading-[24px]"
        style={{ color: FAINT }}
      >
        Direcionado para estudantes do ensino médio, focado nas suas necessidades básicas.
      </p>

      <p className="absolute left-[54px] top-[514px] text-[16px] font-bold" style={{ color: INK_DEEP }}>
        5.5
      </p>
      <Clock className="absolute left-[198px] top-[512px] h-[20px] w-[20px]" style={{ color: BRAND_TEAL }} aria-hidden="true" />
      <p className="absolute left-[231px] top-[514px] text-[14px]" style={{ color: INK_DEEP }}>
        Aberto: 08 até 15h
      </p>

      {/* Capacity, read across the three bins the point carries, and the materials it takes. */}
      <p className="absolute left-[24px] top-[574px] text-[10px] uppercase tracking-[0.2px]" style={{ color: INK }}>
        Capacidade
      </p>
      <p className="absolute left-[130px] top-[574px] text-[16px]" style={{ color: "#121223" }}>
        10”
      </p>
      <p className="absolute left-[210px] top-[574px] text-[16px]" style={{ color: INK_DEEP }}>
        14”
      </p>
      <p className="absolute left-[306px] top-[577px] text-[16px]" style={{ color: "#121223" }}>
        16”
      </p>
      <span className="absolute left-[133px] top-[596px] text-[10px] capitalize" style={{ color: "#FF3326" }}>
        Metal
      </span>
      <span className="absolute left-[215px] top-[596px] text-[10px] capitalize" style={{ color: "#FF3326" }}>
        Plástico
      </span>
      <span className="absolute left-[305px] top-[596px] text-[10px] capitalize" style={{ color: "#FF3326" }}>
        Papel
      </span>

      {/* The restriction, in the two rows the design lays it out in. */}
      <p className="absolute left-[24px] top-[626px] text-[13px] uppercase tracking-[0.26px]" style={{ color: INK }}>
        Restrição
      </p>
      <Sprout className="absolute left-[24px] top-[640px] h-[20px] w-[20px]" style={{ color: "#FF3326" }} aria-hidden="true" />
      <span className="absolute left-[52px] top-[642px] text-[10px] capitalize" style={{ color: "#FF3326" }}>
        Apenas alunos do IPIL, IMEL.
      </span>

      {[
        { items: DETAIL_RESTRICTIONS.slice(0, 4), top: 668, bg: "rgba(0,151,178,0.19)" },
        { items: DETAIL_RESTRICTIONS.slice(4, 8), top: 767, bg: "#FFEBE4" },
      ].map((group) => (
        <div key={group.top}>
          {group.items.map((item, index) => {
            const Icon = item.icon;
            const left = 24 + index * 69;
            return (
              <div key={item.id}>
                <span
                  aria-hidden="true"
                  className="absolute grid h-[50px] w-[50px] place-items-center rounded-full"
                  style={{ left, top: group.top, background: group.bg }}
                >
                  <Icon className="h-[22px] w-[22px]" style={{ color: item.tint }} />
                </span>
                <span
                  className="absolute w-[58px] text-center text-[12px]"
                  style={{ left: left - 4, top: group.top + 56, color: MUTED }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {/* The sheet the design pins to the foot, carrying the balance and the way to the route. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-[719px] h-[184px] w-full rounded-t-[24px]"
        style={{ background: FIELD_BG }}
      />
      <p className="absolute left-[24px] top-[746px] text-[20px] capitalize" style={{ color: INK_DEEP }}>
        Pontos Disponível: <span style={{ color: "#00BF63" }}>100.000</span> pts
      </p>
      <button
        type="button"
        onClick={onShowRoute}
        className="absolute left-[24px] top-[811px] grid h-[62px] w-[327px] place-items-center rounded-[12px] text-[16px] font-bold uppercase text-white transition-opacity hover:opacity-90"
        style={{ background: "#00BF63" }}
      >
        Mostrar caminho
      </button>
    </Frame>
  );
}

/* ── the route to the point (courier) ─────────────────────────────────── */

export type EcobetaEcopontoRouteProps = {
  /** Back to the point, one step out. */
  onBack: () => void;
  /** The courier card's phone button places the call. */
  onCall: () => void;
  /** The courier card's chat button opens the thread. */
  onMessage: () => void;
};

/** The four beats the design reads the delivery in, with the two the courier has already met. */
const ROUTE_STEPS = [
  { id: "received", text: "Your order has been received", textTop: 925.5, circleTop: 925, done: true },
  { id: "preparing", text: "The restaurant is preparing your food", textTop: 973.53, circleTop: 971.71, done: true },
  { id: "picked", text: "Your order has been picked up for delivery", textTop: 1020, circleTop: 1018.56, done: false },
  { id: "arriving", text: "Order arriving soon!", textTop: 1066.8, circleTop: 1065.36, done: false },
];

export function EcobetaEcopontoRoute({ onBack, onCall, onMessage }: EcobetaEcopontoRouteProps) {
  return (
    <Frame height={1240}>
      {/* The map the design draws as a hundred vector paths, kept as the tile it points at, with
          the route it highlights laid over it. */}
      <span aria-hidden="true" className="absolute left-0 top-0 h-[655px] w-full overflow-hidden">
        <img src={`${PLACEHOLDER}/375x655`} alt="" className="h-full w-full object-cover" draggable={false} />
      </span>
      <span
        aria-hidden="true"
        className="absolute left-[66px] top-[184px] h-[256px] w-[213px] rounded-[12px]"
        style={{ outline: "6px #FFC22C solid", outlineOffset: "-3px" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[259px] top-[174px] h-[18px] w-[18px] rounded-full bg-white"
        style={{ border: "4px #FFB800 solid" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[35px] top-[417px] grid h-[62px] w-[62px] place-items-center rounded-full"
        style={{ background: "#F14237" }}
      >
        <MapPin className="h-[26px] w-[26px] text-white" />
      </span>

      <BackCircle onBack={onBack} tone="dark" />
      <p className="absolute left-[85px] top-[61px] text-[15px] leading-[22px]" style={{ color: INK_DEEP }}>
        CAMINHO PARA FPC-ECO H10
      </p>

      {/* The sheet that covers the map, from the grab handle down. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-[655px] h-[585px] w-full rounded-t-[24px] bg-white"
        style={{ boxShadow: "0 -2px 40px rgba(58, 119, 153, 0.15)" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[152px] top-[661px] h-[7px] w-[70px] rounded-[80px]"
        style={{ background: "#D8E3ED" }}
      />

      <img
        src={ECOPONTO_ART.ngolo}
        alt=""
        aria-hidden="true"
        className="absolute left-[21px] top-[669px] h-[117px] w-[60px] object-contain"
        draggable={false}
      />
      <p className="absolute left-[102px] top-[693px] text-[20px] font-bold capitalize" style={{ color: INK_DEEP }}>
        FPC-ECO IPIL
      </p>
      <Clock className="absolute left-[94px] top-[721px] h-[20px] w-[20px]" style={{ color: BRAND_TEAL }} aria-hidden="true" />
      <p className="absolute left-[127px] top-[723px] text-[14px]" style={{ color: INK_DEEP }}>
        Aberto: 08 até 15h
      </p>
      <p className="absolute left-[106px] top-[745px] text-[24px] capitalize" style={{ color: BRAND_GREEN }}>
        Disponível
      </p>

      <p className="absolute left-[137px] top-[831px] text-[30px] font-extrabold" style={{ color: INK_DEEP }}>
        20 min
      </p>
      <p className="absolute left-[90px] top-[865px] text-[14px] uppercase leading-[24px]" style={{ color: FAINT }}>
        Estimated delivery time
      </p>

      {/* The delivery timeline, the finished beats in orange with their tick, the rest in grey. */}
      {ROUTE_STEPS.map((step, index) => {
        const next = ROUTE_STEPS[index + 1];
        return (
          <div key={step.id}>
            <span
              aria-hidden="true"
              className="absolute left-[24px] grid h-[17px] w-[17px] place-items-center rounded-full"
              style={{ top: step.circleTop, background: step.done ? "#FF7622" : "#BFBCBA" }}
            >
              <Check className="h-[9px] w-[9px] text-white" />
            </span>
            <p
              className="absolute left-[54px] text-[13px] leading-[1.5]"
              style={{ top: step.textTop, color: step.done ? "#FF7622" : FAINT }}
            >
              {step.text}
            </p>
            {next ? (
              <span
                aria-hidden="true"
                className="absolute left-[32px] w-[1px]"
                style={{
                  top: step.circleTop + 17,
                  height: next.circleTop - (step.circleTop + 17),
                  background: step.done && next.done ? "#FF7622" : "#A0A5BA",
                }}
              />
            ) : null}
          </div>
        );
      })}

      {/* The courier card the design seats at the foot, with the two ways to reach him. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-[1113px] h-[116px] w-full rounded-t-[24px] bg-white"
        style={{ border: "1px #E8E8E8 solid" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[32px] top-[1143px] h-[54px] w-[54px] overflow-hidden rounded-full"
        style={{ background: "#C4C4C4" }}
      >
        <img src={`${PLACEHOLDER}/54x54`} alt="" className="h-full w-full object-cover" draggable={false} />
      </span>
      <p className="absolute left-[97px] top-[1145px] text-[20px] font-bold capitalize" style={{ color: INK_DEEP }}>
        Robert F.
      </p>
      <p className="absolute left-[97px] top-[1167px] text-[14px] leading-[24px]" style={{ color: FAINT }}>
        Courier
      </p>
      <button
        type="button"
        onClick={onCall}
        aria-label="Ligar ao estafeta"
        className="absolute left-[237px] top-[1149px] grid h-[45px] w-[45px] place-items-center rounded-full transition-opacity hover:opacity-85"
        style={{ background: "#FF7622" }}
      >
        <Phone className="h-[20px] w-[20px] text-white" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onMessage}
        aria-label="Enviar mensagem ao estafeta"
        className="absolute left-[297px] top-[1149px] grid h-[45px] w-[45px] place-items-center rounded-full bg-white transition-colors hover:bg-[#FFF2E9]"
        style={{ border: "1px #FF7622 solid" }}
      >
        <MessageCircle className="h-[20px] w-[20px]" style={{ color: "#FF7622" }} aria-hidden="true" />
      </button>
    </Frame>
  );
}

/* ── the route to the point (agent) ───────────────────────────────────── */

export type EcobetaEcopontoAgentRouteProps = {
  /** Back to the courier's reading of the route, one step out. */
  onBack: () => void;
  /** The agent card's phone button places the call. */
  onCall: () => void;
  /** The agent card's chat button opens the thread. */
  onMessage: () => void;
};

/** The four beats of the deposit, from waiting on the waste to the points landing. */
const AGENT_STEPS = [
  { id: "waiting", text: "Estamos a aguardar o seu resíduo", textTop: 510.5, circleTop: 510, active: true },
  { id: "contact", text: "Entre em contato com o Agente Eco Ipil", textTop: 558.53, circleTop: 556.71, active: true },
  { id: "confirm", text: "Confirme seu depósito", textTop: 605, circleTop: 603.56, active: false },
  { id: "points", text: "Receba seus pontos ECO", textTop: 651.8, circleTop: 650.36, active: false },
];

export function EcobetaEcopontoAgentRoute({ onBack, onCall, onMessage }: EcobetaEcopontoAgentRouteProps) {
  return (
    <Frame height={820}>
      <span aria-hidden="true" className="absolute left-0 top-0 h-[240px] w-full overflow-hidden">
        <img src={`${PLACEHOLDER}/375x240`} alt="" className="h-full w-full object-cover" draggable={false} />
      </span>
      <span
        aria-hidden="true"
        className="absolute left-[66px] top-[185px] h-[256px] w-[213px] rounded-[12px]"
        style={{ outline: "6px #FFA800 solid", outlineOffset: "-3px" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[226px] top-[142px] h-[84px] w-[84px] rounded-full"
        style={{ background: "rgba(255,194,36,0.10)", border: "0.5px #FF8F0B solid" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[237px] top-[153px] h-[62px] w-[62px] rounded-full"
        style={{ background: "rgba(255,194,36,0.60)", border: "2px #FF8F0B solid" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[259px] top-[175px] h-[18px] w-[18px] rounded-full bg-white"
        style={{ border: "4px #FFB800 solid" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[35px] top-[418px] grid h-[62px] w-[62px] place-items-center rounded-full"
        style={{ background: "#F14237" }}
      >
        <MapPin className="h-[26px] w-[26px] text-white" />
      </span>

      <BackCircle onBack={onBack} tone="dark" />
      <p className="absolute left-[80px] top-[58px] text-[15px] leading-[22px]" style={{ color: INK_DEEP }}>
        CAMINHO PARA FPC-ECO H10
      </p>

      {/* The sheet, this time starting high enough to read the point and the agent together. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-[240px] h-[580px] w-full rounded-t-[24px] bg-white"
        style={{ boxShadow: "0 -2px 40px rgba(58, 119, 153, 0.15)" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[152px] top-[246px] h-[7px] w-[70px] rounded-[80px]"
        style={{ background: "#D8E3ED" }}
      />

      <img
        src={ECOPONTO_ART.ngolo}
        alt=""
        aria-hidden="true"
        className="absolute left-[51px] top-[290px] h-[117px] w-[60px] object-contain"
        draggable={false}
      />
      <p className="absolute left-[141px] top-[290px] text-[20px] font-bold capitalize" style={{ color: INK_DEEP }}>
        FPC-ECO IPIL
      </p>
      <Clock className="absolute left-[141px] top-[322px] h-[20px] w-[20px]" style={{ color: BRAND_TEAL }} aria-hidden="true" />
      <p className="absolute left-[166px] top-[324px] text-[14px]" style={{ color: INK_DEEP }}>
        Aberto: 08 até 15h
      </p>
      <p className="absolute left-[141px] top-[346px] text-[24px] capitalize" style={{ color: BRAND_GREEN }}>
        Disponível
      </p>

      <p className="absolute left-[137px] top-[416px] text-[30px] font-extrabold" style={{ color: INK_DEEP }}>
        20 min
      </p>
      <p className="absolute left-[39px] top-[450px] text-[14px] uppercase leading-[24px]" style={{ color: FAINT }}>
        Tempo estimado para chegar no ponto
      </p>

      {/* The deposit timeline: the first line teal, the rest grey, and the connectors to match. */}
      {AGENT_STEPS.map((step, index) => {
        const next = AGENT_STEPS[index + 1];
        return (
          <div key={step.id}>
            <span
              aria-hidden="true"
              className="absolute left-[24px] grid h-[17px] w-[17px] place-items-center rounded-full"
              style={{ top: step.circleTop, background: step.active ? "#FF7622" : "#BFBCBA" }}
            >
              <Check className="h-[9px] w-[9px] text-white" />
            </span>
            <p
              className="absolute left-[54px] text-[13px] leading-[1.5]"
              style={{ top: step.textTop, color: index === 0 ? BRAND_TEAL : FAINT }}
            >
              {step.text}
            </p>
            {next ? (
              <span
                aria-hidden="true"
                className="absolute left-[32px] w-[1px]"
                style={{
                  top: step.circleTop + 17,
                  height: next.circleTop - (step.circleTop + 17),
                  background: index === 0 ? "#FF7622" : "#A0A5BA",
                }}
              />
            ) : null}
          </div>
        );
      })}

      {/* The agent card the design seats at the foot, in the green the app already wears. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-[698px] h-[116px] w-full rounded-t-[24px] bg-white"
        style={{ border: "1px #E8E8E8 solid" }}
      />
      <span
        aria-hidden="true"
        className="absolute left-[19px] top-[724px] h-[54px] w-[54px] overflow-hidden rounded-full"
        style={{ background: "#C4C4C4" }}
      >
        <img src={`${PLACEHOLDER}/54x54`} alt="" className="h-full w-full object-cover" draggable={false} />
      </span>
      <p className="absolute left-[91px] top-[704px] text-[20px] font-bold capitalize" style={{ color: INK_DEEP }}>
        João Catumbila
      </p>
      <p className="absolute left-[97px] top-[752px] text-[14px] leading-[24px]" style={{ color: FAINT }}>
        Agente
      </p>
      <button
        type="button"
        onClick={onCall}
        aria-label="Ligar ao agente"
        className="absolute left-[237px] top-[734px] grid h-[45px] w-[45px] place-items-center rounded-full transition-opacity hover:opacity-85"
        style={{ background: "#00BF63" }}
      >
        <Phone className="h-[20px] w-[20px] text-white" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onMessage}
        aria-label="Enviar mensagem ao agente"
        className="absolute left-[297px] top-[735px] grid h-[45px] w-[45px] place-items-center rounded-full bg-white transition-colors hover:bg-[#EAFBF2]"
        style={{ border: "1px #00BF63 solid" }}
      >
        <MessageCircle className="h-[20px] w-[20px]" style={{ color: "#00BF63" }} aria-hidden="true" />
      </button>
    </Frame>
  );
}

/* ── the call being placed ────────────────────────────────────────────── */

export type EcobetaEcopontoCallProps = {
  /** The red button ends the call and hands the agent's route back. */
  onEnd: () => void;
};

export function EcobetaEcopontoCall({ onEnd }: EcobetaEcopontoCallProps) {
  return (
    <Frame>
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#121223]">
        <img src={`${PLACEHOLDER}/375x812`} alt="" className="h-full w-full object-cover" draggable={false} />
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "rgba(38.96, 62.90, 85, 0.67)" }}
      />

      {/* The sheet the design raises over the call, with the caller it names. */}
      <span aria-hidden="true" className="absolute left-0 top-[483px] h-[329px] w-full rounded-t-[24px] bg-white" />
      <span
        aria-hidden="true"
        className="absolute left-[135px] top-[507px] h-[105px] w-[105px] overflow-hidden rounded-full"
        style={{ background: "#C4C4C4" }}
      >
        <img src={`${PLACEHOLDER}/105x105`} alt="" className="h-full w-full object-cover" draggable={false} />
      </span>
      <p
        className="absolute left-0 top-[622px] w-full text-center text-[20px] font-bold capitalize"
        style={{ color: INK_DEEP }}
      >
        João Catumbila
      </p>
      <p className="absolute left-0 top-[656px] w-full text-center text-[16px]" style={{ color: "#979797" }}>
        Conectando.......
      </p>

      {/* The three controls the design pairs under the name: mute, end, and the speaker. */}
      <span
        aria-hidden="true"
        className="absolute left-[52px] top-[762px] grid h-[48px] w-[48px] place-items-center rounded-full"
        style={{ background: "#ECF0F4" }}
      >
        <MicOff className="h-[22px] w-[22px]" style={{ color: INK_DEEP }} />
      </span>
      <button
        type="button"
        onClick={onEnd}
        aria-label="Terminar chamada"
        className="absolute left-[157px] top-[732px] grid h-[60px] w-[60px] place-items-center rounded-full transition-opacity hover:opacity-90"
        style={{ background: "#FF3434" }}
      >
        <PhoneOff className="h-[26px] w-[26px] text-white" aria-hidden="true" />
      </button>
      <span
        aria-hidden="true"
        className="absolute left-[275px] top-[762px] grid h-[48px] w-[48px] place-items-center rounded-full"
        style={{ background: "#ECF0F4" }}
      >
        <Volume2 className="h-[22px] w-[22px]" style={{ color: INK_DEEP }} />
      </span>
    </Frame>
  );
}

/* ── the thread with the agent ────────────────────────────────────────── */

export type EcobetaEcopontoMessagesProps = {
  /** Back to the call, one step out. */
  onBack: () => void;
};

/** The exchange the design prints, oldest first, with the side each line is spoken from. */
const THREAD = [
  { id: 1, side: "me", text: "Estas a caminho?", time: "8:10 pm" },
  { id: 2, side: "them", text: "Sim, estou...", time: "8:11 pm" },
  { id: 3, side: "me", text: "Muito bem, onde estas agora?", time: "8:11 pm" },
  { id: 4, side: "them", text: "Frente ao cine Atlântico", time: "8:12 pm" },
  { id: 5, side: "me", text: "Aguarde por mim.", time: "8:12 pm" },
] as const;

export function EcobetaEcopontoMessages({ onBack }: EcobetaEcopontoMessagesProps) {
  return (
    <Frame>
      <BackCircle onBack={onBack} />
      <p className="absolute left-[85px] top-[62px] text-[17px] leading-[22px]" style={{ color: INK_DEEP }}>
        JOÃO CATUMBILA
      </p>

      {/* The thread, each line on its own side with the speaker's avatar beside it. */}
      <div className="absolute left-[24px] top-[112px] flex w-[327px] flex-col gap-[18px]">
        {THREAD.map((line) => {
          const mine = line.side === "me";
          return (
            <div key={line.id} className={mine ? "flex flex-col items-end" : "flex flex-col items-start"}>
              <span className="text-[12px] leading-[15px]" style={{ color: "#ABABAB" }}>
                {line.time}
              </span>
              <div className={`mt-[6px] flex items-end gap-[10px] ${mine ? "flex-row" : "flex-row-reverse"}`}>
                <span
                  aria-hidden="true"
                  className="h-[40px] w-[40px] flex-none overflow-hidden rounded-full"
                  style={{ background: "#C4C4C4" }}
                >
                  <img src={`${PLACEHOLDER}/40x40`} alt="" className="h-full w-full object-cover" draggable={false} />
                </span>
                <span
                  className="max-w-[218px] rounded-[10px] px-[16px] py-[14px] text-[14px] leading-[1.4]"
                  style={{ background: mine ? "#00BF63" : FIELD_BG, color: mine ? "#FFFFFF" : INK }}
                >
                  {line.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* The composer the design seats at the foot, with its send. */}
      <div
        className="absolute left-[24px] top-[720px] flex h-[62px] w-[327px] items-center gap-[14px] rounded-[12px] px-[20px]"
        style={{ background: FIELD_BG }}
      >
        <Pencil className="h-[18px] w-[18px] flex-none" style={{ color: "#AFAFB0" }} aria-hidden="true" />
        <input
          aria-label="Escrever mensagem"
          placeholder="Escreva uma mensagem"
          className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#ABABAB]"
          style={{ color: INK }}
        />
      </div>
      <span
        aria-hidden="true"
        className="absolute left-[289px] top-[732px] grid h-[42px] w-[42px] place-items-center rounded-full bg-white"
      >
        <Send className="h-[20px] w-[20px]" style={{ color: "#00BF63" }} />
      </span>
    </Frame>
  );
}
