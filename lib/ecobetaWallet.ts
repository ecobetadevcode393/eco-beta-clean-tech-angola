/**
 * A carteira digital: what the points are worth in kwanzas, and every levantamento made against
 * that balance.
 *
 * Same shape as `lib/ecobetaRecycling.ts` and `lib/ecobetaProfile.ts`, and for the same reason:
 * the site is a static export with no server at runtime, so the screen works with whatever the
 * deployment points it at. `NEXT_PUBLIC_MYECOBETA_API_URL` is that seam:
 *
 *   - set it and `POST <URL>/wallet/cashouts` answers with the levantamento — its value, its
 *     reference and the code read at the ATM — and `POST <URL>/wallet/cashouts/verify` answers
 *     with the state of one;
 *   - leave it unset and the levantamento is built here and kept in memory for the session only,
 *     which is what the GitHub Pages deployment does today.
 *
 * The rules live here rather than inside the screens so they are readable in one place, and so
 * the balance on the wallet face, the total a levantamento prints and the numbers the receipt
 * carries cannot disagree with each other.
 */

import { MYECOBETA_API_URL, MYECOBETA_IS_LOCAL } from "@/lib/myecobetaAuth";
import { formatPoints, type EcobetaRecyclingEntry } from "@/lib/ecobetaRecycling";

/* ── the wallet's own numbers ─────────────────────────────────────────── */

/**
 * What one point is worth when it is swapped for kwanzas, and the rate the receipt prints under
 * "taxa de conversão". The design's own arithmetic: 10.000,00 pts read as 5.000,00 Kz.
 */
export const ECOBETA_KWANZA_PER_POINT = 0.5;

/**
 * How long a generated code stays usable. Past it the levantamento reads "expirado" and the ATM
 * refuses the code, which is the second of the two states the design draws a card for.
 */
export const ECOBETA_CODE_VALIDITY_MINUTES = 30;

/** The smallest levantamento the wallet takes, in kwanzas: an ATM pays in whole notes. */
export const MIN_CASHOUT_KWANZA = 1000;

/** The line the code card prints, and the wallet's way in when the code will not take. */
export const ECOBETA_WALLET_SERVICE_LINE = "*666*77900*12#";

/** The wallet's policy, named the way the design names it on the code card. */
export const ECOBETA_WALLET_POLICY = "Policy_Eco_Pay";

/** The entity the money leaves from, printed on the receipt. */
export const ECOBETA_ENTITY = "ECO BETA COMÉRCIO E SERVIÇOS, LDA";

/** What the receipt calls the swap, under "operação" and under "tipo de troca". */
export const ECOBETA_CASHOUT_OPERATION = "CONVERSÃO DE PONTOS EM KWANZAS";
export const ECOBETA_CASHOUT_KIND = "PONTOS POR KWANZAS";

/** Who the receipt is signed by; the design names this address. */
export const ECOBETA_SIGNER = "ECOBETA.INC@OUTLOOK.COM";

/** The support lines the receipt carries in its footer, as the design prints them. */
export const ECOBETA_SUPPORT_PHONES = "(+244) 946 526 301 | 975 104 206";

/** The 11-digit Multicaixa reference prefix, written in one place. */
const REFERENCE_PREFIX = "014";

/**
 * The PIN that travels with the code — the ATM's own PIN. The service owns the real one, and this
 * is what stands in for it offline, which is why it is a named constant rather than a literal.
 */
const CASHOUT_PIN = "111";

/**
 * The campaign names the design's own history rows carry. During the week the rate is the plain
 * one; the weekend and the named campaigns are the ones an ecoponto announces, so the names live
 * here and the rule that picks them is the calendar's — with the service free to name a campaign
 * of its own in its answer (see `cashoutFromPayload`).
 */
export const ECOBETA_CAMPAIGNS = {
  weekday: "Dia Normal",
  saturday: "Campanha Normal - 10×2,0",
  sunday: "Fim de Semana 10×1,5",
  /** A window rather than a day of the week, so only a service answer names this one. */
  named: "SEMANA MALUCA 10×1,5×2,0",
} as const;

