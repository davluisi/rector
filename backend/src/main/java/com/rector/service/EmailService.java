package com.rector.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "Verifica la tua email - Rector";
        String body = "Ciao,\n\nIl tuo codice di verifica OTP per Rector è: " + otpCode + "\n\nQuesto codice è valido per 5 minuti.\nSe non hai richiesto questo codice, puoi ignorare questo messaggio.\n\nIl team di Rector";

        System.out.println("==================================================");
        System.out.println("Rector EMAIL SIMULATION to: " + toEmail);
        System.out.println("Subject: " + subject);
        System.out.println("OTP CODE: " + otpCode);
        System.out.println("==================================================");

        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
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
