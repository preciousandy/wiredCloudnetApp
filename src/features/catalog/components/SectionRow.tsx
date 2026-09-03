import { FlatList, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import type { HomeSection } from '@/api/schemas/catalog';
import { ContinueCard } from './ContinueCard';
import { SectionHeader } from './SectionHeader';
import { TitleCard } from './TitleCard';

/**
 * Renders one server-defined section.
 *
 * The server picks the layout via `type`, so merchandising can reshape the home
 * screen without an app release. Anything unrecognised renders as a carousel
 * rather than disappearing, which means a new section type shipped by the
 * backend degrades gracefully on older clients instead of leaving a hole.
 */
export function SectionRow({ section }: { section: HomeSection }) {
  const { width } = useWindowDimensions();

  if (section.items.length === 0) return null;

  const onSeeAll = section.seeAllQuery
    ? () =>
        router.push(
          `/browse?category=${encodeURIComponent(section.seeAllQuery!)}&title=${encodeURIComponent(section.title ?? 'Browse')}`,
        )
    : undefined;


  if (section.type === 'continue') {
    const cardWidth = width * 0.62;
    return (
      <View className="mb-7">
        {section.title ? <SectionHeader title={section.title} /> : null}
        <FlatList
          data={section.items}
          keyExtractor={(item) => `continue-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item }) => <ContinueCard title={item} width={cardWidth} />}
        />
      </View>
    );
  }

  if (section.type === 'grid') {
    const gap = 12;
    const cardWidth = (width - 32 - gap) / 2;
    return (
      <View className="mb-7">
        {section.title ? <SectionHeader title={section.title} onSeeAll={onSeeAll} /> : null}
        <View className="flex-row flex-wrap px-4" style={{ gap }}>
          {section.items.map((item) => (
            <TitleCard key={`grid-${item.id}`} title={item} width={cardWidth} />
          ))}
        </View>
      </View>
    );
  }

  const cardWidth = section.type === 'spotlight' ? width * 0.38 : width * 0.33;

  return (
    <View className="mb-7">
      {section.title ? <SectionHeader title={section.title} onSeeAll={onSeeAll} /> : null}
      <FlatList
        data={section.items}
        keyExtractor={(item) => `${section.id}-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => <TitleCard title={item} width={cardWidth} />}
      />
    </View>
  );
}
