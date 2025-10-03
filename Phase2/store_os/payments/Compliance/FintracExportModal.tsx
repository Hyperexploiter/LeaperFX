// FINTRAC Export Modal Component
// Provides export functionality for FINTRAC submissions in multiple formats (XML, JSON, CSV)
// Supports batch export and compliance audit trail generation

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  AlertTitle,
  Divider,
  LinearProgress,
  Chip,
  Tooltip
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Description as XmlIcon,
  Code as JsonIcon,
  TableChart as CsvIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import { cryptoFintracService } from '../../services/cryptoFintracService';
import { fintracReportingService } from '../../../../services/fintracReportingService';
import { VCTRReport, LVCTRReport, CryptoSTRReport } from '../../../../models/fintracModels';

interface FintracExportModalProps {
  open: boolean;
  onClose: () => void;
  selectedReportIds?: string[];
  reportType?: 'all' | 'VCTR' | 'LVCTR' | 'STR';
}

type ExportFormat = 'xml' | 'json' | 'csv' | 'all';
type ExportScope = 'selected' | 'filtered' | 'all_pending' | 'date_range';

interface ExportSettings {
  format: ExportFormat;
  scope: ExportScope;
  includeCustomerData: boolean;
  includeAuditTrail: boolean;
  dateFrom: string;
  dateTo: string;
  password: string;
  compressOutput: boolean;
}

interface PreviewData {
  reportCount: number;
  totalAmount: number;
  cryptocurrencies: string[];
  dateRange: {
    earliest: string;
    latest: string;
  };
  reportTypes: { [key: string]: number };
}

