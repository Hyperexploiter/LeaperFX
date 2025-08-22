# FINTRAC Compliance System Documentation

## Overview

The FINTRAC Compliance System is an integrated component of the Leaper-Fx Store Owner Dashboard that helps ensure compliance with FINTRAC (Financial Transactions and Reports Analysis Centre of Canada) regulations for Money Services Businesses (MSBs).

This system automates and streamlines the process of collecting customer information, assessing transaction risks, and submitting required reports to FINTRAC.

## Key Features

### 1. Transaction Queue Management

- **Locked Transactions**: Transactions requiring FINTRAC compliance are locked until customer information is provided
- **Status Tracking**: Track the status of transactions (locked, completed, submitted)
- **Deadline Management**: Automatic calculation of LCTR submission deadlines (15 days from transaction)

### 2. Customer Information Collection

- **QR Code Generation**: Generate QR codes that customers can scan to fill out their information on their own device
- **Manual Entry**: Option for store owners to manually enter customer information
- **FINTRAC-Compliant Forms**: Collect all required information for FINTRAC compliance:
  - Personal information (name, DOB, occupation)
  - Address information (street, city, province, postal code)
  - Identification (ID type, number, expiry)
  - Transaction details (third-party determination, source of funds)

### 3. Risk Assessment

- **Automated Risk Calculation**: Calculate risk scores based on FINTRAC guidelines:
  - Transaction amount risk (0-3 points)
  - Customer occupation risk (0-3 points)
  - Geographic risk (0-2 points)
  - Third-party activity risk (0-2 points)
  - Source of funds risk (0-2 points)
  - Transaction behavior risk (0-2 points)
- **Risk Rating**: Categorize transactions as LOW, MEDIUM, or HIGH risk
- **Required Actions**: Automatically determine required actions based on risk score:
  - Enhanced due diligence for scores ≥ 6
  - Ongoing monitoring for scores ≥ 4
  - Senior approval for scores ≥ 8

### 4. LCTR Reporting

- **Automatic Detection**: Identify transactions that require LCTR (≥ $10,000)
- **Batch Submission**: Generate and submit LCTR reports for multiple transactions
- **Report Tracking**: Track the status of LCTR reports (draft, submitted, acknowledged, rejected)
- **Submission History**: View history of submitted reports

### 5. Compliance Notifications

- **Deadline Warnings**: Receive notifications for approaching LCTR deadlines
- **Risk Alerts**: Get alerts for high-risk transactions
- **Notification Management**: View, acknowledge, and resolve notifications

## How to Use

### Accessing the FINTRAC Compliance System

1. Log in to the Store Owner Dashboard
2. Click on the "FINTRAC Compliance" tab in the sidebar navigation

### Managing Transactions

1. **View Transaction Queue**: See all transactions that require FINTRAC compliance
2. **Generate QR Code**: Click the "Generate QR" button to create a QR code for customer information collection
3. **Enter Customer Information**: Click the "Enter Info" button to manually enter customer information
4. **View Risk Assessment**: After customer information is provided, view the risk assessment results
5. **Submit LCTR Reports**: Click the "Submit to FINTRAC" button to submit LCTR reports for completed transactions

### Handling Notifications

1. **View Notifications**: See all active notifications at the top of the FINTRAC Compliance tab
2. **Dismiss Notifications**: Click the "Dismiss" button to acknowledge and dismiss notifications
3. **View Details**: Click the "View Details" button to see more information about a notification

## Compliance Requirements

### Large Cash Transaction Reports (LCTR)

- **Required for**: Transactions ≥ CAD $10,000
- **Deadline**: Must be submitted within 15 days of the transaction
- **Information Required**: 
  - Customer personal information
  - Customer address
  - Customer identification
  - Transaction details
  - Source of funds
  - Third-party determination

### Enhanced Record Keeping

- **Required for**: Transactions ≥ CAD $3,000
- **Information Required**:
  - Customer personal information
  - Customer address
  - Customer identification

### 24-Hour Rule

- **Requirement**: Multiple transactions totaling ≥ CAD $10,000 within 24 hours must be reported as a single transaction
- **Implementation**: The system automatically aggregates transactions from the same customer within 24 hours

### Record Retention

- **Requirement**: All records must be kept for 5 years
- **Implementation**: The system automatically calculates retention dates (5 years from transaction/submission)

## Data Models

### Transaction

