// Compliance Alerts Component
// Real-time monitoring and alerting for crypto FINTRAC compliance issues
// Displays pending submissions, overdue reports, and regulatory alerts

import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Badge,
  Divider,
  Collapse,
  Grid,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as ViewIcon,
  Send as SubmitIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  NotificationsActive as AlertsIcon
} from '@mui/icons-material';

import { cryptoFintracService } from '../../services/cryptoFintracService';
import { fintracReportingService } from '../../../../services/fintracReportingService';
import { VCTRReport, LVCTRReport, CryptoSTRReport } from '../../../../models/fintracModels';

interface ComplianceAlert {
  id: string;
  type: 'overdue' | 'deadline_warning' | 'suspicious_activity' | 'large_transaction' | 'system_alert' | 'regulatory_update';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  relatedReports?: string[];
  actionRequired: boolean;
  deadline?: string;
  createdAt: string;
  acknowledged: boolean;
}

interface ComplianceMetrics {
  pendingReports: number;
  overdueReports: number;
  todayDeadlines: number;
  weekDeadlines: number;
  suspiciousTransactions: number;
  largeTransactions: number;
  complianceScore: number;
}

const ComplianceAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    pendingReports: 0,
    overdueReports: 0,
    todayDeadlines: 0,
    weekDeadlines: 0,
    suspiciousTransactions: 0,
    largeTransactions: 0,
    complianceScore: 100
  });
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [reports, setReports] = useState<Array<VCTRReport | LVCTRReport | CryptoSTRReport>>([]);

  // Load compliance data
  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Load pending crypto reports
      const pendingReports = await cryptoFintracService.getPendingCryptoReports();
      setReports(pendingReports);

      // Generate alerts and metrics
      const generatedAlerts = generateAlerts(pendingReports);
      const calculatedMetrics = calculateMetrics(pendingReports);

      setAlerts(generatedAlerts);
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceData();

    // Set up periodic refresh every 5 minutes
    const interval = setInterval(loadComplianceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate alerts based on current reports
  const generateAlerts = (reports: Array<VCTRReport | LVCTRReport | CryptoSTRReport>): ComplianceAlert[] => {
    const alerts: ComplianceAlert[] = [];
    const now = new Date();

    // Check for overdue reports
    const overdueReports = reports.filter(report => {
      const deadline = new Date(report.submissionDate);
      deadline.setDate(deadline.getDate() + 15); // 15-day deadline
      return deadline < now && report.submissionStatus === 'draft';
    });

    if (overdueReports.length > 0) {
      alerts.push({
        id: 'overdue-reports',
        type: 'overdue',
        severity: 'critical',
        title: `${overdueReports.length} Overdue FINTRAC Report${overdueReports.length > 1 ? 's' : ''}`,
        description: `Reports past the 15-day submission deadline. Immediate action required to maintain compliance.`,
        relatedReports: overdueReports.map(r => r.id),
        actionRequired: true,
        createdAt: now.toISOString(),
        acknowledged: false
      });
    }

    // Check for reports due today
    const todayDeadlines = reports.filter(report => {
      const deadline = new Date(report.submissionDate);
      deadline.setDate(deadline.getDate() + 15);
      const today = new Date();
      return deadline.toDateString() === today.toDateString() && report.submissionStatus === 'draft';
    });

    if (todayDeadlines.length > 0) {
      alerts.push({
        id: 'today-deadlines',
        type: 'deadline_warning',
        severity: 'high',
        title: `${todayDeadlines.length} Report${todayDeadlines.length > 1 ? 's' : ''} Due Today`,
        description: `FINTRAC submission deadline is today. Submit immediately to avoid compliance violation.`,
        relatedReports: todayDeadlines.map(r => r.id),
        actionRequired: true,
        deadline: new Date().toISOString().split('T')[0],
        createdAt: now.toISOString(),
        acknowledged: false
      });
    }

    // Check for reports due this week
    const weekDeadlines = reports.filter(report => {
      const deadline = new Date(report.submissionDate);
      deadline.setDate(deadline.getDate() + 15);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return deadline <= weekFromNow && deadline > now && report.submissionStatus === 'draft';
    });

    if (weekDeadlines.length > 0) {
      alerts.push({
        id: 'week-deadlines',
        type: 'deadline_warning',
        severity: 'medium',
        title: `${weekDeadlines.length} Report${weekDeadlines.length > 1 ? 's' : ''} Due This Week`,
        description: `Reports approaching FINTRAC submission deadline. Plan submission to ensure compliance.`,
        relatedReports: weekDeadlines.map(r => r.id),
        actionRequired: true,
        createdAt: now.toISOString(),
        acknowledged: false
      });
    }

    // Check for suspicious transactions
    const suspiciousReports = reports.filter(report => report.suspicious || report.reportType === 'STR');
    if (suspiciousReports.length > 0) {
      alerts.push({
        id: 'suspicious-activity',
        type: 'suspicious_activity',
        severity: 'high',
        title: `${suspiciousReports.length} Suspicious Transaction${suspiciousReports.length > 1 ? 's' : ''} Detected`,
        description: `Cryptocurrency transactions flagged for suspicious activity. Review and submit STR as required.`,
        relatedReports: suspiciousReports.map(r => r.id),
        actionRequired: true,
        createdAt: now.toISOString(),
        acknowledged: false
      });
    }

    // Check for large transactions
    const largeTransactions = reports.filter(report =>
      report.cadEquivalent >= 10000 && report.reportType === 'LVCTR'
    );
    if (largeTransactions.length > 0) {
      alerts.push({
        id: 'large-transactions',
        type: 'large_transaction',
        severity: 'medium',
        title: `${largeTransactions.length} Large Virtual Currency Transaction${largeTransactions.length > 1 ? 's' : ''}`,
        description: `Transactions ≥ $10,000 CAD requiring LVCTR submission. Ensure enhanced customer due diligence.`,
        relatedReports: largeTransactions.map(r => r.id),
        actionRequired: true,
        createdAt: now.toISOString(),
        acknowledged: false
      });
    }

    // System compliance alert
    const totalPending = reports.filter(r => r.submissionStatus === 'draft').length;
    if (totalPending > 10) {
      alerts.push({
        id: 'high-pending-volume',
        type: 'system_alert',
        severity: 'medium',
        title: 'High Volume of Pending Reports',
        description: `${totalPending} pending FINTRAC reports. Consider implementing automated submission workflows.`,
        actionRequired: false,
        createdAt: now.toISOString(),
        acknowledged: false
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  // Calculate compliance metrics
  const calculateMetrics = (reports: Array<VCTRReport | LVCTRReport | CryptoSTRReport>): ComplianceMetrics => {
    const now = new Date();

    const pendingReports = reports.filter(r => r.submissionStatus === 'draft').length;

    const overdueReports = reports.filter(report => {
      const deadline = new Date(report.submissionDate);
      deadline.setDate(deadline.getDate() + 15);
      return deadline < now && report.submissionStatus === 'draft';
    }).length;

    const todayDeadlines = reports.filter(report => {
      const deadline = new Date(report.submissionDate);
      deadline.setDate(deadline.getDate() + 15);
      return deadline.toDateString() === now.toDateString() && report.submissionStatus === 'draft';
    }).length;

    const weekDeadlines = reports.filter(report => {
      const deadline = new Date(report.submissionDate);
      deadline.setDate(deadline.getDate() + 15);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return deadline <= weekFromNow && deadline > now && report.submissionStatus === 'draft';
    }).length;

    const suspiciousTransactions = reports.filter(r => r.suspicious || r.reportType === 'STR').length;
    const largeTransactions = reports.filter(r => r.cadEquivalent >= 10000).length;

    // Calculate compliance score (100 - penalties)
    let complianceScore = 100;
    complianceScore -= overdueReports * 10; // -10 per overdue report
    complianceScore -= todayDeadlines * 5; // -5 per deadline today
    complianceScore -= suspiciousTransactions * 2; // -2 per suspicious transaction
    complianceScore = Math.max(0, complianceScore);

    return {
      pendingReports,
      overdueReports,
      todayDeadlines,
      weekDeadlines,
      suspiciousTransactions,
      largeTransactions,
      complianceScore
    };
  };

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Handle alert expansion
  const toggleAlertExpansion = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  // Get alert severity color
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue': return <ErrorIcon />;
      case 'deadline_warning': return <ScheduleIcon />;
      case 'suspicious_activity': return <SecurityIcon />;
      case 'large_transaction': return <TrendingUpIcon />;
      case 'system_alert': return <WarningIcon />;
      case 'regulatory_update': return <GavelIcon />;
      default: return <AlertsIcon />;
    }
  };

  // Count unacknowledged alerts by severity
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.acknowledged).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Compliance Monitoring
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadComplianceData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Compliance Score Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon
                  sx={{
                    fontSize: 40,
                    color: metrics.complianceScore >= 90 ? 'success.main' :
                           metrics.complianceScore >= 70 ? 'warning.main' : 'error.main'
                  }}
                />
                <Box>
                  <Typography variant="h4">
                    {metrics.complianceScore}%
                  </Typography>
                  <Typography color="text.secondary">
                    Compliance Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Stats</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h6" color="warning.main">{metrics.pendingReports}</Typography>
                  <Typography variant="body2">Pending Reports</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h6" color="error.main">{metrics.overdueReports}</Typography>
                  <Typography variant="body2">Overdue</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h6" color="warning.main">{metrics.todayDeadlines}</Typography>
                  <Typography variant="body2">Due Today</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="h6" color="error.main">{metrics.suspiciousTransactions}</Typography>
                  <Typography variant="body2">Suspicious</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Alerts Banner */}
      {criticalAlerts > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Critical Compliance Issues</AlertTitle>
          {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} require immediate attention.
          Failure to address may result in regulatory violations.
        </Alert>
      )}

      {/* High Priority Alerts Banner */}
      {highAlerts > 0 && criticalAlerts === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>High Priority Alerts</AlertTitle>
          {highAlerts} high priority alert{highAlerts > 1 ? 's' : ''} need your attention.
        </Alert>
      )}

      {/* Alerts List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Alerts ({alerts.filter(a => !a.acknowledged).length})
          </Typography>

          {alerts.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="success.main">
                All Clear!
              </Typography>
              <Typography color="text.secondary">
                No compliance alerts at this time.
              </Typography>
            </Box>
          )}

          <List>
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    opacity: alert.acknowledged ? 0.6 : 1,
                    bgcolor: alert.acknowledged ? 'action.hover' : 'inherit'
                  }}
                >
                  <ListItemIcon>
                    <Badge
                      color={getAlertSeverityColor(alert.severity) as any}
                      variant="dot"
                      invisible={alert.acknowledged}
                    >
                      {getAlertIcon(alert.type)}
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {alert.title}
                        </Typography>
                        <Chip
                          label={alert.severity.toUpperCase()}
                          size="small"
                          color={getAlertSeverityColor(alert.severity) as any}
                        />
                        {alert.acknowledged && (
                          <Chip label="ACKNOWLEDGED" size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {alert.description}
                        </Typography>
                        {alert.deadline && (
                          <Typography variant="caption" color="error">
                            Deadline: {new Date(alert.deadline).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {alert.relatedReports && alert.relatedReports.length > 0 && (
                        <Tooltip title="View Related Reports">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setShowAlertDetails(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => toggleAlertExpansion(alert.id)}
                      >
                        {expandedAlerts.has(alert.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      {!alert.acknowledged && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>

                <Collapse in={expandedAlerts.has(alert.id)}>
                  <Box sx={{ pl: 9, pr: 2, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Created: {new Date(alert.createdAt).toLocaleString()}
                    </Typography>
                    {alert.relatedReports && (
                      <Typography variant="body2" color="text.secondary">
                        Related Reports: {alert.relatedReports.length}
                      </Typography>
                    )}
                    {alert.actionRequired && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Action Required: This alert needs your immediate attention.
                      </Alert>
                    )}
                  </Box>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog
        open={showAlertDetails}
        onClose={() => setShowAlertDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Alert Details: {selectedAlert?.title}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedAlert.description}
              </Typography>

              {selectedAlert.relatedReports && selectedAlert.relatedReports.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Related Reports ({selectedAlert.relatedReports.length})
                  </Typography>
                  <List dense>
                    {selectedAlert.relatedReports.map(reportId => {
                      const report = reports.find(r => r.id === reportId);
                      return report ? (
                        <ListItem key={reportId}>
                          <ListItemText
                            primary={`${report.reportType} - ${report.transactionId}`}
                            secondary={`${report.virtualCurrencyType} • ${new Intl.NumberFormat('en-CA', {
                              style: 'currency',
                              currency: 'CAD'
                            }).format(report.cadEquivalent)}`}
                          />
                        </ListItem>
                      ) : null;
                    })}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlertDetails(false)}>
            Close
          </Button>
          {selectedAlert && !selectedAlert.acknowledged && (
            <Button
              variant="contained"
              onClick={() => {
                handleAcknowledgeAlert(selectedAlert.id);
                setShowAlertDetails(false);
              }}
            >
              Acknowledge Alert
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceAlerts;