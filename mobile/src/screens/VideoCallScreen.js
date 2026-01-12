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
  TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

const VideoCallScreen = ({ navigation, route }) => {
  const [activeCalls, setActiveCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCall, setShowCreateCall] = useState(false);
  const [callTitle, setCallTitle] = useState('');
  const [callType, setCallType] = useState('video'); // 'audio' or 'video'
  const [userGroups, setUserGroups] = useState([]);

  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    loadActiveCalls();
    loadUserGroups();
  }, []);

  const loadActiveCalls = async () => {
    try {
      setLoading(true);
      const result = await ApiService.request('/api/social/video-calls/active');

      if (result.success) {
        setActiveCalls(result.calls);
      }
    } catch (error) {
      console.error('Error loading active calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserGroups = async () => {
    try {
      const result = await ApiService.request('/api/groups');

      if (result.success) {
        setUserGroups(result.groups);
      }
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  };

  const createVideoCall = async (groupId) => {
    try {
      const result = await ApiService.request('/api/social/video-calls', {
        method: 'POST',
        body: JSON.stringify({
          group_id: groupId,
          call_type: callType,
          title: callTitle || 'Group Call',
          max_participants: 10
        })
      });

      if (result.success) {
        Alert.alert('Success', 'Video call created! Joining now...');
        joinCall(result.call.id);
        setShowCreateCall(false);
        setCallTitle('');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error creating call:', error);
      Alert.alert('Error', 'Failed to create video call');
    }
  };

  const joinCall = async (callId) => {
    try {
      const result = await ApiService.request(`/api/social/video-calls/${callId}/join`, {
        method: 'POST'
      });

      if (result.success) {
        // Navigate to actual video call screen
        navigation.navigate('VideoCallRoom', {
          callData: result.call
        });
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error joining call:', error);
      Alert.alert('Error', 'Failed to join video call');
    }
  };

  const renderActiveCall = ({ item }) => {
    return (
      <View style={[styles.callCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.callHeader}>
          <View style={[styles.callIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="videocam" size={20} color="white" />
          </View>
          <View style={styles.callInfo}>
            <Text style={[styles.callTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.callGroup, { color: theme.colors.textSecondary }]}>
              {item.group_name}
            </Text>
          </View>
        </View>

        <View style={styles.callDetails}>
          <Text style={[styles.participants, { color: theme.colors.textSecondary }]}>
            {item.participant_count} participants
          </Text>
          <Text style={[styles.host, { color: theme.colors.textSecondary }]}>
            Hosted by {item.host_name}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: theme.colors.success }]}
          onPress={() => joinCall(item.id)}
        >
          <Ionicons name="enter" size={16} color="white" />
          <Text style={styles.joinButtonText}>Join Call</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGroupCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.groupCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => createVideoCall(item.id)}
      >
        <View style={[styles.groupIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="people" size={20} color="white" />
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.groupMembers, { color: theme.colors.textSecondary }]}>
            {item.member_count} members
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading video calls...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Video Calls
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowCreateCall(!showCreateCall)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Create Call Form */}
      {showCreateCall && (
        <View style={[styles.createCallForm, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>
            Start New Call
          </Text>

          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Call title (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={callTitle}
            onChangeText={setCallTitle}
          />

          <View style={styles.callTypeSelector}>
            <TouchableOpacity
              style={[
                styles.callTypeButton,
                {
                  backgroundColor: callType === 'video' ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setCallType('video')}
            >
              <Ionicons name="videocam" size={16} color={callType === 'video' ? 'white' : theme.colors.text} />
              <Text style={[styles.callTypeText, { color: callType === 'video' ? 'white' : theme.colors.text }]}>
                Video Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.callTypeButton,
                {
                  backgroundColor: callType === 'audio' ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setCallType('audio')}
            >
              <Ionicons name="mic" size={16} color={callType === 'audio' ? 'white' : theme.colors.text} />
              <Text style={[styles.callTypeText, { color: callType === 'audio' ? 'white' : theme.colors.text }]}>
                Audio Call
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.selectGroupText, { color: theme.colors.text }]}>
            Select a group to start the call:
          </Text>
        </View>
      )}

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Active Calls ({activeCalls.length})
          </Text>
          <FlatList
            data={activeCalls}
            renderItem={renderActiveCall}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.callsList}
          />
        </View>
      )}

      {/* User's Groups */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Start Call in Group
        </Text>

        {userGroups.length > 0 ? (
          <FlatList
            data={userGroups}
            renderItem={renderGroupCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.groupsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No study groups yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Join or create a study group to start video calls
            </Text>
          </View>
        )}
      </View>
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
  createCallForm: {
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
    marginBottom: 16,
  },
  callTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  callTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  callTypeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  selectGroupText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  callsList: {
    paddingRight: 20,
  },
  callCard: {
    width: width * 0.8,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  callIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  callInfo: {
    flex: 1,
  },
  callTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  callGroup: {
    fontSize: 14,
    marginTop: 2,
  },
  callDetails: {
    marginBottom: 16,
  },
  participants: {
    fontSize: 14,
  },
  host: {
    fontSize: 12,
    marginTop: 2,
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
  groupsList: {
    paddingBottom: 20,
  },
  groupCard: {
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
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupMembers: {
    fontSize: 14,
    marginTop: 2,
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

export default VideoCallScreen;