const FintracExportModal: React.FC<FintracExportModalProps> = ({
  open,
  onClose,
  selectedReportIds = [],
  reportType = 'all'
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'xml',
    scope: selectedReportIds.length > 0 ? 'selected' : 'all_pending',
    includeCustomerData: true,
    includeAuditTrail: true,
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    dateTo: new Date().toISOString().split('T')[0],
    password: '',
    compressOutput: true
  });

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [availableReports, setAvailableReports] = useState<Array<VCTRReport | LVCTRReport | CryptoSTRReport>>([]);
  const [error, setError] = useState<string | null>(null);

  // Load available reports for preview
  useEffect(() => {
    if (open) {
      loadAvailableReports();
    }
  }, [open, settings.scope, settings.dateFrom, settings.dateTo, reportType]);

  const loadAvailableReports = async () => {
    setLoading(true);
    setError(null);

    try {
      let reports: Array<VCTRReport | LVCTRReport | CryptoSTRReport> = [];

      if (settings.scope === 'selected' && selectedReportIds.length > 0) {
        const allReports = await cryptoFintracService.getPendingCryptoReports();
        reports = allReports.filter(report => selectedReportIds.includes(report.id));
      } else if (settings.scope === 'date_range') {
        // In a real implementation, this would fetch reports by date range
        const allReports = await cryptoFintracService.getPendingCryptoReports();
        reports = allReports.filter(report => {
          return report.submissionDate >= settings.dateFrom &&
                 report.submissionDate <= settings.dateTo;
        });
      } else {
        reports = await cryptoFintracService.getPendingCryptoReports();
      }

      // Filter by report type if specified
      if (reportType !== 'all') {
        reports = reports.filter(report => report.reportType === reportType);
      }

      setAvailableReports(reports);
      generatePreviewData(reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewData = (reports: Array<VCTRReport | LVCTRReport | CryptoSTRReport>) => {
    if (reports.length === 0) {
      setPreviewData(null);
      return;
    }

    const totalAmount = reports.reduce((sum, report) => sum + report.cadEquivalent, 0);
    const cryptocurrencies = Array.from(new Set(reports.map(report => report.virtualCurrencyType)));

    const dates = reports.map(report => new Date(report.submissionDate));
    const earliest = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
    const latest = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];

    const reportTypes = reports.reduce((acc, report) => {
      acc[report.reportType] = (acc[report.reportType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    setPreviewData({
      reportCount: reports.length,
      totalAmount,
      cryptocurrencies,
      dateRange: { earliest, latest },
      reportTypes
    });
  };

  const handleExport = async () => {
    if (!previewData || previewData.reportCount === 0) {
      setError('No reports available for export');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const reportIds = availableReports.map(report => report.id);

      let exportData: { xml: string; json: string; csv: string };

      if (settings.scope === 'selected' || settings.scope === 'filtered' || settings.scope === 'date_range') {
        exportData = await cryptoFintracService.exportCryptoReports(reportIds);
      } else {
        // Export all pending reports
        exportData = await cryptoFintracService.exportCryptoReports(reportIds);
      }

      // Add audit trail if requested
      if (settings.includeAuditTrail) {
        const auditData = await fintracReportingService.exportCryptoAuditRecords(
          settings.dateFrom,
          settings.dateTo
        );
        exportData.csv += '\n\n--- AUDIT TRAIL ---\n' + auditData;
      }

      // Download files based on format selection
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

      if (settings.format === 'xml' || settings.format === 'all') {
        downloadFile(exportData.xml, `fintrac_crypto_reports_${timestamp}.xml`, 'text/xml');
      }

      if (settings.format === 'json' || settings.format === 'all') {
        downloadFile(exportData.json, `fintrac_crypto_reports_${timestamp}.json`, 'application/json');
      }

      if (settings.format === 'csv' || settings.format === 'all') {
        downloadFile(exportData.csv, `fintrac_crypto_reports_${timestamp}.csv`, 'text/csv');
      }

      // Close modal after successful export
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'xml': return <XmlIcon />;
      case 'json': return <JsonIcon />;
      case 'csv': return <CsvIcon />;
      default: return <DownloadIcon />;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'VCTR': return 'primary';
      case 'LVCTR': return 'warning';
      case 'STR': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          Export FINTRAC Crypto Reports
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Export Settings */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Export Settings</Typography>

            {/* Export Format */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Export Format</FormLabel>
              <RadioGroup
                value={settings.format}
                onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value as ExportFormat }))}
              >
                <FormControlLabel value="xml" control={<Radio />} label="XML (FINTRAC Standard)" />
                <FormControlLabel value="json" control={<Radio />} label="JSON (API Format)" />
                <FormControlLabel value="csv" control={<Radio />} label="CSV (Spreadsheet)" />
                <FormControlLabel value="all" control={<Radio />} label="All Formats" />
              </RadioGroup>
            </FormControl>

            {/* Export Scope */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Export Scope</FormLabel>
              <RadioGroup
                value={settings.scope}
                onChange={(e) => setSettings(prev => ({ ...prev, scope: e.target.value as ExportScope }))}
              >
                {selectedReportIds.length > 0 && (
                  <FormControlLabel
                    value="selected"
                    control={<Radio />}
                    label={`Selected Reports (${selectedReportIds.length})`}
                  />
                )}
                <FormControlLabel value="all_pending" control={<Radio />} label="All Pending Reports" />
                <FormControlLabel value="date_range" control={<Radio />} label="Date Range" />
              </RadioGroup>
            </FormControl>

            {/* Date Range */}
            {settings.scope === 'date_range' && (
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="From Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={settings.dateFrom}
                      onChange={(e) => setSettings(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="To Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={settings.dateTo}
                      onChange={(e) => setSettings(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Export Options */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Export Options</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.includeCustomerData}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeCustomerData: e.target.checked }))}
                  />
                }
                label="Include Customer Data"
              />
              <br />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.includeAuditTrail}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeAuditTrail: e.target.checked }))}
                  />
                }
                label="Include Audit Trail"
              />
              <br />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.compressOutput}
                    onChange={(e) => setSettings(prev => ({ ...prev, compressOutput: e.target.checked }))}
                  />
                }
                label="Compress Output"
              />
            </Box>
          </Grid>

          {/* Preview */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Export Preview</Typography>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Export Error</AlertTitle>
                {error}
              </Alert>
            )}

            {previewData && (
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Reports</Typography>
                      <Typography variant="h6">{previewData.reportCount}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Value</Typography>
                      <Typography variant="h6">{formatCurrency(previewData.totalAmount)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Date Range</Typography>
                      <Typography variant="body1">
                        {previewData.dateRange.earliest} to {previewData.dateRange.latest}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Cryptocurrencies</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {previewData.cryptocurrencies.map(crypto => (
                          <Chip key={crypto} label={crypto} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Report Types</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {Object.entries(previewData.reportTypes).map(([type, count]) => (
                          <Chip
                            key={type}
                            label={`${type}: ${count}`}
                            size="small"
                            color={getReportTypeColor(type) as any}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {previewData && previewData.reportCount === 0 && (
              <Alert severity="info">
                <AlertTitle>No Reports Found</AlertTitle>
                No reports match the current export criteria. Please adjust your settings.
              </Alert>
            )}

            {/* Compliance Notice */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon fontSize="small" />
                  FINTRAC Compliance Notice
                </Box>
              </AlertTitle>
              This export will generate reports in FINTRAC-compliant formats.
              Ensure all customer data is accurate before submission.
              Exported files must be securely transmitted and stored according to FINTRAC requirements.
            </Alert>

            {/* Security Notice */}
            <Alert severity="warning" sx={{ mt: 1 }}>
              <AlertTitle>Security</AlertTitle>
              Exported files contain sensitive customer and transaction data.
              Handle with appropriate security measures and delete after submission.
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={exporting ? <ScheduleIcon /> : getFormatIcon(settings.format)}
          onClick={handleExport}
          disabled={exporting || !previewData || previewData.reportCount === 0}
        >
          {exporting ? 'Exporting...' : `Export ${settings.format.toUpperCase()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FintracExportModal;