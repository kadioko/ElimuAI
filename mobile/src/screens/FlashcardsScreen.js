import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

const FlashcardsScreen = ({ navigation }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studying, setStudying] = useState(false);
  const [studyMode, setStudyMode] = useState('review'); // 'review', 'new', 'difficult'
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [newCard, setNewCard] = useState({
    question: '',
    answer: '',
    hint: '',
    difficulty_level: 'medium',
    lesson_id: null
  });

  const { user } = useAuth();
  const { theme } = useTheme();
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadFlashcards();
  }, [studyMode]);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const params = studyMode === 'review' ? { due_only: 'true' } : {};
      const result = await ApiService.request(`/api/learning-tools/flashcards?${new URLSearchParams(params).toString()}`);

      if (result.success) {
        setFlashcards(result.flashcards);
        setCurrentCardIndex(0);
        setShowAnswer(false);
      }
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const flipCard = () => {
    Animated.spring(flipAnimation, {
      toValue: showAnswer ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setShowAnswer(!showAnswer);
  };

  const handleCardReview = async (quality) => {
    try {
      const currentCard = flashcards[currentCardIndex];
      const result = await ApiService.request(`/api/learning-tools/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ quality })
      });

      if (result.success) {
        // Move to next card
        if (currentCardIndex < flashcards.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1);
          setShowAnswer(false);
          flipAnimation.setValue(0);
        } else {
          // Finished studying
          Alert.alert(
            'Study Session Complete!',
            `You've reviewed all ${flashcards.length} cards. Great job!`,
            [
              { text: 'Continue Studying', onPress: () => loadFlashcards() },
              { text: 'Done', onPress: () => setStudying(false) }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error reviewing card:', error);
      Alert.alert('Error', 'Failed to save review');
    }
  };

  const createFlashcard = async () => {
    try {
      if (!newCard.question.trim() || !newCard.answer.trim()) {
        Alert.alert('Error', 'Please fill in both question and answer');
        return;
      }

      const result = await ApiService.request('/api/learning-tools/flashcards', {
        method: 'POST',
        body: JSON.stringify(newCard)
      });

      if (result.success) {
        Alert.alert('Success', 'Flashcard created successfully!');
        setNewCard({
          question: '',
          answer: '',
          hint: '',
          difficulty_level: 'medium',
          lesson_id: null
        });
        setShowCreateForm(false);
        loadFlashcards();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error creating flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard');
    }
  };

  const deleteFlashcard = async (cardId) => {
    Alert.alert(
      'Delete Flashcard',
      'Are you sure you want to delete this flashcard?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await ApiService.request(`/api/learning-tools/flashcards/${cardId}`, {
                method: 'DELETE'
              });

              if (result.success) {
                loadFlashcards();
              }
            } catch (error) {
              console.error('Error deleting flashcard:', error);
              Alert.alert('Error', 'Failed to delete flashcard');
            }
          }
        }
      ]
    );
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading flashcards...
        </Text>
      </View>
    );
  }

  if (studying && flashcards.length > 0) {
    const currentCard = flashcards[currentCardIndex];

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.studyHeader}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setStudying(false)}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.studyTitle, { color: theme.colors.text }]}>
            {currentCardIndex + 1} of {flashcards.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` },
                { backgroundColor: theme.colors.primary }
              ]}
            />
          </View>
        </View>

        {/* Flashcard */}
        <View style={styles.cardContainer}>
          <TouchableOpacity onPress={flipCard} activeOpacity={0.9}>
            <View>
              {/* Front of card */}
              <Animated.View style={[styles.card, frontAnimatedStyle, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardLabel, { color: 'white' }]}>Question</Text>
                  <Text style={[styles.cardText, { color: 'white' }]}>
                    {currentCard.question}
                  </Text>
                  {currentCard.hint && (
                    <Text style={[styles.hint, { color: 'rgba(255,255,255,0.8)' }]}>
                      💡 Hint: {currentCard.hint}
                    </Text>
                  )}
                  <Text style={[styles.tapHint, { color: 'rgba(255,255,255,0.6)' }]}>
                    Tap to reveal answer
                  </Text>
                </View>
              </Animated.View>

              {/* Back of card */}
              <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle, { backgroundColor: theme.colors.success }]}>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardLabel, { color: 'white' }]}>Answer</Text>
                  <Text style={[styles.cardText, { color: 'white' }]}>
                    {currentCard.answer}
                  </Text>
                </View>
              </Animated.View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Review Buttons */}
        {showAnswer && (
          <View style={styles.reviewButtons}>
            <Text style={[styles.reviewPrompt, { color: theme.colors.text }]}>
              How well did you remember this?
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.reviewButton, { backgroundColor: '#ef4444' }]}
                onPress={() => handleCardReview(0)}
              >
                <Text style={styles.reviewButtonText}>Hard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewButton, { backgroundColor: '#f59e0b' }]}
                onPress={() => handleCardReview(3)}
              >
                <Text style={styles.reviewButtonText}>Good</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewButton, { backgroundColor: '#22c55e' }]}
                onPress={() => handleCardReview(5)}
              >
                <Text style={styles.reviewButtonText}>Easy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Card Info */}
        <View style={styles.cardInfo}>
          <View style={[styles.difficultyBadge, {
            backgroundColor: currentCard.difficulty_level === 'easy' ? '#22c55e' :
                           currentCard.difficulty_level === 'medium' ? '#f59e0b' : '#ef4444'
          }]}>
            <Text style={styles.difficultyText}>
              {currentCard.difficulty_level}
            </Text>
          </View>
          <Text style={[styles.reviewInfo, { color: theme.colors.textSecondary }]}>
            Reviewed {currentCard.review_count} times
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Flashcards
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Study Mode Selector */}
      <View style={styles.modeSelector}>
        {[
          { key: 'review', label: 'Due Cards', icon: 'time-outline' },
          { key: 'new', label: 'All Cards', icon: 'library-outline' },
          { key: 'difficult', label: 'Difficult', icon: 'alert-circle-outline' }
        ].map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[
              styles.modeButton,
              {
                backgroundColor: studyMode === mode.key ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setStudyMode(mode.key)}
          >
            <Ionicons
              name={mode.icon}
              size={16}
              color={studyMode === mode.key ? 'white' : theme.colors.text}
            />
            <Text
              style={[
                styles.modeButtonText,
                {
                  color: studyMode === mode.key ? 'white' : theme.colors.text,
                },
              ]}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create Form */}
      {showCreateForm && (
        <View style={[styles.createForm, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>
            Create New Flashcard
          </Text>

          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Question"
            placeholderTextColor={theme.colors.textSecondary}
            value={newCard.question}
            onChangeText={(text) => setNewCard({ ...newCard, question: text })}
            multiline
          />

          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Answer"
            placeholderTextColor={theme.colors.textSecondary}
            value={newCard.answer}
            onChangeText={(text) => setNewCard({ ...newCard, answer: text })}
            multiline
          />

          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Hint (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={newCard.hint}
            onChangeText={(text) => setNewCard({ ...newCard, hint: text })}
          />

          <View style={styles.difficultySelector}>
            {['easy', 'medium', 'hard'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyOption,
                  {
                    backgroundColor: newCard.difficulty_level === level ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setNewCard({ ...newCard, difficulty_level: level })}
              >
                <Text
                  style={[
                    styles.difficultyOptionText,
                    {
                      color: newCard.difficulty_level === level ? 'white' : theme.colors.text,
                    },
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowCreateForm(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={createFlashcard}
            >
              <Text style={styles.saveButtonText}>Create Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Flashcards List */}
      <FlatList
        data={flashcards}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.flashcardsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No flashcards yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Create flashcards to improve your memory retention with spaced repetition.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.flashcardItem, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.flashcardHeader}>
              <View style={[styles.difficultyBadge, {
                backgroundColor: item.difficulty_level === 'easy' ? '#22c55e' :
                               item.difficulty_level === 'medium' ? '#f59e0b' : '#ef4444'
              }]}>
                <Text style={styles.difficultyText}>
                  {item.difficulty_level}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteFlashcard(item.id)}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.questionText, { color: theme.colors.text }]}>
              Q: {item.question}
            </Text>
            <Text style={[styles.answerText, { color: theme.colors.textSecondary }]}>
              A: {item.answer}
            </Text>

            <View style={styles.flashcardFooter}>
              <Text style={[styles.reviewCount, { color: theme.colors.textSecondary }]}>
                Reviewed {item.review_count} times
              </Text>
              <Text style={[styles.nextReview, { color: theme.colors.textSecondary }]}>
                Next: {new Date(item.next_review).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Start Studying Button */}
      {flashcards.length > 0 && (
        <View style={styles.startButtonContainer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setStudying(true)}
          >
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.startButtonText}>
              Start Studying ({flashcards.length} cards)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  createForm: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  difficultySelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  flashcardsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  flashcardItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    marginBottom: 12,
  },
  flashcardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewCount: {
    fontSize: 12,
  },
  nextReview: {
    fontSize: 12,
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  studyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    height: height * 0.5,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  cardText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  hint: {
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tapHint: {
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  reviewButtons: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  reviewPrompt: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reviewButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default FlashcardsScreen;
