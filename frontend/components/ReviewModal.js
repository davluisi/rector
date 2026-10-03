import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
  const [saving, setSaving] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState(null);

  // Carica eventuale recensione già presente
  useEffect(() => {
    if (!visible || !trainer?.id || !currentUser?.id) return;

    let isMounted = true;
    setLoading(true);

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
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, trainer?.id, currentUser?.id]);

  const handleSubmit = () => {
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
        Alert.alert('Successo', existingReviewId ? 'Recensione aggiornata con successo!' : 'Recensione inviata con successo!');
        if (onReviewSaved) {
          onReviewSaved({
            trainerId: trainer.id,
            stelle: stelle,
            commento: commento.trim(),
            mediaStelle: data.mediaStelle,
            numeroRecensioni: data.numeroRecensioni,
          });
        }
        onClose();
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
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center bg-black/80 px-5"
      >
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
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-[#1E1E24] justify-center items-center"
            >
              <Ionicons name="close" size={18} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-12 justify-center items-center">
              <ActivityIndicator size="small" color="#FEB32F" />
              <Text className="text-zinc-500 text-xs mt-3">Caricamento recensione...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
              {/* Selezione Stelle interattive */}
              <View className="items-center py-2">
                <Text className="text-zinc-400 text-xs mb-3 font-medium">Seleziona il punteggio</Text>
                <View className="flex-row items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setStelle(star)}
                      activeOpacity={0.7}
                      className="p-1"
                    >
                      <Ionicons
                        name="star"
                        size={32}
                        color={star <= stelle ? '#FFB430' : '#2A2A34'}
                      />
                    </TouchableOpacity>
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
                  className="bg-[#101013] border border-[#262630] rounded-2xl p-3.5 text-white text-sm min-h-[100px]"
                />
              </View>

              {/* Tasto Invia */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.8}
                className="w-full bg-[#FEB32F] py-3.5 rounded-2xl items-center justify-center mt-6 shadow-md"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0B0B0E" />
                ) : (
                  <Text className="text-black font-extrabold text-sm tracking-wide">
                    {existingReviewId ? 'AGGIORNA RECENSIONE' : 'INVIA RECENSIONE'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
