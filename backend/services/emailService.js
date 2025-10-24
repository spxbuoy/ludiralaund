const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const createTransporter = () => {
  // Check if email configuration is available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
    console.warn('📧 Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail app password
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (missing email config), just log to console
    if (!transporter) {
      console.log(`📧 [DEV MODE] Verification email would be sent to ${email} with code: ${code}`);
      console.log(`📧 [DEV MODE] Please use this code in the registration form: ${code}`);
      return true;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - Laundry App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Laundry App</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for registering with Laundry App! To complete your registration, 
              please enter the verification code below in the app.
            </p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Your Verification Code</h3>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              This code will expire in 10 minutes. If you didn't request this verification, 
              please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Best regards,<br>
                The Laundry App Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${email} with code: ${code}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (missing email config), just log to console
    if (!transporter) {
      console.log(`📧 [DEV MODE] Password reset email would be sent to ${email} with token: ${resetToken}`);
      return true;
    }
    
    // Determine the correct frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://laundry-app-cyan.vercel.app';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    console.log(`🔗 Password reset link: ${resetLink}`);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - Laundry App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Laundry App</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset</p>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              You requested a password reset for your Laundry App account.
              Click the button below to reset your password.
            </p>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetLink}"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              If you didn't request this password reset, please ignore this email.
              This link will expire in 10 minutes.
            </p>

            <p style="color: #666; font-size: 12px; margin-top: 15px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all; color: #667eea;">${resetLink}</span>
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Best regards,<br>
                The Laundry App Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Password reset email sending failed:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send order status update email
const sendOrderStatusEmail = async (email, customerName, orderNumber, oldStatus, newStatus, items = []) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (missing email config), just log to console
    if (!transporter) {
      console.log(`📧 [DEV MODE] Order status email would be sent to ${email}`);
      console.log(`📧 [DEV MODE] Order ${orderNumber} status changed from ${oldStatus} to ${newStatus}`);
      return true;
    }
    
    const statusLabels = {
      pending: 'Order Pending',
      confirmed: 'Order Confirmed',
      assigned: 'Order Assigned to Provider',
      in_progress: 'Order In Progress',
      ready_for_pickup: 'Ready for Pickup',
      picked_up: 'Items Picked Up',
      ready_for_delivery: 'Ready for Delivery',
      completed: 'Order Completed',
      cancelled: 'Order Cancelled'
    };

    const statusColors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      assigned: '#06b6d4',
      in_progress: '#8b5cf6',
      ready_for_pickup: '#10b981',
      picked_up: '#059669',
      ready_for_delivery: '#84cc16',
      completed: '#22c55e',
      cancelled: '#ef4444'
    };

    const statusDescriptions = {
      pending: 'We have received your order and it is being reviewed.',
      confirmed: 'Your order has been confirmed and is being prepared.',
      assigned: 'A service provider has been assigned to your order.',
      in_progress: 'Your items are being processed by our service provider.',
      ready_for_pickup: 'Your items are ready to be picked up from the service provider.',
      picked_up: 'Your items have been collected and are on their way to you.',
      ready_for_delivery: 'Your items are ready for delivery to your address.',
      completed: 'Your order has been completed successfully. Thank you for using our service!',
      cancelled: 'Your order has been cancelled. If you have any questions, please contact support.'
    };
    
    const itemsList = items.length > 0 
      ? items.map(item => 
          `<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <strong>ID: ${item.itemId}</strong> - ${item.description}
            ${item.serviceName ? ` (${item.serviceName})` : ''}
          </li>`
        ).join('')
      : '<li style="padding: 8px 0;">No individual items tracked</li>';
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Update: ${orderNumber} - ${statusLabels[newStatus] || newStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Laundry App</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Order Status Update</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Your order <strong>${orderNumber}</strong> has been updated with a new status.
            </p>
            
            <div style="background: #fff; border: 2px solid ${statusColors[newStatus] || '#667eea'}; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Current Status</h3>
              <div style="font-size: 24px; font-weight: bold; color: ${statusColors[newStatus] || '#667eea'}; margin-bottom: 10px;">
                ${statusLabels[newStatus] || newStatus}
              </div>
              <p style="color: #666; margin: 0; font-size: 14px;">
                ${statusDescriptions[newStatus] || 'Your order status has been updated.'}
              </p>
            </div>
            
            <div style="margin: 25px 0;">
              <h4 style="color: #333; margin-bottom: 10px;">Your Items:</h4>
              <ul style="background: #fff; border-radius: 8px; padding: 15px; margin: 0; list-style: none; border: 1px solid #e5e7eb;">
                ${itemsList}
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              You can track your order status by logging into your account or contacting our support team.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Best regards,<br>
                The Laundry App Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Order status email sent to ${email} for order ${orderNumber}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Order status email sending failed:', error);
    throw new Error('Failed to send order status email');
  }
};

// Send chat message notification email
const sendChatMessageEmail = async (email, senderName, messageContent, orderNumber = null) => {
  try {
    const transporter = createTransporter();

    // If no transporter (missing email config), just log to console
    if (!transporter) {
      console.log(`📧 [DEV MODE] Chat message email would be sent to ${email}`);
      console.log(`📧 [DEV MODE] From: ${senderName}, Message: ${messageContent}`);
      return true;
    }

    // Determine the correct frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://laundry-app-cyan.vercel.app';
    const dashboardLink = `${frontendUrl}/dashboard`;

    const subject = orderNumber
      ? `New Message - Order ${orderNumber}`
      : 'New Message in Chat';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Laundry App</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">New Chat Message</p>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">You have a new message!</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              <strong>${senderName}</strong> sent you a message${orderNumber ? ` regarding Order ${orderNumber}` : ''}:
            </p>

            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="color: #333; margin: 0; font-style: italic;">
                "${messageContent}"
              </p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${dashboardLink}"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Message
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              You can reply to this message by logging into your account.
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Best regards,<br>
                The Laundry App Team
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Chat message email sent to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Chat message email sending failed:', error);
    throw new Error('Failed to send chat message email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderStatusEmail,
  sendChatMessageEmail
};