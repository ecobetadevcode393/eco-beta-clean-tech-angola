/**
 * The person behind an account, and the addresses an ecoponto can be pointed at.
 *
 * Same shape as `lib/myecobetaAuth.ts` and `lib/ecobetaRecycling.ts`, and for the same reason:
 * the site is a static export with no server at runtime, so the screens work with whatever the
 * deployment points them at. `NEXT_PUBLIC_MYECOBETA_API_URL` is that seam:
 *
 *   - set it and the profile is read with `GET <URL>/profile`, written back with
 *     `PATCH <URL>/profile`, and its addresses posted to `<URL>/profile/addresses`;
 *   - leave it unset and the profile is seeded from the account and kept in memory for the
 *     session only, which is what the GitHub Pages deployment does today.
 *
 * The rules live here rather than inside the screens so they are readable in one place, and so
 * the two profile screens and the address form cannot disagree about what a phone number is.
 */

import { MYECOBETA_API_URL, MYECOBETA_IS_LOCAL, type MyEcobetaAccount } from "@/lib/myecobetaAuth";

/* ── what a profile holds ─────────────────────────────────────────────── */

/** How an address is kept. The three the address form offers, in the order it offers them. */
export type EcobetaAddressKind = "casa" | "servico" | "outro";

export const ECOBETA_ADDRESS_KINDS: readonly { id: EcobetaAddressKind; label: string }[] = [
  { id: "casa", label: "CASA" },
  { id: "servico", label: "SERVIÇO" },
  { id: "outro", label: "OUTRO" },
];

/** Where the browser put the person when the address was saved. */
export type EcobetaCoordinates = { latitude: number; longitude: number };

/**
 * One address on the account. `area` is the field the address form calls "Endereço" — the zone
 * the address sits in — because that is what the address card reads back under its kind.
 */
export type EcobetaProfileAddress = {
  id: string;
  kind: EcobetaAddressKind;
  area: string;
  street: string;
  houseNumber: string;
  /** Absent when the browser could not place the person, or was not asked to. */
  coordinates?: EcobetaCoordinates;
};

export type EcobetaProfile = {
  name: string;
  nif: string;
  phone: string;
  /** A data URL while the photograph only lives in this session; empty means the initials stand in. */
  avatarUrl: string;
  addresses: EcobetaProfileAddress[];
};

/* ── what the two forms hand over ─────────────────────────────────────── */

export type EcobetaProfileValues = Pick<EcobetaProfile, "name" | "nif" | "phone" | "avatarUrl">;
export type EcobetaProfileField = keyof EcobetaProfileValues;
export type EcobetaProfileFieldErrors = Partial<Record<EcobetaProfileField, string>>;

export type EcobetaAddressValues = Omit<EcobetaProfileAddress, "id">;
export type EcobetaAddressField = "kind" | "area" | "street" | "houseNumber";
export type EcobetaAddressFieldErrors = Partial<Record<EcobetaAddressField, string>>;

/**
 * One error shape per form, so a screen paints field-level problems the same way whether they
 * came from the rules below or from the service. They mirror `MyEcobetaAuthError`.
 */
export class EcobetaProfileError extends Error {
  readonly fieldErrors: EcobetaProfileFieldErrors;

  constructor(message: string, fieldErrors: EcobetaProfileFieldErrors = {}) {
    super(message);
    this.name = "EcobetaProfileError";
    this.fieldErrors = fieldErrors;
  }
}

export class EcobetaAddressError extends Error {
  readonly fieldErrors: EcobetaAddressFieldErrors;

  constructor(message: string, fieldErrors: EcobetaAddressFieldErrors = {}) {
    super(message);
    this.name = "EcobetaAddressError";
    this.fieldErrors = fieldErrors;
  }
}

/* ── seeding and reading back ─────────────────────────────────────────── */

/**
 * What an account arrives with. The name is the sign-in screen's; every other field is the
 * person's to fill in, so it starts empty rather than with a sample.
 */
export function profileFromAccount(account: MyEcobetaAccount | null): EcobetaProfile {
  return { name: account?.name ?? "", nif: "", phone: "", avatarUrl: "", addresses: [] };
}

/** The form's starting values when it opens on an existing profile. */
export function valuesFromProfile(profile: EcobetaProfile): EcobetaProfileValues {
  return { name: profile.name, nif: profile.nif, phone: profile.phone, avatarUrl: profile.avatarUrl };
}

