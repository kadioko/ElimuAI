import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

const CollaborativeProjectsScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const { user } = useAuth();
  const { theme } = useTheme();

  const categories = [
    { key: 'all', label: 'All Projects', icon: 'folder-outline' },
    { key: 'academic', label: 'Academic', icon: 'school-outline' },
    { key: 'practical', label: 'Practical', icon: 'build-outline' },
    { key: 'research', label: 'Research', icon: 'search-outline' },
    { key: 'creative', label: 'Creative', icon: 'color-palette-outline' },
  ];

  const difficulties = [
    { key: 'all', label: 'All Levels' },
    { key: 'beginner', label: 'Beginner' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    loadProjects();
  }, [selectedCategory, selectedDifficulty]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);

      const result = await ApiService.request(`/api/social/projects?${params.toString()}`);

      if (result.success) {
        setProjects(result.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinProject = async (projectId, projectTitle) => {
    Alert.alert(
      'Join Project',
      `Are you sure you want to join "${projectTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              const result = await ApiService.request(`/api/social/projects/${projectId}/join`, {
                method: 'POST'
              });

              if (result.success) {
                Alert.alert('Success', 'Successfully joined the project!');
                loadProjects(); // Refresh the list
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('Error joining project:', error);
              Alert.alert('Error', 'Failed to join project');
            }
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return theme.colors.textSecondary;
    }
  };

  const getProjectTypeIcon = (type) => {
    switch (type) {
      case 'academic': return 'school';
      case 'practical': return 'build';
      case 'research': return 'search';
      case 'creative': return 'color-palette';
      default: return 'folder';
    }
  };

  const renderProjectCard = ({ item }) => {
    const isFull = item.participant_count >= item.max_participants;
    const canJoin = !isFull && item.creator_id !== user?.id;

    return (
      <View style={[styles.projectCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.projectHeader}>
          <View style={[styles.projectIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name={getProjectTypeIcon(item.project_type)} size={20} color="white" />
          </View>
          <View style={styles.projectMeta}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty_level) }]}>
              <Text style={styles.difficultyText}>
                {item.difficulty_level}
              </Text>
            </View>
            <Text style={[styles.participants, { color: theme.colors.textSecondary }]}>
              {item.participant_count}/{item.max_participants}
            </Text>
          </View>
        </View>

        <View style={styles.projectContent}>
          <Text style={[styles.projectTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.projectDescription, { color: theme.colors.textSecondary }]}>
            {item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description}
          </Text>

          <View style={styles.projectDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {item.estimated_duration} days
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {item.creator_name}
              </Text>
            </View>
          </View>

          {item.skills_required && item.skills_required.length > 0 && (
            <View style={styles.skillsContainer}>
              <Text style={[styles.skillsLabel, { color: theme.colors.textSecondary }]}>
                Skills needed:
              </Text>
              <View style={styles.skillsList}>
                {JSON.parse(item.skills_required).slice(0, 3).map((skill, index) => (
                  <View key={index} style={[styles.skillBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.skillText, { color: theme.colors.primary }]}>
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.projectFooter}>
          {canJoin ? (
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => joinProject(item.id, item.title)}
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text style={styles.joinButtonText}>Join Project</Text>
            </TouchableOpacity>
          ) : isFull ? (
            <View style={[styles.fullButton, { backgroundColor: theme.colors.error }]}>
              <Ionicons name="people" size={16} color="white" />
              <Text style={styles.fullButtonText}>Project Full</Text>
            </View>
          ) : (
            <View style={[styles.ownerButton, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={styles.ownerButtonText}>Your Project</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading projects...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Collaborative Projects
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('CreateProject')}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
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
                styles.filterButton,
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
                  styles.filterButtonText,
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

        <View style={styles.difficultyFilter}>
          {difficulties.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.key}
              style={[
                styles.difficultyButton,
                {
                  backgroundColor: selectedDifficulty === difficulty.key ? theme.colors.primary : 'transparent',
                },
              ]}
              onPress={() => setSelectedDifficulty(difficulty.key)}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  {
                    color: selectedDifficulty === difficulty.key ? 'white' : theme.colors.text,
                  },
                ]}
              >
                {difficulty.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Projects List */}
      <FlatList
        data={projects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.projectsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No projects found
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Be the first to create a collaborative project in this category!
            </Text>
          </View>
        }
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
  filters: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContainer: {
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  difficultyFilter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  difficultyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  projectCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectMeta: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  participants: {
    fontSize: 12,
  },
  projectContent: {
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  projectDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  projectFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  fullButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  ownerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  ownerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default CollaborativeProjectsScreen;
