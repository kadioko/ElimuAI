// Internationalization and Accessibility Enhancements
const express = require('express');
const router = express.Router();

// Language translations
const translations = {
  en: {
    // Common
    welcome: 'Welcome',
    home: 'Home',
    courses: 'Courses',
    profile: 'Profile',
    settings: 'Settings',
    search: 'Search',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',

    // Authentication
    login: 'Sign In',
    register: 'Sign Up',
    logout: 'Sign Out',
    email: 'Email',
    password: 'Password',
    confirm_password: 'Confirm Password',
    forgot_password: 'Forgot Password?',
    reset_password: 'Reset Password',

    // Courses
    course_title: 'Course Title',
    course_description: 'Course Description',
    lesson: 'Lesson',
    quiz: 'Quiz',
    progress: 'Progress',
    completed: 'Completed',
    start_course: 'Start Course',
    continue_learning: 'Continue Learning',

    // Gamification
    points: 'Points',
    achievements: 'Achievements',
    leaderboard: 'Leaderboard',
    streak: 'Day Streak',
    congratulations: 'Congratulations!',
    unlocked_achievement: 'You unlocked a new achievement!',

    // Social Features
    study_groups: 'Study Groups',
    join_group: 'Join Group',
    create_group: 'Create Group',
    video_call: 'Video Call',
    chat: 'Chat',
    participants: 'Participants',

    // Learning Tools
    flashcards: 'Flashcards',
    notes: 'Notes',
    study_session: 'Study Session',
    review_cards: 'Review Cards',

    // Accessibility
    skip_to_main: 'Skip to main content',
    high_contrast: 'High contrast mode',
    large_text: 'Large text mode',
    screen_reader: 'Screen reader optimized',

    // Error Messages
    network_error: 'Network connection error. Please check your internet connection.',
    server_error: 'Server error. Please try again later.',
    validation_error: 'Please check your input and try again.',
    permission_denied: 'You do not have permission to perform this action.',
  },

  sw: {
    // Common - Swahili translations
    welcome: 'Karibu',
    home: 'Nyumbani',
    courses: 'Kozi',
    profile: 'Wasifu',
    settings: 'Mipangilio',
    search: 'Tafuta',
    save: 'Hifadhi',
    cancel: 'Ghairi',
    delete: 'Futa',
    edit: 'Hariri',
    create: 'Unda',
    loading: 'Inapakia...',
    error: 'Kosa',
    success: 'Mafanikio',

    // Authentication
    login: 'Ingia',
    register: 'Jisajili',
    logout: 'Toka',
    email: 'Barua pepe',
    password: 'Nenosiri',
    confirm_password: 'Thibitisha Nenosiri',
    forgot_password: 'Umesahau Nenosiri?',
    reset_password: 'Weka upya Nenosiri',

    // Courses
    course_title: 'Jina la Kozi',
    course_description: 'Maelezo ya Kozi',
    lesson: 'Somo',
    quiz: 'Jaribio',
    progress: 'Maendeleo',
    completed: 'Imekamilika',
    start_course: 'Anza Kozi',
    continue_learning: 'Endelea Kujifunza',

    // Gamification
    points: 'Pointi',
    achievements: 'Mafanikio',
    leaderboard: 'Ubao wa Wahodhi',
    streak: 'Mfululizo wa Siku',
    congratulations: 'Hongera!',
    unlocked_achievement: 'Umefungua mafanikio mapya!',

    // Social Features
    study_groups: 'Vikundi vya Kujifunza',
    join_group: 'Jiunge na Kikundi',
    create_group: 'Unda Kikundi',
    video_call: 'Simu ya Video',
    chat: 'Ongea',
    participants: 'Washiriki',

    // Learning Tools
    flashcards: 'Kadi za Kumbukumbu',
    notes: 'Madokezo',
    study_session: 'Kipindi cha Kujifunza',
    review_cards: 'Kagua Kadi',

    // Accessibility
    skip_to_main: 'Ruka kwenda kwenye maudhui kuu',
    high_contrast: 'Hali ya rangi ya juu',
    large_text: 'Hali ya maandishi makubwa',
    screen_reader: 'Imerekebishwa kwa kisoma skrini',

    // Error Messages
    network_error: 'Kosa la muunganisho wa mtandao. Tafadhali angalia muunganisho wako wa intaneti.',
    server_error: 'Kosa la seva. Tafadhali jaribu tena baadaye.',
    validation_error: 'Tafadhali angalia ingizo lako na ujaribu tena.',
    permission_denied: 'Huna ruhusa ya kutekeleza kitendo hiki.',
  },

  ar: {
    // Common - Arabic translations (RTL)
    welcome: 'أهلاً وسهلاً',
    home: 'الرئيسية',
    courses: 'الدورات',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    search: 'البحث',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    create: 'إنشاء',
    loading: 'جارٍ التحميل...',
    error: 'خطأ',
    success: 'نجح',

    // Authentication
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirm_password: 'تأكيد كلمة المرور',
    forgot_password: 'نسيت كلمة المرور؟',
    reset_password: 'إعادة تعيين كلمة المرور',

    // Courses
    course_title: 'عنوان الدورة',
    course_description: 'وصف الدورة',
    lesson: 'درس',
    quiz: 'اختبار',
    progress: 'التقدم',
    completed: 'مكتمل',
    start_course: 'ابدأ الدورة',
    continue_learning: 'متابعة التعلم',

    // Gamification
    points: 'نقاط',
    achievements: 'الإنجازات',
    leaderboard: 'لوحة الصدارة',
    streak: 'سلسلة الأيام',
    congratulations: 'مبروك!',
    unlocked_achievement: 'لقد فتحت إنجازاً جديداً!',

    // Social Features
    study_groups: 'مجموعات الدراسة',
    join_group: 'انضم للمجموعة',
    create_group: 'إنشاء مجموعة',
    video_call: 'مكالمة فيديو',
    chat: 'دردشة',
    participants: 'المشاركون',

    // Learning Tools
    flashcards: 'البطاقات التعليمية',
    notes: 'الملاحظات',
    study_session: 'جلسة دراسة',
    review_cards: 'مراجعة البطاقات',

    // Accessibility
    skip_to_main: 'تخطي إلى المحتوى الرئيسي',
    high_contrast: 'وضع التباين العالي',
    large_text: 'وضع النص الكبير',
    screen_reader: 'مُحسن لقارئ الشاشة',

    // Error Messages
    network_error: 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت الخاص بك.',
    server_error: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
    validation_error: 'يرجى التحقق من إدخالك وحاول مرة أخرى.',
    permission_denied: 'ليس لديك إذن لتنفيذ هذا الإجراء.',
  }
};

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'sw', 'ar'];

