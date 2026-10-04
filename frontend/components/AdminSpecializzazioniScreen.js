import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../config';

const getApiUrl = () => config.apiUrl;

export default function AdminSpecializzazioniScreen({ user, onBack }) {
  const [specializzazioni, setSpecializzazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modale Aggiungi / Modifica
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null); // null = creazione, altrimenti oggetto spec
  const [nomeInput, setNomeInput] = useState('');
  const [inputError, setInputError] = useState('');

  // Modale Conferma Eliminazione
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [specToDelete, setSpecToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const successTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const fetchSpecializzazioni = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/admin/specializzazioni`, {
        headers: {
          'X-Admin-Id': String(user.id),
        },
      });
      if (!res.ok) {
        throw new Error('Errore durante il recupero delle specializzazioni');
      }
      const data = await res.json();
      setSpecializzazioni(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErrorMessage('Impossibile caricare le specializzazioni');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setErrorMessage(''), 3500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecializzazioni();
  }, [user]);

  // Apertura modale per creare
  const handleOpenCreateModal = () => {
    setEditingSpec(null);
    setNomeInput('');
    setInputError('');
    setModalVisible(true);
  };

  // Apertura modale per modificare
  const handleOpenEditModal = (spec) => {
    setEditingSpec(spec);
    setNomeInput(spec.nome);
    setInputError('');
    setModalVisible(true);
  };

  // Salvataggio (Creazione o Modifica)
  const handleSave = async () => {
    const trimmed = nomeInput.trim();
    if (!trimmed) {
      setInputError('Inserisci un nome per la specializzazione');
      return;
    }

    try {
      setSaving(true);
      setInputError('');

      const isEdit = !!editingSpec;
      const url = isEdit 
        ? `${getApiUrl()}/api/admin/specializzazioni/${editingSpec.id}`
        : `${getApiUrl()}/api/admin/specializzazioni`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Id': String(user.id),
        },
        body: JSON.stringify({ nome: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInputError(data.errore || 'Errore durante il salvataggio');
        return;
      }

      setModalVisible(false);
      setSuccessMessage(isEdit ? 'Specializzazione modificata con successo' : 'Specializzazione creata con successo');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMessage(''), 3000);

      fetchSpecializzazioni();
    } catch (e) {
      console.error(e);
      setInputError('Impossibile completare l\'operazione');
    } finally {
      setSaving(false);
    }
  };

  // Apertura modale conferma cancellazione
  const handlePromptDelete = (spec) => {
    setSpecToDelete(spec);
    setDeleteModalVisible(true);
  };

  // Esecuzione cancellazione
  const handleConfirmDelete = async () => {
    if (!specToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`${getApiUrl()}/api/admin/specializzazioni/${specToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Id': String(user.id),
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.errore || 'Errore durante l\'eliminazione');
      }

      setDeleteModalVisible(false);
      setSpecToDelete(null);
      setSuccessMessage('Specializzazione eliminata');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMessage(''), 3000);

      fetchSpecializzazioni();
    } catch (e) {
      console.error(e);
      setErrorMessage(e.message || 'Errore durante l\'eliminazione');
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setErrorMessage(''), 3500);
      setDeleteModalVisible(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-premiumDark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-[#1A1A1E] h-16 bg-premiumDark">
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 rounded-full bg-[#18181C] items-center justify-center border border-[#282830]"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View className="w-10 h-10" />
        )}
        <View className="flex-row items-center gap-2">
          <Ionicons name="ribbon-outline" size={20} color="#FFB430" />
          <Text className="text-lg font-bold text-white tracking-tight">
            Specializzazioni
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchSpecializzazioni}
          className="w-10 h-10 rounded-full bg-[#18181C] items-center justify-center border border-[#282830]"
          activeOpacity={0.7}
        >
          <Ionicons name="reload-outline" size={18} color="#FFB430" />
        </TouchableOpacity>
      </View>

      {/* Barra superiore: Messaggi di notifica (a sinistra, larghezza necessaria) e Pulsante "+" a destra */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between min-h-[50px]">
        {/* Notifica di successo o errore a sinistra */}
        <View className="flex-1 mr-3 flex-row items-center justify-start">
          {successMessage ? (
            <View className="py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex-row items-center gap-1.5 self-start">
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text className="text-emerald-400 text-xs font-semibold">{successMessage}</Text>
            </View>
          ) : errorMessage ? (
            <View className="py-2 px-3 bg-red-500/10 border border-red-500/30 rounded-xl flex-row items-center gap-1.5 self-start">
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text className="text-red-400 text-xs font-semibold">{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        {/* Pulsante rapido Aggiungi con solo "+" */}
        <TouchableOpacity
          onPress={handleOpenCreateModal}
          className="w-10 h-10 rounded-xl bg-[#FFB430] items-center justify-center shadow-lg shadow-[#FFB430]/20 ml-auto"
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#0D0D11" />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFB430" />
          <Text className="text-zinc-500 text-xs mt-3">Caricamento specializzazioni...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 50 }}
        >

          {specializzazioni.length === 0 ? (
            <View className="bg-[#16161A] border border-[#282830] rounded-2xl p-6 items-center my-4">
              <Ionicons name="ribbon-outline" size={40} color="#52525B" />
              <Text className="text-zinc-400 text-sm mt-3 text-center">
                Nessuna specializzazione presente nel catalogo.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {specializzazioni.map((spec) => (
                <View
                  key={spec.id}
                  className="bg-[#16161A] border border-[#282830] rounded-2xl p-4 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-white text-base font-bold">
                      {spec.nome}
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-0.5">
                      {spec.conteggioPt === 1
                        ? '1 personal trainer associato'
                        : `${spec.conteggioPt || 0} personal trainer associati`}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    {/* Modifica */}
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(spec)}
                      className="w-9 h-9 rounded-xl bg-[#282830] items-center justify-center border border-[#3A3A45]"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil-outline" size={16} color="#FFB430" />
                    </TouchableOpacity>

                    {/* Elimina */}
                    <TouchableOpacity
                      onPress={() => handlePromptDelete(spec)}
                      className="w-9 h-9 rounded-xl bg-[#A0132C]/20 items-center justify-center border border-[#A0132C]/40"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF4D6D" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODALE AGGIUNGI / MODIFICA */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center items-center bg-black/80 px-6"
        >
          <View className="w-full max-w-sm bg-[#16161A] border border-[#282832] rounded-3xl p-6 shadow-2xl">
            <View className="w-12 h-12 rounded-2xl bg-[#FFB430]/15 border border-[#FFB430]/30 justify-center items-center mb-4 self-center">
              <Ionicons
                name={editingSpec ? 'pencil-outline' : 'add-outline'}
                size={24}
                color="#FFB430"
              />
            </View>

            <Text className="text-white text-lg font-bold text-center mb-1">
              {editingSpec ? 'Modifica specializzazione' : 'Nuova specializzazione'}
            </Text>
            <Text className="text-zinc-400 text-xs text-center mb-5">
              {editingSpec
                ? 'L\'ID rimarrà inalterato e il nuovo nome si aggiornerà per tutti i PT associati.'
                : 'Inserisci il nome della specializzazione da aggiungere al catalogo.'}
            </Text>

            <View className="mb-4">
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                Nome
              </Text>
              <TextInput
                value={nomeInput}
                onChangeText={(val) => {
                  setNomeInput(val);
                  if (inputError) setInputError('');
                }}
                placeholder="es. Functional Training"
                placeholderTextColor="#52525B"
                className={`bg-[#0D0D11] border rounded-xl px-4 h-12 text-white text-[15px] ${
                  inputError ? 'border-red-500' : 'border-[#282832] focus:border-[#FFB430]'
                }`}
                autoFocus
              />
              {inputError ? (
                <Text className="text-red-400 text-xs mt-1.5 ml-1">{inputError}</Text>
              ) : null}
            </View>

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={saving}
                className="flex-1 h-12 rounded-xl bg-[#282830] justify-center items-center border border-[#3A3A45]"
                activeOpacity={0.7}
              >
                <Text className="text-zinc-300 font-bold text-sm">Annulla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="flex-1 h-12 rounded-xl bg-[#FFB430] justify-center items-center shadow-md shadow-[#FFB430]/20"
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0D0D11" />
                ) : (
                  <Text className="text-[#0D0D11] font-bold text-sm">
                    {editingSpec ? 'Salva' : 'Aggiungi'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODALE CONFERMA ELIMINAZIONE */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setDeleteModalVisible(false);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-6">
          <View className="w-full max-w-sm bg-[#16161A] border border-[#282832] rounded-3xl p-6 items-center shadow-2xl">
            <View className="w-14 h-14 rounded-2xl bg-[#A0132C]/20 border border-[#A0132C]/40 justify-center items-center mb-4">
              <Ionicons name="trash-outline" size={28} color="#FF4D6D" />
            </View>

            <Text className="text-white text-lg font-bold text-center">
              Elimina specializzazione
            </Text>

            <Text className="text-zinc-400 text-sm text-center mt-2 leading-relaxed">
              Sei sicuro di voler eliminare <Text className="text-white font-bold">"{specToDelete?.nome}"</Text>?
            </Text>

            <View className="bg-[#A0132C]/10 border border-[#A0132C]/30 rounded-xl p-3 mt-4 w-full">
              <Text className="text-[#FF4D6D] text-xs text-center font-medium">
                Verrà rimossa automaticamente anche da tutti i Personal Trainer ({specToDelete?.conteggioPt || 0}) che l'hanno associata.
              </Text>
            </View>

            <View className="flex-row gap-3 w-full mt-6">
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-xl bg-[#282830] justify-center items-center border border-[#3A3A45]"
                activeOpacity={0.7}
              >
                <Text className="text-zinc-300 font-bold text-sm">Annulla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-xl bg-[#A0132C] justify-center items-center shadow-md shadow-[#A0132C]/20"
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-sm">Elimina</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
