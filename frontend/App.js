import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock data for Personal Trainers
const TRAINERS = [
  {
    id: '1',
    name: 'Marco Rossi',
    specialties: ['Bodybuilding', 'Powerlifting'],
    rating: 4.9,
    reviews: 124,
    price: '40',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: '2',
    name: 'Elena Bianchi',
    specialties: ['Pilates', 'Dimagrimento', 'Yoga'],
    rating: 5.0,
    reviews: 98,
    price: '45',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: '3',
    name: 'Luca Moretti',
    specialties: ['Crossfit', 'Funzionale', 'Kettlebell'],
    rating: 4.8,
    reviews: 86,
    price: '35',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
  },
];

export default function App() {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tutti');

  const filters = ['Tutti', 'Bodybuilding', 'Dimagrimento', 'Funzionale', 'Pilates'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('./assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.loginButton} activeOpacity={0.7}>
          <Ionicons name="person-circle-outline" size={32} color="#00F0FF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero Banner / Intro */}
        <View style={styles.heroContainer}>
          <Text style={styles.heroTitle}>Trova il personal trainer</Text>
          <Text style={styles.heroAccent}>più adatto a te</Text>
          <Text style={styles.heroSubtitle}>
            Ti alleni dove e quando vuoi, supportato da professionisti certificati.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            placeholder="Cerca per nome, città o specialità..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.filterIconButton}>
            <Ionicons name="options-outline" size={20} color="#FF2E93" />
          </TouchableOpacity>
        </View>

        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterTag,
                selectedFilter === filter && styles.filterTagActive
              ]}
            >
              <Text style={[
                styles.filterTagText,
                selectedFilter === filter && styles.filterTagTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trainers Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>I migliori Professionisti</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Vedi tutti</Text>
          </TouchableOpacity>
        </View>

        {/* Trainer Cards */}
        {TRAINERS.map((trainer) => (
          <TouchableOpacity key={trainer.id} style={styles.card} activeOpacity={0.95}>
            <Image source={{ uri: trainer.avatar }} style={styles.avatar} />
            <View style={styles.cardDetails}>
              <View style={styles.cardHeader}>
                <Text style={styles.trainerName}>{trainer.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{trainer.rating}</Text>
                </View>
              </View>

              <View style={styles.specialtiesContainer}>
                {trainer.specialties.map((spec, idx) => (
                  <View key={idx} style={styles.specialtyBadge}>
                    <Text style={styles.specialtyText}>{spec}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.priceText}>
                  da <Text style={styles.priceHighlight}>{trainer.price}€</Text>/ora
                </Text>
                <View style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Profilo</Text>
                  <Ionicons name="chevron-forward" size={14} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Bottom Banner for Motivation */}
        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>Sei un Personal Trainer?</Text>
          <Text style={styles.promoSubtitle}>Unisciti a MondoPT per ampliare la tua clientela e gestire il tuo business.</Text>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={styles.promoButtonText}>Inizia Ora</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10', // Deep Premium Dark Background
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1E',
  },
  logo: {
    height: 48,
    width: 150,
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E24',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#303038',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00F0FF', // Cyan accent from Logo
    textTransform: 'uppercase',
    marginTop: 2,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#A1A1AA',
    marginTop: 8,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  filterIconButton: {
    padding: 6,
  },
  filtersContainer: {
    marginTop: 16,
    paddingLeft: 20,
  },
  filtersContent: {
    paddingRight: 40,
  },
  filterTag: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  filterTagActive: {
    backgroundColor: '#FF2E93', // Pink accent from Logo
    borderColor: '#FF2E93',
  },
  filterTagText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTagTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllText: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#18181C',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#282830',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#2C2C35',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  specialtyBadge: {
    backgroundColor: '#26262B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceText: {
    color: '#71717A',
    fontSize: 13,
  },
  priceHighlight: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2E93',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  promoCard: {
    backgroundColor: '#1E1B29', // Dark Purple-ish shade
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3B2F52',
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  promoSubtitle: {
    fontSize: 13,
    color: '#B4B0C4',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  promoButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  promoButtonText: {
    color: '#1E1B29',
    fontSize: 14,
    fontWeight: '700',
  },
});
