"use client";

/*
 * The Carteira Digital, in the four readings the design has: the wallet itself (Wallet), the
 * levantamentos made against it (WalletHistory), one of them in detail with the code the ATM
 * reads (WalletCashout), and the receipt it prints (`ReceiptView`, at the foot of this file, which
 * the sheet shows as a face of its own and builds through `receiptFor` in `lib/ecobetaWallet`).
 *
 * All of them are faces of the recycling sheet rather than screens of their own — the sheet is
 * already a 375px panel with its own header and back button — so none of them draws chrome, and
 * the sheet decides which one is showing. The design's own material is kept: the teal-to-yellow
 * card the balance and the code wear, the #F0F5FA block the amount is typed into, the white
 * #00BF63 button that swaps, and the teal/red the design outlines the second action with.
 *
 * The two shortcuts the design puts on the balance card are drawn as the wallet's two own moves —
 * requesting a levantamento, and opening the history the design otherwise keeps behind the three
 * dots — because the wallet has no second operation behind an "Investir": a button that promised
 * one would be a dead end. Everything else about the pair is the design's: same place, same size,
 * same standing beside the balance.
 */

import { useState, type FormEvent } from "react";
import { ArrowLeft, ChevronRight, Copy, Download, Loader2, Sparkles } from "lucide-react";

import { formatPoints, formatWeight } from "@/lib/ecobetaRecycling";
import {
  ECOBETA_RECEIPT_COMPANY,
  ECOBETA_RECEIPT_HELP_LINE,
  ECOBETA_RECEIPT_MOTTO,
  ECOBETA_SUPPORT_PHONES,
  ECOBETA_WALLET_POLICY,
  ECOBETA_WALLET_SERVICE_LINE,
  EcobetaWalletError,
  formatKwanza,
  formatMoment,
  formatStamp,
  kwanzaFor,
  parseAmount,
  statusOf,
  type EcobetaReceipt,
  type EcobetaWalletCashout,
  type EcobetaWalletFieldErrors,
  type EcobetaWalletValues,
} from "@/lib/ecobetaWallet";

/** The design's values, kept beside the screens that wear them. */
const INK = "#32343E";
const INK_DEEP = "#181C2E";
const MUTED = "#6B6E82";
const FAINT = "#A0A5BA";
const BRAND_TEAL = "#0097B2";
const BRAND_GREEN = "#00BF63";
const ALERT = "#FF3326";
const FIELD_BG = "#F0F5FA";
const CARD_BG = "#F6F8FA";
/** The wallet card's own material, and the three actions the design outlines. */
const CARD_GRADIENT = "linear-gradient(358deg, #0097B2 0%, #FFEB34 100%)";
const VERIFY_OUTLINE = "#A03BB1";
const EXPIRE_OUTLINE = "#FB4A59";
/** The reading a card shows while it is being asked for, before the wallet answers. */
const LOADING_TITLE = "Carregando...";

const AMOUNT_HINT = "Indique o valor em kwanzas e confirme o levantamento.";
const CASHOUT_HINT = "O código é gerado aqui e lido em qualquer ATM.";
const VERIFY_FAILED = "Não foi possível verificar agora. Tente novamente.";
const COPIED = "Referência copiada.";

/** The receipt's standing text, aliased to the names the view that prints it reads them by. */
const RECEIPT_MOTTO = ECOBETA_RECEIPT_MOTTO;
const RECEIPT_COMPANY = ECOBETA_RECEIPT_COMPANY;
const RECEIPT_HELP_LINE = ECOBETA_RECEIPT_HELP_LINE;
const RECEIPT_PHONES = ECOBETA_SUPPORT_PHONES;
/** The receipt's own way back, as its back button is labelled. */
const GO_BACK = "Voltar";

/** One line of feedback: the standing instruction, a refusal, or a confirmation. */
type Hint = { tone: "alerta" | "ok"; text: string };

