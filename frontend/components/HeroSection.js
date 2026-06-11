import React from 'react';
import { View, Text } from 'react-native';

export default function HeroSection() {
  return (
    <View className="px-5 pt-6 pb-4">
      <Text className="text-[28px] font-extrabold text-white tracking-tight">Trova il personal trainer</Text>
      <Text className="text-3xl font-black text-accentCyan uppercase mt-0.5">più adatto a te</Text>
    </View>
  );
}