Extended with FINTRAC compliance fields:
- `status`: 'locked' | 'completed' | 'submitted'
- `customerId`: Reference to customer data
- `requiresLCTR`: Whether LCTR is required (≥$10,000)
- `requiresEnhancedRecords`: Whether enhanced records are required (≥$3,000)
- `lctrDeadline`: Deadline for LCTR submission (15 days from transaction)
- `riskScore`: Risk assessment score
- `riskRating`: 'LOW' | 'MEDIUM' | 'HIGH'
- `riskFactors`: Risk factors identified
- `requiresEnhancedDueDiligence`: Whether enhanced due diligence is required
- `requiresOngoingMonitoring`: Whether ongoing monitoring is required
- `reportSubmitted`: Whether LCTR report has been submitted
- `reportId`: Reference to LCTR report
- `reportSubmissionDate`: Date of report submission

### Customer

- **Personal Information**: firstName, lastName, dateOfBirth, occupation
- **Address Information**: streetAddress, city, province, postalCode, country
- **Identification**: idType, idNumber, idExpiry
- **Risk Factors**: actingForThirdParty, sourceOfFunds, etc.
- **Risk Assessment**: currentRiskRating, riskFactors, etc.
- **Transaction History**: totalTransactionCount, totalTransactionVolume, etc.
- **Metadata**: createdAt, updatedAt, retentionDate

### Risk Assessment

- **Risk Calculation**: riskScore, riskRating, riskFactors
- **Risk Components**: amountRisk, occupationRisk, geographicRisk, etc.
- **Required Actions**: requiresEnhancedDueDiligence, requiresOngoingMonitoring, etc.
- **Metadata**: assessmentDate, assessmentMethod, etc.

### LCTR Report

- **Report Content**: transactionIds, totalTransactionCount, totalAmount, etc.
- **Submission Details**: submissionStatus, submissionDate, submissionMethod, etc.
- **Deadlines**: originalDeadline, submissionDeadline
- **Metadata**: preparedBy, reviewedBy, createdAt, updatedAt, retentionDate

## Services

### Customer Service

- `getCustomers()`: Get all customers
- `getCustomerById(id)`: Get customer by ID
- `createCustomer(customerData)`: Create new customer
- `updateCustomer(id, customerData)`: Update customer
- `getCustomerByTransactionId(transactionId)`: Get customer by transaction ID
- `associateCustomerWithTransaction(customerId, transactionId)`: Associate customer with transaction

### Risk Assessment Service

- `calculateRiskScore(customerData, transactionData)`: Calculate risk score
- `getRiskAssessmentById(id)`: Get risk assessment by ID
- `getRiskAssessmentsByCustomerId(customerId)`: Get risk assessments by customer ID
- `getRiskAssessmentByTransactionId(transactionId)`: Get risk assessment by transaction ID
- `getHighRiskAssessments()`: Get high risk assessments
- `updateRiskAssessment(id, data)`: Update risk assessment

### Compliance Notification Service

- `getNotifications()`: Get all notifications
- `getActiveNotifications()`: Get active notifications
- `createNotification(notification)`: Create notification
- `updateNotificationStatus(id, status)`: Update notification status
- `checkDeadlines(transactions)`: Check for LCTR deadlines and create notifications
- `createRiskAlert(transactionId, riskRating, riskScore)`: Create risk alert notification
- `dismissAllNotifications()`: Dismiss all notifications

### LCTR Report Service

- `getReports()`: Get all reports
- `getReportById(id)`: Get report by ID
- `createReport(reportData)`: Create report
- `updateReport(id, reportData)`: Update report
- `generateLCTRBatch(transactionIds, transactions)`: Generate LCTR batch for multiple transactions
- `submitToFINTRAC(reportId)`: Submit report to FINTRAC
- `getPendingReports()`: Get pending LCTR reports
- `getSubmittedReports()`: Get submitted LCTR reports

## Integration with Existing Systems

The FINTRAC Compliance System is integrated with the existing transaction system:

1. When a transaction is created in the Smart Calculator, it's checked for FINTRAC compliance requirements
2. If the transaction requires FINTRAC compliance, it's added to the compliance queue with a 'locked' status
3. After customer information is collected and risk assessment is performed, the transaction status is updated to 'completed'
4. When an LCTR report is submitted, the transaction status is updated to 'submitted'

## Future Enhancements

1. **Direct API Integration with FINTRAC**: Implement direct API integration with FINTRAC for automated report submission
2. **Enhanced Risk Assessment**: Add more risk factors and improve risk calculation algorithm
3. **Customer Verification**: Add ID verification features (document scanning, facial recognition)
4. **Suspicious Transaction Reporting**: Add support for Suspicious Transaction Reports (STRs)
5. **Compliance Dashboard**: Add a dashboard with compliance metrics and analytics