/**
 * Admin routes for auditing and monitoring
 * Provides endpoints to view application logs (admin-only)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken, requireAdmin);

/**
 * Get application logs (paginated tail)
 * Reads the external log file and returns the latest log entries
 *
 * @route GET /api/admin/logs
 * @query {number} limit - Number of lines to return (default: 200, max: 2000)
 * @returns {Object} JSON with lines array
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 2000);
    const logFilePath = process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs/app.log');

    if (!fs.existsSync(logFilePath)) {
      return res.json({ success: true, logs: [], message: 'Log file not found or empty' });
    }

    const content = fs.readFileSync(logFilePath, 'utf8');
    const allLines = content.trim().split(/\r?\n/);
    const lines = allLines.slice(-limit);

    // Log admin access
    logger.logUserAction(req.userId, 'VIEW_LOGS', { linesReturned: lines.length }, req.ip);

    return res.json({ success: true, logs: lines });
  } catch (error) {
    logger.error('Read logs error:', error);
    return res.status(500).json({ success: false, message: req.t('errors.serverError') || 'Internal server error' });
  }
});

/**
 * Delete all application logs
 * Clears the external log file (admin-only)
 *
 * @route DELETE /api/admin/logs
 * @returns {Object} Success response
 */
router.delete('/logs', async (req, res) => {
  try {
    const logFilePath = process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs/app.log');

    // Check if log file exists
    if (fs.existsSync(logFilePath)) {
      // Clear the log file by writing an empty string
      fs.writeFileSync(logFilePath, '');
    }

    // Log admin action
    logger.logUserAction(req.userId, 'DELETE_ALL_LOGS', {}, req.ip);

    return res.json({
      success: true,
      message: req.t('admin.logsDeleted') || 'All logs have been deleted successfully'
    });
  } catch (error) {
    logger.error('Delete logs error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('errors.serverError') || 'Internal server error'
    });
  }
});

module.exports = router;
