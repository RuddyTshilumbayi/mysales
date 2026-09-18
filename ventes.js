const CLIENTS_API = "/api/clients";
const PRODUITS_API = "/api/produits";
const VENTES_API = "/api/ventes";

let clients = [];
let produits = [];
let ventes = [];
let panier = [];

const clientVente = document.getElementById("clientVente");
const rechercheProduit = document.getElementById("rechercheProduit");
const produitVente = document.getElementById("produitVente");
const quantiteVente = document.getElementById("quantiteVente");
const sousTotalVente = document.getElementById("sousTotalVente");
const prixProduit = document.getElementById("prixProduit");
const stockProduit = document.getElementById("stockProduit");
const informationProduit = document.getElementById("informationProduit");
const panierList = document.getElementById("panierList");
const totalVente = document.getElementById("totalVente");
const venteForm = document.getElementById("venteForm");
const ventesList = document.getElementById("ventesList");
const rechercheVente = document.getElementById("rechercheVente");
const boutonAjouterPanier = document.getElementById("boutonAjouterPanier");
const boutonActualiser = document.getElementById("boutonActualiser");
const nombreVentes = document.getElementById("nombreVentes");
const chiffreAffaires = document.getElementById("chiffreAffaires");

// ======================================================
// CHARGEMENT DES CLIENTS
// ======================================================

async function chargerClients() {
  try {
    const response = await fetch(CLIENTS_API, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les clients.");
    }

    clients = await response.json();

    clientVente.innerHTML = '<option value="">Sélectionnez un client</option>';

    clients.forEach((client) => {
      const option = document.createElement("option");

      option.value = client.id;
      option.textContent = `${client.nom_complet} - ${client.telephone}`;

      clientVente.appendChild(option);
    });
  } catch (error) {
    console.error("Erreur clients :", error);

    clientVente.innerHTML = '<option value="">Erreur de chargement</option>';
  }
}

// ======================================================
// CHARGEMENT DES PRODUITS
// ======================================================

async function chargerProduits() {
  try {
    const response = await fetch(PRODUITS_API, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les produits.");
    }

    produits = await response.json();

    afficherProduitsDansSelect();
  } catch (error) {
    console.error("Erreur produits :", error);

    produitVente.innerHTML = '<option value="">Erreur de chargement</option>';
  }
}

// ======================================================
// AFFICHER LES PRODUITS DANS LE SELECT
// ======================================================

function afficherProduitsDansSelect() {
  const recherche = rechercheProduit.value.trim().toLowerCase();

  produitVente.innerHTML = '<option value="">Sélectionnez un produit</option>';

  produits
    .filter((produit) => {
      return produit.nom.toLowerCase().includes(recherche);
    })
    .forEach((produit) => {
      const option = document.createElement("option");

      option.value = produit.id;

      const quantiteDansPanier = obtenirQuantitePanier(produit.id);

      const stockDisponible = Number(produit.stock) - quantiteDansPanier;

      option.textContent = `${produit.nom} — ${Number(produit.prix).toFixed(2)} $ — Stock : ${stockDisponible}`;

      option.dataset.prix = produit.prix;
      option.dataset.stock = stockDisponible;

      produitVente.appendChild(option);
    });

  afficherInformationProduit();
}

// ======================================================
// QUANTITE DEJA PRESENTE DANS LE PANIER
// ======================================================

function obtenirQuantitePanier(produitId) {
  const ligne = panier.find(
    (item) => Number(item.produit_id) === Number(produitId),
  );

  return ligne ? Number(ligne.quantite) : 0;
}

// ======================================================
// INFORMATIONS DU PRODUIT
// ======================================================

function afficherInformationProduit() {
  const produitId = produitVente.value;

  if (!produitId) {
    informationProduit.style.display = "none";
    prixProduit.textContent = "0.00 $";
    stockProduit.textContent = "0";
    sousTotalVente.value = "0.00 $";
    return;
  }

  const produit = produits.find(
    (item) => Number(item.id) === Number(produitId),
  );

  if (!produit) {
    informationProduit.style.display = "none";
    return;
  }

  const quantiteDansPanier = obtenirQuantitePanier(produit.id);

  const stockDisponible = Number(produit.stock) - quantiteDansPanier;

  informationProduit.style.display = "grid";

  prixProduit.textContent = `${Number(produit.prix).toFixed(2)} $`;

  stockProduit.textContent = stockDisponible;

  calculerSousTotal();
}

// ======================================================
// CALCUL DU SOUS-TOTAL
// ======================================================

