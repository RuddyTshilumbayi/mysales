const CLIENTS_API = "/api/clients";
const PRODUITS_API = "/api/produits";
const VENTES_API = "/api/ventes";

// ======================================================
// ÉLÉMENTS HTML
// ======================================================

const chiffreAffaires = document.getElementById("chiffreAffaires");
const nombreVentes = document.getElementById("nombreVentes");
const produitsVendus = document.getElementById("produitsVendus");
const nombreClients = document.getElementById("nombreClients");

const dashboardVentes = document.getElementById("dashboardVentes");
const dashboardStocks = document.getElementById("dashboardStocks");

const stockTotal = document.getElementById("stockTotal");
const stockFaible = document.getElementById("stockFaible");

const boutonActualiserDashboard = document.getElementById(
  "boutonActualiserDashboard",
);

// ======================================================
// VARIABLES
// ======================================================

let ventes = [];
let produits = [];
let clients = [];

let caChart = null;
let produitsChart = null;
let clientsChart = null;
let vendeursChart = null;

// ======================================================
// OUTIL DE SÉCURITÉ
// ======================================================

function echapperHTML(valeur) {
  return String(valeur ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================================================
// OBTENIR LES PRODUITS D'UNE VENTE
// ======================================================

function obtenirProduitsVente(vente) {
  if (Array.isArray(vente.produits)) {
    return vente.produits;
  }

  return [];
}

// ======================================================
// CHARGER TOUTES LES DONNÉES
// ======================================================

async function chargerDonneesDashboard() {
  try {
    const [clientsResponse, produitsResponse, ventesResponse] =
      await Promise.all([
        fetch(CLIENTS_API, {
          credentials: "include",
        }),

        fetch(PRODUITS_API, {
          credentials: "include",
        }),

        fetch(VENTES_API, {
          credentials: "include",
        }),
      ]);

    if (!clientsResponse.ok || !produitsResponse.ok || !ventesResponse.ok) {
      throw new Error("Impossible de récupérer les données du dashboard.");
    }

    clients = await clientsResponse.json();
    produits = await produitsResponse.json();
    ventes = await ventesResponse.json();

    calculerKPI();

    afficherStocks();

    afficherVentes();

    creerGraphiqueCA();

    creerGraphiqueProduits();

    creerGraphiqueClients();

    creerGraphiqueVendeurs();
  } catch (error) {
    console.error("Erreur chargement dashboard :", error);

    afficherErreurDashboard();
  }
}

// ======================================================
// KPI
// ======================================================

function calculerKPI() {
  let chiffreTotal = 0;
  let quantiteTotale = 0;

  ventes.forEach((vente) => {
    chiffreTotal += Number(vente.total || 0);

    const produitsCommande = obtenirProduitsVente(vente);

    produitsCommande.forEach((produit) => {
      quantiteTotale += Number(produit.quantite || 0);
    });
  });

  chiffreAffaires.textContent = `${chiffreTotal.toFixed(2)} $`;

  nombreVentes.textContent = ventes.length;

  produitsVendus.textContent = quantiteTotale;

  nombreClients.textContent = clients.length;
}

// ======================================================
// AFFICHER LES STOCKS
// ======================================================

function afficherStocks() {
  dashboardStocks.innerHTML = "";

  if (produits.length === 0) {
    dashboardStocks.innerHTML = `
      <tr>
        <td colspan="4">
          Aucun produit enregistré.
        </td>
      </tr>
    `;

    stockTotal.textContent = "0";
    stockFaible.textContent = "0";

    return;
  }

  let totalStock = 0;
  let nombreStockFaible = 0;

  const produitsTries = [...produits].sort(
    (a, b) => Number(a.stock) - Number(b.stock),
  );

  produitsTries.forEach((produit) => {
    const stock = Number(produit.stock || 0);

    totalStock += stock;

    if (stock <= 5) {
      nombreStockFaible++;
    }

    let classeEtat = "stock-normal";
    let texteEtat = "Stock normal";

    if (stock === 0) {
      classeEtat = "stock-rupture";
      texteEtat = "Rupture";
    } else if (stock <= 5) {
      classeEtat = "stock-faible";
      texteEtat = "Stock faible";
    }

    const ligne = document.createElement("tr");

    ligne.innerHTML = `
      <td>
        <strong>
          ${echapperHTML(produit.nom)}
        </strong>
      </td>

      <td>
        ${Number(produit.prix || 0).toFixed(2)} $
      </td>

      <td>
        <strong>${stock}</strong>
      </td>

      <td>
        <span class="stock-badge ${classeEtat}">
          ${texteEtat}
        </span>
      </td>
    `;

    dashboardStocks.appendChild(ligne);
  });

  stockTotal.textContent = totalStock;
  stockFaible.textContent = nombreStockFaible;
}

// ======================================================
// DERNIÈRES VENTES
// ======================================================

function afficherVentes() {
  dashboardVentes.innerHTML = "";

  if (ventes.length === 0) {
    dashboardVentes.innerHTML = `
      <tr>
        <td colspan="7">
          Aucune vente enregistrée.
        </td>
      </tr>
    `;

    return;
  }

  const ventesRecentes = [...ventes]
    .sort((a, b) => new Date(b.date_vente) - new Date(a.date_vente))
    .slice(0, 10);

  ventesRecentes.forEach((vente) => {
    const ligne = document.createElement("tr");

    const produitsCommande = obtenirProduitsVente(vente);

    const nomsProduits = produitsCommande
      .map(
        (produit) =>
          `${echapperHTML(produit.produit)} x${Number(produit.quantite || 0)}`,
      )
      .join(", ");

    const quantiteTotale = produitsCommande.reduce(
      (total, produit) => total + Number(produit.quantite || 0),
      0,
    );

    const date = new Date(vente.date_vente).toLocaleString("fr-FR");

    ligne.innerHTML = `
      <td>
        <strong>#${echapperHTML(vente.id)}</strong>
      </td>

      <td>
        ${echapperHTML(vente.client || "Client inconnu")}
      </td>

      <td>
        ${nomsProduits || "Aucun produit"}
      </td>

      <td>
        ${quantiteTotale}
      </td>

      <td>
        <strong>
          ${Number(vente.total || 0).toFixed(2)} $
        </strong>
      </td>

      <td>
        ${echapperHTML(vente.vendeur || "Inconnu")}
      </td>

      <td>
        ${echapperHTML(date)}
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
    const dateObjet = new Date(vente.date_vente);

    const annee = dateObjet.getFullYear();

    const mois = String(dateObjet.getMonth() + 1).padStart(2, "0");

    const jour = String(dateObjet.getDate()).padStart(2, "0");

    const cle = `${annee}-${mois}-${jour}`;

    if (!ventesParDate[cle]) {
      ventesParDate[cle] = 0;
    }

    ventesParDate[cle] += Number(vente.total || 0);
  });

  const datesTriees = Object.keys(ventesParDate).sort();

  const labels = datesTriees.map((date) => {
    const morceaux = date.split("-");

    return `${morceaux[2]}/${morceaux[1]}`;
  });

  const valeurs = datesTriees.map((date) => ventesParDate[date]);

  const canvas = document.getElementById("caChart");

  if (!canvas) {
    return;
  }

  const contexte = canvas.getContext("2d");

  if (caChart) {
    caChart.destroy();
  }

  caChart = new Chart(contexte, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Chiffre d'affaires ($)",

          data: valeurs,

          tension: 0.35,

          fill: true,

          borderWidth: 3,

          pointRadius: 4,

          pointHoverRadius: 6,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      interaction: {
        intersect: false,

        mode: "index",
      },

      plugins: {
        legend: {
          display: true,
        },
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            callback: function (value) {
              return `${value} $`;
            },
          },
        },
      },
    },
  });
}

// ======================================================
// GRAPHIQUE PRODUITS
// ======================================================

function creerGraphiqueProduits() {
  const quantites = {};

  ventes.forEach((vente) => {
    const produitsCommande = obtenirProduitsVente(vente);

    produitsCommande.forEach((produit) => {
      const nomProduit = produit.produit;

      if (!nomProduit) {
        return;
      }

      if (!quantites[nomProduit]) {
        quantites[nomProduit] = 0;
      }

      quantites[nomProduit] += Number(produit.quantite || 0);
    });
  });

  const produitsTries = Object.entries(quantites)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = produitsTries.map((item) => item[0]);

  const valeurs = produitsTries.map((item) => item[1]);

  const canvas = document.getElementById("produitsChart");

  if (!canvas) {
    return;
  }

  const contexte = canvas.getContext("2d");

  if (produitsChart) {
    produitsChart.destroy();
  }

  produitsChart = new Chart(contexte, {
    type: "bar",

    data: {
      labels,

      datasets: [
        {
          label: "Quantité vendue",

          data: valeurs,

          borderRadius: 6,

          borderWidth: 1,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

// ======================================================
// GRAPHIQUE CLIENTS
// ======================================================

function creerGraphiqueClients() {
  const ventesParClient = {};

  ventes.forEach((vente) => {
    const client = vente.client || "Client inconnu";

    if (!ventesParClient[client]) {
      ventesParClient[client] = 0;
    }

    ventesParClient[client] += Number(vente.total || 0);
  });

  const clientsTries = Object.entries(ventesParClient).sort(
    (a, b) => b[1] - a[1],
  );

  const topClients = clientsTries.slice(0, 7);

  const autres = clientsTries
    .slice(7)
    .reduce((total, item) => total + Number(item[1] || 0), 0);

  if (autres > 0) {
    topClients.push(["Autres", autres]);
  }

  const labels = topClients.map((item) => item[0]);

  const valeurs = topClients.map((item) => item[1]);

  const canvas = document.getElementById("clientsChart");

  if (!canvas) {
    return;
  }

  const contexte = canvas.getContext("2d");

  if (clientsChart) {
    clientsChart.destroy();
  }

  clientsChart = new Chart(contexte, {
    type: "doughnut",

    data: {
      labels,

      datasets: [
        {
          label: "Chiffre d'affaires",

          data: valeurs,

          borderWidth: 2,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "right",
        },
      },
    },
  });
}

// ======================================================
// GRAPHIQUE VENDEURS
// ======================================================

function creerGraphiqueVendeurs() {
  const ventesParVendeur = {};

  ventes.forEach((vente) => {
    const vendeur = vente.vendeur || "Vendeur inconnu";

    if (!ventesParVendeur[vendeur]) {
      ventesParVendeur[vendeur] = 0;
    }

    ventesParVendeur[vendeur] += Number(vente.total || 0);
  });

  const vendeursTries = Object.entries(ventesParVendeur).sort(
    (a, b) => b[1] - a[1],
  );

  const labels = vendeursTries.map((item) => item[0]);

  const valeurs = vendeursTries.map((item) => item[1]);

  const canvas = document.getElementById("vendeursChart");

  if (!canvas) {
    return;
  }

  const contexte = canvas.getContext("2d");

  if (vendeursChart) {
    vendeursChart.destroy();
  }

  vendeursChart = new Chart(contexte, {
    type: "bar",

    data: {
      labels,

      datasets: [
        {
          label: "Chiffre d'affaires ($)",

          data: valeurs,

          borderRadius: 6,

          borderWidth: 1,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            callback: function (value) {
              return `${value} $`;
            },
          },
        },
      },
    },
  });
}

// ======================================================
// ERREUR DASHBOARD
// ======================================================

function afficherErreurDashboard() {
  chiffreAffaires.textContent = "Erreur";

  nombreVentes.textContent = "Erreur";

  produitsVendus.textContent = "Erreur";

  nombreClients.textContent = "Erreur";

  dashboardVentes.innerHTML = `
    <tr>
      <td colspan="7">
        Impossible de charger les ventes.
      </td>
    </tr>
  `;

  dashboardStocks.innerHTML = `
    <tr>
      <td colspan="4">
        Impossible de charger les stocks.
      </td>
    </tr>
  `;

  stockTotal.textContent = "Erreur";

  stockFaible.textContent = "Erreur";
}

// ======================================================
// BOUTON ACTUALISER
// ======================================================

if (boutonActualiserDashboard) {
  boutonActualiserDashboard.addEventListener("click", async function () {
    boutonActualiserDashboard.disabled = true;

    boutonActualiserDashboard.textContent = "↻ Actualisation...";

    await chargerDonneesDashboard();

    boutonActualiserDashboard.disabled = false;

    boutonActualiserDashboard.textContent = "↻ Actualiser";
  });
}

// ======================================================
// INITIALISATION
// ======================================================

chargerDonneesDashboard();
