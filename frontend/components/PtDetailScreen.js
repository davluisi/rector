import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RatingStars from './RatingStars';
import { config } from '../config';

export default function PtDetailScreen({ ptId, user, onBack, onSubscriptionSuccess }) {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Verifica se l'utente attuale è già abbonato a questo PT
  const isAlreadySubscribed = Boolean(
    user?.personalTrainers && user.personalTrainers.some(pt => (pt.id === ptId || pt.idUtente === ptId))
  );

  const isSelf = Boolean(user && user.id === ptId);

  useEffect(() => {
    if (!ptId) return;
    setLoading(true);
    setErrorMessage('');

    fetch(`${config.apiUrl}/api/auth/personal-trainers/${ptId}`)
      .then(res => {
        if (!res.ok) throw new Error('Impossibile caricare i dati del personal trainer');
        return res.json();
      })
      .then(data => {
        setTrainer(data);
      })
      .catch(err => {
        console.error('[PtDetailScreen] Errore caricamento:', err);
        setErrorMessage(err.message || 'Errore durante il caricamento');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ptId]);

  const handleAbbonati = async () => {
    if (!user) return;
    if (user.ruolo !== 'utente_atleta' && user.ruolo !== 'entrambi') {
      setErrorMessage('Devi avere un profilo da atleta attivo per abbonarti.');
      return;
    }

    try {
      setSubscribing(true);
      setErrorMessage('');

      const res = await fetch(`${config.apiUrl}/api/auth/pt/${ptId}/abbonati`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idAtleta: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.errore || 'Errore durante la sottoscrizione dell\'abbonamento');
      }

      setSuccessModalVisible(true);

      if (onSubscriptionSuccess && data.user) {
        onSubscriptionSuccess(data.user);
      }
    } catch (e) {
      console.error('[PtDetailScreen] Errore abbonamento:', e);
      setErrorMessage(e.message || 'Errore durante la sottoscrizione');
    } finally {
      setSubscribing(false);
    }
  };

  const trainerNome = trainer ? `${trainer.nome} ${trainer.cognome}` : 'Personal Trainer';

  return (
    <View className="flex-1 bg-premiumDark">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFB430" />
          <Text className="text-zinc-500 text-xs mt-3">Caricamento profilo...</Text>
        </View>
      ) : errorMessage && !trainer ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-zinc-300 font-bold text-base mt-3 text-center">{errorMessage}</Text>
          <TouchableOpacity
            onPress={onBack}
            className="mt-5 px-5 py-2.5 bg-[#18181C] border border-[#282830] rounded-xl"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-semibold">Torna alla home</Text>
          </TouchableOpacity>
        </View>
      ) : trainer ? (
        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110 }}
          >
            {/* Card Principale Profilo Trainer */}
            <View className="bg-[#16161A] border border-[#282830] rounded-3xl p-6 items-center mb-5 relative shadow-xl">
              <View className="w-24 h-24 rounded-full bg-[#1E1E24] border-2 border-[#2A2A34] justify-center items-center overflow-hidden mb-4 shadow-lg shadow-black/40">
                {trainer.urlImmagineProfilo ? (
                  <Image source={{ uri: trainer.urlImmagineProfilo }} className="w-full h-full" />
                ) : (
                  <Ionicons name="person" size={48} color="#A1A1AA" />
                )}
              </View>

              <View className="mb-1">
                <Text className="text-white text-xl font-extrabold text-center">
                  {trainer.nome} {trainer.cognome}
                </Text>
              </View>

              {/* Informazioni aggiuntive (Età / Genere) */}
              <View className="flex-row items-center gap-3 mt-1 mb-3">
                {trainer.eta !== null && trainer.eta !== undefined && (
                  <View className="bg-[#202026] px-3 py-1 rounded-full border border-[#2A2A34]">
                    <Text className="text-zinc-400 text-xs font-medium">{trainer.eta} anni</Text>
                  </View>
                )}
                {trainer.genere && (
                  <View className="bg-[#202026] px-3 py-1 rounded-full border border-[#2A2A34]">
                    <Text className="text-zinc-400 text-xs font-medium">
                      {trainer.genere === 'MASCHIO' ? 'Uomo' : trainer.genere === 'FEMMINA' ? 'Donna' : 'Altro'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Valutazione con stelle e numero recensioni */}
              <View className="items-center mt-1">
                <RatingStars
                  rating={trainer.mediaStelle || 0}
                  size={16}
                  showValue={true}
                  count={trainer.numeroRecensioni || 0}
                />
              </View>
            </View>

            {/* Specializzazioni */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3 px-1">
                SPECIALIZZAZIONI
              </Text>

              {trainer.specializzazioni && trainer.specializzazioni.length > 0 ? (
                (() => {
                  // Ordina mettendo quella in evidenza come prima
                  const evidenzaId = trainer.specializzazioneInEvidenza?.id;
                  const sortedSpecs = [...trainer.specializzazioni].sort((a, b) => {
                    if (a.id === evidenzaId) return -1;
                    if (b.id === evidenzaId) return 1;
                    return (a.nome || '').localeCompare(b.nome || '');
                  });

                  return (
                    <View className="bg-[#16161A] border border-[#282830] rounded-2xl p-5">
                      <View className="gap-2.5">
                        {sortedSpecs.map((spec, index) => {
                          const isEvidenza = spec.id === evidenzaId;

                          return (
                            <View key={spec.id || index} className="flex-row items-center">
                              {/* Bullet point */}
                              <View 
                                className={`w-1.5 h-1.5 rounded-full mr-3 ${
                                  isEvidenza ? 'bg-[#FFB430]' : 'bg-zinc-500'
                                }`} 
                              />
                              <Text
                                className={`text-sm ${
                                  isEvidenza
                                    ? 'text-[#FFB430] font-bold'
                                    : 'text-zinc-300 font-medium'
                                }`}
                              >
                                {spec.nome}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()
              ) : (
                <View className="bg-[#16161A] border border-[#282830] rounded-2xl p-4">
                  <Text className="text-zinc-500 text-xs">Nessuna specializzazione specificata.</Text>
                </View>
              )}
            </View>

            {/* Recensioni ricevute */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  Recensioni ({trainer.recensioni?.length || 0})
                </Text>
              </View>

              {trainer.recensioni && trainer.recensioni.length > 0 ? (
                <View className="gap-3">
                  {trainer.recensioni.map((rec) => (
                    <View
                      key={rec.id}
                      className="bg-[#16161A] border border-[#282830] rounded-2xl p-4"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2.5">
                          <View className="w-8 h-8 rounded-full bg-[#202026] border border-[#2E2E38] justify-center items-center overflow-hidden">
                            {rec.urlImmagineProfiloAutore ? (
                              <Image
                                source={{ uri: rec.urlImmagineProfiloAutore }}
                                className="w-full h-full"
                              />
                            ) : (
                              <Ionicons name="person" size={16} color="#A1A1AA" />
                            )}
                          </View>
                          <Text className="text-white text-sm font-bold">
                            {rec.nomeAutore} {rec.cognomeAutore}
                          </Text>
                        </View>

                        <RatingStars rating={rec.stelle} size={11} showValue={false} />
                      </View>

                      {rec.commento ? (
                        <Text className="text-zinc-300 text-xs leading-relaxed mt-1">
                          {rec.commento}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-[#16161A] border border-[#282830] rounded-2xl p-5 items-center">
                  <Ionicons name="chatbubble-ellipses-outline" size={30} color="#353540" />
                  <Text className="text-zinc-500 text-xs mt-2 text-center">
                    Ancora nessuna recensione per questo trainer.
                  </Text>
                </View>
              )}
            </View>

            {/* Eventuale messaggio di errore per l'abbonamento */}
            {errorMessage ? (
              <View className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex-row items-center gap-2 mt-2">
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text className="text-red-400 text-xs font-semibold flex-1">{errorMessage}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Barra inferiore fissa con pulsante "Abbonati" */}
          <View className="absolute bottom-0 left-0 right-0 bg-[#121216]/95 border-t border-[#222228] px-6 py-4">
            {!user ? (
              <View className="h-12 bg-[#202026] rounded-xl justify-center items-center border border-[#2A2A34] px-4">
                <Text className="text-zinc-400 font-bold text-sm text-center">
                  Effettua l'accesso per abbonarti
                </Text>
              </View>
            ) : isSelf ? (
              <View className="h-12 bg-[#202026] rounded-xl justify-center items-center border border-[#2A2A34]">
                <Text className="text-zinc-500 font-bold text-sm">Questo è il tuo profilo</Text>
              </View>
            ) : isAlreadySubscribed ? (
              <View className="h-12 bg-emerald-500/15 rounded-xl justify-center items-center border border-emerald-500/30 flex-row gap-2">
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text className="text-emerald-400 font-bold text-sm">Sei già abbonato a questo trainer</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAbbonati}
                disabled={subscribing}
                className="h-12 bg-[#FFB430] rounded-xl justify-center items-center shadow-lg shadow-[#FFB430]/20 flex-row gap-2"
                activeOpacity={0.8}
              >
                {subscribing ? (
                  <ActivityIndicator size="small" color="#0D0D11" />
                ) : (
                  <>
                    <Ionicons name="fitness" size={18} color="#0D0D11" />
                    <Text className="text-[#0D0D11] text-[15px] font-extrabold uppercase tracking-wider">
                      Abbonati
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : null}

      {/* MODALE CONFERMA SUCCESSO ABBONAMENTO */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          onBack();
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-6">
          <View className="w-full max-w-sm bg-[#16161A] border border-[#282832] rounded-3xl p-6 items-center shadow-2xl">
            <View className="w-14 h-14 rounded-2xl bg-[#FFB430]/15 border border-[#FFB430]/30 justify-center items-center mb-4">
              <Ionicons name="checkmark-done" size={28} color="#FFB430" />
            </View>

            <Text className="text-white text-lg font-bold text-center">
              Abbonamento Attivato!
            </Text>

            <Text className="text-zinc-400 text-sm text-center mt-2 leading-relaxed">
              Ora sei seguito da <Text className="text-white font-bold">{trainerNome}</Text>. Troverai questo trainer attivo nella tua home e potrai accedere alle tue schede di allenamento.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setSuccessModalVisible(false);
                onBack();
              }}
              className="w-full h-12 rounded-xl bg-[#FFB430] justify-center items-center shadow-md shadow-[#FFB430]/20 mt-6"
              activeOpacity={0.8}
            >
              <Text className="text-[#0D0D11] font-bold text-sm">Torna alla Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
