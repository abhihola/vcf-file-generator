document.getElementById("contactForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const whatsapp = document.getElementById("whatsapp").value;
    const email = document.getElementById("email").value;

    const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp, email })
    });

    if (response.ok) {
        alert("Contact submitted successfully!");
    } else {
        alert("Error submitting contact.");
    }
});
