import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal, TextInput, ActivityIndicator, Alert, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../config';

/**
 * Modale per lasciare o modificare una recensione per un Personal Trainer.
 */
export default function ReviewModal({
  visible,
  onClose,
  trainer,
  currentUser,
  onReviewSaved,
}) {
  const [stelle, setStelle] = useState(5);
  const [commento, setCommento] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Carica eventuale recensione già presente
  useEffect(() => {
    if (!visible || !trainer?.id || !currentUser?.id) return;

    let isMounted = true;
    setLoading(true);
    setShowLoadingIndicator(false);

    // Mostra la rotellina solo se il caricamento impiega più di 3 secondi
    const timer = setTimeout(() => {
      if (isMounted) {
        setShowLoadingIndicator(true);
      }
    }, 3000);

    fetch(`${config.apiUrl}/api/recensioni/atleta/${currentUser.id}/pt/${trainer.id}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data && data.id) {
          setExistingReviewId(data.id);
          setStelle(data.stelle || 5);
          setCommento(data.commento || '');
        } else {
          setExistingReviewId(null);
          setStelle(5);
          setCommento('');
        }
      })
      .catch(err => {
        console.error('[ReviewModal] Errore caricamento recensione:', err);
      })
      .finally(() => {
        clearTimeout(timer);
        if (isMounted) {
          setLoading(false);
          setShowLoadingIndicator(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [visible, trainer?.id, currentUser?.id]);

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (!trainer?.id || !currentUser?.id) {
      Alert.alert('Errore', 'Dati non validi per inviare la recensione.');
      return;
    }

    setSaving(true);
    fetch(`${config.apiUrl}/api/recensioni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idAtleta: currentUser.id,
        idPersonalTrainer: trainer.id,
        stelle: stelle,
        commento: commento.trim(),
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Errore durante il salvataggio della recensione');
        }
        return data;
      })
      .then((data) => {
        if (onReviewSaved) {
          onReviewSaved({
            trainerId: trainer.id,
            stelle: stelle,
            commento: commento.trim(),
            mediaStelle: data.mediaStelle,
            numeroRecensioni: data.numeroRecensioni,
          });
        }
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          onClose();
        }, 1000);
      })
      .catch((err) => {
        Alert.alert('Attenzione', err.message || 'Non è stato possibile salvare la recensione.');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: showSuccessPopup ? 'center' : 'flex-start', paddingTop: showSuccessPopup ? 0 : 64, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
        className="bg-black/80"
      >
        {/* Card Form Recensione: scompare subito al salvataggio */}
        {!showSuccessPopup && (
          <View className="w-full max-w-sm bg-[#16161A] border border-[#2A2A32] rounded-3xl p-6 shadow-2xl">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-[#222228]">
            <View>
              <Text className="text-white text-lg font-bold">
                {existingReviewId ? 'Modifica Recensione' : 'Valuta il Trainer'}
              </Text>
              <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                {trainer ? `${trainer.nome} ${trainer.cognome}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="w-8 h-8 rounded-full bg-[#1E1E24] justify-center items-center"
            >
              <Ionicons name="close" size={18} color="#A1A1AA" />
            </Pressable>
          </View>

          {showLoadingIndicator ? (
            <View className="py-12 justify-center items-center">
              <ActivityIndicator size="small" color="#FEB32F" />
              <Text className="text-zinc-500 text-xs mt-3">Caricamento recensione...</Text>
            </View>
          ) : (
            <View className="mt-4">
              {/* Selezione Stelle interattive */}
              <View className="items-center py-2">
                <Text className="text-zinc-400 text-xs mb-3 font-medium">Seleziona il punteggio</Text>
                <View className="flex-row items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setStelle(star)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      className="p-1"
                    >
                      <Ionicons
                        name="star"
                        size={32}
                        color={star <= stelle ? '#FFB430' : '#2A2A34'}
                      />
                    </Pressable>
                  ))}
                </View>
                <Text className="text-[#FFB430] text-sm font-bold mt-2">
                  {stelle === 1 && 'Pessimo'}
                  {stelle === 2 && 'Insufficiente'}
                  {stelle === 3 && 'Discreto'}
                  {stelle === 4 && 'Ottimo'}
                  {stelle === 5 && 'Eccellente'}
                </Text>
              </View>

              {/* Area di testo per il commento */}
              <View className="mt-4">
                <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Commento (opzionale)
                </Text>
                <TextInput
                  value={commento}
                  onChangeText={setCommento}
                  placeholder="Scrivi qui la tua esperienza con il personal trainer..."
                  placeholderTextColor="#52525B"
                  multiline={true}
                  numberOfLines={4}
                  maxLength={1000}
                  textAlignVertical="top"
                  className="bg-[#101013] border border-[#262630] rounded-2xl p-3.5 text-white text-sm min-h-[90px]"
                />
              </View>

              {/* Tasto Invia con Pressable */}
              <Pressable
                onPress={handleSubmit}
                disabled={saving}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                className="w-full bg-[#FEB32F] py-3.5 rounded-2xl items-center justify-center mt-6 mb-2 shadow-md"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0B0B0E" />
                ) : (
                  <Text className="text-black font-extrabold text-sm tracking-wide">
                    {existingReviewId ? 'AGGIORNA RECENSIONE' : 'INVIA RECENSIONE'}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Popup di successo al centro dello schermo che scompare in automatico */}
      {showSuccessPopup && (
        <View className="w-full max-w-sm bg-[#18181D] border border-[#2D2D38] px-8 py-7 rounded-3xl items-center shadow-2xl">
          <View className="w-16 h-16 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 justify-center items-center mb-4">
            <Ionicons name="checkmark-circle" size={38} color="#10B981" />
          </View>
          <Text className="text-white font-extrabold text-lg text-center">
            {existingReviewId ? 'Recensione aggiornata' : 'Recensione inviata'}
          </Text>
          <Text className="text-zinc-400 text-sm text-center mt-2 leading-relaxed">
            Grazie per il tuo feedback!
          </Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
}
