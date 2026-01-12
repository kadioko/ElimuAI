// Advanced Learning Tools - Interactive Quizzes, Flashcards, Notes, Spaced Repetition
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateInput } = require('../middleware/security');
const Joi = require('joi');

// Validation schemas
const flashcardSchema = Joi.object({
  lesson_id: Joi.number().integer().required(),
  question: Joi.string().min(5).max(500).required(),
  answer: Joi.string().min(1).max(1000).required(),
  hint: Joi.string().max(200).allow(''),
  difficulty_level: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  tags: Joi.array().items(Joi.string().max(50))
});

const noteSchema = Joi.object({
  lesson_id: Joi.number().integer(),
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).max(5000).required(),
  tags: Joi.array().items(Joi.string().max(50)),
  is_public: Joi.boolean().default(false),
  category: Joi.string().valid('summary', 'key_points', 'questions', 'examples', 'personal').default('summary')
});

const quizAttemptSchema = Joi.object({
  quiz_id: Joi.number().integer().required(),
  answers: Joi.object().required(), // { question_id: answer }
  time_spent: Joi.number().integer().min(0) // seconds
});

// Flashcards Management
router.post('/flashcards', authenticateToken, validateInput(flashcardSchema), async (req, res) => {
  try {
    const flashcardData = {
      ...req.body,
      user_id: req.user.id,
      created_at: new Date(),
      last_reviewed: new Date(),
      review_count: 0,
      ease_factor: 2.5, // SM-2 algorithm starting value
      interval_days: 1,
      next_review: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };

    const [result] = await db.query(
      `INSERT INTO flashcards (user_id, lesson_id, question, answer, hint, difficulty_level, tags, created_at, last_reviewed, review_count, ease_factor, interval_days, next_review)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        flashcardData.user_id,
        flashcardData.lesson_id,
        flashcardData.question,
        flashcardData.answer,
        flashcardData.hint || null,
        flashcardData.difficulty_level,
        JSON.stringify(flashcardData.tags || []),
        flashcardData.created_at,
        flashcardData.last_reviewed,
        flashcardData.review_count,
        flashcardData.ease_factor,
        flashcardData.interval_days,
        flashcardData.next_review
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Flashcard created successfully',
      flashcardId: result.insertId
    });

  } catch (error) {
    console.error('Create flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create flashcard'
    });
  }
});

// Get user's flashcards
router.get('/flashcards', authenticateToken, async (req, res) => {
  try {
    const { lesson_id, due_only = false, limit = 50 } = req.query;
    const userId = req.user.id;

    let whereConditions = ['f.user_id = ?'];
    let params = [userId];

    if (lesson_id) {
      whereConditions.push('f.lesson_id = ?');
      params.push(lesson_id);
    }

    if (due_only === 'true') {
      whereConditions.push('f.next_review <= NOW()');
    }

    const whereClause = whereConditions.join(' AND ');

    const [flashcards] = await db.query(`
      SELECT f.*, l.title as lesson_title, c.title as course_title
      FROM flashcards f
      LEFT JOIN lessons l ON f.lesson_id = l.id
      LEFT JOIN courses c ON l.course_id = c.id
      WHERE ${whereClause}
      ORDER BY f.next_review ASC, f.created_at DESC
      LIMIT ?
    `, [...params, parseInt(limit)]);

    res.json({
      success: true,
      flashcards,
      total: flashcards.length
    });

  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get flashcards'
    });
  }
});

// Update flashcard review (SM-2 Algorithm)
router.post('/flashcards/:id/review', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quality } = req.body; // 0-5 rating of recall quality
    const userId = req.user.id;

    // Get current flashcard data
    const [flashcard] = await db.query(
      'SELECT * FROM flashcards WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!flashcard.length) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    const card = flashcard[0];

    // SM-2 Algorithm implementation
    let { ease_factor, interval_days, review_count } = card;

    if (quality >= 3) {
      // Correct response
      if (review_count === 0) {
        interval_days = 1;
      } else if (review_count === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }

      ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
      // Incorrect response
      interval_days = 1;
      review_count = 0; // Reset to beginning of cycle
    }

    // Ensure bounds
    ease_factor = Math.max(1.3, ease_factor);
    interval_days = Math.max(1, Math.min(365, interval_days));

    const nextReview = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000);
    const newReviewCount = review_count + 1;

    // Update flashcard
    await db.query(
      `UPDATE flashcards SET
       ease_factor = ?, interval_days = ?, review_count = ?,
       last_reviewed = NOW(), next_review = ?
       WHERE id = ? AND user_id = ?`,
      [ease_factor, interval_days, newReviewCount, nextReview, id, userId]
    );

    // Award points for review
    const { awardPoints } = require('./gamification');
    await awardPoints(userId, quality >= 3 ? 5 : 2, 'flashcard_review');

    res.json({
      success: true,
      message: 'Flashcard reviewed successfully',
      nextReview: nextReview.toISOString(),
      intervalDays: interval_days
    });

  } catch (error) {
    console.error('Review flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review flashcard'
    });
  }
});

// Delete flashcard
router.delete('/flashcards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await db.query(
      'DELETE FROM flashcards WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found'
      });
    }

    res.json({
      success: true,
      message: 'Flashcard deleted successfully'
    });

  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete flashcard'
    });
  }
});

// Notes Management
router.post('/notes', authenticateToken, validateInput(noteSchema), async (req, res) => {
  try {
    const noteData = {
      ...req.body,
      user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [result] = await db.query(
      `INSERT INTO notes (user_id, lesson_id, title, content, tags, is_public, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noteData.user_id,
        noteData.lesson_id || null,
        noteData.title,
        noteData.content,
        JSON.stringify(noteData.tags || []),
        noteData.is_public,
        noteData.category,
        noteData.created_at,
        noteData.updated_at
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      noteId: result.insertId
    });

  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note'
    });
  }
});