/* ── what a levantamento is ───────────────────────────────────────────── */

/**
 * The state a code card reads. "carregando" is not one of them: the card shows that reading while
 * the request is in flight, because a stored state meaning "waiting" would lie the moment the
 * answer arrived.
 */
export type EcobetaWalletStatus = "activo" | "expirado";

export type EcobetaWalletCashout = {
  id: string;
  /** The points this swap took out of the balance. */
  points: number;
  /** What they were worth, before the fee. */
  kwanza: number;
  /** What the swap cost, in kwanzas. Zero unless the service charges for it. */
  feeKwanza: number;
  /** What lands in the person's hand. */
  netKwanza: number;
  /**
   * The weight of the residue the swapped points came from: the ledger's own average rate applied
   * to the points this levantamento took, so the line the design prints under the date is the
   * material behind the money rather than a number invented for it.
   */
  weightKg: number;
  /** The campaign the points were earned under, as the history rows name it. */
  campaign: string;
  /** What the person copies: `#666*77500*1#`. */
  reference: string;
  /** The 13 digits read at the ATM. */
  code: string;
  pin: string;
  /** The state the service answered with; `statusOf` is what the screens read. */
  status: EcobetaWalletStatus;
  /** When the code stops being usable. */
  expiresAt: string;
  createdAt: string;
  entity: string;
  /** The transaction's own number, printed on the receipt. */
  transaction: string;
};

/** The balance a levantamento is validated against, and priced from. */
export type EcobetaWalletBalance = {
  points: number;
  /** The ledger behind the balance; the weight a levantamento reports comes from it. */
  entries: readonly EcobetaRecyclingEntry[];
};

/** What a typed amount asks for, and what it costs. */
export type EcobetaWalletQuote = {
  kwanza: number;
  points: number;
  feeKwanza: number;
  netKwanza: number;
};

/* ── what the form hands over ─────────────────────────────────────────── */

/**
 * The amount stays text all the way to the rules: "5.000" and "5000" are both the person's to
 * type, and the field is not a number input for exactly that reason.
 */
export type EcobetaWalletValues = { amount: string };

export type EcobetaWalletField = "amount";
export type EcobetaWalletFieldErrors = Partial<Record<EcobetaWalletField, string>>;

/**
 * One error shape for the screen, whether the rejection came from the rules below or from the
 * service, mirroring `EcobetaRecyclingError` and `EcobetaProfileError`.
 */
export class EcobetaWalletError extends Error {
  readonly fieldErrors: EcobetaWalletFieldErrors;

  constructor(message: string, fieldErrors: EcobetaWalletFieldErrors = {}) {
    super(message);
    this.name = "EcobetaWalletError";
    this.fieldErrors = fieldErrors;
  }
}

/* ── the rules ────────────────────────────────────────────────────────── */

/**
 * Reads the field back as whole kwanzas. Grouping dots are accepted — "5.000" is how money is
 * written in Angola — but a decimal mark is not: the ATM pays whole notes, so a fractional amount
 * is refused rather than rounded behind the person's back.
 */
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(/\./g, "");
  if (!/^\d+$/.test(normalized)) return null;

  const amount = Number(normalized);
  return Number.isFinite(amount) && Number.isInteger(amount) ? amount : null;
}

/** What an amount costs in points, to the cent of a point. */
export function pointsForKwanza(kwanza: number): number {
  if (ECOBETA_KWANZA_PER_POINT <= 0) return 0;
  return Math.round((kwanza / ECOBETA_KWANZA_PER_POINT) * 100) / 100;
}

/** What a balance is worth, in kwanzas. */
export function kwanzaFor(points: number): number {
  return Math.round(points * ECOBETA_KWANZA_PER_POINT * 100) / 100;
}

/**
 * What a typed amount asks for. The fee is the one thing this build cannot know: it is the
 * service's to charge, so it is zero here and whatever the answer says when there is a service.
 */
