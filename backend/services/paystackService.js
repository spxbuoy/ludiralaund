const https = require('https');
const crypto = require('crypto');

class PaystackService {
  constructor() {
    this.baseURL = 'https://api.paystack.co';
    this.isTest = process.env.PAYSTACK_ENV === 'test';
    this.secretKey = this.isTest 
      ? process.env.PAYSTACK_SECRET_KEY_TEST  
      : process.env.PAYSTACK_SECRET_KEY_LIVE;
    this.publicKey = this.isTest 
      ? process.env.PAYSTACK_PUBLIC_KEY_TEST 
      : process.env.PAYSTACK_PUBLIC_KEY_LIVE ;
  }

  /**
   * Initialize a payment transaction
   * @param {Object} paymentData - Payment initialization data
   * @returns {Promise<Object>} - Paystack response
   */
  async initializePayment(paymentData) {
    const {
      email,
      amount, // Amount in kobo (GHS * 100)
      reference,
      currency = 'GHS',
      callback_url,
      metadata = {},
      channels = ['mobile_money', 'card', 'bank'], // Enable multiple payment methods
      mobile_money = {} // Mobile money specific data
    } = paymentData;

    const params = {
      email,
      amount: Math.round(amount * 100), // Convert to kobo/pesewas
      reference,
      currency,
      callback_url,
      channels,
      metadata: {
        ...metadata,
        cancel_action: `${process.env.APP_URL}/orders`
      }
    };

    // Add mobile money specific configuration for Ghana
    if (channels.includes('mobile_money') && mobile_money.phone) {
      params.mobile_money = {
        phone: mobile_money.phone,
        provider: mobile_money.provider || 'mtn' // mtn, vodafone, airteltigo
      };
    }

    try {
      const response = await this.makeRequest('/transaction/initialize', 'POST', params);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return {
        success: false,
        error: error.message || 'Payment initialization failed',
        details: error.response?.data || error
      };
    }
  }

  /**
   * Verify a payment transaction
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>} - Verification result
   */
  async verifyPayment(reference) {
    try {
      const response = await this.makeRequest(`/transaction/verify/${reference}`, 'GET');
      
      const isSuccessful = response.data.status === 'success';
      const isPaid = response.data.gateway_response === 'Successful' || 
                     response.data.gateway_response === 'Approved';

      return {
        success: isSuccessful && isPaid,
        data: response.data,
        status: response.data.status,
        gateway_response: response.data.gateway_response,
        amount: response.data.amount / 100, // Convert from kobo back to cedis
        currency: response.data.currency,
        paid_at: response.data.paid_at,
        channel: response.data.channel,
        reference: response.data.reference,
        transaction_date: response.data.transaction_date,
        authorization: response.data.authorization,
        customer: response.data.customer,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Paystack verification error:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed',
        details: error.response?.data || error
      };
    }
  }

  /**
   * Get supported banks for bank transfer
   * @returns {Promise<Object>} - Banks list
   */
  async getBanks() {
    try {
      const response = await this.makeRequest('/bank?currency=GHS', 'GET');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get banks error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch banks'
      };
    }
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature from headers
   * @param {string} payload - Raw request body
   * @returns {boolean} - Signature validity
   */
  verifyWebhookSignature(signature, payload) {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
      .update(payload, 'utf-8')
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Create a payment page for the customer
   * @param {Object} pageData - Payment page data
   * @returns {Promise<Object>} - Payment page response
   */
  async createPaymentPage(pageData) {
    const {
      name,
      description,
      amount,
      redirect_url,
      metadata = {}
    } = pageData;

    const params = {
      name,
      description,
      amount: Math.round(amount * 100), // Convert to kobo
      redirect_url,
      metadata
    };

    try {
      const response = await this.makeRequest('/page', 'POST', params);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Create payment page error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment page'
      };
    }
  }

  /**
   * Get transaction details
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Transaction details
   */
  async getTransaction(transactionId) {
    try {
      const response = await this.makeRequest(`/transaction/${transactionId}`, 'GET');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get transaction error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch transaction'
      };
    }
  }

  /**
   * Make HTTP request to Paystack API
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - API response
   */
  makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const postData = data ? JSON.stringify(data) : null;
      
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      };

      if (postData) {
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            
            if (res.statusCode >= 200 && res.statusCode < 300 && parsedData.status) {
              resolve(parsedData);
            } else {
              reject({
                message: parsedData.message || 'Request failed',
                statusCode: res.statusCode,
                response: parsedData
              });
            }
          } catch (parseError) {
            reject({
              message: 'Failed to parse response',
              statusCode: res.statusCode,
              response: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        reject({
          message: 'Network error',
          error: error.message
        });
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    });
  }

  /**
   * Generate a unique payment reference
   * @param {string} prefix - Reference prefix
   * @returns {string} - Unique reference
   */
  generateReference(prefix = 'laundry') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Get public key for frontend
   * @returns {string} - Public key
   */
  getPublicKey() {
    return this.publicKey;
  }

  /**
   * Check if service is in test mode
   * @returns {boolean} - Test mode status
   */
  isTestMode() {
    return this.isTest;
  }
}

module.exports = new PaystackService();