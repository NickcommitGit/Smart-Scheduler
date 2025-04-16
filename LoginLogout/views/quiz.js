const questionContainer = document.getElementById('question-container');
const submitButton = document.getElementById('submit-quiz');
const scoreContainer = document.getElementById('score-container');

// Fetch questions from the server
function loadQuestions(category) {
    fetch(`/get-questions?category=${category}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                renderQuestions(data.questions);
            } else {
                alert('Failed to fetch questions. Try again.');
            }
        })
        .catch((err) => console.error('Error fetching questions:', err));
}

// Render questions on the page
function renderQuestions(questions) {
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
}

// Submit answers and show explanations
submitButton.addEventListener('click', () => {
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
        body: JSON.stringify({ answers }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                showResults(data.correctAnswers, data.explanations, data.score, data.totalQuestions);
            } else {
                alert('Error calculating score.');
            }
        })
        .catch((err) => console.error('Error submitting answers:', err));
});

// Show explanations and results
function showResults(correctAnswers, explanations, score, totalQuestions) {
    const questionElements = document.querySelectorAll('.question');

    questionElements.forEach((q, index) => {
        const questionId = q.querySelector('input[type="radio"]').name.split('_')[1];
        const selectedOption = q.querySelector('input[type="radio"]:checked');
        const correctOption = correctAnswers[questionId];
        const explanationText = explanations[questionId];

        if (selectedOption) {
            if (selectedOption.value === correctOption) {
                selectedOption.parentElement.classList.add('correct');
            } else {
                selectedOption.parentElement.classList.add('incorrect');
            }
        }

        // Highlight the correct option
        const correctRadio = q.querySelector(`input[value="${correctOption}"]`);
        if (correctRadio) {
            correctRadio.parentElement.classList.add('correct');
        }

        // Add explanation below the question
        const explanationDiv = document.createElement('div');
        explanationDiv.classList.add('explanation');
        explanationDiv.innerHTML = `<strong>Explanation:</strong> ${explanationText}`;
        q.appendChild(explanationDiv);
    });

    // Show the final score
    scoreContainer.innerHTML = `<h2>Your Score: ${score} / ${totalQuestions}</h2>`;
}