/* ── the wallet ───────────────────────────────────────────────────────── */

export type EcobetaWalletProps = {
  /** The balance the levantamento is validated against. */
  points: number;
  /** The line the sheet adds after a swap, so the write is visible where it landed. */
  notice?: string;
  /** Asks for a levantamento; the sheet is what shows the code that comes back. */
  onRequest: (values: EcobetaWalletValues) => Promise<EcobetaWalletCashout>;
  /** The levantamentos already made, and the way into the code of one. */
  onOpenHistory: () => void;
};

/** What the line under the button says once a code exists. */
function cashoutConfirmation(cashout: EcobetaWalletCashout): string {
  return `Levantamento de ${formatKwanza(cashout.netKwanza)} gerado · ${formatPoints(cashout.points)} pts`;
}

export function EcobetaWallet({ points, notice, onRequest, onOpenHistory }: EcobetaWalletProps) {
  const [amount, setAmount] = useState("");
  const [fieldErrors, setFieldErrors] = useState<EcobetaWalletFieldErrors>({});
  const [hint, setHint] = useState<Hint>({ tone: "alerta", text: AMOUNT_HINT });
  const [pending, setPending] = useState(false);

  const available = kwanzaFor(points);
  /*
   * The total the design prints under the field: what was typed, read back in kwanzas. An empty or
   * half-typed field is zero rather than an error, because the total is a reading of the field and
   * not a verdict on it — the verdict is the line under the button.
   */
  const total = parseAmount(amount) ?? 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFieldErrors({});
    setHint({ tone: "alerta", text: AMOUNT_HINT });

    try {
      const cashout = await onRequest({ amount });
      setAmount("");
      setHint({ tone: "ok", text: cashoutConfirmation(cashout) });
    } catch (error) {
      if (error instanceof EcobetaWalletError) {
        setFieldErrors(error.fieldErrors);
        // One line carries the answer, the way the design draws it: the field messages when the
        // refusal belonged to the field, the service's own message when it belonged to none.
        const messages = Object.values(error.fieldErrors).filter(Boolean);
        setHint({ tone: "alerta", text: messages.length > 0 ? messages.join(" ") : error.message });
      } else {
        setHint({ tone: "alerta", text: "Algo falhou. Tente novamente." });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pt-[22px]">
      {notice ? (
        <p role="status" className="mb-[14px] text-[12.5px]" style={{ color: BRAND_GREEN }}>
          {notice}
        </p>
      ) : null}

      <div className="rounded-[24px] p-[20px] text-white" style={{ background: CARD_GRADIENT }}>
        <p className="text-[12px] uppercase" style={{ color: "rgba(255,255,255,0.85)" }}>
          Meu saldo
        </p>
        <p className="mt-[6px] text-[30px] leading-[1.1] font-bold">
          {formatPoints(points)} <span className="text-[15px] font-normal">pts</span>
        </p>
        <p className="mt-[4px] text-[13px]">≈ {formatKwanza(available)}</p>

        {/* The design's pair of shortcuts. Both are the wallet's own moves here: the first asks for
            a levantamento, the second opens the history the three dots also reach. */}
        <div className="mt-[18px] flex gap-[10px]">
          <button
            type="submit"
            form="ecobeta-wallet-form"
            disabled={pending}
            className="h-[38px] rounded-full px-[18px] text-[12px] font-bold uppercase transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
            style={{ background: "#FFFFFF", color: BRAND_TEAL }}
          >
            Levantar
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className="h-[38px] rounded-full px-[18px] text-[12px] font-bold uppercase text-white transition-colors hover:bg-[rgba(255,255,255,0.16)]"
            style={{ border: "1px solid rgba(255,255,255,0.85)" }}
          >
            Histórico
          </button>
        </div>
      </div>

      <form id="ecobeta-wallet-form" noValidate onSubmit={onSubmit} className="mt-[28px]">
        <p className="text-[14px] uppercase" style={{ color: FAINT }}>
          Deseja retirar quanto?
        </p>

        <label className="sr-only" htmlFor="ecobeta-wallet-valor">
          Valor do levantamento em kwanzas
        </label>
        <div
          className={`mt-[12px] flex h-[62px] items-center rounded-[10px] border ${
            fieldErrors.amount ? "border-[#FF3326]" : "border-transparent"
          }`}
          style={{ background: FIELD_BG }}
        >
          <input
            id="ecobeta-wallet-valor"
            name="amount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Digite o valor"
            className="h-full min-w-0 flex-1 bg-transparent pl-[20px] pr-[10px] text-[20px] outline-none placeholder:text-[#A0A5BA]"
            style={{ color: INK }}
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setFieldErrors({});
              setHint({ tone: "alerta", text: AMOUNT_HINT });
            }}
            aria-invalid={fieldErrors.amount ? true : undefined}
            aria-describedby="ecobeta-wallet-hint"
          />
          <span className="pr-[20px] text-[16px]" style={{ color: MUTED }}>
            Kz
          </span>
        </div>

        {/* The design's own step from the field to the levantamentos already made. */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="mt-[18px] flex w-full items-center justify-end gap-[6px] text-[14px]"
          style={{ color: BRAND_TEAL }}
        >
          Detalhes do levantamento
          <ChevronRight className="h-[16px] w-[16px]" aria-hidden="true" />
        </button>

        <p className="mt-[14px] text-[14px] uppercase" style={{ color: FAINT }}>
          Total:{" "}
          <span className="text-[30px]" style={{ color: INK_DEEP }}>
            {formatKwanza(total)}
          </span>
        </p>

        <button
          type="submit"
          disabled={pending}
          className="mt-[26px] flex h-[66px] w-full items-center justify-center gap-[10px] rounded-[12px] text-[14px] font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
          style={{ background: BRAND_GREEN }}
        >
          {pending ? <Loader2 className="h-[16px] w-[16px] animate-spin" aria-hidden="true" /> : null}
          Realizar levantamento
        </button>

        {/* One line, the way the design draws it: what to fill in, what was refused, or what was
            just generated. */}
        <p
          id="ecobeta-wallet-hint"
          role="status"
          className="mt-[20px] min-h-[13px] text-[10px] uppercase"
          style={{ color: hint.tone === "ok" ? BRAND_GREEN : ALERT }}
        >
          {hint.text}
        </p>
        <p className="mt-[8px] text-[11.5px] leading-[1.5]" style={{ color: MUTED }}>
          {CASHOUT_HINT}
        </p>
      </form>
    </div>
  );
}

