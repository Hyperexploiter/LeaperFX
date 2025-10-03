/**
 * Receipt Service - Backend receipt generation and delivery
 * Handles PDF generation, email/SMS sending, and audit trails
 */

import { transactionService } from './transactionService';
import { customerService } from './customerService';
import { emailService } from './emailService';
import type { Transaction } from './transactionService';
import type { Customer } from './customerService';

interface ReceiptDelivery {
  id: string;
  transactionId: string;
  customerId?: string;
  deliveryMethod: 'email' | 'sms' | 'both';
  recipientEmail?: string;
  recipientPhone?: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  deliveredAt?: string;
  failureReason?: string;
  receiptFormat: 'pdf' | 'html';
  messageId?: string;
  auditTrail: DeliveryAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

interface DeliveryAuditEntry {
  timestamp: string;
  action: string;
  status: string;
  details?: string;
}

interface ReceiptContent {
  html: string;
  pdf?: Blob;
  subject: string;
  smsText?: string;
}

class ReceiptService {
  private deliveryQueue: ReceiptDelivery[] = [];
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  /**
   * Send receipt for a transaction
   * Checks for assigned customer first, then prompts for recipient if needed
   */
  async sendReceipt(
    transactionId: string,
    recipientOverride?: { email?: string; phone?: string }
  ): Promise<ReceiptDelivery> {
    try {
      // Get transaction details
      const transaction = await transactionService.getTransaction(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check for assigned customer
      let recipient = recipientOverride;
      let customer: Customer | undefined;

      if (transaction.customerId) {
        customer = await customerService.getCustomer(transaction.customerId);
        if (customer && !recipientOverride) {
          recipient = {
            email: customer.email,
            phone: customer.phone
          };
        }
      }

      if (!recipient?.email && !recipient?.phone) {
        throw new Error('No recipient contact information available');
      }

      // Generate receipt content
      const receiptContent = await this.generateReceiptContent(transaction, customer);

      // Create delivery record
      const delivery: ReceiptDelivery = {
        id: `RCP${Date.now()}`,
        transactionId: transaction.id,
        customerId: customer?.id,
        deliveryMethod: recipient.email && recipient.phone ? 'both' :
                       recipient.email ? 'email' : 'sms',
        recipientEmail: recipient.email,
        recipientPhone: recipient.phone,
        status: 'pending',
        attempts: 0,
        receiptFormat: 'pdf',
        auditTrail: [{
          timestamp: new Date().toISOString(),
          action: 'created',
          status: 'pending',
          details: 'Receipt delivery initiated'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to queue
      this.deliveryQueue.push(delivery);

      // Process delivery
      await this.processDelivery(delivery, receiptContent);

      return delivery;

    } catch (error) {
      console.error('Receipt sending failed:', error);
      throw error;
    }
  }

  /**
   * Generate receipt content in various formats
   */
  private async generateReceiptContent(
    transaction: Transaction,
    customer?: Customer
  ): Promise<ReceiptContent> {
    // Business information
    const businessInfo = {
      name: 'Currency Exchange SAADAT',
      address: 'Montreal, QC, Canada',
      phone: '(514) XXX-XXXX',
      email: 'info@saadatexchange.com',
      website: 'www.saadatexchange.com'
    };

    // Format amounts
    const formatAmount = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: currency
      }).format(amount);
    };

    // Generate HTML receipt
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .business-name { font-size: 24px; font-weight: bold; color: #333; }
          .business-info { font-size: 12px; color: #666; margin-top: 10px; }
          .receipt-title { font-size: 18px; margin: 20px 0; text-align: center; }
          .transaction-info { margin: 20px 0; }
          .info-row { display: flex; justify-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .amounts { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .total { font-size: 18px; font-weight: bold; color: #333; }
          .compliance { margin-top: 20px; padding: 15px; border: 1px solid #ddd; background: #fafafa; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          .warning { color: #d9534f; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="business-name">${businessInfo.name}</div>
          <div class="business-info">
            ${businessInfo.address}<br>
            Tel: ${businessInfo.phone} | Email: ${businessInfo.email}<br>
            ${businessInfo.website}
          </div>
        </div>

        <div class="receipt-title">TRANSACTION RECEIPT</div>

        <div class="transaction-info">
          <div class="info-row">
            <span class="label">Transaction ID:</span>
            <span class="value">${transaction.id}</span>
          </div>
          <div class="info-row">
            <span class="label">Date & Time:</span>
            <span class="value">${new Date(transaction.date).toLocaleString('en-CA')}</span>
          </div>
          ${customer ? `
          <div class="info-row">
            <span class="label">Customer:</span>
            <span class="value">${customer.firstName} ${customer.lastName}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="label">Transaction Type:</span>
            <span class="value">${transaction.type === 'buy' ? 'Currency Purchase' : 'Currency Sale'}</span>
          </div>
          <div class="info-row">
            <span class="label">Payment Method:</span>
            <span class="value">${transaction.paymentMethod || 'Cash'}</span>
          </div>
        </div>

        <div class="amounts">
          <div class="info-row">
            <span class="label">From Currency:</span>
            <span class="value">${formatAmount(transaction.fromAmount, transaction.fromCurrency)}</span>
          </div>
          <div class="info-row">
            <span class="label">Exchange Rate:</span>
            <span class="value">1 ${transaction.fromCurrency} = ${transaction.exchangeRate} ${transaction.toCurrency}</span>
          </div>
          <div class="info-row">
            <span class="label">Service Fee:</span>
            <span class="value">${formatAmount(transaction.fee || 0, transaction.toCurrency)}</span>
          </div>
          <div class="info-row total">
            <span class="label">Total Received:</span>
            <span class="value">${formatAmount(transaction.toAmount, transaction.toCurrency)}</span>
          </div>
        </div>

        ${transaction.fromAmount >= 3000 || transaction.toAmount >= 3000 ? `
        <div class="compliance">
          <div class="warning">FINTRAC COMPLIANCE NOTICE</div>
          <p style="font-size: 12px; margin: 10px 0;">
            This transaction has been recorded in accordance with FINTRAC regulations.
            Customer identification has been verified and will be retained for the required period.
            Transaction Reference: ${transaction.fintracReference || transaction.id}
          </p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is an official receipt. Please retain for your records.</p>
          <p style="font-size: 10px; margin-top: 20px;">
            © ${new Date().getFullYear()} ${businessInfo.name}. All rights reserved.<br>
            MSB Registration: XXXXXXXXX
          </p>
        </div>
      </body>
      </html>
    `;

    // Generate SMS text (shortened version)
    const smsText = `${businessInfo.name}
Receipt #${transaction.id}
${formatAmount(transaction.fromAmount, transaction.fromCurrency)} → ${formatAmount(transaction.toAmount, transaction.toCurrency)}
Rate: ${transaction.exchangeRate}
Thank you for your business!`;

    return {
      html,
      subject: `Transaction Receipt - ${transaction.id}`,
      smsText
    };
  }

  /**
   * Process delivery through appropriate channels
   */
  private async processDelivery(
    delivery: ReceiptDelivery,
    content: ReceiptContent
  ): Promise<void> {
    try {
      delivery.attempts++;

      // Update audit trail
      delivery.auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'delivery_attempt',
        status: 'processing',
        details: `Attempt ${delivery.attempts} of ${this.maxRetries}`
      });

      // Send via email
      if (delivery.recipientEmail && (delivery.deliveryMethod === 'email' || delivery.deliveryMethod === 'both')) {
        await this.sendEmail(delivery, content);
      }

      // Send via SMS
      if (delivery.recipientPhone && (delivery.deliveryMethod === 'sms' || delivery.deliveryMethod === 'both')) {
        await this.sendSMS(delivery, content);
      }

      // Update status
      delivery.status = 'delivered';
      delivery.deliveredAt = new Date().toISOString();
      delivery.auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'delivered',
        status: 'success',
        details: 'Receipt successfully delivered'
      });

      // Store delivery record
      await this.storeDeliveryRecord(delivery);

    } catch (error: any) {
      delivery.failureReason = error.message;

      if (delivery.attempts < this.maxRetries) {
        // Retry with exponential backoff
        delivery.status = 'retrying';
        setTimeout(() => this.processDelivery(delivery, content),
                  this.retryDelay * Math.pow(2, delivery.attempts - 1));
      } else {
        // Max retries reached
        delivery.status = 'failed';
        delivery.auditTrail.push({
          timestamp: new Date().toISOString(),
          action: 'failed',
          status: 'error',
          details: `Delivery failed after ${this.maxRetries} attempts: ${error.message}`
        });
      }

      await this.storeDeliveryRecord(delivery);
    }
  }

  /**
   * Send email with receipt
   */
  private async sendEmail(delivery: ReceiptDelivery, content: ReceiptContent): Promise<void> {
    if (!delivery.recipientEmail) throw new Error('No email address provided');

    // Convert HTML to PDF if needed
    const pdfBlob = await this.generatePDF(content.html);

    // Send email with PDF attachment
    const result = await emailService.sendEmail({
      to: delivery.recipientEmail,
      subject: content.subject,
      html: content.html,
      attachments: [{
        filename: `receipt-${delivery.transactionId}.pdf`,
        content: pdfBlob
      }]
    });

    delivery.messageId = result.messageId;
  }

  /**
   * Send SMS with receipt summary
   */
  private async sendSMS(delivery: ReceiptDelivery, content: ReceiptContent): Promise<void> {
    if (!delivery.recipientPhone || !content.smsText) {
      throw new Error('No phone number or SMS content provided');
    }

    // In production, integrate with Twilio or similar
    // For now, simulate SMS sending
    console.log(`SMS to ${delivery.recipientPhone}: ${content.smsText}`);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Generate PDF from HTML
   */
  private async generatePDF(html: string): Promise<Blob> {
    // In production, use Puppeteer or similar
    // For now, return HTML as blob
    return new Blob([html], { type: 'application/pdf' });
  }

  /**
   * Store delivery record for audit
   */
  private async storeDeliveryRecord(delivery: ReceiptDelivery): Promise<void> {
    const db = await this.getDatabase();
    const tx = db.transaction(['receipt_deliveries'], 'readwrite');
    await tx.objectStore('receipt_deliveries').put(delivery);
    await tx.complete;
  }

  /**
   * Get receipt delivery history
   */
  async getDeliveryHistory(transactionId?: string): Promise<ReceiptDelivery[]> {
    const db = await this.getDatabase();
    const deliveries = await db.transaction(['receipt_deliveries'])
      .objectStore('receipt_deliveries')
      .getAll();

    if (transactionId) {
      return deliveries.filter(d => d.transactionId === transactionId);
    }

    return deliveries;
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<ReceiptDelivery> {
    const db = await this.getDatabase();
    const delivery = await db.transaction(['receipt_deliveries'])
      .objectStore('receipt_deliveries')
      .get(deliveryId);

    if (!delivery) {
      throw new Error('Delivery record not found');
    }

    // Get transaction for content generation
    const transaction = await transactionService.getTransaction(delivery.transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const customer = delivery.customerId ?
      await customerService.getCustomer(delivery.customerId) : undefined;

    // Regenerate content and retry
    const content = await this.generateReceiptContent(transaction, customer);
    delivery.status = 'pending';
    delivery.attempts = 0;

    await this.processDelivery(delivery, content);
    return delivery;
  }

  /**
   * Get database connection
   */
  private async getDatabase(): Promise<any> {
    // Use IndexedDB for client-side storage
    // In production, this would connect to backend database
    return new Promise((resolve) => {
      const request = indexedDB.open('ReceiptDB', 1);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('receipt_deliveries')) {
          db.createObjectStore('receipt_deliveries', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Clean up old delivery records (FINTRAC requires 5-year retention)
   */
  async cleanupOldRecords(): Promise<number> {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const db = await this.getDatabase();
    const tx = db.transaction(['receipt_deliveries'], 'readwrite');
    const store = tx.objectStore('receipt_deliveries');
    const deliveries = await store.getAll();

    let deletedCount = 0;
    for (const delivery of deliveries) {
      if (new Date(delivery.createdAt) < fiveYearsAgo) {
        await store.delete(delivery.id);
        deletedCount++;
      }
    }

    await tx.complete;
    return deletedCount;
  }
}

export const receiptService = new ReceiptService();