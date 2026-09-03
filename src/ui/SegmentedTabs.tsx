import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { brand, neutral } from './theme/colors';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface SegmentedTabsProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Segmented control. Two or three mutually exclusive choices, always visible.
 *
 * Preferred over a dropdown here because the options are few and the choice
 * changes what the form below looks like, the user should see both routes
 * before committing to one.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: SegmentedTabsProps<T>) {
  return (
    <View
      className="w-full flex-row rounded-lg bg-neutral-100 p-1"
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5 ${
              selected ? 'bg-white' : ''
            }`}
            style={
              selected
                ? {
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }
                : undefined
            }
          >
            <Ionicons
              name={option.icon}
              size={17}
              color={selected ? brand[500] : neutral[500]}
            />
            <Text
              variant="label"
              className={selected ? 'font-bold text-neutral-900' : 'text-neutral-500'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
