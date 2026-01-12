import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentStreak: 0,
    coursesInProgress: 0,
    completedCourses: 0,
  });

  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('https://elimuai.onrender.com/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        setStats({
          totalPoints: result.stats?.total_points || 0,
          currentStreak: result.stats?.current_streak || 0,
          coursesInProgress: result.courses_in_progress?.length || 0,
          completedCourses: result.completed_courses?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const quickActions = [
    {
      title: 'AI Tutor',
      icon: 'robot-outline',
      color: '#4f46e5',
      onPress: () => navigation.navigate('Courses'),
    },
    {
      title: 'My Courses',
      icon: 'book-outline',
      color: '#059669',
      onPress: () => navigation.navigate('Courses'),
    },
    {
      title: 'Study Groups',
      icon: 'people-outline',
      color: '#dc2626',
      onPress: () => navigation.navigate('Groups'),
    },
    {
      title: 'Forums',
      icon: 'chatbubbles-outline',
      color: '#d97706',
      onPress: () => navigation.navigate('Forums'),
    },
  ];

  const recentActivities = [
    { id: 1, type: 'lesson', title: 'Completed Math Lesson 3', time: '2 hours ago' },
    { id: 2, type: 'quiz', title: 'Scored 85% on Business Quiz', time: '1 day ago' },
    { id: 3, type: 'badge', title: 'Earned "Quick Learner" badge', time: '2 days ago' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Hello, {user?.username || 'Student'}!</Text>
          <Text style={styles.subGreeting}>Ready to continue learning?</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.totalPoints}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Points</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="flame-outline" size={24} color="#ef4444" />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.currentStreak}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Day Streak</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="book-outline" size={24} color="#22c55e" />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.coursesInProgress}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>In Progress</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#8b5cf6" />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>{stats.completedCourses}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
              onPress={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
        {recentActivities.map((activity) => (
          <View key={activity.id} style={[styles.activityItem, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.activityIcon}>
              <Ionicons
                name={
                  activity.type === 'lesson' ? 'book-outline' :
                  activity.type === 'quiz' ? 'help-circle-outline' :
                  'ribbon-outline'
                }
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: theme.colors.text }]}>{activity.title}</Text>
              <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>{activity.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  notificationButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 50) / 2,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
});

export default HomeScreen;
