import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeroSection from './HeroSection';

export default function HomeScreen({ user, onNavigateWorkout, onNavigateProfile }) {
  // L'utente è atleta se ha ruolo 'utente_atleta' o 'entrambi', oppure se non è loggato
  const isAtleta = !user || user.ruolo === 'utente_atleta' || user.ruolo === 'entrambi' || (!user.ruolo && !user.isPt);
  
  // Verifica se l'atleta ha uno o più personal trainer attivi
  const personalTrainers = user?.personalTrainers || [];
  const haPersonalTrainerAttivo = Boolean(user?.haPersonalTrainerAttivo || personalTrainers.length > 0);

  // CASO 1: L'utente atleta NON ha nessun personal trainer attivo (oppure è un visitatore/non registrato)
  if (isAtleta && !haPersonalTrainerAttivo) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
        {/* Scritta Hero / Banner */}
        <HeroSection />

        {/* Card di invito / spiegazione */}
        <View className="mx-5 my-2 p-5 bg-[#16161A] border border-borderDark/60 rounded-3xl">
          <View className="w-12 h-12 rounded-2xl bg-[#FEB32F]/15 border border-[#FEB32F]/30 justify-center items-center mb-3">
            <Ionicons name="sparkles" size={24} color="#FEB32F" />
          </View>
          <Text className="text-white text-lg font-bold">Raggiungi i tuoi obiettivi</Text>
          <Text className="text-zinc-400 text-sm mt-1 leading-5">
            Non hai ancora un Personal Trainer associato. Affidati a un professionista certificato per schede personalizzate e monitoraggio costante.
          </Text>
        </View>

        {/* Placeholder elenco trainer (pronto per integrazione con lista PT disponibili) */}
        <View className="flex-1 justify-center items-center px-6 mt-8 py-6">
          <Ionicons name="people-outline" size={52} color="#303038" className="mb-3" />
          <Text className="text-zinc-400 font-bold text-base text-center">Nessun personal trainer disponibile</Text>
          <Text className="text-zinc-600 text-xs text-center mt-1">Presto troverai qui i migliori professionisti certificati della tua zona.</Text>
        </View>
      </ScrollView>
    );
  }

  // CASO 2: L'utente atleta HA uno o più personal trainer attivi
  if (isAtleta && haPersonalTrainerAttivo) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
        <View className="mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Il tuo percorso</Text>
          <Text className="text-2xl font-black text-white">I tuoi Personal Trainer</Text>
        </View>

        {personalTrainers.map((pt, index) => (
          <View 
            key={pt.id || index}
            className="bg-[#16161A] border border-borderDark/60 rounded-2xl p-4 mb-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-14 h-14 rounded-full bg-[#1E1E24] border border-[#2A2A32] justify-center items-center overflow-hidden mr-3.5">
                {pt.urlImmagineProfilo ? (
                  <Image source={{ uri: pt.urlImmagineProfilo }} className="w-full h-full" />
                ) : (
                  <Ionicons name="person" size={28} color="#A1A1AA" />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-white text-base font-bold" numberOfLines={1}>{pt.nome} {pt.cognome}</Text>
                  {pt.verificato && (
                    <Ionicons name="checkmark-circle" size={16} color="#FFB430" />
                  )}
                </View>
                <Text className="text-zinc-400 text-xs mt-0.5">Personal Trainer attivo</Text>
              </View>
            </View>

            <View className="bg-[#FEB32F]/15 px-3 py-1.5 rounded-xl border border-[#FEB32F]/30">
              <Text className="text-[#FEB32F] text-xs font-bold">Seguito</Text>
            </View>
          </View>
        ))}

        {/* Card rapida per accedere alle schede */}
        <TouchableOpacity 
          className="bg-[#18181C] border border-[#282830] rounded-2xl p-5 mt-2 flex-row items-center justify-between"
          activeOpacity={0.7}
          onPress={onNavigateWorkout}
        >
          <View className="flex-1 mr-3">
            <Text className="text-white font-bold text-base">Le tue schede di allenamento</Text>
            <Text className="text-zinc-400 text-xs mt-1">Consulta gli esercizi e i piani creati dal tuo trainer</Text>
          </View>
          <View className="w-10 h-10 rounded-xl bg-[#222228] justify-center items-center">
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // CASO 3: Utente PT o Admin
  return (
    <View className="flex-1 justify-center items-center px-6">
      <Ionicons name="fitness-outline" size={56} color="#303038" className="mb-3" />
      <Text className="text-zinc-400 font-bold text-base text-center">Home Personal Trainer</Text>
      <Text className="text-zinc-600 text-xs text-center mt-1">Benvenuto in Rector, gestisci i tuoi atleti e le schede.</Text>
    </View>
  );
}
