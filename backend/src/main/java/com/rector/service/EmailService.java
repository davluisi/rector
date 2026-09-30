package com.rector.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String mailFrom;

    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "Verifica la tua email - Rector";
        String body = "Ciao,\n\nIl tuo codice di verifica OTP per Rector è: " + otpCode + "\n\nQuesto codice è valido per 5 minuti.\nSe non hai richiesto questo codice, puoi ignorare questo messaggio.\n\nIl team di Rector";
        sendEmail(toEmail, subject, body, "OTP Registrazione/Verifica", otpCode);
    }

    public void sendPasswordResetOtpEmail(String toEmail, String otpCode) {
        String subject = "Recupero password - Rector";
        String body = "Ciao,\n\nÈ stato richiesto il ripristino della password per il tuo account Rector.\n\nIl tuo codice OTP di ripristino è: " + otpCode + "\n\nQuesto codice è valido per 5 minuti.\nSe non hai richiesto tu il ripristino, ignora questa email e la tua password rimarrà invariata.\n\nIl team di Rector";
        sendEmail(toEmail, subject, body, "OTP Reset Password", otpCode);
    }

    private void sendEmail(String toEmail, String subject, String body, String logLabel, String logCode) {
        System.out.println("==================================================");
        System.out.println("Rector EMAIL [" + logLabel + "] to: " + toEmail);
        System.out.println("Subject: " + subject);
        if (logCode != null) {
            System.out.println("CODE: " + logCode);
        }
        System.out.println("==================================================");

        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                if (mailFrom != null && !mailFrom.trim().isEmpty()) {
                    message.setFrom(mailFrom.trim());
                }
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                System.out.println("Email sent successfully via SMTP to " + toEmail);
            } catch (Exception e) {
                System.err.println("Failed to send email via SMTP to " + toEmail + ": " + e.getMessage());
            }
        } else {
            System.out.println("SMTP MailSender not configured. Email only simulated in logs.");
        }
    }
}
