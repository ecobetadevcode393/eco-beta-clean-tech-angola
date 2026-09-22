/**
 * Profile menu + inbox for the recycling sheet (the Menu design).
 * Avatar opens profile, bell opens inbox. Same 375px sheet.
 */

"use client";

import { Bell, ChevronRight, Gift, LogOut, MapPin } from "lucide-react";
import { CircleHelp, MessageSquareText, ShieldCheck, UserRound, Wallet } from "lucide-react";

import type { MyEcobetaAccount } from "@/lib/myecobetaAuth";
import { accountInitials } from "@/lib/myecobetaAuth";
import { formatPoints } from "@/lib/ecobetaRecycling";

const INK = "#32343E";
const MUTED = "#676767";
const BRAND_TEAL = "#0097B2";
const GOLD = "#EBB329";
const CARD_BG = "#F6F8FA";
const ICON_BG = "#FFFFFF";
const DANGER = "#FB4A59";
const CHEVRON = "#747783";

export type EcobetaProfileMenuProps = {
  account: MyEcobetaAccount;
  points: number;
  onBack: () => void;
  onSignOut: () => void;
};

type MenuRow = { icon: typeof UserRound; color: string; label: string };

export function EcobetaProfileMenu({ account, points, onBack, onSignOut }: EcobetaProfileMenuProps) {
  const initials = accountInitials(account.name);
  const tier = points >= 5000 ? "ECO OURO" : points >= 1000 ? "ECO PRATA" : "ECO VERDE";
  const groups: MenuRow[][] = [
    [
      { icon: UserRound, color: "#FB6F3D", label: "Info Pessoal" },
      { icon: MapPin, color: "#413DFB", label: "Endereço" },
    ],
    [
      { icon: Wallet, color: "#369BFF", label: "Carteira Digital" },
      { icon: Gift, color: "#B33DFB", label: "Ecopontos" },
      { icon: Bell, color: "#FFAA2A", label: "Notificações" },
      { icon: Gift, color: "#369BFF", label: "Recompensas" },
    ],
  ];

  const faqs: MenuRow[] = [
    { icon: CircleHelp, color: "#FB6D3A", label: "FAQs" },
    { icon: MessageSquareText, color: "#2AE1E1", label: "Comentário dos usuários" },
    { icon: ShieldCheck, color: "#413DFB", label: "Definições de Segurança" },
  ];

  return (
    <div className="pt-[8px]">
      <div className="flex items-center gap-[12px]">
        <span
          aria-hidden="true"
          className="grid h-[100px] w-[100px] flex-none place-items-center rounded-full text-[30px] font-bold text-white"
          style={{ background: BRAND_TEAL }}
        >
          {initials || "E"}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[20px] font-bold capitalize" style={{ color: INK }}>
            {account.name}
          </span>
          <span className="mt-[4px] block text-[14px]" style={{ color: GOLD }}>
            {tier}
          </span>
          <span className="mt-[2px] block text-[12px]" style={{ color: MUTED }}>
            {formatPoints(points)} pts
          </span>
        </span>
      </div>

      {groups.map((rows, groupIndex) => (
        <div key={`grupo-${groupIndex}`} className="mt-[16px] rounded-[16px] p-[8px]" style={{ background: CARD_BG }}>
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <button
                key={row.label}
                type="button"
                onClick={onBack}
                className="flex w-full items-center gap-[12px] rounded-[12px] px-[12px] py-[12px] text-left transition-colors hover:bg-white"
              >
                <span aria-hidden="true" className="grid h-[40px] w-[40px] flex-none place-items-center rounded-full" style={{ background: ICON_BG }}>
                  <Icon className="h-[19px] w-[19px]" style={{ color: row.color }} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[16px]" style={{ color: INK }}>
                  {row.label}
                </span>
                <ChevronRight className="h-[20px] w-[20px] flex-none" style={{ color: CHEVRON }} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ))}

      <div className="mt-[16px] rounded-[16px] p-[8px]" style={{ background: CARD_BG }}>
        {faqs.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.label}
              type="button"
              onClick={onBack}
              className="flex w-full items-center gap-[12px] rounded-[12px] px-[12px] py-[12px] text-left transition-colors hover:bg-white"
            >
              <span aria-hidden="true" className="grid h-[40px] w-[40px] flex-none place-items-center rounded-full" style={{ background: ICON_BG }}>
                <Icon className="h-[19px] w-[19px]" style={{ color: row.color }} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[16px]" style={{ color: INK }}>
                {row.label}
              </span>
              <ChevronRight className="h-[20px] w-[20px] flex-none" style={{ color: CHEVRON }} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="mt-[16px] rounded-[16px] p-[8px]" style={{ background: CARD_BG }}>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-[12px] rounded-[12px] px-[12px] py-[12px] text-left transition-colors hover:bg-white"
        >
          <span aria-hidden="true" className="grid h-[40px] w-[40px] flex-none place-items-center rounded-full" style={{ background: ICON_BG }}>
            <LogOut className="h-[19px] w-[19px]" style={{ color: DANGER }} />
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: INK }}>
            SAIR DA CONTA
          </span>
          <ChevronRight className="h-[20px] w-[20px] flex-none" style={{ color: CHEVRON }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function EcobetaNotifications({ notifications, points }: { notifications: number; points: number }) {
  const shown = Math.min(notifications, 10);
  return (
    <div className="pt-[8px]">
      <p className="text-[20px] capitalize" style={{ color: INK }}>
        Notificações
      </p>
      <p className="mt-[6px] text-[13px] leading-[1.5]" style={{ color: MUTED }}>
        {notifications === 0
          ? "Ainda sem registos nesta sessão. Quando finalizar uma reciclagem, ela aparece aqui."
          : `${notifications} registo${notifications === 1 ? "" : "s"} nesta sessão · ${formatPoints(points)} pts acumulados.`}
      </p>
      {notifications === 0 ? (
        <div className="mt-[16px] rounded-[16px] p-[18px]" style={{ background: CARD_BG }}>
          <p className="text-[14px]" style={{ color: INK }}>
            Sem notificações por agora.
          </p>
        </div>
      ) : (
        <ul className="mt-[16px] space-y-[10px]">
          {Array.from({ length: shown }, (_, index) => (
            <li key={`notificacao-${index}`} className="rounded-[16px] p-[14px]" style={{ background: CARD_BG }}>
              <p className="text-[14px] font-bold" style={{ color: INK }}>
                Reciclagem registada
              </p>
              <p className="mt-[4px] text-[12.5px] leading-[1.5]" style={{ color: MUTED }}>
                Os pontos desta sessão já estão no saldo acima.
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}