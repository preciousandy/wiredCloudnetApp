import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';

const MAX_TAGS = 10;
const MAX_LENGTH = 30;

/** Strips the hash, spaces and punctuation people paste in without thinking. */
function normalise(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, MAX_LENGTH)
    .toLowerCase();
}

export interface HashtagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
}

/**
 * Tags as chips, not as a comma separated string.
 *
 * A plain text field means we find out at submit time that someone typed
 * "action, drama nollywood" and meant three tags. Committing each one as the
 * user goes makes the count visible and the limit obvious before they hit it.
 *
 * Space commits as well as return, because on a phone keyboard the space bar is
 * where the thumb already is.
 */
export function HashtagInput({ value, onChange, error }: HashtagInputProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const full = value.length >= MAX_TAGS;

  const commit = (raw: string) => {
    const tag = normalise(raw);
    setText('');
    if (!tag || full || value.includes(tag)) return;
    onChange([...value, tag]);
  };

  const handleChange = (next: string) => {
    // A space means "that one is finished", so commit rather than store it.
    if (next.endsWith(' ')) commit(next);
    else setText(next.replace(/^#+/, ''));
  };

  const handleKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }) => {
    // Backspace on an empty field takes back the last chip, which is what
    // every tag field people have used before them does.
    if (nativeEvent.key === 'Backspace' && text.length === 0 && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <View className="w-full">
      <View className="mb-1 flex-row items-center justify-between">
        <Text variant="label" className="ml-1">
          Tags
        </Text>
        <Text variant="caption" className={full ? 'text-warning' : 'text-neutral-400'}>
          {value.length} / {MAX_TAGS}
        </Text>
      </View>

      <View
        className={`min-h-12 flex-row flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 ${
          error
            ? 'border-danger bg-danger/5'
            : focused
              ? 'border-brand-500 bg-white'
              : 'border-neutral-200 bg-neutral-50'
        }`}
      >
        {value.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => onChange(value.filter((t) => t !== tag))}
            accessibilityRole="button"
            accessibilityLabel={`Remove tag ${tag}`}
            className="flex-row items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5"
          >
            <Text variant="caption" className="font-bold text-brand-600">
              #{tag}
            </Text>
            <Ionicons name="close" size={12} color={brand[600]} />
          </Pressable>
        ))}

        {!full ? (
          <TextInput
            value={text}
            onChangeText={handleChange}
            onKeyPress={handleKeyPress}
            onSubmitEditing={() => commit(text)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              commit(text);
            }}
            placeholder={value.length === 0 ? 'nollywood, thriller, lagos' : 'Add another'}
            placeholderTextColor={neutral[400]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            blurOnSubmit={false}
            maxLength={MAX_LENGTH}
            style={{
              flexGrow: 1,
              minWidth: 110,
              paddingVertical: 2,
              fontSize: 15,
              // No explicit fontFamily. Nothing in the app loads Inter as a
              // native font, so naming it here would silently fall back to a
              // different face than every other input on the screen.
              color: neutral[900],
            }}
          />
        ) : null}
      </View>

      <Text variant="caption" className={`mt-1 ml-1 ${error ? 'text-danger' : 'text-neutral-400'}`}>
        {error ?? 'Space or return finishes a tag. Tap one to remove it.'}
      </Text>
    </View>
  );
}
