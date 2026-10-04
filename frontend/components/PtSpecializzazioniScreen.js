import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../config';

export default function PtSpecializzazioniScreen({ user, onBack, onUpdateUser }) {
  const [allSpecializzazioni, setAllSpecializzazioni] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [inEvidenzaId, setInEvidenzaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Inizializza le specializzazioni già selezionate dal PT
    const initialIds = (user.specializzazioni || []).map(s => s.id);
    setSelectedIds(initialIds);

    // Inizializza la specializzazione in evidenza (se presente)
    const initialEvidenzaId = user.specializzazioneInEvidenzaId || 
      (user.specializzazioneInEvidenza && user.specializzazioneInEvidenza.id) ||
      (initialIds.length > 0 ? initialIds[0] : null);
    setInEvidenzaId(initialEvidenzaId);

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

  const successTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const toggleSpecializzazione = (id) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter(item => item !== id);
      setSelectedIds(next);
      // Se era la specializzazione in evidenza, assegna la prima disponibile tra le rimaste
      if (inEvidenzaId === id) {
        setInEvidenzaId(next.length > 0 ? next[0] : null);
      }
    } else {
      if (selectedIds.length >= 5) {
        setErrorMessage('Hai già selezionato 5 opzioni');
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => {
          setErrorMessage('');
        }, 3000);
        return;
      }
      const next = [...selectedIds, id];
      setSelectedIds(next);
      // Se non c'è ancora nessuna specializzazione in evidenza, imposta questa
      if (!inEvidenzaId) {
        setInEvidenzaId(id);
      }
    }
  };

  const setEvidenza = (id) => {
    setErrorMessage('');
    setSuccessMessage('');
    // La specializzazione deve essere tra quelle selezionate
    if (!selectedIds.includes(id)) {
      if (selectedIds.length >= 5) {
        setErrorMessage('Hai già selezionato 5 opzioni');
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => {
          setErrorMessage('');
        }, 3000);
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
    setInEvidenzaId(id);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch(`${config.apiUrl}/api/auth/pt/${user.id}/specializzazioni`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          specializzazioneIds: selectedIds,
          specializzazioneInEvidenzaId: inEvidenzaId 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.errore || 'Errore durante il salvataggio');
        return;
      }

      setSuccessMessage('Specializzazioni salvate!');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      if (onUpdateUser) {
        // Aggiorna l'oggetto utente in memoria
        const updatedSpecializzazioni = allSpecializzazioni.filter(s => selectedIds.includes(s.id));
        const updatedInEvidenza = allSpecializzazioni.find(s => s.id === inEvidenzaId) || (updatedSpecializzazioni.length > 0 ? updatedSpecializzazioni[0] : null);
        onUpdateUser({
          ...user,
          specializzazioni: updatedSpecializzazioni,
          specializzazioneInEvidenzaId: updatedInEvidenza ? updatedInEvidenza.id : null,
          specializzazioneInEvidenza: updatedInEvidenza,
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

      {/* Contenuto statico superiore */}
      <View className="px-6 pt-5">
        <Text className="text-zinc-400 text-sm leading-5 mb-2">
          Scegli gli ambiti e gli obiettivi in cui sei specializzato per aiutare gli utenti a trovarti più facilmente.{"\n"}
          Puoi selezionarne fino a un massimo di 5.
        </Text>
        <Text className="text-zinc-500 text-xs leading-4 mb-4">
          Seleziona <Ionicons name="star" size={13} color="#FEB32F" /> per scegliere quale mettere in evidenza.
        </Text>

        {/* Riga unica: Messaggio a sinistra e Contatore a destra alla stessa altezza */}
        <View className="h-8 flex-row items-center justify-between mb-1.5 mt-1">
          <View className="flex-1 mr-3 justify-center">
            {errorMessage ? (
              <View className="bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-xl self-start">
                <Text className="text-red-400 text-xs font-semibold">{errorMessage}</Text>
              </View>
            ) : successMessage ? (
              <View className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl self-start">
                <Text className="text-emerald-400 text-xs font-semibold">{successMessage}</Text>
              </View>
            ) : null}
          </View>

          <Text className="text-zinc-400 text-xs font-semibold">
            Selezionate <Text className={selectedIds.length === 5 ? 'text-[#FEB32F] font-bold' : 'text-zinc-200 font-bold'}>{selectedIds.length}/5</Text>
          </Text>
        </View>
      </View>

      {/* Lista a Checkbox scorrevole indipendente */}
      <View className="flex-1 px-6 pb-3">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="small" color="#FEB32F" />
            <Text className="text-zinc-500 text-xs mt-3">Caricamento specializzazioni...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1 bg-[#16161A] border border-borderDark/60 rounded-2xl px-4"
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {allSpecializzazioni.map((spec, index) => {
              const isSelected = selectedIds.includes(spec.id);
              const isEvidenza = inEvidenzaId === spec.id;
              const isLast = index === allSpecializzazioni.length - 1;

              return (
                <View
                  key={spec.id}
                  className={`flex-row items-center justify-between py-3 px-1 ${
                    !isLast ? 'border-b border-[#222228]/80' : ''
                  }`}
                >
                  <TouchableOpacity
                    activeOpacity={0.65}
                    onPress={() => toggleSpecializzazione(spec.id)}
                    className="flex-1 flex-row items-center mr-2 py-1"
                  >
                    {/* Checkbox Icon */}
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? '#FEB32F' : '#52525B'}
                    />
                    <Text
                      className={`text-sm ml-3 flex-1 ${
                        isSelected ? 'text-white font-semibold' : 'text-zinc-300 font-medium'
                      }`}
                    >
                      {spec.nome}
                    </Text>
                  </TouchableOpacity>

                  {/* Pulsante In Evidenza (solo icona Stella tutto a destra) */}
                  {isSelected && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setEvidenza(spec.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className={`w-9 h-9 rounded-xl items-center justify-center border ${
                        isEvidenza 
                          ? 'bg-[#FEB32F]/15 border-[#FEB32F]/50' 
                          : 'bg-[#1E1E24]/60 border-[#2A2A34]'
                      }`}
                    >
                      <Ionicons
                        name={isEvidenza ? 'star' : 'star-outline'}
                        size={18}
                        color={isEvidenza ? '#FEB32F' : '#71717A'}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>


      {/* Footer fisso con bottone Salva */}
      <View className="px-6 pt-3 pb-8 border-t border-[#1A1A1E] bg-premiumDark">
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
              <Text className="text-zinc-950 text-base font-bold">Salva</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
