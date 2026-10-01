"use client";

/*
 * The addresses on the account: the ones it has (the Address design) and the form that adds or
 * changes one (the AddNewAddress design).
 *
 * Both are faces of the recycling sheet rather than screens of their own — the sheet is already a
 * 375px panel with its own header and back button — so neither draws chrome, and the sheet decides
 * which of the two is showing. Tapping a card opens that address in the form, which is what makes
 * "editar o endereço" the card's own action rather than a second screen behind a menu.
 *
 * The design's map is a plane with a pin on it: there is no tile service behind this build, so the
 * plane is drawn and the chip over it is what carries the truth — whether the browser could place
 * the person at all.
 */

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { House, Loader2, MapPin, MapPinned, Pencil, Store, Trash2 } from "lucide-react";

import {
  ECOBETA_ADDRESS_KINDS,
  EcobetaAddressError,
  type EcobetaAddressFieldErrors,
  type EcobetaAddressKind,
  type EcobetaAddressValues,
  type EcobetaCoordinates,
  type EcobetaProfile,
  type EcobetaProfileAddress,
} from "@/lib/ecobetaProfile";

/** The design's values, kept beside the screens that wear them. */
const INK = "#32343E";
const MUTED = "#6B6E82";
const CARD_BG = "#F0F5FA";
const FIELD_BG = "#F0F5FA";
const MAP_BG = "#D0D9E1";
const PIN = "#FB6D3A";
const BRAND_TEAL = "#0097B2";
const BRAND_GREEN = "#00BF63";
const ALERT = "#FF3326";
const DANGER = "#FB4A59";

/** How each kind is drawn on a card: the glyph and the colour the design gives it. */
const KIND_LOOK: Record<EcobetaAddressKind, { icon: typeof House; color: string }> = {
  casa: { icon: House, color: "#2790C3" },
  servico: { icon: Store, color: "#A03BB1" },
  outro: { icon: MapPinned, color: "#FB6F3D" },
};

function kindLabelOf(kind: EcobetaAddressKind): string {
  return ECOBETA_ADDRESS_KINDS.find((option) => option.id === kind)?.label ?? kind.toUpperCase();
}

/* ── the list ─────────────────────────────────────────────────────────── */

export type EcobetaAddressListProps = {
  profile: EcobetaProfile;
  /** The line the sheet adds after a save or a removal, so the write is visible where it landed. */
  notice?: string;
  onAdd: () => void;
  onEdit: (addressId: string) => void;
};

