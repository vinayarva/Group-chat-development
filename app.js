require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const sequelize = require('./util/database');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, { 
    cors: { origin: "*", credentials: true } 
});
const {CronJob} = require('cron');


app.use(cors({ origin: "*", credentials: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat-app');
const groupsRoutes = require('./routes/groups');

app.use('/user' , userRoutes);
app.use('/chat-app' , chatRoutes(io));
app.use('/groups' , groupsRoutes);

const User = require('./models/user');
const Message = require('./models/chat-app');
const Group = require('./models/group');
const GroupMember = require('./models/groupmembership');
const archivedChats = require('./controllers/archivedChats');


const job = new CronJob(
    '0 0 * * *', // Run at midnight every day
    archivedChats.archiveOldChats, // Function to call
    null, // onComplete
    true, // Start the job right now
    'Asia/Kolkata' // Time zone of this job
)

job.start();

// app.use((req, res, next) => {
//     res.sendFile(path.join(__dirname, `public/${req.url}`));
// });


User.hasMany(Message );
Message.belongsTo(User);
User.belongsToMany(Group , {through: GroupMember} );
Group.belongsToMany(User , { through: GroupMember});
GroupMember.belongsTo(User)
GroupMember.belongsTo(Group);
Group.hasMany(Message );
Message.belongsTo(Group);

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

sequelize.sync()
    .then(result => {
        server.listen( process.env.PORT || 3000, () => {;
            console.log('Server is running and database synchronized');
        });
    })
    .catch(err => {
        console.error('Error synchronizing database:', err);
    });

   