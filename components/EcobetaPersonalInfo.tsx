"use client";

/*
 * The account's own data, in the two readings the design has: the one that shows it back
 * (PersonalProfiles) and the one that changes it (EditProfile).
 *
 * Both are faces of the recycling sheet rather than screens of their own — the sheet is already
 * a 375px panel with its own header and back button — so neither draws chrome, and the sheet
 * decides which of the two is showing. The design's own material is kept: the #F6F8FA card the
 * data is read in, the #F0F5FA blocks the form is typed into, and the teal/gold the sheet
 * already wears.
 */

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Camera, IdCard, Loader2, Phone, UserRound } from "lucide-react";

import { accountInitials } from "@/lib/myecobetaAuth";
import { MAX_AVATAR_BYTES, EcobetaProfileError, valuesFromProfile } from "@/lib/ecobetaProfile";
import type {
  EcobetaProfile,
  EcobetaProfileFieldErrors,
  EcobetaProfileValues,
} from "@/lib/ecobetaProfile";
import { tierFor } from "@/lib/ecobetaRecycling";

/** The design's values, kept beside the screens that wear them. */
const INK = "#32343E";
const INK_DEEP = "#181C2E";
const MUTED = "#646982";
const FAINT = "#98A8B8";
const GOLD = "#EBB329";
const CARD_BG = "#F6F8FA";
const FIELD_BG = "#F0F5FA";
const BRAND_TEAL = "#0097B2";
const BRAND_GREEN = "#00BF63";
const ALERT = "#FF3326";
const AVATAR_SHADOW = "12px 12px 30px rgba(248, 130, 34, 0.15)";

/** The colour each row of the reading card wears, the way the design draws its glyphs. */
const ROW_COLORS = { name: "#FB6F3D", nif: "#413DFB", phone: "#369BFF" } as const;

const EMPTY_LINE = "Por preencher";

/* ── the reading face ─────────────────────────────────────────────────── */

export type EcobetaPersonalInfoProps = {
  profile: EcobetaProfile;
  /** What the tier is read from; the same balance the menu shows beside the name. */
  points: number;
  /** The line the sheet adds after a save, so the write is visible where it landed. */
  notice?: string;
};

