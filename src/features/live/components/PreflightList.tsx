import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';

export type CheckState = 'pass' | 'warn' | 'fail' | 'pending';

export interface PreflightCheck {
  key: string;
  label: string;
  detail: string;
  state: CheckState;
}

const ICONS: Record<Exclude<CheckState, 'pending'>, {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}> = {
  pass: { name: 'checkmark-circle', color: semantic.success },
  warn: { name: 'alert-circle', color: semantic.warning },
  fail: { name: 'close-circle', color: semantic.danger },
};

/**
 * The pre-flight checklist.
 *
 * A warning is not a blocker. A creator who deliberately mutes their mic for the
 * first two minutes should still be able to start, so warnings are stated
 * plainly and left alone. Only a failed connection actually stops Go live, and
 * that is enforced by the button rather than here.
 */
export function PreflightList({ checks }: { checks: PreflightCheck[] }) {
  return (
    <View className="gap-3">
      {checks.map((check) => {
        const icon = check.state === 'pending' ? null : ICONS[check.state];
        return (
          <View key={check.key} className="flex-row items-start gap-3">
            <View className="mt-0.5 h-5 w-5 items-center justify-center">
              {icon ? (
                <Ionicons name={icon.name} size={18} color={icon.color} />
              ) : (
                <ActivityIndicator size="small" color={neutral[400]} />
              )}
            </View>
            <View className="flex-1">
              <Text variant="label" className="font-bold">
                {check.label}
              </Text>
              <Text variant="caption" className="mt-0.5 leading-5 text-neutral-500">
                {check.detail}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
