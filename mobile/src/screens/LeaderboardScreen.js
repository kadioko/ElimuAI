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

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('points');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const { user } = useAuth();
  const { theme } = useTheme();

  const leaderboardTypes = [
    { key: 'points', label: 'Points', icon: 'trophy-outline' },
    { key: 'courses', label: 'Courses', icon: 'book-outline' },
    { key: 'streak', label: 'Streak', icon: 'flame-outline' },
    { key: 'achievements', label: 'Achievements', icon: 'medal-outline' },
  ];

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedType, selectedPeriod]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const result = await ApiService.request(`/api/gamification/leaderboard/${selectedType}?period=${selectedPeriod}`);

      if (result.success) {
        setLeaderboard(result.leaderboard);
        setUserStats(result.user);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return theme.colors.textSecondary;
    }
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const isCurrentUser = item.id === user?.id;
    const rank = index + 1;

    return (
      <View style={[
        styles.leaderboardItem,
        { backgroundColor: theme.colors.surface },
        isCurrentUser && { borderColor: theme.colors.primary, borderWidth: 2 }
      ]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: getRankColor(rank) }]}>
            {getRankIcon(rank)}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.username, { color: theme.colors.text }]}>
              {item.username}
              {isCurrentUser && ' (You)'}
            </Text>
            <Text style={[styles.score, { color: theme.colors.textSecondary }]}>
              {item.score.toLocaleString()} {selectedType === 'points' ? 'pts' : selectedType === 'courses' ? 'courses' : selectedType === 'streak' ? 'days' : 'achievements'}
            </Text>
          </View>
        </View>

        {rank <= 3 && (
          <View style={styles.medalContainer}>
            <Ionicons
              name={rank === 1 ? 'trophy' : rank === 2 ? 'medal' : 'ribbon'}
              size={20}
              color={getRankColor(rank)}
            />
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
          Loading leaderboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Leaderboard
        </Text>
      </View>

      {/* Type Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeSelector}
        contentContainerStyle={styles.typeSelectorContainer}
      >
        {leaderboardTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeButton,
              {
                backgroundColor: selectedType === type.key ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setSelectedType(type.key)}
          >
            <Ionicons
              name={type.icon}
              size={16}
              color={selectedType === type.key ? 'white' : theme.colors.text}
            />
            <Text
              style={[
                styles.typeButtonText,
                {
                  color: selectedType === type.key ? 'white' : theme.colors.text,
                },
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period.key ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period.key ? 'white' : theme.colors.text,
                },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User Stats */}
      {userStats && (
        <View style={[styles.userStatsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.userStatsTitle, { color: theme.colors.text }]}>
            Your Rank
          </Text>
          <View style={styles.userStatsContent}>
            <Text style={[styles.userRank, { color: theme.colors.primary }]}>
              #{userStats.rank || 'Unranked'}
            </Text>
            <Text style={[styles.userScore, { color: theme.colors.text }]}>
              {userStats.score.toLocaleString()} {selectedType === 'points' ? 'points' : selectedType === 'courses' ? 'courses' : selectedType === 'streak' ? 'days' : 'achievements'}
            </Text>
          </View>
        </View>
      )}

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.leaderboardList}
        showsVerticalScrollIndicator={false}
      />
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
  },
  typeSelector: {
    marginVertical: 10,
  },
  typeSelectorContainer: {
    paddingHorizontal: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userStatsCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  userStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  userStatsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRank: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userScore: {
    fontSize: 16,
  },
  leaderboardList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  score: {
    fontSize: 14,
    marginTop: 2,
  },
  medalContainer: {
    width: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default LeaderboardScreen;
