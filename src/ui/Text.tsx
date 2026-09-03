import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

const VARIANTS: Record<Variant, string> = {
  display: 'font-bold text-[36px] leading-[44px] text-neutral-900',
  title: 'font-bold text-[24px] leading-[32px] text-neutral-900',
  heading: 'font-semibold text-[17px] leading-[24px] text-neutral-900',
  body: 'text-[15px] leading-[22px] text-neutral-900',
  label: 'font-medium text-[13px] leading-[18px] text-neutral-700',
  caption: 'text-[11px] leading-[16px] text-neutral-500',
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = 'body', className = '', ...rest }: TextProps) {
  return <RNText className={`${VARIANTS[variant]} ${className}`} {...rest} />;
}
