// Enhanced Social Learning Features - Video Calls, Peer Tutoring, Collaborative Projects
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateInput } = require('../middleware/security');
const Joi = require('joi');

// Video call session management (in production, use Redis)
const activeVideoCalls = new Map();

// Video call validation schema
const videoCallSchema = Joi.object({
  group_id: Joi.number().integer().required(),
  call_type: Joi.string().valid('audio', 'video').default('video'),
  title: Joi.string().max(100),
  description: Joi.string().max(500),
  max_participants: Joi.number().integer().min(2).max(50).default(10),
  scheduled_at: Joi.date().iso().allow(null)
});

const tutoringSessionSchema = Joi.object({
  tutor_id: Joi.number().integer(),
  student_id: Joi.number().integer().required(),
  subject: Joi.string().required(),
  topic: Joi.string().required(),
  difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  duration_minutes: Joi.number().integer().min(15).max(180).default(60),
  price_per_hour: Joi.number().min(0).precision(2),
  description: Joi.string().max(1000),
  scheduled_at: Joi.date().iso().required(),
  session_type: Joi.string().valid('one-on-one', 'group').default('one-on-one')
});

const projectSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string().required(),
  difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  max_participants: Joi.number().integer().min(2).max(20).default(5),
  estimated_duration: Joi.number().integer().min(1).max(365).default(30), // days
  skills_required: Joi.array().items(Joi.string()),
  deliverables: Joi.array().items(Joi.string()),
  deadline: Joi.date().iso(),
  project_type: Joi.string().valid('academic', 'practical', 'research', 'creative').default('academic')
});

// Create video call room
router.post('/video-calls', authenticateToken, validateInput(videoCallSchema), async (req, res) => {
  try {
    const {
      group_id,
      call_type,
      title,
      description,
      max_participants,
      scheduled_at
    } = req.body;

    // Check if user is group member
    const [groupMember] = await db.query(
      'SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?',
      [req.user.id, group_id]
    );

    if (!groupMember.length) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Generate unique room ID
    const roomId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create video call record
    const [result] = await db.query(
      `INSERT INTO video_calls (room_id, group_id, host_id, call_type, title, description, max_participants, scheduled_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())`,
      [roomId, group_id, req.user.id, call_type, title || 'Group Call', description, max_participants, scheduled_at]
    );

    // Create Agora/Twilio token here (implementation depends on service used)
    const token = generateVideoToken(roomId, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Video call created successfully',
      call: {
        id: result.insertId,
        room_id: roomId,
        token,
        call_type,
        title: title || 'Group Call',
        max_participants,
        scheduled_at
      }
    });

  } catch (error) {
    console.error('Create video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video call'
    });
  }
});

// Join video call
router.post('/video-calls/:callId/join', authenticateToken, async (req, res) => {
  try {
    const callId = req.params.callId;
    const userId = req.user.id;

    // Get call details
    const [callData] = await db.query(
      'SELECT * FROM video_calls WHERE id = ?',
      [callId]
    );

    if (!callData.length) {
      return res.status(404).json({
        success: false,
        message: 'Video call not found'
      });
    }

    const call = callData[0];

    // Check if user is group member
    const [groupMember] = await db.query(
      'SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?',
      [userId, call.group_id]
    );

    if (!groupMember.length) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check participant limit
    const [participantCount] = await db.query(
      'SELECT COUNT(*) as count FROM video_call_participants WHERE call_id = ? AND status = "active"',
      [callId]
    );

    if (participantCount[0].count >= call.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Call is full'
      });
    }

    // Add participant
    await db.query(
      `INSERT INTO video_call_participants (call_id, user_id, joined_at, status)
       VALUES (?, ?, NOW(), 'active')
       ON DUPLICATE KEY UPDATE status = 'active', joined_at = NOW()`,
      [callId, userId]
    );

    // Generate token for user
    const token = generateVideoToken(call.room_id, userId);

    // Update call status if first participant
    if (participantCount[0].count === 0) {
      await db.query(
        'UPDATE video_calls SET status = "active", started_at = NOW() WHERE id = ?',
        [callId]
      );
    }

    res.json({
      success: true,
      call: {
        id: callId,
        room_id: call.room_id,
        token,
        call_type: call.call_type,
        title: call.title,
        participants: participantCount[0].count + 1,
        max_participants: call.max_participants
      }
    });

  } catch (error) {
    console.error('Join video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join video call'
    });
  }
});

