document.addEventListener("DOMContentLoaded", function () {
    const countrySelect = document.getElementById("country");
    const searchInput = document.getElementById("search");

    fetch("https://restcountries.com/v3.1/all")
        .then(response => response.json())
        .then(countries => {
            countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

            countries.forEach(country => {
                if (country.idd.root && country.idd.suffixes) {
                    const option = document.createElement("option");
                    option.value = country.idd.root + country.idd.suffixes[0];
                    option.textContent = `${country.name.common} (${option.value})`;
                    countrySelect.appendChild(option);
                }
            });

            countrySelect.value = "+234"; // Set Nigeria as the default
        });

    searchInput.addEventListener("input", function () {
        const filter = searchInput.value.toLowerCase();
        for (let option of countrySelect.options) {
            option.style.display = option.textContent.toLowerCase().includes(filter) ? "" : "none";
        }
    });

    document.getElementById("contactForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;
        const countryCode = document.getElementById("country").value;
        
        fetch("/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone: countryCode + phone, email })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById("message").textContent = data.message;
        })
        .catch(err => console.error("Error:", err));
    });
});
