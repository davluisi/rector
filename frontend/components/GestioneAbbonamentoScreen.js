import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../config';

export default function GestioneAbbonamentoScreen({
  trainer,
  user,
  onBack,
  onSubscriptionCancelled
}) {
  const [cancelling, setCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  if (!trainer) {
    return (
      <View className="flex-1 bg-premiumDark justify-center items-center px-6">
        <Text className="text-zinc-400 text-sm">Nessun trainer selezionato.</Text>
        <TouchableOpacity
          onPress={onBack}
          className="mt-4 px-4 py-2 bg-[#18181C] border border-[#282830] rounded-xl"
        >
          <Text className="text-white text-xs font-semibold">Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ptId = trainer.id || trainer.idUtente;

  // Formatta data inizio se presente
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/D';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleConfirmCancel = async () => {
    if (!user) return;
    try {
      setCancelling(true);
      setErrorMessage('');

      const res = await fetch(`${config.apiUrl}/api/auth/pt/${ptId}/annulla-abbonamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idAtleta: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.errore || "Errore durante l'annullamento dell'abbonamento");
      }

      setShowConfirmModal(false);
      setSuccessModalVisible(true);

      if (onSubscriptionCancelled && data.user) {
        onSubscriptionCancelled(data.user);
      }
    } catch (e) {
      console.error('[GestioneAbbonamentoScreen] Errore:', e);
      setErrorMessage(e.message || "Errore durante l'operazione");
      setShowConfirmModal(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View className="flex-1 bg-premiumDark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
      >
        {/* Card Dati Trainer e Abbonamento */}
        <View className="bg-[#16161A] border border-[#282830] rounded-3xl p-5 mb-5">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-[#1E1E24] border border-[#2A2A34] justify-center items-center overflow-hidden mr-4">
              {trainer.urlImmagineProfilo ? (
                <Image source={{ uri: trainer.urlImmagineProfilo }} className="w-full h-full" />
              ) : (
                <Ionicons name="person" size={30} color="#A1A1AA" />
              )}
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-white text-lg font-bold" numberOfLines={1}>
                {trainer.nome} {trainer.cognome}
              </Text>
            </View>
          </View>

          {/* Dettagli Stato Abbonamento */}
          <View className="bg-[#121216] border border-[#222228] rounded-2xl p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-zinc-400 text-xs font-semibold">Stato Abbonamento</Text>
              <View className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <Text className="text-emerald-400 text-xs font-bold">Attivo</Text>
              </View>
            </View>

            {trainer.dataInizio && (
              <View className="flex-row items-center justify-between pt-2 border-t border-[#1C1C22]">
                <Text className="text-zinc-400 text-xs font-semibold">Attivo dal</Text>
                <Text className="text-white text-xs font-medium">{formatDate(trainer.dataInizio)}</Text>
              </View>
            )}

            <View className="flex-row items-center justify-between pt-2 border-t border-[#1C1C22]">
              <Text className="text-zinc-400 text-xs font-semibold">Piano</Text>
              <Text className="text-white text-xs font-medium">Coaching Personalizzato</Text>
            </View>
          </View>
        </View>

        {/* Messaggio di Errore se presente */}
        {errorMessage ? (
          <View className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex-row items-center gap-3">
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text className="text-red-400 text-xs font-medium flex-1">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Sezione Gestione / Azioni */}
        <View className="bg-[#16161A] border border-[#282830] rounded-3xl p-5 mb-5">
          <Text className="text-zinc-400 text-xs leading-5 mb-5">
            Annullando l'abbonamento non sarai più seguito da questo Personal Trainer e verrà rimosso dalla tua schermata principale.
          </Text>

          <TouchableOpacity
            onPress={() => setShowConfirmModal(true)}
            activeOpacity={0.8}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text className="text-red-400 font-bold text-sm">Annulla abbonamento</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modale di Conferma Annullamento */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!cancelling) setShowConfirmModal(false);
        }}
      >
        <View className="flex-1 bg-black/75 justify-center items-center px-6">
          <View className="w-full bg-[#18181D] border border-[#2A2A34] rounded-3xl p-6 shadow-2xl">
            <View className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 items-center justify-center mb-4 self-center">
              <Ionicons name="warning-outline" size={24} color="#EF4444" />
            </View>

            <Text className="text-white text-lg font-bold text-center mb-2">
              Confermi l'annullamento?
            </Text>

            <Text className="text-zinc-400 text-xs text-center leading-5 mb-6">
              Sei sicuro di voler annullare l'abbonamento con {trainer.nome} {trainer.cognome}?
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                disabled={cancelling}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-xl bg-[#22222A] items-center justify-center border border-[#2D2D38]"
              >
                <Text className="text-white text-xs font-semibold">Indietro</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={cancelling}
                onPress={handleConfirmCancel}
                activeOpacity={0.8}
                className="flex-1 py-3 rounded-xl bg-red-600 items-center justify-center"
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-bold">Conferma</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modale Successo Annullamento */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          onBack();
        }}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="w-full bg-[#18181D] border border-[#2A2A34] rounded-3xl p-6 shadow-2xl items-center">
            <View className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-2">
              Abbonamento annullato
            </Text>

            <Text className="text-zinc-400 text-xs text-center leading-5 mb-6">
              L'abbonamento con {trainer.nome} {trainer.cognome} è stato annullato con successo.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setSuccessModalVisible(false);
                onBack();
              }}
              activeOpacity={0.8}
              className="w-full py-3.5 rounded-xl bg-[#FEB32F] items-center justify-center"
            >
              <Text className="text-black text-sm font-bold">Torna alla Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
