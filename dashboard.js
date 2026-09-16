const CLIENTS_API = "http://localhost:3000/api/clients";
const PRODUITS_API = "http://localhost:3000/api/produits";
const VENTES_API = "http://localhost:3000/api/ventes";

const chiffreAffaires = document.getElementById("chiffreAffaires");
const nombreVentes = document.getElementById("nombreVentes");
const produitsVendus = document.getElementById("produitsVendus");
const nombreClients = document.getElementById("nombreClients");

const dashboardVentes = document.getElementById("dashboardVentes");
const dashboardStocks = document.getElementById("dashboardStocks");

let ventes = [];
let produits = [];
let clients = [];

let caChart = null;
let produitsChart = null;
let clientsChart = null;

// ======================================================
// CLIENTS
// ======================================================

async function chargerClients() {
  try {
    const response = await fetch(CLIENTS_API);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les clients.");
    }

    clients = await response.json();

    nombreClients.textContent = clients.length;
  } catch (error) {
    console.error("Erreur clients :", error);

    nombreClients.textContent = "Erreur";
  }
}

// ======================================================
// PRODUITS
// ======================================================

async function chargerProduits() {
  try {
    const response = await fetch(PRODUITS_API);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les produits.");
    }

    produits = await response.json();

    afficherStocks();
  } catch (error) {
    console.error("Erreur produits :", error);

    dashboardStocks.innerHTML = `
            <tr>
                <td colspan="3">
                    Impossible de charger les stocks.
                </td>
            </tr>
        `;
  }
}

// ======================================================
// AFFICHER LES STOCKS
// ======================================================

function afficherStocks() {
  dashboardStocks.innerHTML = "";

  if (produits.length === 0) {
    dashboardStocks.innerHTML = `
            <tr>
                <td colspan="3">
                    Aucun produit enregistré.
                </td>
            </tr>
        `;

    return;
  }

  produits.forEach((produit) => {
    const ligne = document.createElement("tr");

    ligne.innerHTML = `
            <td>${produit.nom}</td>

            <td>
                ${Number(produit.prix).toFixed(2)} $
            </td>

            <td>
                ${produit.stock}
            </td>
        `;

    dashboardStocks.appendChild(ligne);
  });
}

// ======================================================
// VENTES
// ======================================================

async function chargerVentes() {
  try {
    const response = await fetch(VENTES_API);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les ventes.");
    }

    ventes = await response.json();

    calculerKPI();

    afficherVentes();

    // IMPORTANT :
    // Les graphiques sont créés APRÈS le chargement des ventes.

    creerGraphiqueCA();

    creerGraphiqueProduits();

    creerGraphiqueClients();
  } catch (error) {
    console.error("Erreur ventes :", error);

    chiffreAffaires.textContent = "Erreur";
    nombreVentes.textContent = "Erreur";
    produitsVendus.textContent = "Erreur";

    dashboardVentes.innerHTML = `
            <tr>
                <td colspan="6">
                    Impossible de charger les ventes.
                </td>
            </tr>
        `;
  }
}

// ======================================================
// CALCUL DES KPI
// ======================================================

function calculerKPI() {
  let chiffreTotal = 0;
  let quantiteTotale = 0;

  ventes.forEach((vente) => {
    chiffreTotal += Number(vente.total);

    quantiteTotale += Number(vente.quantite);
  });

  chiffreAffaires.textContent = `${chiffreTotal.toFixed(2)} $`;

  nombreVentes.textContent = ventes.length;

  produitsVendus.textContent = quantiteTotale;
}

// ======================================================
// TABLEAU DES VENTES
// ======================================================

function afficherVentes() {
  dashboardVentes.innerHTML = "";

  if (ventes.length === 0) {
    dashboardVentes.innerHTML = `
            <tr>
                <td colspan="6">
                    Aucune vente enregistrée.
                </td>
            </tr>
        `;

    return;
  }

  ventes.forEach((vente) => {
    const ligne = document.createElement("tr");

    ligne.innerHTML = `
            <td>${vente.id}</td>

            <td>${vente.client}</td>

            <td>${vente.produit}</td>

            <td>${vente.quantite}</td>

            <td>
                ${Number(vente.total).toFixed(2)} $
            </td>

            <td>
                ${new Date(vente.date_vente).toLocaleString("fr-FR")}
            </td>
        `;

    dashboardVentes.appendChild(ligne);
  });
}

// ======================================================
// GRAPHIQUE CHIFFRE D'AFFAIRES
// ======================================================

function creerGraphiqueCA() {
  const ventesParDate = {};

  ventes.forEach((vente) => {
    const date = new Date(vente.date_vente).toLocaleDateString("fr-FR");

    if (!ventesParDate[date]) {
      ventesParDate[date] = 0;
    }

    ventesParDate[date] += Number(vente.total);
  });

  const labels = Object.keys(ventesParDate);

  const valeurs = Object.values(ventesParDate);

  const canvas = document.getElementById("caChart");

  if (!canvas) return;

  const contexte = canvas.getContext("2d");

  if (caChart) {
    caChart.destroy();
  }

  caChart = new Chart(contexte, {
    type: "line",

    data: {
      labels: labels,

      datasets: [
        {
          label: "Chiffre d'affaires ($)",

          data: valeurs,

          tension: 0.3,
        },
      ],
    },

    options: {
      responsive: true,
    },
  });
}

// ======================================================
// GRAPHIQUE PRODUITS LES PLUS VENDUS
// ======================================================

function creerGraphiqueProduits() {
  const quantites = {};

  ventes.forEach((vente) => {
    if (!quantites[vente.produit]) {
      quantites[vente.produit] = 0;
    }

    quantites[vente.produit] += Number(vente.quantite);
  });

  const labels = Object.keys(quantites);

  const valeurs = Object.values(quantites);

  const canvas = document.getElementById("produitsChart");

  if (!canvas) return;

  const contexte = canvas.getContext("2d");

  if (produitsChart) {
    produitsChart.destroy();
  }

  produitsChart = new Chart(contexte, {
    type: "bar",

    data: {
      labels: labels,

      datasets: [
        {
          label: "Quantité vendue",

          data: valeurs,
        },
      ],
    },

    options: {
      responsive: true,

      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// ======================================================
// GRAPHIQUE VENTES PAR CLIENT
// ======================================================

function creerGraphiqueClients() {
  const ventesParClient = {};

  ventes.forEach((vente) => {
    if (!ventesParClient[vente.client]) {
      ventesParClient[vente.client] = 0;
    }

    ventesParClient[vente.client] += Number(vente.total);
  });

  const labels = Object.keys(ventesParClient);

  const valeurs = Object.values(ventesParClient);

  const canvas = document.getElementById("clientsChart");

  if (!canvas) return;

  const contexte = canvas.getContext("2d");

  if (clientsChart) {
    clientsChart.destroy();
  }

  clientsChart = new Chart(contexte, {
    type: "doughnut",

    data: {
      labels: labels,

      datasets: [
        {
          label: "Ventes par client",

          data: valeurs,
        },
      ],
    },

    options: {
      responsive: true,
    },
  });
}

// ======================================================
// INITIALISATION
// ======================================================

async function initialiserDashboard() {
  await chargerClients();

  await chargerProduits();

  await chargerVentes();
}

initialiserDashboard();
