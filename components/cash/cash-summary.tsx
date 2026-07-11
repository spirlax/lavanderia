import styles from "@/components/ui/ui.module.css";
import type { CashSessionSummary } from "@/lib/cash/queries";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";

export function CashSummary({
  summary,
  compact = false,
}: {
  summary: CashSessionSummary;
  compact?: boolean;
}) {
  const { session, totals } = summary;
  const isOpen = session.status === "open";
  const collected =
    Number(totals.cash) + Number(totals.yape) + Number(totals.plin);
  const difference =
    session.difference !== null ? Number(session.difference) : null;

  return (
    <div className={styles.panelStack}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.sectionTitle}>
            Jornada {formatBusinessDate(session.business_date)}
          </h2>
          <p className={styles.help}>
            Responsable: {summary.responsibleName}
          </p>
        </div>
        <span
          className={`${styles.badge} ${
            isOpen ? styles.badgeActive : styles.badgeInactive
          }`}
        >
          {isOpen ? "Abierta" : "Cerrada"}
        </span>
      </div>

      <div className={styles.metricGrid}>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Monto inicial</p>
          <p className={styles.metricValue}>
            {formatCurrency(Number(session.opening_cash))}
          </p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Cobrado hoy</p>
          <p className={styles.metricValue}>{formatCurrency(collected)}</p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Efectivo esperado</p>
          <p className={styles.metricValue}>
            {formatCurrency(Number(session.expected_cash))}
          </p>
        </div>
        {session.counted_cash !== null ? (
          <div className={styles.metric}>
            <p className={styles.metricLabel}>Efectivo contado</p>
            <p className={styles.metricValue}>
              {formatCurrency(Number(session.counted_cash))}
            </p>
          </div>
        ) : null}
      </div>

      {difference !== null ? (
        <div
          className={[
            styles.differenceBanner,
            difference === 0
              ? styles.differenceBannerOk
              : styles.differenceBannerWarn,
          ].join(" ")}
          role="status"
        >
          <div>
            <p className={styles.detailKpiLabel}>Diferencia de cierre</p>
            <p className={styles.detailKpiValue}>
              {formatCurrency(difference)}
            </p>
          </div>
          <p className={styles.help}>
            {difference === 0
              ? "Cuadra con el efectivo esperado."
              : difference > 0
                ? "Sobra respecto al esperado."
                : "Falta respecto al esperado."}
          </p>
        </div>
      ) : null}

      {!compact ? (
        <>
          <section className={styles.panelStack}>
            <h3 className={styles.cardTitle}>Por método</h3>
            <ul className={styles.amountList}>
              <li className={styles.amountRow}>
                <span>Efectivo</span>
                <span className={styles.amountValue}>
                  {formatCurrency(Number(totals.cash))}
                </span>
              </li>
              <li className={styles.amountRow}>
                <span>Yape</span>
                <span className={styles.amountValue}>
                  {formatCurrency(Number(totals.yape))}
                </span>
              </li>
              <li className={styles.amountRow}>
                <span>Plin</span>
                <span className={styles.amountValue}>
                  {formatCurrency(Number(totals.plin))}
                </span>
              </li>
            </ul>
          </section>

          <section className={styles.panelStack}>
            <h3 className={styles.cardTitle}>Pagos por operadora</h3>
            {summary.paymentsByOperator.length === 0 ? (
              <p className={styles.help}>Aún no hay pagos registrados.</p>
            ) : (
              <ul className={styles.amountList}>
                {summary.paymentsByOperator.map((operator) => (
                  <li className={styles.amountRow} key={operator.id}>
                    <span>
                      {operator.name} · {operator.count} pago
                      {operator.count === 1 ? "" : "s"}
                    </span>
                    <span className={styles.amountValue}>
                      {formatCurrency(operator.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {session.closed_at ? (
            <p className={styles.help}>
              Cierre: {formatDateTimeLima(session.closed_at)}
            </p>
          ) : null}
          {session.closing_notes ? (
            <p className={styles.help}>Notas: {session.closing_notes}</p>
          ) : null}

          {summary.voidedPayments.length > 0 ? (
            <section className={styles.panelStack}>
              <h3 className={styles.cardTitle}>Anulaciones</h3>
              <ul className={styles.amountList}>
                {summary.voidedPayments.map((payment) => (
                  <li className={styles.amountRow} key={payment.id}>
                    <span>
                      {payment.actorName}
                      {payment.void_reason ? ` · ${payment.void_reason}` : ""}
                    </span>
                    <span className={styles.amountValue}>
                      {formatCurrency(Number(payment.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function formatBusinessDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
