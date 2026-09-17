const nomUtilisateur = document.getElementById("nomUtilisateur");
const roleUtilisateur = document.getElementById("roleUtilisateur");
const boutonDeconnexion = document.getElementById("boutonDeconnexion");

async function chargerUtilisateur() {
  try {
    const response = await fetch("/api/session", {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok || !data.connecte) {
      window.location.href = "/login.html";
      return;
    }

    nomUtilisateur.textContent = data.utilisateur.nom;

    if (data.utilisateur.role === "admin") {
      roleUtilisateur.textContent = "Administrateur";
    } else {
      roleUtilisateur.textContent = "Vendeur";
    }

    // Gestion du lien "Utilisateurs"
    const lienUtilisateurs = document.querySelector(
      'a[href="/utilisateurs.html"]',
    );

    if (lienUtilisateurs) {
      if (data.utilisateur.role === "admin") {
        lienUtilisateurs.style.display = "inline-block";
      } else {
        lienUtilisateurs.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Erreur session :", error);

    window.location.href = "/login.html";
  }
}

boutonDeconnexion.addEventListener("click", async function () {
  const confirmation = confirm("Voulez-vous vraiment vous déconnecter ?");

  if (!confirmation) {
    return;
  }

  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Impossible de se déconnecter.");
    }

    window.location.href = "/login.html";
  } catch (error) {
    console.error("Erreur déconnexion :", error);

    alert("Une erreur est survenue pendant la déconnexion.");
  }
});

chargerUtilisateur();
