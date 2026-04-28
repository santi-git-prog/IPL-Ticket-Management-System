# Razorpay Payment Integration - Step-by-Step Guide

Follow these steps to run the payment gateway module:

### 1. Install Backend Dependencies
Open your terminal in the `backend` directory and run:
```bash
npm install razorpay
```

### 2. Configure Environment Variables
Open `backend/.env` and replace the placeholders with your actual Razorpay Test Keys:
```env
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET
```

### 3. Configure Frontend Environment (Vite)
If you are using Vite, you should also add the Key ID to your frontend `.env` (create `frontend/.env` if it doesn't exist):
```env
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY
```

### 4. Run the Application
Start the backend:
```bash
cd backend
npm run dev
```

Start the frontend:
```bash
cd frontend
npm run dev
```

### 5. Testing the Flow
1. Navigate to the **Matches** page.
2. Click on any match to go to **Booking**.
3. Select a **Stand** and **Quantity**.
4. Click **Proceed to Pay**.
5. The Razorpay Test Popup should open.
6. Use [Razorpay Test Card Details](https://razorpay.com/docs/payments/payments/test-card-details/) (e.g., Card Number: `4111 1111 1111 1111`) to simulate a successful payment.
7. Observe the Success/Error overlays and redirection.

### Troubleshooting
- **Popup not opening**: Check if the Razorpay script is correctly loaded in `index.html`.
- **Order creation error**: Ensure backend is running and `RAZORPAY_KEY_ID` is correct.
- **VITE_ env not working**: Restart the Vite dev server after updating `.env`.