/* ── the rules ────────────────────────────────────────────────────────── */

const MIN_NAME_LENGTH = 3;

/*
 * Deliberately loose, the way the email pattern in `lib/myecobetaAuth.ts` is: the document is
 * only shape-checked here because the real check belongs to the service an ecoponto answers to,
 * and a stricter pattern refuses valid documents far more often than it catches a typo.
 */
const NIF_PATTERN = /^[0-9A-Z]{5,20}$/;

/** An Angolan subscriber number, written with or without the country code. */
const PHONE_PATTERN = /^[92]\d{8}$/;

/** What a photograph picked in the browser may weigh, before it is kept as a data URL. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/**
 * Reads a number back as the nine digits an Angolan subscriber number has. The country code is
 * accepted and dropped — `+244 940 926 040` and `940926040` are both the person's to type — and
 * every separator in between is ignored rather than guessed at.
 */
export function parsePhone(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  const national = digits.startsWith("244") ? digits.slice(3) : digits;
  return PHONE_PATTERN.test(national) ? national : null;
}

export function validateProfile(values: EcobetaProfileValues): EcobetaProfileFieldErrors {
  const errors: EcobetaProfileFieldErrors = {};

  if (!values.name.trim()) errors.name = "Indique o seu nome.";
  else if (values.name.trim().length < MIN_NAME_LENGTH) errors.name = "Esse nome parece curto demais.";

  if (!values.nif.trim()) errors.nif = "Indique o seu NIF.";
  else if (!NIF_PATTERN.test(values.nif.trim())) errors.nif = "Use o NIF como aparece no documento.";

  if (!values.phone.trim()) errors.phone = "Indique o seu número de telefone.";
  else if (parsePhone(values.phone) === null) {
    errors.phone = "Use um número angolano, por exemplo 940 926 040.";
  }

  if (values.avatarUrl && !/^(data:image\/|https?:\/\/)/.test(values.avatarUrl)) {
    errors.avatarUrl = "Escolha uma imagem para a fotografia de perfil.";
  }

  return errors;
}

export function validateAddress(values: EcobetaAddressValues): EcobetaAddressFieldErrors {
  const errors: EcobetaAddressFieldErrors = {};

  if (!ECOBETA_ADDRESS_KINDS.some((kind) => kind.id === values.kind)) {
    errors.kind = "Escolha como guardar o endereço.";
  }

  if (!values.area.trim()) errors.area = "Indique o endereço (bairro ou zona).";
  if (!values.street.trim()) errors.street = "Indique a rua.";
  if (!values.houseNumber.trim()) errors.houseNumber = "Indique o número da casa.";

  return errors;
}

function hasErrors(errors: object) {
  return Object.keys(errors).length > 0;
}

/**
 * Both strings are trimmed and their runs of spaces closed: the screens show them back, so
 * `" NGUIZE  CHIWOLOLO "` has to come home as `"NGUIZE CHIWOLOLO"`.
 */
function normalizeProfile(values: EcobetaProfileValues): EcobetaProfileValues {
  return {
    name: values.name.trim().replace(/\s+/g, " "),
    nif: values.nif.trim().replace(/\s+/g, "").toUpperCase(),
    phone: values.phone.trim(),
    avatarUrl: values.avatarUrl.trim(),
  };
}

function normalizeAddress(values: EcobetaAddressValues): EcobetaAddressValues {
  return {
    kind: values.kind,
    area: values.area.trim().replace(/\s+/g, " "),
    street: values.street.trim().replace(/\s+/g, " "),
    houseNumber: values.houseNumber.trim(),
    coordinates: values.coordinates,
  };
}

/* ── the only place these screens talk to a service ───────────────────── */

/** What the service may answer with. Everything in it is optional: the record there is the boss. */
type EcobetaProfileServicePayload = {
  name?: string;
  nif?: string;
  phone?: string;
  avatarUrl?: string;
  addresses?: (Partial<EcobetaProfileAddress> & { id?: string })[];
};

/**
 * The profile the account already has, when there is a service to ask. A refusal is not worth a
 * message: the seeded profile is what the screens would show without the service at all, and a
 * person who has not filled in their NIF yet sees exactly that.
 */
