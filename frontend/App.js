import React, { useState, useEffect } from 'react';
import './global.css';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Text,
  Platform,
  StatusBar as RNStatusBar,
  Keyboard
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import HeroSection from './components/HeroSection';
import SearchBar from './components/SearchBar';
import FilterSelector from './components/FilterSelector';
import TrainerCard from './components/TrainerCard';
import AuthScreen from './components/AuthScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminScreen from './components/AdminScreen';
import { detectActiveApiUrl } from './config';

// Personal Trainers list (currently empty, ready for backend integration)
const TRAINERS = [];

export default function App() {
  const [search, setSearch] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [activeTab, setActiveTab] = useState('world');

  useEffect(() => {
    detectActiveApiUrl();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('world');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView 
        className="flex-1 bg-premiumDark"
        onStartShouldSetResponder={() => { Keyboard.dismiss(); return false; }}
      >
        <StatusBar style="light" />

      {/* Area Contenuto Principale */}
      <View style={{ flex: 1 }}>
        {/* Schermata Home (World) */}
        {activeTab === 'world' && (
          <View style={{ flex: 1 }}>
            {/* Header locale per la Home */}
            <View className="flex-row items-center justify-center py-1.5 border-b border-[#E09D20]/40 h-16 bg-[#FEB32F] z-50">
              <Image
                source={require('./assets/logo-esteso.png')}
                className="h-12 w-[260px]"
                resizeMode="contain"
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
              {/* Hero Banner / Intro */}
              <HeroSection />

              {/* Search Bar */}
              <SearchBar value={search} onChangeText={setSearch} />

              {/* Trainers Section */}
              {TRAINERS.length > 0 ? (
                <View className="mt-6">
                  <View className="flex-row justify-between items-center mx-5 mb-4">
                    <Text className="text-lg font-bold text-white">I migliori Professionisti</Text>
                    <TouchableOpacity>
                      <Text className="text-accentCyan text-sm font-semibold">Vedi tutti</Text>
                    </TouchableOpacity>
                  </View>

                  {TRAINERS.map((trainer) => (
                    <TrainerCard key={trainer.id} trainer={trainer} />
                  ))}
                </View>
              ) : (
                <View className="flex-1 justify-center items-center px-6 mt-12 py-8">
                  <Ionicons name="people-outline" size={56} color="#303038" className="mb-3" />
                  <Text className="text-zinc-400 font-bold text-base text-center">Nessun personal trainer disponibile</Text>
                  <Text className="text-zinc-600 text-xs text-center mt-1">Presto troverai qui i migliori professionisti certificati.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Schermata Schede Allenamento */}
        {activeTab === 'workout' && (
          <View style={{ flex: 1 }} className="bg-premiumDark">
            {/* Header locale per Allenamenti */}
            <View className="flex-row items-center justify-center py-3 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
              <Text className="text-lg font-bold text-white tracking-tight">Scheda di Allenamento</Text>
            </View>

            <View className="flex-1 justify-center items-center px-6">
              <Ionicons name="reader-outline" size={64} color="#303038" className="mb-4" />
              <Text className="text-zinc-500 font-bold text-lg text-center">Scheda di Allenamento</Text>
              <Text className="text-zinc-600 text-sm text-center mt-1">Nessuna scheda caricata per il momento.</Text>
            </View>
          </View>
        )}

        {/* Auth / Profile Screen */}
        {activeTab === 'profile' && (
          <View style={{ flex: 1 }}>
            {currentUser ? (
              <ProfileScreen
                user={currentUser}
                onLogout={handleLogout}
                onUpdateUser={setCurrentUser}
              />
            ) : (
              <AuthScreen
                visible={activeTab === 'profile'}
                onClose={() => setActiveTab('world')}
                mode={authMode}
                setMode={setAuthMode}
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                }}
              />
            )}
          </View>
        )}

        {/* Admin Screen Tab */}
        {activeTab === 'admin' && currentUser && (currentUser.admin || currentUser.isAdmin) && (
          <View style={{ flex: 1 }}>
            <AdminScreen
              user={currentUser}
            />
          </View>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View className="flex-row items-center justify-around py-4 bg-[#121216] border-t border-[#1F1F24] px-6 z-40">
        {/* Workout/Scheda tab */}
        <TouchableOpacity 
          className="items-center justify-center p-2" 
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab('workout');
          }}
        >
          <Ionicons name={activeTab === 'workout' ? "reader" : "reader-outline"} size={30} color={activeTab === 'workout' ? '#FFFFFF' : '#71717A'} />
        </TouchableOpacity>

        {/* Network/World tab */}
        <TouchableOpacity 
          className="items-center justify-center p-2" 
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab('world');
          }}
        >
          <Ionicons name="earth-outline" size={32} color={activeTab === 'world' ? '#FFFFFF' : '#71717A'} />
        </TouchableOpacity>

        {/* Admin Tab (visibile solo se admin) */}
        {currentUser && (currentUser.admin || currentUser.isAdmin) && (
          <TouchableOpacity 
            className="items-center justify-center p-2" 
            activeOpacity={0.7}
            onPress={() => {
              Keyboard.dismiss();
              setActiveTab('admin');
            }}
          >
            <Ionicons 
              name={activeTab === 'admin' ? "shield-checkmark" : "shield-checkmark-outline"} 
              size={30} 
              color={activeTab === 'admin' ? '#FFB430' : '#71717A'} 
            />
          </TouchableOpacity>
        )}

        {/* User profile tab */}
        <View>
          {currentUser ? (
            <TouchableOpacity 
              className={`w-11 h-11 rounded-full justify-center items-center overflow-hidden ${
                activeTab === 'profile' ? 'border-2 border-white bg-[#24242C]' : 'border border-[#303038]'
              }`}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                setActiveTab('profile');
              }}
            >
              {currentUser.urlImmagineProfilo ? (
                <Image source={{ uri: currentUser.urlImmagineProfilo }} className="w-full h-full" />
              ) : (
                <Ionicons name="person-outline" size={24} color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className={`w-11 h-11 rounded-full justify-center items-center bg-[#1E1E24] ${
                activeTab === 'profile' ? 'border-2 border-white' : 'border border-[#303038]'
              }`}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                setActiveTab('profile');
              }}
            >
              <Ionicons name="person-outline" size={24} color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}
