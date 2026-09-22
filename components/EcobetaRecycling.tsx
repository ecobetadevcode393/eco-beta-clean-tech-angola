"use client";

import { useEffect, useRef, useState, type ComponentType, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Bell, ChevronDown, ChevronRight, Loader2, QrCode, Recycle } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { EcobetaNotifications, EcobetaProfileMenu } from "@/components/EcobetaProfileMenu";
import { ECOBETA_FACE_STYLE, ECOBETA_RECYCLING_FACE_STACK } from "@/lib/ecobetaFace";
import { MYECOBETA_IS_LOCAL, accountInitials, type MyEcobetaAccount } from "@/lib/myecobetaAuth";
import {
  ECOBETA_MATERIALS,
  EcobetaRecyclingError,
  accountCode,
  formatPoints,
  formatWeight,
  materialById,
  type EcobetaMaterialId,
  type EcobetaRecyclingEntry,
  type EcobetaRecyclingFieldErrors,
  type EcobetaRecyclingValues,
} from "@/lib/ecobetaRecycling";

/*
 * The screen the account opens onto: weigh what is going into the ecoponto and collect the
 * points for it.
 *
 * It is the same overlay the account screen is — React, drawn over the hero — and it wears the
 * design it was authored with: a phone-shaped sheet, a centred modal on a desktop and full-bleed
 * on a phone. `useIsMobile` (the one breakpoint the app defines) is what decides between the two
 * readings, because they also differ in how they arrive: the desktop panel fades up inside a
 * scrim, the phone sheet rises from the bottom edge.
 */

/** The design's own values, kept beside the screen that uses them. */
const INK = "#32343E";
const INK_SOFT = "#1E1D1D";
const MUTED = "#676767";
const BRAND_GREEN = "#00BF63";
const BRAND_TEAL = "#0097B2";
const ALERT = "#FF3326";
const CHIP_BG = "#D7E4E6";
const FIELD_BG = "#F6F6F6";
const BELL_BG = "#181C2E";
const AVATAR_BG = "#ECF0F4";
const CARD_SHADOW = "12px 12px 30px rgba(150, 150, 154, 0.15)";

/** The authored page's curves, reused so the motion matches the scene. */
const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** The standing lines under the button, in the readings the screen has. */
const MANUAL_HINT = "Selecione o material (tipo de resíduo) e informe o peso.";
const QR_HINT = "Código QR validado com sucesso.";
const QR_WAIT = "Aguarde a notificação do seu código QR — caso de erro ou demora.";
const QR_SUPPORT = "Call center : +244 946 380 778";

/** One line of feedback: the standing instruction, a refusal, or a confirmation. */
type Hint = { tone: "alerta" | "ok"; text: string };

/** The two ways an entry can be made. */
type Action = "manual" | "qrcode";

/** The sheet borrows two faces from the Menu design: avatar opens profile, bell opens inbox. */
type SheetView = "reciclar" | "perfil" | "notificacoes";

const ACTIONS: { id: Action; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "manual", label: "Reciclar", icon: Recycle },
  { id: "qrcode", label: "QR CODE", icon: QrCode },
];

export type EcobetaRecyclingProps = {
  open: boolean;
  account: MyEcobetaAccount;
  points: number;
  /** What the bell carries: entries registered this session; it opens the inbox face. */
  notifications: number;
  onRegister: (values: EcobetaRecyclingValues) => Promise<EcobetaRecyclingEntry>;
  /** Back to the account panel, one step out. */
  onBack: () => void;
  /** Out of the overlay altogether. */
  onClose: () => void;
  /** The profile menu is where the session ends; it lives inside this same sheet. */
  onSignOut: () => void;
};

