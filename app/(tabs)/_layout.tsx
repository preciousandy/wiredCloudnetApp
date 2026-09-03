import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { brand, neutral } from '@/ui/theme/colors';
import { useSession } from '@/store/session';

type IconName = keyof typeof Ionicons.glyphMap;

/** Filled when active, outlined when not, the standard mobile convention. */
function tabIcon(active: IconName, inactive: IconName) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );
}

/**
 * The route guard. Everything inside (tabs) requires a session, enforced here
 * once rather than re-checked in every screen where it can be forgotten.
 */
export default function TabsLayout() {
  const status = useSession((s) => s.status);

  if (status === 'booting') return null;
  if (status === 'anonymous') return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand[500],
        tabBarInactiveTintColor: neutral[500],
        tabBarStyle: { borderTopColor: neutral[200], height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="verticals"
        options={{
          title: 'Verticals',
          tabBarIcon: tabIcon('albums', 'albums-outline'),
          // The feed is full-screen video; a light tab bar over it looks wrong.
          tabBarStyle: { backgroundColor: '#000000', borderTopColor: '#1A1A1A', height: 64, paddingBottom: 8, paddingTop: 6 },
          tabBarInactiveTintColor: '#8E8E93',
        }}
      />
      <Tabs.Screen
        name="cloudit"
        options={{ title: 'CloudIt', tabBarIcon: tabIcon('cloud-upload', 'cloud-upload-outline') }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'Library', tabBarIcon: tabIcon('bookmark', 'bookmark-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
