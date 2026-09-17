const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const motDePasse = document.getElementById("motDePasse");
const boutonConnexion = document.getElementById("boutonConnexion");
const messageConnexion = document.getElementById("messageConnexion");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const emailValue = email.value.trim();
    const motDePasseValue = motDePasse.value;

    messageConnexion.textContent = "";
    boutonConnexion.disabled = true;
    boutonConnexion.textContent = "Connexion...";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email: emailValue,
                mot_de_passe: motDePasseValue
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Impossible de se connecter."
            );
        }

        messageConnexion.textContent = "Connexion réussie !";
        messageConnexion.style.color = "green";

        setTimeout(function () {
            window.location.href = "/index.html";
        }, 500);

    } catch (error) {
        console.error("Erreur connexion :", error);

        messageConnexion.textContent = error.message;
        messageConnexion.style.color = "red";

        boutonConnexion.disabled = false;
        boutonConnexion.textContent = "Se connecter";
    }
});
