import { View } from 'react-native';

export interface PagerDotsProps {
  count: number;
  index: number;
}

/** The active dot widens rather than just changing colour, which reads more clearly at a glance. */
export function PagerDots({ count, index }: PagerDotsProps) {
  return (
    <View className="flex-row items-center justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${i === index ? 'w-5 bg-brand-500' : 'w-1.5 bg-neutral-300'}`}
        />
      ))}
    </View>
  );
}
