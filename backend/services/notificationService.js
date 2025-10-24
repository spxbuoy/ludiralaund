
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.initializeEmailService();
  }

  initializeEmailService() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }

  async sendOrderStatusNotification(order, user, status) {
    const notifications = [];

    // Email notification
    if (user.preferences?.notificationPreferences?.email && this.emailTransporter) {
      const emailContent = this.generateEmailContent(order, status);
      
      try {
        await this.emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Order Update: ${order.orderNumber}`,
          html: emailContent
        });
        notifications.push({ type: 'email', status: 'sent' });
      } catch (error) {
        console.error('Email notification failed:', error);
        notifications.push({ type: 'email', status: 'failed', error: error.message });
      }
    }

    // Push notification (placeholder for future implementation)
    if (user.preferences?.notificationPreferences?.push) {
      notifications.push({ type: 'push', status: 'placeholder' });
    }

    return notifications;
  }

  generateEmailContent(order, status) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and will be picked up soon.',
      assigned: 'A service provider has been assigned to your order.',
      in_progress: 'Your laundry is being processed.',
      ready_for_pickup: 'Your laundry is ready for pickup/delivery.',
      completed: 'Your order has been completed successfully.'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Order Update</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${order.customer?.firstName || 'Customer'}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            ${statusMessages[status] || 'Your order status has been updated.'}
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Status:</strong> <span style="color: #667eea; font-weight: bold;">${status.replace('_', ' ').toUpperCase()}</span></p>
            <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/orders" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Order Details
            </a>
          </div>
        </div>
      </div>
    `;
  }

  async sendPickupReminder(order, user) {
    if (!user.preferences?.notificationPreferences?.email || !this.emailTransporter) {
      return;
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff9800; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Pickup Reminder</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${user.firstName}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            This is a reminder that your laundry pickup is scheduled for today.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Pickup Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Pickup Time:</strong> ${order.estimatedPickupTime || 'TBD'}</p>
            <p><strong>Address:</strong> ${order.pickupAddress?.street}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Please ensure your laundry is ready for pickup.
          </p>
        </div>
      </div>
    `;

    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Pickup Reminder: ${order.orderNumber}`,
        html: emailContent
      });
    } catch (error) {
      console.error('Pickup reminder failed:', error);
    }
  }
}

module.exports = new NotificationService();
