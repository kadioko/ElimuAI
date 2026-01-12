import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const ForumTopicScreen = () => {
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const scrollViewRef = useRef();

  const { topic: topicData } = route.params;

  useEffect(() => {
    if (topicData) {
      setTopic(topicData);
      loadReplies();
    }
  }, [topicData]);

  const loadReplies = async () => {
    try {
      const result = await ApiService.getForumTopic(topicData.id);
      if (result.success) {
        setTopic(result.topic);
        setReplies(result.replies || []);
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      Alert.alert('Error', 'Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  const postReply = async () => {
    if (!newReply.trim()) return;

    setPosting(true);
    try {
      const result = await ApiService.createForumReply(topic.id, newReply.trim());

      if (result.success) {
        setNewReply('');
        loadReplies(); // Refresh replies
        scrollToBottom();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading || !topic) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading topic...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {topic.title}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {replies.length} replies
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        onContentSizeChange={scrollToBottom}
      >
        {/* Original Post */}
        <View style={[styles.postCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {topic.author_username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.authorName, { color: theme.colors.text }]}>
                  {topic.author_username}
                </Text>
                <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>
                  {formatTime(topic.created_at)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.postContent, { color: theme.colors.text }]}>
            {topic.content}
          </Text>

          <View style={styles.postStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {topic.view_count}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {replies.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Replies */}
        {replies.map((reply) => (
          <View key={reply.id} style={[styles.replyCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.replyHeader}>
              <View style={styles.authorInfo}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.secondary }]}>
                  <Text style={styles.avatarText}>
                    {reply.author_username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.authorName, { color: theme.colors.text }]}>
                    {reply.author_username}
                  </Text>
                  <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>
                    {formatTime(reply.created_at)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.replyContent, { color: theme.colors.text }]}>
              {reply.content}
            </Text>
          </View>
        ))}

        {/* Bottom spacing for input */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reply Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Write a reply..."
          placeholderTextColor={theme.colors.textSecondary}
          value={newReply}
          onChangeText={setNewReply}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.postButton,
            {
              backgroundColor: newReply.trim() ? theme.colors.primary : theme.colors.border,
            }
          ]}
          onPress={postReply}
          disabled={!newReply.trim() || posting}
        >
          <Ionicons
            name="send"
            size={20}
            color={newReply.trim() ? 'white' : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  postCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postHeader: {
    marginBottom: 12,
  },
  authorInfo: {
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
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    marginLeft: 4,
  },
  replyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  replyHeader: {
    marginBottom: 8,
  },
  replyContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  postButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});

export default ForumTopicScreen;
