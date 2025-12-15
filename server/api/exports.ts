import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { getEffectivePlan, getPlanLimits } from '../middleware/subscription.js';

const router = express.Router();

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

router.get('/pdf/status', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = getEffectivePlan(req.user);
    const planLimits = getPlanLimits(req.user);
    const currentMonth = getCurrentMonth();
    
    const countResult = await query(
      'SELECT COUNT(*) as count FROM pdf_exports WHERE user_id = $1 AND export_month = $2',
      [req.user.id, currentMonth]
    );
    
    const currentCount = parseInt(countResult.rows[0]?.count || '0', 10);
    const monthlyLimit = planLimits.pdfMonthlyLimit;
    const isUnlimited = monthlyLimit === -1;
    const canExport = planLimits.pdfExport && (isUnlimited || currentCount < monthlyLimit);
    
    res.json({
      canExport,
      pdfEnabled: planLimits.pdfExport,
      currentCount,
      monthlyLimit: isUnlimited ? 'unlimited' : monthlyLimit,
      remaining: isUnlimited ? 'unlimited' : Math.max(0, monthlyLimit - currentCount),
      currentMonth,
      effectivePlan
    });
  } catch (error: any) {
    console.error('Error checking PDF export status:', error);
    res.status(500).json({ error: 'Failed to check PDF export status', details: error.message });
  }
});

router.post('/pdf/track', authenticateToken, async (req: any, res) => {
  try {
    const effectivePlan = getEffectivePlan(req.user);
    const planLimits = getPlanLimits(req.user);
    const currentMonth = getCurrentMonth();
    
    if (!planLimits.pdfExport) {
      return res.status(403).json({
        error: 'PDF export not available',
        message: 'PDF export is available on Artist plan and above.',
        suggested_plan: 'artist',
        upgrade_url: '/pricing'
      });
    }
    
    const monthlyLimit = planLimits.pdfMonthlyLimit;
    const isUnlimited = monthlyLimit === -1;
    
    if (!isUnlimited) {
      const countResult = await query(
        'SELECT COUNT(*) as count FROM pdf_exports WHERE user_id = $1 AND export_month = $2',
        [req.user.id, currentMonth]
      );
      
      const currentCount = parseInt(countResult.rows[0]?.count || '0', 10);
      
      if (currentCount >= monthlyLimit) {
        return res.status(403).json({
          error: 'Monthly PDF limit reached',
          message: `You've reached your limit of ${monthlyLimit} PDF exports this month. Upgrade to All-Access for unlimited exports.`,
          currentCount,
          monthlyLimit,
          suggested_plan: 'allaccess',
          upgrade_url: '/pricing'
        });
      }
    }
    
    await query(
      'INSERT INTO pdf_exports (user_id, export_month) VALUES ($1, $2)',
      [req.user.id, currentMonth]
    );
    
    const newCountResult = await query(
      'SELECT COUNT(*) as count FROM pdf_exports WHERE user_id = $1 AND export_month = $2',
      [req.user.id, currentMonth]
    );
    
    const newCount = parseInt(newCountResult.rows[0]?.count || '0', 10);
    
    res.json({
      success: true,
      currentCount: newCount,
      monthlyLimit: isUnlimited ? 'unlimited' : monthlyLimit,
      remaining: isUnlimited ? 'unlimited' : Math.max(0, monthlyLimit - newCount),
      currentMonth
    });
  } catch (error: any) {
    console.error('Error tracking PDF export:', error);
    res.status(500).json({ error: 'Failed to track PDF export', details: error.message });
  }
});

export default router;
