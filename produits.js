const PRODUITS_API = "http://localhost:3000/api/produits";

// ======================================================
// ÉLÉMENTS HTML
// ======================================================

const produitForm = document.getElementById("produitForm");

const nomProduit = document.getElementById("nomProduit");

const descriptionProduit = document.getElementById("descriptionProduit");

const prixProduit = document.getElementById("prixProduit");

const stockProduit = document.getElementById("stockProduit");

const produitsList = document.getElementById("produitsList");

const rechercheProduit = document.getElementById("rechercheProduit");

const boutonProduit = document.getElementById("boutonProduit");

const boutonAnnuler = document.getElementById("boutonAnnuler");

const titreFormulaireProduit = document.getElementById(
  "titreFormulaireProduit",
);

// ======================================================
// VARIABLES
// ======================================================

let produits = [];

let produitEnModification = null;

// ======================================================
// CHARGER LES PRODUITS
// ======================================================

async function chargerProduits() {
  try {
    const response = await fetch(PRODUITS_API);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les produits.");
    }

    produits = await response.json();

    afficherProduits(produits);
  } catch (error) {
    console.error("Erreur produits :", error);

    produitsList.innerHTML = `
            <tr>
                <td colspan="6">
                    Impossible de charger les produits.
                </td>
            </tr>
        `;
  }
}

// ======================================================
// AFFICHER LES PRODUITS
// ======================================================

function afficherProduits(listeProduits) {
  produitsList.innerHTML = "";

  if (listeProduits.length === 0) {
    produitsList.innerHTML = `
            <tr>
                <td colspan="6">
                    Aucun produit trouvé.
                </td>
            </tr>
        `;

    return;
  }

  listeProduits.forEach((produit) => {
    const ligne = document.createElement("tr");

    ligne.innerHTML = `

            <td>
                ${produit.id}
            </td>

            <td>
                ${produit.nom}
            </td>

            <td>
                ${produit.description || "-"}
            </td>

            <td>
                ${Number(produit.prix).toFixed(2)} $
            </td>

            <td>
                ${produit.stock}
            </td>

            <td>

                <button
                    type="button"
                    onclick="modifierProduit(${produit.id})"
                >
                    Modifier
                </button>


                <button
                    type="button"
                    onclick="supprimerProduit(${produit.id})"
                >
                    Supprimer
                </button>

            </td>
        `;

    produitsList.appendChild(ligne);
  });
}

// ======================================================
// AJOUTER OU MODIFIER UN PRODUIT
// ======================================================

produitForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const donnees = {
    nom: nomProduit.value.trim(),

    description: descriptionProduit.value.trim(),

    prix: Number(prixProduit.value),

    stock: Number(stockProduit.value),
  };

  // ----------------------------------------------
  // VALIDATION
  // ----------------------------------------------

  if (!donnees.nom) {
    alert("Le nom du produit est obligatoire.");

    return;
  }

  if (!Number.isFinite(donnees.prix) || donnees.prix < 0) {
    alert("Veuillez saisir un prix valide.");

    return;
  }

  if (!Number.isInteger(donnees.stock) || donnees.stock < 0) {
    alert("Veuillez saisir un stock valide.");

    return;
  }

  try {
    let response;

    // ==========================================
    // MODIFICATION
    // ==========================================

    if (produitEnModification) {
      response = await fetch(`${PRODUITS_API}/${produitEnModification}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(donnees),
      });
    }

    // ==========================================
    // AJOUT
    // ==========================================
    else {
      response = await fetch(PRODUITS_API, {
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

    // ==========================================
    // MESSAGE
    // ==========================================

    if (produitEnModification) {
      alert("Produit modifié avec succès !");
    } else {
      alert("Produit ajouté avec succès !");
    }

    // ==========================================
    // RÉINITIALISATION
    // ==========================================

    annulerModification();

    await chargerProduits();
  } catch (error) {
    console.error("Erreur :", error);

    alert(error.message);
  }
});

// ======================================================
// MODIFIER UN PRODUIT
// ======================================================

function modifierProduit(id) {
  const produit = produits.find((item) => item.id === id);

  if (!produit) {
    alert("Produit introuvable.");

    return;
  }

  nomProduit.value = produit.nom;

  descriptionProduit.value = produit.description || "";

  prixProduit.value = produit.prix;

  stockProduit.value = produit.stock;

  produitEnModification = id;

  titreFormulaireProduit.textContent = "Modifier un produit";

  boutonProduit.textContent = "Modifier le produit";

  boutonAnnuler.style.display = "inline-block";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ======================================================
// ANNULER LA MODIFICATION
// ======================================================

function annulerModification() {
  produitForm.reset();

  produitEnModification = null;

  titreFormulaireProduit.textContent = "Ajouter un produit";

  boutonProduit.textContent = "Enregistrer le produit";

  boutonAnnuler.style.display = "none";
}

// ======================================================
// BOUTON ANNULER
// ======================================================

boutonAnnuler.addEventListener("click", function () {
  annulerModification();
});

// ======================================================
// SUPPRIMER UN PRODUIT
// ======================================================

async function supprimerProduit(id) {
  const produit = produits.find((item) => item.id === id);

  if (!produit) {
    alert("Produit introuvable.");

    return;
  }

  const confirmation = confirm(
    `Voulez-vous vraiment supprimer le produit "${produit.nom}" ?`,
  );

  if (!confirmation) {
    return;
  }

  try {
    const response = await fetch(`${PRODUITS_API}/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Impossible de supprimer le produit.");
    }

    alert("Produit supprimé avec succès !");

    await chargerProduits();
  } catch (error) {
    console.error("Erreur suppression :", error);

    alert(error.message);
  }
}

// ======================================================
// RECHERCHE
// ======================================================

rechercheProduit.addEventListener("input", function () {
  const recherche = rechercheProduit.value.toLowerCase().trim();

  const resultats = produits.filter((produit) => {
    return (
      produit.nom.toLowerCase().includes(recherche) ||
      (produit.description || "").toLowerCase().includes(recherche)
    );
  });

  afficherProduits(resultats);
});

// ======================================================
// INITIALISATION
// ======================================================

chargerProduits();
