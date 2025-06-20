const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

const isloggedin = require('./middleware/isLoggedin');
const onlyAdmin = require('./middleware/onlyAdmin');

const indexRouter = require('./routes');
const adminRouter = require('./routes/adminRouter');
const usersRouter = require('./routes/usersRouter');
const pollsRouter = require('./routes/pollsRouter');
const likesRouter = require('./routes/likesRouter');
const commentsRouter = require('./routes/commentsRouter');
const votesRouter = require('./routes/votesRouter');
const savesRouter = require('./routes/savesRouter');
const groupsRouter = require('./routes/groupsRouter');

require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);

app.use(isloggedin);
app.use('/admins', onlyAdmin, adminRouter);
app.use('/users',  usersRouter);
app.use('/polls',  pollsRouter);
app.use('/likes', likesRouter);
app.use('/votes', votesRouter);
app.use('/saves',  savesRouter);
app.use('/comments',  commentsRouter);
app.use('/groups', groupsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

module.exports = app;