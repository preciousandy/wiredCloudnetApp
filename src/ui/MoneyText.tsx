import { formatMoney, type Money } from '@/lib/money';
import { Text, type TextProps } from './Text';

export interface MoneyTextProps extends Omit<TextProps, 'children'> {
  value: Money;
  /** Renders +/- and credit/debit colour. Use in the transaction ledger. */
  signed?: 'credit' | 'debit';
}

/**
 * The ONLY approved way to render a monetary value.
 * Never interpolate a raw number into a string, formatting is centralised
 * so currency symbols and minor-unit conversion can never drift per screen.
 */
export function MoneyText({ value, signed, className = '', ...rest }: MoneyTextProps) {
  const formatted = formatMoney(value);

  if (!signed) {
    return (
      <Text className={className} {...rest}>
        {formatted}
      </Text>
    );
  }

  const prefix = signed === 'credit' ? '+' : '−';
  const colour = signed === 'credit' ? 'text-credit' : 'text-debit';

  return (
    <Text className={`${colour} ${className}`} {...rest}>
      {prefix}
      {formatted}
    </Text>
  );
}
