const db = require('../database/db');

// Dashboard statistiques globales
const getGlobalStats = async (req, res) => {
  try {
    const stats = await db.query('SELECT * FROM global_stats');
    
    const recentGains = await db.query(
      'SELECT * FROM daily_gains ORDER BY gain_date DESC LIMIT 30'
    );

    const pendingTransactions = await db.query(
      "SELECT COUNT(*) FROM transactions WHERE status = 'pending'"
    );

    const pendingKYC = await db.query(
      "SELECT COUNT(*) FROM users WHERE kyc_status IN ('pending', 'submitted')"
    );

    // Récupérer le capital Shepherd
    const shepherdCapital = await db.query(
      'SELECT total_capital FROM shepherd_capital_summary'
    );

    res.json({
      stats: stats.rows[0],
      recentGains: recentGains.rows,
      pendingTransactions: parseInt(pendingTransactions.rows[0].count),
      pendingKYC: parseInt(pendingKYC.rows[0].count),
      shepherdCapital: shepherdCapital.rows.length > 0 ? parseFloat(shepherdCapital.rows[0].total_capital) : 0
    });

  } catch (error) {
    console.error('Get global stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Liste de tous les investisseurs
const getAllInvestors = async (req, res) => {
  try {
    // Récupérer tous les investisseurs avec leurs investissements (LEFT JOIN pour inclure ceux sans investissement)
    const investors = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.kyc_status,
        u.is_active,
        u.created_at,
        COALESCE(i.balance, 0) as balance,
        COALESCE(i.total_deposited, 0) as total_deposited,
        COALESCE(i.total_gains, 0) as total_gains,
        COALESCE(i.created_at, u.created_at) as investment_date
      FROM users u
      LEFT JOIN investments i ON u.id = i.user_id AND i.is_active = true
      WHERE u.role = 'investor' AND u.is_active = true
      ORDER BY u.created_at DESC
    `);

    res.json({
      investors: investors.rows,
      total: investors.rows.length
    });

  } catch (error) {
    console.error('Get all investors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Saisie du gain journalier et calcul automatique - VERSION SIMPLIFIÉE
const submitDailyGain = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { gainPercentage, gainDate } = req.body;
    const adminId = req.user.userId;

    if (!gainPercentage || !gainDate) {
      return res.status(400).json({ error: 'Gain percentage and date are required' });
    }

    // Vérifier si un gain a déjà été saisi pour cette date
    const existingGain = await client.query(
      'SELECT id FROM daily_gains WHERE gain_date = $1',
      [gainDate]
    );

    if (existingGain.rows.length > 0) {
      client.release();
      return res.status(400).json({ error: 'Daily gain already submitted for this date' });
    }

    await client.query('BEGIN');

    // Calculer le bankroll investisseurs ET le capital Shepherd séparément
    const investorBankrollResult = await client.query(
      `SELECT COALESCE(SUM(i.balance), 0) as investor_total
       FROM investments i 
       JOIN users u ON i.user_id = u.id
       WHERE i.is_active = true AND u.kyc_status = 'approved'`
    );
    
    const shepherdResult = await client.query(
      `SELECT total_capital as shepherd_balance 
       FROM shepherd_capital_summary`
    );
    
    const investorBankroll = parseFloat(investorBankrollResult.rows[0].investor_total);
    const shepherdBalance = shepherdResult.rows.length > 0 ? parseFloat(shepherdResult.rows[0].shepherd_balance) : 0;
    const totalBankroll = investorBankroll + shepherdBalance;

    if (totalBankroll === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'No capital found. Please add Shepherd capital first.' });
    }

    // Calculer les gains SÉPARÉMENT pour Shepherd et les investisseurs
    // 1. Gain du capital Shepherd → 100% pour Shepherd
    const shepherdGainFromOwnCapital = shepherdBalance * (gainPercentage / 100);
    
    // 2. Gain du capital investisseurs → 50% pour investisseurs, 50% pour Shepherd
    const investorTotalGain = investorBankroll * (gainPercentage / 100);
    const investorSharePercentage = 0.5; // 50%
    const gainForInvestors = investorTotalGain * investorSharePercentage;
    const shepherdGainFromInvestors = investorTotalGain * (1 - investorSharePercentage);
    
    // 3. Gain TOTAL de Shepherd = son propre gain + sa part des gains investisseurs
    const shepherdTotalGain = shepherdGainFromOwnCapital + shepherdGainFromInvestors;
    const totalGain = shepherdGainFromOwnCapital + investorTotalGain;

    // 1. Enregistrer le gain journalier
    const dailyGainResult = await client.query(
      `INSERT INTO daily_gains (gain_date, bankroll, gain_percentage, total_gain, redistributed_gain, admin_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [gainDate, totalBankroll, gainPercentage, totalGain, gainForInvestors, adminId]
    );
    const dailyGainId = dailyGainResult.rows[0].id;

    // Récupérer tous les investisseurs actifs
    const investors = await client.query(
      `SELECT i.id as investment_id, i.user_id, i.balance, u.email, u.first_name, u.last_name
       FROM investments i
       JOIN users u ON i.user_id = u.id
       WHERE i.is_active = true AND u.kyc_status = 'approved'`
    );
    
    // 2. Enregistrer le gain dans la table shepherd_capital
    const shepherdDescription = `Gain ${gainDate}: ${gainPercentage}% - Capital propre: ${shepherdGainFromOwnCapital.toFixed(2)}€, Part clients: ${shepherdGainFromInvestors.toFixed(2)}€`;
    
    await client.query(
      `INSERT INTO shepherd_capital (amount, description, transaction_type, category, admin_id)
       VALUES ($1, $2, 'deposit', 'Gain journalier', $3)`,
      [shepherdTotalGain, shepherdDescription, adminId]
    );

    // Distribuer les gains aux investisseurs (si des investisseurs existent)
    const gainDistributions = [];
    
    if (investors.rows.length > 0 && investorBankroll > 0) {
      for (const investor of investors.rows) {
        const capitalInvested = parseFloat(investor.balance);
        const investorShare = capitalInvested / investorBankroll; // Part de l'investisseur dans le capital investisseurs
        const investorGain = gainForInvestors * investorShare; // Sa part des 50% réservés aux investisseurs

        // Enregistrer le gain individuel
        await client.query(
          `INSERT INTO investor_gains (daily_gain_id, user_id, investment_id, capital_invested, gain_percentage, gain_amount)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [dailyGainId, investor.user_id, investor.investment_id, capitalInvested, gainPercentage, investorGain]
        );

        // Mettre à jour le solde de l'investisseur
        await client.query(
          `UPDATE investments 
           SET balance = balance + $1, total_gains = total_gains + $1
           WHERE id = $2`,
          [investorGain, investor.investment_id]
        );

        // Créer une transaction de gain
        await client.query(
          `INSERT INTO transactions (user_id, investment_id, type, amount, status, description, processed_by)
           VALUES ($1, $2, 'gain', $3, 'completed', $4, $5)`,
          [investor.user_id, investor.investment_id, investorGain, 
           `Gain journalier du ${gainDate} - ${gainPercentage}%`, adminId]
        );

        // Créer une notification
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, 'gain')`,
          [investor.user_id, 
           'Nouveau gain crédité', 
           `Félicitations ! Un gain de ${investorGain.toFixed(2)} € a été crédité sur votre compte (${gainPercentage}%).`]
        );

        gainDistributions.push({
          userId: investor.user_id,
          name: `${investor.first_name} ${investor.last_name}`,
          email: investor.email,
          capitalInvested: capitalInvested.toFixed(2),
          gainAmount: investorGain.toFixed(2),
          sharePercentage: (investorShare * 100).toFixed(2)
        });
      }
    }

    // 3. COMMIT
    await client.query('COMMIT');
    client.release();

    // 4. Réponse
    res.json({
      message: 'Daily gain submitted and distributed successfully',
      summary: {
        gainDate,
        totalBankroll: totalBankroll.toFixed(2),
        investorBankroll: investorBankroll.toFixed(2),
        shepherdBalance: shepherdBalance.toFixed(2),
        gainPercentage,
        totalGain: totalGain.toFixed(2),
        gainForInvestors: gainForInvestors.toFixed(2),
        gainForShepherd: shepherdTotalGain.toFixed(2),
        investorsCount: investors.rows.length,
        note: investors.rows.length === 0 ? 'No investors - Shepherd received 100 percent of gains' : '50/50 split between investors and Shepherd'
      },
      distributions: gainDistributions
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit daily gain error:', error);
    res.status(500).json({ error: 'Internal server error' });
    client.release();
  }
};

// Valider ou rejeter un KYC
const reviewKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'
    const adminId = req.user.userId;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (action === 'reject' && !rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Mettre à jour le statut KYC de l'utilisateur
    await db.query(
      'UPDATE users SET kyc_status = $1 WHERE id = $2',
      [newStatus, userId]
    );

    // Mettre à jour les documents KYC
    await db.query(
      `UPDATE kyc_documents 
       SET status = $1, reviewed_at = NOW(), reviewed_by = $2, rejection_reason = $3
       WHERE user_id = $4`,
      [newStatus, adminId, rejectionReason, userId]
    );

    // Créer une notification
    const message = action === 'approve' 
      ? 'Votre KYC a été approuvé ! Vous pouvez maintenant effectuer des dépôts.'
      : `Votre KYC a été rejeté. Raison : ${rejectionReason}`;

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'Mise à jour KYC', message, action === 'approve' ? 'success' : 'warning']
    );

    res.json({
      message: `KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      userId,
      newStatus
    });

  } catch (error) {
    console.error('Review KYC error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Valider ou rejeter un dépôt/retrait
const reviewTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const adminId = req.user.userId;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Récupérer la transaction
    const transactionResult = await db.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    const newStatus = action === 'approve' ? 'completed' : 'rejected';

    // Mettre à jour la transaction
    await db.query(
      'UPDATE transactions SET status = $1, processed_at = NOW(), processed_by = $2 WHERE id = $3',
      [newStatus, adminId, transactionId]
    );

    // Si approuvé, mettre à jour le portefeuille
    if (action === 'approve') {
      if (transaction.type === 'deposit') {
        await db.query(
          `UPDATE investments 
           SET balance = balance + $1, total_deposited = total_deposited + $1
           WHERE id = $2`,
          [transaction.amount, transaction.investment_id]
        );
      } else if (transaction.type === 'withdrawal') {
        await db.query(
          `UPDATE investments 
           SET balance = balance - $1, total_withdrawn = total_withdrawn + $1
           WHERE id = $2`,
          [transaction.amount, transaction.investment_id]
        );
      }
    }

    // Notification
    const message = action === 'approve'
      ? `Votre ${transaction.type === 'deposit' ? 'dépôt' : 'retrait'} de ${transaction.amount} € a été approuvé.`
      : `Votre ${transaction.type === 'deposit' ? 'dépôt' : 'retrait'} de ${transaction.amount} € a été rejeté.`;

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'transaction')`,
      [transaction.user_id, 'Transaction mise à jour', message]
    );

    res.json({
      message: `Transaction ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      transactionId,
      newStatus
    });

  } catch (error) {
    console.error('Review transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Gestion du capital propre Shepherd
const getShepherdCapital = async (req, res) => {
  try {
    const summary = await db.query('SELECT * FROM shepherd_capital_summary');
    const history = await db.query(
      'SELECT * FROM shepherd_capital ORDER BY created_at DESC LIMIT 50'
    );

    res.json({
      summary: summary.rows[0],
      history: history.rows
    });
  } catch (error) {
    console.error('Get Shepherd capital error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addShepherdCapital = async (req, res) => {
  try {
    const { amount, description, transactionType, category } = req.body;
    const adminId = req.user.userId;

    if (!amount || !transactionType) {
      return res.status(400).json({ error: 'Amount and transaction type are required' });
    }

    if (!['deposit', 'withdrawal', 'adjustment'].includes(transactionType)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    const result = await db.query(
      `INSERT INTO shepherd_capital (amount, description, transaction_type, category, admin_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [amount, description || '', transactionType, category || null, adminId]
    );

    res.json({
      message: 'Shepherd capital updated successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Add Shepherd capital error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export CSV du capital Shepherd
const exportShepherdCapitalCSV = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = 'SELECT * FROM shepherd_capital ORDER BY created_at DESC';
    let params = [];
    
    if (month && year) {
      query = `SELECT * FROM shepherd_capital 
               WHERE EXTRACT(MONTH FROM created_at) = $1 
               AND EXTRACT(YEAR FROM created_at) = $2 
               ORDER BY created_at DESC`;
      params = [month, year];
    }
    
    const transactions = await db.query(query, params);
    
    // Créer le CSV
    let csv = 'Date,Type,Catégorie,Montant,Description,Solde Cumulé\n';
    let cumulativeBalance = 0;
    
    // Inverser pour calculer le solde du plus ancien au plus récent
    const reversedTransactions = [...transactions.rows].reverse();
    
    reversedTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.transaction_type === 'withdrawal') {
        cumulativeBalance -= amount;
      } else {
        cumulativeBalance += amount;
      }
      
      const date = new Date(transaction.created_at).toLocaleDateString('fr-FR');
      const type = transaction.transaction_type === 'deposit' ? 'Dépôt' : 
                   transaction.transaction_type === 'withdrawal' ? 'Retrait' : 'Ajustement';
      const category = transaction.category || 'Non catégorisé';
      const description = (transaction.description || '').replace(/,/g, ';').replace(/\n/g, ' ');
      
      csv += `${date},${type},${category},${amount.toFixed(2)},${description},${cumulativeBalance.toFixed(2)}\n`;
    });
    
    // Nom du fichier
    const filename = month && year 
      ? `shepherd-capital-${year}-${String(month).padStart(2, '0')}.csv`
      : `shepherd-capital-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv); // BOM pour Excel
    
  } catch (error) {
    console.error('Export Shepherd capital CSV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Récupérer les documents KYC d'un utilisateur spécifique
const getUserKYCDocuments = async (req, res) => {
  try {
    const { userId } = req.params;

    const documents = await db.query(
      `SELECT id, document_type, file_url, status, rejection_reason, uploaded_at, reviewed_at
       FROM kyc_documents 
       WHERE user_id = $1 
       ORDER BY uploaded_at DESC`,
      [userId]
    );

    res.json({ documents: documents.rows });
  } catch (error) {
    console.error('Get user KYC documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Récupérer les informations de succession d'un utilisateur
const getUserSuccessor = async (req, res) => {
  try {
    const { userId } = req.params;

    const successor = await db.query(
      `SELECT s.*, u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
       FROM successors s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1`,
      [userId]
    );

    if (successor.rows.length === 0) {
      return res.json({ successor: null });
    }

    res.json({ successor: successor.rows[0] });
  } catch (error) {
    console.error('Get user successor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    // Vérifier que l'utilisateur existe et n'est pas admin
    const userCheck = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    await client.query('BEGIN');

    // PostgreSQL CASCADE s'occupera de supprimer automatiquement :
    // - successors, kyc_documents, contracts, investments, transactions, notifications, refresh_tokens
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Exporter toutes les données des clients (pour backup)
const exportAllData = async (req, res) => {
  try {
    // Récupérer tous les utilisateurs avec leurs informations complètes
    const users = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.kyc_status,
              u.created_at,
              i.balance, i.total_deposited, i.total_withdrawn, i.total_gains,
              c.contract_number, c.signed, c.signed_at,
              s.first_name as successor_first_name, s.last_name as successor_last_name,
              s.email as successor_email, s.phone as successor_phone, s.relationship
       FROM users u
       LEFT JOIN investments i ON u.id = i.user_id
       LEFT JOIN contracts c ON u.id = c.user_id
       LEFT JOIN successors s ON u.id = s.user_id
       WHERE u.role = 'investor'
       ORDER BY u.created_at DESC`
    );

    // Récupérer toutes les transactions
    const transactions = await db.query(
      `SELECT t.*, u.email, u.first_name, u.last_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );

    // Récupérer tous les gains
    const gains = await db.query(
      `SELECT dg.*, 
              (SELECT COUNT(*) FROM investor_gains WHERE daily_gain_id = dg.id) as investors_count
       FROM daily_gains dg
       ORDER BY dg.gain_date DESC`
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      users: users.rows,
      transactions: transactions.rows,
      dailyGains: gains.rows,
      summary: {
        totalUsers: users.rows.length,
        totalTransactions: transactions.rows.length,
        totalDailyGains: gains.rows.length
      }
    };

    // Envoyer en JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="shepherd-capital-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Export all data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Récupérer le rapport mensuel des gains
const getMonthlyGainReport = async (req, res) => {
  try {
    const { year } = req.query;
    
    let query = 'SELECT * FROM monthly_gain_report ORDER BY year DESC, month DESC';
    let params = [];
    
    if (year) {
      query = 'SELECT * FROM monthly_gain_report WHERE year = $1 ORDER BY month DESC';
      params = [year];
    }
    
    const result = await db.query(query, params);
    
    res.json({
      monthlyGains: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get monthly gain report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Récupérer toutes les transactions (pour l'admin)
const getAllTransactions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, 
              u.email, u.first_name, u.last_name,
              json_build_object('email', u.email, 'firstName', u.first_name, 'lastName', u.last_name) as user
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    
    res.json({
      transactions: result.rows
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approuver une transaction
const approveTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const adminId = req.user.userId;

    const result = await db.query(
      `UPDATE transactions 
       SET status = 'completed', processed_at = NOW(), processed_by = $1
       WHERE id = $2
       RETURNING *`,
      [adminId, transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];

    // Si c'est un dépôt, créditer le compte
    if (transaction.type === 'deposit') {
      await db.query(
        `UPDATE investments 
         SET balance = balance + $1,
             total_deposited = total_deposited + $1
         WHERE id = $2`,
        [transaction.amount, transaction.investment_id]
      );

      // Créer une notification
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Dépôt validé', $2, 'success')`,
        [transaction.user_id, `Votre dépôt de ${transaction.amount} ${transaction.currency} a été validé.`]
      );
    }

    // Si c'est un retrait, débiter le compte
    if (transaction.type === 'withdrawal') {
      await db.query(
        `UPDATE investments 
         SET balance = balance - $1,
             total_withdrawn = total_withdrawn + $1
         WHERE id = $2`,
        [transaction.amount, transaction.investment_id]
      );

      // Créer une notification
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Retrait traité', $2, 'success')`,
        [transaction.user_id, `Votre retrait de ${transaction.amount} ${transaction.currency} a été traité.`]
      );
    }

    res.json({
      message: 'Transaction approved successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Approve transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Rejeter une transaction
const rejectTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const adminId = req.user.userId;

    const result = await db.query(
      `UPDATE transactions 
       SET status = 'rejected', processed_at = NOW(), processed_by = $1
       WHERE id = $2
       RETURNING *`,
      [adminId, transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];

    // Créer une notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Transaction rejetée', $2, 'error')`,
      [transaction.user_id, `Votre ${transaction.type === 'deposit' ? 'dépôt' : 'retrait'} de ${transaction.amount} ${transaction.currency} a été rejeté.`]
    );

    res.json({
      message: 'Transaction rejected successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Reject transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getGlobalStats,
  getAllInvestors,
  submitDailyGain,
  reviewKYC,
  reviewTransaction,
  getShepherdCapital,
  addShepherdCapital,
  exportShepherdCapitalCSV,
  getUserKYCDocuments,
  getUserSuccessor,
  deleteUser,
  exportAllData,
  getMonthlyGainReport,
  getAllTransactions,
  approveTransaction,
  rejectTransaction
};