// Leave video call
router.post('/video-calls/:callId/leave', authenticateToken, async (req, res) => {
  try {
    const callId = req.params.callId;
    const userId = req.user.id;

    // Update participant status
    await db.query(
      'UPDATE video_call_participants SET status = "left", left_at = NOW() WHERE call_id = ? AND user_id = ?',
      [callId, userId]
    );

    // Check if call should end (no active participants)
    const [activeParticipants] = await db.query(
      'SELECT COUNT(*) as count FROM video_call_participants WHERE call_id = ? AND status = "active"',
      [callId]
    );

    if (activeParticipants[0].count === 0) {
      await db.query(
        'UPDATE video_calls SET status = "ended", ended_at = NOW() WHERE id = ?',
        [callId]
      );
    }

    res.json({
      success: true,
      message: 'Left video call successfully'
    });

  } catch (error) {
    console.error('Leave video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave video call'
    });
  }
});

// Get active calls for user's groups
router.get('/video-calls/active', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [activeCalls] = await db.query(`
      SELECT vc.*, sg.name as group_name,
             COUNT(vcp.id) as participant_count,
             u.username as host_name
      FROM video_calls vc
      JOIN study_groups sg ON vc.group_id = sg.id
      JOIN users u ON vc.host_id = u.id
      LEFT JOIN video_call_participants vcp ON vc.id = vcp.call_id AND vcp.status = 'active'
      WHERE vc.group_id IN (
        SELECT group_id FROM user_groups WHERE user_id = ?
      )
      AND vc.status = 'active'
      AND vc.scheduled_at <= NOW()
      GROUP BY vc.id
    `, [userId]);

    res.json({
      success: true,
      calls: activeCalls
    });

  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active calls'
    });
  }
});

// Create tutoring session
router.post('/tutoring/sessions', authenticateToken, validateInput(tutoringSessionSchema), async (req, res) => {
  try {
    const sessionData = {
      ...req.body,
      tutor_id: req.body.tutor_id || req.user.id, // If not specified, current user is tutor
      created_by: req.user.id,
      status: 'scheduled',
      created_at: new Date()
    };

    // Check if tutor has permission (is instructor or has tutoring badge)
    const [tutorCheck] = await db.query(
      'SELECT role FROM users WHERE id = ?',
      [sessionData.tutor_id]
    );

    if (tutorCheck[0].role !== 'instructor' && sessionData.tutor_id === req.user.id) {
      // Check for tutoring achievement/badge
      const [hasTutoringBadge] = await db.query(
        'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = "peer_tutor"',
        [req.user.id]
      );

      if (!hasTutoringBadge.length) {
        return res.status(403).json({
          success: false,
          message: 'You need instructor role or tutoring certification to create tutoring sessions'
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO tutoring_sessions (tutor_id, student_id, subject, topic, difficulty_level, duration_minutes, price_per_hour, description, scheduled_at, session_type, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionData.tutor_id,
        sessionData.student_id,
        sessionData.subject,
        sessionData.topic,
        sessionData.difficulty_level,
        sessionData.duration_minutes,
        sessionData.price_per_hour || 0,
        sessionData.description,
        sessionData.scheduled_at,
        sessionData.session_type,
        sessionData.status,
        sessionData.created_by,
        sessionData.created_at
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Tutoring session created successfully',
      sessionId: result.insertId
    });

  } catch (error) {
    console.error('Create tutoring session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tutoring session'
    });
  }
});

// Get user's tutoring sessions
router.get('/tutoring/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { role = 'student' } = req.query; // 'student', 'tutor', or 'both'

    let whereCondition = '';
    let params = [userId];

    if (role === 'student') {
      whereCondition = 'WHERE student_id = ?';
    } else if (role === 'tutor') {
      whereCondition = 'WHERE tutor_id = ?';
    } else {
      whereCondition = 'WHERE student_id = ? OR tutor_id = ?';
      params.push(userId);
    }

    const [sessions] = await db.query(`
      SELECT ts.*,
             t.username as tutor_name, t.avatar_url as tutor_avatar,
             s.username as student_name, s.avatar_url as student_avatar,
             sg.name as group_name
      FROM tutoring_sessions ts
      JOIN users t ON ts.tutor_id = t.id
      JOIN users s ON ts.student_id = s.id
      LEFT JOIN study_groups sg ON ts.group_id = sg.id
      ${whereCondition}
      ORDER BY ts.scheduled_at DESC
    `, params);

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Get tutoring sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tutoring sessions'
    });
  }
});

