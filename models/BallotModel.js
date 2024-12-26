const mongoose = require('mongoose');
const { type } = require('os');

const BallotSchema = mongoose.Schema(
    {
        username:{
            type: String,
            required: true
        },
        pilihan:{
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Ballot = mongoose.model('Ballot', BallotSchema);

module.exports = Ballot;