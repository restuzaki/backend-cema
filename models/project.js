const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProjectSchema = new Schema(
	{
		id: { type: String, required: true, unique: true },

		name: { type: String, required: true },
		description: { type: String },

		admin_id: { type: Schema.Types.ObjectId, ref: "User" },

		client_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
		clientName: { type: String, required: true },

		manager_id: { type: Schema.Types.ObjectId, ref: "User" },
		managerName: { type: String },

		team_members: [{ type: Schema.Types.ObjectId, ref: "User" }],

		status: {
			type: String,
			enum: [
				"LEAD",
				"DESIGN",
				"CONSTRUCTION",
				"RETENTION",
				"COMPLETED",
				"CANCELLED",
			],
			default: "LEAD",
		},

		serviceType: {
			type: String,
			enum: ["INTERIOR", "ARCHITECTURE", "RENOVATION", "CONSULTATION"],
			required: true,
		},

		location: {
			address: String,
			coordinates: { lat: Number, lng: Number },
		},

		progress: { type: Number, default: 0, min: 0, max: 100 },

		startDate: { type: Date, required: true },
		endDate: { type: Date },

		financials: {
			budget_total: { type: Number, default: 0 },
			cost_actual: { type: Number, default: 0 },
			value_planned: { type: Number, default: 0 },
			value_earned: { type: Number, default: 0 },
			cpi: { type: Number, default: 0 },
			spi: { type: Number, default: 0 },
		},

		documents: [
			{
				title: String,
				url: String,
				type: { type: String, enum: ["CONTRACT", "BLUEPRINT", "INVOICE"] },
				uploaded_at: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