function calculerSousTotal() {
  const produitId = produitVente.value;
  const quantite = Number(quantiteVente.value);

  if (!produitId || !Number.isInteger(quantite) || quantite <= 0) {
    sousTotalVente.value = "0.00 $";
    return;
  }

  const produit = produits.find(
    (item) => Number(item.id) === Number(produitId),
  );

  if (!produit) {
    sousTotalVente.value = "0.00 $";
    return;
  }

  const sousTotal = Number(produit.prix) * quantite;

  sousTotalVente.value = `${sousTotal.toFixed(2)} $`;
}

// ======================================================
// AJOUTER AU PANIER
// ======================================================

function ajouterAuPanier() {
  const produitId = Number(produitVente.value);
  const quantite = Number(quantiteVente.value);

  if (!produitId) {
    alert("Veuillez sélectionner un produit.");
    return;
  }

  if (!Number.isInteger(quantite) || quantite <= 0) {
    alert("La quantité doit être un nombre entier supérieur à 0.");
    return;
  }

  const produit = produits.find((item) => Number(item.id) === produitId);

  if (!produit) {
    alert("Produit introuvable.");
    return;
  }

  const quantiteExistante = obtenirQuantitePanier(produitId);

  const nouvelleQuantite = quantiteExistante + quantite;

  if (nouvelleQuantite > Number(produit.stock)) {
    alert(
      `Stock insuffisant pour "${produit.nom}".\n\n` +
        `Stock disponible : ${Number(produit.stock) - quantiteExistante}`,
    );
    return;
  }

  const ligneExistante = panier.find(
    (item) => Number(item.produit_id) === produitId,
  );

  if (ligneExistante) {
    ligneExistante.quantite = nouvelleQuantite;
  } else {
    panier.push({
      produit_id: produitId,
      produit: produit.nom,
      prix_unitaire: Number(produit.prix),
      quantite: quantite,
    });
  }

  afficherPanier();

  produitVente.value = "";
  quantiteVente.value = 1;

  afficherProduitsDansSelect();
}

// ======================================================
// AFFICHER LE PANIER
// ======================================================

function afficherPanier() {
  panierList.innerHTML = "";

  if (panier.length === 0) {
    panierList.innerHTML = `
            <tr>
                <td colspan="5">
                    Aucun produit dans le panier.
                </td>
            </tr>
        `;

    totalVente.textContent = "0.00 $";
    return;
  }

  let total = 0;

  panier.forEach((item, index) => {
    const sousTotal = Number(item.prix_unitaire) * Number(item.quantite);

    total += sousTotal;

    const ligne = document.createElement("tr");

    ligne.innerHTML = `
            <td>${echapperHTML(item.produit)}</td>

            <td>
                ${Number(item.prix_unitaire).toFixed(2)} $
            </td>

            <td>
                <input
                    type="number"
                    min="1"
                    step="1"
                    value="${Number(item.quantite)}"
                    data-index="${index}"
                    class="quantite-panier"
                >
            </td>

            <td>
                <strong>
                    ${sousTotal.toFixed(2)} $
                </strong>
            </td>

            <td>
                <button
                    type="button"
                    class="bouton-supprimer-panier"
                    data-index="${index}"
                >
                    Supprimer
                </button>
            </td>
        `;

    panierList.appendChild(ligne);
  });

  totalVente.textContent = `${total.toFixed(2)} $`;

  connecterActionsPanier();
}

// ======================================================
// ACTIONS DU PANIER
// ======================================================

function connecterActionsPanier() {
  const champsQuantite = document.querySelectorAll(".quantite-panier");

  champsQuantite.forEach((champ) => {
    champ.addEventListener("change", function () {
      const index = Number(this.dataset.index);

      const nouvelleQuantite = Number(this.value);

      if (!Number.isInteger(nouvelleQuantite) || nouvelleQuantite <= 0) {
        alert("La quantité doit être un nombre entier supérieur à 0.");

        afficherPanier();
        return;
      }

      const item = panier[index];

      const produit = produits.find(
        (produit) => Number(produit.id) === Number(item.produit_id),
      );

      if (!produit) {
        alert("Produit introuvable.");
        return;
      }

      if (nouvelleQuantite > Number(produit.stock)) {
        alert(
          `Stock insuffisant pour "${produit.nom}".\n\n` +
            `Stock disponible : ${produit.stock}`,
        );

        afficherPanier();
        return;
      }

      item.quantite = nouvelleQuantite;

      afficherPanier();
    });
  });

  const boutonsSupprimer = document.querySelectorAll(
    ".bouton-supprimer-panier",
  );

  boutonsSupprimer.forEach((bouton) => {
    bouton.addEventListener("click", function () {
      const index = Number(this.dataset.index);

      panier.splice(index, 1);

      afficherPanier();
      afficherProduitsDansSelect();
    });
  });
}

// ======================================================
// ENREGISTRER UNE COMMANDE
// ======================================================

