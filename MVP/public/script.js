document.getElementById('promptForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const prompt = document.getElementById('prompt').value;

    const responseContainer = document.getElementById('responseContainer');
    const acceptButton = document.getElementById('acceptBtn');
    const rejectButton = document.getElementById('rejectBtn');

    responseContainer.innerHTML = '';  // Clear previous response
    acceptButton.style.display = 'none'; // Hide the buttons initially
    rejectButton.style.display = 'none';

    try {
        const res = await fetch('/api/generate-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        const segments = data.response;

        // Display each segment with a title and border for separation
        segments.forEach((segment, index) => {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day-segment');
            
            const dayTitle = document.createElement('p');
            dayTitle.classList.add('day-title');
            dayTitle.textContent = `Day ${index + 1}`;
            
            const dayContent = document.createElement('p');
            dayContent.textContent = segment;

            dayDiv.appendChild(dayTitle);
            dayDiv.appendChild(dayContent);
            responseContainer.appendChild(dayDiv);
        });

        // Show the Accept and Reject buttons
        acceptButton.style.display = 'inline-block';
        rejectButton.style.display = 'inline-block';

    } catch (error) {
        console.error('Error:', error);
        responseContainer.textContent = 'Failed to generate a response. Please try again.';
    }
});

// Handle Accept button click
document.getElementById('acceptBtn').addEventListener('click', () => {
    alert('You accepted the roadmap!');
    // You can add further actions, like saving the roadmap or updating the UI
});

// Handle Reject button click
document.getElementById('rejectBtn').addEventListener('click', () => {
    alert('You rejected the roadmap!');
    // You can add further actions, like asking for another prompt or updating the UI
});