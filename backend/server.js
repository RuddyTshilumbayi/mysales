const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const pool = require("./db");

const app = express();
const PORT = 3000;

// ======================================================
// CONFIGURATION
// ======================================================

const FRONTEND = path.resolve(__dirname, "..");

// ======================================================
// MIDDLEWARES
// ======================================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

// ======================================================
// OUTILS D'AUTHENTIFICATION
// ======================================================

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Accès non autorisé. Veuillez vous connecter.",
    });
  }

  next();
}

// ======================================================
// OUTIL : ADMIN UNIQUEMENT
// ======================================================

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Accès non autorisé. Veuillez vous connecter.",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      message: "Accès interdit. Réservé à l'administrateur.",
    });
  }

  next();
}

function requirePageAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  next();
}

function requireAdminPage(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  if (req.session.user.role !== "admin") {
    return res.redirect("/index.html");
  }

  next();
}

// ======================================================
// AUTHENTIFICATION
// ======================================================

// POST - connexion
app.post("/api/login", async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({
        message: "L'email et le mot de passe sont obligatoires.",
      });
    }

    const resultat = await pool.query(
      `
      SELECT
        id,
        nom,
        email,
        mot_de_passe,
        role
      FROM utilisateurs
      WHERE email = $1
      `,
      [email.trim().toLowerCase()],
    );

    if (resultat.rows.length === 0) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    const utilisateur = resultat.rows[0];

    const motDePasseCorrect = await bcrypt.compare(
      mot_de_passe,
      utilisateur.mot_de_passe,
    );

    if (!motDePasseCorrect) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    req.session.user = {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role,
    };

    res.json({
      message: "Connexion réussie.",
      utilisateur: req.session.user,
    });
  } catch (error) {
    console.error("Erreur connexion :", error);

    res.status(500).json({
      message: "Impossible de se connecter.",
      erreur: error.message,
    });
  }
});

// GET - vérifier la session
app.get("/api/session", (req, res) => {
  if (!req.session.user) {
    return res.json({
      connecte: false,
    });
  }

  res.json({
    connecte: true,
    utilisateur: req.session.user,
  });
});

// POST - déconnexion
app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Erreur déconnexion :", error);

      return res.status(500).json({
        message: "Impossible de se déconnecter.",
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      message: "Déconnexion réussie.",
    });
  });
});

// ======================================================
// PAGES PROTÉGÉES
// ======================================================

app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  res.sendFile(path.join(FRONTEND, "index.html"));
});

app.get("/index.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(FRONTEND, "index.html"));
});

app.get("/clients.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(FRONTEND, "clients.html"));
});

app.get("/produits.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(FRONTEND, "produits.html"));
});

app.get("/ventes.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(FRONTEND, "ventes.html"));
});

app.get("/dashboard.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(FRONTEND, "dashboard.html"));
});

// Page utilisateurs : ADMIN UNIQUEMENT
app.get("/utilisateurs.html", requireAdminPage, (req, res) => {
  res.sendFile(path.join(FRONTEND, "utilisateurs.html"));
});

// ======================================================
// FICHIERS STATIQUES
// ======================================================

app.use(express.static(FRONTEND));

// ======================================================
// TEST POSTGRESQL
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
// UTILISATEURS
// ADMIN UNIQUEMENT
// ======================================================

// GET - récupérer tous les utilisateurs
app.get("/api/utilisateurs", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nom,
        email,
        role,
        date_creation
      FROM utilisateurs
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération utilisateurs :", error);

    res.status(500).json({
      message: "Impossible de récupérer les utilisateurs.",
      erreur: error.message,
    });
  }
});

// POST - créer un utilisateur
app.post("/api/utilisateurs", requireAdmin, async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({
        message:
          "Le nom, l'email, le mot de passe et le rôle sont obligatoires.",
      });
    }

    const roleValide = ["admin", "vendeur"].includes(role);

    if (!roleValide) {
      return res.status(400).json({
        message: "Le rôle doit être admin ou vendeur.",
      });
    }

    if (mot_de_passe.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const motDePasseHash = await bcrypt.hash(mot_de_passe, 12);

    const result = await pool.query(
      `
      INSERT INTO utilisateurs (
        nom,
        email,
        mot_de_passe,
        role
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        nom,
        email,
        role,
        date_creation
      `,
      [nom.trim(), email.trim().toLowerCase(), motDePasseHash, role],
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès.",
      utilisateur: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur création utilisateur :", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Cette adresse e-mail existe déjà.",
      });
    }

    res.status(500).json({
      message: "Impossible de créer l'utilisateur.",
      erreur: error.message,
    });
  }
});

