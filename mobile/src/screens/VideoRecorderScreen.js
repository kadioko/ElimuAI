import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

const VideoRecorderScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [uploading, setUploading] = useState(false);

  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      const videoRecordPromise = cameraRef.current.recordAsync();
      // Set a 5-minute timeout
      setTimeout(async () => {
        if (isRecording) {
          await stopRecording();
        }
      }, 300000); // 5 minutes
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current) return;

    try {
      const videoRecordPromise = cameraRef.current.recordAsync();
      if (videoRecordPromise) {
        const data = await videoRecordPromise;
        setRecordedVideo(data);
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  const playVideo = async () => {
    if (videoRef.current) {
      setIsPlaying(true);
      await videoRef.current.playAsync();
    }
  };

  const pauseVideo = async () => {
    if (videoRef.current) {
      setIsPlaying(false);
      await videoRef.current.pauseAsync();
    }
  };

  const uploadVideo = async () => {
    if (!recordedVideo) return;

    setUploading(true);
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', {
        uri: recordedVideo.uri,
        type: 'video/mp4',
        name: `lesson_video_${Date.now()}.mp4`,
      });
      formData.append('title', 'Recorded Lesson');
      formData.append('description', 'Video lesson recorded from mobile app');

      const response = await fetch('https://elimuai.onrender.com/api/videos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Video uploaded successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const discardVideo = () => {
    Alert.alert(
      'Discard Video',
      'Are you sure you want to discard this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setRecordedVideo(null);
            setIsPlaying(false);
          }
        }
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>No access to camera</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={getCameraPermissions}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Record Lesson
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Camera/Video View */}
      <View style={styles.cameraContainer}>
        {!recordedVideo ? (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            flashMode={flashMode}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                  onPress={toggleFlash}
                >
                  <Ionicons
                    name={flashMode === Camera.Constants.FlashMode.on ? "flash" : "flash-off"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                  onPress={toggleCameraType}
                >
                  <Ionicons name="camera-reverse" size={20} color="white" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && { backgroundColor: 'red' }
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons
                  name={isRecording ? "stop" : "radio-button-on"}
                  size={30}
                  color="white"
                />
              </TouchableOpacity>

              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <Text style={styles.recordingText}>REC</Text>
                </View>
              )}
            </View>
          </Camera>
        ) : (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: recordedVideo.uri }}
              useNativeControls
              resizeMode="contain"
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) {
                  setIsPlaying(false);
                }
              }}
            />

            <View style={styles.videoControls}>
              <TouchableOpacity
                style={[styles.videoButton, { backgroundColor: theme.colors.primary }]}
                onPress={uploadVideo}
                disabled={uploading}
              >
                <Ionicons name="cloud-upload" size={20} color="white" />
                <Text style={styles.videoButtonText}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.videoButton, { backgroundColor: theme.colors.error }]}
                onPress={discardVideo}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={styles.videoButtonText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        {!recordedVideo ? (
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            {isRecording
              ? 'Recording... Tap stop when finished'
              : 'Tap the record button to start recording your lesson'
            }
          </Text>
        ) : (
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            Review your video and upload when ready
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  cameraControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'red',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  videoButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default VideoRecorderScreen;
