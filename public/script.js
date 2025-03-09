document.addEventListener("DOMContentLoaded", function () {
    const countrySelect = document.getElementById("country");

    fetch("https://restcountries.com/v3.1/all")
        .then(response => response.json())
        .then(countries => {
            countries.forEach(country => {
                let option = document.createElement("option");
                option.value = country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : "");
                option.textContent = `${country.name.common} (${option.value})`;
                countrySelect.appendChild(option);
            });
        });

    document.getElementById("contactForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;
        const countryCode = countrySelect.value;

        fetch("/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone: countryCode + phone, email })
        })
        .then(res => res.json())
        .then(data => alert(data.message))
        .catch(err => console.error(err));
    });
});
