import { money } from '@/lib/money';
import type { Episode, Season } from '../schemas/series';

/**
 * Mock series data.
 *
 * Lagos Nights is mid-run: some episodes out, some announced. That is the case
 * that decided the pricing model, so it is the one the fixtures cover.
 */

const still = (seed: string) => `https://picsum.photos/seed/${seed}/640/360`;

interface EpisodeSeed {
  n: number;
  title: string;
  synopsis: string;
  duration: number;
  priceMinor: number | null;
  released?: boolean;
  releasesAt?: string;
}

function buildSeason(
  seriesId: string,
  seasonNumber: number,
  title: string,
  seeds: EpisodeSeed[],
): Season {
  const episodes: Episode[] = seeds.map((seed) => ({
    id: `${seriesId}-s${seasonNumber}e${seed.n}`,
    seriesId,
    seasonNumber,
    episodeNumber: seed.n,
    title: seed.title,
    synopsis: seed.synopsis,
    stillUrl: still(`${seriesId}${seasonNumber}${seed.n}`),
    durationSeconds: seed.duration,
    rating: 'all',
    price: seed.priceMinor === null ? null : money(seed.priceMinor, 'CP'),
    entitled: false,
    released: seed.released ?? true,
    releasesAt: seed.releasesAt ?? null,
    progressSeconds: null,
  }));

  return {
    seasonNumber,
    title,
    episodeCount: episodes.length,
    releasedCount: episodes.filter((e) => e.released).length,
    episodes,
  };
}

export const seasonsBySeries: Record<string, Season[]> = {
  lagosnights: [
    buildSeason('lagosnights', 1, 'Season 1', [
      { n: 1, title: 'Last Bus to Yaba', synopsis: 'A missed connection turns into a very long night.', duration: 2700, priceMinor: null },
      { n: 2, title: 'Third Mainland', synopsis: 'Two strangers share a taxi and a secret.', duration: 2820, priceMinor: 50 },
      { n: 3, title: 'Closing Time', synopsis: 'The bar shuts. Nobody leaves.', duration: 2640, priceMinor: 50 },
      { n: 4, title: 'Generator', synopsis: 'The power cuts out at the worst possible moment.', duration: 2760, priceMinor: 30000 },
      { n: 5, title: 'Sunrise', synopsis: 'Coming soon.', duration: 2700, priceMinor: 30000, released: false, releasesAt: '2026-08-19T18:00:00.000Z' },
      { n: 6, title: 'Finale', synopsis: 'Coming soon.', duration: 3300, priceMinor: 40000, released: false, releasesAt: '2026-08-26T18:00:00.000Z' },
    ]),
  ],

  quietrooms: [
    buildSeason('quietrooms', 1, 'Season 1', [
      { n: 1, title: 'The Viewing', synopsis: 'An estate agent shows a house that does not want to be sold.', duration: 3300, priceMinor: 40000 },
      { n: 2, title: 'Second Floor', synopsis: 'The buyer moves in. The house adjusts.', duration: 3180, priceMinor: 40000 },
      { n: 3, title: 'Neighbours', synopsis: 'Nobody on the street will talk about the previous owner.', duration: 3240, priceMinor: 40000 },
    ]),
    buildSeason('quietrooms', 2, 'Season 2', [
      { n: 1, title: 'New Tenants', synopsis: 'A family arrives, unaware.', duration: 3300, priceMinor: 45000 },
      { n: 2, title: 'Renovation', synopsis: 'Coming soon.', duration: 3300, priceMinor: 45000, released: false, releasesAt: '2026-09-02T18:00:00.000Z' },
    ]),
  ],
};

export const SERIES_IDS = Object.keys(seasonsBySeries);

export function isSeries(titleId: string): boolean {
  return titleId in seasonsBySeries;
}

export function allEpisodes(): Episode[] {
  return Object.values(seasonsBySeries).flatMap((seasons) =>
    seasons.flatMap((season) => season.episodes),
  );
}

export function findEpisode(episodeId: string): Episode | undefined {
  return allEpisodes().find((e) => e.id === episodeId);
}

/** The next released episode the viewer has not finished, or the first one. */
export function nextEpisodeFor(seriesId: string): string | null {
  const seasons = seasonsBySeries[seriesId];
  if (!seasons) return null;

  for (const season of seasons) {
    for (const episode of season.episodes) {
      if (!episode.released) continue;
      const watched = episode.progressSeconds ?? 0;
      const finished = episode.durationSeconds > 0 && watched / episode.durationSeconds > 0.95;
      if (!finished) return episode.id;
    }
  }

  const firstReleased = seasons.flatMap((s) => s.episodes).find((e) => e.released);
  return firstReleased?.id ?? null;
}

/** The episode after this one, within the same series. Null at the end of a run. */
export function episodeAfter(episodeId: string): Episode | null {
  const current = findEpisode(episodeId);
  if (!current) return null;

  const ordered = (seasonsBySeries[current.seriesId] ?? [])
    .flatMap((s) => s.episodes)
    .filter((e) => e.released);

  const index = ordered.findIndex((e) => e.id === episodeId);
  if (index === -1 || index === ordered.length - 1) return null;
  return ordered[index + 1] ?? null;
}