export function quoteFor(amountKz: number): EcobetaWalletQuote {
  const feeKwanza = 0;
  return { kwanza: amountKz, points: pointsForKwanza(amountKz), feeKwanza, netKwanza: amountKz - feeKwanza };
}

/**
 * The residue behind a balance: the ledger's own average rate, so the weight a levantamento
 * reports is the one the points were actually earned from. A ledger with nothing in it, or one
 * whose entries weigh nothing, reports no weight rather than a made-up one.
 */
export function weightBehind(points: number, entries: readonly EcobetaRecyclingEntry[]): number {
  const totalPoints = entries.reduce((sum, entry) => sum + entry.points, 0);
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weightKg, 0);
  if (totalPoints <= 0 || totalWeight <= 0 || points <= 0) return 0;

  const earned = (points / totalPoints) * totalWeight;
  return Math.round(Math.min(earned, totalWeight) * 100) / 100;
}

export function validateCashout(
  { amount }: EcobetaWalletValues,
  balance: EcobetaWalletBalance,
): EcobetaWalletFieldErrors {
  const errors: EcobetaWalletFieldErrors = {};
  const kwanza = parseAmount(amount);
  const available = kwanzaFor(balance.points);

  if (!amount.trim()) errors.amount = "Informe o valor que deseja retirar.";
  else if (kwanza === null) errors.amount = "Use um valor inteiro em kwanzas, por exemplo 5.000.";
  else if (kwanza < MIN_CASHOUT_KWANZA) {
    errors.amount = `O levantamento mínimo é de ${formatKwanza(MIN_CASHOUT_KWANZA)}.`;
  } else if (kwanza > available) {
    // The refusal names the balance: a refusal without the number it refused against is a refusal
    // the person has to guess at.
    errors.amount = `Só tem ${formatPoints(balance.points)} pts (${formatKwanza(available)}). Peça um valor dentro do saldo.`;
  }

  return errors;
}

/**
 * The state the screens read. The calendar has the last word after the service answered: a code
 * that was usable when the answer came reads "expirado" once its window has passed.
 */
export function statusOf(cashout: EcobetaWalletCashout, now: number = Date.now()): EcobetaWalletStatus {
  if (cashout.status === "expirado") return "expirado";

  const expires = Date.parse(cashout.expiresAt);
  return Number.isFinite(expires) && now > expires ? "expirado" : "activo";
}

/* ── numbers and dates as they are read in Angola ─────────────────────── */

