document.addEventListener('DOMContentLoaded', async () => {
    const countrySelect = document.getElementById('country');

    // Fetch all countries dynamically
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            data.forEach(country => {
                if (country.idd && country.idd.root) {
                    const countryCode = country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : '');
                    const option = document.createElement('option');
                    option.value = countryCode;
                    option.textContent = `${country.name.common} (${countryCode})`;
                    countrySelect.appendChild(option);
                }
            });
        });

    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const countryCode = document.getElementById('country').value;

        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email, countryCode })
        });

        const data = await response.json();
        alert(data.message);
    });
});
