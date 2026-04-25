/**
 * Seed data script - Seeds the MongoDB with essential data
 * Run: node scripts/seedData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const AiPrompt = require('../models/AiPrompt');
const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const PlanExercise = require('../models/PlanExercise');
const KnowledgeBase = require('../models/KnowledgeBase');
const HealthTip = require('../models/HealthTip');
const NutritionTip = require('../models/NutritionTip');

async function seedData() {
  await connectDB();
  console.log('🌱 Starting seed...\n');

  // 1. Create admin user
  const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!adminExists) {
    await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@therahome.vn',
      full_name: 'Admin TheraHome',
      role: 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // 2. Seed AI Prompts
  const promptCount = await AiPrompt.countDocuments();
  if (promptCount === 0) {
    await AiPrompt.insertMany([
      {
        prompt_type: 'recommendation',
        system_prompt: 'Bạn là chuyên gia vật lý trị liệu. Nhiệm vụ của bạn là gợi ý bài tập phù hợp dựa trên tình trạng sức khỏe và hành vi của người dùng. Trả lời bằng tiếng Việt.',
        temperature: 0.7,
        max_tokens: 1000,
        model: 'llama-3.3-70b-versatile',
        is_active: true,
      },
      {
        prompt_type: 'chatbot',
        system_prompt: 'Bạn là trợ lý sức khỏe AI của TheraHome, chuyên về giảm đau cổ, vai, lưng. Hãy trả lời câu hỏi một cách chuyên nghiệp nhưng dễ hiểu. Luôn trả lời bằng tiếng Việt. Khuyến khích người dùng tập trị liệu đều đặn.',
        temperature: 0.7,
        max_tokens: 800,
        model: 'llama-3.3-70b-versatile',
        is_active: true,
      },
      {
        prompt_type: 'tips',
        system_prompt: 'Bạn là chuyên gia sức khỏe. Tạo mẹo sức khỏe ngắn gọn, hữu ích về giảm đau cổ, vai, lưng. Trả lời bằng tiếng Việt.',
        temperature: 0.7,
        max_tokens: 200,
        model: 'llama-3.3-70b-versatile',
        is_active: true,
      },
      {
        prompt_type: 'nutrition',
        system_prompt: 'Bạn là chuyên gia dinh dưỡng. Tạo gợi ý dinh dưỡng cho người bị đau cổ/lưng. Trả lời bằng tiếng Việt, ngắn gọn 2-3 câu.',
        temperature: 0.7,
        max_tokens: 200,
        model: 'llama-3.3-70b-versatile',
        is_active: true,
      },
    ]);
    console.log('✅ AI Prompts seeded (4 prompts)');
  }

  // 3. Seed sample exercises
  const exerciseCount = await Exercise.countDocuments();
  if (exerciseCount === 0) {
    await Exercise.insertMany([
      {
        title: 'Xoay cổ nhẹ nhàng',
        description: 'Bài tập xoay cổ cơ bản giúp giảm căng thẳng vùng cổ',
        video_url: 'https://www.youtube.com/watch?v=example1',
        video_urls_by_pain: {
          no_pain: 'https://www.youtube.com/watch?v=example1',
          mild: 'https://www.youtube.com/watch?v=example1',
          moderate: 'https://www.youtube.com/watch?v=example1',
          severe: 'https://www.youtube.com/watch?v=example1',
        },
        thumbnail_url: '',
        duration: 300,
        calories: 20,
        difficulty: 'easy',
        target_areas: ['neck'],
        category: 'neck',
        tags: ['cổ', 'người mới', 'nhẹ nhàng'],
        instructions: [{ step: 1, text: 'Ngồi thẳng lưng, thả lỏng vai' }, { step: 2, text: 'Từ từ xoay cổ sang trái rồi sang phải' }, { step: 3, text: 'Lặp lại 10 lần mỗi bên' }],
        benefits: ['Giảm đau cổ', 'Tăng linh hoạt', 'Giảm căng thẳng'],
        is_pro: false,
        order_index: 1,
      },
      {
        title: 'Kéo giãn vai',
        description: 'Bài tập kéo giãn vùng vai giúp giảm đau vai và cổ',
        video_url: 'https://www.youtube.com/watch?v=example2',
        video_urls_by_pain: {
          no_pain: 'https://www.youtube.com/watch?v=example2',
          mild: 'https://www.youtube.com/watch?v=example2',
          moderate: 'https://www.youtube.com/watch?v=example2',
          severe: 'https://www.youtube.com/watch?v=example2',
        },
        thumbnail_url: '',
        duration: 300,
        calories: 25,
        difficulty: 'easy',
        target_areas: ['shoulder_left', 'shoulder_right'],
        category: 'shoulder',
        tags: ['vai', 'người mới'],
        instructions: [{ step: 1, text: 'Đứng thẳng, hai tay buông tự nhiên' }, { step: 2, text: 'Nâng vai lên cao, giữ 5 giây' }, { step: 3, text: 'Thả lỏng vai xuống, lặp lại 15 lần' }],
        benefits: ['Giảm đau vai', 'Giảm căng cơ'],
        is_pro: false,
        order_index: 2,
      },
      {
        title: 'Kéo giãn lưng trên',
        description: 'Bài tập kéo giãn lưng trên, giảm đau cho dân văn phòng',
        video_url: 'https://www.youtube.com/watch?v=example3',
        video_urls_by_pain: {
          no_pain: 'https://www.youtube.com/watch?v=example3',
          mild: 'https://www.youtube.com/watch?v=example3',
          moderate: 'https://www.youtube.com/watch?v=example3',
          severe: 'https://www.youtube.com/watch?v=example3',
        },
        thumbnail_url: '',
        duration: 420,
        calories: 30,
        difficulty: 'medium',
        target_areas: ['upper_back'],
        category: 'upper_back',
        tags: ['lưng', 'văn phòng'],
        instructions: [{ step: 1, text: 'Ngồi trên ghế, hai tay đan trước ngực' }, { step: 2, text: 'Cong lưng về phía trước, giữ 10 giây' }],
        benefits: ['Giảm đau lưng trên', 'Cải thiện tư thế'],
        is_pro: false,
        order_index: 3,
      },
      {
        title: 'Cat-Cow Stretch',
        description: 'Bài tập phối hợp lưng giữa và lưng dưới theo kiểu yoga',
        video_url: 'https://www.youtube.com/watch?v=example4',
        video_urls_by_pain: {
          no_pain: 'https://www.youtube.com/watch?v=example4',
          mild: 'https://www.youtube.com/watch?v=example4',
          moderate: 'https://www.youtube.com/watch?v=example4',
          severe: 'https://www.youtube.com/watch?v=example4',
        },
        thumbnail_url: '',
        duration: 600,
        calories: 40,
        difficulty: 'medium',
        target_areas: ['middle_back', 'lower_back'],
        category: 'middle_back',
        tags: ['yoga', 'lưng'],
        instructions: [{ step: 1, text: 'Quỳ gối, hai tay chống sàn' }, { step: 2, text: 'Cong lưng lên (cat), giữ 5 giây' }, { step: 3, text: 'Uốn lưng xuống (cow), giữ 5 giây' }],
        benefits: ['Giảm đau lưng', 'Tăng linh hoạt cột sống'],
        is_pro: false,
        order_index: 4,
      },
      {
        title: 'Bài tập toàn thân nâng cao',
        description: 'Bài tập PRO kết hợp nhiều vùng cơ thể',
        video_url: 'https://www.youtube.com/watch?v=example5',
        video_urls_by_pain: {
          no_pain: 'https://www.youtube.com/watch?v=example5',
          mild: 'https://www.youtube.com/watch?v=example5',
          moderate: 'https://www.youtube.com/watch?v=example5',
          severe: 'https://www.youtube.com/watch?v=example5',
        },
        thumbnail_url: '',
        duration: 900,
        calories: 80,
        difficulty: 'hard',
        target_areas: ['neck', 'shoulder_left', 'shoulder_right', 'upper_back', 'lower_back'],
        category: 'full_body',
        tags: ['nâng cao', 'toàn thân', 'PRO'],
        instructions: [{ step: 1, text: 'Khởi động 5 phút' }, { step: 2, text: 'Thực hiện các bài tập theo hướng dẫn video' }],
        benefits: ['Giảm đau toàn diện', 'Tăng sức bền'],
        is_pro: true,
        order_index: 5,
      },
    ]);
    console.log('✅ Exercises seeded (5 exercises)');
  }

  // 4. Seed sample workout plan
  const planCount = await WorkoutPlan.countDocuments();
  if (planCount === 0) {
    const plan = await WorkoutPlan.create({
      title: 'Lộ trình trị liệu cổ 14 ngày',
      description: 'Lộ trình tập luyện 14 ngày giúp giảm đau cổ hiệu quả cho người mới bắt đầu',
      duration_days: 14,
      target_area: 'neck',
      difficulty: 'easy',
      is_pro: false,
    });
    console.log('✅ Workout plan seeded');

    // Add exercises to plan
    const exercises = await Exercise.find({ category: { $in: ['neck', 'shoulder'] } }).limit(2);
    if (exercises.length > 0) {
      const planExercises = [];
      for (let day = 1; day <= 14; day++) {
        exercises.forEach((ex, idx) => {
          planExercises.push({
            plan_id: plan._id,
            exercise_id: ex._id,
            day_number: day,
            order_in_day: idx + 1,
          });
        });
      }
      await PlanExercise.insertMany(planExercises);
      console.log('✅ Plan exercises seeded');
    }
  }

  // 5. Seed knowledge base
  const kbCount = await KnowledgeBase.countDocuments();
  if (kbCount === 0) {
    await KnowledgeBase.insertMany([
      { title: 'Tư thế ngồi đúng', content: 'Ngồi thẳng lưng, vai thả lỏng, mắt ngang màn hình. Đặt chân phẳng trên sàn, gối vuông 90 độ.', category: 'tips', tags: ['tư thế', 'văn phòng'] },
      { title: 'Thực phẩm chống viêm', content: 'Cá hồi, quả mọng, rau xanh đậm, nghệ, gừng là những thực phẩm tốt cho người bị đau cổ lưng.', category: 'nutrition', tags: ['dinh dưỡng', 'chống viêm'] },
      { title: 'Dấu hiệu cần gặp bác sĩ', content: 'Nếu đau kéo dài hơn 2 tuần, tê bì tay chân, hoặc đau sau chấn thương, hãy đi khám bác sĩ ngay.', category: 'symptoms', tags: ['cảnh báo', 'bác sĩ'] },
    ]);
    console.log('✅ Knowledge base seeded');
  }

  console.log('\n🎉 Seed completed!');
  process.exit(0);
}

seedData().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
