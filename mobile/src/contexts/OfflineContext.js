import React, { createContext, useContext, useState, useEffect } from 'react';
import { NetInfo } from '@react-native-community/netinfo';
import * as SQLite from 'expo-sqlite';

const OfflineContext = createContext();

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [db, setDb] = useState(null);

  useEffect(() => {
    // Initialize SQLite database
    const initDB = async () => {
      try {
        const database = SQLite.openDatabase('elimuai.db');
        setDb(database);
        createTables(database);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    initDB();

    return () => unsubscribe();
  }, []);

  const createTables = (database) => {
    database.transaction(tx => {
      // Courses table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS courses (
          id INTEGER PRIMARY KEY,
          title TEXT,
          description TEXT,
          category TEXT,
          lesson_count INTEGER,
          quiz_count INTEGER,
          is_premium INTEGER,
          progress REAL,
          data TEXT,
          downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        [],
        () => console.log('Courses table created'),
        (tx, error) => console.error('Error creating courses table:', error)
      );

      // Lessons table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS lessons (
          id INTEGER PRIMARY KEY,
          course_id INTEGER,
          title TEXT,
          content TEXT,
          video_url TEXT,
          quiz_data TEXT,
          data TEXT,
          downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses (id)
        )`,
        [],
        () => console.log('Lessons table created'),
        (tx, error) => console.error('Error creating lessons table:', error)
      );

      // User progress table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS user_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lesson_id INTEGER,
          progress REAL,
          completed INTEGER DEFAULT 0,
          last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lesson_id) REFERENCES lessons (id)
        )`,
        [],
        () => console.log('User progress table created'),
        (tx, error) => console.error('Error creating progress table:', error)
      );

      // Bookmarks table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lesson_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lesson_id) REFERENCES lessons (id)
        )`,
        [],
        () => console.log('Bookmarks table created'),
        (tx, error) => console.error('Error creating bookmarks table:', error)
      );

      // Notes table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lesson_id INTEGER,
          content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lesson_id) REFERENCES lessons (id)
        )`,
        [],
        () => console.log('Notes table created'),
        (tx, error) => console.error('Error creating notes table:', error)
      );
    });
  };

  const downloadCourse = async (courseId) => {
    try {
      // Fetch course data from API
      const response = await fetch(`https://elimuai.onrender.com/api/courses/${courseId}`);
      const courseData = await response.json();

      if (courseData.success) {
        // Save to SQLite
        db.transaction(tx => {
          tx.executeSql(
            'INSERT OR REPLACE INTO courses (id, title, description, category, lesson_count, quiz_count, is_premium, progress, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              courseData.course.id,
              courseData.course.title,
              courseData.course.description,
              courseData.course.category,
              courseData.course.lesson_count,
              courseData.course.quiz_count,
              courseData.course.is_premium ? 1 : 0,
              courseData.course.progress || 0,
              JSON.stringify(courseData.course)
            ],
            () => console.log('Course saved offline'),
            (tx, error) => console.error('Error saving course:', error)
          );
        });

        return { success: true };
      }
    } catch (error) {
      console.error('Error downloading course:', error);
      return { success: false, message: 'Download failed' };
    }
  };

  const getOfflineCourses = () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM courses ORDER BY downloaded_at DESC',
          [],
          (tx, results) => {
            const courses = [];
            for (let i = 0; i < results.rows.length; i++) {
              courses.push(results.rows.item(i));
            }
            resolve(courses);
          },
          (tx, error) => reject(error)
        );
      });
    });
  };

  const value = {
    isOnline,
    db,
    downloadCourse,
    getOfflineCourses,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};
