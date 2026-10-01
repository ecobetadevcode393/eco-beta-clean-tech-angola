import * as React from "react";

import type { EcobetaRecyclingEntry } from "@/lib/ecobetaRecycling";
import {
  requestCashout,
  verifyCashout,
  type EcobetaWalletBalance,
  type EcobetaWalletCashout,
  type EcobetaWalletValues,
} from "@/lib/ecobetaWallet";

/**
 * The session's wallet: every levantamento made against the balance, and the two calls that move
 * it.
 *
 * Same reason as `use-ecobeta-recycling` and `use-ecobeta-profile`: the sheet is a modal that
 * closes, and a wallet that forgot its codes every time it was reopened would not be a wallet. So
 * it sits above the modal — in `MyEcobetaAuth`, next to the balance it spends — and the screens
 * only read the levantamentos and hand over new ones.
 *
 * Nothing is persisted, for the same reason the session is not: with no service behind the wallet
 * there is nowhere to write it, and a reload asking for the credentials again is more honest than
 * a code kept in `localStorage` that no ATM would agree with.
 */

/** How many levantamentos the session remembers. The service is the one with the full history. */
const KEPT_CASHOUTS = 20;

export type EcobetaWalletStore = {
  /** The levantamentos made this session, newest first. */
  cashouts: EcobetaWalletCashout[];
  /**
   * Asks for a levantamento and takes its points out of the balance. The service's refusal — or a
   * rule's — throws before anything is spent.
   */
  request: (values: EcobetaWalletValues) => Promise<EcobetaWalletCashout>;
  /**
   * Asks whether a code is still usable and keeps the answer, so the state the card reads is the
   * one the wallet last heard rather than a guess made while drawing it.
   */
  verify: (cashoutId: string) => Promise<EcobetaWalletCashout>;
};

export function useEcobetaWallet({
  points,
  entries,
  onRedeem,
}: {
  points: number;
  /** The ledger behind the balance; the weight a levantamento reports comes from it. */
  entries: EcobetaRecyclingEntry[];
  /** Takes points out of the ledger above: the wallet spends what the ecoponto credited. */
  onRedeem: (points: number) => void;
}): EcobetaWalletStore {
  const [cashouts, setCashouts] = React.useState<EcobetaWalletCashout[]>([]);
  /**
   * This session's own count of levantamentos, held apart from the list: the list is trimmed to
   * `KEPT_CASHOUTS`, and the reference's last number is a place in the session, not in the list.
   */
  const sequence = React.useRef(0);

  const request = React.useCallback(
    async (values: EcobetaWalletValues) => {
      const balance: EcobetaWalletBalance = { points, entries };
      sequence.current += 1;

      const cashout = await requestCashout(values, balance, sequence.current);

      // The points leave the balance as soon as there is a code for them.
      onRedeem(cashout.points);
      setCashouts((current) => [cashout, ...current].slice(0, KEPT_CASHOUTS));

      return cashout;
    },
    [entries, onRedeem, points],
  );

  const verify = React.useCallback(
    async (cashoutId: string) => {
      const current = cashouts.find((cashout) => cashout.id === cashoutId);
      if (!current) throw new Error("wallet-cashout-not-found");

      const next = { ...current, status: await verifyCashout(current) };
      setCashouts((list) => list.map((cashout) => (cashout.id === cashoutId ? next : cashout)));

      return next;
    },
    [cashouts],
  );

  return { cashouts, request, verify };
}
