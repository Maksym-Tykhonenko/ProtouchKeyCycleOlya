import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  bg: '#C6021E',
  card: '#AD1528',
  field: '#9F1224',
  stroke: 'rgba(255,255,255,0.22)',
  white: '#FFFFFF',
  white80: 'rgba(255,255,255,0.85)',
  white60: 'rgba(255,255,255,0.6)',
  chip: '#8E1021',
  green: '#27C266',
};

const TAB_BAR_H = 100;
const { width: W, height: H } = Dimensions.get('window');
const isSmall = W < 360 || H < 680;
const isBigIPhone = Platform.OS === 'ios' && Math.max(W, H) >= 900;
const TOP_DELTA = Platform.OS === 'android' ? 20 : (isBigIPhone ? -20 : 0);

const FS = isSmall ? 0.94 : 1;
const SZ = isSmall ? 0.92 : 1;
const fs = (n: number) => Math.round(n * FS);

export default function PasswordScreen() {
  const [pwd, setPwd] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const topPad = Math.max(12, insets.top + 8 + TOP_DELTA);

  const hasPwd = pwd.length > 0;

  const masked = useMemo(() => {
    if (!hasPwd) return '*** • *** • *** • ***';
    const len = Math.max(8, Math.min(24, pwd.length));
    return '•'.repeat(len);
  }, [pwd, hasPwd]);

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
      stepA.map(v => Animated.timing(v, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }))
    ).start();
  }, [stepA]);

  const boxScale = useRef(new Animated.Value(1)).current;
  const pulseBox = () => {
    boxScale.setValue(0.97);
    Animated.spring(boxScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 140, mass: 0.5 }).start();
  };

  const bubbleA = useRef(new Animated.Value(0)).current;
  const showBubble = () => {
    bubbleA.setValue(0);
    setCopied(true);
    Animated.timing(bubbleA, { toValue: 1, duration: 180, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(bubbleA, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setCopied(false));
      }, 900);
    });
  };

  useFocusEffect(
    useCallback(() => {
      runEnter();
      runCascade();
      return undefined;
    }, [runEnter, runCascade])
  );

  const onGenerate = () => {
    const next = generatePassword(16);
    setPwd(next);
    setVisible(true);
    pulseBox();
  };

  const onCopy = () => {
    if (!hasPwd) return;
    Clipboard.setString(pwd);
    showBubble();
  };

  const stepStyle = (i: number) => ({
    opacity: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [
      { translateY: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  });

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
            <Text style={s.headerPillTxt}>Password generator</Text>
          </Animated.View>

          <Animated.Image
            source={require('../assets/lock-shield.png')}
            style={[
              { width: (isSmall ? 140 : 160) * SZ, height: (isSmall ? 140 : 160) * SZ, marginTop: 18 * SZ },
              stepStyle(1),
            ]}
            resizeMode="contain"
          />

          <Animated.View style={[s.pwdBox, stepStyle(2), { transform: [...(stepStyle(2).transform as any), { scale: boxScale }] }]}>
            <Text
              numberOfLines={1}
              style={[s.pwdText, hasPwd && visible ? { color: C.green } : { color: C.white80 }]}
            >
              {hasPwd ? (visible ? pwd : masked) : masked}
            </Text>

            <View style={s.pwdActions}>
              <IconBtn
                label={visible ? '🙈' : '👁'}
                onPress={() => setVisible(v => !v)}
                accessibilityLabel={visible ? 'Hide password' : 'Show password'}
              />
              <IconBtn
                label="📋"
                onPress={onCopy}
                accessibilityLabel="Copy password"
              />
              {copied && (
                <Animated.View
                  style={[
                    s.copiedBubble,
                    {
                      opacity: bubbleA,
                      transform: [{ translateY: bubbleA.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
                    },
                  ]}
                >
                  <Text style={s.copiedTxt}>Copied</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          <Animated.View style={[stepStyle(3), { alignSelf: 'stretch' }]}>
            <Pressable style={s.bigBtn} onPress={onGenerate}>
              <Text style={s.bigBtnTxt}>{hasPwd ? 'Regenerate' : 'Generate password'}</Text>
            </Pressable>
          </Animated.View>

          <View style={{ alignItems: 'center', marginTop: 28 * SZ }}>
            <Text style={{ color: C.white60, fontSize: fs(12), marginBottom: 2 * SZ }}>Powered by:</Text>
            <Text style={{ color: C.white, fontWeight: '700', fontSize: fs(14) }}>iCloud Keychain</Text>
          </View>
          <View style={{ height: TAB_BAR_H }} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}


function IconBtn({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        s.iconBtn,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      hitSlop={8}
    >
      <Text style={{ color: C.white, fontSize: fs(15) }}>{label}</Text>
    </Pressable>
  );
}

function generatePassword(length = 16) {
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = lower + upper + digits;

  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let res = [pick(lower), pick(upper), pick(digits)];
  while (res.length < length) res.push(pick(all));
 
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res.join('');
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16 * SZ,
  },

  headerPill: {
    marginTop: 8 * SZ,
    height: 42 * SZ,
    alignSelf: 'stretch',
    borderRadius: 21 * SZ,
    backgroundColor: '#940F22',
    borderWidth: 1,
    borderColor: C.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPillTxt: { color: C.white, fontWeight: '800', fontSize: fs(15) },

  pwdBox: {
    marginTop: 18 * SZ,
    alignSelf: 'stretch',
    minHeight: 56 * SZ,
    borderRadius: 18 * SZ,
    backgroundColor: C.field,
    borderWidth: 1,
    borderColor: C.stroke,
    paddingLeft: 16 * SZ,
    paddingRight: 8 * SZ,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pwdText: {
    flex: 1,
    fontWeight: '700',
    fontSize: fs(15),
  },
  pwdActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SZ,
    marginLeft: 8 * SZ,
  },
  iconBtn: {
    width: 34 * SZ,
    height: 34 * SZ,
    borderRadius: 10 * SZ,
    backgroundColor: C.chip,
    borderWidth: 1,
    borderColor: C.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiedBubble: {
    position: 'absolute',
    right: 0,
    bottom: 34 * SZ,
    backgroundColor: C.white,
    borderRadius: 12 * SZ,
    paddingHorizontal: 10 * SZ,
    height: 28 * SZ,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  copiedTxt: { color: '#111', fontWeight: '700', fontSize: fs(12) },

  bigBtn: {
    marginTop: 14 * SZ,
    alignSelf: 'stretch',
    height: 56 * SZ,
    borderRadius: 28 * SZ,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBtnTxt: { fontSize: fs(16), fontWeight: '800', color: '#000' },
});