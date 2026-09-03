import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import {
  STEP_SUBTITLES,
  STEP_TITLES,
  UPLOAD_STEPS,
  canReachStep,
  isStepComplete,
  type UploadDraft,
  type UploadStep,
} from '../lib/steps';

/**
 * Progress plus navigation in one strip.
 *
 * Completed steps are tappable so a creator can go back and fix something
 * without losing the rest; steps ahead are not, because skipping forward past a
 * missing video only produces an error later.
 */
export function StepHeader({
  step,
  draft,
  onStepPress,
}: {
  step: UploadStep;
  draft: UploadDraft;
  onStepPress: (step: UploadStep) => void;
}) {
  const index = UPLOAD_STEPS.indexOf(step);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-1.5">
        {UPLOAD_STEPS.map((candidate, i) => {
          const done = isStepComplete(candidate, draft) && i < index;
          const active = candidate === step;
          const reachable = canReachStep(candidate, draft);

          return (
            <Pressable
              key={candidate}
              disabled={!reachable || active}
              onPress={() => onStepPress(candidate)}
              accessibilityRole="button"
              accessibilityLabel={`Step ${i + 1}, ${STEP_TITLES[candidate]}`}
              accessibilityState={{ selected: active, disabled: !reachable }}
              className="flex-1 gap-1.5"
            >
              <View
                className={`h-1 rounded-full ${
                  active ? 'bg-brand-500' : done ? 'bg-brand-300' : 'bg-neutral-200'
                }`}
              />
              <View className="flex-row items-center gap-1">
                {done ? (
                  <Ionicons name="checkmark-circle" size={11} color={brand[500]} />
                ) : null}
                <Text
                  variant="caption"
                  numberOfLines={1}
                  className={active ? 'font-bold text-neutral-900' : 'text-neutral-400'}
                >
                  {STEP_TITLES[candidate]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-2">
        <Text variant="title">{STEP_TITLES[step]}</Text>
        <Text variant="body" className="mt-1 text-neutral-500">
          {STEP_SUBTITLES[step]}
        </Text>
      </View>
    </View>
  );
}
