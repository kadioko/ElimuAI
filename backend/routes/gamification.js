// Gamification System - Badges, Points, Achievements, Leaderboards
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Achievement definitions
const ACHIEVEMENTS = {
  // Course completion achievements
  FIRST_COURSE: {
    id: 'first_course',
    name: 'First Steps',
    description: 'Complete your first course',
    icon: '🎓',
    points: 100,
    category: 'learning',
    criteria: { courses_completed: 1 }
  },
  COURSE_MASTER: {
    id: 'course_master',
    name: 'Course Master',
    description: 'Complete 10 courses',
    icon: '🏆',
    points: 500,
    category: 'learning',
    criteria: { courses_completed: 10 }
  },

  // Study streak achievements
  STREAK_BEGINNER: {
    id: 'streak_beginner',
    name: 'Consistent Learner',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    points: 150,
    category: 'consistency',
    criteria: { streak_days: 7 }
  },
  STREAK_MASTER: {
    id: 'streak_master',
    name: 'Dedication Champion',
    description: 'Maintain a 30-day learning streak',
    icon: '👑',
    points: 1000,
    category: 'consistency',
    criteria: { streak_days: 30 }
  },

  // Social achievements
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Join 5 study groups',
    icon: '🦋',
    points: 200,
    category: 'social',
    criteria: { groups_joined: 5 }
  },
  GROUP_LEADER: {
    id: 'group_leader',
    name: 'Group Leader',
    description: 'Create your own study group',
    icon: '👥',
    points: 300,
    category: 'social',
    criteria: { groups_created: 1 }
  },

  // Quiz achievements
  QUIZ_WIZARD: {
    id: 'quiz_wizard',
    name: 'Quiz Wizard',
    description: 'Score 100% on 5 quizzes',
    icon: '🧙‍♂️',
    points: 250,
    category: 'performance',
    criteria: { perfect_quizzes: 5 }
  },

  // Time-based achievements
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 lessons before 8 AM',
    icon: '🐦',
    points: 200,
    category: 'habits',
    criteria: { early_lessons: 10 }
  },

  // Premium features
  PREMIUM_MEMBER: {
    id: 'premium_member',
    name: 'Premium Member',
    description: 'Subscribe to premium features',
    icon: '💎',
    points: 500,
    category: 'premium',
    criteria: { premium_subscription: true }
  }
};

// Award achievement to user
async function awardAchievement(userId, achievementId) {
  try {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return false;

    // Check if user already has this achievement
    const [existing] = await db.query(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );

    if (existing.length > 0) return false;

    // Award achievement
    await db.query(
      `INSERT INTO user_achievements (user_id, achievement_id, awarded_at, points_earned)
       VALUES (?, ?, NOW(), ?)`,
      [userId, achievementId, achievement.points]
    );

    // Award points
    await awardPoints(userId, achievement.points, `achievement_${achievementId}`);

    // Create notification
    await createNotification(userId, 'achievement', {
      achievement_id: achievementId,
      achievement_name: achievement.name,
      points: achievement.points
    });

    return true;
  } catch (error) {
    console.error('Award achievement error:', error);
    return false;
  }
}

