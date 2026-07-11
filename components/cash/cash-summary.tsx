import styles from "@/components/ui/ui.module.css";
import type { CashSessionSummary } from "@/lib/cash/queries";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";

export function CashSummary({ summary }: { summary: CashSessionSummary }) {
  const { session, totals } = summary;
  return (
    <div className={styles.panelStack}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.cardTitle}>Jornada {formatBusinessDate(session.business_date)}</h2>
          <p className={styles.help}>Responsable: {summary.responsibleName}</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeActive}`}>
          {session.status === "open" ? "Abierta" : "Cerrada"}
        </span>
      </div>

      <dl className={`${styles.formGrid} ${styles.formGridTwo}`}>
        <Amount label="Monto inicial" value={session.opening_cash} />
        <Amount label="Total efectivo" value={totals.cash} />
        <Amount label="Total Yape" value={totals.yape} />
        <Amount label="Total Plin" value={totals.plin} />
        <Amount label="Efectivo esperado" value={session.expected_cash} />
        {session.counted_cash !== null ? (
          <Amount label="Efectivo contado" value={session.counted_cash} />
        ) : null}
        {session.difference !== null ? (
          <Amount label="Diferencia" value={session.difference} />
        ) : null}
      </dl>

      <div>
        <h3 className={styles.cardTitle}>Pagos por operadora</h3>
        {summary.paymentsByOperator.length === 0 ? (
          <p className={styles.help}>Aún no hay pagos registrados.</p>
        ) : (
          <ul className={styles.meta}>
            {summary.paymentsByOperator.map((operator) => (
              <li key={operator.id}>
                {operator.name}: {formatCurrency(operator.amount)} ({operator.count})
              </li>
            ))}
          </ul>
        )}
      </div>

      {session.closed_at ? (
        <p className={styles.help}>Cierre: {formatDateTimeLima(session.closed_at)}</p>
      ) : null}
      {session.closing_notes ? (
        <p className={styles.help}>Notas: {session.closing_notes}</p>
      ) : null}
      {summary.voidedPayments.length > 0 ? (
        <div>
          <h3 className={styles.cardTitle}>Anulaciones</h3>
          <ul className={styles.meta}>
            {summary.voidedPayments.map((payment) => (
              <li key={payment.id}>
                {formatCurrency(payment.amount)} · {summary.voidedPayments.length > 0 ? payment.actorName : ""}
                {payment.void_reason ? ` · ${payment.void_reason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Amount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className={styles.help}>{label}</dt>
      <dd className={styles.cardTitle}>{formatCurrency(value)}</dd>
    </div>
  );
}

function formatBusinessDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

