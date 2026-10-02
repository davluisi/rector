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
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import HomeScreen from './components/HomeScreen';
import SearchBar from './components/SearchBar';
import FilterSelector from './components/FilterSelector';
import TrainerCard from './components/TrainerCard';
import AuthScreen from './components/AuthScreen';
import ProfileScreen from './components/ProfileScreen';
import { detectActiveApiUrl } from './config';

// Personal Trainers list (currently empty, ready for backend integration)
const TRAINERS = [];

function MainContent() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    detectActiveApiUrl();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <View 
      className="flex-1 bg-premiumDark"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
      onStartShouldSetResponder={() => { Keyboard.dismiss(); return false; }}
    >
      <StatusBar style="light" />

      {/* Area Contenuto Principale */}
      <View style={{ flex: 1 }}>
        {/* Schermata Home */}
        {activeTab === 'home' && (
          <View style={{ flex: 1 }} className="bg-premiumDark">
            {/* Header con Logo Rector al posto del banner */}
            <View className="flex-row items-center justify-center px-4 border-b border-[#1A1A1E] h-16 bg-premiumDark z-50">
              <Image
                source={require('./assets/logo-rector-no-sfonfo.png')}
                className="h-14 w-64"
                resizeMode="contain"
              />
            </View>

            <HomeScreen 
              user={currentUser} 
              onNavigateWorkout={() => setActiveTab('workout')}
              onNavigateProfile={() => setActiveTab('profile')}
            />
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
                onClose={() => setActiveTab('home')}
                mode={authMode}
                setMode={setAuthMode}
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                }}
              />
            )}
          </View>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View className="flex-row items-center justify-around py-2 bg-[#121216] border-t border-[#1F1F24] px-6 z-40">
        {/* Workout/Scheda tab */}
        <TouchableOpacity 
          className="items-center justify-center p-1.5" 
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab('workout');
          }}
        >
          <Ionicons name={activeTab === 'workout' ? "reader" : "reader-outline"} size={26} color={activeTab === 'workout' ? '#FFFFFF' : '#71717A'} />
        </TouchableOpacity>

        {/* Home tab */}
        <TouchableOpacity 
          className="items-center justify-center p-1.5" 
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            setActiveTab('home');
          }}
        >
          <Ionicons name={activeTab === 'home' ? "home" : "home-outline"} size={26} color={activeTab === 'home' ? '#FFFFFF' : '#71717A'} />
        </TouchableOpacity>

        {/* User profile tab */}
        <View>
          {currentUser ? (
            <TouchableOpacity 
              className={`w-9 h-9 rounded-full justify-center items-center overflow-hidden ${
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
                <Ionicons name="person-outline" size={20} color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className={`w-9 h-9 rounded-full justify-center items-center bg-[#1E1E24] ${
                activeTab === 'profile' ? 'border-2 border-white' : 'border border-[#303038]'
              }`}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                setActiveTab('profile');
              }}
            >
              <Ionicons name="person-outline" size={20} color={activeTab === 'profile' ? '#FFFFFF' : '#71717A'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainContent />
    </SafeAreaProvider>
  );
}