// Get user's notes
router.get('/notes', authenticateToken, async (req, res) => {
  try {
    const { lesson_id, category, search, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    let whereConditions = ['n.user_id = ?'];
    let params = [userId];

    if (lesson_id) {
      whereConditions.push('n.lesson_id = ?');
      params.push(lesson_id);
    }

    if (category) {
      whereConditions.push('n.category = ?');
      params.push(category);
    }

    if (search) {
      whereConditions.push('(n.title LIKE ? OR n.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const [notes] = await db.query(`
      SELECT n.*, l.title as lesson_title, c.title as course_title
      FROM notes n
      LEFT JOIN lessons l ON n.lesson_id = l.id
      LEFT JOIN courses c ON l.course_id = c.id
      WHERE ${whereClause}
      ORDER BY n.updated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM notes n WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notes'
    });
  }
});

// Update note
router.put('/notes/:id', authenticateToken, validateInput(noteSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    const [result] = await db.query(
      `UPDATE notes SET
       title = ?, content = ?, tags = ?, is_public = ?, category = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        updateData.title,
        updateData.content,
        JSON.stringify(updateData.tags || []),
        updateData.is_public,
        updateData.category,
        updateData.updated_at,
        id,
        userId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note'
    });
  }
});

// Delete note
router.delete('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await db.query(
      'DELETE FROM notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note'
    });
  }
});

// Interactive Quiz Attempts
router.post('/quizzes/:quizId/attempt', authenticateToken, validateInput(quizAttemptSchema), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, time_spent } = req.body;
    const userId = req.user.id;

    // Get quiz questions and correct answers
    const [questions] = await db.query(
      'SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );

    let correctAnswers = 0;
    let totalQuestions = questions.length;
    const detailedResults = [];

    // Calculate score
    for (const question of questions) {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correct_answer;

      if (isCorrect) correctAnswers++;

      detailedResults.push({
        question_id: question.id,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect
      });
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Save attempt
    const [result] = await db.query(
      `INSERT INTO user_quizzes (user_id, quiz_id, score, answers, detailed_results, time_spent, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        quizId,
        score,
        JSON.stringify(answers),
        JSON.stringify(detailedResults),
        time_spent || 0
      ]
    );

    // Award points based on performance
    const { awardPoints, checkAchievements } = require('./gamification');
    await awardPoints(userId, score >= 80 ? 20 : score >= 60 ? 10 : 5, 'quiz_attempt');

    // Check for achievements
    await checkAchievements(userId);

    res.json({
      success: true,
      score,
      correctAnswers,
      totalQuestions,
      detailedResults,
      message: score >= 80 ? 'Excellent work!' : score >= 60 ? 'Good job!' : 'Keep practicing!'
    });

  } catch (error) {
    console.error('Quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz attempt'
    });
  }
});