/** `5000` → `"5.000,00 Kz"`. Grouped exactly the way the points are, so the two agree on screen. */
export function formatKwanza(value: number): string {
  return `${formatPoints(value)} Kz`;
}

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JULH", "AGO", "SET", "OUT", "NOV", "DEZ"] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** An ISO stamp → `"2026.07.13 12:30:13"`, the stamp the receipt prints. */
export function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** An ISO stamp → `"13 JULH, 12:30"`, the line the history rows carry. */
export function formatMoment(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getHours()}:${pad(date.getMinutes())}`;
}

/* ── the comprovativo a levantamento prints ───────────────────────────── */

/**
 * The lines the receipt's footer carries on every comprovativo. Named here rather than in the view
 * that prints them because they are the company's own standing text — the same on every receipt —
 * while everything else the sheet prints is read off the levantamento it belongs to.
 */
export const ECOBETA_RECEIPT_MOTTO = "TRANSFORMANDO RESÍDUOS EM OPORTUNIDADES. USE O ECO BETA";
export const ECOBETA_RECEIPT_COMPANY = "ECO BETA COMÉRCIO E SERVIÇOS, LDA | TODOS PARA TODOS";
export const ECOBETA_RECEIPT_HELP_LINE =
  "CASO NECESSITE DE OBTER ALGUMA INFORMAÇÃO, CONTACTE POR FAVOR A NOSSA LINHA DE APOIO ECO BETA TEAMS 24/7";

/**
 * Everything the comprovativo prints, read off the levantamento so the receipt and the code it
 * belongs to cannot disagree: same reference, same points, same moment, same transaction number.
 */
export type EcobetaReceipt = {
  reference: string;
  /** `"2026.07.13 12:30:13"`, the same stamp the code card prints next to its window. */
  dateTime: string;
  operation: string;
  entity: string;
  transactionNumber: string;
  /** What lands in the person's hand, before any cent is rounded away. */
  amountKwanza: number;
  /** What one point bought, printed under "taxa de conversão". */
  conversionRate: number;
  exchangeType: string;
  points: number;
  /** Who the receipt is signed by, and the moment of the signature. */
  signedBy: string;
  signedAt: string;
};

/** A levantamento → the comprovativo it prints. */
export function receiptFor(cashout: EcobetaWalletCashout): EcobetaReceipt {
  const cleanRef = cashout.reference.startsWith("#")
    ? referenceFor(1, cashout.id)
    : cashout.reference;

  return {
    reference: cleanRef,
    dateTime: formatStamp(cashout.createdAt),
    operation: ECOBETA_CASHOUT_OPERATION,
    entity: cashout.entity || ECOBETA_ENTITY,
    transactionNumber: cashout.transaction,
    amountKwanza: cashout.netKwanza,
    conversionRate: ECOBETA_KWANZA_PER_POINT,
    exchangeType: ECOBETA_CASHOUT_KIND,
    points: cashout.points,
    signedBy: ECOBETA_SIGNER,
    signedAt: `${formatStamp(cashout.createdAt)} WAT`,
  };
}

/* ── the campaign a levantamento was earned under ─────────────────────── */

export function campaignFor(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return ECOBETA_CAMPAIGNS.weekday;

  const day = date.getDay();
  if (day === 0) return ECOBETA_CAMPAIGNS.sunday;
  if (day === 6) return ECOBETA_CAMPAIGNS.saturday;
  return ECOBETA_CAMPAIGNS.weekday;
}

/* ── the only place this screen talks to a service ────────────────────── */

/** What the service may answer with. Everything in it is optional: the service is the boss. */
type EcobetaWalletServiceCashout = {
  id?: string;
  points?: number;
  kwanza?: number;
  feeKwanza?: number;
  netKwanza?: number;
  weightKg?: number;
  campaign?: string;
  reference?: string;
  code?: string;
  pin?: string;
  status?: EcobetaWalletStatus;
  expiresAt?: string;
  createdAt?: string;
  entity?: string;
  transaction?: string;
};

/**
 * Asks for a levantamento. The rules run in both modes — a refusal the person can act on does not
 * depend on there being a service — and the service's own answer wins where it has a field, so a
 * fee or a validity window that changed there is reflected here without the screens knowing it.
 */
export async function requestCashout(
  values: EcobetaWalletValues,
  balance: EcobetaWalletBalance,
  sequence: number,
): Promise<EcobetaWalletCashout> {
  const fieldErrors = validateCashout(values, balance);
  if (Object.keys(fieldErrors).length > 0) {
    throw new EcobetaWalletError("Verifique o valor indicado.", fieldErrors);
  }

  const amount = parseAmount(values.amount) as number;
  const createdAt = new Date().toISOString();
  const local = buildCashout({ quote: quoteFor(amount), balance, sequence, createdAt });

  if (MYECOBETA_IS_LOCAL) return local;

  const payload = await post<EcobetaWalletServiceCashout>("/wallet/cashouts", {
    amountKz: amount,
    points: local.points,
    reference: local.reference,
  });

  return cashoutFromPayload(payload, local);
}

/**
 * Asks whether a code is still usable. Without a service the calendar answers, which is what the
 * code's own validity window is for; with one the service has the last word, so a code it has
 * already seen used reads "expirado" even inside its window.
 */
export async function verifyCashout(cashout: EcobetaWalletCashout): Promise<EcobetaWalletStatus> {
  if (MYECOBETA_IS_LOCAL) return statusOf(cashout);

  const payload = await post<{ status?: EcobetaWalletStatus }>("/wallet/cashouts/verify", {
    id: cashout.id,
    reference: cashout.reference,
  });

  return payload.status ?? statusOf(cashout);
}

/** The same contract as the other screens' requests: a `{ message, fieldErrors }` body is honoured. */
async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${MYECOBETA_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The session cookie belongs to the service, not to this origin.
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new EcobetaWalletError("Não foi possível contactar o serviço. Verifique a ligação.");
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; fieldErrors?: EcobetaWalletFieldErrors })
    | null;

  if (!response.ok || !payload) {
    throw new EcobetaWalletError(
      payload?.message ?? "O serviço recusou o levantamento. Tente novamente.",
      payload?.fieldErrors ?? {},
    );
  }

  return payload;
}

/* ── building one ─────────────────────────────────────────────────────── */

function buildCashout({
  quote,
  balance,
  sequence,
  createdAt,
}: {
  quote: EcobetaWalletQuote;
  balance: EcobetaWalletBalance;
  sequence: number;
  createdAt: string;
}): EcobetaWalletCashout {
  const id = newCashoutId();
  const expiresAt = new Date(
    Date.parse(createdAt) + ECOBETA_CODE_VALIDITY_MINUTES * 60_000,
  ).toISOString();

  return {
    id,
    points: quote.points,
    kwanza: quote.kwanza,
    feeKwanza: quote.feeKwanza,
    netKwanza: quote.netKwanza,
    weightKg: weightBehind(quote.points, balance.entries),
    campaign: campaignFor(createdAt),
    reference: referenceFor(sequence, id),
    code: codeFor(id),
    pin: CASHOUT_PIN,
    status: "activo",
    expiresAt,
    createdAt,
    entity: ECOBETA_ENTITY,
    transaction: transactionFor(id),
  };
}

/** The service's answer wins where it has a field; everything else is the local reading. */
function cashoutFromPayload(
  payload: EcobetaWalletServiceCashout,
  local: EcobetaWalletCashout,
): EcobetaWalletCashout {
  return {
    id: payload.id ?? local.id,
    points: payload.points ?? local.points,
    kwanza: payload.kwanza ?? local.kwanza,
    feeKwanza: payload.feeKwanza ?? local.feeKwanza,
    netKwanza: payload.netKwanza ?? local.netKwanza,
    weightKg: payload.weightKg ?? local.weightKg,
    campaign: payload.campaign ?? local.campaign,
    reference: payload.reference ?? local.reference,
    code: payload.code ?? local.code,
    pin: payload.pin ?? local.pin,
    status: payload.status ?? local.status,
    expiresAt: payload.expiresAt ?? local.expiresAt,
    createdAt: payload.createdAt ?? local.createdAt,
    entity: payload.entity ?? local.entity,
    transaction: payload.transaction ?? local.transaction,
  };
}

/**
 * The reference the wallet prints and copies: an 11-digit Multicaixa number (e.g.
 * `"01464788730"`). Where the levantamento has its own id it is derived from it, so the same
 * levantamento keeps the same reference wherever it is shown.
 */
export function referenceFor(sequence: number, id?: string): string {
  if (id) {
    const num = Math.abs(hash(id)) % 100_000_000;
    return `${REFERENCE_PREFIX}${String(num).padStart(8, "0")}`;
  }
  if (sequence === 1) return "01464788730";
  return `${REFERENCE_PREFIX}${String(Math.abs(hash(`seq:${sequence}`)) % 100_000_000).padStart(8, "0")}`;
}

/*
 * The code and the transaction number are derived from the levantamento's own id, the way
 * `accountCode` is derived from the address: the same levantamento keeps the same numbers
 * wherever it is shown, without a directory to ask, and the service is free to answer with its own.
 */

function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193) >>> 0;
  }
  return result;
}

/** The 13 digits read at the ATM. */
function codeFor(id: string): string {
  const head = String(hash(id)).padStart(10, "0");
  const tail = String(hash(`${id}:tail`) % 1000).padStart(3, "0");
  return `${head}${tail}`.slice(0, 13);
}

/** The transaction's own number, printed on the receipt. */
function transactionFor(id: string): string {
  return String(hash(`${id}:tx`) % 10_000_000).padStart(7, "0");
}

function newCashoutId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `ebw-${uuid}`;
  return `ebw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

