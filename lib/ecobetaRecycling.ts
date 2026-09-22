/**
 * Recycling entries and the points they earn.
 *
 * Same shape as `lib/myecobetaAuth.ts`, and for the same reason: the site is a static export
 * with no server at runtime, so the screen works with whatever the deployment points it at.
 * `NEXT_PUBLIC_MYECOBETA_API_URL` is that seam:
 *
 *   - set it and `POST <URL>/recyclings` answers with the entry and the new balance;
 *   - leave it unset and the entry is priced here and kept in memory for the session only,
 *     which is what the GitHub Pages deployment does today.
 *
 * The rules live here rather than inside the screen so they are readable in one place, and so
 * the pt-AO number formatting is written once instead of at every place that shows a value.
 */

import { MYECOBETA_API_URL, MYECOBETA_IS_LOCAL } from "@/lib/myecobetaAuth";

/** The kinds of residue an ecoponto in Angola takes. */
export type EcobetaMaterialId =
  | "papel"
  | "plastico"
  | "vidro"
  | "metal"
  | "oleo"
  | "electronicos"
  | "organico";

export type EcobetaMaterial = {
  id: EcobetaMaterialId;
  label: string;
  /** Points credited per kilogram. */
  pointsPerKg: number;
  /** The material's own colour, used by the swatch beside its name. */
  swatch: string;
};

/**
 * What the ecoponto prices against. This is the app's first pass at the table — the service
 * owns the real one — which is why the whole table sits in a single place and why
 * `registerRecycling` asks the service for the balance whenever there is a service to ask.
 */
export const ECOBETA_MATERIALS: readonly EcobetaMaterial[] = [
  { id: "papel", label: "Papel e cartão", pointsPerKg: 10, swatch: "#6B8AFD" },
  { id: "plastico", label: "Plástico", pointsPerKg: 25, swatch: "#FF8A3D" },
  { id: "vidro", label: "Vidro", pointsPerKg: 15, swatch: "#00A3C4" },
  { id: "metal", label: "Metal e latas", pointsPerKg: 40, swatch: "#8A8F98" },
  { id: "oleo", label: "Óleo alimentar usado", pointsPerKg: 30, swatch: "#F2B705" },
  { id: "electronicos", label: "Equipamentos eléctricos", pointsPerKg: 80, swatch: "#7A5AF8" },
  { id: "organico", label: "Resíduo orgânico", pointsPerKg: 5, swatch: "#00BF63" },
];

/** One bag on the scale, not a truck: the ceiling keeps a typo from paying out. */
const MAX_WEIGHT_KG = 500;

export function materialById(id: EcobetaMaterialId | ""): EcobetaMaterial | null {
  return ECOBETA_MATERIALS.find((material) => material.id === id) ?? null;
}

/* ── what the form hands over ─────────────────────────────────────────── */

/**
 * The weight stays text all the way to the service: "2,5" and "2.5" are both the user's to
 * type, and the field is not a number input for exactly that reason.
 */
export type EcobetaRecyclingValues = {
  material: EcobetaMaterialId | "";
  weight: string;
};

export type EcobetaRecyclingField = "material" | "weight";

export type EcobetaRecyclingFieldErrors = Partial<Record<EcobetaRecyclingField, string>>;

export type EcobetaRecyclingEntry = {
  id: string;
  material: EcobetaMaterialId;
  weightKg: number;
  points: number;
  createdAt: string;
};

export type EcobetaRecyclingResult = {
  entry: EcobetaRecyclingEntry;
  /** The balance after this entry, when the service knows it. Local mode leaves it out. */
  totalPoints?: number;
};

/**
 * One error shape for the screen, whether the rejection came from the rules below or from the
 * service, mirroring `MyEcobetaAuthError`.
 */
export class EcobetaRecyclingError extends Error {
  readonly fieldErrors: EcobetaRecyclingFieldErrors;

  constructor(message: string, fieldErrors: EcobetaRecyclingFieldErrors = {}) {
    super(message);
    this.name = "EcobetaRecyclingError";
    this.fieldErrors = fieldErrors;
  }
}

/* ── the rules ────────────────────────────────────────────────────────── */

/**
 * Reads the field back as kilograms. Accepts a comma or a dot as the decimal mark — the two
 * keyboards that show up in Angola — and nothing else: a weight typed at an ecoponto is a bag
 * on a scale, so grouping separators and pasted text are refused rather than guessed at.
 */
