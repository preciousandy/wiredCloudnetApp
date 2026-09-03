import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BASE = 'flex-row items-center justify-center rounded-lg';

const VARIANTS: Record<Variant, { container: string; pressed: string; label: string }> = {
  primary: {
    container: 'bg-brand-500',
    pressed: 'bg-brand-600',
    label: 'text-white font-bold',
  },
  secondary: {
    container: 'bg-white border border-neutral-200',
    pressed: 'bg-neutral-50',
    label: 'text-neutral-900 font-bold',
  },
  outline: {
    container: 'bg-transparent border border-brand-500',
    pressed: 'bg-brand-50',
    label: 'text-brand-600 font-bold',
  },
  ghost: {
    container: 'bg-transparent',
    pressed: 'bg-neutral-100',
    label: 'text-brand-500 font-bold',
  },
  danger: {
    container: 'bg-danger',
    pressed: 'opacity-90',
    label: 'text-white font-bold',
  },
};

const SIZES: Record<Size, { container: string; text: string }> = {
  sm: { container: 'h-9 px-3', text: 'text-[13px]' },
  md: { container: 'h-12 px-4', text: 'text-[15px]' },
  lg: { container: 'h-14 px-5', text: 'text-[17px]' },
};

export interface ButtonProps extends Omit<PressableProps, 'onPress' | 'children'> {
  label: string;
  onPress?: () => void | Promise<void>;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  className?: string;
  testID?: string;
}

/**
 * The single button primitive.
 *
 * Double-submit protection lives HERE rather than in each screen, because
 * money-spending buttons must never be double-tappable, an unstable mobile
 * connection plus an impatient tap is exactly how a user gets charged twice.
 * Async onPress handlers are awaited and the button is locked for the duration.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leadingIcon,
  className = '',
  testID,
  ...rest
}: ButtonProps) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const isBlocked = disabled || loading || busy;

  const handlePress = useCallback(() => {
    if (inFlight.current || isBlocked || !onPress) return;
    inFlight.current = true;
    setBusy(true);

    void Promise.resolve(onPress()).finally(() => {
      inFlight.current = false;
      setBusy(false);
    });
  }, [onPress, isBlocked]);

  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const showSpinner = loading || busy;

  // active: gives us the pressed state without a function-valued className,
  // which NativeWind does not support.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: showSpinner }}
      disabled={isBlocked}
      onPress={handlePress}
      testID={testID}
      className={`${BASE} ${s.container} ${v.container} ${isBlocked ? 'opacity-50' : ''} ${className}`}
      {...rest}
    >
      {showSpinner ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#F2702D' : '#FFFFFF'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {leadingIcon}
          <Text className={`${v.label} ${s.text}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
