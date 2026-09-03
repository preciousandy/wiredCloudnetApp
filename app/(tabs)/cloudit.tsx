import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Banner,
  Button,
  Checkbox,
  Input,
  Screen,
  SegmentedTabs,
  Select,
  Text,
  toast,
  type SegmentOption,
} from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { parseMoneyInput } from '@/lib/money';
import { uploadService } from '@/api/services';
import { toApiError, type ApiError } from '@/api/errors';
import { useSession } from '@/store/session';
import { usePreferences } from '@/store/preferences';
import { useMediaUpload } from '@/features/cloudit/hooks/useMediaUpload';
import { CloudItIntro } from '@/features/cloudit/components/CloudItIntro';
import { HashtagInput } from '@/features/cloudit/components/HashtagInput';
import { MediaPicker } from '@/features/cloudit/components/MediaPicker';
import { PricingSection, type PricingMode } from '@/features/cloudit/components/PricingSection';
import { StepGuidance } from '@/features/cloudit/components/StepGuidance';
import { StepHeader } from '@/features/cloudit/components/StepHeader';
import { ReviewSummary } from '@/features/cloudit/components/ReviewSummary';
import {
  nextStep,
  previousStep,
  validateStep,
  type UploadDraft,
  type UploadStep,
} from '@/features/cloudit/lib/steps';
import type { ContentRating } from '@/api/schemas/catalog';

const CATEGORIES = [
  'Action', 'Drama', 'Comedy', 'Documentary', 'Music', 'Series', 'Thriller', 'Romance',
].map((value) => ({ value, label: value }));

/**
 * Visibility is the one choice here people regularly get wrong, so each option
 * says what actually happens rather than restating its own name.
 */
const VISIBILITY = [
  {
    value: 'public',
    label: 'Public',
    icon: 'globe-outline' as const,
    description:
      'Appears in search, in category rows and on your profile. Anyone on CloudNet can find and buy it. Choose this unless you have a reason not to.',
  },
  {
    value: 'unlisted',
    label: 'Unlisted',
    icon: 'link-outline' as const,
    description:
      'Hidden from search and from every row, but anyone holding the link can open it. Useful for a private screening, a client review or an early look for your followers.',
  },
  {
    value: 'private',
    label: 'Private',
    icon: 'lock-closed-outline' as const,
    description:
      'Only you can see it. It still goes through review, so you can switch it to public later without waiting again.',
  },
];

const RATINGS: readonly SegmentOption<ContentRating>[] = [
  { value: 'all', label: 'All', icon: 'people-outline' },
  { value: '13+', label: '13+', icon: 'school-outline' },
  { value: '18+', label: '18+', icon: 'warning-outline' },
];

