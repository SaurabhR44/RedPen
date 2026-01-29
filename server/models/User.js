const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password_hash: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);
