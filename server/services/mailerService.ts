export const MailerService = {
  async sendVerificationOTP(email: string, otp: string, collegeName: string): Promise<{ success: boolean; message: string }> {
    console.log(`[Campus Mailer] Sending OTP '${otp}' to ${email} for campus '${collegeName}' verification.`);
    // Real Nodemailer integration can use process.env.SMTP_URL or sendgrid if configured
    return {
      success: true,
      message: `Verification code sent to ${email}. (Demo OTP: ${otp})`
    };
  },

  async sendBookingConfirmation(email: string, details: { subject: string; date: string; amount: number; tutor: string }): Promise<void> {
    console.log(`[Campus Mailer] Booking confirmed for ${email}: ${details.subject} with ${details.tutor} on ${details.date}. Escrow: $${details.amount}`);
  }
};
