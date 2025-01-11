//IMPORTING MODULES

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const CookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');


//ASSIGN DATA MODEL
const VotersProfile = require('./models/VotersProfileModel');
const Ballot = require('./models/BallotModel');


// ASIGN DOTENV
require("dotenv").config();
// ASIGN EXPRESS JSON
app.use(express.json())
// ASIGN EXPRESS URLENCODED
app.use(express.urlencoded({extended: false}))


// OAUTH API CORS

app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// COOKIES MIDDLEWARE
app.use(CookieParser());

// VAR INIT
const PORT = process.env.PORT;
const mongodbAPI = process.env.MONGODB_API;
const TOKEN = process.env.TOKEN


// MAIN ROUTE
app.get('/', (req, res) => {
    res.send('Pemilihan Umum Raya HME ITB 2025 API')
})

// NODEMAILER
const nodeMailer = require('nodemailer')

const html = (username, pass) => {

    return (`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
            body {
                display: flex;
                height: 100vh;
                font-family: Arial, sans-serif;
                margin: 0;
            }
            .container {
                margin: auto;
                width: 500px;
            }
            .content {
                padding: 50px;
                height: 400px;
                color: rgb(14, 97, 12);
                background-image: linear-gradient(#d6d1b0, rgb(152, 182, 98));
            }
            .footer {
                background-color: #0c0605; 
                color: #E6DB9Cff; 
                text-align: center;
                padding: 20px;
            }
            .header{
                background-color: rgb(130, 64, 52); 
                color: #E6DB9Cff; 
                text-align: center;
                padding: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container"> 
            <div class="header">
                <b>Divisi Komputer Pemira HME ITB</b>
            </div>       
            <div class="content">
                <h1>Halo CHAMP!!</h1>
                <p>Berikut informasi kredensial akun pemira kamu.</p>
                <h4>Username : ${username}</h4>
                <h4>Password : ${pass}</h4>            
            </div>
            <div class="footer">
                <b>© PEMIRA HME ITB 2023</b>
            </div>
        </div>
    </body>
    </html>

    `);
};

async function sendEmail (username, pass, email){
    console.log("pengiriman dimulai", Date())
    const transporter = nodeMailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user : process.env.USERNAME_MAIL,
            pass: process.env.PASS_MAIL
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false,
        },
    });
    try {
        const info = await transporter.sendMail({
            from: "Pemira HME ITB 2023 <pemirahme@gmail.com>",
            to: email,
            subject: 'Credential Information',
            html: html(username, pass),
        })
        if (info){
            console.log("pengiriman email berhasil dijalankan pada", Date(), info);
        }
        return info
    } catch (error) {
        console.error("Terjadi kesalahan saat mengirim email:", error);
        return error
    } 
}

// Kirim E-Mail
app.post('/api/send_credential', async (req, res) => {
    // Mendapatkan data dari body request
    const { username, pass, token } = req.body;

    if (!username || !pass || !token) {
        // Jika salah satu dari username, pass, atau email tidak ada, kirim error 400
        return res.status(400).send({
          error: 'Bad Request',
          message: 'Username, password, dan token harus diisi.'
        });
    } else {
        if (token == TOKEN) {
            // Mengirimkan response
            
            const email = username+"@std.stei.itb.ac.id"
            let MailCredentialStatus = await sendEmail(username, pass, email)
            res.status(200).json({ 
                action: "success",
                messageId: MailCredentialStatus.messageId 
            });
        } else {
            return res.status(400).send({
                error: 'Bad Request',
                message: 'API Token not match, API Request Terminated'
              });
        }
    }
    
});

// Write Voters Account
app.post('/api/post_account_data', async (req, res) => {
    // Mendapatkan data dari body request
    const { username, pass, token } = req.body;
    const VoterData = {...req.body};

    if (!username || !pass || !token) {
        // Jika salah satu dari username, atau  pass tidak ada, kirim error 400
        return res.status(400).send({
          error: 'Bad Request',
          message: 'Username, password, dan token harus diisi.'
        });
    } else {
        if (token == TOKEN) {
            // Mengirimkan response
            const isExist = await VotersProfile.findOne({ username: username });

            if (!isExist){
                console.log("action : writing a data")
                const VoterStatus = await VotersProfile.create(VoterData);
                res.status(200).json({ 
                    action: "success",
                    messageId: VoterStatus.messageId 
                });
            } else {
                return res.status(400).send({
                    error: 'Bad Request',
                    message: 'Voter data already exist, API Request Terminated'
                  });

            }
        } else {
            return res.status(400).send({
                error: 'Bad Request',
                message: 'API Token not match, API Request Terminated'
              });
        }
    }
    
});

// LOGIN API
app.post('/api/login', async (req, res) => {
    const { username, pass, token } = req.body;

    if (!username || !pass || !token) {
        return res.status(400).send({
          error: 'Bad Request',
          message: 'Username, password, dan token harus diisi.'
        });
    } else {
        if (token == TOKEN) {
            try {
                console.log("memproses login")
                const user = await VotersProfile.login(username, pass);
                const token = username;
                res.status(200).json({ ID : token});
            }
            catch (error){
                res.status(400).json({"error" : error.message});
            } 
        } else {
            return res.status(400).send({
                error: 'Bad Request',
                message: 'API Token not match, API Request Terminated'
              });
        }
    }
});