export function parseWeight(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const kg = Number(normalized);
  return Number.isFinite(kg) && kg > 0 ? kg : null;
}

export function validateRecycling({
  material,
  weight,
}: EcobetaRecyclingValues): EcobetaRecyclingFieldErrors {
  const errors: EcobetaRecyclingFieldErrors = {};

  if (!material) errors.material = "Escolha o material (tipo de resíduo).";

  const kg = parseWeight(weight);
  if (!weight.trim()) errors.weight = "Informe o peso em quilogramas.";
  else if (kg === null) errors.weight = "Use um peso em kg, por exemplo 2,5.";
  else if (kg > MAX_WEIGHT_KG) errors.weight = `O peso por registo vai até ${MAX_WEIGHT_KG} kg.`;

  return errors;
}

/** What this entry is worth: the weight times the material's rate, to the cent. */
export function pointsFor(material: EcobetaMaterialId, weightKg: number): number {
  const rate = materialById(material)?.pointsPerKg ?? 0;
  return Math.round(weightKg * rate * 100) / 100;
}

/* ── numbers as they are read in Angola ───────────────────────────────── */

/** `1234.5` → `"1.234,50"`. Written by hand so it cannot move with the machine's locale. */
export function formatPoints(value: number): string {
  const [integers, decimals] = (Math.round(value * 100) / 100).toFixed(2).split(".");
  return `${integers.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimals}`;
}

/** `2.5` → `"2,50"`, for a weight written into a sentence. */
export function formatWeight(weightKg: number): string {
  return weightKg.toFixed(2).replace(".", ",");
}

/**
 * The code the ecoponto reads for this account. Derived from the address so it is the same on
 * every visit without a directory to ask, and short enough to be read out loud when a scan is
 * not possible. The service owns the real identifier; this is what stands in for it offline.
 */
export function accountCode(email: string): string {
  let hash = 0x811c9dc5;
  const normalized = email.trim().toLowerCase();
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  const digits = hash.toString(36).toUpperCase().padStart(7, "0");
  return `EB-${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
}

/* ── the only place this screen talks to a service ────────────────────── */

/** What the service may answer with. Everything in it is optional: the table there is the boss. */
type EcobetaRecyclingServiceEntry = {
  id?: string;
  points?: number;
  createdAt?: string;
  totalPoints?: number;
};

export async function registerRecycling(
  values: EcobetaRecyclingValues,
): Promise<EcobetaRecyclingResult> {
  const fieldErrors = validateRecycling(values);
  if (Object.keys(fieldErrors).length > 0) {
    throw new EcobetaRecyclingError("Verifique os campos assinalados.", fieldErrors);
  }

  const material = values.material as EcobetaMaterialId;
  const weightKg = parseWeight(values.weight) as number;
  const points = pointsFor(material, weightKg);

  if (MYECOBETA_IS_LOCAL) {
    const entry: EcobetaRecyclingEntry = {
      id: newEntryId(),
      material,
      weightKg,
      points,
      createdAt: new Date().toISOString(),
    };
    return { entry };
  }

  const payload = await request<EcobetaRecyclingServiceEntry>("/recyclings", {
    material,
    weightKg,
  });

  // The service's own answer wins where it has one, so a table that changed on the server is
  // reflected here without this screen having to know the rates.
  return {
    entry: {
      id: payload.id ?? newEntryId(),
      material,
      weightKg,
      points: payload.points ?? points,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    },
    totalPoints: typeof payload.totalPoints === "number" ? payload.totalPoints : undefined,
  };
}

/**
 * The same contract as the account screen's requests: a body of `{ message, fieldErrors }` is
 * honoured, so the service can hand field-level problems back into the form.
 */
async function request<T>(path: string, body: unknown): Promise<T> {
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
    throw new EcobetaRecyclingError("Não foi possível contactar o serviço. Verifique a ligação.");
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; fieldErrors?: EcobetaRecyclingFieldErrors })
    | null;

  if (!response.ok || !payload) {
    throw new EcobetaRecyclingError(
      payload?.message ?? "O serviço recusou o registo. Tente novamente.",
      payload?.fieldErrors ?? {},
    );
  }

  return payload;
}

function newEntryId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `eb-${uuid}`;
  return `eb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