export default function CloudIt() {
  const video = useMediaUpload('video');
  const trailer = useMediaUpload('video');
  const poster = useMediaUpload('thumbnail');
  const backdrop = useMediaUpload('thumbnail');

  const user = useSession((s) => s.user);
  const introSeen = usePreferences((s) => s.clouditIntroSeen);
  const setPreference = usePreferences((s) => s.set);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<UploadStep>('media');
  const [showErrors, setShowErrors] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [trailerPreview, setTrailerPreview] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<string | null>('public');
  const [rating, setRating] = useState<ContentRating>('all');
  const [pricingMode, setPricingMode] = useState<PricingMode>('free');
  const [price, setPrice] = useState('');
  const [rights, setRights] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const draft: UploadDraft = useMemo(
    () => ({
      videoAssetId: video.assetId,
      videoReady: video.isReady,
      trailerAssetId: trailer.assetId,
      trailerReady: trailer.isReady,
      posterAssetId: poster.assetId,
      posterReady: poster.isReady,
      backdropAssetId: backdrop.assetId,
      title,
      description,
      category,
      hashtags,
      visibility,
      rating,
      pricingMode,
      price,
      rightsConfirmed: rights,
    }),
    [
      video.assetId, video.isReady, trailer.assetId, trailer.isReady,
      poster.assetId, poster.isReady, backdrop.assetId,
      title, description, category, hashtags, visibility, rating, pricingMode, price, rights,
    ],
  );

  const errors = validateStep(step, draft);
  const canContinue = Object.keys(errors).length === 0;

  const pick = async (kind: 'video' | 'trailer' | 'poster' | 'backdrop') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('CloudNet needs access to your library to upload');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'video' || kind === 'trailer' ? ['videos'] : ['images'],
      quality: kind === 'video' || kind === 'trailer' ? 1 : 0.9,
      allowsEditing: kind !== 'video' && kind !== 'trailer',
      aspect: kind === 'poster' ? [2, 3] : kind === 'backdrop' ? [16, 9] : undefined,
    });
    const asset = result.assets?.[0];
    if (!asset) return;

    if (kind === 'video') {
      setVideoPreview(asset.uri);
      await video.start({
        uri: asset.uri,
        name: asset.fileName ?? 'video.mp4',
        sizeBytes: asset.fileSize ?? 40 * 1024 * 1024,
        contentType: asset.mimeType ?? 'video/mp4',
      });
      return;
    }

    if (kind === 'trailer') {
      setTrailerPreview(asset.uri);
      await trailer.start({
        uri: asset.uri,
        name: asset.fileName ?? 'trailer.mp4',
        sizeBytes: asset.fileSize ?? 20 * 1024 * 1024,
        contentType: asset.mimeType ?? 'video/mp4',
      });
      return;
    }

    const target = kind === 'poster' ? poster : backdrop;
    const setPreview = kind === 'poster' ? setPosterPreview : setBackdropPreview;
    setPreview(asset.uri);
    await target.start({
      uri: asset.uri,
      name: asset.fileName ?? `${kind}.jpg`,
      sizeBytes: asset.fileSize ?? 2 * 1024 * 1024,
      contentType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const goNext = () => {
    setShowErrors(true);
    if (!canContinue) return;
    const next = nextStep(step);
    if (next) {
      setStep(next);
      setShowErrors(false);
    }
  };

  const goBack = () => {
    const previous = previousStep(step);
    if (previous) {
      setStep(previous);
      setShowErrors(false);
    }
  };

  const submit = async () => {
    setShowErrors(true);
    if (!canContinue || !video.assetId || !poster.assetId) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await uploadService.createTitle({
        assetId: video.assetId,
        trailerAssetId: trailer.assetId,
        posterAssetId: poster.assetId,
        backdropAssetId: backdrop.assetId,
        title: title.trim(),
        description: description.trim(),
        category: category!,
        hashtags,
        kind: 'movie',
        visibility: visibility as 'public' | 'unlisted' | 'private',
        rating,
        price: pricingMode === 'premium' ? parseMoneyInput(price, 'CP') : null,
        rightsConfirmed: true,
      });
      setSubmitted(created.title);
      toast.success('Sent for review');
      void queryClient.invalidateQueries({ queryKey: ['titles'] });
      void queryClient.invalidateQueries({ queryKey: ['home'] });
      void queryClient.invalidateQueries({ queryKey: ['creator'] });
    } catch (cause) {
      setSubmitError(toApiError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSubmitted(null);
    setStep('media');
    setShowErrors(false);
    setTitle('');
    setDescription('');
    setCategory(null);
    setHashtags([]);
    setPrice('');
    setPricingMode('free');
    setRights(false);
    setVideoPreview(null);
    setTrailerPreview(null);
    setPosterPreview(null);
    setBackdropPreview(null);
    void video.cancel();
    void trailer.cancel();
    void poster.cancel();
    void backdrop.cancel();
  };

  // Shown once. After that CloudIt opens straight onto the form.
  if (!introSeen) {
    return (
      <CloudItIntro
        firstName={(user?.displayName ?? 'there').split(' ')[0] || 'there'}
        onContinue={() => setPreference('clouditIntroSeen', true)}
      />
    );
  }

  if (submitted) {
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
            {submitted} is uploaded. We check new content before it goes live,
            usually within a few hours.
          </Text>
          <View className="mt-4 w-full gap-3">
            <Button label="See my uploads" onPress={() => router.push('/creator/manage')} />
            <Button label="Upload another" variant="secondary" onPress={reset} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Guidance first, progress second. What am I doing, then how far along. */}
        <View className="gap-3 pb-2 pt-4">
          <StepGuidance step={step} />
          <StepHeader step={step} draft={draft} onStepPress={setStep} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 12 }}
        >
          {submitError ? (
            <View className="mb-5">
              <Banner tone="error" message={submitError.message} />
            </View>
          ) : null}

          {step === 'media' ? (
            <View className="gap-6">
              <View>
                <Text variant="label" className="mb-2 ml-1">
                  Your film
                </Text>
                <MediaPicker
                  title="Choose a video"
                  hint="MP4 up to 2GB, portrait or landscape"
                  icon="cloud-upload-outline"
                  aspect="video"
                  previewUri={videoPreview}
                  upload={video.upload}
                  error={showErrors ? (errors.videoAssetId ?? errors.videoReady) : undefined}
                  onPick={() => void pick('video')}
                  onClear={() => {
                    setVideoPreview(null);
                    void video.cancel();
                  }}
                />
              </View>

              <View>
                <Text variant="label" className="mb-2 ml-1">
                  Trailer / Teaser, optional
                </Text>
                <MediaPicker
                  title="Add a trailer"
                  hint="Short teaser preview for the video details page"
                  icon="videocam-outline"
                  aspect="wide"
                  previewUri={trailerPreview}
                  upload={trailer.upload}
                  error={showErrors ? errors.trailerReady : undefined}
                  onPick={() => void pick('trailer')}
                  onClear={() => {
                    setTrailerPreview(null);
                    void trailer.cancel();
                  }}
                />
              </View>

              <View>
                <View className="mb-2 flex-row items-center gap-1.5">
                  <Text variant="label" className="ml-1">
                    Poster
                  </Text>
                  <View className="rounded bg-danger/10 px-1.5 py-0.5">
                    <Text variant="caption" className="font-bold text-danger">
                      Required
                    </Text>
                  </View>
                </View>
                <MediaPicker
                  title="Add a poster"
                  hint="2:3 portrait. This is what people see in every row."
                  icon="image-outline"
                  aspect="portrait"
                  previewUri={posterPreview}
                  upload={poster.upload}
                  error={showErrors ? (errors.posterAssetId ?? errors.posterReady) : undefined}
                  onPick={() => void pick('poster')}
                  onClear={() => {
                    setPosterPreview(null);
                    void poster.cancel();
                  }}
                />
              </View>

              <View>
                <Text variant="label" className="mb-2 ml-1">
                  Wide image, optional
                </Text>
                <MediaPicker
                  title="Add a wide image"
                  hint="16:9 for the big banner on Home"
                  icon="tv-outline"
                  aspect="wide"
                  previewUri={backdropPreview}
                  upload={backdrop.upload}
                  onPick={() => void pick('backdrop')}
                  onClear={() => {
                    setBackdropPreview(null);
                    void backdrop.cancel();
                  }}
                />
                <View className="mt-2 flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
                  <Ionicons name="information-circle-outline" size={15} color={neutral[400]} />
                  <Text variant="caption" className="flex-1 leading-5">
                    Skip this and we take a frame from your film instead. Add one
                    if you want control over how you look on the Home banner.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {step === 'details' ? (
            <View className="gap-5">
              <Input
                label="Title"
                placeholder="Name your content"
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                error={showErrors ? errors.title : undefined}
              />

              <View>
                <Input
                  label="Description"
                  placeholder="Tell people what this is about"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={2000}
                  error={showErrors ? errors.description : undefined}
                />
                <Text variant="caption" className="mt-1 self-end text-neutral-400">
                  {description.length} / 2000
                </Text>
              </View>

              <Select
                label="Category"
                placeholder="Choose one"
                value={category}
                options={CATEGORIES}
                onChange={setCategory}
                error={showErrors ? errors.category : undefined}
              />

              {/* Tags live with the rest of the discovery fields. They are how
                  people find this, which is what every other field here is for. */}
              <HashtagInput
                value={hashtags}
                onChange={setHashtags}
                error={showErrors ? errors.hashtags : undefined}
              />

              <Select
                label="Visibility"
                value={visibility}
                options={VISIBILITY}
                onChange={setVisibility}
                sheetIntro="Who can find this once it passes review. You can change it later."
              />

              <View>
                <Text variant="label" className="mb-2 ml-1">
                  Content rating
                </Text>
                <SegmentedTabs options={RATINGS} value={rating} onChange={setRating} />
                <Text variant="caption" className="mt-1.5 ml-1 text-neutral-400">
                  Rate honestly. Content rated below what it contains gets pulled
                  at review.
                </Text>
              </View>
            </View>
          ) : null}

          {step === 'pricing' ? (
            <PricingSection
              mode={pricingMode}
              onModeChange={setPricingMode}
              price={price}
              onPriceChange={setPrice}
              error={showErrors ? errors.price : undefined}
            />
          ) : null}

          {step === 'review' ? (
            <View className="gap-5">
              <ReviewSummary draft={draft} thumbnailUri={posterPreview} />

              <Checkbox
                checked={rights}
                onChange={setRights}
                error={showErrors ? errors.rightsConfirmed : undefined}
                label={
                  <Text variant="label">
                    I own or have permission to publish this, and it follows the{' '}
                    <Text variant="label" className="font-bold text-brand-500">
                      Community Guidelines
                    </Text>{' '}
                    and{' '}
                    <Text variant="label" className="font-bold text-brand-500">
                      Terms of Service
                    </Text>
                    .
                  </Text>
                }
              />

              <View className="flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
                <Ionicons name="shield-checkmark-outline" size={15} color={neutral[400]} />
                <Text variant="caption" className="flex-1 leading-5">
                  New uploads are reviewed before they appear publicly. You can
                  track the status under My uploads.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View className="gap-2 pb-4 pt-3">
          {/* Say why the button is off. A dead button with no explanation is the
              single most common reason people abandon a form. */}
          {!canContinue ? (
            <Text variant="caption" className="text-center text-neutral-400">
              {Object.values(errors)[0]}
            </Text>
          ) : null}

          <View className="flex-row gap-3">
            {previousStep(step) ? (
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Back a step"
                className="h-12 w-12 items-center justify-center rounded-lg border border-neutral-200"
              >
                <Ionicons name="arrow-back" size={19} color={neutral[700]} />
              </Pressable>
            ) : null}

            <View className="flex-1">
              {step === 'review' ? (
                <Button
                  label="CloudIt"
                  loading={submitting}
                  disabled={!canContinue}
                  onPress={() => void submit()}
                />
              ) : (
                <Button label="Continue" disabled={!canContinue} onPress={goNext} />
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
