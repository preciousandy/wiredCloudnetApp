import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, MoneyText, Screen, Skeleton, Text } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { creatorService } from '@/api/services';
import { formatCount } from '@/lib/format';

export default function CreatorDashboard() {
  const { data, isPending } = useQuery({
    queryKey: ['creator', 'overview'],
    queryFn: () => creatorService.overview(),
    staleTime: 60_000,
  });

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Dashboard</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-5 overflow-hidden rounded-lg">
          <LinearGradient colors={['#18181B', '#3F3F46']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View className="gap-1 p-5">
              <Text variant="caption" className="font-semibold text-brand-400">
                Creator Wallet
              </Text>

              <Text variant="caption" className="mt-1 text-white/70">
                Available to withdraw
              </Text>

              {isPending || !data ? (
                <Skeleton className="mt-1 h-9 w-40 bg-white/20" />
              ) : (
                <MoneyText
                  value={data.creatorWallet?.userShareAvailable ?? data.stats.available}
                  variant="display"
                  className="text-white"
                />
              )}

              <View className="mt-4">
                <Button label="Withdraw earnings" onPress={() => router.push('/wallet/withdraw')} />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-3">
          <Metric
            icon="eye-outline"
            label="Views"
            value={data ? formatCount(data.stats.views) : '-'}
          />
          <Metric
            icon="time-outline"
            label="Watch hours"
            value={data ? `${data.stats.watchHours}` : '-'}
          />
          <Metric
            icon="cart-outline"
            label="Sales"
            value={data ? formatCount(data.stats.sales) : '-'}
          />
          <Metric
            icon="people-outline"
            label="Followers"
            value={data ? formatCount(data.stats.followers) : '-'}
          />
        </View>

        {/* Live sits above the catalogue numbers on purpose: it is the only
            thing on this screen that is time sensitive. */}
        <Pressable
          onPress={() => router.push('/creator/live')}
          accessibilityRole="button"
          accessibilityLabel="Live events"
          className="mt-6 flex-row items-center gap-3 rounded-lg border border-neutral-200 p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
            <Ionicons name="radio-outline" size={20} color={semantic.danger} />
          </View>
          <View className="flex-1">
            <Text variant="label" className="font-bold">
              Live events
            </Text>
            <Text variant="caption" className="mt-0.5 text-neutral-500">
              Schedule an event, sell tickets, go live from your phone
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={neutral[400]} />
        </Pressable>

        <View className="mt-7 flex-row items-center justify-between">
          <Text variant="heading" className="text-[19px]">
            Top earners
          </Text>
          <Text
            variant="label"
            className="font-bold text-brand-500"
            onPress={() => router.push('/creator/manage')}
          >
            Manage all
          </Text>
        </View>

        {isPending ? (
          <View className="mt-3 gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </View>
        ) : data && data.topTitles.length > 0 ? (
          <View className="mt-2 divide-y divide-neutral-100">
            {data.topTitles.map((title) => (
              <View key={title.id} className="flex-row items-center gap-3 py-3">
                <Image
                  source={{ uri: title.posterUrl }}
                  style={{ width: 40, height: 58, borderRadius: 8 }}
                  contentFit="cover"
                />
                <View className="flex-1">
                  <Text variant="label" numberOfLines={1} className="font-bold">
                    {title.title}
                  </Text>
                  <Text variant="caption">
                    {formatCount(title.views)} views · {formatCount(title.sales)} sales
                  </Text>
                </View>
                <MoneyText value={title.revenue} variant="label" className="font-bold" />
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center gap-2 py-12">
            <Ionicons name="stats-chart-outline" size={28} color={neutral[300]} />
            <Text variant="body" className="text-neutral-400">
              Nothing published yet.
            </Text>
          </View>
        )}

        <View className="mt-6 flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
          <Ionicons name="information-circle-outline" size={15} color={neutral[400]} />
          <Text variant="caption" className="flex-1">
            Earnings are your share after commission. Available is what you have
            earned minus what has already been paid out.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="min-w-[46%] flex-1 gap-1 rounded-lg border border-neutral-200 p-4">
      <Ionicons name={icon} size={17} color={neutral[500]} />
      <Text variant="title" className="text-[22px]">
        {value}
      </Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}