// Get spaced repetition statistics
router.get('/spaced-repetition/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total_flashcards,
        COUNT(CASE WHEN next_review <= NOW() THEN 1 END) as due_today,
        COUNT(CASE WHEN next_review <= DATE_ADD(NOW(), INTERVAL 1 DAY) THEN 1 END) as due_soon,
        AVG(ease_factor) as avg_ease_factor,
        SUM(review_count) as total_reviews
      FROM flashcards
      WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      stats: stats[0]
    });

  } catch (error) {
    console.error('Spaced repetition stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get spaced repetition stats'
    });
  }
});

// Get learning progress summary
router.get('/progress/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'week' } = req.query; // week, month, year

    let dateCondition;
    switch (period) {
      case 'week':
        dateCondition = 'DATE_SUB(NOW(), INTERVAL 1 WEEK)';
        break;
      case 'month':
        dateCondition = 'DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        break;
      case 'year':
        dateCondition = 'DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
      default:
        dateCondition = 'DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    }

    const [summary] = await db.query(`
      SELECT
        COUNT(DISTINCT up.course_id) as courses_studied,
        COUNT(DISTINCT up.lesson_id) as lessons_completed,
        COUNT(DISTINCT uq.quiz_id) as quizzes_taken,
        AVG(uq.score) as avg_quiz_score,
        COUNT(DISTINCT f.id) as flashcards_created,
        COUNT(DISTINCT n.id) as notes_created,
        SUM(up.progress) as total_progress_points
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id AND up.completed = 1 AND up.updated_at >= ${dateCondition}
      LEFT JOIN user_quizzes uq ON u.id = uq.user_id AND uq.completed_at >= ${dateCondition}
      LEFT JOIN flashcards f ON u.id = f.user_id AND f.created_at >= ${dateCondition}
      LEFT JOIN notes n ON u.id = n.user_id AND n.created_at >= ${dateCondition}
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);

    res.json({
      success: true,
      summary: summary[0] || {},
      period
    });

  } catch (error) {
    console.error('Progress summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress summary'
    });
  }
});

// AI-powered study recommendations
router.get('/study-recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's recent performance
    const [recentPerformance] = await db.query(`
      SELECT
        AVG(uq.score) as avg_quiz_score,
        COUNT(CASE WHEN uq.score < 60 THEN 1 END) as struggling_topics,
        COUNT(DISTINCT f.id) as active_flashcards,
        COUNT(CASE WHEN f.next_review <= NOW() THEN 1 END) as due_flashcards
      FROM user_quizzes uq
      LEFT JOIN flashcards f ON uq.user_id = f.user_id
      WHERE uq.user_id = ? AND uq.completed_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
    `, [userId]);

    const performance = recentPerformance[0];

    const recommendations = [];

    // Spaced repetition recommendation
    if (performance.due_flashcards > 0) {
      recommendations.push({
        type: 'flashcards',
        priority: 'high',
        title: 'Review Flashcards',
        description: `You have ${performance.due_flashcards} flashcards due for review`,
        action: 'Review now to maintain your learning streak'
      });
    }

    // Quiz practice recommendation
    if (performance.avg_quiz_score < 70) {
      recommendations.push({
        type: 'practice',
        priority: 'high',
        title: 'Practice Quizzes',
        description: 'Your recent quiz scores suggest you could benefit from more practice',
        action: 'Take practice quizzes in challenging subjects'
      });
    }

    // Note-taking recommendation
    if (performance.active_flashcards < 5) {
      recommendations.push({
        type: 'notes',
        priority: 'medium',
        title: 'Create Study Notes',
        description: 'Build your knowledge base with study notes and flashcards',
        action: 'Create notes for complex topics you\'re learning'
      });
    }

    // Study session recommendation
    recommendations.push({
      type: 'study_session',
      priority: 'medium',
      title: 'Schedule Study Time',
      description: 'Consistent study sessions improve long-term retention',
      action: 'Set aside dedicated time for focused learning'
    });

    res.json({
      success: true,
      recommendations: recommendations.slice(0, 3), // Top 3 recommendations
      performance
    });

  } catch (error) {
    console.error('Study recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get study recommendations'
    });
  }
});

module.exports = router;