export function EcobetaAddressList({ profile, notice, onAdd, onEdit }: EcobetaAddressListProps) {
  return (
    <div className="flex min-h-full flex-col pt-[22px]">
      {notice ? (
        <p role="status" className="mb-[14px] text-[12.5px]" style={{ color: BRAND_GREEN }}>
          {notice}
        </p>
      ) : null}

      {profile.addresses.length === 0 ? (
        <p className="rounded-[16px] p-[18px] text-[13px] leading-[1.5]" style={{ background: CARD_BG, color: MUTED }}>
          Ainda não guardou nenhum endereço. Guarde o primeiro para o poder indicar nos pedidos do
          ecoponto.
        </p>
      ) : (
        <ul className="space-y-[20px]">
          {profile.addresses.map((address) => {
            const look = KIND_LOOK[address.kind];
            const Icon = look.icon;
            const label = kindLabelOf(address.kind);

            return (
              <li key={address.id}>
                <button
                  type="button"
                  onClick={() => onEdit(address.id)}
                  aria-label={`${label} em ${address.area} · ${address.street}, ${address.houseNumber} — editar`}
                  className="flex w-full items-center gap-[16px] rounded-[16px] p-[20px] text-left transition-colors hover:bg-white"
                  style={{ background: CARD_BG }}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-[48px] w-[48px] flex-none place-items-center rounded-full bg-white"
                  >
                    <Icon className="h-[21px] w-[21px]" style={{ color: look.color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] uppercase" style={{ color: INK }}>
                      {label}
                    </span>
                    <span className="mt-[6px] block truncate text-[14px]" style={{ color: INK, opacity: 0.5 }}>
                      {address.area}
                    </span>
                  </span>
                  <Pencil
                    className="h-[16px] w-[16px] flex-none"
                    style={{ color: BRAND_TEAL }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* The design pins the action to the bottom of the sheet, which is also where it belongs: the
          list may be long, and the way to a new address must not be somewhere in the middle of it. */}
      <div className="mt-auto pt-[32px]">
        <button
          type="button"
          onClick={onAdd}
          className="flex h-[62px] w-full items-center justify-center rounded-[12px] text-[14px] font-bold uppercase text-white transition-opacity hover:opacity-90"
          style={{ background: BRAND_GREEN }}
        >
          Adicionar novo endereço
        </button>
      </div>
    </div>
  );
}

/* ── the form ─────────────────────────────────────────────────────────── */

export type EcobetaAddressFormProps = {
  /** The address being changed, or null when this is a new one. */
  address: EcobetaProfileAddress | null;
  onSave: (values: EcobetaAddressValues, addressId?: string) => Promise<EcobetaProfileAddress>;
  onRemove: (addressId: string) => Promise<void>;
  /** Back to the list, carrying the line the list should show. */
  onDone: (notice: string) => void;
};

export function EcobetaAddressForm({ address, onSave, onRemove, onDone }: EcobetaAddressFormProps) {
  // Seeded from the address at mount and owned here until it is saved: the sheet remounts this
  // face per address, so a draft never outlives the visit that started it.
  const [draft, setDraft] = useState<EcobetaAddressValues>(() => valuesFromAddress(address));
  const [fieldErrors, setFieldErrors] = useState<EcobetaAddressFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  /** Removal asks once: an address is worth more than one tap to lose. */
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const place = useEcobetaPlace();

  function update<Field extends keyof EcobetaAddressValues>(
    field: Field,
    value: EcobetaAddressValues[Field],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  /** A field's message goes away as soon as the person starts answering that field. */
  function clearField(field: keyof EcobetaAddressFieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFieldErrors({});
    setFormError("");

    try {
      await onSave(
        {
          ...draft,
          // The pin is the browser's, not a field: it travels with the address when the browser
          // knows where the person is, and an address that already had one keeps it when it does not.
          coordinates: place.coordinates ?? draft.coordinates,
        },
        address?.id,
      );
      onDone(address ? "Endereço atualizado." : "Endereço guardado.");
    } catch (error) {
      if (error instanceof EcobetaAddressError) {
        setFieldErrors(error.fieldErrors);
        // Each field carries its own message under it, so the one line is only for what belonged
        // to no field at all — the same way the recycling form reads a refusal.
        const messages = Object.values(error.fieldErrors).filter(Boolean);
        setFormError(messages.length > 0 ? "" : error.message);
      } else {
        setFormError("Algo falhou. Tente novamente.");
      }
      setPending(false);
    }
  }

  async function onRemoveClick() {
    if (!address || pending) return;

    setPending(true);
    setFormError("");
    try {
      await onRemove(address.id);
      onDone("Endereço removido.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Algo falhou. Tente novamente.");
      setPending(false);
    }
  }

  const placeLabel =
    place.status === "captada"
      ? "Localização captada"
      : place.status === "indisponivel"
        ? "Sem localização · tentar de novo"
        : place.status === "a-calcular"
          ? "A calcular sua localização"
          : "Calcular a minha localização";

  return (
    <form noValidate onSubmit={onSubmit} className="pt-[18px]">
      <div className="relative h-[200px] overflow-hidden rounded-[16px]" style={{ background: MAP_BG }}>
        {/* The plane and its streets are drawn; the pin is the only thing here that is read. */}
        <span aria-hidden="true" className="absolute inset-0" style={MAP_STREETS} />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          style={{ background: "rgba(246, 145, 109, 0.2)" }}
        >
          <MapPin className="h-[24px] w-[24px]" style={{ color: PIN }} />
        </span>
        <button
          type="button"
          onClick={place.ask}
          disabled={place.status === "a-calcular"}
          className="absolute top-[14px] left-1/2 -translate-x-1/2 rounded-[6px] px-[12px] py-[7px] text-[9px] uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-80"
          style={{ background: INK }}
        >
          {placeLabel}
        </button>
      </div>
      {place.coordinates ? (
        <p className="mt-[8px] text-[11.5px]" style={{ color: MUTED }}>
          {place.coordinates.latitude.toFixed(5)}, {place.coordinates.longitude.toFixed(5)}
        </p>
      ) : null}

      <Field id="endereco-area" label="Endereço" error={fieldErrors.area}>
        <span className="relative block">
          <MapPin
            className="absolute top-1/2 left-[20px] h-[18px] w-[18px] -translate-y-1/2"
            style={{ color: MUTED }}
            aria-hidden="true"
          />
          <input
            id="endereco-area"
            name="endereco-area"
            autoComplete="address-level2"
            placeholder="Bairro ou zona"
            className={`${fieldClass(Boolean(fieldErrors.area))} pl-[46px]`}
            style={{ background: FIELD_BG, color: INK }}
            value={draft.area}
            onChange={(event) => {
              update("area", event.target.value);
              clearField("area");
            }}
            aria-invalid={fieldErrors.area ? true : undefined}
            aria-describedby={fieldErrors.area ? "endereco-area-error" : undefined}
          />
        </span>
      </Field>

      <div className="grid grid-cols-2 gap-[12px]">
        <Field id="endereco-rua" label="Rua" error={fieldErrors.street}>
          <input
            id="endereco-rua"
            name="endereco-rua"
            autoComplete="address-line1"
            className={fieldClass(Boolean(fieldErrors.street))}
            style={{ background: FIELD_BG, color: INK }}
            value={draft.street}
            onChange={(event) => {
              update("street", event.target.value);
              clearField("street");
            }}
            aria-invalid={fieldErrors.street ? true : undefined}
            aria-describedby={fieldErrors.street ? "endereco-rua-error" : undefined}
          />
        </Field>

        <Field id="endereco-casa" label="Casa nº" error={fieldErrors.houseNumber}>
          <input
            id="endereco-casa"
            name="endereco-casa"
            autoComplete="off"
            className={fieldClass(Boolean(fieldErrors.houseNumber))}
            style={{ background: FIELD_BG, color: INK }}
            value={draft.houseNumber}
            onChange={(event) => {
              update("houseNumber", event.target.value);
              clearField("houseNumber");
            }}
            aria-invalid={fieldErrors.houseNumber ? true : undefined}
            aria-describedby={fieldErrors.houseNumber ? "endereco-casa-error" : undefined}
          />
        </Field>
      </div>

      <fieldset className="mt-[26px]">
        <legend className="text-[14px] uppercase" style={{ color: INK }}>
          Guardar como :
        </legend>
        <div className="mt-[12px] flex gap-[10px]">
          {ECOBETA_ADDRESS_KINDS.map((kind) => {
            const active = kind.id === draft.kind;
            return (
              <button
                key={kind.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  update("kind", kind.id);
                  clearField("kind");
                }}
                className="h-[45px] min-w-[94px] flex-1 rounded-full text-[14px] transition-colors"
                style={{ background: active ? BRAND_TEAL : FIELD_BG, color: active ? "#FFFFFF" : INK }}
              >
                {kind.label}
              </button>
            );
          })}
        </div>
        {fieldErrors.kind ? (
          <p className="mt-[6px] text-[12px]" style={{ color: ALERT }}>
            {fieldErrors.kind}
          </p>
        ) : null}
      </fieldset>

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
        className="mt-[28px] flex h-[62px] w-full items-center justify-center gap-[10px] rounded-[12px] text-[14px] font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
        style={{ background: BRAND_GREEN }}
      >
        {pending ? <Loader2 className="h-[16px] w-[16px] animate-spin" aria-hidden="true" /> : null}
        Salvar localização
      </button>

      {/* Only an address that is already saved can be taken away, and only after being asked
          twice: the design has no way back for it, and a misread card must not cost one. */}
      {address ? (
        confirmingRemoval ? (
          <div className="mt-[14px] flex items-center justify-center gap-[22px]">
            <button
              type="button"
              onClick={onRemoveClick}
              disabled={pending}
              className="rounded-[10px] px-[6px] py-[6px] text-[13px] font-bold uppercase transition-opacity hover:opacity-80 disabled:cursor-progress disabled:opacity-70"
              style={{ color: DANGER }}
            >
              Sim, remover
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRemoval(false)}
              className="rounded-[10px] px-[6px] py-[6px] text-[13px] uppercase transition-opacity hover:opacity-80"
              style={{ color: MUTED }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingRemoval(true)}
            className="mt-[14px] flex w-full items-center justify-center gap-[8px] rounded-[10px] py-[6px] text-[13px] uppercase transition-opacity hover:opacity-80"
            style={{ color: DANGER }}
          >
            <Trash2 className="h-[16px] w-[16px]" aria-hidden="true" />
            Remover endereço
          </button>
        )
      ) : null}
    </form>
  );
}

/* ── the form's own pieces ────────────────────────────────────────────── */

/**
 * The streets the plane is crossed by. Drawn rather than fetched: what the design's map stands
 * for in this build is the answer the chip gives, not a picture of the place.
 */
const MAP_STREETS: CSSProperties = {
  backgroundImage: [
    "repeating-linear-gradient(90deg, transparent 0 38px, rgba(255, 255, 255, 0.55) 38px 43px)",
    "repeating-linear-gradient(0deg, transparent 0 54px, rgba(255, 255, 255, 0.45) 54px 59px)",
  ].join(", "),
};

/** The form's starting values: the address's own, or the one a new address opens on. */
function valuesFromAddress(address: EcobetaProfileAddress | null): EcobetaAddressValues {
  return {
    kind: address?.kind ?? "casa",
    area: address?.area ?? "",
    street: address?.street ?? "",
    houseNumber: address?.houseNumber ?? "",
    coordinates: address?.coordinates,
  };
}

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
    "h-[50px] w-full rounded-[10px] px-[20px] text-[14px] outline-none transition-colors",
    invalid ? "border border-[#FF3326]" : "border border-transparent focus:border-[#0097B2]",
  ].join(" ");
}

/* ── where the browser puts the person ───────────────────────────────── */

type EcobetaPlaceStatus = "por-calcular" | "a-calcular" | "captada" | "indisponivel";

type EcobetaPlace = {
  status: EcobetaPlaceStatus;
  coordinates?: EcobetaCoordinates;
  /** Asked by the chip: a refusal the person has since undone is worth another look. */
  ask: () => void;
};

/**
 * The chip the design draws over the map is a status, so something has to have a status: this is
 * what the chip asks. It does not ask by itself when the form opens, because asking is a browser
 * permission prompt and a prompt nobody tapped for is a prompt nobody reads; the design's own line,
 * "a calcular sua localização", is what the chip reads while the browser is answering.
 *
 * A frame that withholds the permission, or a person who refuses to be placed, leaves the address
 * to the fields below rather than blocking the form — which is why nothing here throws.
 */
function useEcobetaPlace(): EcobetaPlace {
  const [state, setState] = useState<{ status: EcobetaPlaceStatus; coordinates?: EcobetaCoordinates }>({
    status: "por-calcular",
  });
  /** Only the last ask may answer: a second tap must not be overwritten by the first refusal. */
  const ticket = useRef(0);

  const ask = useCallback(() => {
    ticket.current += 1;
    const mine = ticket.current;
    const settle = (next: { status: EcobetaPlaceStatus; coordinates?: EcobetaCoordinates }) => {
      if (ticket.current === mine) setState(next);
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      settle({ status: "indisponivel" });
      return;
    }

    setState({ status: "a-calcular" });
    navigator.geolocation.getCurrentPosition(
      (result) =>
        settle({
          status: "captada",
          coordinates: { latitude: result.coords.latitude, longitude: result.coords.longitude },
        }),
      () => settle({ status: "indisponivel" }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, ask };
}