// Check and award achievements based on user progress
async function checkAchievements(userId) {
  try {
    // Get user stats
    const [stats] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND completed = 1) as courses_completed,
        (SELECT COALESCE(MAX(streak_days), 0) FROM user_streaks WHERE user_id = ?) as current_streak,
        (SELECT COUNT(*) FROM user_groups WHERE user_id = ?) as groups_joined,
        (SELECT COUNT(*) FROM study_groups WHERE creator_id = ?) as groups_created,
        (SELECT COUNT(*) FROM user_quizzes WHERE user_id = ? AND score = 100) as perfect_quizzes,
        (SELECT COUNT(*) FROM user_sessions WHERE user_id = ? AND HOUR(start_time) < 8) as early_lessons,
        (SELECT COUNT(*) FROM user_subscriptions WHERE user_id = ? AND status = 'active') as premium_subscriptions
      FROM dual
    `, [userId, userId, userId, userId, userId, userId, userId]);

    const userStats = stats[0];

    // Check each achievement
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      let shouldAward = true;

      for (const [criteriaKey, criteriaValue] of Object.entries(achievement.criteria)) {
        const statValue = userStats[criteriaKey] || 0;
        if (statValue < criteriaValue) {
          shouldAward = false;
          break;
        }
      }

      if (shouldAward) {
        await awardAchievement(userId, achievement.id);
      }
    }
  } catch (error) {
    console.error('Check achievements error:', error);
  }
}

// Award points to user
async function awardPoints(userId, points, reason) {
  try {
    await db.query(
      'INSERT INTO user_points (user_id, points, reason, awarded_at) VALUES (?, ?, ?, NOW())',
      [userId, points, reason]
    );

    // Update total points
    await db.query(
      `UPDATE users SET total_points = (
        SELECT COALESCE(SUM(points), 0) FROM user_points WHERE user_id = ?
      ) WHERE id = ?`,
      [userId, userId]
    );

    return true;
  } catch (error) {
    console.error('Award points error:', error);
    return false;
  }
}

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [achievements] = await db.query(`
      SELECT
        ua.*,
        a.name,
        a.description,
        a.icon,
        a.category,
        a.points as base_points
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.awarded_at DESC
    `, [userId]);

    // Get available achievements (not yet earned)
    const [earnedIds] = await db.query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
      [userId]
    );

    const earnedIdSet = new Set(earnedIds.map(row => row.achievement_id));
    const availableAchievements = Object.values(ACHIEVEMENTS).filter(
      achievement => !earnedIdSet.has(achievement.id)
    );

    res.json({
      success: true,
      achievements,
      available_achievements: availableAchievements,
      total_earned: achievements.length,
      total_points: achievements.reduce((sum, a) => sum + a.points_earned, 0)
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

// Get leaderboard
router.get('/leaderboard/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params; // 'points', 'courses', 'streak', 'achievements'
    const { period = 'all', limit = 50 } = req.query; // period: 'week', 'month', 'all'

    let query, params = [parseInt(limit)];

    switch (type) {
      case 'points':
        if (period === 'week') {
          query = `
            SELECT u.id, u.username, u.avatar_url,
                   COALESCE(SUM(up.points), 0) as score,
                   ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC) as rank
            FROM users u
            LEFT JOIN user_points up ON u.id = up.user_id AND up.awarded_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
            GROUP BY u.id, u.username, u.avatar_url
            ORDER BY score DESC
            LIMIT ?
          `;
        } else if (period === 'month') {
          query = `
            SELECT u.id, u.username, u.avatar_url,
                   COALESCE(SUM(up.points), 0) as score,
                   ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC) as rank
            FROM users u
            LEFT JOIN user_points up ON u.id = up.user_id AND up.awarded_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            GROUP BY u.id, u.username, u.avatar_url
            ORDER BY score DESC
            LIMIT ?
          `;
        } else {
          query = `
            SELECT u.id, u.username, u.avatar_url, u.total_points as score,
                   ROW_NUMBER() OVER (ORDER BY u.total_points DESC) as rank
            FROM users u
            ORDER BY u.total_points DESC
            LIMIT ?
          `;
        }
        break;

      case 'courses':
        query = `
          SELECT u.id, u.username, u.avatar_url,
                 COUNT(up.id) as score,
                 ROW_NUMBER() OVER (ORDER BY COUNT(up.id) DESC) as rank
          FROM users u
          LEFT JOIN user_progress up ON u.id = up.user_id AND up.completed = 1
          GROUP BY u.id, u.username, u.avatar_url
          ORDER BY score DESC
          LIMIT ?
        `;
        break;

      case 'streak':
        query = `
          SELECT u.id, u.username, u.avatar_url,
                 COALESCE(us.streak_days, 0) as score,
                 ROW_NUMBER() OVER (ORDER BY COALESCE(us.streak_days, 0) DESC) as rank
          FROM users u
          LEFT JOIN user_streaks us ON u.id = us.user_id
          ORDER BY score DESC
          LIMIT ?
        `;
        break;

      case 'achievements':
        query = `
          SELECT u.id, u.username, u.avatar_url,
                 COUNT(ua.id) as score,
                 ROW_NUMBER() OVER (ORDER BY COUNT(ua.id) DESC) as rank
          FROM users u
          LEFT JOIN user_achievements ua ON u.id = ua.user_id
          GROUP BY u.id, u.username, u.avatar_url
          ORDER BY score DESC
          LIMIT ?
        `;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid leaderboard type'
        });
    }

    const [leaderboard] = await db.query(query, params);

    // Get current user's rank and score
    const userId = req.user.id;
    let userRank, userScore;

    if (type === 'points' && period === 'all') {
      const [userData] = await db.query(
        'SELECT total_points as score FROM users WHERE id = ?',
        [userId]
      );
      userScore = userData[0]?.score || 0;
    } else {
      // Calculate user's rank
      const rankQuery = query.replace('LIMIT ?', '').replace('ORDER BY score DESC', `ORDER BY score DESC, u.id = ${userId} DESC`);
      const [allRanks] = await db.query(rankQuery, []);
      const userEntry = allRanks.find(entry => entry.id === userId);
      userRank = userEntry?.rank || null;
      userScore = userEntry?.score || 0;
    }

    res.json({
      success: true,
      leaderboard,
      user: {
        rank: userRank,
        score: userScore
      },
      type,
      period
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Get user points history
router.get('/points/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [points] = await db.query(
      'SELECT * FROM user_points WHERE user_id = ? ORDER BY awarded_at DESC LIMIT ? OFFSET ?',
      [userId, parseInt(limit), offset]
    );

    const [total] = await db.query(
      'SELECT COUNT(*) as total FROM user_points WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      points,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].total,
        pages: Math.ceil(total[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Points history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch points history'
    });
  }
});

// Get user stats for gamification
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [stats] = await db.query(`
      SELECT
        u.total_points,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = ?) as achievements_count,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND completed = 1) as courses_completed,
        (SELECT COALESCE(MAX(streak_days), 0) FROM user_streaks WHERE user_id = ?) as current_streak,
        (SELECT COUNT(*) FROM user_groups WHERE user_id = ?) as groups_joined,
        (SELECT COUNT(*) FROM study_groups WHERE creator_id = ?) as groups_created,
        (SELECT AVG(score) FROM user_quizzes WHERE user_id = ?) as avg_quiz_score,
        (SELECT COUNT(*) FROM user_subscriptions WHERE user_id = ? AND status = 'active') as premium_subscriptions
      FROM users u
      WHERE u.id = ?
    `, [userId, userId, userId, userId, userId, userId, userId, userId]);

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats'
    });
  }
});

// Admin: Create custom achievement
router.post('/achievements', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, icon, points, category, criteria } = req.body;

    await db.query(
      `INSERT INTO achievements (id, name, description, icon, points, category, criteria, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [Date.now().toString(), name, description, icon, points, category, JSON.stringify(criteria)]
    );

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully'
    });
  } catch (error) {
    console.error('Create achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create achievement'
    });
  }
});

// Award achievement manually (admin)
router.post('/award/:userId/:achievementId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId, achievementId } = req.params;

    const success = await awardAchievement(userId, achievementId);

    if (success) {
      res.json({
        success: true,
        message: 'Achievement awarded successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Achievement already earned or invalid'
      });
    }
  } catch (error) {
    console.error('Award achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award achievement'
    });
  }
});

module.exports = {
  router,
  awardAchievement,
  checkAchievements,
  awardPoints,
  ACHIEVEMENTS
};
