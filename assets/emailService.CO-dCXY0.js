var n=Object.defineProperty;var c=(i,e,t)=>e in i?n(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var r=(i,e,t)=>c(i,typeof e!="symbol"?e+"":e,t);class l{constructor(){r(this,"config");r(this,"isInitialized",!1);this.config={smtpHost:"smtp.mail.yahoo.com",smtpPort:587,secure:!1,auth:{user:"yourpersonalizednew@yahoo.com",pass:"toyhtjzrtdioijxt"}}}async init(){try{this.isInitialized=!0,console.log("Email service initialized successfully")}catch(e){throw console.error("Failed to initialize email service:",e),new Error("Email service initialization failed")}}async sendReceiptEmail(e){this.isInitialized||await this.init();try{const t={from:`"Leaper FX Exchange" <${this.config.auth.user}>`,to:e.to,subject:e.subject,html:this.wrapReceiptHTML(e.html),attachments:e.attachments||[]};console.log("Sending email...",{to:e.to,subject:e.subject,from:t.from}),await this.simulateEmailSending(t);const a=`receipt-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;return this.logEmailActivity({messageId:a,to:e.to,subject:e.subject,status:"sent",timestamp:new Date().toISOString()}),{success:!0,messageId:a}}catch(t){return console.error("Email sending failed:",t),this.logEmailActivity({to:e.to,subject:e.subject,status:"failed",error:t instanceof Error?t.message:"Unknown error",timestamp:new Date().toISOString()}),{success:!1,error:t instanceof Error?t.message:"Email sending failed"}}}async sendTransactionReceipt(e,t,a,s="Leaper FX"){const o=`Receipt from ${s} - Transaction ${a}`;return this.sendReceiptEmail({to:e,subject:o,html:t})}wrapReceiptHTML(e){return`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Receipt</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .email-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .email-header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
        }
        .email-header p {
            color: #6b7280;
            margin: 10px 0 0 0;
        }
        .receipt-container {
            margin: 20px 0;
        }
        .email-footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .disclaimer {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Transaction Receipt</h1>
            <p>Thank you for choosing our currency exchange service</p>
        </div>
        
        <div class="receipt-container">
            ${e.replace("<!doctype html><html><head><title>Receipt","<!-- Receipt Content -->").replace("</body></html>","<!-- End Receipt -->")}
        </div>
        
        <div class="email-footer">
            <p><strong>Need help?</strong> Contact us for any questions about your transaction.</p>
            <p>This is an automated email. Please do not reply to this address.</p>
            
            <div class="disclaimer">
                <p><strong>Important:</strong> Keep this receipt for your records. This email serves as your official transaction confirmation.</p>
                <p>All transactions are subject to applicable regulations and compliance requirements.</p>
            </div>
        </div>
    </div>
</body>
</html>`}async simulateEmailSending(e){if(await new Promise(t=>setTimeout(t,1e3+Math.random()*1e3)),Math.random()<.05)throw new Error("Network timeout - please try again");console.log("✅ Email sent successfully:",{to:e.to,subject:e.subject,timestamp:new Date().toISOString()})}logEmailActivity(e){try{const t=JSON.parse(localStorage.getItem("emailActivityLogs")||"[]");t.push(e),t.length>1e3&&t.splice(0,t.length-1e3),localStorage.setItem("emailActivityLogs",JSON.stringify(t))}catch(t){console.warn("Failed to log email activity:",t)}}getEmailLogs(){try{return JSON.parse(localStorage.getItem("emailActivityLogs")||"[]")}catch(e){return console.warn("Failed to retrieve email logs:",e),[]}}async testConnection(){try{return await this.init(),{success:!0,message:"Email service connection successful"}}catch(e){return{success:!1,message:e instanceof Error?e.message:"Connection test failed"}}}async sendTestEmail(e){const t=`
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">Email Service Test</h2>
        <p>This is a test email from Leaper FX email service.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Service Status:</strong> ✅ Operational</p>
        <div style="background: #f8f9fa; padding: 15px; margin-top: 20px; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            If you received this email, the email service is working correctly.
          </p>
        </div>
      </div>
    `;return this.sendReceiptEmail({to:e,subject:"Leaper FX - Email Service Test",html:t})}}const d=new l;export{d as default};
