"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  FileText,
  KeyRound,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Agent, PlanId } from "@/lib/agent/types";
import { displayName, initials } from "@/lib/agent/profile";
import { useAgent } from "./AgentProvider";
import { SearchPalette } from "./SearchPalette";
import { isItemActive, visibleNavItems, type NavItem } from "./nav-config";

const PLAN_STYLES: Record<PlanId, string> = {
  silver: "from-slate-100 via-white to-slate-300 text-slate-700 ring-slate-300",
  gold: "from-amber-200 via-yellow-50 to-amber-400 text-amber-900 ring-amber-300",
  platinum: "from-indigo-100 via-white to-slate-300 text-indigo-900 ring-indigo-200",
};

export function PlanBadge({ plan, className }: { plan: PlanId; className?: string }) {
  return (
    <Link
      href="/dashboard/pricing"
      title={`${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan — compare plans`}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full bg-gradient-to-b px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] shadow-sm ring-1 transition hover:brightness-105",
        PLAN_STYLES[plan],
        className
      )}
    >
      <span aria-hidden className="text-[11px]">✦</span>
      {plan}
    </Link>
  );
}

export function AgentAvatar({ agent, size = 36 }: { agent: Agent; size?: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-sm font-bold text-orange-700 ring-2 ring-white"
      style={{ width: size, height: size }}
    >
      {agent.brandLogo && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={agent.brandLogo} alt="" className="h-full w-full bg-white object-contain" onError={() => setBroken(true)} />
      ) : (
        initials(agent)
      )}
    </span>
  );
}

function NavPill({ item, active, currentType }: { item: NavItem; active: boolean; currentType: string | null }) {
  const Icon = item.icon;
  const pill = (
    <span
      className={cn(
        "group relative inline-flex flex-col items-center gap-1 rounded-2xl px-3.5 py-2 text-[13px] font-semibold transition-colors",
        active ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px]", active ? "text-orange-500" : "text-slate-500 group-hover:text-slate-800")} strokeWidth={1.9} />
      <span className="flex items-center gap-0.5 leading-none">
        {item.label}
        {item.subItems ? <ChevronDown className="h-3 w-3 opacity-60 transition group-data-[state=open]:rotate-180" /> : null}
      </span>
      {active ? <span className="absolute -bottom-[9px] left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-[var(--primary)]" /> : null}
    </span>
  );

  if (!item.subItems) {
    return (
      <Link href={item.href} aria-current={active ? "page" : undefined} className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
        {pill}
      </Link>
    );
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300" aria-label={`More ${item.label} options`}>
        {pill}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={12} className="w-72 rounded-2xl border-slate-200 p-1.5 shadow-xl">
        {item.subItems.map((sub) => {
          const SubIcon = sub.icon;
          const subType = new URLSearchParams(sub.href.split("?")[1] ?? "").get("type");
          const subActive = subType ? item.key === "invoice" && active && currentType === subType : false;
          return (
            <DropdownMenuItem key={sub.href} asChild className="cursor-pointer rounded-xl p-0 focus:bg-orange-50">
              <Link href={sub.href} className={cn("flex items-start gap-3 px-3 py-2.5", subActive && "bg-orange-50")}>
                <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", subActive ? "bg-[var(--primary)] text-white" : "bg-orange-100 text-orange-600")}>
                  <SubIcon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{sub.label}</span>
                  <span className="block text-xs text-slate-500">{sub.description}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AgentNavbar() {
  const { agent } = useAgent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Hide while scrolling down, reveal on scroll up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > lastY.current + 4);
      if (y < lastY.current - 4 || y < 120) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" or Ctrl/⌘+K opens search (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, searchParams]);

  if (!agent) return null;
  const items = visibleNavItems(agent);
  const currentType = searchParams.get("type");

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-transform duration-300",
          hidden && !mobileOpen && "-translate-y-full"
        )}
      >
        <div className="h-[3px] bg-gradient-to-r from-orange-400 via-[var(--primary)] to-amber-400" />
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="TravelDoc Pro dashboard">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] shadow-sm shadow-orange-500/30">
              <FileText className="h-[18px] w-[18px] text-white" />
            </span>
            <span className="hidden text-[17px] font-bold tracking-tight text-slate-900 sm:inline">
              TravelDoc<span className="text-[var(--primary)]">Pro</span>
            </span>
          </Link>

          <nav aria-label="Main" className="mx-auto hidden items-center gap-0.5 lg:flex">
            {items.map((item, i) => (
              <React.Fragment key={item.key}>
                {i === 1 || item.key === "pricing" ? <span className="mx-1.5 h-8 w-px bg-slate-200" aria-hidden /> : null}
                <NavPill item={item} active={isItemActive(item, pathname)} currentType={currentType} />
              </React.Fragment>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search documents"
              title="Search (/ or Ctrl+K)"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-orange-50 hover:text-orange-600"
            >
              <Search className="h-5 w-5" />
            </button>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300" aria-label="Account menu">
                <span className="flex items-center rounded-full p-0.5 ring-2 ring-orange-100 transition hover:ring-orange-200">
                  <AgentAvatar agent={agent} size={40} />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl p-1.5 shadow-xl">
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName(agent)}</p>
                  <p className="truncate text-xs font-normal text-slate-500">{agent.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer rounded-xl py-2" onSelect={() => router.push("/dashboard/profile")}>
                  <UserRound className="mr-2 h-4 w-4 text-slate-500" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl py-2" onSelect={() => router.push("/dashboard/profile/edit")}>
                  <Settings className="mr-2 h-4 w-4 text-slate-500" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl py-2" onSelect={() => router.push("/dashboard/change-password")}>
                  <KeyRound className="mr-2 h-4 w-4 text-slate-500" /> Change password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                  <a href="/api/auth/logout">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <PlanBadge plan={agent.subscriptionPlan} className="hidden sm:inline-flex" />

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="anim-slide-down max-h-[calc(100dvh-75px)] overflow-y-auto border-t border-slate-100 bg-white px-4 pb-6 pt-3 lg:hidden">
            <nav aria-label="Main" className="grid gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item, pathname);
                return (
                  <div key={item.key} className={cn("rounded-2xl", active && "bg-orange-50/70")}>
                    <Link
                      href={item.href}
                      className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold", active ? "text-orange-600" : "text-slate-800")}
                    >
                      <Icon className="h-5 w-5" /> {item.label}
                    </Link>
                    {item.subItems ? (
                      <div className="flex flex-wrap gap-2 px-3 pb-3 pl-11">
                        {item.subItems.map((sub) => (
                          <Link key={sub.href} href={sub.href} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-orange-300 hover:text-orange-600">
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
              <AgentAvatar agent={agent} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName(agent)}</p>
                <p className="truncate text-xs text-slate-500">{agent.email}</p>
              </div>
              <PlanBadge plan={agent.subscriptionPlan} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/dashboard/profile" className="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium">Profile</Link>
              <a href="/api/auth/logout" className="rounded-xl border border-rose-200 px-3 py-2 text-center text-sm font-medium text-rose-600">Log out</a>
            </div>
          </div>
        ) : null}
      </header>
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