// Create collaborative project
router.post('/projects', authenticateToken, validateInput(projectSchema), async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      creator_id: req.user.id,
      status: 'open',
      created_at: new Date()
    };

    const [result] = await db.query(
      `INSERT INTO collaborative_projects (title, description, category, difficulty_level, max_participants, estimated_duration, skills_required, deliverables, deadline, project_type, creator_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectData.title,
        projectData.description,
        projectData.category,
        projectData.difficulty_level,
        projectData.max_participants,
        projectData.estimated_duration,
        JSON.stringify(projectData.skills_required || []),
        JSON.stringify(projectData.deliverables || []),
        projectData.deadline,
        projectData.project_type,
        projectData.creator_id,
        projectData.status,
        projectData.created_at
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Collaborative project created successfully',
      projectId: result.insertId
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
});

// Join collaborative project
router.post('/projects/:projectId/join', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;

    // Check if project exists and is open
    const [project] = await db.query(
      'SELECT * FROM collaborative_projects WHERE id = ? AND status = "open"',
      [projectId]
    );

    if (!project.length) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or not accepting participants'
      });
    }

    // Check participant limit
    const [participantCount] = await db.query(
      'SELECT COUNT(*) as count FROM project_participants WHERE project_id = ? AND status = "active"',
      [projectId]
    );

    if (participantCount[0].count >= project[0].max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Project is full'
      });
    }

    // Check if user is already participating
    const [existingParticipant] = await db.query(
      'SELECT id FROM project_participants WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (existingParticipant.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already participating in this project'
      });
    }

    // Add participant
    await db.query(
      `INSERT INTO project_participants (project_id, user_id, role, joined_at, status)
       VALUES (?, ?, 'member', NOW(), 'active')`,
      [projectId, userId]
    );

    // Award points for joining project
    const { awardPoints } = require('./gamification');
    await awardPoints(userId, 25, 'project_join');

    res.json({
      success: true,
      message: 'Successfully joined the project'
    });

  } catch (error) {
    console.error('Join project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join project'
    });
  }
});

// Get available projects
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, status = 'open', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['cp.status = ?'];
    let params = [status];

    if (category) {
      whereConditions.push('cp.category = ?');
      params.push(category);
    }

    if (difficulty) {
      whereConditions.push('cp.difficulty_level = ?');
      params.push(difficulty);
    }

    const whereClause = whereConditions.join(' AND ');

    const [projects] = await db.query(`
      SELECT cp.*,
             u.username as creator_name,
             COUNT(pp.id) as participant_count
      FROM collaborative_projects cp
      JOIN users u ON cp.creator_id = u.id
      LEFT JOIN project_participants pp ON cp.id = pp.project_id AND pp.status = 'active'
      WHERE ${whereClause}
      GROUP BY cp.id
      ORDER BY cp.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await db.query(
      `SELECT COUNT(*) as total FROM collaborative_projects cp WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].total,
        pages: Math.ceil(total[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projects'
    });
  }
});

// Helper function to generate video tokens (implement based on your video service)
function generateVideoToken(roomId, userId) {
  // This is a placeholder - implement based on your video service (Agora, Twilio, etc.)
  // For Agora: return RtcTokenBuilder.buildTokenWithUid(...)
  // For Twilio: return AccessToken(...) with VideoGrant

  // Placeholder implementation
  return `token_${roomId}_${userId}_${Date.now()}`;
}

module.exports = router;
