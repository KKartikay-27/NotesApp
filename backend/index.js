require("dotenv").config();

const apiUrl = 'https://notesapp-ixg7.onrender.com';


const mongoose = require('mongoose');

mongoose.connect(process.env.CONNECTION_STRING);

const User = require('./models/user.model')
const Note = require('./models/note.model');

const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');


const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./utilities');

app.use(express.json());

app.use(
    cors({
        origin: 'https://notesapp-vz2r.onrender.com', 
    })
);

app.use(express.static(path.join(__dirname, '../frontend/notesapp/dist')));

app.get('/', (req, res) => {
    res.json({ data: "Hello" });
});

//Create a new user
app.post('/create-account', async (req, res) => {

    const { fullname, email, password } = req.body;

    if (!fullname) {
        return res.status(400).json({ error: true, message: "Fullname is required" });
    }

    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }

    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required" });
    }

    const isUser = await User.findOne({ email: email });

    if (isUser) {
        return res.json({
            error: true,
            message: "User already exists"
        });
    }


    const user = new User({
        fullname,
        email,
        password,
    });

    await user.save();

    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "36000m",
    })

    return res.json({
        error: false,
        user,
        accessToken,
        message: "User created successfully",
    });

});

//Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }

    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required" });
    }

    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
        return res.status(400).json({ error: true, message: "User not found" });
    }

    if (userInfo.email == email && userInfo.password == password) {
        const user = { user: userInfo };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        });

        return res.json({
            error: false,
            message: "Login successful",
            email,
            accessToken,
        });
    } else {
        return res.status(400).json({
            error: true,
            message: "Invalid credentials"
        });
    }
});

//Get User
app.get('/get-user', authenticateToken, async (req, res) => {
    const user = req.user.user;

    const isUser = await User.findOne({ _id: user._id });

    if (!isUser) {
        return res.sendStatus(401);
    }

    return res.json({
        user: {
            fullname: isUser.fullname,
            email: isUser.email,
            _id: isUser._id,
            createdOn: isUser.createdOn,
        },
        message: "",
    });
});

//Add a note
app.post('/add-note', authenticateToken, async (req, res) => {
    const { title, content, tags } = req.body;
    const { user } = req.user;


    if (!title) {
        return res.status(400).json({ error: true, message: "Title is required" });
    }

    if (!content) {
        return res.status(400).json({ error: true, message: "Content is required" });
    }

    try {
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });

        await note.save();

        return res.json({
            error: false,
            message: "Note added successfully",
            note,
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }
})

//Edit a note
app.put('/edit-note/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if (!title && !content && !tags) {
        return res.status(400).json({ error: true, message: "No changes provided" });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(400).json({ error: true, message: "Note not found" });
        }

        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned) note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note edited successfully",
        })

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }
});

//Get all notes
app.get('/get-all-notes/', authenticateToken, async (req, res) => {
    const { user } = req.user;

    try {
        const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });

        return res.json({
            error: false,
            notes,
            message: "All Notes fetched successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

//Delete a note
app.delete('/delete-note/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { user } = req.user;

    try {

        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(401).json({
                error: true,
                message: "Note not found"
            })
        }
        await note.deleteOne({ _id: noteId, userId: user._id });

        return res.json({
            error: false,
            message: "Note deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

//Pin a note
app.put('/update-note-pinned/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { user } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(400).json({ error: true, message: "Note not found" });
        }

        if (typeof isPinned === 'boolean') {
            note.isPinned = isPinned;
        }

        await note.save();

        return res.json({
            error: false,
            note,
            message: isPinned ? "Note pinned successfully" : "Note unpinned successfully",
        })

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }
});

//Search notes
app.get('/search-notes/', authenticateToken, async (req, res) => {
    const { user } = req.user;
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: true, message: "Search Query is required" });
    }

    try {

        const matchingNotes = await Note.find({
            userId: user._id,
            $or: [
                { title: { $regex: new RegExp(query, 'i') } },
                { content: { $regex: new RegExp(query, 'i') } },
            ]
        });

        return res.json({
            error: false,
            notes: matchingNotes,
            message: "Notes matching the search query fetched successfully",
        })

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/notesapp/dist/index.html'));
});

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});

module.exports = app;