async function enregistrerVente(event) {
  event.preventDefault();

  const clientId = Number(clientVente.value);

  if (!clientId) {
    alert("Veuillez sélectionner un client.");
    return;
  }

  if (panier.length === 0) {
    alert("Veuillez ajouter au moins un produit au panier.");
    return;
  }

  const produitsCommande = panier.map((item) => ({
    produit_id: Number(item.produit_id),
    quantite: Number(item.quantite),
  }));

  try {
    const response = await fetch(VENTES_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        client_id: clientId,
        produits: produitsCommande,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Impossible d'enregistrer la commande.");
    }

    alert(
      `Commande #${data.vente?.id || data.id || ""} enregistrée avec succès.`,
    );

    panier = [];

    venteForm.reset();

    quantiteVente.value = 1;

    afficherPanier();

    await chargerProduits();
    await chargerVentes();
  } catch (error) {
    console.error("Erreur enregistrement vente :", error);

    alert(error.message || "Une erreur est survenue lors de l'enregistrement.");
  }
}

// ======================================================
// CHARGER LES VENTES
// ======================================================

async function chargerVentes() {
  try {
    const response = await fetch(VENTES_API, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les ventes.");
    }

    ventes = await response.json();

    afficherVentes(ventes);
    mettreAJourStatistiques();
  } catch (error) {
    console.error("Erreur récupération ventes :", error);

    ventesList.innerHTML = `
            <tr>
                <td colspan="7">
                    Impossible de charger les ventes.
                </td>
            </tr>
        `;
  }
}

// ======================================================
// AFFICHER L'HISTORIQUE
// ======================================================

function afficherVentes(listeVentes) {
  ventesList.innerHTML = "";

  if (listeVentes.length === 0) {
    ventesList.innerHTML = `
            <tr>
                <td colspan="7">
                    Aucune vente enregistrée.
                </td>
            </tr>
        `;
    return;
  }

  listeVentes.forEach((vente) => {
    const ligne = document.createElement("tr");

    const produitsTexte = Array.isArray(vente.produits)
      ? vente.produits
          .map(
            (produit) =>
              `${echapperHTML(produit.produit)} × ${produit.quantite}`,
          )
          .join("<br>")
      : "Aucun produit";

    const date = vente.date_vente
      ? new Date(vente.date_vente).toLocaleString("fr-FR")
      : "-";

    ligne.innerHTML = `
            <td>
                <strong>#${vente.id}</strong>
            </td>

            <td>
                ${echapperHTML(vente.client || "-")}
            </td>

            <td>
                ${produitsTexte}
            </td>

            <td>
                <strong>
                    ${Number(vente.total || 0).toFixed(2)} $
                </strong>
            </td>

            <td>
                ${echapperHTML(vente.vendeur || "-")}
            </td>

            <td>
                ${date}
            </td>

            <td>
                <button
                    type="button"
                    class="bouton-voir-vente"
                    data-id="${vente.id}"
                >
                    Voir
                </button>
            </td>
        `;

    ventesList.appendChild(ligne);
  });

  document.querySelectorAll(".bouton-voir-vente").forEach((bouton) => {
    bouton.addEventListener("click", function () {
      voirDetailsVente(Number(this.dataset.id));
    });
  });
}

// ======================================================
// DETAIL PROFESSIONNEL D'UNE VENTE
// ======================================================

