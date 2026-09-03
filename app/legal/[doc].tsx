import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BackButton, Screen, Text } from '@/ui';
import { LEGAL_DOCS } from '@/copy/legal';

export default function LegalDocument() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const document = LEGAL_DOCS[String(doc)];

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading" numberOfLines={1} className="flex-1 text-center">
          {document?.title ?? 'Document'}
        </Text>
        <View className="w-10" />
      </View>

      {!document ? (
        <Text variant="body" className="mt-16 text-center text-neutral-400">
          That document does not exist.
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text variant="caption" className="mt-5">
            Last updated {document.updated}
          </Text>

          {document.sections.map((section) => (
            <View key={section.heading} className="mt-6">
              <Text variant="heading" className="text-[17px]">
                {section.heading}
              </Text>
              <Text variant="body" className="mt-1.5 text-neutral-600">
                {section.body}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
