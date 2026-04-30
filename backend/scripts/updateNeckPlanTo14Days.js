require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDB = require('../config/db');
const WorkoutPlan = require('../models/WorkoutPlan');

async function updatePlan() {
  const dryRun = process.argv.includes('--dry-run');

  await connectDB();

  const targets = await WorkoutPlan.find({
    target_area: 'neck',
    $or: [
      { title: /7 ngày/i },
      { description: /7 ngày/i },
      { duration_days: 7 },
    ],
  });

  if (!targets.length) {
    console.log('No neck workout plans matching 7-day criteria were found.');
    process.exit(0);
  }

  console.log(`Found ${targets.length} plan(s) to update.`);

  for (const plan of targets) {
    const nextTitle = (plan.title || '').replace(/7 ngày/gi, '14 ngày');
    const nextDescription = (plan.description || '').replace(/7 ngày/gi, '14 ngày');

    console.log(
      `${dryRun ? '[dry-run] ' : ''}${plan._id}: "${plan.title}" (${plan.duration_days} ngày) -> "${nextTitle}" (14 ngày)`
    );

    if (!dryRun) {
      plan.title = nextTitle || plan.title;
      plan.description = nextDescription || plan.description;
      plan.duration_days = 14;
      await plan.save();
    }
  }

  console.log(`Done (${dryRun ? 'dry-run' : 'write'} mode).`);
  process.exit(0);
}

updatePlan().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
