import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeroSection from './HeroSection';
import FilterModal from './FilterModal';
import { config } from '../config';

export default function HomeScreen({ user, onNavigateWorkout, onNavigateProfile }) {
  // L'utente è atleta se ha ruolo 'utente_atleta' o 'entrambi', oppure se non è loggato
  const isAtleta = !user || user.ruolo === 'utente_atleta' || user.ruolo === 'entrambi' || (!user.ruolo && !user.isPt);
  
  // Verifica se l'atleta ha uno o più personal trainer attivi
  const personalTrainers = user?.personalTrainers || [];
  const haPersonalTrainerAttivo = Boolean(user?.haPersonalTrainerAttivo || personalTrainers.length > 0);

  // Lista di tutti i PT verificati presenti nel DB
  const [ptVerificati, setPtVerificati] = useState([]);
  const [loadingPt, setLoadingPt] = useState(true);

  // Catalogo specializzazioni
  const [specializzazioni, setSpecializzazioni] = useState([]);
  
  // Stati filtri
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedSpecializzazioneIds, setSelectedSpecializzazioneIds] = useState([]);
  const [etaMin, setEtaMin] = useState(null);
  const [etaMax, setEtaMax] = useState(null);

  // Caricamento catalogo specializzazioni una volta sola
  useEffect(() => {
    fetch(`${config.apiUrl}/api/auth/specializzazioni`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSpecializzazioni(data);
        }
      })
      .catch(err => {
        console.error('[HomeScreen] Errore caricamento specializzazioni:', err);
      });
  }, []);

  // Fetch dei personal trainer con filtri applicati
  const fetchPt = useCallback(() => {
    if (!isAtleta || haPersonalTrainerAttivo) return;

    setLoadingPt(true);
    const queryParams = new URLSearchParams();
    if (selectedSpecializzazioneIds && selectedSpecializzazioneIds.length > 0) {
      selectedSpecializzazioneIds.forEach(id => {
        queryParams.append('specializzazioneIds', id);
      });
    }
    if (etaMin !== null && etaMin !== undefined && etaMin !== '') queryParams.append('etaMin', etaMin);
    if (etaMax !== null && etaMax !== undefined && etaMax !== '') queryParams.append('etaMax', etaMax);

    const url = `${config.apiUrl}/api/auth/personal-trainers/verificati${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Errore durante il recupero dei personal trainer');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPtVerificati(data);
        }
      })
      .catch((err) => {
        console.error('[HomeScreen] Errore caricamento PT verificati:', err);
      })
      .finally(() => {
        setLoadingPt(false);
      });
  }, [isAtleta, haPersonalTrainerAttivo, selectedSpecializzazioneIds, etaMin, etaMax]);

  useEffect(() => {
    fetchPt();
  }, [fetchPt]);

  const hasActiveFilters = Boolean((selectedSpecializzazioneIds && selectedSpecializzazioneIds.length > 0) || etaMin || etaMax);

  // CASO 1: L'utente atleta NON ha nessun personal trainer attivo (oppure è un visitatore/non registrato)
  if (isAtleta && !haPersonalTrainerAttivo) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
        {/* Testata Hero con Icona Filtra affiancata in alto */}
        <View className="px-5 pt-4 pb-1 flex-row items-end justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-2xl font-extrabold text-white tracking-tight">Trova il personal trainer</Text>
            <Text className="text-[26px] font-black text-accentCyan uppercase mt-0.5">più adatto a te</Text>
          </View>

          {/* Icona Classica Filtra */}
          <TouchableOpacity
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.7}
            className={`w-11 h-11 rounded-2xl border justify-center items-center relative mb-1 ${
              hasActiveFilters 
                ? 'bg-[#FEB32F]/20 border-[#FEB32F]' 
                : 'bg-[#16161A] border-borderDark/60'
            }`}
          >
            <Ionicons 
              name="options-outline" 
              size={20} 
              color={hasActiveFilters ? '#FEB32F' : '#A1A1AA'} 
            />
            {hasActiveFilters && (
              <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FEB32F]" />
            )}
          </TouchableOpacity>
        </View>

        {loadingPt ? (
          <View className="py-8 justify-center items-center">
            <ActivityIndicator size="small" color="#FEB32F" />
            <Text className="text-zinc-500 text-xs mt-3">Caricamento personal trainer...</Text>
          </View>
        ) : ptVerificati.length > 0 ? (
          <View className="px-5 mt-2">
            {ptVerificati.map((pt, index) => (
              <View 
                key={pt.id || pt.idUtente || index}
                className="bg-[#16161A] border border-borderDark/60 rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-14 h-14 rounded-full bg-[#1E1E24] border border-[#2A2A34] justify-center items-center overflow-hidden mr-3.5">
                      {pt.urlImmagineProfilo ? (
                        <Image source={{ uri: pt.urlImmagineProfilo }} className="w-full h-full" />
                      ) : (
                        <Ionicons name="person" size={26} color="#A1A1AA" />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-white text-base font-bold" numberOfLines={1}>
                          {pt.nome} {pt.cognome}
                        </Text>
                        <Ionicons name="checkmark-circle" size={16} color="#FFB430" />
                      </View>
                      <Text className="text-zinc-400 text-xs mt-0.5">
                        {pt.eta !== null && pt.eta !== undefined ? `${pt.eta} anni` : 'Età non specificata'}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-[#1F1F26] border border-[#2C2C36] px-3 py-1.5 rounded-xl">
                    <Text className="text-zinc-300 text-xs font-semibold">Disponibile</Text>
                  </View>
                </View>

                {/* Badge Specializzazioni del PT */}
                {Array.isArray(pt.specializzazioni) && pt.specializzazioni.length > 0 && (
                  <View className="flex-row flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#222228]">
                    {pt.specializzazioni.map((spec) => (
                      <View 
                        key={spec.id} 
                        className="bg-[#1E1E24] border border-[#2D2D38] px-2.5 py-1 rounded-lg"
                      >
                        <Text className="text-zinc-400 text-[11px] font-medium">{spec.nome}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          /* Placeholder se non ci sono PT verificati nel DB o se i filtri non restituiscono risultati */
          <View className="flex-1 justify-center items-center px-6 mt-4 py-8">
            <Ionicons name="people-outline" size={52} color="#303038" className="mb-3" />
            <Text className="text-zinc-400 font-bold text-base text-center">
              {hasActiveFilters ? 'Nessun risultato' : 'Nessun personal trainer disponibile'}
            </Text>
            <Text className="text-zinc-600 text-xs text-center mt-1">
              {hasActiveFilters ? 'Prova a modificare i criteri di ricerca' : 'Presto troverai qui i migliori professionisti certificati della tua zona.'}
            </Text>
          </View>
        )}

        {/* Modal dei Filtri */}
        <FilterModal
          visible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          specializzazioni={specializzazioni}
          selectedSpecializzazioneIds={selectedSpecializzazioneIds}
          etaMin={etaMin}
          etaMax={etaMax}
          onApply={({ specializzazioneIds, etaMin, etaMax }) => {
            setSelectedSpecializzazioneIds(specializzazioneIds || []);
            setEtaMin(etaMin);
            setEtaMax(etaMax);
          }}
          onReset={() => {
            setSelectedSpecializzazioneIds([]);
            setEtaMin(null);
            setEtaMax(null);
          }}
        />
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
