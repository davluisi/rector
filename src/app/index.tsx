import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Image,
  Pressable,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// Custom Minimalist SVG-like Icons built using standard React Native Views for perfect cross-platform support.
const ProfileOminoIcon = ({ color = '#fff', size = 24 }) => (
  <View style={[styles.ominoContainer, { width: size, height: size }]}>
    <View style={[styles.ominoHead, { borderColor: color }]} />
    <View style={[styles.ominoBody, { borderColor: color }]} />
  </View>
);

const SearchIcon = ({ color = '#888', size = 20 }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.searchCircle, { borderColor: color }]} />
    <View style={[styles.searchHandle, { backgroundColor: color }]} />
  </View>
);

const StarIcon = ({ color = '#FFD700', size = 16 }) => (
  <View style={[styles.starContainer, { width: size, height: size }]}>
    <Text style={{ color, fontSize: size - 2, lineHeight: size }}>★</Text>
  </View>
);

// Mock Data for Personal Trainers
const TRAINERS_DATA = [
  {
    id: '1',
    name: 'Alessandro Rossi',
    specialties: ['Ipertrofia', 'Powerlifting', 'Forza'],
    rating: 4.9,
    reviews: 142,
    price: '€45 / ora',
    experience: '8 anni',
    bio: 'Specializzato nell\'allenamento della forza e ricomposizione corporea. Certificato ISSA e Project Invictus.',
    gradient: ['#ff007f', '#7f00ff'],
    initials: 'AR',
  },
  {
    id: '2',
    name: 'Giulia Bianchi',
    specialties: ['Dimagrimento', 'Pilates', 'Posturale'],
    rating: 5.0,
    reviews: 98,
    price: '€40 / ora',
    experience: '6 anni',
    bio: 'Laureata in Scienze Motorie, aiuto le persone a ritrovare il proprio benessere fisico e la corretta postura.',
    gradient: ['#00ffff', '#007fff'],
    initials: 'GB',
  },
  {
    id: '3',
    name: 'Marco Verdi',
    specialties: ['Calisthenics', 'Mobilità', 'Corpo Libero'],
    rating: 4.8,
    reviews: 86,
    price: '€35 / ora',
    experience: '5 anni',
    bio: 'Appassionato di corpo libero. Insegno le skills principali del Calisthenics in totale sicurezza.',
    gradient: ['#ff007f', '#ffaa00'],
    initials: 'MV',
  },
  {
    id: '4',
    name: 'Elena Moretti',
    specialties: ['Preparazione Atletica', 'Cardio', 'HIIT'],
    rating: 4.9,
    reviews: 110,
    price: '€50 / ora',
    experience: '10 anni',
    bio: 'Preparatrice atletica per atleti professionisti e amatoriali. Ottimizza le tue performance cardio e metaboliche.',
    gradient: ['#00ff66', '#00ffff'],
    initials: 'EM',
  },
];

