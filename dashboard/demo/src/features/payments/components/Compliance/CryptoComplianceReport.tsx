// Crypto Compliance Report Component
// Displays pending crypto FINTRAC reports (VCTR, LVCTR, STR) with comprehensive filtering and actions

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  Send as SubmitIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

import { cryptoFintracService } from '../../services/cryptoFintracService';
import { fintracReportingService } from '../../../../services/fintracReportingService';
import { VCTRReport, LVCTRReport, CryptoSTRReport } from '../../../../models/fintracModels';

type CryptoReport = VCTRReport | LVCTRReport | CryptoSTRReport;

interface ReportFilters {
  reportType: 'all' | 'VCTR' | 'LVCTR' | 'STR';
  status: 'all' | 'draft' | 'submitted' | 'acknowledged' | 'rejected';
  cryptocurrency: 'all' | 'BTC' | 'ETH' | 'SOL' | 'AVAX' | 'USDC';
  dateFrom: string;
  dateTo: string;
  minAmount: number | '';
  maxAmount: number | '';
}

const CryptoComplianceReport: React.FC = () => {
  const [reports, setReports] = useState<CryptoReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CryptoReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'all',
    status: 'all',
    cryptocurrency: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [submittingReports, setSubmittingReports] = useState<Set<string>>(new Set());

  // Load crypto reports
  const loadReports = async () => {
    setLoading(true);
    try {
      const pendingReports = await cryptoFintracService.getPendingCryptoReports();
      setReports(pendingReports);
    } catch (error) {
      console.error('Error loading crypto reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filter reports based on criteria
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Report type filter
      if (filters.reportType !== 'all' && report.reportType !== filters.reportType) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && report.submissionStatus !== filters.status) {
        return false;
      }

      // Cryptocurrency filter
      if (filters.cryptocurrency !== 'all' && report.virtualCurrencyType !== filters.cryptocurrency) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && report.submissionDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && report.submissionDate > filters.dateTo) {
        return false;
      }

      // Amount range filter
      if (filters.minAmount !== '' && report.cadEquivalent < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== '' && report.cadEquivalent > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [reports, filters]);

  // Calculate compliance metrics
  const metrics = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => r.submissionStatus === 'draft').length;
    const submitted = reports.filter(r => r.submissionStatus === 'submitted').length;
    const overdue = reports.filter(r => {
      const deadline = new Date(r.submissionDate);
      deadline.setDate(deadline.getDate() + 15); // 15-day deadline
      return deadline < new Date() && r.submissionStatus === 'draft';
    }).length;

    const totalValue = reports.reduce((sum, r) => sum + r.cadEquivalent, 0);

    return {
      total,
      pending,
      submitted,
      overdue,
      totalValue,
      complianceRate: total > 0 ? Math.round((submitted / total) * 100) : 100
    };
  }, [reports]);

  // Submit report to FINTRAC
  const handleSubmitReport = async (report: CryptoReport) => {
    setSubmittingReports(prev => new Set(prev).add(report.id));

    try {
      let result;

      if (report.reportType === 'VCTR') {
        result = await fintracReportingService.submitVCTRReport(report as VCTRReport);
      } else if (report.reportType === 'LVCTR') {
        result = await fintracReportingService.submitLVCTRReport(report as LVCTRReport);
      } else {
        result = await cryptoFintracService.submitCryptoReport(report);
      }

      if (result) {
        await loadReports();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setSubmittingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(report.id);
        return newSet;
      });
    }
  };

  // Export reports
  const handleExportReports = async () => {
    try {
      const reportIds = filteredReports.map(r => r.id);
      const exportData = await cryptoFintracService.exportCryptoReports(reportIds);

      // Create download links for each format
      const formats = ['xml', 'json', 'csv'];
      formats.forEach(format => {
        const content = exportData[format as keyof typeof exportData];
        const blob = new Blob([content], {
          type: format === 'xml' ? 'text/xml' : format === 'json' ? 'application/json' : 'text/csv'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crypto_fintrac_reports_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error exporting reports:', error);
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'warning', icon: <ScheduleIcon fontSize="small" />, label: 'Pending' };
      case 'submitted':
        return { color: 'info', icon: <CheckCircleIcon fontSize="small" />, label: 'Submitted' };
      case 'acknowledged':
        return { color: 'success', icon: <CheckCircleIcon fontSize="small" />, label: 'Acknowledged' };
      case 'rejected':
        return { color: 'error', icon: <ErrorIcon fontSize="small" />, label: 'Rejected' };
      default:
        return { color: 'default', icon: <ScheduleIcon fontSize="small" />, label: status };
    }
  };

  // Get report type color
  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'VCTR': return 'primary';
      case 'LVCTR': return 'warning';
      case 'STR': return 'error';
      default: return 'default';
    }
  };

  // Check if report is overdue
  const isOverdue = (report: CryptoReport) => {
    const deadline = new Date(report.submissionDate);
    deadline.setDate(deadline.getDate() + 15);
    return deadline < new Date() && report.submissionStatus === 'draft';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  // Format crypto amount
  const formatCrypto = (amount: number, type: string) => {
    return `${amount.toFixed(8)} ${type}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Crypto FINTRAC Compliance Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Virtual Currency Transaction Reports (VCTR), Large Virtual Currency Transaction Reports (LVCTR), and Suspicious Transaction Reports (STR)
        </Typography>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Reports</Typography>
              <Typography variant="h4">{metrics.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending Submission</Typography>
              <Typography variant="h4" color="warning.main">
                <Badge badgeContent={metrics.overdue} color="error">
                  {metrics.pending}
                </Badge>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Compliance Rate</Typography>
              <Typography variant="h4" color="success.main">{metrics.complianceRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom">Total Value</Typography>
              <Typography variant="h4">{formatCurrency(metrics.totalValue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {metrics.overdue > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Overdue Reports</AlertTitle>
          {metrics.overdue} report{metrics.overdue > 1 ? 's' : ''} past the 15-day submission deadline.
          Immediate action required to maintain FINTRAC compliance.
        </Alert>
      )}

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadReports}
          disabled={loading}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={handleExportReports}
          disabled={filteredReports.length === 0}
        >
          Export Reports
        </Button>
      </Box>

      {/* Filters Panel */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Filter Reports</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={filters.reportType}
                    label="Report Type"
                    onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value as any }))}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="VCTR">VCTR</MenuItem>
                    <MenuItem value="LVCTR">LVCTR</MenuItem>
                    <MenuItem value="STR">STR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="draft">Pending</MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="acknowledged">Acknowledged</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cryptocurrency</InputLabel>
                  <Select
                    value={filters.cryptocurrency}
                    label="Cryptocurrency"
                    onChange={(e) => setFilters(prev => ({ ...prev, cryptocurrency: e.target.value as any }))}
                  >
                    <MenuItem value="all">All Cryptos</MenuItem>
                    <MenuItem value="BTC">Bitcoin</MenuItem>
                    <MenuItem value="ETH">Ethereum</MenuItem>
                    <MenuItem value="SOL">Solana</MenuItem>
                    <MenuItem value="AVAX">Avalanche</MenuItem>
                    <MenuItem value="USDC">USD Coin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Min Amount (CAD)"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value ? Number(e.target.value) : '' }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Max Amount (CAD)"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value ? Number(e.target.value) : '' }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setFilters({
                    reportType: 'all',
                    status: 'all',
                    cryptocurrency: 'all',
                    dateFrom: '',
                    dateTo: '',
                    minAmount: '',
                    maxAmount: ''
                  })}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Reports Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Crypto Reports ({filteredReports.length})
          </Typography>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Type</TableCell>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Cryptocurrency</TableCell>
                  <TableCell>Crypto Amount</TableCell>
                  <TableCell>CAD Equivalent</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submission Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => {
                  const statusDisplay = getStatusDisplay(report.submissionStatus);
                  const overdue = isOverdue(report);
                  const isSubmitting = submittingReports.has(report.id);

                  return (
                    <TableRow key={report.id} sx={{ backgroundColor: overdue ? 'error.light' : 'inherit' }}>
                      <TableCell>
                        <Chip
                          label={report.reportType}
                          color={getReportTypeColor(report.reportType) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {report.transactionId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {report.virtualCurrencyType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {formatCrypto(report.virtualCurrencyAmount, report.virtualCurrencyType)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(report.cadEquivalent)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {report.conductor?.personInfo?.firstName} {report.conductor?.personInfo?.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={statusDisplay.icon}
                            label={statusDisplay.label}
                            color={statusDisplay.color as any}
                            size="small"
                          />
                          {overdue && (
                            <Tooltip title="Past submission deadline">
                              <WarningIcon color="error" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(report.submissionDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowDetails(true);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {report.submissionStatus === 'draft' && (
                            <Tooltip title="Submit to FINTRAC">
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={isSubmitting}
                                onClick={() => handleSubmitReport(report)}
                              >
                                <SubmitIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredReports.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No crypto reports found matching the current filters.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Report Details - {selectedReport?.reportType} {selectedReport?.reportReference}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Transaction Information</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                <Typography variant="body1" fontFamily="monospace">{selectedReport.transactionId}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Transaction Hash</Typography>
                <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {selectedReport.transactionHash}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Cryptocurrency</Typography>
                <Typography variant="body1">{selectedReport.virtualCurrencyType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="body1">
                  {formatCrypto(selectedReport.virtualCurrencyAmount, selectedReport.virtualCurrencyType)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">CAD Equivalent</Typography>
                <Typography variant="body1">{formatCurrency(selectedReport.cadEquivalent)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Exchange Rate</Typography>
                <Typography variant="body1">{formatCurrency(selectedReport.exchangeRate)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Receiver Wallet</Typography>
                <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {selectedReport.receiverWalletAddress}
                </Typography>
              </Grid>
              {selectedReport.senderWalletAddress && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Sender Wallet</Typography>
                  <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                    {selectedReport.senderWalletAddress}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Compliance Information</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Risk Score</Typography>
                <Typography variant="body1">{selectedReport.riskScore}/100</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Suspicious Activity</Typography>
                <Typography variant="body1">{selectedReport.suspicious ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Risk Factors</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {selectedReport.riskFactors.map((factor, index) => (
                    <Chip key={index} label={factor} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          {selectedReport?.submissionStatus === 'draft' && (
            <Button
              variant="contained"
              onClick={() => {
                if (selectedReport) {
                  handleSubmitReport(selectedReport);
                  setShowDetails(false);
                }
              }}
            >
              Submit to FINTRAC
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CryptoComplianceReport;