# Email Service Setup

To enable real email sending for LeaperFX receipts, follow these steps:

## Quick Start

1. **Install email backend dependencies:**
   ```bash
   cd /Users/hyperexploiter/PycharmProjects/Leaper-Fx/dashboard/demo
   npm install --package-lock-only express nodemailer cors
   ```

2. **Start the email backend service:**
   ```bash
   node email-backend.js
   ```

3. **Start your main application:**
   ```bash
   npm run dev
   ```

Now when you send receipts, they will be delivered via real Yahoo SMTP!

## What This Does

- Creates a Node.js backend service on port 3001
- Uses your Yahoo email credentials (yourpersonalizednew@yahoo.com)
- Sends real emails via Yahoo SMTP servers
- Provides fallback simulation if backend is unavailable

## Files Created

- `email-backend.js` - The Node.js email service
- `package-email.json` - Dependencies for the email service

## Testing

1. Complete a transaction in your LeaperFX demo
2. Click "Send Receipt" 
3. Check the email address you specified for the receipt
4. Check the console logs for confirmation

## Production Deployment

For production, deploy the email backend service to a cloud provider and update the fetch URL in `emailService.ts` from `localhost:3001` to your production backend URL.

## Troubleshooting

- Make sure port 3001 is available
- Check that Yahoo credentials are correct
- Verify the email backend is running before testing
- Check browser console for any CORS errors