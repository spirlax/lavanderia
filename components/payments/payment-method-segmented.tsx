"use client";

import styles from "@/components/ui/ui.module.css";
import type { PaymentMethod } from "@/lib/auth/types";
import { getPaymentMethodOptions } from "@/lib/payments/labels";

type PaymentMethodSegmentedProps = {
  id: string;
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  label?: string;
};

export function PaymentMethodSegmented({
  id,
  value,
  onChange,
  label = "Método de pago",
}: PaymentMethodSegmentedProps) {
  const options = getPaymentMethodOptions();

  return (
    <div className={styles.field}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>
      <div
        className={styles.segmented}
        role="radiogroup"
        aria-labelledby={`${id}-label`}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              id={`${id}-${option.value}`}
              type="button"
              role="radio"
              aria-checked={selected}
              className={[
                styles.segmentedOption,
                selected ? styles.segmentedOptionActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
