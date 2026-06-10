import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ user, onLogout }) {
  if (!user) return null;

  return (
    <View className="flex-1 bg-premiumDark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
      >
        {/* Title */}
        <View className="mb-8">
          <Text className="text-3xl font-extrabold text-white tracking-tight">Profilo</Text>
        </View>

        {/* User Card */}
        <View className="items-center bg-[#16161A]/60 border border-borderDark/40 rounded-3xl p-6 mb-6">
          <View className="w-24 h-24 rounded-full bg-[#1E1E24] border-2 border-accentCyan justify-center items-center overflow-hidden mb-4 shadow-lg shadow-accentCyan/10">
            {user.urlImmagineProfilo ? (
              <Image source={{ uri: user.urlImmagineProfilo }} className="w-full h-full" />
            ) : (
              <Ionicons name="person" size={48} color="#A1A1AA" />
            )}
          </View>
          <Text className="text-white text-xl font-bold">{user.nome} {user.cognome}</Text>
          <Text className="text-zinc-400 text-sm mt-1">{user.email}</Text>
        </View>

        {/* Physical Stats Section (Optional) */}
        {(user.peso || user.altezza || user.genere) && (
          <View className="border border-borderDark/50 bg-[#16161A]/40 rounded-3xl p-5 mb-6">
            <Text className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-4">Informazioni Fisiche</Text>
            
            <View className="flex-row justify-between gap-3">
              {user.peso && (
                <View className="flex-1 bg-inputDark border border-inputBorder rounded-2xl p-4 items-center">
                  <Ionicons name="fitness-outline" size={20} color="#00F0FF" className="mb-1" />
                  <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Peso</Text>
                  <Text className="text-white text-base font-bold">{user.peso} kg</Text>
                </View>
              )}
              {user.altezza && (
                <View className="flex-1 bg-inputDark border border-inputBorder rounded-2xl p-4 items-center">
                  <Ionicons name="resize-outline" size={20} color="#00F0FF" className="mb-1" />
                  <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Altezza</Text>
                  <Text className="text-white text-base font-bold">{user.altezza} cm</Text>
                </View>
              )}
              {user.genere && (
                <View className="flex-1 bg-inputDark border border-inputBorder rounded-2xl p-4 items-center">
                  <Ionicons name="people-outline" size={20} color="#00F0FF" className="mb-1" />
                  <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Genere</Text>
                  <Text className="text-white text-sm font-bold capitalize">
                    {user.genere.toLowerCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Account Settings / Actions */}
        <View className="bg-inputDark border border-inputBorder rounded-3xl overflow-hidden mb-6">
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-b border-borderDark"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-xl bg-[#24242C] items-center justify-center">
                <Ionicons name="create-outline" size={18} color="#00F0FF" />
              </View>
              <Text className="text-zinc-300 text-sm font-semibold">Modifica Profilo</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#71717A" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center justify-between p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-xl bg-[#24242C] items-center justify-center">
                <Ionicons name="lock-closed-outline" size={18} color="#00F0FF" />
              </View>
              <Text className="text-zinc-300 text-sm font-semibold">Sicurezza Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#71717A" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          className="bg-accentPink/10 border border-accentPink/20 h-12 rounded-xl justify-center items-center flex-row gap-2"
          activeOpacity={0.8}
          onPress={onLogout}
        >
          <Ionicons name="log-out" size={18} color="#FF2E93" />
          <Text className="text-accentPink text-[15px] font-bold">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
