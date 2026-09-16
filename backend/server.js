const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = 3000;

// ======================================================
// MIDDLEWARES
// ======================================================

app.use(cors());
app.use(express.json());

// Servir les fichiers HTML, CSS et JavaScript
// du dossier principal MYSALES
app.use(express.static(path.join(__dirname, "..")));

// ======================================================
// PAGE PRINCIPALE
// ======================================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ======================================================
// TEST DE CONNEXION À POSTGRESQL
// ======================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS heure");

    res.json({
      message: "Connexion PostgreSQL réussie",
      heure: result.rows[0].heure,
    });
  } catch (error) {
    console.error("Erreur connexion PostgreSQL :", error);

    res.status(500).json({
      message: "Erreur de connexion à PostgreSQL",
      erreur: error.message,
    });
  }
});

// ======================================================
// CLIENTS
// ======================================================

// GET - récupérer tous les clients
app.get("/api/clients", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nom_complet,
        telephone,
        email,
        ville,
        date_creation
      FROM clients
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération clients :", error);

    res.status(500).json({
      message: "Impossible de récupérer les clients",
      erreur: error.message,
    });
  }
});

// POST - ajouter un client
app.post("/api/clients", async (req, res) => {
  try {
    const { nom_complet, telephone, email, ville } = req.body;

    if (!nom_complet || !telephone) {
      return res.status(400).json({
        message: "Le nom complet et le téléphone sont obligatoires",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO clients (
        nom_complet,
        telephone,
        email,
        ville
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        nom_complet,
        telephone,
        email,
        ville,
        date_creation
      `,
      [
        nom_complet.trim(),
        telephone.trim(),
        email ? email.trim() : null,
        ville ? ville.trim() : null,
      ],
    );

    res.status(201).json({
      message: "Client ajouté avec succès",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur ajout client :", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ce numéro de téléphone existe déjà.",
      });
    }

    res.status(500).json({
      message: "Impossible d'ajouter le client",
      erreur: error.message,
    });
  }
});

// PUT - modifier un client
app.put("/api/clients/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { nom_complet, telephone, email, ville } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID client invalide",
      });
    }

    if (!nom_complet || !telephone) {
      return res.status(400).json({
        message: "Le nom complet et le téléphone sont obligatoires",
      });
    }

    const result = await pool.query(
      `
      UPDATE clients
      SET
        nom_complet = $1,
        telephone = $2,
        email = $3,
        ville = $4
      WHERE id = $5
      RETURNING
        id,
        nom_complet,
        telephone,
        email,
        ville,
        date_creation
      `,
      [
        nom_complet.trim(),
        telephone.trim(),
        email ? email.trim() : null,
        ville ? ville.trim() : null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    res.json({
      message: "Client modifié avec succès",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur modification client :", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ce numéro de téléphone existe déjà.",
      });
    }

    res.status(500).json({
      message: "Impossible de modifier le client",
      erreur: error.message,
    });
  }
});

// DELETE - supprimer un client
app.delete("/api/clients/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID client invalide",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM clients
      WHERE id = $1
      RETURNING id, nom_complet
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    res.json({
      message: "Client supprimé avec succès",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur suppression client :", error);

    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Impossible de supprimer ce client car il possède déjà une vente.",
      });
    }

    res.status(500).json({
      message: "Impossible de supprimer le client",
      erreur: error.message,
    });
  }
});

// ======================================================
// PRODUITS
// ======================================================

// GET - récupérer tous les produits
app.get("/api/produits", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nom,
        description,
        prix,
        stock,
        date_creation
      FROM produits
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération produits :", error);

    res.status(500).json({
      message: "Impossible de récupérer les produits",
      erreur: error.message,
    });
  }
});

// POST - ajouter un produit
app.post("/api/produits", async (req, res) => {
  try {
    const { nom, description, prix, stock } = req.body;

    if (!nom || prix === undefined || stock === undefined) {
      return res.status(400).json({
        message: "Le nom, le prix et le stock sont obligatoires",
      });
    }

    const prixNumerique = Number(prix);
    const stockNumerique = Number(stock);

    if (!Number.isFinite(prixNumerique) || prixNumerique < 0) {
      return res.status(400).json({
        message: "Le prix doit être un nombre positif ou égal à 0",
      });
    }

    if (!Number.isInteger(stockNumerique) || stockNumerique < 0) {
      return res.status(400).json({
        message: "Le stock doit être un nombre entier positif ou égal à 0",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO produits (
        nom,
        description,
        prix,
        stock
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        nom,
        description,
        prix,
        stock,
        date_creation
      `,
      [
        nom.trim(),
        description ? description.trim() : null,
        prixNumerique,
        stockNumerique,
      ],
    );

    res.status(201).json({
      message: "Produit ajouté avec succès",
      produit: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur ajout produit :", error);

    res.status(500).json({
      message: "Impossible d'ajouter le produit",
      erreur: error.message,
    });
  }
});

// PUT - modifier un produit
app.put("/api/produits/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { nom, description, prix, stock } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID produit invalide",
      });
    }

    if (!nom || prix === undefined || stock === undefined) {
      return res.status(400).json({
        message: "Le nom, le prix et le stock sont obligatoires",
      });
    }

    const prixNumerique = Number(prix);
    const stockNumerique = Number(stock);

    if (!Number.isFinite(prixNumerique) || prixNumerique < 0) {
      return res.status(400).json({
        message: "Le prix doit être un nombre positif ou égal à 0",
      });
    }

    if (!Number.isInteger(stockNumerique) || stockNumerique < 0) {
      return res.status(400).json({
        message: "Le stock doit être un nombre entier positif ou égal à 0",
      });
    }

    const result = await pool.query(
      `
      UPDATE produits
      SET
        nom = $1,
        description = $2,
        prix = $3,
        stock = $4
      WHERE id = $5
      RETURNING
        id,
        nom,
        description,
        prix,
        stock,
        date_creation
      `,
      [
        nom.trim(),
        description ? description.trim() : null,
        prixNumerique,
        stockNumerique,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    res.json({
      message: "Produit modifié avec succès",
      produit: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur modification produit :", error);

    res.status(500).json({
      message: "Impossible de modifier le produit",
      erreur: error.message,
    });
  }
});

// DELETE - supprimer un produit
app.delete("/api/produits/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID produit invalide",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM produits
      WHERE id = $1
      RETURNING id, nom
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    res.json({
      message: "Produit supprimé avec succès",
      produit: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur suppression produit :", error);

    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Impossible de supprimer ce produit car il est déjà utilisé dans une vente.",
      });
    }

    res.status(500).json({
      message: "Impossible de supprimer le produit",
      erreur: error.message,
    });
  }
});

// ======================================================
// VENTES
// ======================================================

// GET - récupérer toutes les ventes
app.get("/api/ventes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id,
        v.date_vente,
        v.total,
        c.nom_complet AS client,
        p.nom AS produit,
        dv.quantite,
        dv.prix_unitaire
      FROM ventes v
      INNER JOIN clients c
        ON c.id = v.client_id
      INNER JOIN details_vente dv
        ON dv.vente_id = v.id
      INNER JOIN produits p
        ON p.id = dv.produit_id
      ORDER BY v.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération ventes :", error);

    res.status(500).json({
      message: "Impossible de récupérer les ventes",
      erreur: error.message,
    });
  }
});

