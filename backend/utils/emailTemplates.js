export const generateVerificationEmail = (name, verificationLink) => {
  function capitalizeName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
  return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
              border-radius: 8px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #4f46e5;
              color: white;
              border-radius: 8px 8px 0 0;
            }
            .content {
              padding: 20px;
              background-color: white;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4f46e5;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 0.875rem;
            }
              h2,p {
              color: #000000}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to IREGO POS!</h1>
            </div>
            <div class="content">
              <h2>Hello ${capitalizeName(name)},</h2>
              <p>Thank you for registering with IREGO POS. To complete your registration and verify your email address, please click the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button" style="color:white;">Verify Email Address</a>
              </div>
              <p style="text-align: center;">This verification link will expire in 24 hours.</p>
              <p style="text-align: center;">If you did not create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} IREGO POS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
};

export const generatePasswordResetEmail = (name, resetLink) => {
  function capitalizeName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
  return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
              border-radius: 8px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #4f46e5;
              color: white;
              border-radius: 8px 8px 0 0;
            }
            .content {
              padding: 20px;
              background-color: white;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4f46e5;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 0.875rem;
            }
              h2,p {
              color: #000000}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${capitalizeName(name)},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button" style="color:white;">Reset Password</a>
              </div>
              <p style="text-align: center;">This verification link will expire in 24 hours.</p>
              <p style="text-align: center;">If you did not create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} IREGO POS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
};
