document.getElementById('contactForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;

    const response = await fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, email }),
    });

    const result = await response.json();

    if (response.ok) {
        alert('Contact saved successfully!');
        document.getElementById('contactForm').reset();
    } else {
        alert('Error: ' + result.error);
    }
});
