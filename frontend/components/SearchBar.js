import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchBar({ value, onChangeText }) {
  return (
    <View className="flex-row items-center bg-inputDark mx-5 rounded-xl px-3 h-[50px] border border-inputBorder shadow-md">
      <Ionicons name="search-outline" size={20} color="#888" className="mr-2.5" />
      <TextInput
        placeholder="Cerca per nome, città o specialità..."
        placeholderTextColor="#888"
        className="flex-1 color-white text-[15px]"
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity className="p-1.5">
        <Ionicons name="options-outline" size={20} color="#FF2E93" />
      </TouchableOpacity>
    </View>
  );
}
