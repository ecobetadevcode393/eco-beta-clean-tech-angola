"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, X } from "lucide-react";

import {
  MYECOBETA_IS_LOCAL,
  MYECOBETA_OPEN_MESSAGE,
  MyEcobetaAuthError,
  accountInitials,
  signIn,
  signUp,
  type MyEcobetaAccount,
  type MyEcobetaAuthMode,
  type MyEcobetaFieldErrors,
} from "@/lib/myecobetaAuth";
import { ECOBETA_FACE_STACK, ECOBETA_FACE_STYLE } from "@/lib/ecobetaFace";
import { EcobetaRecycling } from "@/components/EcobetaRecycling";
import { useEcobetaRecycling } from "@/hooks/use-ecobeta-recycling";

/*
 * The account screen for the hero's myEcobetaApp pill.
 *
 * The pill is authored inside the hero document, which runs in a sandboxed frame: it
 * cannot render an overlay over the app, and without allow-top-navigation it cannot send
 * the top window anywhere either. So it posts MYECOBETA_OPEN_MESSAGE and this component
 * answers. Keeping the screen here, rather than in the authored page, is also what keeps
 * the forms and their state in React and the page free of app chrome.
 *
 * It owns two screens, because they are two halves of one session: the form, and — once there
 * is an account — the recycling sheet where the points are earned. The session, the face and the
 * ledger live outside both of them (`lib/ecobetaFace`, `hooks/use-ecobeta-recycling`) so neither
 * screen has to know how the other is drawn.
 */

/** The hero's palette, so the overlay and the page read as the same material. */
const PANEL_BG = "#20261d";
const PAPER_BG = "#f2f3ef";
const PAPER_INK = "#23261f";
const ALERT = "#ffb4a2";

/** The authored page's own curves, reused so the motion matches the scene. */
const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Which of the two screens the overlay is showing. */
type MyEcobetaScreen = "entrar" | "reciclar";

export function MyEcobetaAuth() {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<MyEcobetaAccount | null>(null);
  /*
   * Bumped at every open, and the screen is keyed on it. Remounting is what keeps a closed
   * screen from holding on to a typed password: state that has to start empty belongs to the
   * mount, not to an effect that clears it after the fact.
   */
  const [visit, setVisit] = useState(0);
  /*
   * The screen the overlay lands on. Signing in is what moves it to the sheet, so the points are
   * the first thing an account sees; from there "Meu painel" brings the form back, and signing out
   * from the panel is what sends it home again.
   */
  const [screen, setScreen] = useState<MyEcobetaScreen>("entrar");
  const recycling = useEcobetaRecycling();

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: unknown } | null | undefined;
      if (!data || typeof data !== "object" || data.type !== MYECOBETA_OPEN_MESSAGE) return;

      // The packaged hero is a same-origin frame; a derived variant is a srcdoc frame,
      // which is sandboxed without allow-same-origin and so reports "null". Both are our
      // own hero, and all this message can do is open a screen, so both are accepted.
      if (event.origin !== window.location.origin && event.origin !== "null") return;

      setVisit((current) => current + 1);
      // A session that is already open goes straight back to the points.
      setScreen(account ? "reciclar" : "entrar");
      setOpen(true);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [account]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ECOBETA_FACE_STYLE }} />
      <MyEcobetaDialog
        key={visit}
        open={open && screen === "entrar"}
        account={account}
        // Signing in opens the recycling sheet; signing out closes it again.
        onAccount={(next) => {
          setAccount(next);
          setScreen(next ? "reciclar" : "entrar");
        }}
        onReciclar={() => setScreen("reciclar")}
        onClose={() => setOpen(false)}
      />
      {account ? (
        <EcobetaRecycling
          key={`reciclar-${visit}`}
          open={open && screen === "reciclar"}
          account={account}
          points={recycling.points}
          notifications={recycling.entries.length}
          onRegister={recycling.register}
          onBack={() => setScreen("entrar")}
          onClose={() => setOpen(false)}
          onSignOut={() => {
            setAccount(null);
            setScreen("entrar");
          }}
        />
      ) : null}
    </>
  );
}

