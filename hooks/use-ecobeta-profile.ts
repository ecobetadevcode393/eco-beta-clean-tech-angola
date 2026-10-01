import * as React from "react";

import { MYECOBETA_IS_LOCAL, type MyEcobetaAccount } from "@/lib/myecobetaAuth";
import {
  profileFromAccount,
  readProfile,
  removeAddress as removeAddressRequest,
  saveAddress as saveAddressRequest,
  saveProfile as saveProfileRequest,
  type EcobetaAddressValues,
  type EcobetaProfile,
  type EcobetaProfileAddress,
  type EcobetaProfileValues,
} from "@/lib/ecobetaProfile";

/**
 * The session's profile: the data behind an account, and the addresses it keeps.
 *
 * Same reason as `use-ecobeta-recycling`: the screens are faces of one modal that closes, and a
 * name that went blank every time the sheet was reopened would not be a profile. So it sits above
 * the modal — in `MyEcobetaAuth`, next to the account it belongs to — and the screens only read it
 * and hand over new values.
 *
 * Nothing is persisted, for the same reason the session is not: with no service behind the form
 * there is nowhere to write it.
 */

export type EcobetaProfileStore = {
  profile: EcobetaProfile;
  /** Answers with the profile as it now reads, so the caller can show it back immediately. */
  saveProfile: (values: EcobetaProfileValues) => Promise<EcobetaProfile>;
  saveAddress: (values: EcobetaAddressValues, addressId?: string) => Promise<EcobetaProfileAddress>;
  removeAddress: (addressId: string) => Promise<void>;
};

/** A profile this session has written, and the account it was written for. */
type EcobetaWrittenProfile = { account: MyEcobetaAccount | null; profile: EcobetaProfile };

export function useEcobetaProfile(account: MyEcobetaAccount | null): EcobetaProfileStore {
  /**
   * What has been written this session, held together with the account it was written for. Keeping
   * the account beside it is what lets signing out and back in as someone else start clean: a
   * profile written for the previous account is simply not this account's, with nothing to clear in
   * an effect when the account changes.
   */
  const [written, setWritten] = React.useState<EcobetaWrittenProfile | null>(null);

  // The account is the profile's first source: it is the one part of it the sign-in screen already
  // knows. Everything else starts empty and is filled in here.
  const profile = React.useMemo(
    () => (written && written.account === account ? written.profile : profileFromAccount(account)),
    [account, written],
  );

  // Signing in is the only moment a profile can change under the screens: the account goes from
  // none to one, and with a service configured the profile comes from there rather than from the
  // account's own fields. A refusal is not worth a message — the seeded profile is what the screens
  // would show without the service at all, and it stays until the read answers.
  React.useEffect(() => {
    if (!account || MYECOBETA_IS_LOCAL) return;

    let cancelled = false;
    readProfile(account)
      .then((next) => {
        if (!cancelled) setWritten({ account, profile: next });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [account]);

  const saveProfile = React.useCallback(
    async (values: EcobetaProfileValues) => {
      const saved = await saveProfileRequest(values);
      // The addresses are not this form's to touch, so they are carried over rather than replaced.
      const next = { ...profile, ...saved };
      setWritten({ account, profile: next });
      return next;
    },
    [account, profile],
  );

  const saveAddress = React.useCallback(
    async (values: EcobetaAddressValues, addressId?: string) => {
      const saved = await saveAddressRequest(values, addressId);
      const addresses = addressId
        ? profile.addresses.map((address) => (address.id === addressId ? saved : address))
        : [...profile.addresses, saved];
      setWritten({ account, profile: { ...profile, addresses } });
      return saved;
    },
    [account, profile],
  );

  const removeAddress = React.useCallback(
    async (addressId: string) => {
      await removeAddressRequest(addressId);
      setWritten({
        account,
        profile: {
          ...profile,
          addresses: profile.addresses.filter((address) => address.id !== addressId),
        },
      });
    },
    [account, profile],
  );

  return { profile, saveProfile, saveAddress, removeAddress };
}