function voirDetailsVente(venteId) {
  const vente = ventes.find((item) => Number(item.id) === venteId);

  if (!vente) {
    alert("Vente introuvable.");
    return;
  }

  const ancienModal = document.getElementById("modalDetailVente");

  if (ancienModal) {
    ancienModal.remove();
  }

  const produitsCommande = Array.isArray(vente.produits) ? vente.produits : [];

  const lignesProduits =
    produitsCommande.length > 0
      ? produitsCommande
          .map((produit) => {
            const sousTotal =
              Number(produit.sous_total) ||
              Number(produit.quantite) * Number(produit.prix_unitaire);

            return `
                        <tr>
                            <td>
                                ${echapperHTML(produit.produit)}
                            </td>

                            <td>
                                ${Number(produit.prix_unitaire).toFixed(2)} $
                            </td>

                            <td>
                                ${Number(produit.quantite)}
                            </td>

                            <td>
                                <strong>
                                    ${sousTotal.toFixed(2)} $
                                </strong>
                            </td>
                        </tr>
                    `;
          })
          .join("")
      : `
                <tr>
                    <td colspan="4">
                        Aucun produit.
                    </td>
                </tr>
            `;

  const date = vente.date_vente
    ? new Date(vente.date_vente).toLocaleString("fr-FR")
    : "-";

  const modal = document.createElement("div");

  modal.id = "modalDetailVente";
  modal.className = "modal-vente";

  modal.innerHTML = `
        <div class="modal-vente-overlay"></div>

        <div
            class="modal-vente-contenu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titreDetailVente"
        >

            <div class="modal-vente-header">
                <div>
                    <span class="modal-vente-label">
                        COMMANDE
                    </span>

                    <h2 id="titreDetailVente">
                        #${vente.id}
                    </h2>
                </div>

                <button
                    type="button"
                    id="fermerModalVente"
                    class="modal-vente-fermer"
                    aria-label="Fermer"
                >
                    ×
                </button>
            </div>

            <div class="modal-vente-informations">

                <div>
                    <span>Client</span>
                    <strong>
                        ${echapperHTML(vente.client || "-")}
                    </strong>
                </div>

                <div>
                    <span>Vendeur</span>
                    <strong>
                        ${echapperHTML(vente.vendeur || "-")}
                    </strong>
                </div>

                <div>
                    <span>Date</span>
                    <strong>
                        ${date}
                    </strong>
                </div>

            </div>

            <div class="modal-vente-produits">

                <h3>
                    Produits commandés
                </h3>

                <div class="modal-table-container">

                    <table>

                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Prix unitaire</th>
                                <th>Quantité</th>
                                <th>Sous-total</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${lignesProduits}
                        </tbody>

                    </table>

                </div>

            </div>

            <div class="modal-vente-total">

                <span>
                    Total de la commande
                </span>

                <strong>
                    ${Number(vente.total || 0).toFixed(2)} $
                </strong>

            </div>

            <div class="modal-vente-footer">

                <button
                    type="button"
                    id="boutonFermerDetail"
                >
                    Fermer
                </button>

            </div>

        </div>
    `;

  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    modal.classList.add("visible");
  });

  const fermer = () => {
    modal.classList.remove("visible");

    setTimeout(() => {
      modal.remove();
    }, 200);
  };

  document.getElementById("fermerModalVente").addEventListener("click", fermer);

  document
    .getElementById("boutonFermerDetail")
    .addEventListener("click", fermer);

  document
    .querySelector(".modal-vente-overlay")
    .addEventListener("click", fermer);

  document.addEventListener("keydown", function fermerAvecEchap(event) {
    if (event.key === "Escape") {
      fermer();

      document.removeEventListener("keydown", fermerAvecEchap);
    }
  });
}

// ======================================================
// RECHERCHE DES VENTES
// ======================================================

function rechercherVentes() {
  const recherche = rechercheVente.value.trim().toLowerCase();

  if (!recherche) {
    afficherVentes(ventes);
    return;
  }

  const resultat = ventes.filter((vente) => {
    const texteProduits = Array.isArray(vente.produits)
      ? vente.produits.map((produit) => produit.produit).join(" ")
      : "";

    const texte = [
      vente.id,
      vente.client,
      vente.vendeur,
      texteProduits,
      vente.total,
    ]
      .join(" ")
      .toLowerCase();

    return texte.includes(recherche);
  });

  afficherVentes(resultat);
}

// ======================================================
// STATISTIQUES
// ======================================================

function mettreAJourStatistiques() {
  nombreVentes.textContent = ventes.length;

  const chiffreAffairesTotal = ventes.reduce(
    (total, vente) => total + Number(vente.total || 0),
    0,
  );

  chiffreAffaires.textContent = `${chiffreAffairesTotal.toFixed(2)} $`;
}

// ======================================================
// SECURITE AFFICHAGE HTML
// ======================================================

function echapperHTML(texte) {
  const div = document.createElement("div");

  div.textContent = texte === null || texte === undefined ? "" : String(texte);

  return div.innerHTML;
}

// ======================================================
// EVENEMENTS
// ======================================================

if (rechercheProduit) {
  rechercheProduit.addEventListener("input", afficherProduitsDansSelect);
}

if (produitVente) {
  produitVente.addEventListener("change", afficherInformationProduit);
}

if (quantiteVente) {
  quantiteVente.addEventListener("input", calculerSousTotal);
}

if (boutonAjouterPanier) {
  boutonAjouterPanier.addEventListener("click", ajouterAuPanier);
}

if (venteForm) {
  venteForm.addEventListener("submit", enregistrerVente);
}

if (rechercheVente) {
  rechercheVente.addEventListener("input", rechercherVentes);
}

if (boutonActualiser) {
  boutonActualiser.addEventListener("click", async function () {
    await chargerProduits();
    await chargerVentes();
  });
}

// ======================================================
// DEMARRAGE
// ======================================================

async function initialiserPageVentes() {
  await chargerClients();
  await chargerProduits();
  await chargerVentes();

  afficherPanier();
}

initialiserPageVentes();