/* ── the screen ───────────────────────────────────────────────────────── */

type MyEcobetaDialogProps = {
  open: boolean;
  account: MyEcobetaAccount | null;
  onAccount: (account: MyEcobetaAccount | null) => void;
  onReciclar: () => void;
  onClose: () => void;
};

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
  terms: false,
};

const MODES: { id: MyEcobetaAuthMode; label: string }[] = [
  { id: "sign-in", label: "Entrar" },
  { id: "sign-up", label: "Criar conta" },
];

function MyEcobetaDialog({
  open,
  account,
  onAccount,
  onReciclar,
  onClose,
}: MyEcobetaDialogProps) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<MyEcobetaAuthMode>("sign-in");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<MyEcobetaFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Closes on escape, the way the scrim and the close button do. The fields themselves need
  // no reset here: the whole screen is remounted at each open, so it starts clean.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  // Opens on the first field of whichever tab is showing, and again when the account panel
  // hands the screen back to the form.
  useEffect(() => {
    (mode === "sign-up" ? nameRef : emailRef).current?.focus();
  }, [account, mode]);

  function selectMode(next: MyEcobetaAuthMode) {
    if (next === mode) return;
    setMode(next);
    // The two forms share fields, so a message from one tab must not follow into the
    // other: an empty box is not a wrong answer.
    setFieldErrors({});
    setFormError("");
  }

  /**
   * Leaving the account returns to a blank form: the credentials that were just used do not
   * come back with it.
   */
  function signOut() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError("");
    onAccount(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFieldErrors({});
    setFormError("");

    try {
      const next =
        mode === "sign-in"
          ? await signIn({ email: form.email, password: form.password })
          : await signUp({
              name: form.name,
              email: form.email,
              password: form.password,
              passwordConfirmation: form.passwordConfirmation,
              terms: form.terms,
            });

      onAccount(next);
    } catch (error) {
      if (error instanceof MyEcobetaAuthError) {
        setFieldErrors(error.fieldErrors);
        // The field messages already say what is wrong, so the banner only speaks when
        // the failure belonged to no single field.
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      } else {
        setFormError("Algo falhou. Tente novamente.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="myecobetaapp"
          role="dialog"
          aria-modal="true"
          aria-labelledby="myecobetaapp-title"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-[clamp(14px,4vw,40px)]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: EASE }}
        >
          {/* The scrim is flat on purpose: a backdrop blur over a canvas that repaints
              every frame is re-sampled every frame, which is why the page's own dock is a
              translucent panel rather than frosted glass. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fechar"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[rgba(8,12,6,0.78)]"
          />

          <motion.div
            className="relative w-full max-w-[420px] rounded-[22px] border border-[rgba(255,255,255,0.12)] p-[clamp(18px,4vw,28px)] text-white shadow-[0_30px_90px_rgba(6,10,5,0.6)]"
            style={{ background: PANEL_BG, fontFamily: ECOBETA_FACE_STACK }}
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE_OUT }}
          >
            <div className="flex items-start justify-between gap-[16px]">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                  Eco Beta
                </p>
                <h2 id="myecobetaapp-title" className="mt-[6px] text-[19px] font-normal">
                  myEcobetaApp
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full border border-[rgba(255,255,255,0.12)] text-white/60 transition-colors hover:border-[rgba(255,255,255,0.3)] hover:text-white"
              >
                <X className="h-[15px] w-[15px]" aria-hidden="true" />
              </button>
            </div>

            {account ? (
              <MyEcobetaAccountPanel
                account={account}
                onReciclar={onReciclar}
                onSignOut={signOut}
              />
            ) : (
              <>
                <div
                  role="tablist"
                  aria-label="Entrar ou criar conta"
                  className="mt-[20px] flex gap-[4px] rounded-[13px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.035)] p-[4px]"
                >
                  {MODES.map((item) => {
                    const active = mode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => selectMode(item.id)}
                        className={`flex-1 rounded-[10px] px-[12px] py-[9px] text-[12.5px] font-medium transition-colors ${
                          active ? "" : "text-white/55 hover:text-white"
                        }`}
                        style={active ? { background: PAPER_BG, color: PAPER_INK } : undefined}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <form noValidate onSubmit={onSubmit} className="mt-[16px]">
                  {mode === "sign-up" ? (
                    <Field id="myecobetaapp-name" label="Nome" error={fieldErrors.name}>
                      <input
                        ref={nameRef}
                        id="myecobetaapp-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="O seu nome"
                        className={inputClass(Boolean(fieldErrors.name))}
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, name: event.target.value }))
                        }
                        aria-invalid={fieldErrors.name ? true : undefined}
                        aria-describedby={fieldErrors.name ? "myecobetaapp-name-error" : undefined}
                      />
                    </Field>
                  ) : null}

                  <Field id="myecobetaapp-email" label="E-mail" error={fieldErrors.email}>
                    <input
                      ref={mode === "sign-in" ? emailRef : null}
                      id="myecobetaapp-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="nome@exemplo.ao"
                      className={inputClass(Boolean(fieldErrors.email))}
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                      aria-invalid={fieldErrors.email ? true : undefined}
                      aria-describedby={fieldErrors.email ? "myecobetaapp-email-error" : undefined}
                    />
                  </Field>

                  <PasswordField
                    id="myecobetaapp-password"
                    label="Palavra-passe"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    value={form.password}
                    error={fieldErrors.password}
                    onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                  />

                  {mode === "sign-up" ? (
                    <>
                      <PasswordField
                        id="myecobetaapp-password-confirmation"
                        label="Repetir palavra-passe"
                        autoComplete="new-password"
                        value={form.passwordConfirmation}
                        error={fieldErrors.passwordConfirmation}
                        onChange={(value) =>
                          setForm((current) => ({ ...current, passwordConfirmation: value }))
                        }
                      />

                      <div className="mt-[16px]">
                        <label
                          htmlFor="myecobetaapp-terms"
                          className="flex cursor-pointer items-start gap-[10px] text-[12.5px] leading-[1.5] text-white/60"
                        >
                          <input
                            id="myecobetaapp-terms"
                            name="terms"
                            type="checkbox"
                            className="mt-[2px] h-[16px] w-[16px] flex-none accent-[#f2f3ef]"
                            checked={form.terms}
                            onChange={(event) =>
                              setForm((current) => ({ ...current, terms: event.target.checked }))
                            }
                            aria-invalid={fieldErrors.terms ? true : undefined}
                            aria-describedby={
                              fieldErrors.terms ? "myecobetaapp-terms-error" : undefined
                            }
                          />
                          <span>
                            Aceito os termos e a condição de utilização e a política de privacidade.
                          </span>
                        </label>
                        {fieldErrors.terms ? (
                          <p
                            id="myecobetaapp-terms-error"
                            className="mt-[6px] text-[12px]"
                            style={{ color: ALERT }}
                          >
                            {fieldErrors.terms}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  {formError ? (
                    <p
                      role="alert"
                      className="mt-[16px] rounded-[11px] border border-[rgba(255,180,162,0.28)] px-[12px] py-[10px] text-[12.5px] leading-[1.45]"
                      style={{ color: ALERT }}
                    >
                      {formError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-[20px] flex w-full items-center justify-center gap-[9px] rounded-[13px] px-[18px] py-[13px] text-[13px] font-medium transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
                    style={{ background: PAPER_BG, color: PAPER_INK }}
                  >
                    {pending ? (
                      <Loader2 className="h-[15px] w-[15px] animate-spin" aria-hidden="true" />
                    ) : null}
                    {mode === "sign-in" ? "Entrar" : "Criar conta"}
                    {pending ? null : <ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" />}
                  </button>

                  <p className="mt-[14px] text-[11.5px] leading-[1.5] text-white/40">
                    {MYECOBETA_IS_LOCAL
                      ? "Ainda sem serviço de contas ligado: a sessão fica só neste separador do navegador."
                      : "A sua conta myEcobetaApp passa a estar associada à Eco Beta."}
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ── fields ──────────────────────────────────────────────────────────── */

/**
 * One label, one control, one message. The message sits inside the label so it is read
 * with the field it belongs to, and carries an id so the input can point at the same text
 * with aria-describedby.
 */
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-[14px] block" htmlFor={id}>
      <span className="mb-[6px] block text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
        {label}
      </span>
      {children}
      {error ? (
        <span id={`${id}-error`} className="mt-[6px] block text-[12px]" style={{ color: ALERT }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

function inputClass(invalid: boolean) {
  return [
    "w-full rounded-[12px] border bg-[rgba(255,255,255,0.045)] px-[13px] py-[11.5px] text-[14px] font-light text-white",
    "outline-none transition-colors placeholder:text-white/28 focus:bg-[rgba(255,255,255,0.07)]",
    invalid
      ? "border-[rgba(255,180,162,0.45)] focus:border-[rgba(255,180,162,0.8)]"
      : "border-[rgba(255,255,255,0.12)] focus:border-[rgba(255,255,255,0.35)]",
  ].join(" ");
}

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field id={id} label={label} error={error}>
      <span className="relative block">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={`${inputClass(Boolean(error))} pr-[46px]`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Esconder a palavra-passe" : "Mostrar a palavra-passe"}
          className="absolute right-[6px] top-1/2 grid h-[32px] w-[32px] -translate-y-1/2 place-items-center rounded-[9px] text-white/45 transition-colors hover:text-white"
        >
          {visible ? (
            <EyeOff className="h-[15px] w-[15px]" aria-hidden="true" />
          ) : (
            <Eye className="h-[15px] w-[15px]" aria-hidden="true" />
          )}
        </button>
      </span>
    </Field>
  );
}

/* ── the signed-in panel ─────────────────────────────────────────────── */

/**
 * The same screen, once there is an account. The session lives in React state only: with
 * no service behind the form there is nowhere to persist it, so a reload asks for the
 * credentials again rather than pretending to remember them.
 *
 * "Reciclar" is the way back to the sheet — that is where an account's points are — and the
 * panel is where the session is ended, which is why the two live side by side.
 */
function MyEcobetaAccountPanel({
  account,
  onReciclar,
  onSignOut,
}: {
  account: MyEcobetaAccount;
  onReciclar: () => void;
  onSignOut: () => void;
}) {
  const initials = accountInitials(account.name);

  return (
    <div className="mt-[20px]">
      <div className="flex items-center gap-[13px] rounded-[15px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.035)] p-[14px]">
        <span
          aria-hidden="true"
          className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full text-[14px] font-medium"
          style={{ background: PAPER_BG, color: PAPER_INK }}
        >
          {initials || "E"}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] text-white">{account.name}</span>
          <span className="block truncate text-[12.5px] text-white/50">{account.email}</span>
        </span>
      </div>

      <p className="mt-[14px] text-[12.5px] leading-[1.5] text-white/55">
        Sessão iniciada. A sua conta Eco Beta está pronta para o myEcobetaApp.
      </p>

      <div className="mt-[18px] flex gap-[9px]">
        <button
          type="button"
          onClick={onReciclar}
          className="flex-1 rounded-[13px] px-[18px] py-[12px] text-[13px] font-medium transition-opacity hover:opacity-90"
          style={{ background: PAPER_BG, color: PAPER_INK }}
        >
          Reciclar
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="flex-1 rounded-[13px] border border-[rgba(255,255,255,0.14)] px-[18px] py-[12px] text-[13px] font-medium text-white/70 transition-colors hover:border-[rgba(255,255,255,0.3)] hover:text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
