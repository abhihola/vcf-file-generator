document.getElementById('contactForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email })
        });

        const data = await response.json();
        alert(data.message);
        document.getElementById('contactForm').reset();
    } catch (error) {
        console.error('Error submitting contact:', error);
    }
});
