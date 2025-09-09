import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Share,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  bg: '#C6021E',
  card: '#AD1528',
  field: '#9F1224',
  stroke: 'rgba(255,255,255,0.22)',
  white: '#FFFFFF',
  white90: 'rgba(255,255,255,0.9)',
  white80: 'rgba(255,255,255,0.85)',
  white60: 'rgba(255,255,255,0.6)',
  chip: '#8E1021',
};

const TAB_BAR_H = 100;
const { width: W, height: H } = Dimensions.get('window');
const isSmall = W < 360 || H < 680;

const FS = isSmall ? 0.94 : 1;
const SZ = isSmall ? 0.92 : 1;
const fs = (n: number) => Math.round(n * FS);

const STORE_KEY = 'protouch.saved.tips';

const RAW_TIPS = [
  'Use different passwords for each account.',
  'Enable two-factor authentication wherever possible.',
  'Avoid clicking on unknown email links.',
  'Update your software and apps regularly.',
  'Don’t reuse old passwords.',
  'Use a password manager or iCloud Keychain.',
  'Lock your phone and computer when not in use.',
  'Avoid using public Wi-Fi for sensitive actions.',
  'Watch out for phishing messages and fake websites.',
  'Don’t share your passwords with anyone.',
  'Use biometric authentication if available.',
  'Monitor your accounts for suspicious activity.',
  'Avoid using birthdays or names in passwords.',
  'Back up your data securely and regularly.',
  'Log out from services you no longer use.',
];

type Tip = { id: string; title: string; text: string };
const TIPS: Tip[] = RAW_TIPS.map((t, i) => ({ id: String(i + 1), title: `Tip #${i + 1}`, text: t }));

const isBigIPhone = Platform.OS === 'ios' && Math.max(W, H) >= 900;
const TOP_DELTA = Platform.OS === 'android' ? 20 : (isBigIPhone ? -20 : 0);

export default function TipsScreen() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();
  const blockerH = TAB_BAR_H + insets.bottom;
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

  const itemAnims = useRef<Animated.Value[]>([]);
  const ensureItemAnims = (len: number) => {
    if (itemAnims.current.length !== len) {
      itemAnims.current = Array.from({ length: len }, (_, i) => itemAnims.current[i] ?? new Animated.Value(0));
    }
  };
  const animateList = useCallback((len: number) => {
    ensureItemAnims(len);
    const anims = itemAnims.current.slice(0, len).map(v => {
      v.setValue(0);
      return Animated.timing(v, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    });
    Animated.stagger(70, anims).start();
  }, []);
  const itemStyle = (i: number) => ({
    opacity: (itemAnims.current[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [
      { translateY: (itemAnims.current[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: (itemAnims.current[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
      { rotateZ: (itemAnims.current[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: ['2deg', '0deg'] }) },
    ],
  });

  useFocusEffect(
    useCallback(() => {
      runEnter();
      animateList(TIPS.length);
      return undefined;
    }, [runEnter, animateList])
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) setSavedIds(new Set(JSON.parse(raw)));
      } catch {}
    })();
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(Array.from(savedIds))).catch(() => {});
  }, [savedIds]);

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const onShare = async (tip: Tip) => {
    try {
      await Share.share({ message: `${tip.title}\n${tip.text}` });
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
        <ScrollView
          contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 16 * SZ, paddingBottom: blockerH + 24 }}
          showsVerticalScrollIndicator={false}
          onLayout={() => animateList(TIPS.length)}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[s.headerPill, itemStyle(0)]}>
            <Text style={s.headerPillTxt}>Security reccomendations</Text>
          </Animated.View>

          {TIPS.map((tip, i) => {
            const saved = savedIds.has(tip.id);
            return (
              <Animated.View key={tip.id} style={[s.card, itemStyle(i + 1)]}>
                <Text style={s.tipTitle}>{tip.title}</Text>
                <Text style={s.tipText}>{tip.text}</Text>

                <View style={s.actionsRow}>
                  <SmallIconBtn
                    label="🔖"
                    active={saved}
                    onPress={() => toggleSave(tip.id)}
                    accessibilityLabel={saved ? 'Remove from saved' : 'Save tip'}
                  />
                  <SmallIconBtn
                    label="↗️"
                    onPress={() => onShare(tip)}
                    accessibilityLabel="Share tip"
                  />
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      </Animated.View>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: blockerH,
          backgroundColor: C.bg,
        }}
      />
    </SafeAreaView>
  );
}

function SmallIconBtn({
  label,
  onPress,
  active,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        s.iconBtn,
        active && s.iconBtnActive,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[s.iconTxt, active && { color: '#C6021E' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

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

  card: {
    marginTop: 12 * SZ,
    padding: 14 * SZ,
    borderRadius: 18 * SZ,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.stroke,
  },
  tipTitle: { color: C.white, fontWeight: '800', marginBottom: 4 * SZ, fontSize: fs(15) },
  tipText: { color: C.white80, lineHeight: fs(20), fontSize: fs(13) },

  actionsRow: {
    marginTop: 12 * SZ,
    flexDirection: 'row',
    gap: 10 * SZ,
  },
  iconBtn: {
    width: 38 * SZ,
    height: 38 * SZ,
    borderRadius: 12 * SZ,
    backgroundColor: C.chip,
    borderWidth: 1,
    borderColor: C.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: C.white,
    borderColor: C.white,
  },
  iconTxt: { color: C.white, fontSize: fs(16), fontWeight: '600' },
});