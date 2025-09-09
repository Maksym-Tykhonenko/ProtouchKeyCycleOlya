import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, Pressable, TextInput, Image, Alert, ScrollView,
  Dimensions, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Interval = 10 | 30 | 60;
type Reminder = { id: string; title: string; comment?: string; interval: Interval; createdAt: number };

const STORE_KEY = 'protouch.reminders';

const C = {
  bg: '#C6021E', card: '#AD1528', field: '#9F1224', white: '#FFFFFF',
  white80: 'rgba(255,255,255,0.85)', white60: 'rgba(255,255,255,0.6)',
  stroke: 'rgba(255,255,255,0.22)', chip: '#8E1021', pill: '#B81A2C', btnDanger: '#7F0B19',
};

const TAB_BAR_H = 100;
const { width: W, height: H } = Dimensions.get('window');
const isSmall = W < 360 || H < 680;
const FS = isSmall ? 0.94 : 1;
const SZ = isSmall ? 0.92 : 1;
const fs = (n: number) => Math.round(n * FS);

const isBigIPhone = Platform.OS === 'ios' && Math.max(W, H) >= 900;
const TOP_DELTA = Platform.OS === 'android' ? 20 : (isBigIPhone ? -20 : 0);

function IconBtn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={[{
        width: 36 * SZ, height: 36 * SZ, borderRadius: Math.round(10 * SZ),
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: danger ? C.btnDanger : C.chip, borderWidth: 1, borderColor: C.stroke,
      }]}
      hitSlop={8}
    >
      <Text style={{ color: C.white, fontSize: fs(16) }}>{label}</Text>
    </Pressable>
  );
}

function Header({ title, showBack, onBack }: { title: string; showBack: boolean; onBack?: () => void }) {
  return (
    <View style={s.topRow}>
      {showBack ? (
        <Pressable onPress={onBack} style={s.backBtn} hitSlop={10}>
          <Text style={{ color: C.white, fontSize: fs(18) }}>{'‹'}</Text>
        </Pressable>
      ) : <View style={{ width: 36 * SZ }} />}
      <View style={s.headerPill}><Text style={s.headerPillTxt}>{title}</Text></View>
      <View style={{ width: 36 * SZ }} />
    </View>
  );
}

function EmptyState() {
  return (
    <View style={s.card}>
      <View style={s.emptyArt}>
        <Image source={require('../assets/calendar1.png')} style={{ width: 150 * SZ, height: 150 * SZ }} resizeMode="contain" />
      </View>
      <Text style={[s.cardTxt, { textAlign: 'center', marginTop: 10 * SZ }]}>
        There is no reminders now, you can{'\n'}add new using this button
      </Text>
    </View>
  );
}

