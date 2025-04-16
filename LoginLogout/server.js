const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); 


const app = express();
const port = 3000;

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sql12@admin',
    database: 'SmartSchedulerDB'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database!');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('views'));

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/goal', (req, res) => res.sendFile(path.join(__dirname, 'views', 'goal.html')));

// Register User
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, hashedPassword], (err) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).send('Registration failed.');
        }
        res.redirect('/');
    });
});

// Login User
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (error, results) => {
        if (error) return res.status(500).send('Database error');

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
                res.redirect('/dashboard.html'); // Replace with redirect logic
            } else {
                res.status(401).send('Invalid password');
            }
        });
    });
});

// Fetch Questions by Category
app.get('/get-questions', (req, res) => {
    const category = req.query.category;
    if (!category) {
        return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const sql = 'SELECT id, question, option_a, option_b, option_c, option_d FROM questions WHERE category = ? LIMIT 20';
    db.query(sql, [category], (err, results) => {
        if (err) {
            console.error('Error fetching questions:', err);
            return res.status(500).json({ success: false, message: 'Error fetching questions.' });
        }
        res.json({ success: true, questions: results });
    });
});



// Submit Quizapp.post('/submit-quiz', async (req, res) => {
    app.post('/submit-answers', (req, res) => {
        const { answers } = req.body;
    
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: 'Invalid answers format.' });
        }
    
        const questionIds = answers.map((a) => a.id);
        const userAnswers = answers.reduce((acc, curr) => {
            acc[curr.id] = curr.answer;
            return acc;
        }, {});
    
        const sql = 'SELECT id, correct_option, explanation FROM questions WHERE id IN (?)';
        db.query(sql, [questionIds], (err, results) => {
            if (err) {
                console.error('Error fetching answers:', err);
                return res.status(500).json({ success: false, message: 'Error calculating score.' });
            }
    
            let score = 0;
            const correctAnswers = {};
            const explanations = {};
    
            results.forEach((q) => {
                correctAnswers[q.id] = q.correct_option;
                explanations[q.id] = q.explanation;
                if (userAnswers[q.id] === q.correct_option) {
                    score++;
                }
            });
    
            res.json({ success: true, score, totalQuestions: results.length, correctAnswers, explanations });
        });
    });
    

// Start Server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
