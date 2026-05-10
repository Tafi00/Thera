/**
 * Script tạo tài khoản demo cho Apple Review Team
 * Chạy: node scripts/createDemoAccount.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DEMO_EMAIL = 'demo@therahome.vn';
const DEMO_PASSWORD = 'Demo@123456';

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');

    // Check if demo account already exists
    let user = await User.findOne({ email: DEMO_EMAIL });

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

    if (user) {
      // Update existing
      user.full_name = 'Demo User';
      user.password = hashedPassword;
      user.role = 'user';
      user.is_pro = true;
      user.age = 30;
      user.gender = 'male';
      user.occupation = 'Nhân viên văn phòng';
      user.pain_areas = ['neck', 'lower_back'];
      user.symptoms = ['Đau mỏi', 'Tê bì'];
      user.surgery_history = 'Không';
      user.preferred_time = '08:00';
      user.notifications_enabled = true;
      user.onboarding_completed = true;
      user.personalized_plan_started_at = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      user.personalized_plan_completed_at = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      user.personalized_plan_unlock_at = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      user.owned_devices = ['neck_device'];
      // Don't re-hash since we already hashed above
      user.password = hashedPassword;
      await User.updateOne({ _id: user._id }, {
        $set: {
          full_name: user.full_name,
          password: hashedPassword,
          role: 'user',
          is_pro: true,
          age: 30,
          gender: 'male',
          occupation: 'Nhân viên văn phòng',
          pain_areas: ['neck', 'lower_back'],
          symptoms: ['Đau mỏi', 'Tê bì'],
          surgery_history: 'Không',
          preferred_time: '08:00',
          notifications_enabled: true,
          onboarding_completed: true,
          personalized_plan_started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          personalized_plan_completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          personalized_plan_unlock_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          owned_devices: ['neck_device'],
          updated_at: new Date(),
        }
      });
      console.log('✅ Demo account updated');
    } else {
      // Create new
      await User.create({
        email: DEMO_EMAIL,
        password: hashedPassword,
        full_name: 'Demo User',
        role: 'user',
        is_pro: true,
        age: 30,
        gender: 'male',
        occupation: 'Nhân viên văn phòng',
        pain_areas: ['neck', 'lower_back'],
        symptoms: ['Đau mỏi', 'Tê bì'],
        surgery_history: 'Không',
        preferred_time: '08:00',
        notifications_enabled: true,
        onboarding_completed: true,
        personalized_plan_started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        personalized_plan_completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        personalized_plan_unlock_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        owned_devices: ['neck_device'],
      });
      console.log('✅ Demo account created');
    }

    console.log('');
    console.log('📋 Demo Account Info:');
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: ${DEMO_PASSWORD}`);
    console.log('');

    await mongoose.disconnect();
    console.log('✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