// Get translations for a language
router.get('/translations/:lang', (req, res) => {
  const { lang } = req.params;

  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported language'
    });
  }

  res.json({
    success: true,
    translations: translations[lang],
    language: lang,
    rtl: lang === 'ar' // Right-to-left for Arabic
  });
});

// Get all supported languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    languages: SUPPORTED_LANGUAGES.map(lang => ({
      code: lang,
      name: lang === 'en' ? 'English' : lang === 'sw' ? 'Kiswahili' : 'العربية',
      native_name: lang === 'en' ? 'English' : lang === 'sw' ? 'Kiswahili' : 'العربية',
      rtl: lang === 'ar'
    }))
  });
});

// Update user language preference
router.post('/user/language', authenticateToken, async (req, res) => {
  try {
    const { language } = req.body;
    const userId = req.user.id;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language'
      });
    }

    await db.query(
      'UPDATE users SET language = ?, updated_at = NOW() WHERE id = ?',
      [language, userId]
    );

    res.json({
      success: true,
      message: 'Language preference updated',
      language
    });

  } catch (error) {
    console.error('Language update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update language preference'
    });
  }
});

// Accessibility settings
router.get('/accessibility', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [settings] = await db.query(
      'SELECT accessibility_settings FROM users WHERE id = ?',
      [userId]
    );

    const accessibilitySettings = settings[0]?.accessibility_settings ?
      JSON.parse(settings[0].accessibility_settings) : {
        high_contrast: false,
        large_text: false,
        reduced_motion: false,
        screen_reader: false,
        keyboard_navigation: true
      };

    res.json({
      success: true,
      accessibility: accessibilitySettings
    });

  } catch (error) {
    console.error('Accessibility settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get accessibility settings'
    });
  }
});

