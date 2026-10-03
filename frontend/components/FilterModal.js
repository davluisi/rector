import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AgeRangeSlider from './AgeRangeSlider';

export default function FilterModal({
  visible,
  onClose,
  specializzazioni = [],
  selectedSpecializzazioneIds = [],
  selectedSpecializzazioneId, // retrocompatibilità
  etaMin,
  etaMax,
  onApply,
  onReset,
}) {
  const insets = useSafeAreaInsets();
  
  // Normalizza gli ID iniziali (supporta sia array che singolo id)
  const initialSpecIds = Array.isArray(selectedSpecializzazioneIds) && selectedSpecializzazioneIds.length > 0
    ? selectedSpecializzazioneIds
    : (selectedSpecializzazioneId ? [selectedSpecializzazioneId] : []);

  const [tempSpecIds, setTempSpecIds] = useState(initialSpecIds);
  const [tempEtaMin, setTempEtaMin] = useState(etaMin ? Number(etaMin) : 18);
  const [tempEtaMax, setTempEtaMax] = useState(etaMax ? Number(etaMax) : 100);

  // Stato per il popup di configurazione del singolo campo al centro dello schermo: 'specializzazione' | 'eta' | null
  const [activePopup, setActivePopup] = useState(null);

  // Buffer locale per il popup in corso (in modo da poter annullare o confermare)
  const [popupSpecIds, setPopupSpecIds] = useState(initialSpecIds);
  const [popupEtaMin, setPopupEtaMin] = useState(etaMin ? Number(etaMin) : 18);
  const [popupEtaMax, setPopupEtaMax] = useState(etaMax ? Number(etaMax) : 100);

  // Sincronizza stato locale all'apertura della modale principale
  useEffect(() => {
    if (visible) {
      const currentIds = Array.isArray(selectedSpecializzazioneIds) && selectedSpecializzazioneIds.length > 0
        ? selectedSpecializzazioneIds
        : (selectedSpecializzazioneId ? [selectedSpecializzazioneId] : []);
      setTempSpecIds(currentIds);
      setTempEtaMin(etaMin ? Number(etaMin) : 18);
      setTempEtaMax(etaMax ? Number(etaMax) : 100);
      setActivePopup(null);
    }
  }, [visible, selectedSpecializzazioneIds, selectedSpecializzazioneId, etaMin, etaMax]);

  const openPopup = (field) => {
    if (field === 'specializzazione') {
      setPopupSpecIds([...tempSpecIds]);
    } else if (field === 'eta') {
      setPopupEtaMin(tempEtaMin || 18);
      setPopupEtaMax(tempEtaMax || 100);
    }
    setActivePopup(field);
  };

  const savePopup = () => {
    if (activePopup === 'specializzazione') {
      setTempSpecIds([...popupSpecIds]);
    } else if (activePopup === 'eta') {
      setTempEtaMin(popupEtaMin);
      setTempEtaMax(popupEtaMax);
    }
    setActivePopup(null);
  };

  const resetPopup = () => {
    if (activePopup === 'specializzazione') {
      setPopupSpecIds([]);
    } else if (activePopup === 'eta') {
      setPopupEtaMin(18);
      setPopupEtaMax(100);
    }
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  const toggleSpecializzazione = (id) => {
    setPopupSpecIds((prev) => {
      if (prev.includes(id)) {
        // Deseleziona: rimuove l'elemento
        return prev.filter((item) => item !== id);
      } else {
        // Seleziona: aggiunge in fondo alla lista dei selezionati
        // (così l'ultimo selezionato sta sempre sotto gli altri già selezionati in cima)
        return [...prev, id];
      }
    });
  };

  const handleApply = () => {
    const isDefaultEta = (tempEtaMin === 18 && tempEtaMax === 100);
    onApply({
      specializzazioneIds: tempSpecIds,
      specializzazioneId: tempSpecIds.length === 1 ? tempSpecIds[0] : null,
      etaMin: isDefaultEta ? null : tempEtaMin,
      etaMax: isDefaultEta ? null : tempEtaMax,
    });
    onClose();
  };

  const handleReset = () => {
    setTempSpecIds([]);
    setTempEtaMin(18);
    setTempEtaMax(100);
    // Se c'è una callback onReset opzionale per avvisare, la chiamiamo solo se si vuole o lasciamo che applichi
    // ma la specifica dice: "premendo 'Resetta' si devono resettare tutti i filtri al default ma non si deve chiudere la finestra"
  };

  const hasActiveEta = (tempEtaMin !== 18 || tempEtaMax !== 100);
  const hasActiveFilters = Boolean(tempSpecIds.length > 0 || hasActiveEta);

  // Calcola etichetta sintetica per la riga specializzazione
  const getSelectedSpecName = () => {
    if (!tempSpecIds || tempSpecIds.length === 0) return 'Qualsiasi';
    if (tempSpecIds.length === 1) {
      const found = specializzazioni.find((s) => s.id === tempSpecIds[0]);
      return found ? found.nome : '1 selezionata';
    }
    return `${tempSpecIds.length} selezionate`;
  };

  // Calcola etichetta sintetica per la riga età: "Qualsiasi" se su tutte (18-100), altrimenti "min - max anni"
  const getEtaSummary = () => {
    if (!hasActiveEta) return 'Qualsiasi';
    return `${tempEtaMin} - ${tempEtaMax} anni`;
  };

  // Altezza header app (64px) + top safe inset + calibratura offset
  const topOffset = insets.top + 64 + 42;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/80" style={{ paddingTop: topOffset }}>
        <View className="flex-1 bg-[#121216] border-t border-[#222228] rounded-t-3xl overflow-hidden">
          {/* Header Modal Fissa */}
          <View className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-[#1E1E24]">
            <View className="flex-row items-center gap-2">
              <Ionicons name="options-outline" size={20} color="#FEB32F" />
              <Text className="text-white text-lg font-bold">Filtra Personal Trainer</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {/* Lista statica e pulita dei campi filtrabili */}
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}
          >
            {/* 1. CAMPO: OBIETTIVO & SPECIALIZZAZIONE */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openPopup('specializzazione')}
              className="bg-[#16161A] border border-borderDark/60 rounded-2xl mb-3 p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View className="w-10 h-10 rounded-xl bg-[#1E1E24] border border-[#2A2A34] justify-center items-center">
                  <Ionicons name="ribbon-outline" size={19} color="#FEB32F" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">Specializzazione</Text>
                  <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
                    {getSelectedSpecName()}
                  </Text>
                </View>
              </View>

              {tempSpecIds.length > 0 && (
                <View className="w-2.5 h-2.5 rounded-full bg-[#FEB32F]" />
              )}
            </TouchableOpacity>

            {/* 2. CAMPO: ETÀ */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openPopup('eta')}
              className="bg-[#16161A] border border-borderDark/60 rounded-2xl mb-4 p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View className="w-10 h-10 rounded-xl bg-[#1E1E24] border border-[#2A2A34] justify-center items-center">
                  <Ionicons name="calendar-outline" size={19} color="#FEB32F" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">Età</Text>
                  <Text className="text-zinc-400 text-xs mt-0.5">
                    {getEtaSummary()}
                  </Text>
                </View>
              </View>

              {hasActiveEta && (
                <View className="w-2.5 h-2.5 rounded-full bg-[#FEB32F]" />
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Fisso con Pulsanti Azione: sempre entrambi visibili */}
          <View 
            className="px-5 pt-3 border-t border-[#1E1E24] bg-[#121216] flex-row items-center gap-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <TouchableOpacity
              onPress={handleReset}
              activeOpacity={0.7}
              className="flex-1 h-12 rounded-xl bg-[#1C1C22] border border-[#2A2A34] justify-center items-center"
            >
              <Text className="text-zinc-300 font-bold text-sm">Resetta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              activeOpacity={0.8}
              className="flex-1 h-12 rounded-xl bg-[#FEB32F] justify-center items-center flex-row gap-2"
            >
              <Ionicons name="search-sharp" size={17} color="#0D0D11" />
              <Text className="text-zinc-950 font-bold text-sm">Cerca</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* POPUP CENTRALE PER LA CONFIGURAZIONE DEL CAMPO SELEZIONATO */}
      {activePopup && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={closePopup}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-center items-center bg-black/85 px-6"
          >
            <View className="w-full bg-[#16161A] border border-[#2A2A34] rounded-3xl p-5 shadow-2xl">
              {/* Header Popup */}
              <View className="flex-row items-center justify-between pb-3.5 mb-3 border-b border-[#222228]">
                <View className="flex-row items-center gap-2">
                  <Ionicons 
                    name={activePopup === 'specializzazione' ? "ribbon-outline" : "calendar-outline"} 
                    size={20} 
                    color="#FEB32F" 
                  />
                  <Text className="text-white font-bold text-base">
                    {activePopup === 'specializzazione' ? 'Specializzazione' : 'Età'}
                  </Text>
                </View>
                <TouchableOpacity onPress={closePopup} className="p-1">
                  <Ionicons name="close" size={22} color="#A1A1AA" />
                </TouchableOpacity>
              </View>

              {/* Contenuto Popup: Specializzazione con elenco verticale e checkbox (ordine stabile) */}
              {activePopup === 'specializzazione' && (
                <ScrollView showsVerticalScrollIndicator={false} className="max-h-80 my-1">
                  <View className="py-0.5">
                    {specializzazioni.map((spec, index) => {
                      const isSelected = popupSpecIds.includes(spec.id);
                      const isLast = index === specializzazioni.length - 1;
                      return (
                        <TouchableOpacity
                          key={spec.id}
                          activeOpacity={0.65}
                          onPress={() => toggleSpecializzazione(spec.id)}
                          className={`flex-row items-center justify-between py-3 px-1 ${
                            !isLast ? 'border-b border-[#222228]/80' : ''
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium flex-1 mr-3 ${
                              isSelected ? 'text-[#FEB32F] font-semibold' : 'text-zinc-300'
                            }`}
                          >
                            {spec.nome}
                          </Text>

                          {/* Checkbox Icon */}
                          <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={21}
                            color={isSelected ? '#FEB32F' : '#52525B'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              {/* Contenuto Popup: Età con Slider da 18 a 100 */}
              {activePopup === 'eta' && (
                <View className="py-1">
                  <AgeRangeSlider
                    minVal={popupEtaMin}
                    maxVal={popupEtaMax}
                    onChange={(newMin, newMax) => {
                      setPopupEtaMin(newMin);
                      setPopupEtaMax(newMax);
                    }}
                  />
                </View>
              )}

              {/* Bottoni del Popup */}
              <View className="flex-row items-center gap-2.5 mt-4 pt-3 border-t border-[#222228]">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={resetPopup}
                  className="flex-1 h-11 rounded-xl bg-[#1C1C22] border border-[#2A2A34] justify-center items-center"
                >
                  <Text className="text-zinc-300 text-xs font-bold">Resetta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={savePopup}
                  className="flex-1 h-11 rounded-xl bg-[#FEB32F] justify-center items-center"
                >
                  <Text className="text-zinc-950 text-xs font-bold">Conferma</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </Modal>
  );
}