export async function readProfile(account: MyEcobetaAccount): Promise<EcobetaProfile> {
  const seeded = profileFromAccount(account);
  if (MYECOBETA_IS_LOCAL) return seeded;

  const payload = await request<EcobetaProfileServicePayload>("/profile", "GET");

  return {
    name: payload.name?.trim() || seeded.name,
    nif: payload.nif?.trim() || seeded.nif,
    phone: payload.phone?.trim() || seeded.phone,
    avatarUrl: payload.avatarUrl?.trim() || seeded.avatarUrl,
    addresses: Array.isArray(payload.addresses) ? payload.addresses.flatMap(readServiceAddress) : seeded.addresses,
  };
}

/** One address as the service keeps it, dropped when it is missing the piece that names it. */
function readServiceAddress(address: Partial<EcobetaProfileAddress>): EcobetaProfileAddress[] {
  if (!address.kind) return [];
  return [
    {
      id: address.id ?? newAddressId(),
      kind: address.kind,
      area: address.area?.trim() ?? "",
      street: address.street?.trim() ?? "",
      houseNumber: address.houseNumber?.trim() ?? "",
      coordinates: address.coordinates,
    },
  ];
}

export async function saveProfile(values: EcobetaProfileValues): Promise<EcobetaProfileValues> {
  const normalized = normalizeProfile(values);
  const fieldErrors = validateProfile(normalized);
  if (hasErrors(fieldErrors)) throw new EcobetaProfileError("Verifique os campos assinalados.", fieldErrors);

  if (MYECOBETA_IS_LOCAL) return normalized;

  await request("/profile", "PATCH", normalized);
  return normalized;
}

/**
 * Saves one address, adding it when there is no `addressId` and changing it when there is.
 * `addressId` is what stands in for the service's own identifier until it answers with one.
 */
export async function saveAddress(
  values: EcobetaAddressValues,
  addressId?: string,
): Promise<EcobetaProfileAddress> {
  const normalized = normalizeAddress(values);
  const fieldErrors = validateAddress(normalized);
  if (hasErrors(fieldErrors)) throw new EcobetaAddressError("Verifique os campos assinalados.", fieldErrors);

  if (MYECOBETA_IS_LOCAL) return { id: addressId ?? newAddressId(), ...normalized };

  try {
    const payload = await request<{ id?: string }>(
      addressId ? `/profile/addresses/${addressId}` : "/profile/addresses",
      addressId ? "PATCH" : "POST",
      normalized,
    );
    return { id: payload.id ?? addressId ?? newAddressId(), ...normalized };
  } catch (error) {
    throw asAddressError(error);
  }
}

export async function removeAddress(addressId: string): Promise<void> {
  if (MYECOBETA_IS_LOCAL) return;

  try {
    await request<void>(`/profile/addresses/${addressId}`, "DELETE");
  } catch (error) {
    throw asAddressError(error);
  }
}

/**
 * The shared request refuses with the profile's error, because that is the only class it has an
 * error to give. The address form wants its own, so the refusal is re-worn here.
 */
function asAddressError(error: unknown): EcobetaAddressError {
  if (error instanceof EcobetaAddressError) return error;

  const message = error instanceof Error ? error.message : "O serviço recusou o pedido. Tente novamente.";
  const fieldErrors =
    error instanceof EcobetaProfileError ? (error.fieldErrors as EcobetaAddressFieldErrors) : {};

  return new EcobetaAddressError(message, fieldErrors);
}

/**
 * The same contract as the other two modules: a body of `{ message, fieldErrors }` is honoured,
 * so the service can hand field-level problems back into whichever form made the call.
 */
async function request<T>(path: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    // The session cookie belongs to the service, not to this origin.
    credentials: "include",
  };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${MYECOBETA_API_URL}${path}`, init);
  } catch {
    throw new EcobetaProfileError("Não foi possível contactar o serviço. Verifique a ligação.");
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; fieldErrors?: EcobetaProfileFieldErrors })
    | null;

  if (!response.ok) {
    throw new EcobetaProfileError(
      payload?.message ?? "O serviço recusou o pedido. Tente novamente.",
      payload?.fieldErrors ?? {},
    );
  }

  // A `DELETE` answers with nothing to read: a service that said no body at all is still a
  // service that agreed.
  return (payload ?? {}) as T;
}

/**
 * The address's own identifier until the service hands one over. Same shape as the recycling
 * entry's, so a deployment where both live in the same ledger reads the two side by side.
 */
function newAddressId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `eb-end-${uuid}`;
  return `eb-end-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
