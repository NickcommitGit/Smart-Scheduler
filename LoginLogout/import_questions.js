const mysql = require('mysql2');
const fs = require('fs');
const mammoth = require('mammoth'); // For parsing Word docs

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sql12@admin', // Update your password
    database: 'SmartSchedulerDB' // Update your DB name
});

const path = require('path');
const filePath = path.join(__dirname, 'questions.docx');

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to MySQL!');
});

// Function to parse the docx file
async function parseDocFile(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });

        const lines = result.value.split('\n');
        let category = "JAVA"; // Change this as needed or detect from the file
        let question = '';
        let options = [];
        let correctOption = '';
        let explanation = '';

        for (const line of lines) {
            if (line.trim() === '') continue;

            if (/^\d+\)/.test(line)) {
                // New question detected
                if (question) {
                    // Insert the previous question into the database
                    insertQuestion(category, question, options, correctOption, explanation);
                }
                question = line.replace(/^\d+\)\s*/, '').trim();
                options = [];
                correctOption = '';
                explanation = '';
            } else if (/^Answer:/.test(line)) {
                // Extract the correct answer
                const match = line.match(/Answer: \((.)\)/);
                correctOption = match ? match[1].toUpperCase() : '';
            } else if (/^Explanation:/.test(line)) {
                // Extract the explanation
                explanation = line.replace(/^Explanation:\s*/, '').trim();
            } else {
                // Add the line as an option
                options.push(line.trim());
            }
        }

        // Insert the last question
        if (question) {
            insertQuestion(category, question, options, correctOption, explanation);
        }

        console.log('Questions imported successfully!');
    } catch (err) {
        console.error('Error parsing doc file:', err);
    }
}

// Function to insert question into the database
function insertQuestion(category, question, options, correctOption, explanation) {
    if (options.length < 4 || !correctOption) {
        console.error('Invalid question format, skipping:', question);
        return;
    }

    const sql = `INSERT INTO questions (category, question, option_a, option_b, option_c, option_d, correct_option, explanation) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
        sql,
        [category, question, options[0], options[1], options[2], options[3], correctOption, explanation],
        (err) => {
            if (err) {
                console.error('Error inserting question:', err);
            }
        }
    );
}

// Run the parser
parseDocFile('./questions.docx');
