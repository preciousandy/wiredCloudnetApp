import { View, useWindowDimensions } from 'react-native';
import { Skeleton } from '@/ui';

/**
 * Mirrors the real layout rather than showing a spinner, so the page does not
 * visibly jump when content arrives.
 */
export function HomeSkeleton() {
  const { width } = useWindowDimensions();
  const cardWidth = width * 0.33;

  return (
    <View>
      <Skeleton className="h-[380px] w-full rounded-none" />

      <View className="mt-6 flex-row gap-2 px-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-20" />
        ))}
      </View>

      {[0, 1].map((row) => (
        <View key={row} className="mt-7">
          <Skeleton className="ml-4 h-5 w-40" />
          <View className="mt-3 flex-row gap-3 px-4">
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ width: cardWidth }}>
                <Skeleton className="w-full" />
                <View style={{ height: cardWidth * 1.45 }} className="w-full overflow-hidden">
                  <Skeleton className="h-full w-full" />
                </View>
                <Skeleton className="mt-2 h-3 w-4/5" />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