// PUT - modifier un utilisateur
app.put("/api/utilisateurs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { nom, email, mot_de_passe, role } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID utilisateur invalide.",
      });
    }

    if (!nom || !email || !role) {
      return res.status(400).json({
        message: "Le nom, l'email et le rôle sont obligatoires.",
      });
    }

    if (!["admin", "vendeur"].includes(role)) {
      return res.status(400).json({
        message: "Le rôle doit être admin ou vendeur.",
      });
    }

    let result;

    if (mot_de_passe && mot_de_passe.trim() !== "") {
      if (mot_de_passe.length < 6) {
        return res.status(400).json({
          message: "Le mot de passe doit contenir au moins 6 caractères.",
        });
      }

      const motDePasseHash = await bcrypt.hash(mot_de_passe, 12);

      result = await pool.query(
        `
        UPDATE utilisateurs
        SET
          nom = $1,
          email = $2,
          mot_de_passe = $3,
          role = $4
        WHERE id = $5
        RETURNING
          id,
          nom,
          email,
          role,
          date_creation
        `,
        [nom.trim(), email.trim().toLowerCase(), motDePasseHash, role, id],
      );
    } else {
      result = await pool.query(
        `
        UPDATE utilisateurs
        SET
          nom = $1,
          email = $2,
          role = $3
        WHERE id = $4
        RETURNING
          id,
          nom,
          email,
          role,
          date_creation
        `,
        [nom.trim(), email.trim().toLowerCase(), role, id],
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    if (req.session.user.id === id) {
      req.session.user.nom = result.rows[0].nom;
      req.session.user.email = result.rows[0].email;
      req.session.user.role = result.rows[0].role;
    }

    res.json({
      message: "Utilisateur modifié avec succès.",
      utilisateur: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur modification utilisateur :", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Cette adresse e-mail existe déjà.",
      });
    }

    res.status(500).json({
      message: "Impossible de modifier l'utilisateur.",
      erreur: error.message,
    });
  }
});

