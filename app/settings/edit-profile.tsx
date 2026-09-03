import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, BackButton, Banner, Button, Input, Screen, Text, toast } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { profileService } from '@/api/services';
import { toApiError, type ApiError } from '@/api/errors';
import { useProfile } from '@/features/profile/hooks/useProfile';

const BIO_MAX = 300;

export default function EditProfile() {
  const { data } = useProfile();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Seed once the profile lands, without clobbering edits already in progress.
  useEffect(() => {
    if (!data) return;
    setDisplayName((current) => (current === '' ? data.user.displayName : current));
    setBio((current) => (current === '' ? (data.user.bio ?? '') : current));
    setAvatarUri((current) => (current === null ? (data.user.avatarUrl ?? null) : current));
  }, [data]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Permission needed to choose a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    const asset = result.assets?.[0];
    if (asset?.uri) {
      setAvatarUri(asset.uri);
      toast.success('Photo selected');
    }
  };

  const nameError =
    displayName.trim().length > 0 && displayName.trim().length < 2
      ? 'Use at least 2 characters.'
      : undefined;

  const canSave = displayName.trim().length >= 2 && !saving;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await profileService.updateProfile(displayName, bio, avatarUri);
      await queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
      router.back();
    } catch (cause) {
      setError(toApiError(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Edit profile</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="mt-6 items-center gap-2">
            <Pressable
              onPress={() => void pickAvatar()}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              className="relative active:opacity-80"
            >
              <Avatar name={displayName || 'C'} uri={avatarUri} size={88} />
              <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-500 shadow-sm">
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </Pressable>

            <Pressable onPress={() => void pickAvatar()} className="mt-1 flex-row items-center gap-1.5 active:opacity-70">
              <Ionicons name="camera-outline" size={16} color={brand[500]} />
              <Text variant="label" className="font-bold text-brand-500">
                Change photo
              </Text>
            </Pressable>

            <Text variant="caption" className="text-neutral-400">
              Tap the camera to choose from your gallery
            </Text>
          </View>

          {error ? (
            <View className="mt-5">
              <Banner tone="error" message={error.message} />
            </View>
          ) : null}

          <View className="mt-7 gap-4">
            <Input
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
              error={nameError}
            />

            <Input
              label="Username"
              value={data?.user.username ?? ''}
              editable={false}
              hint="Usernames cannot be changed for now"
            />

            <View>
              <Input
                label="Bio"
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={BIO_MAX}
                placeholder="Tell people what you are into"
                style={{ height: 96, textAlignVertical: 'top', paddingTop: 10 }}
              />
              <Text variant="caption" className="mt-1 self-end">
                {bio.length} / {BIO_MAX}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="pb-4 pt-3">
          <Button label="Save changes" loading={saving} disabled={!canSave} onPress={() => void save()} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