// VOTE API
app.post('/api/vote', async (req, res) => {
    // Mendapatkan data dari body request
    const { username, pilihan, token } = req.body;
    const VoteData = {...req.body};
    console.log(username, pilihan, token)

    if (!username || !pilihan || !token) {
        // Jika salah satu dari username, atau  pass tidak ada, kirim error 400
        return res.status(400).send({
          error: 'Bad Request',
          message: 'Username, pilihan, dan token harus diisi.'
        });
    } else {
        if (token == TOKEN) {
            // Mengirimkan response
            const isExist = await Ballot.findOne({ username: username });

            if (!isExist){
                console.log("action : writing a data")
                const VoteStatus = await Ballot.create(VoteData);
                res.status(200).json({ 
                    action: "success",
                    messageId: VoteStatus.messageId 
                });
            } else {
                return res.status(400).send({
                    error: 'Bad Request',
                    message: 'Vote data already exist, API Request Terminated'
                  });

            }
        } else {
            return res.status(400).send({
                error: 'Bad Request',
                message: 'API Token not match, API Request Terminated'
              });
        }
    }
    
});

// CHECK ACCOUNT API
app.post('/api/is_there', async (req, res) => {
    // Mendapatkan data dari body request
    const { username, token } = req.body;

    if (!username || !token) {
        // Jika salah satu dari username atau  token tidak ada, kirim error 400
        return res.status(400).send({
          error: 'Bad Request',
          message: 'Username, dan token harus diisi.'
        });
    } else {
        if (token == TOKEN) {
            // Mencari data
            const isExist = await VotersProfile.findOne({ username: username });

            if (!isExist){
                res.status(200).json({ 
                    status: "success",
                    data: "false"
                });
            } else {
                return res.status(200).json({ 
                    action: "success",
                    data: "true"
                });

            }
        } else {
            return res.status(400).send({
                error: 'Bad Request',
                message: 'API Token not match, API Request Terminated'
              });
        }
    }
    
});


// CHECK VOTE API
app.post('/api/is_vote', async (req, res) => {
    // Mendapatkan data dari body request
    const { username, token } = req.body;

    if (!username || !token) {
        // Jika salah satu dari username atau  token tidak ada, kirim error 400
        return res.status(400).send({
          error: 'Bad Request',
          message: 'Username, dan token harus diisi.'
        });
    } else {
        if (token == TOKEN) {
            // Mencari data
            const isExist = await Ballot.findOne({ username: username });

            if (!isExist){
                res.status(200).json({ 
                    status: "success",
                    data: "false"
                });
            } else {
                return res.status(200).json({ 
                    action: "success",
                    data: "true"
                });

            }
        } else {
            return res.status(400).send({
                error: 'Bad Request',
                message: 'API Token not match, API Request Terminated'
              });
        }
    }
    
});

//COOUNT VOTE DATA API

app.get('/api/live_count', async (req, res) => {
    try {
        const Poggy = await Ballot.countDocuments({ pilihan: '1' })
        const Kotak = await Ballot.countDocuments({ pilihan: '2' })

        res.status(200).json({ Poggy: Poggy, kotak: Kotak });
    } catch (err) {
        res.status(500).json({ message: 'Terjadi kesalahan saat menghitung suara.', error: err.message });
    }
});

app.get('/api/live_count_total', async (req, res) => {
    try {
        const Poggy = await Ballot.countDocuments({ pilihan: '1' })
        const Kotak = await Ballot.countDocuments({ pilihan: '2' })

        res.status(200).json({ suara: Poggy + Kotak });
    } catch (err) {
        res.status(500).json({ message: 'Terjadi kesalahan saat menghitung suara.', error: err.message });
    }
});

// DELETE VOTER DATA (ADMIN ONLY)

app.delete('/admin/api/deleteAccount', async (req, res) => {
    const { username, pass, token } = req.body;
    //console.log(email)

    if (!username || !pass || !token) {
        return res.status(400).send({
          error: 'Bad Request',
          message: 'Username, password, dan token harus diisi.'
        });
    } else {
        if (token == TOKEN) {
            try {
                const registrant = await VotersProfile.findOneAndDelete({ username });
        
                if (!registrant) {
                    return res.status(404).json({ message: 'Akun dengan username tersebut tidak ditemukan.' });
                }
        
                res.status(200).json({ message: 'Akun berhasil dihapus.' });
            } catch (err) {
                res.status(500).json({ message: 'Terjadi kesalahan saat menghapus akun.', error: err.message });
            }
        } else {
            return res.status(400).send({
                error: 'Bad Request',
                message: 'API Token not match, API Request Terminated'
              });
        }
    }

});

// DELETE VOTE DATA (ADMIN ONLY)

app.delete('/admin/api/deleteVote', async (req, res) => {
    const { username, token } = req.body;
    //console.log(email)

    if (!username || !token) {
        return res.status(400).send({
          error: 'Bad Request',
          message: 'Username, password, dan token harus diisi.'
        });
    } else {
        if (token == TOKEN) {
            try {
                const voteData = await Ballot.findOneAndDelete({ username });
        
                if (!voteData) {
                    return res.status(404).json({ message: 'Data pilihan akun tersebut tidak ditemukan.' });
                }
        
                res.status(200).json({ message: 'Data berhasil dihapus.' });
            } catch (err) {
                res.status(500).json({ message: 'Terjadi kesalahan saat menghapus data.', error: err.message });
            }
        } else {
            return res.status(400).send({
                error: 'Bad Request',
                message: 'API Token not match, API Request Terminated'
              });
        }
    }

});


// MONGODB CONNECTION
mongoose.connect(mongodbAPI)
.then(() => {
    console.log('connected to mongodb')
    app.listen(PORT, () => {
        console.log('Node API app is running on port',PORT)
    })
}).catch((error) => {
    console.log(error)
})