export function EcobetaPersonalInfo({ profile, points, notice }: EcobetaPersonalInfoProps) {
  const initials = accountInitials(profile.name) || "EB";
  const rows = [
    { id: "nome", icon: UserRound, color: ROW_COLORS.name, label: "NOME COMPLETO", value: profile.name },
    { id: "nif", icon: IdCard, color: ROW_COLORS.nif, label: "NIF", value: profile.nif },
    { id: "telefone", icon: Phone, color: ROW_COLORS.phone, label: "NÚMERO DO TELEFONE", value: profile.phone },
  ];

  return (
    <div className="pt-[22px]">
      {notice ? (
        <p role="status" className="mb-[14px] text-[12.5px]" style={{ color: BRAND_GREEN }}>
          {notice}
        </p>
      ) : null}

      <div className="flex items-center gap-[16px]">
        <span
          aria-hidden="true"
          className="grid h-[100px] w-[100px] flex-none place-items-center overflow-hidden rounded-full text-[30px] font-bold text-white"
          style={{ background: BRAND_TEAL, boxShadow: AVATAR_SHADOW }}
        >
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            initials
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[20px] font-bold capitalize" style={{ color: INK }}>
            {profile.name || "Sem nome"}
          </span>
          <span className="mt-[6px] block text-[14px]" style={{ color: GOLD }}>
            {tierFor(points)}
          </span>
        </span>
      </div>

      <dl className="mt-[26px] rounded-[16px] p-[20px]" style={{ background: CARD_BG }}>
        {rows.map((row, index) => {
          const Icon = row.icon;
          return (
            <div key={row.id} className={index === 0 ? "flex items-center gap-[18px]" : "mt-[18px] flex items-center gap-[18px]"}>
              <span
                aria-hidden="true"
                className="grid h-[40px] w-[40px] flex-none place-items-center rounded-full bg-white"
              >
                <Icon className="h-[19px] w-[19px]" style={{ color: row.color }} />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[14px] uppercase" style={{ color: MUTED }}>
                  {row.label}
                </dt>
                <dd
                  className="mt-[2px] truncate text-[14px]"
                  style={{ color: row.value ? INK_DEEP : FAINT }}
                >
                  {row.value || EMPTY_LINE}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/* ── the editing face ─────────────────────────────────────────────────── */

export type EcobetaEditProfileProps = {
  profile: EcobetaProfile;
  onSave: (values: EcobetaProfileValues) => Promise<EcobetaProfile>;
  /** Once the write landed: the sheet hands the reading face back. */
  onDone: () => void;
};

export function EcobetaEditProfile({ profile, onSave, onDone }: EcobetaEditProfileProps) {
  // Seeded from the profile at mount and owned here until it is saved: the sheet remounts this
  // face every time it is opened, so a draft never outlives the visit that started it.
  const [draft, setDraft] = useState<EcobetaProfileValues>(() => valuesFromProfile(profile));
  const [fieldErrors, setFieldErrors] = useState<EcobetaProfileFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const initials = accountInitials(draft.name) || "EB";

  function update<Field extends keyof EcobetaProfileValues>(
    field: Field,
    value: EcobetaProfileValues[Field],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  /** A field's message goes away as soon as the person starts answering that field. */
  function clearField(field: keyof EcobetaProfileFieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onPickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Picking the same file twice in a row is not a change event unless the input is emptied.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors((current) => ({ ...current, avatarUrl: "Escolha uma imagem (JPG, PNG ou WebP)." }));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFieldErrors((current) => ({
        ...current,
        avatarUrl: `A imagem vai até ${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} MB.`,
      }));
      return;
    }

    clearField("avatarUrl");
    try {
      update("avatarUrl", await readImage(file));
    } catch {
      setFieldErrors((current) => ({ ...current, avatarUrl: "Não foi possível ler a imagem." }));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFieldErrors({});
    setFormError("");

    try {
      await onSave(draft);
      onDone();
    } catch (error) {
      if (error instanceof EcobetaProfileError) {
        setFieldErrors(error.fieldErrors);
        // Each field carries its own message under it, so the one line is only for what belonged
        // to no field at all — the same way the recycling form reads a refusal.
        const messages = Object.values(error.fieldErrors).filter(Boolean);
        setFormError(messages.length > 0 ? "" : error.message);
      } else {
        setFormError("Algo falhou. Tente novamente.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="pt-[18px]">
      {/* The photograph is the one thing here that is not typed: the badge the design draws over
          the avatar is the button that picks the file. */}
      <div className="relative mx-auto h-[130px] w-[130px]">
        <span
          aria-hidden="true"
          className="grid h-full w-full place-items-center overflow-hidden rounded-full text-[38px] font-bold text-white"
          style={{ background: BRAND_TEAL, boxShadow: AVATAR_SHADOW }}
        >
          {draft.avatarUrl ? (
            <img src={draft.avatarUrl} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            initials
          )}
        </span>
        <label
          className="absolute right-[-2px] bottom-[-2px] grid h-[41px] w-[41px] cursor-pointer place-items-center rounded-full transition-opacity hover:opacity-90"
          style={{ background: BRAND_GREEN }}
        >
          <Camera className="h-[18px] w-[18px] text-white" aria-hidden="true" />
          <span className="sr-only">Alterar fotografia de perfil</span>
          <input type="file" accept="image/*" className="sr-only" onChange={onPickAvatar} />
        </label>
      </div>
      {fieldErrors.avatarUrl ? (
        <p role="alert" className="mt-[10px] text-center text-[12px]" style={{ color: ALERT }}>
          {fieldErrors.avatarUrl}
        </p>
      ) : null}

      <Field id="perfil-nome" label="Nome completo" error={fieldErrors.name}>
        <input
          id="perfil-nome"
          name="perfil-nome"
          autoComplete="name"
          className={fieldClass(Boolean(fieldErrors.name))}
          style={{ background: FIELD_BG, color: INK_DEEP }}
          value={draft.name}
          onChange={(event) => {
            update("name", event.target.value);
            clearField("name");
          }}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "perfil-nome-error" : undefined}
        />
      </Field>

      <Field id="perfil-telefone" label="Número de telefone" error={fieldErrors.phone}>
        <input
          id="perfil-telefone"
          name="perfil-telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={fieldClass(Boolean(fieldErrors.phone))}
          style={{ background: FIELD_BG, color: INK_DEEP }}
          value={draft.phone}
          onChange={(event) => {
            update("phone", event.target.value);
            clearField("phone");
          }}
          aria-invalid={fieldErrors.phone ? true : undefined}
          aria-describedby={fieldErrors.phone ? "perfil-telefone-error" : undefined}
        />
      </Field>

      <Field id="perfil-nif" label="NIF" error={fieldErrors.nif}>
        <input
          id="perfil-nif"
          name="perfil-nif"
          autoComplete="off"
          className={fieldClass(Boolean(fieldErrors.nif))}
          style={{ background: FIELD_BG, color: INK_DEEP }}
          value={draft.nif}
          onChange={(event) => {
            update("nif", event.target.value);
            clearField("nif");
          }}
          aria-invalid={fieldErrors.nif ? true : undefined}
          aria-describedby={fieldErrors.nif ? "perfil-nif-error" : undefined}
        />
      </Field>

      {formError ? (
        <p
          role="alert"
          className="mt-[16px] rounded-[10px] px-[14px] py-[10px] text-[12.5px] leading-[1.5]"
          style={{ color: ALERT, border: "1px solid rgba(255, 51, 38, 0.28)" }}
        >
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-[30px] flex h-[62px] w-full items-center justify-center gap-[10px] rounded-[12px] text-[16px] font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
        style={{ background: BRAND_GREEN }}
      >
        {pending ? <Loader2 className="h-[16px] w-[16px] animate-spin" aria-hidden="true" /> : null}
        Salvar alterações
      </button>
    </form>
  );
}

/* ── the form's own pieces ────────────────────────────────────────────── */

/**
 * One label, one control, one message. The message sits inside the label so it is read with the
 * field it belongs to, and carries an id so the input can point at the same text.
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
    <label className="mt-[20px] block" htmlFor={id}>
      <span className="mb-[8px] block text-[14px] uppercase" style={{ color: INK }}>
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

function fieldClass(invalid: boolean) {
  return [
    "h-[56px] w-full rounded-[10px] px-[20px] text-[14px] outline-none transition-colors",
    invalid ? "border border-[#FF3326]" : "border border-transparent focus:border-[#0097B2]",
  ].join(" ");
}

/** Reads the picked photograph as a data URL: this session has nowhere else to put it. */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