/* ── the levantamentos already made ───────────────────────────────────── */

/** The weight the history rows print: whole kilograms where the number is whole, as the design does. */
function weightLabel(weightKg: number): string {
  if (weightKg <= 0) return "—";
  return `${Number.isInteger(weightKg) ? weightKg : formatWeight(weightKg)} KG`;
}

export type EcobetaWalletHistoryProps = {
  /** The levantamentos made this session, newest first. */
  cashouts: EcobetaWalletCashout[];
  /** What is still in the balance, so the list is read against the balance it came out of. */
  points: number;
  /** Opens the code of one levantamento. */
  onOpen: (cashoutId: string) => void;
  /** Asks the wallet (or the service) whether a code is still usable; the sheet shows the answer. */
  onVerify: (cashoutId: string) => Promise<void>;
};

export function EcobetaWalletHistory({
  cashouts,
  points,
  onOpen,
  onVerify,
}: EcobetaWalletHistoryProps) {
  /** The row being verified, so only that row spins and the rest of the list stays readable. */
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function verify(cashoutId: string) {
    if (pendingId) return;

    setPendingId(cashoutId);
    setError("");
    try {
      await onVerify(cashoutId);
    } catch {
      setError(VERIFY_FAILED);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="pt-[22px]">
      {/* The design's own two-line heading, and the balance the list is read against. */}
      <p className="text-[14px]" style={{ color: INK }}>
        Meu histórico —{" "}
        <span className="text-[10px]" style={{ color: MUTED }}>
          detalhes dos pontos que vão ao saque
        </span>
      </p>
      <p className="mt-[6px] text-[12px]" style={{ color: MUTED }}>
        Saldo atual: {formatPoints(points)} pts · {formatKwanza(kwanzaFor(points))}
      </p>

      {error ? (
        <p role="alert" className="mt-[12px] text-[12px]" style={{ color: ALERT }}>
          {error}
        </p>
      ) : null}

      {cashouts.length === 0 ? (
        <p
          className="mt-[18px] rounded-[16px] p-[18px] text-[13px] leading-[1.5]"
          style={{ background: CARD_BG, color: MUTED }}
        >
          Ainda não fez nenhum levantamento. Gere o primeiro código na carteira e ele fica aqui, com a
          referência, o estado e o comprovativo.
        </p>
      ) : (
        <ul className="mt-[18px] space-y-[18px]">
          {cashouts.map((cashout) => (
            <EcobetaWalletHistoryRow
              key={cashout.id}
              cashout={cashout}
              verifying={pendingId === cashout.id}
              disabled={pendingId !== null}
              onOpen={onOpen}
              onVerify={verify}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** One levantamento in the list: what it was worth, when, and the two ways to act on it. */
function EcobetaWalletHistoryRow({
  cashout,
  verifying,
  disabled,
  onOpen,
  onVerify,
}: {
  cashout: EcobetaWalletCashout;
  verifying: boolean;
  disabled: boolean;
  onOpen: (cashoutId: string) => void;
  onVerify: (cashoutId: string) => void;
}) {
  const expired = statusOf(cashout) === "expirado";

  return (
    <li className="rounded-[16px] p-[16px]" style={{ background: CARD_BG }}>
      <div className="flex items-start gap-[12px]">
        <button
          type="button"
          onClick={() => onOpen(cashout.id)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex items-center gap-[8px]">
            <span className="min-w-0 truncate text-[14px] font-bold" style={{ color: INK }}>
              {cashout.campaign}
            </span>
            <span
              aria-hidden="true"
              className="grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-white text-[13px] font-bold"
              style={{ color: BRAND_TEAL }}
            >
              +
            </span>
          </span>
          <span className="mt-[8px] block">
            <span className="text-[14px] font-bold" style={{ color: BRAND_TEAL }}>
              {formatPoints(cashout.points)}
            </span>
            <span className="text-[14px] font-bold" style={{ color: INK_DEEP }}>
              {" "}
              PTS
            </span>
          </span>
          <span className="mt-[4px] block">
            <span className="text-[14px] font-bold" style={{ color: BRAND_TEAL }}>
              {formatPoints(cashout.netKwanza)}
            </span>
            <span className="text-[14px] font-bold" style={{ color: INK_DEEP }}>
              {" "}
              Kzs
            </span>
          </span>
          <span className="mt-[6px] block text-[12px] uppercase" style={{ color: MUTED }}>
            {formatMoment(cashout.createdAt)} · {weightLabel(cashout.weightKg)}
          </span>
        </button>

        <span
          className="flex-none rounded-full px-[10px] py-[4px] text-[10px] font-bold uppercase"
          style={{
            background: expired ? "rgba(251, 74, 89, 0.12)" : "rgba(0, 191, 99, 0.12)",
            color: expired ? EXPIRE_OUTLINE : BRAND_GREEN,
          }}
        >
          {expired ? "Expirado" : "Activo"}
        </span>
      </div>

      <div className="mt-[12px] flex items-center justify-between gap-[12px]">
        <span className="text-[12px]" style={{ color: MUTED }}>
          Referência
        </span>
        <button
          type="button"
          onClick={() => onOpen(cashout.id)}
          className="text-[12px] underline"
          style={{ color: MUTED }}
        >
          {cashout.reference}
        </button>
      </div>

      {/* The design's two actions per row. The first is the request to the wallet; the second opens
          the code, and is only named "Expirado?" on a row whose window has already passed — a code
          that is still live reads as the code it is. */}
      <div className="mt-[12px] flex gap-[10px]">
        <button
          type="button"
          onClick={() => onVerify(cashout.id)}
          disabled={disabled}
          className="flex h-[38px] flex-1 items-center justify-center gap-[8px] rounded-[8px] text-[11.5px] font-bold uppercase transition-colors hover:bg-white disabled:cursor-progress disabled:opacity-70"
          style={{ border: `1px solid ${VERIFY_OUTLINE}`, color: VERIFY_OUTLINE }}
        >
          {verifying ? <Loader2 className="h-[14px] w-[14px] animate-spin" aria-hidden="true" /> : null}
          Pedir verificação
        </button>
        <button
          type="button"
          onClick={() => onOpen(cashout.id)}
          className="flex h-[38px] flex-1 items-center justify-center rounded-[8px] text-[11.5px] font-bold uppercase transition-colors hover:bg-white"
          style={{ border: `1px solid ${EXPIRE_OUTLINE}`, color: EXPIRE_OUTLINE }}
        >
          {expired ? "Expirado?" : "Ver código"}
        </button>
      </div>
    </li>
  );
}

/* ── one levantamento, and the code it generated ──────────────────────── */

/** What the card calls the three readings it can show. */
const READING_TITLES = {
  pendente: LOADING_TITLE,
  activo: "Activo!",
  expirado: "Expirado!",
} as const;

const ACTIVE_TEXT = "Use o código para fazer levantamento sem cartão em qualquer ATM.";
const EXPIRED_TEXT = "Esta transação já foi usada ou passou o tempo de validade.";
const POLICIES_LINE = "Leia sobre as nossas políticas de pagamentos.";
const VALID_UNTIL = "Válido até";

/** The card a levantamento reads as: waiting, usable, or past its window. */
type CashoutReading = keyof typeof READING_TITLES;

export type EcobetaWalletCashoutProps = {
  cashout: EcobetaWalletCashout;
  /** True while the code is still being asked for, so the card reads "carregando". */
  pending: boolean;
  /** Asks the wallet whether the code is still usable; the card re-reads the answer. */
  onVerify: () => Promise<void>;
  /** The receipt this code prints. */
  onReceipt: () => void;
};

export function EcobetaWalletCashout({
  cashout,
  pending,
  onVerify,
  onReceipt,
}: EcobetaWalletCashoutProps) {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const reading: CashoutReading = pending || verifying ? "pendente" : statusOf(cashout);
  const expired = reading === "expirado";

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(cashout.reference);
      setCopied(true);
      setError("");
    } catch {
      // No clipboard to write to — an older browser, or a frame that withholds the permission. The
      // reference stays readable on screen, so nothing is lost but the shortcut.
      setCopied(false);
      setError("Não foi possível copiar. A referência fica à vista para ler.");
    }
  }

  async function verify() {
    if (verifying) return;

    setVerifying(true);
    setError("");
    try {
      await onVerify();
    } catch {
      setError(VERIFY_FAILED);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="pt-[22px]">
      <div
        className="relative rounded-[35px] px-[20px] pt-[28px] pb-[24px] text-center text-white"
        style={{ background: CARD_GRADIENT }}
      >
        {/* The copy glyph the design floats over the card's corner. */}
        <button
          type="button"
          onClick={copyReference}
          aria-label="Copiar a referência do levantamento"
          className="absolute top-[14px] right-[14px] grid h-[38px] w-[38px] place-items-center rounded-full text-white transition-colors hover:bg-[rgba(255,255,255,0.34)]"
          style={{ background: "rgba(255,255,255,0.22)" }}
        >
          <Copy className="h-[17px] w-[17px]" aria-hidden="true" />
        </button>

        <p className="mt-[6px] text-[34px] leading-[1.15] font-extrabold">{READING_TITLES[reading]}</p>

        <span
          className="mt-[12px] inline-flex items-center gap-[6px] rounded-full px-[14px] py-[5px] text-[12px] font-bold uppercase"
          style={{ background: "rgba(255,255,255,0.3)" }}
        >
          <Sparkles className="h-[14px] w-[14px]" aria-hidden="true" />
          Pontos!
        </span>

        {/* The design's loading track: drawn only while the code is being asked for or checked. */}
        {reading === "pendente" ? (
          <span
            aria-hidden="true"
            className="mt-[18px] block h-[8px] w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.35)" }}
          >
            <span className="block h-full w-[45%] animate-pulse rounded-full bg-white" />
          </span>
        ) : null}

        <p className="mt-[20px] text-[30px] leading-[1.2] font-bold tracking-[1px]">{cashout.code}</p>

        <p className="mt-[14px] text-[16px] leading-[1.5] font-bold">
          {expired ? EXPIRED_TEXT : ACTIVE_TEXT} PIN: {cashout.pin}
        </p>

        <p className="mt-[14px] text-[12px] leading-[1.6]">{POLICIES_LINE}</p>
        <p
          className="text-[12px] font-bold"
          style={{ color: expired ? "#D20F0F" : "#FFFFFF" }}
        >
          {ECOBETA_WALLET_POLICY}
        </p>
        <p className="text-[12px] font-bold">Ligue: {ECOBETA_WALLET_SERVICE_LINE}</p>
      </div>

      <div className="mt-[20px] rounded-[16px] p-[16px]" style={{ background: CARD_BG }}>
        <div className="flex items-center justify-between gap-[12px]">
          <span className="text-[12px] uppercase" style={{ color: MUTED }}>
            Referência
          </span>
          <button
            type="button"
            onClick={copyReference}
            className="text-[14px] font-bold underline"
            style={{ color: INK }}
          >
            {cashout.reference}
          </button>
        </div>

        <div className="mt-[14px] flex items-center justify-between gap-[12px]">
          <span className="text-[12px] uppercase" style={{ color: MUTED }}>
            Pontos
          </span>
          <span className="text-[14px] font-bold">
            <span style={{ color: BRAND_TEAL }}>{formatPoints(cashout.points)}</span>
            <span style={{ color: INK_DEEP }}> PTS</span>
          </span>
        </div>

        <div className="mt-[8px] flex items-center justify-between gap-[12px]">
          <span className="text-[12px] uppercase" style={{ color: MUTED }}>
            Montante
          </span>
          <span className="text-[14px] font-bold">
            <span style={{ color: BRAND_TEAL }}>{formatPoints(cashout.netKwanza)}</span>
            <span style={{ color: INK_DEEP }}> Kzs</span>
          </span>
        </div>

        <div className="mt-[8px] flex items-center justify-between gap-[12px]">
          <span className="text-[12px] uppercase" style={{ color: MUTED }}>
            {expired ? "Expirou em" : VALID_UNTIL}
          </span>
          <span className="text-[12px]" style={{ color: expired ? ALERT : INK }}>
            {formatStamp(cashout.expiresAt)}
          </span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-[14px] text-[12px]" style={{ color: ALERT }}>
          {error}
        </p>
      ) : null}

      {copied ? (
        <p role="status" className="mt-[14px] text-[12px]" style={{ color: BRAND_GREEN }}>
          {COPIED}
        </p>
      ) : null}

      <button
        type="button"
        onClick={verify}
        disabled={pending || verifying}
        className="mt-[18px] flex h-[62px] w-full items-center justify-center gap-[10px] rounded-[12px] text-[14px] font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
        style={{ background: BRAND_GREEN }}
      >
        {verifying ? <Loader2 className="h-[16px] w-[16px] animate-spin" aria-hidden="true" /> : null}
        Pedir verificação
      </button>

      <button
        type="button"
        onClick={onReceipt}
        className="mt-[12px] flex h-[62px] w-full items-center justify-center rounded-[12px] text-[14px] font-bold uppercase transition-colors hover:bg-[#F0F5FA]"
        style={{ border: `2px solid ${BRAND_TEAL}`, color: BRAND_TEAL }}
      >
        Comprovativo digital
      </button>

      <p className="mt-[16px] text-[11.5px] leading-[1.5]" style={{ color: MUTED }}>
        O comprovativo leva a referência e o montante deste levantamento, e pode ser copiado ou
        guardado em PDF.
      </p>
    </div>
  );
}

interface ReceiptViewProps {
  receipt: EcobetaReceipt;
  onBack: () => void;
  onRefresh: () => void;
}

export function ReceiptView({ receipt, onBack }: ReceiptViewProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function copyReference() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(receipt.reference);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch {
      // Ignorar
    }
  }

  async function downloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      const sheet = document.getElementById("ecobeta-wallet-receipt-sheet");
      if (!sheet) {
        if (typeof window !== "undefined") window.print();
        return;
      }

      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(sheet, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      const yOffset = imgHeight < pdfHeight ? (pdfHeight - imgHeight) / 2 : 0;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        yOffset,
        imgWidth,
        Math.min(imgHeight, pdfHeight),
      );

      const cleanRef = receipt.reference.replace(/[^a-zA-Z0-9_-]/g, "");
      pdf.save(`comprovativo-${cleanRef || "ecobeta"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed, opening print dialogue instead", err);
      if (typeof window !== "undefined") {
        window.print();
      }
    } finally {
      setDownloading(false);
    }
  }

  const rows: Array<[string, string]> = [
    ["DATA - HORA", receipt.dateTime],
    ["OPERAÇÃO", receipt.operation],
    ["ENTIDADE", receipt.entity],
    ["REFERENCIA", receipt.reference],
    ["MONTANTE", `${formatPoints(receipt.amountKwanza)} KZS`],
    ["TRANSAÇÃO", receipt.transactionNumber],
    ["TAXA DE CONVERSÃO", `${receipt.conversionRate} KZS`],
    ["TIPO DE TROCA", receipt.exchangeType],
    ["PONTOS", `${formatPoints(receipt.points)} PTS`],
  ];

  return (
    <div className="ecobeta-wallet-receipt mx-auto max-w-[595px] bg-white p-[20px] text-black print:p-0">
      {/* Printing the receipt prints the receipt: every other layer of the sheet is made invisible
          so "Baixar PDF" saves one clean page, and the two on-screen actions are dropped. */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .ecobeta-wallet-receipt,
        .ecobeta-wallet-receipt * { visibility: visible !important; }
        .ecobeta-wallet-receipt { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
        .no-print { display: none !important; }
      }`}</style>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .ecobeta-wallet-receipt,
          .ecobeta-wallet-receipt * {
            visibility: visible !important;
          }
          .ecobeta-wallet-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          #ecobeta-wallet-receipt-sheet {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <button
          type="button"
          onClick={onBack}
          aria-label={GO_BACK}
          className="flex h-[45px] w-[45px] items-center justify-center rounded-full transition-opacity hover:opacity-85"
          style={{ background: "#ECF0F4" }}
        >
          <ArrowLeft className="h-[18px] w-[18px]" style={{ color: INK }} />
        </button>

        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={copyReference}
            className="flex items-center gap-[6px] rounded-[8px] px-[12px] py-[8px] text-[12px] font-bold uppercase transition-colors hover:bg-[#F0F5FA]"
            style={{ border: `1px solid ${BRAND_TEAL}`, color: BRAND_TEAL }}
          >
            <Copy className="h-[14px] w-[14px]" />
            Copiar Ref.
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading}
            className="flex items-center gap-[6px] rounded-[8px] px-[14px] py-[8px] text-[12px] font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-75"
            style={{ background: BRAND_TEAL }}
          >
            {downloading ? (
              <>
                <Loader2 className="h-[14px] w-[14px] animate-spin" />
                A gerar PDF...
              </>
            ) : (
              <>
                <Download className="h-[14px] w-[14px]" />
                Baixar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {copied ? (
        <p role="status" className="mt-[10px] text-right text-[12px] no-print" style={{ color: BRAND_GREEN }}>
          {COPIED}
        </p>
      ) : null}

      <article
        id="ecobeta-wallet-receipt-sheet"
        className="relative mx-auto mt-[16px] min-h-[820px] w-full max-w-[595px] bg-white px-[32px] py-[34px] text-black shadow-md print:m-0 print:min-h-0 print:p-0 print:shadow-none"
        style={{
          fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* Top Header: Left Digital Signature & Right Brand Logo */}
        <div className="flex items-start justify-between gap-[16px]">
          <div className="text-[11px] font-bold uppercase leading-[1.35] text-black">
            <p>DIGITAL SIGNED BY</p>
            <p>{receipt.signedBy}</p>
            <p>DATE: {receipt.signedAt.replace(/ WAT$/, "")} WAT</p>
          </div>

          <div className="flex items-center justify-end">
            <img
              src="/hero-logo.png"
              alt="Eco Beta"
              crossOrigin="anonymous"
              className="h-[74px] w-auto max-w-[120px] object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <div className="mt-[28px]">
          <p
            className="text-center text-[15px] font-bold uppercase tracking-[1.5px]"
            style={{ color: "#404040" }}
          >
            COMPROVATIVO DIGITAL
          </p>

          <div
            className="mx-auto mt-[10px] h-[3px] w-full rounded-full"
            style={{ background: "#0097B2" }}
          />
        </div>

        {/* Subtitle */}
        <p className="mt-[28px] text-center text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.2px] text-black">
          DETALHE DA OPERAÇÃO REALIZADA ATRAVES DO CANAL ECO BETA
        </p>

        {/* Data Table with Continuous Vertical Divider */}
        <table className="mt-[36px] w-full border-collapse text-[11.5px] sm:text-[12px]">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-none">
                <td className="w-[45%] py-[10px] pr-[22px] text-left font-bold uppercase text-black align-middle border-r border-black">
                  {label}
                </td>
                <td className="w-[55%] py-[10px] pl-[22px] text-left font-normal uppercase text-black align-middle">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Company Motto */}
        <div className="mt-[44px] text-center space-y-[6px]">
          <p className="text-[11.5px] sm:text-[12px] font-bold uppercase text-black">
            {RECEIPT_MOTTO}
          </p>
          <p className="text-[11.5px] sm:text-[12px] font-bold uppercase text-black">
            {RECEIPT_COMPANY}
          </p>
        </div>

        {/* 24/7 Support Banner Box */}
        <div
          className="mt-[22px] rounded-[3px] px-[14px] py-[12px] text-center"
          style={{ background: "#D5C7AC" }}
        >
          <p className="text-[9.5px] sm:text-[10px] font-bold uppercase leading-normal tracking-tight text-black">
            {RECEIPT_HELP_LINE}
          </p>
          <p className="mt-[4px] text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.5px] text-black">
            {RECEIPT_PHONES}
          </p>
        </div>

        {/* Bottom subtle shadow accent */}
        <div
          className="mx-auto mt-[16px] h-[5px] w-[88%] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, #C4BCB5 0%, #202020 60%, transparent 100%)",
          }}
        />
      </article>
    </div>
  );
}

export default EcobetaWallet;