// DELETE - supprimer un utilisateur
app.delete("/api/utilisateurs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID utilisateur invalide.",
      });
    }

    if (req.session.user.id === id) {
      return res.status(400).json({
        message: "Vous ne pouvez pas supprimer votre propre compte.",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM utilisateurs
      WHERE id = $1
      RETURNING id, nom, email, role
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    res.json({
      message: "Utilisateur supprimé avec succès.",
      utilisateur: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur suppression utilisateur :", error);

    res.status(500).json({
      message: "Impossible de supprimer l'utilisateur.",
      erreur: error.message,
    });
  }
});

// ======================================================
// CLIENTS
// ======================================================

app.get("/api/clients", requireAuth, async (req, res) => {
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

app.post("/api/clients", requireAuth, async (req, res) => {
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

app.put("/api/clients/:id", requireAuth, async (req, res) => {
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

app.delete("/api/clients/:id", requireAuth, async (req, res) => {
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

app.get("/api/produits", requireAuth, async (req, res) => {
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

app.post("/api/produits", requireAuth, async (req, res) => {
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

app.put("/api/produits/:id", requireAuth, async (req, res) => {
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

app.delete("/api/produits/:id", requireAuth, async (req, res) => {
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

// GET - récupérer les ventes
// Une ligne = une commande complète
app.get("/api/ventes", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id,
        v.date_vente,
        v.total,
        c.nom_complet AS client,
        u.nom AS vendeur,

        COALESCE(
          json_agg(
            json_build_object(
              'produit_id', p.id,
              'produit', p.nom,
              'quantite', dv.quantite,
              'prix_unitaire', dv.prix_unitaire,
              'sous_total',
                dv.quantite * dv.prix_unitaire
            )
            ORDER BY dv.id
          ) FILTER (WHERE dv.id IS NOT NULL),
          '[]'::json
        ) AS produits

      FROM ventes v

      INNER JOIN clients c
        ON c.id = v.client_id

      INNER JOIN utilisateurs u
        ON u.id = v.utilisateur_id

      LEFT JOIN details_vente dv
        ON dv.vente_id = v.id

      LEFT JOIN produits p
        ON p.id = dv.produit_id

      GROUP BY
        v.id,
        v.date_vente,
        v.total,
        c.nom_complet,
        u.nom

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

// POST - enregistrer une commande multi-produits
app.post("/api/ventes", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { client_id, produits } = req.body;

    const clientId = Number(client_id);

    // ==================================================
    // VALIDATION DU CLIENT
    // ==================================================

    if (!Number.isInteger(clientId)) {
      return res.status(400).json({
        message: "Le client sélectionné est invalide.",
      });
    }

    // ==================================================
    // VALIDATION DU PANIER
    // ==================================================

    if (!Array.isArray(produits) || produits.length === 0) {
      return res.status(400).json({
        message: "Le panier doit contenir au moins un produit.",
      });
    }

    // ==================================================
    // NORMALISATION DES PRODUITS
    // ==================================================

    const panierMap = new Map();

    for (const ligne of produits) {
      const produitId = Number(ligne.produit_id);
      const quantite = Number(ligne.quantite);

      if (!Number.isInteger(produitId) || produitId <= 0) {
        return res.status(400).json({
          message: "Un produit du panier est invalide.",
        });
      }

      if (!Number.isInteger(quantite) || quantite <= 0) {
        return res.status(400).json({
          message:
            "La quantité de chaque produit doit être un entier supérieur à 0.",
        });
      }

      const quantiteExistante = panierMap.get(produitId) || 0;

      panierMap.set(produitId, quantiteExistante + quantite);
    }

    const produitsDemandes = Array.from(panierMap.entries()).map(
      ([produitId, quantite]) => ({
        produit_id: produitId,
        quantite: quantite,
      }),
    );

    const produitIds = produitsDemandes.map((ligne) => ligne.produit_id);

    // ==================================================
    // DÉBUT TRANSACTION
    // ==================================================

    await client.query("BEGIN");

    // ==================================================
    // VÉRIFIER LE CLIENT
    // ==================================================

    const clientResult = await client.query(
      `
        SELECT
          id,
          nom_complet
        FROM clients
        WHERE id = $1
        `,
      [clientId],
    );

    if (clientResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Client introuvable.",
      });
    }

    // ==================================================
    // RÉCUPÉRER ET VERROUILLER LES PRODUITS
    // ==================================================

    const produitsResult = await client.query(
      `
        SELECT
          id,
          nom,
          prix,
          stock
        FROM produits
        WHERE id = ANY($1::int[])
        ORDER BY id
        FOR UPDATE
        `,
      [produitIds],
    );

    // ==================================================
    // VÉRIFIER QUE TOUS LES PRODUITS EXISTENT
    // ==================================================

    if (produitsResult.rows.length !== produitIds.length) {
      const produitsTrouves = new Set(
        produitsResult.rows.map((produit) => produit.id),
      );

      const produitManquant = produitIds.find((id) => !produitsTrouves.has(id));

      await client.query("ROLLBACK");

      return res.status(404).json({
        message: `Le produit avec l'ID ${produitManquant} est introuvable.`,
      });
    }

    // ==================================================
    // CRÉER UNE MAP DES PRODUITS
    // ==================================================

    const produitsMap = new Map();

    produitsResult.rows.forEach((produit) => {
      produitsMap.set(produit.id, produit);
    });

    // ==================================================
    // VÉRIFIER LES STOCKS
    // ==================================================

    for (const ligne of produitsDemandes) {
      const produit = produitsMap.get(ligne.produit_id);

      if (Number(produit.stock) < ligne.quantite) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            `Stock insuffisant pour ${produit.nom}. ` +
            `Stock disponible : ${produit.stock}. ` +
            `Quantité demandée : ${ligne.quantite}.`,
        });
      }
    }

    // ==================================================
    // CALCUL DU TOTAL
    // ==================================================

    let total = 0;

    for (const ligne of produitsDemandes) {
      const produit = produitsMap.get(ligne.produit_id);

      const prixUnitaire = Number(produit.prix);

      total += prixUnitaire * ligne.quantite;
    }

    // ==================================================
    // CRÉER LA VENTE
    // ==================================================

    const venteResult = await client.query(
      `
        INSERT INTO ventes (
          client_id,
          total,
          utilisateur_id
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          client_id,
          date_vente,
          total
        `,
      [clientId, total, req.session.user.id],
    );

    const vente = venteResult.rows[0];

    // ==================================================
    // ENREGISTRER CHAQUE PRODUIT
    // ==================================================

    const produitsEnregistres = [];

    for (const ligne of produitsDemandes) {
      const produit = produitsMap.get(ligne.produit_id);

      const prixUnitaire = Number(produit.prix);

      const sousTotal = prixUnitaire * ligne.quantite;

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
        [vente.id, ligne.produit_id, ligne.quantite, prixUnitaire],
      );

      // ==================================================
      // DIMINUER LE STOCK
      // ==================================================

      const stockResult = await client.query(
        `
          UPDATE produits
          SET
            stock = stock - $1
          WHERE id = $2
          RETURNING
            id,
            nom,
            stock
          `,
        [ligne.quantite, ligne.produit_id],
      );

      produitsEnregistres.push({
        produit_id: produit.id,

        produit: produit.nom,

        quantite: ligne.quantite,

        prix_unitaire: prixUnitaire,

        sous_total: sousTotal,

        stock_restant: stockResult.rows[0].stock,
      });
    }

    // ==================================================
    // VALIDER LA TRANSACTION
    // ==================================================

    await client.query("COMMIT");

    // ==================================================
    // RÉPONSE
    // ==================================================

    res.status(201).json({
      message: "Commande enregistrée avec succès.",

      vente: {
        id: vente.id,

        client: clientResult.rows[0].nom_complet,

        produits: produitsEnregistres,

        total: total,

        date_vente: vente.date_vente,

        vendeur: req.session.user.nom,
      },
    });
  } catch (error) {
    // ==================================================
    // ANNULER LA TRANSACTION EN CAS D'ERREUR
    // ==================================================

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erreur rollback :", rollbackError);
    }

    console.error("Erreur enregistrement commande :", error);

    res.status(500).json({
      message: "Impossible d'enregistrer la commande",
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
