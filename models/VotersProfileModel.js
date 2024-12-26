const mongoose = require('mongoose');
const { type } = require('os');
const bcrypt = require('bcrypt')

const VotersProfileSchema = mongoose.Schema(
    {
        username:{
            type: String,
            required: true
        },
        pass:{
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// fire a function befora doc saved into db
VotersProfileSchema.pre('save', async function (next){
    const salt = await bcrypt.genSalt();
    this.pass =  await bcrypt.hash(this.pass, salt)
    next();
})

// static method to login user
VotersProfileSchema.statics.login = async function(username, pass) {
    const user = await this.findOne({ username });
    
    if (user){
        //console.log(user)
        const auth = await bcrypt.compare(pass, user.pass);
        if (auth) {
            return user.token;
        }
        throw Error("Incorrect pass")
    }
    throw Error("Incorrect username")    
}

const VotersProfile = mongoose.model('VotersProfile', VotersProfileSchema);

module.exports = VotersProfile;