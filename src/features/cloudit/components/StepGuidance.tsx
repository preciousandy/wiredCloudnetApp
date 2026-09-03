import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { brand } from '@/ui/theme/colors';
import { STEP_GUIDANCE, type UploadStep } from '../lib/steps';

/**
 * What this step needs, said before the creator starts filling it in.
 *
 * Sits above the progress indicator on every step rather than below it, because
 * the reading order should be "here is what I am about to do", then "here is how
 * far along I am". Reversing those two makes the guidance feel like a footnote.
 *
 * Collapsible, and it stays collapsed once closed for the rest of the session.
 * Someone uploading their fortieth film should not have to read the same three
 * lines every time, but someone uploading their first should not have to hunt
 * for them either.
 */
export function StepGuidance({ step }: { step: UploadStep }) {
  const [open, setOpen] = useState(true);
  const guidance = STEP_GUIDANCE[step];

  return (
    <View className="overflow-hidden rounded-lg border border-brand-100 bg-brand-50">
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${guidance.heading}. ${open ? 'Collapse' : 'Expand'}`}
        className="flex-row items-center gap-2 px-3.5 py-3"
      >
        <Ionicons name="bulb-outline" size={16} color={brand[500]} />
        <Text variant="label" className="flex-1 font-bold text-brand-600">
          {guidance.heading}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={15}
          color={brand[500]}
        />
      </Pressable>

      {open ? (
        <View className="gap-2 px-3.5 pb-3.5">
          {guidance.points.map((point) => (
            <View key={point} className="flex-row gap-2">
              <View className="mt-[7px] h-1.5 w-1.5 rounded-full bg-brand-500" />
              <Text variant="caption" className="flex-1 leading-5 text-neutral-700">
                {point}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
