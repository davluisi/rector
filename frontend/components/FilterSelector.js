import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';

export default function FilterSelector({ filters, selectedFilter, onSelectFilter }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4 pl-5"
      contentContainerStyle={{ paddingRight: 40 }}
    >
      {filters.map((filter) => {
        const isActive = selectedFilter === filter;
        return (
          <TouchableOpacity
            key={filter}
            onPress={() => onSelectFilter(filter)}
            className={`px-4 py-2 rounded-full mr-2 border ${
              isActive ? 'bg-accentPink border-accentPink' : 'bg-inputDark border-inputBorder'
            }`}
          >
            <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-zinc-400'}`}>
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
