const CLIENTS_API = "http://localhost:3000/api/clients";

const clientForm = document.getElementById("clientForm");

const nomComplet = document.getElementById("nomComplet");

const telephone = document.getElementById("telephone");

const email = document.getElementById("email");

const ville = document.getElementById("ville");

const clientsList = document.getElementById("clientsList");

const rechercheClient = document.getElementById("rechercheClient");

let clients = [];

let clientEnModification = null;

/* =================================
   CHARGER LES CLIENTS
================================= */

async function chargerClients() {
  try {
    const response = await fetch(CLIENTS_API);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les clients.");
    }

    clients = await response.json();

    afficherClients(clients);
  } catch (error) {
    console.error("Erreur clients :", error);

    clientsList.innerHTML = `
            <tr>

                <td colspan="6">

                    Impossible de charger
                    les clients.

                </td>

            </tr>
        `;
  }
}

/* =================================
   AFFICHER LES CLIENTS
================================= */

function afficherClients(listeClients) {
  clientsList.innerHTML = "";

  if (listeClients.length === 0) {
    clientsList.innerHTML = `
            <tr>

                <td colspan="6">

                    Aucun client trouvé.

                </td>

            </tr>
        `;

    return;
  }

  listeClients.forEach((client) => {
    const ligne = document.createElement("tr");

    ligne.innerHTML = `

                <td>
                    ${client.id}
                </td>

                <td>
                    ${client.nom_complet}
                </td>

                <td>
                    ${client.telephone}
                </td>

                <td>
                    ${client.email || "-"}
                </td>

                <td>
                    ${client.ville || "-"}
                </td>

                <td>

                    <button
                        type="button"
                        onclick="modifierClient(${client.id})"
                    >
                        Modifier
                    </button>


                    <button
                        type="button"
                        onclick="supprimerClient(${client.id})"
                    >
                        Supprimer
                    </button>

                </td>

            `;

    clientsList.appendChild(ligne);
  });
}

/* =================================
   AJOUTER / MODIFIER
================================= */

clientForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const donnees = {
    nom_complet: nomComplet.value.trim(),

    telephone: telephone.value.trim(),

    email: email.value.trim(),

    ville: ville.value.trim(),
  };

  if (!donnees.nom_complet || !donnees.telephone) {
    alert("Le nom et le téléphone sont obligatoires.");

    return;
  }

  try {
    let response;

    /* =========================
               MODIFICATION
            ========================== */

    if (clientEnModification) {
      response = await fetch(`${CLIENTS_API}/${clientEnModification}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(donnees),
      });
    } else {
      /* =========================
               AJOUT
            ========================== */
      response = await fetch(CLIENTS_API, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(donnees),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Une erreur est survenue.");
    }

    if (clientEnModification) {
      alert("Client modifié avec succès !");
    } else {
      alert("Client ajouté avec succès !");
    }

    clientForm.reset();

    clientEnModification = null;

    const bouton = clientForm.querySelector("button[type='submit']");

    bouton.textContent = "Enregistrer le client";

    await chargerClients();
  } catch (error) {
    console.error("Erreur :", error);

    alert(error.message);
  }
});

/* =================================
   MODIFIER CLIENT
================================= */

function modifierClient(id) {
  const client = clients.find((item) => item.id === id);

  if (!client) {
    alert("Client introuvable.");

    return;
  }

  nomComplet.value = client.nom_complet;

  telephone.value = client.telephone;

  email.value = client.email || "";

  ville.value = client.ville || "";

  clientEnModification = id;

  const bouton = clientForm.querySelector("button[type='submit']");

  bouton.textContent = "Modifier le client";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =================================
   SUPPRIMER CLIENT
================================= */

async function supprimerClient(id) {
  const client = clients.find((item) => item.id === id);

  if (!client) {
    alert("Client introuvable.");

    return;
  }

  const confirmation = confirm(
    `Voulez-vous vraiment supprimer le client "${client.nom_complet}" ?`,
  );

  if (!confirmation) {
    return;
  }

  try {
    const response = await fetch(`${CLIENTS_API}/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Impossible de supprimer le client.");
    }

    alert("Client supprimé avec succès !");

    await chargerClients();
  } catch (error) {
    console.error("Erreur suppression :", error);

    alert(error.message);
  }
}

/* =================================
   RECHERCHE
================================= */

rechercheClient.addEventListener("input", function () {
  const recherche = rechercheClient.value.toLowerCase().trim();

  const resultats = clients.filter((client) => {
    return (
      client.nom_complet.toLowerCase().includes(recherche) ||
      client.telephone.toLowerCase().includes(recherche) ||
      (client.ville || "").toLowerCase().includes(recherche)
    );
  });

  afficherClients(resultats);
});

/* =================================
   INITIALISATION
================================= */

chargerClients();
