import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export default function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[s.card, { opacity: anim }]}>
      <View style={s.row}>
        <View style={s.avatar} />
        <View style={s.info}>
          <View style={s.line} />
          <View style={[s.line, { width: '60%', marginTop: 6 }]} />
          <View style={[s.line, { width: '40%', marginTop: 6 }]} />
        </View>
        <View style={s.price} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card:   { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E8E8E8' },
  info:   { flex: 1 },
  line:   { height: 12, backgroundColor: '#E8E8E8', borderRadius: 6, width: '80%' },
  price:  { width: 60, height: 36, backgroundColor: '#E8E8E8', borderRadius: 8 },
});
