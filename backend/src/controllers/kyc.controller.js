const db = require('../database/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/kyc');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.userId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

// Upload de documents KYC
const uploadKYCDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentType } = req.body; // 'identity' or 'proof_of_address'

    if (!['identity', 'proof_of_address'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Enregistrer le document en base
    const document = await db.query(
      `INSERT INTO kyc_documents (user_id, document_type, file_url, encrypted_file_path, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [userId, documentType, req.file.filename, req.file.path]
    );

    // Mettre à jour le statut KYC de l'utilisateur
    await db.query(
      "UPDATE users SET kyc_status = 'submitted' WHERE id = $1",
      [userId]
    );

    // Notification admin
    const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Nouveau document KYC', $2, 'info')`,
        [admin.id, `Un nouveau document KYC (${documentType}) a été soumis pour validation.`]
      );
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document.rows[0].id,
        documentType: document.rows[0].document_type,
        status: document.rows[0].status,
        uploadedAt: document.rows[0].uploaded_at
      }
    });

  } catch (error) {
    console.error('Upload KYC document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Récupérer les documents KYC de l'utilisateur
const getKYCDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const documents = await db.query(
      'SELECT id, document_type, status, rejection_reason, uploaded_at, reviewed_at FROM kyc_documents WHERE user_id = $1 ORDER BY uploaded_at DESC',
      [userId]
    );

    res.json({ documents: documents.rows });

  } catch (error) {
    console.error('Get KYC documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Générer un contrat (simplifié pour prototype)
const generateContract = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Vérifier le KYC
    const userResult = await db.query(
      'SELECT first_name, last_name, email, kyc_status FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.kyc_status !== 'approved') {
      return res.status(403).json({ error: 'KYC must be approved before generating contract' });
    }

    // Vérifier si un contrat existe déjà
    const existingContract = await db.query(
      'SELECT id, contract_number, contract_pdf_url, signed FROM contracts WHERE user_id = $1',
      [userId]
    );

    if (existingContract.rows.length > 0) {
      return res.json({
        message: 'Contract already exists',
        contract: existingContract.rows[0]
      });
    }

    // Générer un numéro de contrat unique
    const contractNumber = `SCI-${Date.now()}-${userId.substring(0, 8).toUpperCase()}`;

    // En production, utiliser PDFKit pour générer un vrai PDF
    // Pour ce prototype, on simule
    const contractPdfUrl = `contract-${contractNumber}.pdf`;

    const contract = await db.query(
      `INSERT INTO contracts (user_id, contract_number, contract_pdf_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, contractNumber, contractPdfUrl]
    );

    res.status(201).json({
      message: 'Contract generated successfully',
      contract: contract.rows[0]
    });

  } catch (error) {
    console.error('Generate contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Signer le contrat (signature électronique)
const signContract = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contractId, signatureData } = req.body;

    // Vérifier le contrat
    const contractResult = await db.query(
      'SELECT id, signed FROM contracts WHERE id = $1 AND user_id = $2',
      [contractId, userId]
    );

    if (contractResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contractResult.rows[0].signed) {
      return res.status(400).json({ error: 'Contract already signed' });
    }

    // Signer le contrat
    await db.query(
      'UPDATE contracts SET signed = true, signature_data = $1, signed_at = NOW() WHERE id = $2',
      [signatureData, contractId]
    );

    // Marquer l'utilisateur comme vérifié
    await db.query(
      'UPDATE users SET is_verified = true WHERE id = $1',
      [userId]
    );

    res.json({ message: 'Contract signed successfully' });

  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Récupérer le contrat de l'utilisateur
const getContract = async (req, res) => {
  try {
    const userId = req.user.userId;

    const contract = await db.query(
      'SELECT id, contract_number, contract_pdf_url, signed, signed_at, generated_at FROM contracts WHERE user_id = $1',
      [userId]
    );

    if (contract.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({ contract: contract.rows[0] });

  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Servir un fichier KYC de manière sécurisée
const serveKYCFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Vérifier que le fichier existe et appartient à l'utilisateur ou que c'est un admin
    const document = await db.query(
      'SELECT user_id, encrypted_file_path FROM kyc_documents WHERE file_url = $1',
      [filename]
    );

    if (document.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Vérifier les permissions
    if (userRole !== 'admin' && document.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Servir le fichier
    const filePath = document.rows[0].encrypted_file_path;
    res.sendFile(filePath);

  } catch (error) {
    console.error('Serve KYC file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Télécharger le contrat PDF
const downloadContract = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Récupérer le contrat de l'utilisateur
    const contractResult = await db.query(
      `SELECT c.contract_number, c.contract_pdf_url, c.signed, c.generated_at,
              u.first_name, u.last_name, u.email
       FROM contracts c
       JOIN users u ON c.user_id = u.id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (contractResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const contract = contractResult.rows[0];

    // Générer un contenu HTML qui peut être affiché dans le navigateur
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrat ${contract.contract_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            background: #f5f5f5;
        }
        .contract {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1a56db;
            text-align: center;
            border-bottom: 3px solid #1a56db;
            padding-bottom: 20px;
        }
        .header-info {
            background: #f0f4ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            margin-left: 10px;
        }
        .signed { background: #d4edda; color: #155724; }
        .unsigned { background: #fff3cd; color: #856404; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-left: 4px solid #1a56db; padding-left: 15px; }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #ddd; 
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="contract">
        <h1>CONTRAT D'INVESTISSEMENT</h1>
        <h2 style="text-align: center; color: #666;">SHEPHERD CAPITAL INVESTMENT</h2>
        
        <div class="header-info">
            <p><strong>Numéro de contrat:</strong> ${contract.contract_number}</p>
            <p><strong>Investisseur:</strong> ${contract.first_name} ${contract.last_name}</p>
            <p><strong>Email:</strong> ${contract.email}</p>
            <p><strong>Date de génération:</strong> ${new Date(contract.generated_at).toLocaleDateString('fr-FR')}</p>
            <p><strong>Statut:</strong> 
                <span class="status ${contract.signed ? 'signed' : 'unsigned'}">
                    ${contract.signed ? '✓ SIGNÉ ÉLECTRONIQUEMENT' : '○ EN ATTENTE DE SIGNATURE'}
                </span>
            </p>
        </div>

        <div class="section">
            <h2>Article 1 - Objet du contrat</h2>
            <p>Le présent contrat a pour objet de définir les modalités de l'investissement réalisé par l'investisseur auprès de Shepherd Capital Investment.</p>
        </div>

        <div class="section">
            <h2>Article 2 - Montant et conditions d'investissement</h2>
            <p>Le montant minimum d'investissement est fixé à 1,000 EUR.</p>
            <p>Les fonds sont gérés de manière collective dans un pool d'investissement commun.</p>
        </div>

        <div class="section">
            <h2>Article 3 - Distribution des gains</h2>
            <p>50% des gains réalisés sont automatiquement redistribués aux investisseurs au prorata de leur capital investi.</p>
            <p>Les gains sont calculés et distribués de manière quotidienne.</p>
        </div>

        <div class="section">
            <h2>Article 4 - Retraits</h2>
            <p>Les investisseurs peuvent demander le retrait de tout ou partie de leur capital à tout moment.</p>
            <p>Les demandes de retrait sont traitées sous 24-48 heures ouvrées.</p>
        </div>

        <div class="section">
            <h2>Article 5 - Risques</h2>
            <p>L'investisseur reconnaît être informé des risques inhérents aux marchés financiers.</p>
            <p>Les performances passées ne préjugent pas des performances futures.</p>
        </div>

        <div class="section">
            <h2>Article 6 - Durée et résiliation</h2>
            <p>Le contrat est conclu pour une durée indéterminée.</p>
            <p>Chaque partie peut y mettre fin à tout moment avec un préavis de 30 jours.</p>
        </div>

        <div class="footer">
            <p><strong>Shepherd Capital Investment</strong></p>
            <p>Document généré électroniquement - ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            ${contract.signed ? '<p style="color: #28a745;">✓ Ce contrat a été signé électroniquement</p>' : ''}
        </div>
    </div>
</body>
</html>
    `;

    // Envoyer en tant que HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);

  } catch (error) {
    console.error('Download contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  upload,
  uploadKYCDocument,
  getKYCDocuments,
  generateContract,
  signContract,
  getContract,
  serveKYCFile,
  downloadContract
};
