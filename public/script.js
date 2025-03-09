document.addEventListener("DOMContentLoaded", () => {
    const countryDropdown = document.getElementById("country");

    // Common Countries with Country Codes
    const countries = [
        { name: "Nigeria", code: "+234" },
        { name: "United States", code: "+1" },
        { name: "United Kingdom", code: "+44" },
        { name: "Ghana", code: "+233" },
        { name: "South Africa", code: "+27" },
        { name: "Kenya", code: "+254" },
        { name: "India", code: "+91" },
        { name: "Canada", code: "+1" },
        { name: "Germany", code: "+49" },
        { name: "France", code: "+33" },
        { name: "Italy", code: "+39" },
        { name: "Spain", code: "+34" },
        { name: "China", code: "+86" },
        { name: "Brazil", code: "+55" },
        { name: "Mexico", code: "+52" },
        { name: "United Arab Emirates", code: "+971" },
        { name: "Saudi Arabia", code: "+966" },
        { name: "Turkey", code: "+90" },
        { name: "Japan", code: "+81" },
        { name: "South Korea", code: "+82" },
        { name: "Egypt", code: "+20" },
        { name: "Russia", code: "+7" },
        { name: "Thailand", code: "+66" },
        { name: "Vietnam", code: "+84" },
        { name: "Pakistan", code: "+92" },
        { name: "Bangladesh", code: "+880" },
        { name: "Philippines", code: "+63" },
        { name: "Malaysia", code: "+60" },
        { name: "Indonesia", code: "+62" },
        { name: "Singapore", code: "+65" },
        { name: "Australia", code: "+61" },
        { name: "New Zealand", code: "+64" },
        { name: "Netherlands", code: "+31" },
        { name: "Sweden", code: "+46" },
        { name: "Switzerland", code: "+41" },
        { name: "Argentina", code: "+54" },
        { name: "Colombia", code: "+57" },
        { name: "Chile", code: "+56" },
        { name: "Portugal", code: "+351" },
        { name: "Poland", code: "+48" },
        { name: "Romania", code: "+40" },
        { name: "Ukraine", code: "+380" },
        { name: "Ireland", code: "+353" },
        { name: "Greece", code: "+30" },
        { name: "Czech Republic", code: "+420" },
        { name: "Belgium", code: "+32" },
        { name: "Austria", code: "+43" },
        { name: "Norway", code: "+47" },
        { name: "Denmark", code: "+45" },
        { name: "Finland", code: "+358" },
        { name: "Israel", code: "+972" },
        { name: "Hong Kong", code: "+852" },
        { name: "Taiwan", code: "+886" },
        { name: "Sri Lanka", code: "+94" },
        { name: "Nepal", code: "+977" },
        { name: "Myanmar", code: "+95" },
        { name: "Kazakhstan", code: "+7" }
    ];

    // Populate Dropdown
    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country.code;
        option.textContent = `${country.name} (${country.code})`;
        countryDropdown.appendChild(option);
    });

    // Make Dropdown Searchable
    new Choices("#country", { searchEnabled: true });

    // Form Submission
    document.getElementById("contactForm").addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const countryCode = document.getElementById("country").value;
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;

        if (!countryCode) {
            alert("Please select your country.");
            return;
        }

        const fullPhoneNumber = countryCode + phone;

        const response = await fetch("/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone: fullPhoneNumber, email }),
        });

        if (response.ok) {
            alert("Contact submitted successfully!");
            document.getElementById("contactForm").reset();
        } else {
            alert("Error submitting contact.");
        }
    });
});
