const path = require('path');
const brevo = require('@getbrevo/brevo');
const fs = require('fs/promises');
const { formatDate } = require('../utils/utils/date.utils'); 
const jwt = require('jsonwebtoken');
const TripsModel = require('../models/trips.model');
const UsersModel = require('../models/users.model');
require('dotenv').config();

// ================= CONFIGURACIÓN =================
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = 'appviajesunir@gmail.com'; 
const FROM_NAME = 'Viajes Compartidos';

let apiInstance = null;
if (BREVO_API_KEY) {
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey, 
        BREVO_API_KEY
    );
    console.log('✅ Brevo configurado correctamente');
} else {
    console.error('⚠️ BREVO_API_KEY no configurada');
}

// Helper para leer plantillas HTML
const loadTemplate = async (templateName) => {
    const templatePath = path.join(__dirname, `../templates/${templateName}`);
    return await fs.readFile(templatePath, 'utf-8');
};

// ================= FUNCIONES DE ENVÍO =================

// 1. Verificación de Email
const sendVerifyEmailTo = async (userData) => {
    if (!apiInstance) {
        console.warn('⚠️ Brevo no configurado');
        return { success: false, reason: 'Brevo not configured' };
    }

    try {
        const htmlTemplate = await loadTemplate('verify.html');
        const token = jwt.sign({ userId: userData.id_user }, process.env.SECRET_KEY, { expiresIn: '1d' });
        const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        const verificationLink = `${apiBaseUrl}/api/auth/verify?token=${token}`;
        const html = htmlTemplate.replace(/{{verificationLink}}/g, verificationLink);

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
        sendSmtpEmail.to = [{ email: userData.email, name: userData.name }];
        sendSmtpEmail.subject = 'Verificación de email - Viajes Compartidos';
        sendSmtpEmail.htmlContent = html;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email de verificación enviado a ${userData.email}`);
        return { success: true, email: userData.email };
    } catch (error) {
        console.error('❌ Error enviando email:', error.response?.body || error.message);
        return { success: false, reason: error.message };
    }
};

// 2. Notificación de Cambio de Fechas
const sendTripUpdateNotification = async (participants, oldTrip, updatedTrip, creatorEmail) => {
    if (!apiInstance) {
        console.warn('⚠️ Brevo no configurado');
        return { sent: 0, failed: 0, total: 0 };
    }
    
    if (participants.length === 0) {
        return { sent: 0, failed: 0, total: 0 };
    }

    try {
        const htmlTemplate = await loadTemplate('datesModified.html');
        const frontendUrl = process.env.FRONTEND_URL || 'https://app-viajes.netlify.app';
        const tripDetailsUrl = `${frontendUrl}/trips/${updatedTrip.id_trip}`;

        const recipientsToNotify = participants.filter(p => p.email !== creatorEmail);

        if (recipientsToNotify.length === 0) {
            console.log('ℹ️ No hay participantes a notificar');
            return { sent: 0, failed: 0, total: 0 };
        }

        console.log(`📧 Enviando ${recipientsToNotify.length} notificaciones con Brevo...`);

        const emailPromises = recipientsToNotify.map(async (participant) => {
            let html = htmlTemplate
                .replace(/{{participantName}}/g, participant.name)
                .replace(/{{tripTitle}}/g, updatedTrip.title)
                .replace(/{{newStartDate}}/g, formatDate(updatedTrip.start_date))
                .replace(/{{newEndDate}}/g, formatDate(updatedTrip.end_date))
                .replace(/{{oldStartDate}}/g, formatDate(oldTrip.start_date))
                .replace(/{{oldEndDate}}/g, formatDate(oldTrip.end_date))
                .replace(/{{tripDetailsUrl}}/g, tripDetailsUrl);

            const sendSmtpEmail = new brevo.SendSmtpEmail();
            sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
            sendSmtpEmail.to = [{ email: participant.email, name: participant.name }];
            sendSmtpEmail.subject = `⚠️ Cambio de fechas: ${updatedTrip.title}`;
            sendSmtpEmail.htmlContent = html;

            return apiInstance.sendTransacEmail(sendSmtpEmail);
        });

        const results = await Promise.allSettled(emailPromises);

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected');

        if (failed.length > 0) {
            console.error(`❌ ${failed.length} emails fallaron:`, 
                failed.map(f => f.reason?.response?.body || f.reason?.message || 'Error desconocido')
            );
        }

        console.log(`✅ Notificaciones: ${successful}/${results.length} enviadas`);

        return {
            sent: successful,
            failed: failed.length,
            total: results.length
        };

    } catch (error) {
        console.error('❌ Error crítico:', error.response?.body || error.message);
        return { sent: 0, failed: 0, total: 0 };
    }
};

// 3. Solicitud Pendiente
const sendPendingRequestEmail = async (newParticipation) => {
    if (!apiInstance) {
        console.warn('⚠️ Brevo no configurado');
        return { success: false, reason: 'Brevo API not configured' };
    }

    try {
        const { id_participation, id_trip, id_user, message } = newParticipation;

        const participant = await UsersModel.selectById(id_user);
        const trip = await TripsModel.tripsById(id_trip);

        if (!participant || !trip) {
            console.error('❌ Faltan datos de participante o viaje');
            return { success: false, reason: 'Missing participant or trip data' };
        }

        const creator = await UsersModel.selectById(trip.id_creator);
        if (!creator) {
            console.error('❌ Creator not found');
            return { success: false, reason: 'Creator not found' };
        }

        let html = await loadTemplate('pendingRequest.html');

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

        const acceptToken = jwt.sign({ id_participation, action: 'accepted' }, process.env.SECRET_KEY, { expiresIn: '7d' });
        const rejectToken = jwt.sign({ id_participation, action: 'rejected' }, process.env.SECRET_KEY, { expiresIn: '7d' });
        
        html = html
            .replace(/{{creatorName}}/g, creator.name)
            .replace(/{{userName}}/g, participant.name)
            .replace(/{{tripTitle}}/g, trip.title)
            .replace(/{{startDate}}/g, formatDate(trip.start_date))
            .replace(/{{endDate}}/g, formatDate(trip.end_date))
            .replace(/{{userMessage}}/g, message || 'Sin mensaje')
            .replace(/{{appUrl}}/g, `${frontendUrl}/requests`)
            .replace(/{{accepted}}/g, `${apiBaseUrl}/api/participants/${id_participation}/action?token=${acceptToken}`)
            .replace(/{{rejected}}/g, `${apiBaseUrl}/api/participants/${id_participation}/action?token=${rejectToken}`);

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
        sendSmtpEmail.to = [{ email: creator.email, name: creator.name }];
        sendSmtpEmail.subject = `📨 ${participant.name} solicita unirse a tu viaje`;
        sendSmtpEmail.htmlContent = html;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email enviado a ${creator.email}`);
        return { success: true, email: creator.email };
    } catch (error) {
        console.error('❌ Error:', error.response?.body || error.message);
        return { success: false, reason: error.message };
    }
};

module.exports = { sendTripUpdateNotification, sendVerifyEmailTo, sendPendingRequestEmail };