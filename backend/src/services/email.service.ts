import nodemailer from 'nodemailer'
import logger from '../config/logger'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const EmailService = {
  async sendPasswordReset(to: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const link = `${frontendUrl}/reset-password?token=${token}`

    await transporter.sendMail({
      from: `"Hoomweb" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Redefinição de senha — Hoomweb',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
          <h2 style="color:#1a56db;">Redefinição de senha</h2>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p>Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.</p>
          <a href="${link}" style="display:inline-block;margin:1.5rem 0;padding:.75rem 1.5rem;background:#1a56db;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
            Redefinir senha
          </a>
          <p style="color:#6b7280;font-size:.85rem;">Se você não solicitou a redefinição, ignore este e-mail. Sua senha permanece inalterada.</p>
          <hr style="border-color:#e5e7eb;margin-top:2rem;">
          <p style="color:#9ca3af;font-size:.75rem;">Hoomweb — Sistema de Gestão de Clientes e Tarefas</p>
        </div>
      `,
    })

    logger.info(`Password reset email sent to ${to}`)
  },
}
