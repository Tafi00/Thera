const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
	{
		// Google OAuth fields
		googleId: { type: String, sparse: true },
		email: { type: String, required: true, unique: true },
		full_name: { type: String, default: "" },
		avatar_url: { type: String, default: "" },

		// App profile fields
		age: { type: Number, default: 0 },
		occupation: { type: String, default: "" },
		gender: { type: String, default: "" },
		height: { type: String, default: "" },
		weight: { type: String, default: "" },
		target_weight: { type: String, default: "" },
		primary_goal: { type: String, default: "" },
		focus_area: { type: String, default: "" },
		limitations: { type: String, default: "" },
		diet_type: { type: String, default: "" },
		pain_areas: [{ type: String }],
		symptoms: [{ type: String }],
		surgery_history: { type: String, default: "" },
		preferred_time: { type: String, default: "08:00" },
		personalized_plan_started_at: { type: Date, default: null },
		personalized_plan_completed_at: { type: Date, default: null },
		personalized_plan_unlock_at: { type: Date, default: null },

		// Access control
		role: { type: String, enum: ["user", "admin"], default: "user" },
		is_pro: { type: Boolean, default: false },
		owned_devices: [{ type: mongoose.Schema.Types.Mixed }],

		// Admin auth (password only for admin)
		password: { type: String, select: false },

		// Timestamps
		created_at: { type: Date, default: Date.now },
		updated_at: { type: Date, default: Date.now },
	},
	{
		timestamps: false,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// Hash password before save (admin only)
userSchema.pre("save", async function (next) {
	if (!this.isModified("password") || !this.password) return next();
	this.password = await bcrypt.hash(this.password, 12);
	next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
	if (!this.password) return false;
	return bcrypt.compare(candidatePassword, this.password);
};

// Update `updated_at` on save
userSchema.pre("save", function (next) {
	this.updated_at = new Date();
	next();
});

module.exports = mongoose.model("User", userSchema);
