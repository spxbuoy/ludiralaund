const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class MoMoService {
  constructor() {
    this.apiUser = process.env.MOMO_API_USER || '80d41de5-fa4a-4515-82e8-5403660428e9';
    this.apiKey = process.env.MOMO_API_KEY || 'b9d907d470234528b403515b9a5285aa';
    this.subscriptionKey = process.env.MOMO_SUBSCRIPTION_KEY || '2967da11bac749bfbf880f685e4a9644';
    this.baseUrl = process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.partyIdType = 'MSISDN';
    // FIX 1: Currency should be EUR for sandbox, not GHS
    this.currency = process.env.NODE_ENV === 'production' ? 'GHS' : 'EUR'; 
    this.targetEnvironment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    
    // Add request timeout and retry configuration
    this.axiosConfig = {
      timeout: 30000, // 30 seconds timeout
      headers: {
        'User-Agent': 'MTN-MoMo-Client/1.0.0'
      }
    };
  }

  // Generate transaction reference
  generateTransactionRef() {
    return `MOMO_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  // FIX 2: Fixed syntax error in getAccessToken method
  async getAccessToken() {
    const tokenUrl = `${this.baseUrl}/collection/token/`;
    
    try {
      console.log('🔑 Getting access token...');
      
      const response = await axios.post(tokenUrl, {}, {
        ...this.axiosConfig,
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': 'Basic ' + Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64'),
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Access token obtained successfully');
      return response.data.access_token;
    } catch (error) {
      console.error('❌ Failed to get access token:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // FIX 3: Better error handling with specific error messages
      if (error.response?.status === 401) {
        throw new Error('Invalid API credentials. Check your API User ID and API Key.');
      } else if (error.response?.status === 403) {
        throw new Error('Subscription key not authorized. Check your subscription in MTN Developer Portal.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. MTN API is not responding.');
      } else {
        throw new Error(`Could not authenticate with MTN MoMo API: ${error.message}`);
      }
    }
  }

  // FIX 4: Improved payment initiation with better error handling
  async initiatePayment({ amount, phoneNumber, customerName, orderId }) {
    const transactionRef = this.generateTransactionRef();
    const referenceId = uuidv4();
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    // FIX 5: Validate inputs before making API call
    if (!amount || amount <= 0) {
      return {
        success: false,
        transactionRef,
        status: 'failed',
        message: 'Invalid amount provided',
        error: 'Amount must be greater than 0'
      };
    }

    if (!this.validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        transactionRef,
        status: 'failed',
        message: 'Invalid phone number format',
        error: 'Please provide a valid phone number'
      };
    }

    try {
      console.log(`💳 Initiating payment: ${amount} ${this.currency} from ${formattedNumber}`);
      
      const token = await this.getAccessToken();

      const paymentData = {
        amount: String(amount),
        currency: this.currency,
        externalId: orderId || transactionRef,
        payer: { 
          partyIdType: this.partyIdType, 
          partyId: formattedNumber 
        },
        payerMessage: `Payment for ${customerName || 'Order'}`,
        payeeNote: 'Thank you for your payment'
      };

      console.log('📤 Sending payment request:', { ...paymentData, payer: { ...paymentData.payer } });

      const response = await axios.post(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        paymentData,
        {
          ...this.axiosConfig,
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Payment request sent successfully');
      
      return {
        success: true,
        transactionRef,
        referenceId,
        status: 'pending',
        message: 'Payment request sent. Awaiting customer approval.',
        paymentData: {
          amount,
          currency: this.currency,
          phoneNumber: formattedNumber
        }
      };
    } catch (error) {
      console.error('❌ Payment initiation failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // FIX 6: Better error categorization
      let errorMessage = 'Payment request failed';
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid payment request data';
      } else if (error.response?.status === 409) {
        errorMessage = 'Duplicate transaction reference';
      } else if (error.response?.status === 500) {
        errorMessage = 'MTN service temporarily unavailable';
      }

      return {
        success: false,
        transactionRef,
        referenceId,
        status: 'failed',
        message: errorMessage,
        error: error.response?.data || error.message
      };
    }
  }

  // FIX 7: Enhanced payment status checking with retry logic
  async checkPaymentStatus(referenceId, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      console.log(`🔍 Checking payment status for reference: ${referenceId}`);
      
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          ...this.axiosConfig,
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      const status = response.data.status;
      console.log(`📊 Payment status: ${status}`);

      return {
        success: true,
        status: status.toLowerCase(),
        transactionId: response.data.financialTransactionId || null,
        amount: response.data.amount,
        currency: response.data.currency,
        reason: response.data.reason || null,
        message: `Payment status: ${status}`,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Status check failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        attempt: retryCount + 1
      });

      // FIX 8: Retry logic for failed status checks
      if (retryCount < maxRetries && error.response?.status >= 500) {
        console.log(`🔄 Retrying status check... (${retryCount + 1}/${maxRetries})`);
        await this.delay(2000 * (retryCount + 1)); // Exponential backoff
        return this.checkPaymentStatus(referenceId, retryCount + 1);
      }

      return {
        success: false,
        status: 'unknown',
        message: 'Could not retrieve payment status',
        error: error.response?.data || error.message
      };
    }
  }

  // FIX 9: Added account balance check method
  async getAccountBalance() {
    try {
      console.log('💰 Checking account balance...');
      
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/account/balance`,
        {
          ...this.axiosConfig,
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      console.log('✅ Balance retrieved successfully');
      
      return {
        success: true,
        balance: response.data.availableBalance,
        currency: response.data.currency
      };
    } catch (error) {
      console.error('❌ Balance check failed:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Could not retrieve account balance',
        error: error.message
      };
    }
  }

  // FIX 10: Enhanced phone number validation
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // For Ghana: supports 0XXXXXXXXX, +233XXXXXXXXX, 233XXXXXXXXX formats
    const ghanaRegex = /^(\+?233|0)\d{9}$/;
    
    // For sandbox testing - international format
    const internationalRegex = /^(\+?[1-9]\d{1,14})$/;
    
    return ghanaRegex.test(cleanNumber) || internationalRegex.test(cleanNumber);
  }

  // FIX 11: Improved phone number formatting
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Handle Ghana numbers
    if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
      return '233' + cleanNumber.slice(1); // Remove 0 and add 233
    }
    if (cleanNumber.startsWith('+233')) {
      return cleanNumber.slice(1); // Remove +
    }
    if (cleanNumber.startsWith('233') && cleanNumber.length === 12) {
      return cleanNumber; // Already properly formatted
    }
    
    // For other international numbers (sandbox testing)
    if (cleanNumber.startsWith('+')) {
      return cleanNumber.slice(1);
    }
    
    // Default: assume it's a Ghana number without country code
    if (cleanNumber.length === 9) {
      return '233' + cleanNumber;
    }
    
    return cleanNumber; // Return as-is if can't determine format
  }

  // FIX 12: Added utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test connection to MTN API
  async testConnection() {
    try {
      console.log('🧪 Testing MTN MoMo API connection...');
      
      const token = await this.getAccessToken();
      const balance = await this.getAccountBalance();
      
      return {
        success: true,
        message: 'MTN MoMo API connection successful',
        hasToken: !!token,
        balanceCheck: balance.success,
        environment: this.targetEnvironment,
        currency: this.currency
      };
    } catch (error) {
      return {
        success: false,
        message: 'MTN MoMo API connection failed',
        error: error.message,
        environment: this.targetEnvironment
      };
    }
  }

  // FIX 13: Added webhook verification method
  verifyWebhookSignature(payload, signature, secret) {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return computedSignature === signature;
  }
}

module.exports = new MoMoService();