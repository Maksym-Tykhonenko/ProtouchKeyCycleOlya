import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from './RootNavigator';

import NotificatorScreen from '../screens/NotificatorScreen';
import PasswordScreen from '../screens/PasswordScreen';
import TipsScreen from '../screens/TipsScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';

type TabsParamList = {
  NOTIFICATOR: undefined;
  PASSWORD: undefined;
  TIPS: undefined;
  SAVED: undefined;
  SETTINGS: undefined;
};

type TabsProps = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

const Tab = createBottomTabNavigator<TabsParamList>();

type IconPair = { inactive: ImageSourcePropType; active: ImageSourcePropType };
type ExtraProps = { tabBarBg?: ImageSourcePropType; tabIcons?: IconPair[] };

function CustomTabBar(
  { state, descriptors, navigation, tabBarBg, tabIcons }: BottomTabBarProps & ExtraProps
) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  const barWidth = Math.min(354, screenW - 20);
  const scale = barWidth / 354;
  const barHeight = 75 * scale;
  const iconSize = 62 * scale;

  const bg = tabBarBg ?? require('../assets/tabbar_bg.png');

  const icons = tabIcons ?? [
    { inactive: require('../assets/tab_1.png'), active: require('../assets/tab_1_active.png') },
    { inactive: require('../assets/tab_2.png'), active: require('../assets/tab_2_active.png') },
    { inactive: require('../assets/tab_3.png'), active: require('../assets/tab_3_active.png') },
    { inactive: require('../assets/tab_4.png'), active: require('../assets/tab_4_active.png') },
    { inactive: require('../assets/tab_5.png'), active: require('../assets/tab_5_active.png') },
  ];

  const hitSlop = useMemo(() => ({ top: 10, bottom: 10, left: 10, right: 10 }), []);

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={[styles.barContainer, { width: barWidth, height: barHeight }]}>
      
        <Image source={bg} style={{ width: barWidth, height: barHeight }} resizeMode="contain" />

        <View style={styles.buttonsRow} pointerEvents="box-none">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const iconPair = icons[index] ?? icons[icons.length - 1];
            const src = isFocused ? iconPair.active : iconPair.inactive;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                android_ripple={{ borderless: true }}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
                style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Image source={src} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function AppTabs({ route }: TabsProps) {
  const { tabBarBg, tabIcons } = route?.params ?? {};
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarShowLabel: false }}
      tabBar={(props) => <CustomTabBar {...(props as BottomTabBarProps)} tabBarBg={tabBarBg} tabIcons={tabIcons} />}
      initialRouteName="NOTIFICATOR"
    >
      <Tab.Screen name="NOTIFICATOR" component={NotificatorScreen} />
      <Tab.Screen name="PASSWORD" component={PasswordScreen} />
      <Tab.Screen name="TIPS" component={TipsScreen} />
      <Tab.Screen name="SAVED" component={SavedScreen} />
      <Tab.Screen name="SETTINGS" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    alignItems: 'center',
  },
  barContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsRow: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
