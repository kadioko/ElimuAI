import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://elimuai.onrender.com';

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config = {
      headers: { ...headers, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Courses
  async getCourses(language = 'en') {
    return this.request(`/api/courses?language=${language}`);
  }

  async getCourse(courseId, language = 'en') {
    return this.request(`/api/courses/${courseId}?language=${language}`);
  }

  async getLesson(lessonId, language = 'en') {
    return this.request(`/api/lessons/${lessonId}?language=${language}`);
  }

  // Dashboard
  async getDashboard() {
    return this.request('/api/dashboard');
  }

  // Gamification
  async getGamificationStats() {
    return this.request('/api/gamification/stats');
  }

  async getLeaderboard(timeframe = 'all', limit = 10) {
    return this.request(`/api/gamification/leaderboard?timeframe=${timeframe}&limit=${limit}`);
  }

  async awardPoints(action, points) {
    return this.request('/api/gamification/award', {
      method: 'POST',
      body: JSON.stringify({ action, points }),
    });
  }

  // Certificates
  async getCertificates() {
    return this.request('/api/certificates');
  }

  async generateCertificate(courseId) {
    return this.request(`/api/certificates/generate/${courseId}`, {
      method: 'POST',
    });
  }

  // Study Groups
  async getGroups() {
    return this.request('/api/groups');
  }

  async createGroup(groupData) {
    return this.request('/api/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async joinGroup(groupId) {
    return this.request(`/api/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async sendGroupMessage(groupId, message) {
    return this.request(`/api/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getGroupMessages(groupId, limit = 50) {
    return this.request(`/api/groups/${groupId}/messages?limit=${limit}`);
  }

  // Forums
  async getForumCategories() {
    return this.request('/api/forums/categories');
  }

  async getForumTopics(categoryId = null) {
    const endpoint = categoryId
      ? `/api/forums/categories/${categoryId}/topics`
      : '/api/forums/topics';
    return this.request(endpoint);
  }

  async createForumTopic(topicData) {
    return this.request('/api/forums/topics', {
      method: 'POST',
      body: JSON.stringify(topicData),
    });
  }

  async getForumTopic(topicId) {
    return this.request(`/api/forums/topics/${topicId}`);
  }

  async createForumReply(topicId, content) {
    return this.request(`/api/forums/topics/${topicId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Progress tracking
  async updateLessonProgress(lessonId, progress) {
    return this.request('/api/progress/lesson', {
      method: 'POST',
      body: JSON.stringify({ lesson_id: lessonId, progress }),
    });
  }

  async completeLesson(lessonId) {
    return this.request('/api/progress/complete', {
      method: 'POST',
      body: JSON.stringify({ lesson_id: lessonId }),
    });
  }

  async getUserProgress() {
    return this.request('/api/progress');
  }

  // Video upload
  async uploadVideo(videoData) {
    const headers = await this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set multipart boundary

    const formData = new FormData();
    formData.append('video', videoData);

    return this.request('/api/videos/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  // Push notifications
  async registerPushToken(token) {
    return this.request('/api/push/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform: 'mobile' }),
    });
  }

  // Bookmarks
  async getBookmarks() {
    return this.request('/api/bookmarks');
  }

  async addBookmark(lessonId) {
    return this.request('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ lesson_id: lessonId }),
    });
  }

  async removeBookmark(lessonId) {
    return this.request(`/api/bookmarks/${lessonId}`, {
      method: 'DELETE',
    });
  }

  // Notes
  async getNotes(lessonId = null) {
    const endpoint = lessonId ? `/api/notes?lesson_id=${lessonId}` : '/api/notes';
    return this.request(endpoint);
  }

  async saveNote(noteData) {
    return this.request('/api/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async updateNote(noteId, content) {
    return this.request(`/api/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteNote(noteId) {
    return this.request(`/api/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  // Offline sync
  async syncOfflineData(offlineData) {
    return this.request('/api/sync/offline', {
      method: 'POST',
      body: JSON.stringify(offlineData),
    });
  }

  // Search
  async searchCourses(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/api/search/courses?${params}`);
  }

  async searchLessons(query, courseId = null) {
    const params = new URLSearchParams({ q: query });
    if (courseId) params.append('course_id', courseId);
    return this.request(`/api/search/lessons?${params}`);
  }
}

export default new ApiService();