// POST - enregistrer une vente
app.post("/api/ventes", async (req, res) => {
  const client = await pool.connect();

  try {
    const { client_id, produit_id, quantite } = req.body;

    const clientId = Number(client_id);
    const produitId = Number(produit_id);
    const quantiteNumerique = Number(quantite);

    if (
      !Number.isInteger(clientId) ||
      !Number.isInteger(produitId) ||
      !Number.isInteger(quantiteNumerique) ||
      quantiteNumerique <= 0
    ) {
      return res.status(400).json({
        message: "Client, produit et quantité doivent être valides.",
      });
    }

    await client.query("BEGIN");

    // Vérifier le client
    const clientResult = await client.query(
      `
      SELECT id, nom_complet
      FROM clients
      WHERE id = $1
      `,
      [clientId],
    );

    if (clientResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    // Récupérer le produit et verrouiller sa ligne
    const produitResult = await client.query(
      `
      SELECT
        id,
        nom,
        prix,
        stock
      FROM produits
      WHERE id = $1
      FOR UPDATE
      `,
      [produitId],
    );

    if (produitResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    const produit = produitResult.rows[0];

    // Vérifier le stock
    if (produit.stock < quantiteNumerique) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: `Stock insuffisant. Stock disponible : ${produit.stock}`,
      });
    }

    const prixUnitaire = Number(produit.prix);
    const total = prixUnitaire * quantiteNumerique;

    // Créer la vente
    const venteResult = await client.query(
      `
      INSERT INTO ventes (
        client_id,
        total
      )
      VALUES ($1, $2)
      RETURNING
        id,
        client_id,
        date_vente,
        total
      `,
      [clientId, total],
    );

    const vente = venteResult.rows[0];

    // Créer le détail de la vente
    await client.query(
      `
      INSERT INTO details_vente (
        vente_id,
        produit_id,
        quantite,
        prix_unitaire
      )
      VALUES ($1, $2, $3, $4)
      `,
      [vente.id, produitId, quantiteNumerique, prixUnitaire],
    );

    // Diminuer le stock
    const stockResult = await client.query(
      `
      UPDATE produits
      SET stock = stock - $1
      WHERE id = $2
      RETURNING id, nom, stock
      `,
      [quantiteNumerique, produitId],
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Vente enregistrée avec succès",
      vente: {
        id: vente.id,
        client: clientResult.rows[0].nom_complet,
        produit: produit.nom,
        quantite: quantiteNumerique,
        prix_unitaire: prixUnitaire,
        total: total,
        date_vente: vente.date_vente,
        stock_restant: stockResult.rows[0].stock,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erreur rollback :", rollbackError);
    }

    console.error("Erreur enregistrement vente :", error);

    res.status(500).json({
      message: "Impossible d'enregistrer la vente",
      erreur: error.message,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// ROUTE 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route introuvable",
    methode: req.method,
    route: req.originalUrl,
  });
});

// ======================================================
// DÉMARRAGE DU SERVEUR
// ======================================================

app.listen(PORT, () => {
  console.log(`Serveur MYSALES démarré sur http://localhost:${PORT}`);
});