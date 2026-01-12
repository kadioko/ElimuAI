import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ForumsScreen = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [topics, setTopics] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    loadCategories();
    loadTopics();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetch('https://elimuai.onrender.com/api/forums/categories', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        setCategories(result.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTopics = async () => {
    try {
      const url = selectedCategory === 'all'
        ? 'https://elimuai.onrender.com/api/forums/topics'
        : `https://elimuai.onrender.com/api/forums/categories/${selectedCategory}/topics`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        setTopics(result.topics || []);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const createTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://elimuai.onrender.com/api/forums/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          title: newTopicTitle,
          content: newTopicContent,
          category_id: selectedCategory === 'all' ? null : selectedCategory,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateModal(false);
        setNewTopicTitle('');
        setNewTopicContent('');
        loadTopics();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  const openTopic = (topic) => {
    navigation.navigate('ForumTopic', { topic });
  };

  const categoryIcons = {
    'general': 'chatbubbles-outline',
    'math': 'calculator-outline',
    'business': 'business-outline',
    'vocational': 'construct-outline',
    'study-tips': 'bulb-outline',
    'career': 'briefcase-outline',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Discussion Forums</Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.createButtonText}>New Topic</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: selectedCategory === 'all' ? 'white' : theme.colors.text,
                },
              ]}
            >
              All Topics
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={categoryIcons[category.slug] || 'chatbubbles-outline'}
                size={16}
                color={selectedCategory === category.id ? 'white' : theme.colors.text}
              />
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === category.id ? 'white' : theme.colors.text,
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Topics */}
        <View style={styles.topicsContainer}>
          {topics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.topicCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => openTopic(topic)}
            >
              <View style={styles.topicHeader}>
                <Text style={[styles.topicTitle, { color: theme.colors.text }]}>{topic.title}</Text>
                <Text style={[styles.topicTime, { color: theme.colors.textSecondary }]}>
                  {new Date(topic.created_at).toLocaleDateString()}
                </Text>
              </View>

              <Text style={[styles.topicPreview, { color: theme.colors.textSecondary }]}>
                {topic.content.substring(0, 100)}...
              </Text>

              <View style={styles.topicFooter}>
                <View style={styles.topicStats}>
                  <Ionicons name="eye-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.topicStatText, { color: theme.colors.textSecondary }]}>
                    {topic.view_count}
                  </Text>
                  <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.topicStatText, { color: theme.colors.textSecondary }]}>
                    {topic.reply_count}
                  </Text>
                </View>

                <Text style={[styles.topicAuthor, { color: theme.colors.textSecondary }]}>
                  by {topic.author_username}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {topics.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No topics yet</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Be the first to start a discussion in this category!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Topic Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Create New Topic</Text>

            <TextInput
              style={[styles.modalInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Topic Title"
              placeholderTextColor={theme.colors.textSecondary}
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
            />

            <TextInput
              style={[
                styles.modalInput,
                styles.modalTextarea,
                { borderColor: theme.colors.border, color: theme.colors.text }
              ]}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.colors.textSecondary}
              value={newTopicContent}
              onChangeText={setNewTopicContent}
              multiline
              numberOfLines={6}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton, { backgroundColor: theme.colors.primary }]}
                onPress={createTopic}
                disabled={loading}
              >
                <Text style={styles.createModalButtonText}>
                  {loading ? 'Posting...' : 'Post Topic'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  categoriesScroll: {
    marginVertical: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  topicsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topicCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  topicTime: {
    fontSize: 12,
  },
  topicPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicStatText: {
    fontSize: 12,
    marginLeft: 2,
    marginRight: 10,
  },
  topicAuthor: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalTextarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  createModalButton: {},
  createModalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ForumsScreen;
