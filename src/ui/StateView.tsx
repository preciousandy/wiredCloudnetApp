import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { Text } from './Text';

/**
 * Enforces the "four states" rule from the architecture spec:
 * every screen must handle loading, empty, error and content.
 * Wrap data-driven screens in this so no state can be forgotten.
 */
export interface StateViewProps<T> {
  loading: boolean;
  error: { message: string } | null;
  data: T | null | undefined;
  isEmpty?: (data: T) => boolean;
  onRetry?: () => void;
  loadingView?: ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  children: (data: T) => ReactNode;
}

export function StateView<T>({
  loading,
  error,
  data,
  isEmpty,
  onRetry,
  loadingView,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'When there is something to show, it will appear here.',
  emptyAction,
  children,
}: StateViewProps<T>) {
  if (loading) {
    return <>{loadingView ?? <CenteredMessage title="Loading…" />}</>;
  }

  if (error) {
    return (
      <CenteredMessage title="Something went wrong" message={error.message}>
        {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
      </CenteredMessage>
    );
  }

  if (data === null || data === undefined || (isEmpty?.(data) ?? false)) {
    return (
      <CenteredMessage title={emptyTitle} message={emptyMessage}>
        {emptyAction}
      </CenteredMessage>
    );
  }

  return <>{children(data)}</>;
}

function CenteredMessage({
  title,
  message,
  children,
}: {
  title: string;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" className="text-center text-neutral-500">
          {message}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
