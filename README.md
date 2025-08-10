# LeaperFX

LeaperFX is a comprehensive currency exchange management system designed for local currency exchange businesses. It provides both a public-facing client dashboard and a private store owner dashboard for managing inventory, transactions, and business analytics.

> **For comprehensive documentation, please see [Index.md](Index.md)**

# Store Owner Dashboard Guide

This guide explains how to access and use the Store Owner Dashboard in the Leaper-Fx Currency Exchange application.

## Running the Application

To run the application in development mode:

1. Navigate to the dashboard/demo directory:
   ```
   cd /Users/hyperexploiter/PycharmProjects/Leaper-Fx/dashboard/demo
   ```

2. Install dependencies (if not already installed):
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. The application will start and be available at `http://localhost:5173` (or another port if 5173 is in use)

## Accessing the Store Owner Dashboard

The application has two separate dashboards:

1. **Client Dashboard** - Accessible at the root URL (`http://localhost:5173/`)
   - This is the public-facing dashboard that displays currency exchange rates
   - No authentication required

2. **Store Owner Dashboard** - Accessible at `/owner` (`http://localhost:5173/owner`)
   - This is the private dashboard for store owners
   - Requires authentication

### Login Credentials

To access the Store Owner Dashboard:

1. Navigate to `http://localhost:5173/login`
2. Enter the following credentials:
   - Username: `admin`
   - Password: `LeaperFx2024!`
3. Click "Sign in"

After successful authentication, you will be redirected to the Store Owner Dashboard at `/owner`.

## Store Owner Dashboard Features

The Store Owner Dashboard has four main sections, accessible via the sidebar navigation:

### 1. Smart Calculator

The Smart Calculator allows you to:
- Calculate currency conversions with commission
- Add transactions to the system
- View current exchange rates

To use the calculator:
1. Select the source currency ("From Currency")
2. Enter the amount to convert
3. Set the commission percentage
4. Select the target currency ("To Currency")
5. Click "Calculate"
6. Review the calculated amount and profit
7. Click "Add to Sale" to record the transaction

### 2. Inventory Management

The Inventory Management section allows you to:
- View current currency inventory levels
- Add new stock to your inventory
- Monitor inventory status (Low, Medium, Good)

To add new currency stock:
1. Select the currency from the dropdown
2. Enter the amount to add
3. Enter the buy rate
4. Click "Add Stock"

The system will automatically calculate the sell rate based on the buy rate and add the stock to your inventory.

### 3. Transaction History

The Transaction History section allows you to:
- View all currency exchange transactions
- See transaction details (date, currencies, amounts, commission, profit)
- Export transaction data (CSV)
- Print transaction reports

Transactions are automatically added when you use the "Add to Sale" feature in the Smart Calculator.

### 4. Business Intelligence

The Business Intelligence section provides:
- Summary metrics (total transactions, volume, profit)
- Currency performance analysis
- Business insights and recommendations
- Profit analysis

This data is automatically generated based on your transactions and inventory.

## How the Dashboards are Connected

The Client Dashboard and Store Owner Dashboard are connected in the following ways:

1. **Data Flow**:
   - Exchange rates are shared between both dashboards
   - Transactions created in the Store Owner Dashboard affect the inventory levels
   - Inventory levels influence the business insights in the Analytics Dashboard

2. **Authentication**:
   - The Client Dashboard is public and requires no authentication
   - The Store Owner Dashboard is private and requires authentication
   - You can navigate from the Client Dashboard to the login page via the URL

3. **Session Management**:
   - Your login session is stored in the browser's localStorage
   - You can log out from the Store Owner Dashboard using the "Logout" button in the sidebar
   - After logout, you will be redirected to the Client Dashboard

## Troubleshooting

If you encounter issues:

1. **Cannot access Store Owner Dashboard**:
   - Ensure you've logged in with the correct credentials
   - Check that you're navigating to the correct URL (`/owner`)
   - Try clearing your browser's localStorage and logging in again

2. **Changes not reflecting**:
   - The application uses WebSockets for real-time updates
   - If changes aren't appearing, try refreshing the page

3. **Development server issues**:
   - If the development server fails to start, check for error messages in the terminal
   - Ensure all dependencies are installed with `npm install`
   - Verify that no other service is using the same port