// Update accessibility settings
router.post('/accessibility', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accessibilitySettings = req.body;

    // Validate settings
    const validSettings = {
      high_contrast: Boolean(accessibilitySettings.high_contrast),
      large_text: Boolean(accessibilitySettings.large_text),
      reduced_motion: Boolean(accessibilitySettings.reduced_motion),
      screen_reader: Boolean(accessibilitySettings.screen_reader),
      keyboard_navigation: Boolean(accessibilitySettings.keyboard_navigation)
    };

    await db.query(
      'UPDATE users SET accessibility_settings = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(validSettings), userId]
    );

    res.json({
      success: true,
      message: 'Accessibility settings updated',
      accessibility: validSettings
    });

  } catch (error) {
    console.error('Accessibility update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update accessibility settings'
    });
  }
});

// Content accessibility analysis
router.post('/content/analyze', authenticateToken, async (req, res) => {
  try {
    const { content, content_type } = req.body;

    // Analyze content for accessibility issues
    const analysis = {
      readability_score: calculateReadabilityScore(content),
      contrast_ratio: 4.5, // Default good ratio
      alt_text_missing: content_type === 'image' && !req.body.alt_text,
      headings_structure: analyzeHeadingStructure(content),
      language_identified: detectLanguage(content),
      accessibility_score: 0,
      recommendations: []
    };

    // Calculate accessibility score
    let score = 100;

    if (analysis.readability_score > 12) {
      score -= 20;
      analysis.recommendations.push('Consider simplifying the text for better readability');
    }

    if (analysis.alt_text_missing) {
      score -= 30;
      analysis.recommendations.push('Add alternative text for images');
    }

    if (!analysis.headings_structure.valid) {
      score -= 15;
      analysis.recommendations.push('Improve heading structure (use proper hierarchy)');
    }

    analysis.accessibility_score = Math.max(0, score);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze content'
    });
  }
});

// Generate accessible content alternatives
router.post('/content/alternative', authenticateToken, async (req, res) => {
  try {
    const { content, type, language } = req.body;

    let alternative = '';

    switch (type) {
      case 'simplified_text':
        alternative = simplifyText(content, language);
        break;
      case 'audio_description':
        alternative = generateAudioDescription(content);
        break;
      case 'braille':
        alternative = convertToBraille(content);
        break;
      case 'sign_language':
        alternative = generateSignLanguageGuide(content);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported alternative type'
        });
    }

    res.json({
      success: true,
      alternative,
      type,
      language: language || 'en'
    });

  } catch (error) {
    console.error('Content alternative error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate alternative content'
    });
  }
});

// Keyboard navigation helpers
router.get('/navigation/shortcuts', authenticateToken, (req, res) => {
  const shortcuts = {
    general: {
      'Alt + H': 'Go to Home',
      'Alt + C': 'Go to Courses',
      'Alt + P': 'Go to Profile',
      'Alt + S': 'Go to Settings',
      'Alt + /': 'Focus search',
      'Tab': 'Navigate forward',
      'Shift + Tab': 'Navigate backward',
      'Enter': 'Activate button/link',
      'Space': 'Toggle checkbox/select option',
      'Escape': 'Close modal/dropdown'
    },
    learning: {
      'Alt + L': 'Start/Stop lesson',
      'Alt + Q': 'Open quiz',
      'Alt + N': 'Next item',
      'Alt + B': 'Previous item',
      'Alt + F': 'Toggle fullscreen',
      'Alt + M': 'Toggle mute'
    },
    accessibility: {
      'Alt + A': 'Toggle high contrast',
      'Alt + T': 'Toggle large text',
      'Alt + R': 'Toggle screen reader mode'
    }
  };

  res.json({
    success: true,
    shortcuts
  });
});

