import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeroSection from './HeroSection';
import FilterModal from './FilterModal';
import RatingStars from './RatingStars';
import ReviewModal from './ReviewModal';
import PtDetailScreen from './PtDetailScreen';
import GestioneAbbonamentoScreen from './GestioneAbbonamentoScreen';
import { config } from '../config';

export default function HomeScreen({ 
  user, 
  activeHomeRole, 
  selectedPt, 
  onSelectPt, 
  selectedAbbonamentoPt,
  onSelectAbbonamentoPt,
  onNavigateWorkout, 
  onNavigateProfile, 
  onUpdateUser 
}) {
  // Se l'utente ha ruolo 'entrambi', la vista attiva è determinata da activeHomeRole ('pt' o 'atleta')
  // Altrimenti, se non ha entrambi i ruoli, è atleta se 'utente_atleta' o se non è loggato
  const isAtleta = user?.ruolo === 'entrambi'
    ? activeHomeRole === 'atleta'
    : (!user || user.ruolo === 'utente_atleta' || (!user.ruolo && !user.isPt));
  
  // Lista dei PT attivi dell'atleta
  const initialPtList = user?.personalTrainers || [];
  const [activeTrainers, setActiveTrainers] = useState(initialPtList);
  const haPersonalTrainerAttivo = Boolean(user?.haPersonalTrainerAttivo || activeTrainers.length > 0);

  // Sincronizza lo stato dei trainer attivi se il prop user cambia
  useEffect(() => {
    if (user?.personalTrainers) {
      setActiveTrainers(user.personalTrainers);
    }
  }, [user?.personalTrainers]);

  // Se l'atleta ha PT attivi, controlla se ha cliccato "vedi altri" per esplorare tutti i trainer
  const [showAllTrainers, setShowAllTrainers] = useState(false);

  // Lista di tutti i PT verificati presenti nel DB
  const [ptVerificati, setPtVerificati] = useState([]);
  const [loadingPt, setLoadingPt] = useState(isAtleta);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const loadingTimerRef = useRef(null);
  const [haEffettuatoPrimoCaricamento, setHaEffettuatoPrimoCaricamento] = useState(false);

  // Ricerca testuale per nome e/o cognome
  const [searchQuery, setSearchQuery] = useState('');

  // Catalogo specializzazioni
  const [specializzazioni, setSpecializzazioni] = useState([]);
  
  // Stati filtri
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedSpecializzazioneIds, setSelectedSpecializzazioneIds] = useState([]);
  const [etaMin, setEtaMin] = useState(null);
  const [etaMax, setEtaMax] = useState(null);

  // Stato Modale Recensione
  const [reviewModalTrainer, setReviewModalTrainer] = useState(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);

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
    // Carica se atleta senza PT o se ha espanso la vista con "vedi altri"
    if (!isAtleta) return;
    if (haPersonalTrainerAttivo && !showAllTrainers) return;

    setLoadingPt(true);
    setShowLoadingIndicator(false);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      setShowLoadingIndicator(true);
    }, 3000);

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
        if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
        setLoadingPt(false);
        setShowLoadingIndicator(false);
        setHaEffettuatoPrimoCaricamento(true);
      });
  }, [isAtleta, haPersonalTrainerAttivo, showAllTrainers, selectedSpecializzazioneIds, etaMin, etaMax]);

  useEffect(() => {
    fetchPt();
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [fetchPt]);

  const hasActiveFilters = Boolean((selectedSpecializzazioneIds && selectedSpecializzazioneIds.length > 0) || etaMin || etaMax);

  // Callback al salvataggio di una recensione: aggiorna la media locale sia in activeTrainers sia in ptVerificati
  const handleReviewSaved = ({ trainerId, mediaStelle, numeroRecensioni }) => {
    if (mediaStelle !== undefined) {
      setActiveTrainers(prev => prev.map(t => {
        if ((t.id || t.idUtente) === trainerId) {
          return { ...t, mediaStelle, numeroRecensioni };
        }
        return t;
      }));

      setPtVerificati(prev => prev.map(t => {
        if ((t.id || t.idUtente) === trainerId) {
          return { ...t, mediaStelle, numeroRecensioni };
        }
        return t;
      }));
    }
  };

  // Filtraggio locale dei PT verificati tramite searchQuery (nome, cognome, o nome + cognome)
  const filteredPtVerificati = ptVerificati.filter((pt) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const nome = (pt.nome || '').toLowerCase();
    const cognome = (pt.cognome || '').toLowerCase();
    const fullName1 = `${nome} ${cognome}`.trim();
    const fullName2 = `${cognome} ${nome}`.trim();

    return nome.includes(q) || cognome.includes(q) || fullName1.includes(q) || fullName2.includes(q);
  });

  // Se l'utente ha cliccato su "Abbonamento", mostra la pagina per gestire l'abbonamento
  if (selectedAbbonamentoPt) {
    return (
      <GestioneAbbonamentoScreen
        trainer={selectedAbbonamentoPt}
        user={user}
        onBack={() => onSelectAbbonamentoPt && onSelectAbbonamentoPt(null)}
        onSubscriptionCancelled={(updatedUser) => {
          if (onUpdateUser && updatedUser) {
            onUpdateUser(updatedUser);
          }
          if (updatedUser?.personalTrainers) {
            setActiveTrainers(updatedUser.personalTrainers);
          }
          if (onSelectAbbonamentoPt) {
            onSelectAbbonamentoPt(null);
          }
        }}
      />
    );
  }

  // Se l'utente ha cliccato su un PT, mostra la pagina di dettaglio del PT
  if (selectedPt) {
    const ptTargetId = selectedPt.id || selectedPt.idUtente;
    return (
      <PtDetailScreen
        ptId={ptTargetId}
        user={user}
        onBack={() => onSelectPt && onSelectPt(null)}
        onSubscriptionSuccess={(updatedUser) => {
          if (onUpdateUser && updatedUser) {
            onUpdateUser(updatedUser);
          }
          if (updatedUser?.personalTrainers) {
            setActiveTrainers(updatedUser.personalTrainers);
          }
          if (onSelectPt) {
            onSelectPt(null);
          }
        }}
      />
    );
  }

  // CASO 1: L'utente atleta NON ha nessun personal trainer attivo (oppure è un visitatore/non registrato)
  if (isAtleta && !haPersonalTrainerAttivo) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
        {/* Testata Hero */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-extrabold text-white tracking-tight">Trova il personal trainer</Text>
          <Text className="text-[26px] font-black text-accentCyan uppercase mt-0.5">più adatto a te</Text>
        </View>

        {/* Barra di Ricerca affiancata al Tasto Filtri */}
        <View className="px-5 mt-3 mb-3 flex-row items-center gap-2.5">
          {/* Input di ricerca per nome e/o cognome */}
          <View className="flex-1 flex-row items-center bg-[#16161A] border border-borderDark/60 rounded-2xl px-3.5 py-2.5 h-12">
            <Ionicons name="search" size={18} color="#71717A" />
            <TextInput
              placeholder="Cerca per nome o cognome..."
              placeholderTextColor="#71717A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-sm ml-2.5 p-0"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                <Ionicons name="close-circle" size={16} color="#71717A" />
              </TouchableOpacity>
            )}
          </View>

          {/* Icona Classica Filtra */}
          <TouchableOpacity
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.7}
            className={`w-12 h-12 rounded-2xl border justify-center items-center relative ${
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
              <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#FEB32F]" />
            )}
          </TouchableOpacity>
        </View>

        {showLoadingIndicator ? (
          <View className="py-8 justify-center items-center">
            <ActivityIndicator size="small" color="#FEB32F" />
            <Text className="text-zinc-500 text-xs mt-3">Caricamento personal trainer...</Text>
          </View>
        ) : filteredPtVerificati.length > 0 ? (
          <View className="px-5 mt-1">
            {filteredPtVerificati.map((pt, index) => {
              const specializzazioneVetrina = (pt.specializzazioneInEvidenza && pt.specializzazioneInEvidenza.nome)
                ? pt.specializzazioneInEvidenza.nome
                : (Array.isArray(pt.specializzazioni) && pt.specializzazioni.length > 0 ? pt.specializzazioni[0].nome : null);

              return (
                <TouchableOpacity 
                  key={pt.id || pt.idUtente || index}
                  activeOpacity={0.75}
                  onPress={() => onSelectPt && onSelectPt(pt)}
                  className="bg-[#16161A] border border-borderDark/60 rounded-2xl p-4 mb-3 relative"
                >
                  <View className="flex-row items-start">
                    {/* Immagine Profilo */}
                    <View className="w-14 h-14 rounded-full bg-[#1E1E24] border border-[#2A2A34] justify-center items-center overflow-hidden mr-3.5">
                      {pt.urlImmagineProfilo ? (
                        <Image source={{ uri: pt.urlImmagineProfilo }} className="w-full h-full" />
                      ) : (
                        <Ionicons name="person" size={26} color="#A1A1AA" />
                      )}
                    </View>

                    {/* Testi a sinistra: Nome in alto a sx, Specialità in evidenza sotto */}
                    <View className="flex-1 pr-24 pt-0.5">
                      <Text className="text-white text-base font-bold" numberOfLines={1}>
                        {pt.nome} {pt.cognome}
                      </Text>

                      {specializzazioneVetrina ? (
                        <Text className="text-[#FFB430] text-xs font-semibold mt-1" numberOfLines={1}>
                          {specializzazioneVetrina}
                        </Text>
                      ) : null}
                    </View>
                  </View>


                  {/* Stelle posizionate in alto a destra per allineamento verticale coerente */}
                  <View className="absolute top-4 right-4 items-end">
                    <RatingStars 
                      rating={pt.mediaStelle || 0} 
                      size={12} 
                      showValue={true} 
                      count={pt.numeroRecensioni} 
                    />
                  </View>

                  {/* Età in basso a destra della card */}
                  <View className="absolute bottom-3.5 right-4">
                    <Text className="text-zinc-500 text-xs font-medium">
                      {pt.eta !== null && pt.eta !== undefined ? `${pt.eta} anni` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : haEffettuatoPrimoCaricamento ? (
          /* Placeholder se non ci sono PT verificati nel DB o se i filtri non restituiscono risultati */
          <View className="flex-1 justify-center items-center px-6 mt-4 py-8">
            <Ionicons name="people-outline" size={52} color="#303038" className="mb-3" />
            <Text className="text-zinc-400 font-bold text-base text-center">
              {hasActiveFilters || searchQuery.trim().length > 0 ? 'Nessun risultato trovato' : 'Nessun personal trainer disponibile'}
            </Text>
            <Text className="text-zinc-600 text-xs text-center mt-1">
              {hasActiveFilters || searchQuery.trim().length > 0 ? 'Prova a modificare i criteri di ricerca' : 'Presto troverai qui i migliori professionisti certificati della tua zona.'}
            </Text>
          </View>
        ) : null}

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
    const isSingle = activeTrainers.length === 1;

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
        {/* Titolo singolare / plurale richiesto */}
        <View className="mb-5">
          <Text className="text-2xl font-black text-white">
            {isSingle ? 'Il tuo Personal Trainer' : 'I tuoi Personal Trainer'}
          </Text>
        </View>

        {/* Banner dettagli PT con tasti Abbonamento e Recensione */}
        {activeTrainers.map((pt, index) => (
          <View 
            key={pt.id || pt.idUtente || index}
            className="bg-[#16161A] border border-borderDark/60 rounded-3xl p-4 mb-4"
          >
            {/* Header Dettagli PT (Cliccabile per aprire la scheda di dettaglio) */}
            <TouchableOpacity 
              activeOpacity={0.75}
              onPress={() => onSelectPt && onSelectPt(pt)}
              className="flex-row items-center justify-between"
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
                  </View>

                  {/* Rating Stars con decimali precisi */}
                  <View className="mt-1">
                    <RatingStars 
                      rating={pt.mediaStelle || 0} 
                      size={13} 
                      showValue={true} 
                      count={pt.numeroRecensioni} 
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Pulsanti Azione: "Abbonamento" e "Recensione" */}
            <View className="flex-row gap-2.5 mt-4 pt-3 border-t border-[#222228]">
              {/* Pulsante Abbonamento */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onSelectAbbonamentoPt && onSelectAbbonamentoPt(pt)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1B1B22] border border-[#2D2D38] flex-row items-center justify-center gap-2"
              >
                <Ionicons name="card-outline" size={16} color="#FEB32F" />
                <Text className="text-zinc-300 text-xs font-semibold">Abbonamento</Text>
              </TouchableOpacity>

              {/* Pulsante Recensione */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setReviewModalTrainer(pt);
                  setIsReviewModalVisible(true);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#FEB32F]/15 border border-[#FEB32F]/35 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="star" size={16} color="#FEB32F" />
                <Text className="text-[#FEB32F] text-xs font-bold">Recensione</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Pulsante "Vedi altri" per estendere la lista di tutti i PT */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAllTrainers(!showAllTrainers)}
          className="bg-[#131317] border border-[#272730] py-3.5 px-4 rounded-2xl flex-row items-center justify-between mb-4"
        >
          <View className="flex-row items-center gap-2.5">
            <Ionicons name={showAllTrainers ? "people" : "people-outline"} size={20} color="#FEB32F" />
            <Text className="text-white font-bold text-sm">
              {showAllTrainers ? 'Nascondi altri trainer' : 'Vedi altri Personal Trainer'}
            </Text>
          </View>
          <Ionicons 
            name={showAllTrainers ? "chevron-up" : "chevron-down"} 
            size={18} 
            color="#A1A1AA" 
          />
        </TouchableOpacity>

        {/* Sezione estesa "Vedi altri" con filtri e lista completa dei PT */}
        {showAllTrainers && (
          <View className="mt-1">
            {/* Barra di Ricerca affiancata al Tasto Filtri nella lista estesa */}
            <View className="mb-3 flex-row items-center gap-2.5">
              <View className="flex-1 flex-row items-center bg-[#16161A] border border-borderDark/60 rounded-2xl px-3.5 py-2.5 h-11">
                <Ionicons name="search" size={16} color="#71717A" />
                <TextInput
                  placeholder="Cerca per nome o cognome..."
                  placeholderTextColor="#71717A"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 text-white text-xs ml-2 p-0"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                    <Ionicons name="close-circle" size={15} color="#71717A" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Tasto Filtra per la lista estesa */}
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(true)}
                activeOpacity={0.7}
                className={`w-11 h-11 rounded-2xl border justify-center items-center relative ${
                  hasActiveFilters 
                    ? 'bg-[#FEB32F]/20 border-[#FEB32F]' 
                    : 'bg-[#16161A] border-borderDark/60'
                }`}
              >
                <Ionicons 
                  name="options-outline" 
                  size={18} 
                  color={hasActiveFilters ? '#FEB32F' : '#A1A1AA'} 
                />
                {hasActiveFilters && (
                  <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FEB32F]" />
                )}
              </TouchableOpacity>
            </View>

            {showLoadingIndicator ? (
              <View className="py-8 justify-center items-center">
                <ActivityIndicator size="small" color="#FEB32F" />
                <Text className="text-zinc-500 text-xs mt-3">Caricamento trainer...</Text>
              </View>
            ) : (() => {
              // Escludi i personal trainer a cui l'atleta è già abbonato/attivo
              const activeIds = new Set(
                (activeTrainers || []).map(t => t.id || t.idUtente)
              );
              const otherTrainers = filteredPtVerificati.filter(
                pt => !activeIds.has(pt.id || pt.idUtente)
              );

              if (otherTrainers.length === 0) {
                return (
                  <View className="py-6 justify-center items-center">
                    <Text className="text-zinc-500 text-xs text-center">Nessun altro personal trainer trovato.</Text>
                  </View>
                );
              }

              return (
                <View>
                  {otherTrainers.map((pt, index) => {
                    const specializzazioneVetrina = (pt.specializzazioneInEvidenza && pt.specializzazioneInEvidenza.nome)
                      ? pt.specializzazioneInEvidenza.nome
                      : (Array.isArray(pt.specializzazioni) && pt.specializzazioni.length > 0 ? pt.specializzazioni[0].nome : null);

                    return (
                      <TouchableOpacity 
                        key={pt.id || pt.idUtente || index}
                        activeOpacity={0.75}
                        onPress={() => onSelectPt && onSelectPt(pt)}
                        className="bg-[#16161A] border border-borderDark/60 rounded-2xl p-4 mb-3 relative"
                      >
                      <View className="flex-row items-start">
                        {/* Immagine Profilo */}
                        <View className="w-14 h-14 rounded-full bg-[#1E1E24] border border-[#2A2A34] justify-center items-center overflow-hidden mr-3.5">
                          {pt.urlImmagineProfilo ? (
                            <Image source={{ uri: pt.urlImmagineProfilo }} className="w-full h-full" />
                          ) : (
                            <Ionicons name="person" size={26} color="#A1A1AA" />
                          )}
                        </View>

                        {/* Testi a sinistra: Nome in alto a sx, Specialità in evidenza sotto */}
                        <View className="flex-1 pr-24 pt-0.5">
                          <Text className="text-white text-base font-bold" numberOfLines={1}>
                            {pt.nome} {pt.cognome}
                          </Text>

                          {specializzazioneVetrina ? (
                            <Text className="text-[#FFB430] text-xs font-semibold mt-1" numberOfLines={1}>
                              {specializzazioneVetrina}
                            </Text>
                          ) : null}
                        </View>
                      </View>


                      {/* Stelle posizionate in alto a destra per allineamento verticale coerente */}
                      <View className="absolute top-4 right-4 items-end">
                        <RatingStars 
                          rating={pt.mediaStelle || 0} 
                          size={12} 
                          showValue={true} 
                          count={pt.numeroRecensioni} 
                        />
                      </View>

                      {/* Età in basso a destra della card */}
                      <View className="absolute bottom-3.5 right-4">
                        <Text className="text-zinc-500 text-xs font-medium">
                          {pt.eta !== null && pt.eta !== undefined ? `${pt.eta} anni` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })()}
          </View>
        )}

        {/* Modal Recensione */}
        <ReviewModal
          visible={isReviewModalVisible}
          onClose={() => {
            setIsReviewModalVisible(false);
            setReviewModalTrainer(null);
          }}
          trainer={reviewModalTrainer}
          currentUser={user}
          onReviewSaved={handleReviewSaved}
        />

        {/* Modal dei Filtri per la lista estesa */}
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

  // CASO 3: Utente PT o Admin
  return (
    <View className="flex-1 justify-center items-center px-6">
      <Ionicons name="fitness-outline" size={56} color="#303038" className="mb-3" />
      <Text className="text-zinc-400 font-bold text-base text-center">Home Personal Trainer</Text>
      <Text className="text-zinc-600 text-xs text-center mt-1">Benvenuto in Rector, gestisci i tuoi atleti e le schede.</Text>
    </View>
  );
}
