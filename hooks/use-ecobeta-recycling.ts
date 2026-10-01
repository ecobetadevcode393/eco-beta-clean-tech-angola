import * as React from "react";

import {
  registerRecycling,
  type EcobetaRecyclingEntry,
  type EcobetaRecyclingValues,
} from "@/lib/ecobetaRecycling";

/**
 * The session's recycling ledger.
 *
 * The points have to outlive the screen: the overlay is a modal that closes, and a balance that
 * started from zero again every time it was opened would not be a balance. So the ledger sits
 * above the modal — in `MyEcobetaAuth`, next to the account it belongs to — and the screen only
 * reads the total and hands over new entries.
 *
 * Nothing is persisted, for the same reason the session is not: with no service behind the form
 * there is nowhere to write it, and a reload asking for the credentials again is more honest
 * than a balance kept in `localStorage` that no ecoponto would agree with.
 */

/** How many entries the session remembers. The service is the one with the full history. */
const KEPT_ENTRIES = 20;

export type EcobetaRecyclingLedger = {
  points: number;
  entries: EcobetaRecyclingEntry[];
  register: (values: EcobetaRecyclingValues) => Promise<EcobetaRecyclingEntry>;
  /**
   * Takes points out of the balance, which is what the wallet's levantamentos spend. It is a
   * debit rather than a negative entry because nothing was weighed: the entry the ecoponto
   * credited keeps its own weight and rate, and the balance is what the two add up to.
   */
  redeem: (points: number) => void;
};

export function useEcobetaRecycling(): EcobetaRecyclingLedger {
  const [points, setPoints] = React.useState(0);
  const [entries, setEntries] = React.useState<EcobetaRecyclingEntry[]>([]);

  const register = React.useCallback(async (values: EcobetaRecyclingValues) => {
    const result = await registerRecycling(values);

    // The service reports the balance when it can; without one the entry is what adds up.
    setPoints((current) => result.totalPoints ?? current + result.entry.points);
    setEntries((current) => [result.entry, ...current].slice(0, KEPT_ENTRIES));

    return result.entry;
  }, []);

  const redeem = React.useCallback((spent: number) => {
    // Floored at zero rather than allowed to go negative: what the wallet may spend is validated
    // against this balance before it is spent, and a negative balance would be a bug reading as a
    // debt the person does not have.
    setPoints((current) => Math.max(0, Math.round((current - spent) * 100) / 100));
  }, []);

  return { points, entries, register, redeem };
}
