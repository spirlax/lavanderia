"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CirclePlus,
  ClipboardList,
  Home,
  KeyRound,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Search,
  Shirt,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import styles from "@/components/layout/app-shell.module.css";
import { canAccessAdmin } from "@/lib/auth/authorization";
import type { Profile } from "@/lib/auth/types";

type AppShellProps = {
  profile: Profile;
  cashSessionOpen: boolean;
  children: ReactNode;
};

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: "exact" | "prefix";
};

type NavGroup = {
  title?: string;
  links: NavLink[];
};

function isLinkActive(pathname: string, link: NavLink): boolean {
  if (link.match === "exact") {
    return pathname === link.href;
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function roleLabel(role: Profile["role"]): string {
  return role === "admin" ? "Administrador" : "Operadora";
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[styles.navLink, active ? styles.navLinkActive : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      <Icon className={styles.navIcon} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function CashStatusChip({ open }: { open: boolean }) {
  return (
    <span
      className={[
        styles.cashChip,
        open ? styles.cashChipOpen : styles.cashChipClosed,
      ].join(" ")}
    >
      {open ? "Caja abierta" : "Caja cerrada"}
    </span>
  );
}

function AdminNavGroups({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const groups: NavGroup[] = [
    {
      links: [
        {
          href: "/admin",
          label: "Panel",
          icon: LayoutDashboard,
          match: "exact",
        },
      ],
    },
    {
      title: "Gestión",
      links: [
        {
          href: "/admin/pedidos",
          label: "Pedidos",
          icon: ClipboardList,
          match: "prefix",
        },
        {
          href: "/admin/caja",
          label: "Caja",
          icon: Wallet,
          match: "prefix",
        },
        {
          href: "/admin/reportes",
          label: "Reportes",
          icon: BarChart3,
          match: "prefix",
        },
      ],
    },
    {
      title: "Catálogo y datos",
      links: [
        {
          href: "/admin/servicios",
          label: "Servicios",
          icon: Shirt,
          match: "prefix",
        },
        {
          href: "/admin/importaciones",
          label: "Importaciones",
          icon: Upload,
          match: "prefix",
        },
      ],
    },
    {
      title: "Acceso",
      links: [
        {
          href: "/admin/pin",
          label: "Operadoras y PIN",
          icon: KeyRound,
          match: "prefix",
        },
      ],
    },
  ];

  return (
    <>
      {groups.map((group) => (
        <div
          key={group.title ?? group.links[0]?.href ?? "group"}
          className={styles.navGroup}
        >
          {group.title ? (
            <p className={styles.navGroupTitle}>{group.title}</p>
          ) : null}
          {group.links.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={isLinkActive(pathname, link)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </>
  );
}

export function AppShell({
  profile,
  cashSessionOpen,
  children,
}: AppShellProps) {
  const pathname = usePathname();

  if (canAccessAdmin(profile.role)) {
    return (
      <AdminShell
        profile={profile}
        pathname={pathname}
        cashSessionOpen={cashSessionOpen}
      >
        {children}
      </AdminShell>
    );
  }

  return (
    <OperationalShell
      profile={profile}
      pathname={pathname}
      cashSessionOpen={cashSessionOpen}
    >
      {children}
    </OperationalShell>
  );
}

function AdminShell({
  profile,
  pathname,
  cashSessionOpen,
  children,
}: {
  profile: Profile;
  pathname: string;
  cashSessionOpen: boolean;
  children: ReactNode;
}) {
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const close = useCallback(() => setOpenPath(null), []);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const navigation = <AdminNavGroups pathname={pathname} onNavigate={close} />;

  return (
    <div className={`${styles.shell} ${styles.shellAdmin}`}>
      <aside
        className={styles.shellAdminDesktop}
        aria-label="Navegación administrativa"
      >
        <div className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <div className={styles.brandBlock}>
              <p className={styles.brand}>Gestión de lavandería</p>
              <p className={styles.userRole}>Panel administrativo</p>
              <CashStatusChip open={cashSessionOpen} />
            </div>
            <nav className={styles.sidebarNav}>{navigation}</nav>
            <div className={styles.drawerFooter}>
              <div className={styles.userBlock}>
                <span className={styles.userName}>{profile.full_name}</span>
                <span className={styles.userRole}>
                  {roleLabel(profile.role)}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.adminMobileChrome}>
        <header className={styles.mobileHeader}>
          <div className={styles.headerCopy}>
            <p className={styles.brand}>Gestión de lavandería</p>
            <CashStatusChip open={cashSessionOpen} />
          </div>
          <button
            type="button"
            className={styles.iconButton}
            aria-expanded={open}
            aria-controls={titleId}
            aria-label="Abrir menú"
            onClick={() => setOpenPath(pathname)}
          >
            <Menu aria-hidden="true" size={20} />
          </button>
        </header>

        {open ? (
          <>
            <button
              type="button"
              className={styles.backdrop}
              aria-label="Cerrar menú"
              onClick={close}
            />
            <div
              id={titleId}
              className={styles.drawer}
              role="dialog"
              aria-modal="true"
              aria-label="Menú administrativo"
            >
              <div className={styles.drawerHeader}>
                <p className={styles.brand}>Menú</p>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Cerrar menú"
                  onClick={close}
                >
                  <X aria-hidden="true" size={20} />
                </button>
              </div>
              <nav className={styles.drawerNav}>{navigation}</nav>
              <div className={styles.drawerFooter}>
                <div className={styles.userBlock}>
                  <span className={styles.userName}>{profile.full_name}</span>
                  <span className={styles.userRole}>
                    {roleLabel(profile.role)}
                  </span>
                </div>
                <LogoutButton />
              </div>
            </div>
          </>
        ) : null}
      </div>

      <main className={styles.shellAdminMain}>{children}</main>
    </div>
  );
}

function OperationalShell({
  profile,
  pathname,
  cashSessionOpen,
  children,
}: {
  profile: Profile;
  pathname: string;
  cashSessionOpen: boolean;
  children: ReactNode;
}) {
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const menuRef = useRef<HTMLDivElement>(null);
  const morePanelId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuPath(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPath(null);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const primaryLinks: NavLink[] = [
    { href: "/", label: "Inicio", icon: Home, match: "exact" },
    { href: "/nuevo", label: "Nuevo", icon: CirclePlus, match: "prefix" },
    { href: "/buscar", label: "Buscar", icon: Search, match: "prefix" },
    { href: "/caja", label: "Caja", icon: Wallet, match: "prefix" },
  ];

  const desktopLinks: NavLink[] = [
    { href: "/", label: "Inicio", icon: Home, match: "exact" },
    {
      href: "/nuevo",
      label: "Nuevo pedido",
      icon: CirclePlus,
      match: "prefix",
    },
    { href: "/buscar", label: "Buscar", icon: Search, match: "prefix" },
    { href: "/clientes", label: "Clientes", icon: Users, match: "prefix" },
    { href: "/caja", label: "Caja", icon: Wallet, match: "prefix" },
  ];

  return (
    <div className={`${styles.shell} ${styles.shellOperational}`}>
      <header className={styles.topOperational}>
        <div className={styles.topOperationalInner}>
          <div className={styles.brandBlock}>
            <p className={styles.brand}>Gestión de lavandería</p>
            <p className={styles.userRole}>
              {profile.full_name} · {roleLabel(profile.role)}
            </p>
            <CashStatusChip open={cashSessionOpen} />
          </div>
          <nav className={styles.topOperationalNav} aria-label="Operación">
            {desktopLinks.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={isLinkActive(pathname, link)}
              />
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <header className={styles.mobileHeader}>
        <div className={styles.headerCopy}>
          <p className={styles.brand}>Gestión de lavandería</p>
          <div className={styles.headerMeta}>
            <p className={styles.userRole}>{profile.full_name}</p>
            <CashStatusChip open={cashSessionOpen} />
          </div>
        </div>
      </header>

      <main className={styles.shellOperationalMain}>{children}</main>

      <nav className={styles.bottomNav} aria-label="Navegación operativa">
        {primaryLinks.map((link) => {
          const active = isLinkActive(pathname, link);
          const Icon = link.icon;
          const isNuevo = link.href === "/nuevo";

          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                styles.bottomNavLink,
                isNuevo ? styles.bottomNavLinkPrimary : "",
                active ? styles.bottomNavLinkActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={styles.bottomNavIcon} aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          );
        })}
        <div className={styles.secondaryMenu} ref={menuRef}>
          <button
            type="button"
            className={[
              styles.bottomNavLink,
              menuOpen || pathname.startsWith("/clientes")
                ? styles.bottomNavLinkActive
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-expanded={menuOpen}
            aria-controls={morePanelId}
            onClick={() =>
              setMenuPath((current) => (current === pathname ? null : pathname))
            }
          >
            <MoreHorizontal
              className={styles.bottomNavIcon}
              aria-hidden="true"
            />
            <span>Más</span>
          </button>
          {menuOpen ? (
            <div id={morePanelId} className={styles.secondaryPanel}>
              <Link
                href="/clientes"
                className={styles.secondaryItem}
                onClick={() => setMenuPath(null)}
              >
                <Users className={styles.navIcon} aria-hidden="true" />
                <span>Clientes</span>
              </Link>
              <LogoutButton className={styles.secondaryLogout} />
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