export default function NotificatorScreen() {
  const insets = useSafeAreaInsets();
  const blockerH = TAB_BAR_H + insets.bottom;
  const topPad = Math.max(12, insets.top + Math.round(8 * SZ) + TOP_DELTA);

  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<Reminder[]>([]);

  const [title, setTitle] = useState('');
  const [interval, setInterval] = useState<Interval>(10);
  const [comment, setComment] = useState('');


  const contX = useRef(new Animated.Value(W * 0.5)).current;
  const contScale = useRef(new Animated.Value(0.98)).current;
  const contTilt = useRef(new Animated.Value(1)).current;
  const contOpacity = useRef(new Animated.Value(0)).current;

  const runEnter = useCallback(() => {
    contX.setValue(W * 0.5); contScale.setValue(0.98); contTilt.setValue(1); contOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(contX, { toValue: 0, useNativeDriver: true, damping: 12, stiffness: 140, mass: 0.7 }),
      Animated.spring(contScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 140, mass: 0.7 }),
      Animated.timing(contTilt, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [contX, contScale, contTilt, contOpacity]);

  useFocusEffect(useCallback(() => { runEnter(); return undefined; }, [runEnter]));
  useEffect(() => { runEnter(); }, [mode, runEnter]);

  useEffect(() => { (async () => {
      try { const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) { const parsed: Reminder[] = JSON.parse(raw); setItems(Array.isArray(parsed) ? parsed : []); }
      } catch {}
  })(); }, []);
  useEffect(() => { AsyncStorage.setItem(STORE_KEY, JSON.stringify(items)).catch(() => {}); }, [items]);

  const resetForm = () => { setEditingId(null); setTitle(''); setInterval(10); setComment(''); };
  const openCreate = () => { resetForm(); setMode('edit'); };
  const openEdit = (r: Reminder) => { setEditingId(r.id); setTitle(r.title); setInterval(r.interval); setComment(r.comment ?? ''); setMode('edit'); };
  const save = () => {
    if (!title.trim()) return;
    Keyboard.dismiss();
    if (editingId) {
      setItems(prev => prev.map(r => (r.id === editingId ? { ...r, title: title.trim(), comment: comment.trim(), interval } : r)));
    } else {
      const id = Math.random().toString(36).slice(2, 10);
      setItems(prev => [...prev, { id, title: title.trim(), comment: comment.trim(), interval, createdAt: Date.now() }]);
    }
    setMode('list'); resetForm();
  };
  const daysLeft = (r: Reminder) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const passed = Math.floor((Date.now() - r.createdAt) / oneDay);
    return Math.max(0, r.interval - passed);
  };
  const leftLabel = (n: number) => (n === 0 ? 'today to change' : `${n} ${n === 1 ? 'day' : 'days'} to change`);
  const remove = (id: string, titleForAlert: string) =>
    Alert.alert('Delete reminder?', `Are you sure want to delete "${titleForAlert}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setItems(prev => prev.filter(r => r.id !== id)) },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: contOpacity,
          transform: [
            { perspective: 800 }, { translateX: contX },
            { rotateY: contTilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-12deg'] }) },
            { scale: contScale },
          ],
        }}
      >
        {mode === 'edit' ? (
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            keyboardVerticalOffset={insets.top + Math.round(8 * SZ) + TOP_DELTA}
            style={{ flex: 1 }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <ScrollView
                contentContainerStyle={{
                  paddingTop: topPad,
                  paddingHorizontal: Math.round(16 * SZ),
                  paddingBottom: blockerH + 24,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                automaticallyAdjustKeyboardInsets
                contentInsetAdjustmentBehavior="always"
              >
                <Header title="New reminder" showBack onBack={() => { setMode('list'); resetForm(); Keyboard.dismiss(); }} />

                <Text style={s.label}>Title (service/website):</Text>
                <TextInput
                  placeholder="Title..." placeholderTextColor={C.white60}
                  value={title} onChangeText={setTitle} style={s.input}
                  returnKeyType="done" blurOnSubmit onSubmitEditing={Keyboard.dismiss}
                  autoCorrect={false} autoCapitalize="none"
                />

                <Text style={[s.label, { marginTop: 12 * SZ }]}>Reminder interval:</Text>
                <View style={s.chipsRow}>
                  {[10, 30, 60].map((d) => {
                    const active = interval === d;
                    return (
                      <Pressable key={d} onPress={() => setInterval(d as Interval)} style={[s.chip, active && s.chipActive]}>
                        <Text style={[s.chipTxt, active && { color: C.bg }]}>{d} days</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[s.label, { marginTop: 12 * SZ }]}>Comment (optional):</Text>
                <TextInput
                  placeholder="Comment..." placeholderTextColor={C.white60}
                  value={comment} onChangeText={setComment} style={[s.input, { height: Math.round(48 * SZ) }]}
                  returnKeyType="done" blurOnSubmit onSubmitEditing={Keyboard.dismiss}
                  autoCorrect={false} autoCapitalize="sentences"
                />

                <Pressable onPress={save} style={[s.bigBtn, !title.trim() && { opacity: 0.6 }]} disabled={!title.trim()}>
                  <Text style={[s.bigBtnTxt, { color: C.bg }]}>Save reminder</Text>
                </Pressable>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingTop: topPad,
              paddingHorizontal: Math.round(16 * SZ),
              paddingBottom: blockerH + 24,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            <Header title="My reminders" showBack={false} />

            {items.length === 0 ? (
              <>
                <EmptyState />
                <Pressable style={s.bigBtn} onPress={openCreate}>
                  <Text style={[s.bigBtnTxt, { color: C.bg }]}>Add new reminder</Text>
                </Pressable>
              </>
            ) : (
              <>
                {items.slice().sort((a, b) => daysLeft(a) - daysLeft(b)).map((r) => {
                  const left = daysLeft(r);
                  return (
                    <View key={r.id} style={[s.card, { marginBottom: 12 * SZ }]}>
                      <Text style={s.itemTitle} numberOfLines={1}>{r.title}</Text>
                      {!!r.comment && <Text style={s.itemComment} numberOfLines={1}>{r.comment}</Text>}
                      <View style={s.itemFooter}>
                        <View style={s.leftPill}>
                          <Text style={{ color: C.white, fontWeight: '700', fontSize: fs(13) }}>{leftLabel(left)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 * SZ }}>
                          <IconBtn label="✎" onPress={() => openEdit(r)} />
                          <IconBtn label="🗑" danger onPress={() => remove(r.id, r.title)} />
                        </View>
                      </View>
                    </View>
                  );
                })}
                <Pressable style={[s.bigBtn, { marginTop: 6 * SZ }]} onPress={openCreate}>
                  <Text style={[s.bigBtnTxt, { color: C.bg }]}>Add new reminder</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        )}
      </Animated.View>

      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: blockerH, backgroundColor: C.bg }} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topRow: {
    paddingTop: 8 * SZ, paddingBottom: 8 * SZ, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 36 * SZ, height: 36 * SZ, borderRadius: 18 * SZ,
    borderWidth: 1, borderColor: C.stroke, backgroundColor: C.chip,
    alignItems: 'center', justifyContent: 'center', marginLeft: 4 * SZ,
  },
  headerPill: {
    flex: 1, height: 42 * SZ, marginHorizontal: 8 * SZ, borderRadius: 21 * SZ,
    backgroundColor: '#940F22', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.stroke,
  },
  headerPillTxt: { color: C.white, fontWeight: '800', fontSize: fs(15) },

  card: {
    backgroundColor: C.card, borderRadius: 18 * SZ, borderWidth: 1, borderColor: C.stroke,
    padding: 14 * SZ, marginTop: 10 * SZ,
  },
  emptyArt: {
    height: (isSmall ? 170 : 190) * SZ, borderRadius: 14 * SZ,
    backgroundColor: '#C6021E', alignItems: 'center', justifyContent: 'center',
  },
  cardTxt: { color: C.white80, lineHeight: fs(19), fontSize: fs(13) },

  itemTitle: { color: C.white, fontWeight: '800', fontSize: fs(16) },
  itemComment: { marginTop: 2 * SZ, color: C.white80, fontSize: fs(13) },
  itemFooter: { marginTop: 10 * SZ, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftPill: {
    height: 32 * SZ, paddingHorizontal: 12 * SZ, borderRadius: 16 * SZ,
    backgroundColor: C.pill, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.stroke,
  },

  label: { color: C.white, fontWeight: '700', marginTop: 8 * SZ, marginBottom: 6 * SZ, fontSize: fs(13) },
  input: {
    height: 44 * SZ, borderRadius: 12 * SZ, paddingHorizontal: 12 * SZ,
    color: C.white, backgroundColor: C.field, borderWidth: 1, borderColor: C.stroke, fontSize: fs(14),
  },
  chipsRow: { flexDirection: 'row', gap: 10 * SZ },
  chip: {
    height: 34 * SZ, paddingHorizontal: 14 * SZ, borderRadius: 17 * SZ,
    backgroundColor: C.chip, borderWidth: 1, borderColor: C.stroke, alignItems: 'center', justifyContent: 'center',
  },
  chipActive: { backgroundColor: C.white, borderColor: C.white },
  chipTxt: { color: C.white, fontWeight: '700', fontSize: fs(13) },

  bigBtn: {
    marginTop: 14 * SZ, height: 56 * SZ, borderRadius: 28 * SZ,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
  },
  bigBtnTxt: { fontSize: fs(16), fontWeight: '800' },
});