import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOffline } from '../contexts/OfflineContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const OfflineContentScreen = () => {
  const [offlineCourses, setOfflineCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const { isOnline, getOfflineCourses, downloadCourse } = useOffline();
  const { theme } = useTheme();

  useEffect(() => {
    loadOfflineContent();
  }, []);

  const loadOfflineContent = async () => {
    try {
      const courses = await getOfflineCourses();
      setOfflineCourses(courses);
    } catch (error) {
      console.error('Error loading offline content:', error);
      Alert.alert('Error', 'Failed to load offline content');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCourse = async (courseId) => {
    if (!isOnline) {
      Alert.alert('Offline', 'You need internet connection to download courses');
      return;
    }

    try {
      const result = await downloadCourse(courseId);
      if (result.success) {
        Alert.alert('Success', 'Course downloaded for offline viewing');
        loadOfflineContent();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download course');
    }
  };

  const openOfflineCourse = (course) => {
    // Navigate to course detail with offline data
    navigation.navigate('CourseDetail', {
      course: JSON.parse(course.data),
      isOffline: true
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>Loading offline content...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Offline Content</Text>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]}>
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Offline Courses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Downloaded Courses ({offlineCourses.length})
          </Text>

          {offlineCourses.length > 0 ? (
            offlineCourses.map((course) => {
              const courseData = JSON.parse(course.data);
              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.courseCard, { backgroundColor: theme.colors.surface }]}
                  onPress={() => openOfflineCourse(course)}
                >
                  <View style={styles.courseIcon}>
                    <Ionicons name="book" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseTitle, { color: theme.colors.text }]}>
                      {courseData.title}
                    </Text>
                    <Text style={[styles.courseMeta, { color: theme.colors.textSecondary }]}>
                      {courseData.lesson_count} lessons • Downloaded {new Date(course.downloaded_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-download-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No offline content</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Download courses when online to access them offline
              </Text>
            </View>
          )}
        </View>

        {/* Download More */}
        {isOnline && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Download More Content
            </Text>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('Courses')}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                  Browse Available Courses
                </Text>
                <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                  Download courses for offline access
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Storage Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Storage Information
          </Text>

          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text }]}>
                Downloaded Courses:
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
                {offlineCourses.length}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.text }]}>
                Storage Used:
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
                ~{Math.round(offlineCourses.length * 50)} MB
              </Text>
            </View>
          </View>
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
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseMeta: {
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
    paddingHorizontal: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
  },
});

export default OfflineContentScreen;
