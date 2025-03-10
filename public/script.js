document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const countryCode = document.getElementById('countryCode').value;
    let phone = document.getElementById('phone').value;
    if (!phone.startsWith(countryCode)) {
        phone = countryCode + phone;
    }
    const email = document.getElementById('email').value;

    const response = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email })
    });

    const result = await response.json();
    alert(result.message);
});
