import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen, Text } from '@/ui';
import { brand } from '@/ui/theme/colors';

interface Point {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const POINTS: Point[] = [
  {
    icon: 'cloud-upload-outline',
    title: 'Upload once, reach everyone',
    body: 'Films, series and short clips all live in the same place. Portrait or landscape, both play properly.',
  },
  {
    icon: 'cash-outline',
    title: 'You keep 70 percent',
    body: 'Set your own price or give it away free. Viewers pay from their CloudNet wallet and your share lands in yours.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Checked before it goes live',
    body: 'Every upload is reviewed first. It usually takes a few hours, and you can follow the status under My uploads.',
  },
];

/**
 * Shown once, the first time a creator opens CloudIt.
 *
 * Not a tutorial and not a carousel. Three things that change what someone
 * decides on the next screen: what they can upload, what they earn, and why
 * their film will not appear the moment they press the button. That last one
 * prevents most of the support messages a platform gets in its first month.
 */
export function CloudItIntro({
  firstName,
  onContinue,
}: {
  firstName: string;
  onContinue: () => void;
}) {
  return (
    <Screen>
      <View className="flex-1 justify-center gap-8 py-6">
        <View className="gap-2">
          <View className="mb-2 h-14 w-14 items-center justify-center rounded-lg bg-brand-50">
            <Ionicons name="videocam-outline" size={28} color={brand[500]} />
          </View>

          <Text variant="display">Hey {firstName}</Text>
          <Text variant="body" className="leading-6 text-neutral-500">
            This is CloudIt, where your work goes up on CloudNet. Here is what
            you should know before you start.
          </Text>
        </View>

        <View className="gap-5">
          {POINTS.map((point) => (
            <View key={point.title} className="flex-row gap-3.5">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <Ionicons name={point.icon} size={19} color={brand[500]} />
              </View>
              <View className="flex-1 gap-1">
                <Text variant="label" className="font-bold">
                  {point.title}
                </Text>
                <Text variant="caption" className="leading-5 text-neutral-500">
                  {point.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="gap-3 pb-4">
        <Button label="Start uploading" onPress={onContinue} />
        <Text variant="caption" className="text-center text-neutral-400">
          You will only see this once.
        </Text>
      </View>
    </Screen>
  );
}