export function EcobetaRecycling({
  open,
  account,
  points,
  notifications,
  onRegister,
  onBack,
  onClose,
  onSignOut,
}: EcobetaRecyclingProps) {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const [action, setAction] = useState<Action>("manual");
  /** Which face of the sheet is showing; reset every time the sheet opens. */
  const [view, setView] = useState<SheetView>("reciclar");
  const [material, setMaterial] = useState<EcobetaMaterialId | "">("");
  const [weight, setWeight] = useState("");
  const [fieldErrors, setFieldErrors] = useState<EcobetaRecyclingFieldErrors>({});
  const [hint, setHint] = useState<Hint>({ tone: "alerta", text: MANUAL_HINT });
  const [pending, setPending] = useState(false);
  /** "Finalizar" copies the code, then the waiting lines give way to the success line. */
  const [finalized, setFinalized] = useState(false);
  /* Two handovers of focus: into the sheet when it opens, and back to the material once an entry
     has been registered, which is the start of the next one. */
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const materialRef = useRef<HTMLSelectElement>(null);

  const selected = materialById(material);
  const initials = accountInitials(account.name) || "EB";
  const code = accountCode(account.email);

  // While the sheet is open the page behind it stays still: on a phone the sheet is the
  // whole screen, on desktop it is a centred 375px modal over a scrim.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape goes back one step: inside profile/inbox it returns to the form, on the form it
  // hands the screen back to the account panel rather than closing the overlay from under the user.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (view !== "reciclar") setView("reciclar");
      else onBack();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack, open, view]);

  // The overlay is what moves focus when it opens: a dialog that leaves focus on the page behind
  // it is a dialog a keyboard never finds.
  useEffect(() => {
    if (!open) return;
    firstActionRef.current?.focus();
  }, [open]);

  // Faces are reset alongside closing: the sheet unmounts on close and `MyEcobetaAuth` keys
  // it per visit, so reopening lands on the form face rather than on profile/inbox.
  function handleClose() {
    setView("reciclar");
    setFinalized(false);
    onClose();
  }

  function instructionFor(next: Action): Hint {
    if (next === "qrcode") return { tone: "alerta", text: QR_WAIT };
    return { tone: "alerta", text: MANUAL_HINT };
  }

  function selectAction(next: Action) {
    if (next === action) return;
    setAction(next);
    setFinalized(false);
    // The two readings share the line and the fields, so nothing said in one follows into the
    // other: an empty box is not a wrong answer.
    setFieldErrors({});
    setHint(instructionFor(next));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || action === "qrcode") return;

    setPending(true);
    setFieldErrors({});
    setHint(instructionFor(action));

    try {
      const entry = await onRegister({ material, weight });
      setMaterial("");
      setWeight("");
      materialRef.current?.focus();
      setHint({
        tone: "ok",
        text: `Registado: ${formatWeight(entry.weightKg)} kg de ${
          materialById(entry.material)?.label ?? "material"
        } · +${formatPoints(entry.points)} pts`,
      });
    } catch (error) {
      if (error instanceof EcobetaRecyclingError) {
        setFieldErrors(error.fieldErrors);
        // One line carries the answer, the way the design draws it: the field messages when the
        // refusal belonged to a field, the service's own message when it belonged to none.
        const messages = Object.values(error.fieldErrors).filter(Boolean);
        setHint({
          tone: "alerta",
          text: messages.length > 0 ? messages.join(" ") : error.message,
        });
      } else {
        setHint({ tone: "alerta", text: "Algo falhou. Tente novamente." });
      }
    } finally {
      setPending(false);
    }
  }

  async function onFinalize() {
    if (pending) return;
    setPending(true);
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // No clipboard to write to — an older browser, or a frame that withholds the permission.
      // The code stays readable on screen, so finalizing still succeeds.
    }
    setFinalized(true);
    setHint({ tone: "ok", text: QR_HINT });
    setPending(false);
  }

  const hintId = "ecobeta-reciclar-hint";
  const rowClass = (invalid: boolean) =>
    `flex h-[62px] items-center rounded-[10px] border ${
      invalid ? "border-[#FF3326]" : "border-transparent"
    }`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ECOBETA_FACE_STYLE }} />
      <AnimatePresence>
        {open ? (
          <motion.div
            key="ecobeta-reciclar"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ecobeta-reciclar-title"
            className={
              isMobile
                ? "fixed inset-0 z-50 flex flex-col bg-white"
                : "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-[clamp(14px,4vw,40px)]"
            }
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: EASE }}
          >
            {/* On a phone the sheet is the whole screen, so there is nothing to dim behind it.
                On desktop the scrim behind the centred 375px sheet dims the hero and closes the modal. */}
            {isMobile ? null : (
              <motion.button
                type="button"
                tabIndex={-1}
                aria-label="Fechar"
                onClick={handleClose}
                className="fixed inset-0 cursor-default bg-[rgba(8,12,6,0.78)]"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            <motion.div
              // Responsive sheet: the whole screen on a phone, a centred 375 x 812 modal on desktop.
              className={
                isMobile
                  ? "relative flex h-[100dvh] min-h-0 w-full flex-1 flex-col overflow-hidden bg-white pb-[env(safe-area-inset-bottom)]"
                  : "relative mx-auto my-auto flex h-[812px] max-h-[calc(100dvh-32px)] w-full max-w-[375px] flex-none flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_30px_90px_rgba(6,10,5,0.45)]"
              }
              style={{ fontFamily: ECOBETA_RECYCLING_FACE_STACK }}
              initial={
                reduceMotion ? false : isMobile ? { y: "4%" } : { opacity: 0, y: 14, scale: 0.99 }
              }
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion ? undefined : isMobile ? { y: "6%" } : { opacity: 0, y: 8, scale: 0.99 }
              }
              transition={reduceMotion ? { duration: 0 } : { duration: 0.34, ease: EASE_OUT }}
            >
              <div className="flex flex-none items-center gap-[13px] px-[20px] pt-[26px]">
                {view === "reciclar" ? (
                  <>
                    {/* Avatar opens the profile menu face of this same sheet. */}
                    <button
                      type="button"
                      onClick={() => setView("perfil")}
                      aria-label="Abrir o meu perfil"
                      className="grid h-[45px] w-[45px] flex-none place-items-center rounded-full text-[15px] font-bold transition-opacity hover:opacity-85"
                      style={{ background: AVATAR_BG, color: INK }}
                    >
                      <span aria-hidden="true">{initials}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("perfil")}
                      className="min-w-0 flex-1 rounded-[10px] text-left"
                    >
                      <span className="block truncate text-[12px] font-bold uppercase" style={{ color: BRAND_TEAL }}>
                        {account.name}
                      </span>
                      <span className="mt-[3px] block text-[14px]" style={{ color: MUTED }}>
                        Meu painel
                      </span>
                    </button>
                    {/* Bell opens the inbox face; the badge counts this session's entries. */}
                    <button
                      type="button"
                      onClick={() => setView("notificacoes")}
                      aria-label={
                        notifications === 0
                          ? "Abrir notificações. Ainda sem registos nesta sessão"
                          : `Abrir notificações. ${notifications} registo${notifications === 1 ? "" : "s"} nesta sessão`
                      }
                      className="relative flex-none rounded-full transition-opacity hover:opacity-85"
                    >
                      <span
                        aria-hidden="true"
                        className="grid h-[45px] w-[45px] place-items-center rounded-full"
                        style={{ background: BELL_BG }}
                      >
                        <Bell className="h-[19px] w-[19px] text-white" />
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute -top-[4px] -right-[4px] grid h-[25px] min-w-[25px] place-items-center rounded-full px-[5px] text-[15px] font-bold text-white"
                        style={{ background: BRAND_TEAL }}
                      >
                        {notifications > 9 ? "9+" : notifications}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setView("reciclar")}
                      aria-label="Voltar para reciclar"
                      className="grid h-[45px] w-[45px] flex-none place-items-center rounded-full transition-opacity hover:opacity-85"
                      style={{ background: AVATAR_BG, color: INK }}
                    >
                      <ArrowLeft className="h-[20px] w-[20px]" aria-hidden="true" />
                    </button>
                    <p className="min-w-0 flex-1 truncate text-[17px] leading-[22px]" style={{ color: BELL_BG }}>
                      {view === "perfil" ? "Meu Perfil" : "Notificações"}
                    </p>
                    <span
                      aria-hidden="true"
                      className="grid h-[45px] w-[45px] flex-none place-items-center rounded-full"
                      style={{ background: AVATAR_BG, color: BELL_BG }}
                    >
                      <Bell className="h-[19px] w-[19px]" />
                    </span>
                  </>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-[20px] pb-[28px]">
                {view === "perfil" ? (
                  <EcobetaProfileMenu
                    account={account}
                    points={points}
                    onBack={() => setView("reciclar")}
                    onSignOut={onSignOut}
                  />
                ) : view === "notificacoes" ? (
                  <EcobetaNotifications notifications={notifications} points={points} />
                ) : (
                  <>
                    <p className="mt-[28px] text-[16px] capitalize" style={{ color: INK_SOFT }}>
                      Meus Pontos :{" "}
                      <span className="text-[24px] font-bold" style={{ color: BRAND_GREEN }}>
                        {formatPoints(points)}
                      </span>{" "}
                      <span className="text-[16px]">pts</span>
                    </p>

                <h2
                  id="ecobeta-reciclar-title"
                  className="mt-[46px] text-[20px] capitalize"
                  style={{ color: INK }}
                >
                  Reciclar
                </h2>

                <form noValidate onSubmit={onSubmit}>
                  <div className="mt-[8px] flex items-center justify-between">
                    <p
                      id="ecobeta-reciclar-acao"
                      className="text-[20px] capitalize"
                      style={{ color: INK }}
                    >
                      Ação
                    </p>
                    <span
                      className="flex items-center gap-[4px] text-[16px]"
                      style={{ color: "#333333" }}
                      aria-hidden="true"
                    >
                      Selecionar
                      <ChevronRight
                        className="h-[16px] w-[16px]"
                        style={{ color: "#A0A5BA" }}
                      />
                    </span>
                  </div>
                  <div
                    role="group"
                    aria-labelledby="ecobeta-reciclar-acao"
                    className="mt-[16px] grid grid-cols-2 gap-[12px]"
                  >
                    {ACTIONS.map((item) => {
                      const active = item.id === action;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          ref={item.id === "manual" ? firstActionRef : null}
                          type="button"
                          aria-pressed={active}
                          onClick={() => selectAction(item.id)}
                          className="flex h-[60px] items-center gap-[12px] rounded-full border-2 bg-white pr-[16px] pl-[8px] text-left"
                          style={{
                            boxShadow: CARD_SHADOW,
                            borderColor: active ? BRAND_GREEN : "transparent",
                          }}
                        >
                          <span
                            className="grid h-[44px] w-[44px] flex-none place-items-center rounded-full"
                            style={{ background: CHIP_BG, color: INK }}
                          >
                            <Icon className="h-[21px] w-[21px]" />
                          </span>
                          <span className="truncate text-[14px] font-bold" style={{ color: INK }}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {action === "manual" ? (
                    <>
                      <div
                        className={`mt-[36px] ${rowClass(Boolean(fieldErrors.material))}`}
                        style={{ background: FIELD_BG }}
                      >
                        <select
                          ref={materialRef}
                          id="ecobeta-reciclar-material"
                          name="material"
                          aria-label="Material (tipo de resíduo)"
                          aria-invalid={fieldErrors.material ? true : undefined}
                          aria-describedby={hintId}
                          className="h-full min-w-0 flex-1 appearance-none bg-transparent pl-[23px] pr-[10px] text-[20px] outline-none"
                          style={{ color: selected ? INK : MUTED }}
                          value={material}
                          onChange={(event) => {
                            setMaterial(event.target.value as EcobetaMaterialId | "");
                            setFieldErrors((current) => ({ ...current, material: undefined }));
                            setHint(instructionFor(action));
                          }}
                        >
                          <option value="">Material</option>
                          {ECOBETA_MATERIALS.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <span className="shrink-0 whitespace-nowrap text-[12px]" style={{ color: MUTED }}>
                          {selected ? `${selected.pointsPerKg} pts/kg` : ""}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className="mx-[18px] h-[18px] w-[18px] shrink-0"
                          style={{ color: MUTED }}
                        />
                      </div>

                      <div
                        className={`mt-[28px] ${rowClass(Boolean(fieldErrors.weight))}`}
                        style={{ background: FIELD_BG }}
                      >
                        <label className="sr-only" htmlFor="ecobeta-reciclar-peso">
                          Peso em quilogramas
                        </label>
                        <input
                          id="ecobeta-reciclar-peso"
                          name="weight"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="Peso"
                          aria-invalid={fieldErrors.weight ? true : undefined}
                          aria-describedby={hintId}
                          className="h-full min-w-0 flex-1 bg-transparent pl-[23px] pr-[10px] text-[20px] text-[#32343E] outline-none placeholder:text-[#676767]"
                          value={weight}
                          onChange={(event) => {
                            setWeight(event.target.value);
                            setFieldErrors((current) => ({ ...current, weight: undefined }));
                            setHint(instructionFor(action));
                          }}
                        />
                        <span className="pr-[20px] text-[16px]" style={{ color: MUTED }}>
                          kg
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {finalized ? (
                        <p className="mt-[10px] text-[10px] capitalize" style={{ color: BRAND_GREEN }}>
                          {QR_HINT}
                        </p>
                      ) : null}
                      <div className="mt-[16px] rounded-[10px] p-[18px]" style={{ background: FIELD_BG }}>
                        <p className="text-[20px]" style={{ color: MUTED }}>
                          {code}
                        </p>
                        <p className="mt-[10px] text-[13px] leading-[1.5]" style={{ color: MUTED }}>
                          Aponte a câmara do ecoponto ao código, ou leia-o em voz alta. O ecoponto
                          pesa o material e credita os pontos automaticamente.
                        </p>
                        {MYECOBETA_IS_LOCAL ? (
                          <p className="mt-[10px] text-[11.5px] leading-[1.5]" style={{ color: MUTED }}>
                            Ainda sem serviço de contas ligado: o código vem do seu e-mail e os pontos
                            ficam só neste separador do navegador.
                          </p>
                        ) : null}
                      </div>
                    </>
                  )}

                  <button
                    type={action === "qrcode" ? "button" : "submit"}
                    onClick={action === "qrcode" ? onFinalize : undefined}
                    disabled={pending}
                    className="mt-[44px] flex h-[62px] w-full items-center justify-center gap-[10px] rounded-[12px] text-[14px] font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
                    style={{ background: BRAND_GREEN }}
                  >
                    {pending ? (
                      <Loader2 className="h-[16px] w-[16px] animate-spin" aria-hidden="true" />
                    ) : null}
                    {action === "qrcode" ? "Finalizar" : "Reciclar"}
                  </button>

                  {/* One line, the way the design draws it: what to fill in, what was refused, or
                      what was just registered. */}
                  <p
                    id={hintId}
                    role="status"
                    className="mt-[20px] min-h-[13px] text-[10px] uppercase"
                    style={{ color: hint.tone === "ok" ? BRAND_GREEN : ALERT }}
                  >
                    {hint.text}
                  </p>
                  {action === "qrcode" && !finalized ? (
                    <div className="mt-[6px] space-y-[6px]">
                      <p className="text-[10px] capitalize" style={{ color: MUTED }}>
                        {QR_WAIT}
                      </p>
                      <p className="text-[10px] capitalize" style={{ color: ALERT }}>
                        {QR_SUPPORT}
                      </p>
                    </div>
                  ) : null}
                </form>
                </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
