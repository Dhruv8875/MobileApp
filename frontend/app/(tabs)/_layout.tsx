import { Tabs } from 'expo-router';
import { Home, Heart, User, Plus, Briefcase } from 'lucide-react-native';
import { Colors } from '../../src/theme';
import { useAuth } from '../../src/api';

export default function TabsLayout() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { borderTopColor: Colors.border, paddingTop: 6, height: 70, paddingBottom: 12 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen
        name="favorites"
        options={isOwner
          ? { href: null, title: 'Favorites' }
          : { title: 'Saved', tabBarIcon: ({ color, size }) => <Heart size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="dashboard"
        options={isOwner
          ? { title: 'Dashboard', tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} /> }
          : { href: null }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}