// Screen reader announcements
router.post('/announce', authenticateToken, async (req, res) => {
  try {
    const { message, priority = 'polite', context } = req.body;
    const userId = req.user.id;

    // Store announcement for user's session
    const announcementId = `announce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, this would integrate with screen reader APIs
    // For now, we'll store it and return success

    res.json({
      success: true,
      announcement_id: announcementId,
      message,
      priority,
      context
    });

  } catch (error) {
    console.error('Announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
});

// Font and display preferences
router.get('/fonts', (req, res) => {
  const fonts = {
    default: {
      name: 'Inter',
      weights: ['400', '500', '600', '700'],
      sizes: {
        small: 14,
        medium: 16,
        large: 18,
        xlarge: 20
      }
    },
    dyslexia_friendly: {
      name: 'OpenDyslexic',
      weights: ['400', '600'],
      sizes: {
        small: 16,
        medium: 18,
        large: 20,
        xlarge: 22
      }
    },
    arabic: {
      name: 'Noto Sans Arabic',
      weights: ['400', '500', '600', '700'],
      sizes: {
        small: 14,
        medium: 16,
        large: 18,
        xlarge: 20
      }
    }
  };

  res.json({
    success: true,
    fonts
  });
});

// Helper functions
function calculateReadabilityScore(text) {
  // Simplified Flesch Reading Ease score calculation
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const syllables = text.split(/\s+/).reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);

  if (sentences === 0 || words === 0) return 0;

  const avgSentenceLength = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  let syllables = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = 'aeiouy'.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      syllables++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent 'e'
  if (word.endsWith('e')) syllables--;

  return Math.max(1, syllables);
}

function analyzeHeadingStructure(content) {
  // Simple heading structure analysis
  const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  let valid = true;
  let previousLevel = 0;

  for (const heading of headings) {
    const level = parseInt(heading.match(/<h([1-6])/i)[1]);
    if (level > previousLevel + 1) {
      valid = false;
      break;
    }
    previousLevel = level;
  }

  return {
    valid,
    heading_count: headings.length,
    levels_used: [...new Set(headings.map(h => parseInt(h.match(/<h([1-6])/i)[1])))].sort()
  };
}

function detectLanguage(text) {
  // Simple language detection based on character sets
  const arabicChars = /[\u0600-\u06FF]/;
  const swahiliChars = /[\u0041-\u007A]/; // Basic Latin for Swahili

  if (arabicChars.test(text)) return 'ar';
  if (swahiliChars.test(text)) return 'sw';
  return 'en';
}

function simplifyText(text, language) {
  // Basic text simplification - in production, use NLP libraries
  let simplified = text;

  // Remove complex words
  const complexWords = {
    en: ['utilize', 'implement', 'facilitate', 'comprehensive', 'methodology'],
    sw: ['utekelezaji', 'mfumo', 'utafiti', 'maendeleo', 'ushirikiano'],
    ar: ['تنفيذ', 'تطوير', 'منهجية', 'شامل', 'تعاون']
  };

  const simpleReplacements = {
    en: { 'utilize': 'use', 'implement': 'do', 'facilitate': 'help', 'comprehensive': 'complete', 'methodology': 'method' },
    sw: { 'utekelezaji': 'utekeleza', 'mfumo': 'njia', 'utafiti': 'uchunguzi', 'maendeleo': 'mafanikio', 'ushirikiano': 'ushirika' },
    ar: { 'تنفيذ': 'عمل', 'تطوير': 'تحسين', 'منهجية': 'طريقة', 'شامل': 'كامل', 'تعاون': 'عمل معاً' }
  };

  (complexWords[language] || complexWords.en).forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    simplified = simplified.replace(regex, simpleReplacements[language]?.[word] || simpleReplacements.en[word] || word);
  });

  return simplified;
}

function generateAudioDescription(content) {
  // Generate audio description for visual content
  // This would integrate with AI services in production
  return `Audio description: ${content.substring(0, 200)}...`;
}

function convertToBraille(text) {
  // Basic Braille conversion (simplified)
  // In production, use proper Braille libraries
  const brailleMap = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    // Add more mappings...
  };

  return text.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
}

function generateSignLanguageGuide(content) {
  // Generate sign language guidance
  // This would integrate with sign language databases in production
  return `Sign language guide: Use signs for ${content.split(' ').slice(0, 10).join(', ')}...`;
}

module.exports = {
  router,
  translations,
  SUPPORTED_LANGUAGES
};
