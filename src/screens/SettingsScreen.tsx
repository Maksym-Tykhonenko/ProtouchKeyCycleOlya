import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  Share,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  bg: '#C6021E',
  card: '#AD1528',
  stroke: 'rgba(255,255,255,0.22)',
  white: '#FFFFFF',
  white60: 'rgba(255,255,255,0.6)',
};

const TAB_BAR_H = 100;
const { width: W, height: H } = Dimensions.get('window');
const isSmall = W < 360 || H < 680;
const isBigIPhone = Platform.OS === 'ios' && Math.max(W, H) >= 900;
const TOP_DELTA = Platform.OS === 'android' ? 20 : (isBigIPhone ? -20 : 0);

const FS = isSmall ? 0.94 : 1;
const SZ = isSmall ? 0.92 : 1;
const fs = (n: number) => Math.round(n * FS);

const STORE_SETTINGS = 'protouch.settings';
const STORE_REMINDERS = 'protouch.reminders';
const STORE_SAVED_TIPS = 'protouch.saved.tips';

type Settings = {
  notifications: boolean;
  vibration: boolean;
  hideByDefault: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  vibration: true,
  hideByDefault: true,
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const insets = useSafeAreaInsets();
  const topPad = Math.max(12, insets.top + 8 + TOP_DELTA);

  const contX = useRef(new Animated.Value(W * 0.5)).current;
  const contScale = useRef(new Animated.Value(0.98)).current;
  const contTilt = useRef(new Animated.Value(1)).current;
  const contOpacity = useRef(new Animated.Value(0)).current;

  const runEnter = useCallback(() => {
    contX.setValue(W * 0.5);
    contScale.setValue(0.98);
    contTilt.setValue(1);
    contOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(contX, { toValue: 0, useNativeDriver: true, damping: 12, stiffness: 140, mass: 0.7 }),
      Animated.spring(contScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 140, mass: 0.7 }),
      Animated.timing(contTilt, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [contX, contScale, contTilt, contOpacity]);

  const stepA = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const runCascade = useCallback(() => {
    stepA.forEach(v => v.setValue(0));
    Animated.stagger(
      90,
      stepA.map(v =>
        Animated.timing(v, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      )
    ).start();
  }, [stepA]);

  const stepStyle = (i: number) => ({
    opacity: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [
      { translateY: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  });

  useFocusEffect(
    useCallback(() => {
      runEnter();
      runCascade();
      return undefined;
    }, [runEnter, runCascade])
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_SETTINGS);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORE_SETTINGS, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  const toggle = (key: keyof Settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const onDeleteData = () => {
    Alert.alert(
      'Delete app data',
      'This will remove reminders, saved tips and app settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([STORE_REMINDERS, STORE_SAVED_TIPS, STORE_SETTINGS]);
              setSettings(DEFAULT_SETTINGS);
              Alert.alert('Done', 'All app data deleted.');
            } catch {}
          },
        },
      ]
    );
  };

  const onShare = async () => {
    try {
      await Share.share({
        message:
          'Protouch — simple reminders and tips for better password hygiene. Stay secure!',
      });
    } catch {}
  };

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View
        style={{
          flex: 1,
          opacity: contOpacity,
          transform: [
            { perspective: 800 },
            { translateX: contX },
            { rotateY: contTilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-12deg'] }) },
            { scale: contScale },
          ],
        }}
      >
        <View style={[s.container, { paddingTop: topPad }]}>
          <Animated.View style={[s.headerPill, stepStyle(0)]}>
            <Text style={s.headerPillTxt}>Settings</Text>
          </Animated.View>

          <Animated.View style={[s.listCard, stepStyle(1)]}>
            <Row
              title="Notifications"
              value={settings.notifications}
              onValueChange={() => toggle('notifications')}
            />
            <Separator />
            <Row
              title="Vibration"
              value={settings.vibration}
              onValueChange={() => toggle('vibration')}
            />
            <Separator />
            <Row
              title="Hide passwords by default"
              value={settings.hideByDefault}
              onValueChange={() => toggle('hideByDefault')}
            />
          </Animated.View>

          <Animated.View style={stepStyle(2)}>
            <Pressable style={[s.bigBtn, s.dangerBtn]} onPress={onDeleteData}>
              <Text style={[s.bigBtnTxt, { color: C.white }]}>Delete app data</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={[stepStyle(3), { marginTop: 14 * SZ }]}>
            <Pressable onPress={onShare}>
              <Text style={{ color: C.white, fontWeight: '700', textAlign: 'center', fontSize: fs(14) }}>
                Share app
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: TAB_BAR_H }} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}


function Row({
  title,
  value,
  onValueChange,
}: {
  title: string;
  value: boolean;
  onValueChange: () => void;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(0,0,0,0.2)', true: '#34C759' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="rgba(0,0,0,0.2)"
      />
    </View>
  );
}

function Separator() {
  return <View style={s.sep} />;
}


const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, paddingHorizontal: 16 * SZ },

  headerPill: {
    marginTop: 8 * SZ,
    height: 42 * SZ,
    borderRadius: 21 * SZ,
    backgroundColor: '#940F22',
    borderWidth: 1,
    borderColor: C.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPillTxt: { color: C.white, fontWeight: '800', fontSize: fs(15) },

  listCard: {
    marginTop: 12 * SZ,
    borderRadius: 16 * SZ,
    backgroundColor: C.white,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 14 * SZ,
    height: 52 * SZ,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: { color: '#111', fontWeight: '700', fontSize: fs(14) },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.08)' },

  bigBtn: {
    marginTop: 14 * SZ,
    height: 56 * SZ,
    borderRadius: 28 * SZ,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBtnTxt: { fontSize: fs(16), fontWeight: '800', color: '#000' },
  dangerBtn: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.stroke,
  },
});