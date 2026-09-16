const CLIENTS_API = "http://localhost:3000/api/clients";
const PRODUITS_API = "http://localhost:3000/api/produits";
const VENTES_API = "http://localhost:3000/api/ventes";

const venteForm = document.getElementById("venteForm");
const clientVente = document.getElementById("clientVente");
const produitVente = document.getElementById("produitVente");
const quantiteVente = document.getElementById("quantiteVente");
const totalVente = document.getElementById("totalVente");
const ventesList = document.getElementById("ventesList");

let produits = [];


/* =========================
   CHARGER LES CLIENTS
========================= */

async function chargerClients() {
    try {
        const response = await fetch(CLIENTS_API);

        if (!response.ok) {
            throw new Error("Impossible de récupérer les clients.");
        }

        const clients = await response.json();

        clientVente.innerHTML = `
            <option value="">Sélectionnez un client</option>
        `;

        clients.forEach((client) => {
            const option = document.createElement("option");

            option.value = client.id;
            option.textContent =
                `${client.nom_complet} - ${client.telephone}`;

            clientVente.appendChild(option);
        });

    } catch (error) {
        console.error("Erreur clients :", error);

        clientVente.innerHTML = `
            <option value="">
                Impossible de charger les clients
            </option>
        `;
    }
}


/* =========================
   CHARGER LES PRODUITS
========================= */

async function chargerProduits() {
    try {
        const response = await fetch(PRODUITS_API);

        if (!response.ok) {
            throw new Error("Impossible de récupérer les produits.");
        }

        produits = await response.json();

        produitVente.innerHTML = `
            <option value="">Sélectionnez un produit</option>
        `;

        produits.forEach((produit) => {
            const option = document.createElement("option");

            option.value = produit.id;

            option.textContent =
                `${produit.nom} - ${produit.prix} $ - Stock : ${produit.stock}`;

            produitVente.appendChild(option);
        });

    } catch (error) {
        console.error("Erreur produits :", error);

        produitVente.innerHTML = `
            <option value="">
                Impossible de charger les produits
            </option>
        `;
    }
}


/* =========================
   CALCULER LE TOTAL
========================= */

function calculerTotal() {

    const produitId = Number(produitVente.value);
    const quantite = Number(quantiteVente.value);

    const produit = produits.find(
        (item) => item.id === produitId
    );

    if (!produit || !quantite || quantite < 1) {
        totalVente.value = "0.00 $";
        return;
    }

    const total =
        Number(produit.prix) * quantite;

    totalVente.value =
        `${total.toFixed(2)} $`;
}


/* =========================
   CHANGEMENT PRODUIT
========================= */

produitVente.addEventListener(
    "change",
    calculerTotal
);


/* =========================
   CHANGEMENT QUANTITÉ
========================= */

quantiteVente.addEventListener(
    "input",
    calculerTotal
);


/* =========================
   CHARGER LES VENTES
========================= */

async function chargerVentes() {

    try {

        const response = await fetch(VENTES_API);

        if (!response.ok) {
            throw new Error(
                "Impossible de récupérer les ventes."
            );
        }

        const ventes = await response.json();

        ventesList.innerHTML = "";

        if (ventes.length === 0) {

            ventesList.innerHTML = `
                <tr>
                    <td colspan="7">
                        Aucune vente enregistrée.
                    </td>
                </tr>
            `;

            return;
        }

        ventes.forEach((vente) => {

            const ligne =
                document.createElement("tr");

            ligne.innerHTML = `
                <td>${vente.id}</td>
                <td>${vente.client}</td>
                <td>${vente.produit}</td>
                <td>${vente.quantite}</td>
                <td>${Number(vente.prix_unitaire).toFixed(2)} $</td>
                <td>${Number(vente.total).toFixed(2)} $</td>
                <td>${new Date(vente.date_vente).toLocaleString("fr-FR")}</td>
            `;

            ventesList.appendChild(ligne);
        });

    } catch (error) {

        console.error("Erreur ventes :", error);

        ventesList.innerHTML = `
            <tr>
                <td colspan="7">
                    Impossible de charger les ventes.
                </td>
            </tr>
        `;
    }
}


/* =========================
   ENREGISTRER UNE VENTE
========================= */

venteForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const client_id =
            Number(clientVente.value);

        const produit_id =
            Number(produitVente.value);

        const quantite =
            Number(quantiteVente.value);

        if (!client_id || !produit_id || !quantite) {

            alert(
                "Veuillez remplir tous les champs."
            );

            return;
        }

        try {

            const response = await fetch(
                VENTES_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        client_id,
                        produit_id,
                        quantite
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Impossible d'enregistrer la vente."
                );
            }

            alert(
                "Vente enregistrée avec succès !"
            );

            venteForm.reset();

            totalVente.value =
                "0.00 $";

            await chargerProduits();
            await chargerVentes();

        } catch (error) {

            console.error("Erreur :", error);

            alert(error.message);
        }
    }
);


/* =========================
   INITIALISATION
========================= */

chargerClients();
chargerProduits();
chargerVentes();