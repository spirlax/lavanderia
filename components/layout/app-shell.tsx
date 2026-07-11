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
  return role === "admin" ? "Administrador" : "Operadora";
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
        href="/"
        label="Operación"
        active={false}
        onNavigate={close}
      />
      <NavItem
        href="/nuevo"
        label="Nuevo pedido"
        active={false}
        onNavigate={close}
      />
      <NavItem
        href="/buscar"
        label="Buscar pedidos"
        active={false}
        onNavigate={close}
      />
      <NavItem
        href="/clientes"
        label="Clientes"
        active={false}
        onNavigate={close}
      />
      <NavItem
        href="/admin/servicios"
        label="Servicios"
        active={pathname.startsWith("/admin/servicios")}
        onNavigate={close}
      />
      <NavItem
        href="/admin/caja"
        label="Caja"
        active={pathname.startsWith("/admin/caja")}
        onNavigate={close}
      />
      <NavItem href="/admin/reportes" label="Reportes" active={pathname.startsWith("/admin/reportes")} onNavigate={close} />
      <NavItem href="/admin/importaciones" label="Importaciones" active={pathname.startsWith("/admin/importaciones")} onNavigate={close} />
      <NavItem href="/admin/pin" label="PIN" active={pathname.startsWith("/admin/pin")} onNavigate={close} />
    </>
  );

  return (
    <div className={`${styles.shell} ${styles.shellAdmin}`}>
      <aside className={styles.shellAdminDesktop} aria-label="Navegación administrativa">
        <div className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <div>
              <p className={styles.brand}>Gestión de lavandería</p>
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
          <p className={styles.brand}>Gestión de lavandería</p>
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
  const morePanelId = useId();
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
            <p className={styles.brand}>Gestión de lavandería</p>
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
            <NavItem
              href="/caja"
              label="Caja"
              active={pathname.startsWith("/caja")}
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
          <p className={styles.brand}>Gestión de lavandería</p>
          <p className={styles.userRole}>{profile.full_name}</p>
        </div>
        {isAdmin ? (
          <Link href="/admin" className={styles.mobileAdminLink}>
            Panel
          </Link>
        ) : null}
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
        <div className={styles.secondaryMenu} ref={menuRef}>
          <button
            type="button"
            className={[
              styles.bottomNavLink,
              menuOpen ||
              pathname.startsWith("/clientes") ||
              pathname.startsWith("/caja")
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
            Más
          </button>
          {menuOpen ? (
            <div id={morePanelId} className={styles.secondaryPanel}>
              <Link
                href="/clientes"
                className={styles.secondaryItem}
                onClick={() => setMenuPath(null)}
              >
                Clientes
              </Link>
              <Link
                href="/caja"
                className={styles.secondaryItem}
                onClick={() => setMenuPath(null)}
              >
                Caja del día
              </Link>
              <LogoutButton className={styles.secondaryLogout} />
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
