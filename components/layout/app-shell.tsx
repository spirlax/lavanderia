"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import {
  canAccessAdmin,
  canUseOperationalArea,
} from "@/lib/auth/authorization";
import type { Profile } from "@/lib/auth/types";

type AppShellProps = {
  profile: Profile;
  children: ReactNode;
};

function isAdminArea(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function NavItem({
  href,
  label,
  active,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
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
      {label}
    </Link>
  );
}

function roleLabel(role: Profile["role"]): string {
  return role === "admin" ? "Administrador" : "Operador";
}

export function AppShell({ profile, children }: AppShellProps) {
  const pathname = usePathname();
  const showAdminChrome =
    canAccessAdmin(profile.role) && isAdminArea(pathname);
  const showOperationalChrome =
    canUseOperationalArea(profile.role) && !showAdminChrome;

  if (showAdminChrome) {
    return (
      <AdminShell profile={profile} pathname={pathname}>
        {children}
      </AdminShell>
    );
  }

  if (showOperationalChrome) {
    return (
      <OperationalShell profile={profile} pathname={pathname}>
        {children}
      </OperationalShell>
    );
  }

  return <div className={styles.shell}>{children}</div>;
}

function AdminShell({
  profile,
  pathname,
  children,
}: {
  profile: Profile;
  pathname: string;
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

  const links = (
    <>
      <NavItem
        href="/admin"
        label="Panel"
        active={pathname === "/admin"}
        onNavigate={close}
      />
      <NavItem
        href="/admin/servicios"
        label="Servicios"
        active={pathname.startsWith("/admin/servicios")}
        onNavigate={close}
      />
      <NavItem
        href="/clientes"
        label="Clientes"
        active={pathname.startsWith("/clientes")}
        onNavigate={close}
      />
      <NavItem
        href="/"
        label="Ir a operación"
        active={false}
        onNavigate={close}
        className={styles.navLinkPrimary}
      />
    </>
  );

  return (
    <div className={`${styles.shell} ${styles.shellAdmin}`}>
      <aside className={styles.shellAdminDesktop} aria-label="Navegación administrativa">
        <div className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <div>
              <p className={styles.brand}>Lavandería</p>
              <p className={styles.userRole}>Panel administrativo</p>
            </div>
            <nav className={styles.sidebarNav}>{links}</nav>
            <div className={styles.drawerFooter}>
              <div className={styles.userBlock}>
                <span className={styles.userName}>{profile.full_name}</span>
                <span className={styles.userRole}>{roleLabel(profile.role)}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.adminMobileChrome}>
        <header className={styles.mobileHeader}>
          <p className={styles.brand}>Lavandería</p>
          <button
            type="button"
            className={styles.iconButton}
            aria-expanded={open}
            aria-controls={titleId}
            onClick={() => setOpenPath(pathname)}
          >
            Menú
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
                  onClick={close}
                >
                  Cerrar
                </button>
              </div>
              <nav className={styles.drawerNav}>{links}</nav>
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
  children,
}: {
  profile: Profile;
  pathname: string;
  children: ReactNode;
}) {
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = canAccessAdmin(profile.role);

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

  const primaryLinks = [
    { href: "/", label: "Inicio" },
    { href: "/nuevo", label: "Nuevo pedido" },
    { href: "/buscar", label: "Buscar" },
  ] as const;

  return (
    <div className={`${styles.shell} ${styles.shellOperational}`}>
      <header className={styles.topOperational}>
        <div className={styles.topOperationalInner}>
          <div>
            <p className={styles.brand}>Lavandería</p>
            <p className={styles.userRole}>
              {profile.full_name} · {roleLabel(profile.role)}
            </p>
          </div>
          <nav className={styles.topOperationalNav} aria-label="Operación">
            {primaryLinks.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                active={
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href)
                }
              />
            ))}
            <NavItem
              href="/clientes"
              label="Clientes"
              active={pathname.startsWith("/clientes")}
            />
            {isAdmin ? (
              <NavItem
                href="/admin"
                label="Volver al panel administrativo"
                active={false}
                className={styles.navLinkPrimary}
              />
            ) : null}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <header className={styles.mobileHeader}>
        <div>
          <p className={styles.brand}>Lavandería</p>
          <p className={styles.userRole}>{profile.full_name}</p>
        </div>
        <div className={styles.secondaryMenu} ref={menuRef}>
          <button
            type="button"
            className={styles.iconButton}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() =>
              setMenuPath((current) => (current === pathname ? null : pathname))
            }
          >
            Más
          </button>
          {menuOpen ? (
            <div className={`${styles.secondaryPanel} ${styles.secondaryPanelTop}`} role="menu">
              <Link
                href="/clientes"
                className={styles.secondaryItem}
                role="menuitem"
                onClick={() => setMenuPath(null)}
              >
                Clientes
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className={styles.secondaryItem}
                  role="menuitem"
                  onClick={() => setMenuPath(null)}
                >
                  Volver al panel administrativo
                </Link>
              ) : null}
              <div className={styles.secondaryItem}>
                <LogoutButton />
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className={styles.shellOperationalMain}>{children}</main>

      <nav className={styles.bottomNav} aria-label="Navegación operativa">
        {primaryLinks.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                styles.bottomNavLink,
                active ? styles.bottomNavLinkActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
