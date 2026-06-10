import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TrainerCard({ trainer }) {
  return (
    <TouchableOpacity className="flex-row bg-cardDark mx-5 mb-4 rounded-2xl p-3 border border-borderDark" activeOpacity={0.95}>
      <Image source={{ uri: trainer.avatar }} className="w-20 h-20 rounded-xl bg-zinc-800" />
      <View className="flex-1 ml-3.5 justify-between">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-bold text-white">{trainer.name}</Text>
          <View className="flex-row items-center bg-zinc-800 px-1.5 py-0.5 rounded-lg">
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text className="text-white text-xs font-bold ml-1">{trainer.rating}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap mt-1.5">
          {trainer.specialties.map((spec, idx) => (
            <View key={idx} className="bg-zinc-900 px-2 py-0.5 rounded-md mr-1.5 mb-1">
              <Text className="text-zinc-400 text-[11px] font-medium">{spec}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-zinc-500 text-xs">
            da <Text className="text-accentCyan text-base font-bold">{trainer.price}€</Text>/ora
          </Text>
          <View className="flex-row items-center bg-accentPink py-1.5 px-3 rounded-lg">
            <Text className="text-white text-xs font-bold mr-1">Profilo</Text>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
