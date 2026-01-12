import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

const AchievementsScreen = () => {
  const [achievements, setAchievements] = useState([]);
  const [availableAchievements, setAvailableAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { user } = useAuth();
  const { theme } = useTheme();

  const categories = [
    { key: 'all', label: 'All', icon: 'trophy-outline' },
    { key: 'learning', label: 'Learning', icon: 'book-outline' },
    { key: 'consistency', label: 'Consistency', icon: 'flame-outline' },
    { key: 'social', label: 'Social', icon: 'people-outline' },
    { key: 'performance', label: 'Performance', icon: 'star-outline' },
    { key: 'habits', label: 'Habits', icon: 'time-outline' },
    { key: 'premium', label: 'Premium', icon: 'diamond-outline' },
  ];

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [achievementsResult, statsResult] = await Promise.all([
        ApiService.request('/api/gamification/achievements'),
        ApiService.request('/api/gamification/stats')
      ]);

      if (achievementsResult.success) {
        setAchievements(achievementsResult.achievements);
        setAvailableAchievements(achievementsResult.available_achievements);
        setUserStats({
          totalEarned: achievementsResult.total_earned,
          totalPoints: achievementsResult.total_points,
          ...statsResult.stats
        });
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAchievements = () => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(a => a.category === selectedCategory);
  };

  const getFilteredAvailableAchievements = () => {
    if (selectedCategory === 'all') {
      return availableAchievements;
    }
    return availableAchievements.filter(a => a.category === selectedCategory);
  };

  const renderAchievementCard = (achievement, isEarned = false) => {
    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          {
            backgroundColor: isEarned ? theme.colors.surface : theme.colors.surface + '80',
            opacity: isEarned ? 1 : 0.7,
          }
        ]}
      >
        <View style={styles.achievementHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          </View>
          {isEarned && (
            <View style={[styles.earnedBadge, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          )}
        </View>

        <View style={styles.achievementContent}>
          <Text style={[styles.achievementName, { color: theme.colors.text }]}>
            {achievement.name}
          </Text>
          <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
            {achievement.description}
          </Text>
          <View style={styles.achievementFooter}>
            <Text style={[styles.pointsText, { color: theme.colors.primary }]}>
              +{achievement.points || achievement.base_points} points
            </Text>
            {isEarned && achievement.awarded_at && (
              <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                {new Date(achievement.awarded_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {!isEarned && (
          <View style={styles.lockedOverlay}>
            <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading achievements...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Achievements
        </Text>
        {userStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {userStats.totalEarned}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Earned
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {userStats.totalPoints}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Points
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                #{userStats.current_streak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Streak
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === category.key ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Ionicons
              name={category.icon}
              size={16}
              color={selectedCategory === category.key ? 'white' : theme.colors.text}
            />
            <Text
              style={[
                styles.categoryButtonText,
                {
                  color: selectedCategory === category.key ? 'white' : theme.colors.text,
                },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Earned Achievements */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Earned Achievements ({getFilteredAchievements().length})
          </Text>
          {getFilteredAchievements().length > 0 ? (
            <View style={styles.achievementsGrid}>
              {getFilteredAchievements().map((achievement) =>
                renderAchievementCard(achievement, true)
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No achievements earned yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Complete courses and challenges to unlock achievements!
              </Text>
            </View>
          )}
        </View>

        {/* Available Achievements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Available Achievements ({getFilteredAvailableAchievements().length})
          </Text>
          {getFilteredAvailableAchievements().length > 0 ? (
            <View style={styles.achievementsGrid}>
              {getFilteredAvailableAchievements().map((achievement) =>
                renderAchievementCard(achievement, false)
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="lock-closed-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                All achievements unlocked!
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Congratulations! You've earned all achievements in this category.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryFilter: {
    marginVertical: 10,
  },
  categoryFilterContainer: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: (width - 50) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  achievementHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIcon: {
    fontSize: 24,
  },
  earnedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    alignItems: 'center',
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  achievementFooter: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 10,
    marginTop: 2,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default AchievementsScreen;
