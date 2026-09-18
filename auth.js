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

    /* =========================================
           INFORMATIONS DE L'UTILISATEUR
           ========================================= */

    if (nomUtilisateur) {
      nomUtilisateur.textContent = data.utilisateur.nom;
    }

    if (roleUtilisateur) {
      if (data.utilisateur.role === "admin") {
        roleUtilisateur.textContent = "Administrateur";
      } else {
        roleUtilisateur.textContent = "Vendeur";
      }
    }

    /* =========================================
           LIEN UTILISATEURS
           ========================================= */

    const navigation = document.querySelector("header nav");

    if (navigation) {
      let lienUtilisateurs = navigation.querySelector(
        'a[href="/utilisateurs.html"]',
      );

      if (data.utilisateur.role === "admin") {
        if (!lienUtilisateurs) {
          lienUtilisateurs = document.createElement("a");

          lienUtilisateurs.href = "/utilisateurs.html";
          lienUtilisateurs.textContent = "Utilisateurs";

          navigation.appendChild(lienUtilisateurs);
        }
      } else {
        if (lienUtilisateurs) {
          lienUtilisateurs.remove();
        }
      }
    }

    /* =========================================
           PAGE ACTIVE
           ========================================= */

    const liensNavigation = document.querySelectorAll("header nav a");

    const pageActuelle =
      window.location.pathname.split("/").pop() || "index.html";

    liensNavigation.forEach((lien) => {
      const pageLien = lien.getAttribute("href").split("/").pop();

      lien.classList.remove("active");

      if (pageLien === pageActuelle) {
        lien.classList.add("active");
      }
    });
  } catch (error) {
    console.error("Erreur session :", error);

    window.location.href = "/login.html";
  }
}

/* =========================================
   DÉCONNEXION
   ========================================= */

if (boutonDeconnexion) {
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
}

/* =========================================
   DÉMARRAGE
   ========================================= */

chargerUtilisateur();
