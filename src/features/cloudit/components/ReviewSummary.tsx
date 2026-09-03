import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { formatMoney, parseMoneyInput } from '@/lib/money';
import type { UploadDraft } from '../lib/steps';

/**
 * Last look before it goes for review.
 *
 * Repeats the numbers rather than assuming the creator remembers what they set
 * three steps ago. Getting a price wrong is the kind of mistake that is cheap to
 * catch here and awkward to fix once something is published.
 */
export function ReviewSummary({
  draft,
  thumbnailUri,
}: {
  draft: UploadDraft;
  thumbnailUri: string | null;
}) {
  const price = draft.pricingMode === 'premium' ? parseMoneyInput(draft.price, 'CP') : null;

  return (
    <View className="gap-4">
      <View className="flex-row gap-3 rounded-lg border border-neutral-200 p-3">
        <View className="overflow-hidden rounded-lg bg-neutral-100" style={{ width: 108, height: 61 }}>
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="image-outline" size={18} color={neutral[300]} />
            </View>
          )}
        </View>

        <View className="flex-1">
          <Text variant="label" numberOfLines={2} className="font-bold">
            {draft.title.trim() || 'Untitled'}
          </Text>
          <Text variant="caption" numberOfLines={2} className="mt-0.5">
            {draft.description.trim() || 'No description'}
          </Text>
        </View>
      </View>

      <View className="gap-2 rounded-lg bg-neutral-50 p-4">
        <Row label="Category" value={draft.category ?? 'Not set'} />
        <Row label="Visibility" value={capitalise(draft.visibility ?? 'public')} />
        <Row label="Rating" value={draft.rating.toUpperCase()} />
        <Row label="Poster" value={draft.posterAssetId ? 'Added' : 'Missing'} />
        <Row
          label="Trailer"
          value={draft.trailerAssetId ? 'Added' : 'None (poster shown)'}
        />
        <Row
          label="Wide image"
          value={draft.backdropAssetId ? 'Added' : 'From a video frame'}
        />
        <Row
          label="Tags"
          value={draft.hashtags.length > 0 ? draft.hashtags.map((t) => `#${t}`).join(' ') : 'None'}
        />
      </View>

      <View className="gap-2 rounded-lg bg-neutral-50 p-4">
        {price ? (
          <Row
            label="Pricing"
            value={`${formatMoney(price, { compactWhole: true })} (≈ $${(price.minor / 200).toFixed(2)} USD)`}
            bold
          />
        ) : (
          <Row label="Pricing" value="Free to watch" bold />
        )}
      </View>
    </View>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="caption" className={bold ? 'font-bold text-neutral-900' : ''}>
        {label}
      </Text>
      <Text variant="label" className={bold ? 'font-bold' : 'text-neutral-600'}>
        {value}
      </Text>
    </View>
  );
}
