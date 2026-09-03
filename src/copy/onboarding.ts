/**
 * Onboarding slides.
 *
 * Draft copy for the creative director to replace. The order tells a story:
 * what you can watch, then who you follow, then how you pay. Six slides is on
 * the long side for onboarding; three or four typically holds attention better,
 * so treat the last two as candidates to cut.
 */
export interface OnboardingSlide {
  id: string;
  title: string;
  body: string;
  image: number;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'film',
    title: 'Movies and series',
    body: 'Stream films, documentaries and full series from creators across Africa and beyond.',
    image: require('../../assets/onboarding_film.jpg'),
  },
  {
    id: 'live',
    title: 'Live, as it happens',
    body: 'Premieres, concerts and events streamed live, straight to your phone.',
    image: require('../../assets/onboarding_live.jpg'),
  },
  {
    id: 'stage',
    title: 'Shows worth showing up for',
    body: 'Stand-up, stage plays and performances you will not find anywhere else.',
    image: require('../../assets/onboarding_stage.jpg'),
  },
  {
    id: 'disco',
    title: 'Music and shorts',
    body: 'Music videos, short films and quick watches for when you have five minutes.',
    image: require('../../assets/onboarding_disco.jpg'),
  },
  {
    id: 'users',
    title: 'Follow the creators',
    body: 'Back the people making the work. Get notified the moment they upload.',
    image: require('../../assets/onboarding_users.jpg'),
  },
  {
    id: 'money',
    title: 'One wallet, one tap',
    body: 'Top up once, then buy what you want without entering card details again.',
    image: require('../../assets/onboarding_money.jpg'),
  },
];
