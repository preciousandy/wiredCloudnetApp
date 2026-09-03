import { parseMoneyInput, type Money } from '@/lib/money';

/**
 * Upload as a sequence of decisions rather than one wall of fields.
 *
 * The old screen asked for eleven things at once, which is why nobody could
 * tell what was still missing. Splitting it means each step has one job and can
 * validate itself, and the Continue button can be honest about why it is disabled.
 */
export const UPLOAD_STEPS = ['media', 'details', 'pricing', 'review'] as const;
export type UploadStep = (typeof UPLOAD_STEPS)[number];

export const STEP_TITLES: Record<UploadStep, string> = {
  media: 'Your video',
  details: 'Details',
  pricing: 'Pricing',
  review: 'Review',
};

export const STEP_SUBTITLES: Record<UploadStep, string> = {
  media: 'Your film and its poster',
  details: 'Tell people what this is',
  pricing: 'Free, or set a price',
  review: 'Check it over before it goes for review',
};

/**
 * What each step actually needs, shown above the progress bar.
 *
 * Creators arrive without knowing what a poster aspect ratio is or why a
 * description matters. Saying it at the moment they need it is worth more than
 * a help page nobody opens.
 */
export const STEP_GUIDANCE: Record<UploadStep, { heading: string; points: string[] }> = {
  media: {
    heading: 'What you need',
    points: [
      'MP4 film file, up to 2GB. Portrait or landscape both work.',
      'A trailer video is optional. Plays on the video details page.',
      'A poster image, 2:3 portrait. This is what people see in every row.',
      'A wide 16:9 image is optional. Without one we take a frame from your film.',
    ],
  },
  details: {
    heading: 'Getting found',
    points: [
      'A clear title beats a clever one. People search for what they expect.',
      'The first line of your description is what shows in search results.',
      'Tags help people find you. Five good ones beat ten vague ones.',
    ],
  },
  pricing: {
    heading: 'Getting paid',
    points: [
      'You keep 70 percent of every sale. CloudNet takes 30.',
      'Viewers pay from their wallet, so a lower price sells more often.',
      'Free content still grows your followers and pushes your paid titles.',
    ],
  },
  review: {
    heading: 'Before it goes live',
    points: [
      'Everything new is checked before it appears publicly.',
      'Licensed music you do not own is the most common rejection.',
      'You can change the price and visibility later. The file itself you cannot.',
    ],
  },
};

export interface UploadDraft {
  videoAssetId: string | null;
  videoReady: boolean;
  /** Optional trailer/teaser video */
  trailerAssetId?: string | null;
  trailerReady?: boolean;
  /** 2:3 portrait. Required: a title with no poster is invisible in every row. */
  posterAssetId: string | null;
  posterReady: boolean;
  /** 16:9 landscape for the hero. Optional, derived from a video frame if absent. */
  backdropAssetId: string | null;
  title: string;
  description: string;
  category: string | null;
  hashtags: string[];
  visibility: string | null;
  rating: string;
  pricingMode: 'free' | 'premium';
  price: string;
  rightsConfirmed: boolean;
}

export type StepErrors = Partial<Record<keyof UploadDraft, string>>;

/** What is wrong with this step, if anything. Empty means the step is done. */
export function validateStep(step: UploadStep, draft: UploadDraft): StepErrors {
  const errors: StepErrors = {};

  if (step === 'media') {
    if (!draft.videoAssetId) errors.videoAssetId = 'Choose a video to upload.';
    else if (!draft.videoReady) errors.videoReady = 'Wait for the upload to finish.';

    if (draft.trailerAssetId && draft.trailerReady === false) {
      errors.trailerReady = 'Wait for the trailer upload to finish.';
    }

    // A poster is not decoration. Without one the title cannot appear in any
    // row on Home, so it is required rather than encouraged.
    if (!draft.posterAssetId) errors.posterAssetId = 'Add a poster image.';
    else if (!draft.posterReady) errors.posterReady = 'Wait for the poster to finish.';
  }

  if (step === 'details') {
    const title = draft.title.trim();
    if (title.length === 0) errors.title = 'Give your content a title.';
    else if (title.length < 2) errors.title = 'Use at least 2 characters.';

    const description = draft.description.trim();
    if (description.length === 0) errors.description = 'Write a short description.';
    else if (description.length < 20) errors.description = 'A little more detail helps people find it.';

    if (!draft.category) errors.category = 'Pick a category.';
    if (draft.hashtags.length > 10) errors.hashtags = 'Ten tags is the limit.';
  }

  if (step === 'pricing') {
    if (draft.pricingMode === 'premium') {
      const parsed = parseMoneyInput(draft.price, 'CP');
      if (!parsed) errors.price = 'Enter a price in CP.';
      else if (parsed.minor <= 0) errors.price = 'Set a price above zero.';
      else if (parsed.minor < 100) errors.price = 'Minimum price is 100 CP ($0.50).';
    }
  }

  if (step === 'review') {
    if (!draft.rightsConfirmed) errors.rightsConfirmed = 'Confirm you have the rights.';
  }

  return errors;
}

export function isStepComplete(step: UploadStep, draft: UploadDraft): boolean {
  return Object.keys(validateStep(step, draft)).length === 0;
}

/** A step is reachable only once every step before it is done. */
export function canReachStep(step: UploadStep, draft: UploadDraft): boolean {
  const index = UPLOAD_STEPS.indexOf(step);
  return UPLOAD_STEPS.slice(0, index).every((earlier) => isStepComplete(earlier, draft));
}

export function nextStep(step: UploadStep): UploadStep | null {
  const index = UPLOAD_STEPS.indexOf(step);
  return UPLOAD_STEPS[index + 1] ?? null;
}

export function previousStep(step: UploadStep): UploadStep | null {
  const index = UPLOAD_STEPS.indexOf(step);
  return index > 0 ? (UPLOAD_STEPS[index - 1] ?? null) : null;
}

/**
 * Creator share of a sale, confirmed policy: 70 to the creator, 30 to CloudNet.
 * Shown to creators at upload time, so changing it is a product decision rather
 * than a code tweak.
 */
export const CREATOR_SHARE = 0.7;

export function creatorEarnings(price: Money): Money {
  return { minor: Math.round(price.minor * CREATOR_SHARE), currency: price.currency };
}

export function platformCommission(price: Money): Money {
  return { minor: price.minor - creatorEarnings(price).minor, currency: price.currency };
}
