document.getElementById("contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const country = document.getElementById("country").value;
    const name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();

    // Remove existing country code if the user added it manually
    phone = phone.replace(/^\+\d+/, '');

    const response = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, countryCode: country })
    });

    const data = await response.json();
    alert(data.message);
});
