const practiceOsBtn = document.getElementById('practice-os');
const practiceJavaBtn = document.getElementById('practice-java');
const giveTestBtn = document.getElementById('give-test');
const questionContainer = document.getElementById('question-container');
const scoreContainer = document.getElementById('score-container');
const scoreDisplay = document.getElementById('score-display');

// Add Event Listeners for Category Buttons
practiceOsBtn.addEventListener('click', () => fetchQuestions('os'));
practiceJavaBtn.addEventListener('click', () => fetchQuestions('java'));
giveTestBtn.addEventListener('click', () => {
    alert('Give Test functionality is not implemented yet.');
});

// Fetch Questions from Server Based on Category
function fetchQuestions(category) {
    fetch(`/get-questions?category=${category}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                renderQuestions(data.questions, category);
            } else {
                alert(data.message || 'Failed to fetch questions. Try again.');
            }
        })
        .catch((err) => console.error('Error fetching questions:', err));
}

// Render Questions in the Container
function renderQuestions(questions, category) {
    questionContainer.innerHTML = ''; // Clear existing questions

    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.innerHTML = `
            <p><strong>${index + 1}. ${q.question}</strong></p>
            <label><input type="radio" name="question_${q.id}" value="a"> ${q.option_a}</label><br>
            <label><input type="radio" name="question_${q.id}" value="b"> ${q.option_b}</label><br>
            <label><input type="radio" name="question_${q.id}" value="c"> ${q.option_c}</label><br>
            <label><input type="radio" name="question_${q.id}" value="d"> ${q.option_d}</label><br>
        `;
        questionContainer.appendChild(questionDiv);
    });

    // Add Submit Button for Quiz
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.classList.add('submit-button');
    submitButton.addEventListener('click', () => submitAnswers(category));
    questionContainer.appendChild(submitButton);
}

// Submit Answers to Server
function submitAnswers(category) {
    const answers = [];
    const questionElements = document.querySelectorAll('.question');

    questionElements.forEach((q) => {
        const questionId = q.querySelector('input[type="radio"]').name.split('_')[1];
        const selectedOption = q.querySelector('input[type="radio"]:checked');
        answers.push({
            id: questionId,
            answer: selectedOption ? selectedOption.value : null,
        });
    });

    fetch('/submit-answers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers, category }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                displayScore(data.score, data.totalQuestions);
            } else {
                alert(data.message || 'Error calculating score.');
            }
        })
        .catch((err) => console.error('Error submitting answers:', err));
}

// Display the User's Score
function displayScore(score, totalQuestions) {
    scoreContainer.style.display = 'block'; // Show score container
    scoreDisplay.innerHTML = `Your score: <strong>${score}</strong> / ${totalQuestions}`;
}
