import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../config';

export default function PtSpecializzazioniScreen({ user, onBack, onUpdateUser }) {
  const [allSpecializzazioni, setAllSpecializzazioni] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Inizializza le specializzazioni già selezionate dal PT
    const initialIds = (user.specializzazioni || []).map(s => s.id);
    setSelectedIds(initialIds);

    // Carica il catalogo ordinato alfabeticamente
    fetch(`${config.apiUrl}/api/auth/specializzazioni`)
      .then(res => {
        if (!res.ok) throw new Error('Errore durante il recupero delle specializzazioni');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAllSpecializzazioni(data);
        }
      })
      .catch(err => {
        console.error('[PtSpecializzazioniScreen] Errore:', err);
        setErrorMessage('Impossibile caricare il catalogo delle specializzazioni');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const toggleSpecializzazione = (id) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      if (selectedIds.length >= 5) {
        setErrorMessage('Puoi selezionare fino a un massimo di 5 specializzazioni');
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch(`${config.apiUrl}/api/auth/pt/${user.id}/specializzazioni`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specializzazioneIds: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.errore || 'Errore durante il salvataggio');
        return;
      }

      setSuccessMessage('Specializzazioni salvate con successo!');
      if (onUpdateUser) {
        // Aggiorna l'oggetto utente in memoria
        const updatedSpecializzazioni = allSpecializzazioni.filter(s => selectedIds.includes(s.id));
        onUpdateUser({
          ...user,
          specializzazioni: updatedSpecializzazioni,
        });
      }
    } catch (err) {
      console.error('[PtSpecializzazioniScreen] Errore salvataggio:', err);
      setErrorMessage('Impossibile connettersi al server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-premiumDark">
      {/* Header */}
      <View className="flex-row items-center justify-between py-3 px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
        <TouchableOpacity onPress={onBack} className="p-1 w-10 items-start">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-white tracking-tight">Specializzazioni</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
      >
        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
          Il tuo target professionale
        </Text>
        <Text className="text-white text-2xl font-black mb-2">
          Le tue Specializzazioni & Target
        </Text>
        <Text className="text-zinc-400 text-sm leading-5 mb-5">
          Scegli gli ambiti e gli obiettivi in cui sei specializzato per aiutare gli atleti a trovarti più facilmente. Puoi selezionare <Text className="text-[#FEB32F] font-bold">fino a un massimo di 5</Text> specializzazioni.
        </Text>

        {/* Counter badge */}
        <View className="flex-row items-center justify-between bg-[#16161A] border border-borderDark/60 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center gap-2.5">
            <Ionicons name="ribbon-outline" size={20} color="#FEB32F" />
            <Text className="text-zinc-300 text-sm font-semibold">Specializzazioni selezionate</Text>
          </View>
          <View className={`px-3 py-1 rounded-xl border ${selectedIds.length === 5 ? 'bg-[#FEB32F]/20 border-[#FEB32F]' : 'bg-[#1F1F24] border-[#2C2C34]'}`}>
            <Text className={`font-bold text-sm ${selectedIds.length === 5 ? 'text-[#FEB32F]' : 'text-white'}`}>
              {selectedIds.length} / 5
            </Text>
          </View>
        </View>

        {/* Messaggi Feedback */}
        {errorMessage ? (
          <View className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-2xl mb-4">
            <Text className="text-red-400 text-xs font-semibold">{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 rounded-2xl mb-4">
            <Text className="text-emerald-400 text-xs font-semibold">{successMessage}</Text>
          </View>
        ) : null}

        {/* Elenco Chips */}
        {loading ? (
          <View className="py-12 justify-center items-center">
            <ActivityIndicator size="small" color="#FEB32F" />
            <Text className="text-zinc-500 text-xs mt-3">Caricamento specializzazioni...</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2.5 mb-8">
            {allSpecializzazioni.map((spec) => {
              const isSelected = selectedIds.includes(spec.id);
              return (
                <TouchableOpacity
                  key={spec.id}
                  activeOpacity={0.7}
                  onPress={() => toggleSpecializzazione(spec.id)}
                  className={`flex-row items-center px-4 py-2.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#FEB32F]/15 border-[#FEB32F] shadow-sm shadow-[#FEB32F]/10'
                      : 'bg-[#16161A] border-borderDark/60'
                  }`}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                    size={18}
                    color={isSelected ? "#FEB32F" : "#71717A"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? 'text-[#FEB32F]' : 'text-zinc-300'
                    }`}
                  >
                    {spec.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottone Salva */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || loading}
          activeOpacity={0.8}
          className={`h-13 rounded-2xl justify-center items-center flex-row gap-2 ${
            saving ? 'bg-zinc-700' : 'bg-[#FEB32F]'
          }`}
          style={{ height: 50 }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#0D0D11" />
              <Text className="text-zinc-950 text-base font-bold">Salva Specializzazioni</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