const CATEGORIES = ['Tutti', 'Ipertrofia', 'Dimagrimento', 'Calisthenics', 'Preparazione Atletica', 'Posturale'];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [selectedTrainer, setSelectedTrainer] = useState<typeof TRAINERS_DATA[0] | null>(null);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Filter personal trainers based on search text and selected category chip
  const filteredTrainers = TRAINERS_DATA.filter((trainer) => {
    const matchesSearch =
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specialties.some((spec) => spec.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Tutti' ||
      trainer.specialties.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const handleLogin = () => {
    if (email && password) {
      setIsLoggedIn(true);
      setIsLoginModalVisible(false);
      setEmail('');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <Image
            source={require('../../images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Pressable
            style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
            onPress={() => setIsLoginModalVisible(true)}
          >
            {isLoggedIn ? (
              <View style={styles.avatarLogged}>
                <Text style={styles.avatarLoggedText}>U</Text>
              </View>
            ) : (
              <ProfileOminoIcon color="#00ffff" size={20} />
            )}
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* HERO BANNER SECTION */}
          <View style={styles.heroSection}>
            <Text style={styles.heroSubtitle}>MONDO PT</Text>
            <Text style={styles.heroTitle}>Trova il personal trainer più adatto a te</Text>
            <Text style={styles.heroDescription}>
              Raggiungi i tuoi obiettivi di fitness con professionisti qualificati, programmi personalizzati e monitoraggio costante.
            </Text>
          </View>

          {/* SEARCH BAR SECTION */}
          <View style={styles.searchContainer}>
            <SearchIcon color="#8892b0" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cerca personal trainer o specialità..."
              placeholderTextColor="#8892b0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* CATEGORIES ROW */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                >
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* PERSONAL TRAINERS LIST SECTION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Trainer Disponibili</Text>
            <Text style={styles.sectionCount}>{filteredTrainers.length} trovati</Text>
          </View>

          {filteredTrainers.length > 0 ? (
            filteredTrainers.map((trainer) => (
              <Pressable
                key={trainer.id}
                style={({ pressed }) => [styles.trainerCard, pressed && styles.cardPressed]}
                onPress={() => setSelectedTrainer(trainer)}
              >
                {/* Profile Avatar Graphic */}
                <View style={[styles.trainerAvatar, { backgroundColor: trainer.gradient[0] }]}>
                  <Text style={styles.trainerAvatarText}>{trainer.initials}</Text>
                </View>

                {/* Trainer Details */}
                <View style={styles.trainerInfo}>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  
                  <View style={styles.ratingRow}>
                    <StarIcon size={14} />
                    <Text style={styles.ratingText}>
                      {trainer.rating.toFixed(1)} ({trainer.reviews} recensioni)
                    </Text>
                  </View>

                  <View style={styles.specialtiesWrapper}>
                    {trainer.specialties.map((spec) => (
                      <View key={spec} style={styles.specBadge}>
                        <Text style={styles.specBadgeText}>{spec}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.trainerFooter}>
                    <Text style={styles.trainerPrice}>{trainer.price}</Text>
                    <Text style={styles.detailsBtnText}>Scopri di più →</Text>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nessun trainer corrisponde ai criteri inseriti.</Text>
            </View>
          )}
        </ScrollView>

        {/* PROFILE/LOGIN MODAL */}
        <Modal
          visible={isLoginModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsLoginModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isLoggedIn ? 'Profilo Utente' : 'Accedi a MondoPT'}</Text>
                <Pressable onPress={() => setIsLoginModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              {isLoggedIn ? (
                <View style={styles.profileModalBody}>
                  <View style={styles.profileAvatarBig}>
                    <Text style={styles.profileAvatarTextBig}>U</Text>
                  </View>
                  <Text style={styles.profileNameText}>Utente MondoPT</Text>
                  <Text style={styles.profileEmailText}>utente@mondopt.it</Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>12</Text>
                      <Text style={styles.statLabel}>Sessioni</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>2</Text>
                      <Text style={styles.statLabel}>Trainer Seguiti</Text>
                    </View>
                  </View>

                  <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutBtnText}>Disconnetti</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.loginForm}>
                  <Text style={styles.inputLabel}>Indirizzo Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="esempio@email.com"
                    placeholderTextColor="#556"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Inserisci password"
                    placeholderTextColor="#556"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />

                  <Pressable style={styles.loginSubmitBtn} onPress={handleLogin}>
                    <Text style={styles.loginSubmitBtnText}>Accedi</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* DETAILED PERSONAL TRAINER MODAL */}
        <Modal
          visible={selectedTrainer !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedTrainer(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.trainerModalContent]}>
              {selectedTrainer && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.trainerHeaderRow}>
                      <View style={[styles.trainerAvatar, { backgroundColor: selectedTrainer.gradient[0] }]}>
                        <Text style={styles.trainerAvatarText}>{selectedTrainer.initials}</Text>
                      </View>
                      <View style={styles.trainerHeaderTitleWrap}>
                        <Text style={styles.modalTitle}>{selectedTrainer.name}</Text>
                        <Text style={styles.trainerExpText}>Esp: {selectedTrainer.experience}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setSelectedTrainer(null)} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>✕</Text>
                    </Pressable>
                  </View>

                  <ScrollView style={styles.trainerDetailScroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionLabel}>Biografia</Text>
                    <Text style={styles.biographyText}>{selectedTrainer.bio}</Text>

                    <Text style={styles.sectionLabel}>Specializzazioni</Text>
                    <View style={styles.specialtiesWrapper}>
                      {selectedTrainer.specialties.map((spec) => (
                        <View key={spec} style={styles.specBadgeLarge}>
                          <Text style={styles.specBadgeTextLarge}>{spec}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.sectionLabel}>Tariffa Oraria</Text>
                    <Text style={styles.modalPriceText}>{selectedTrainer.price}</Text>

                    <Text style={styles.sectionLabel}>Recensioni</Text>
                    <View style={styles.reviewSummaryBox}>
                      <Text style={styles.reviewScore}>{selectedTrainer.rating.toFixed(1)}</Text>
                      <View style={styles.reviewStarsCol}>
                        <View style={styles.starsRow}>
                          <StarIcon size={14} />
                          <StarIcon size={14} />
                          <StarIcon size={14} />
                          <StarIcon size={14} />
                          <StarIcon size={14} />
                        </View>
                        <Text style={styles.reviewCountText}>{selectedTrainer.reviews} recensioni degli utenti</Text>
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.actionButtonsRow}>
                    <Pressable style={styles.secondaryActionBtn} onPress={() => alert('Messaggio inviato!')}>
                      <Text style={styles.secondaryActionText}>Invia Messaggio</Text>
                    </Pressable>
                    <Pressable style={styles.primaryActionBtn} onPress={() => alert('Sessione prenotata!')}>
                      <Text style={styles.primaryActionText}>Prenota Ora</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0D0E12',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D0E12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#161822',
  },
  logo: {
    height: 42,
    width: 150,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161822',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#222530',
  },
  pressed: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  heroSubtitle: {
    color: '#ff007f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 10,
  },
  heroDescription: {
    color: '#8892b0',
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161822',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222530',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    marginLeft: 10,
  },
  categoriesRow: {
    paddingLeft: 20,
    marginBottom: 25,
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#161822',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#222530',
  },
  categoryChipSelected: {
    backgroundColor: '#ff007f',
    borderColor: '#ff007f',
  },
  categoryText: {
    color: '#8892b0',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#00ffff',
    fontSize: 13,
    fontWeight: '600',
  },
  trainerCard: {
    flexDirection: 'row',
    backgroundColor: '#161822',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222530',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  trainerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  trainerAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  trainerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  trainerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: '#8892b0',
    fontSize: 12,
    marginLeft: 4,
  },
  specialtiesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  specBadge: {
    backgroundColor: '#222530',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specBadgeText: {
    color: '#00ffff',
    fontSize: 11,
    fontWeight: '600',
  },
  trainerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainerPrice: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  detailsBtnText: {
    color: '#ff007f',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#8892b0',
    fontSize: 14,
    textAlign: 'center',
  },
  // OMINO CUSTOM DRAWING
  ominoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ominoHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    marginBottom: 2,
  },
  ominoBody: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 1.5,
    borderBottomWidth: 0,
  },
  // SEARCH CUSTOM ICON
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    position: 'absolute',
    top: 2,
    left: 2,
  },
  searchHandle: {
    width: 1.5,
    height: 6,
    position: 'absolute',
    bottom: 2,
    right: 2,
    transform: [{ rotate: '-45deg' }],
  },
  starContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // MODALS STYLING
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161822',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
    borderWidth: 1,
    borderColor: '#222530',
  },
  trainerModalContent: {
    minHeight: 550,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222530',
    paddingBottom: 16,
    marginBottom: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222530',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  loginForm: {
    gap: 16,
  },
  inputLabel: {
    color: '#8892b0',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0D0E12',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#222530',
  },
  loginSubmitBtn: {
    backgroundColor: '#ff007f',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginSubmitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  avatarLogged: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00ffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoggedText: {
    color: '#0D0E12',
    fontSize: 14,
    fontWeight: '800',
  },
  profileModalBody: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  profileAvatarBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00ffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  profileAvatarTextBig: {
    color: '#0D0E12',
    fontSize: 32,
    fontWeight: '800',
  },
  profileNameText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmailText: {
    color: '#8892b0',
    fontSize: 14,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#0D0E12',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#222530',
  },
  statNumber: {
    color: '#ff007f',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#8892b0',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#222530',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  // TRAINER DETAIL MODAL STYLES
  trainerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerHeaderTitleWrap: {
    marginLeft: 15,
  },
  trainerExpText: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  trainerDetailScroll: {
    flex: 1,
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#ff007f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 15,
    marginBottom: 8,
  },
  biographyText: {
    color: '#8892b0',
    fontSize: 14,
    lineHeight: 22,
  },
  specBadgeLarge: {
    backgroundColor: '#0D0E12',
    borderWidth: 1,
    borderColor: '#222530',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specBadgeTextLarge: {
    color: '#00ffff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalPriceText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  reviewSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0E12',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222530',
  },
  reviewScore: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginRight: 15,
  },
  reviewStarsCol: {
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  reviewCountText: {
    color: '#8892b0',
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#222530',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#ff007f',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
