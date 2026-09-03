import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import {
  BackButton,
  Banner,
  Button,
  Checkbox,
  Input,
  MoneyText,
  Screen,
  SegmentedTabs,
  Select,
  Skeleton,
  Text,
  toast,
  type SegmentOption,
} from '@/ui';
import { brand, neutral, semantic } from '@/ui/theme/colors';
import { parseMoneyInput } from '@/lib/money';
import { catalogService, creatorService, uploadService } from '@/api/services';
import { toApiError, type ApiError } from '@/api/errors';
import { useMediaUpload } from '@/features/cloudit/hooks/useMediaUpload';
import { MediaPicker } from '@/features/cloudit/components/MediaPicker';

type Access = 'free' | 'premium';

const ACCESS: readonly SegmentOption<Access>[] = [
  { value: 'free', label: 'Free', icon: 'globe-outline' },
  { value: 'premium', label: 'Premium', icon: 'diamond-outline' },
];

const MAX_CAPTION = 300;
const MAX_HASHTAGS = 10;

/**
 * Posting a vertical.
 *
 * One screen, not four. A film upload is a considered act with a lot to decide;
 * posting a clip is something people do in under a minute, and a wizard would
 * make it feel like paperwork.
 */
export default function NewVertical() {
  const video = useMediaUpload('video');

  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [access, setAccess] = useState<Access>('free');
  const [price, setPrice] = useState('');
  const [linkedTitleId, setLinkedTitleId] = useState<string | null>(null);
  const [allowComments, setAllowComments] = useState(true);
  const [rights, setRights] = useState(false);

  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState(false);

  /** Only titles this creator owns can be attached to a clip, sorted newest first. */
  const { data: creatorTitlesData } = useQuery({
    queryKey: ['creator', 'titles'],
    queryFn: () => creatorService.titles(),
  });

  const sortedTitles = useMemo(() => {
    const items = creatorTitlesData?.items ?? [];
    return [...items].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [creatorTitlesData]);

  const parsedPrice = useMemo(() => parseMoneyInput(price, 'CP'), [price]);

  const errors = {
    video: !video.assetId
      ? 'Choose a clip to post.'
      : !video.isReady
        ? 'Wait for the upload to finish.'
        : undefined,
    caption: caption.trim().length === 0 ? 'Write a caption.' : undefined,
    price:
      access === 'premium' && (!parsedPrice || parsedPrice.minor < 20)
        ? 'Minimum price is 20 CP ($0.10).'
        : undefined,
    rights: !rights ? 'Confirm you have the rights.' : undefined,
  };

  const canPost = Object.values(errors).every((e) => e === undefined);

  const addHashtag = () => {
    const cleaned = hashtagInput.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (cleaned.length === 0 || hashtags.length >= MAX_HASHTAGS) return;
    if (hashtags.includes(cleaned)) {
      setHashtagInput('');
      return;
    }
    setHashtags((current) => [...current, cleaned]);
    setHashtagInput('');
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('CloudNet needs access to your library to post');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      videoMaxDuration: 180,
    });
    const asset = result.assets?.[0];
    if (!asset) return;

    setPreview(asset.uri);
    await video.start({
      uri: asset.uri,
      name: asset.fileName ?? 'vertical.mp4',
      sizeBytes: asset.fileSize ?? 20 * 1024 * 1024,
      contentType: asset.mimeType ?? 'video/mp4',
    });
  };

  const post = async () => {
    setTouched(true);
    if (!canPost || !video.assetId) return;

    setSubmitting(true);
    setError(null);
    try {
      await uploadService.createVertical({
        assetId: video.assetId,
        caption: caption.trim(),
        hashtags,
        // Cover picking from a frame lands with the trimmer; first frame for now.
        coverAtSeconds: 0,
        price: access === 'premium' ? parsedPrice : null,
        linkedTitleId,
        allowComments,
        rightsConfirmed: true,
      });
      setDone(true);
      toast.success('Posted for review');
    } catch (cause) {
      setError(toApiError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Ionicons name="checkmark-circle" size={36} color={semantic.success} />
          </View>
          <Text variant="title" className="text-center">
            Sent for review
          </Text>
          <Text variant="body" className="text-center text-neutral-500">
            Your clip goes live once it clears review, usually within a few hours.
            You can track it under My uploads.
          </Text>
          <View className="mt-4 w-full gap-3">
            <Button label="Back to Verticals" onPress={() => router.back()} />
            <Button
              label="Post another"
              variant="secondary"
              onPress={() => {
                setDone(false);
                setCaption('');
                setHashtags([]);
                setPrice('');
                setAccess('free');
                setRights(false);
                setTouched(false);
                setPreview(null);
                void video.cancel();
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">New vertical</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 16 }}
        >
          {error ? (
            <View className="mb-5">
              <Banner tone="error" message={error.message} />
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <View style={{ width: 108 }}>
              <MediaPicker
                title="Clip"
                hint="9:16, up to 3 min"
                icon="videocam-outline"
                aspect="video"
                previewUri={preview}
                upload={video.upload}
                error={touched ? errors.video : undefined}
                onPick={() => void pickVideo()}
                onClear={() => {
                  setPreview(null);
                  void video.cancel();
                }}
              />
            </View>

            <View className="flex-1">
              <Input
                placeholder="Say something about this clip"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={MAX_CAPTION}
                error={touched ? errors.caption : undefined}
                style={{ height: 132, textAlignVertical: 'top', paddingTop: 10 }}
              />
              <Text variant="caption" className="mt-1 self-end">
                {caption.length} / {MAX_CAPTION}
              </Text>
            </View>
          </View>

          <View className="mt-6">
            <Text variant="label" className="mb-2 ml-1">
              Hashtags
            </Text>

            {hashtags.length > 0 ? (
              <View className="mb-2 flex-row flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => setHashtags((current) => current.filter((t) => t !== tag))}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove hashtag ${tag}`}
                    className="h-8 flex-row items-center gap-1.5 rounded-lg bg-brand-50 px-2.5"
                  >
                    <Text variant="caption" className="font-bold text-brand-700">
                      #{tag}
                    </Text>
                    <Ionicons name="close" size={12} color={brand[600]} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Input
              placeholder="Add a tag and press return"
              value={hashtagInput}
              onChangeText={setHashtagInput}
              onSubmitEditing={addHashtag}
              autoCapitalize="none"
              returnKeyType="done"
              hint={`${hashtags.length} of ${MAX_HASHTAGS}`}
              leftSlot={
                <Text variant="body" className="text-neutral-400">
                  #
                </Text>
              }
            />
          </View>

          <View className="mt-7">
            <Text variant="label" className="mb-2 ml-1">
              Access
            </Text>
            <SegmentedTabs options={ACCESS} value={access} onChange={setAccess} />

            {access === 'premium' ? (
              <View className="mt-3 gap-3">
                <Input
                  label="Price (in CloudPoints)"
                  placeholder="100"
                  value={price}
                  onChangeText={(v) => setPrice(v.replace(/[^\d.]/g, ''))}
                  keyboardType="numeric"
                  error={touched ? errors.price : undefined}
                  leftSlot={
                    <Text variant="caption" className="font-bold text-brand-600">
                      CP
                    </Text>
                  }
                  rightSlot={
                    parsedPrice ? (
                      <Text variant="caption" className="font-medium text-neutral-500">
                        ≈ ${(parsedPrice.minor / 200).toFixed(2)} USD
                      </Text>
                    ) : undefined
                  }
                  hint="Rate: 1 USD = 200 CP (1 CP = $0.005)"
                />
              </View>
            ) : null}
          </View>

          {/* The commercial hook: a clip that promotes a film you already sell. */}
          <View className="mt-7">
            <Select
              label="Promote one of your titles, optional"
              placeholder="Not linked to anything"
              value={linkedTitleId}
              options={[
                { value: '', label: 'Not linked to anything' },
                ...sortedTitles.map((title) => ({
                  value: title.id,
                  label: title.title,
                })),
              ]}
              onChange={(value) => setLinkedTitleId(value === '' ? null : value)}
              hint="Viewers get a Watch the full film button on your clip"
            />
          </View>

          <View className="mt-7 gap-4">
            <Checkbox
              checked={allowComments}
              onChange={setAllowComments}
              label="Allow comments on this clip"
            />

            <Checkbox
              checked={rights}
              onChange={setRights}
              error={touched ? errors.rights : undefined}
              label={
                <Text variant="label">
                  I own or have permission to post this, including any music in it.
                </Text>
              }
            />
          </View>

          <View className="mt-3 flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
            <Ionicons name="musical-notes-outline" size={15} color={neutral[400]} />
            <Text variant="caption" className="flex-1">
              Licensed music is the most common reason a clip is rejected. If you
              did not make the track, do not post it.
            </Text>
          </View>
        </ScrollView>

        <View className="pb-4 pt-3">
          <Button label="Post" loading={submitting} onPress={() => void post()} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="caption" className="text-neutral-500">
        {label}
      </Text>
      {value}
    </View>
  );
}
