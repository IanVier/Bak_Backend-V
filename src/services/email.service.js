const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs/promises'); // Usamos promesas para no bloquear el hilo
const { formatDate } = require('../utils/utils/date.utils'); 
const jwt = require('jsonwebtoken');
const TripsModel = require('../models/trips.model');
const UsersModel = require('../models/users.model');
require('dotenv').config();


// ================= CONFIGURACIÓN =================
// Configuración del Transporter
const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
});


// Helper para leer plantillas HTML de forma asíncrona
const loadTemplate = async (templateName) => {
    const templatePath = path.join(__dirname, `../templates/${templateName}`);
    return await fs.readFile(templatePath, 'utf-8');
};

// ================= FUNCIONES DE ENVÍO =================

// 1. Verificación de Email
const sendVerifyEmailTo = async (userData) => {
    if (!transporter) return;

    try {
        const htmlTemplate = await loadTemplate('verify.html'); // Lectura asíncrona
        
        const token = jwt.sign({ userId: userData.id_user }, process.env.SECRET_KEY, { expiresIn: '1d' });
        
        // Este link apunta al BACKEND, el cual debe hacer res.redirect() al FRONTEND
        const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        const verificationLink = `${apiBaseUrl}/api/auth/verify?token=${token}`;
        
        const html = htmlTemplate.replace(/{{verificationLink}}/g, verificationLink);

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: userData.email,
            subject: 'Verificación de email - Viajes Compartidos',
            html: html,
        });
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
    }
};

// 2. Notificación de Cambio de Fechas
// 📧 email.service.js - Versión simplificada
const sendTripUpdateNotification = async (participants, oldTrip, updatedTrip, creatorEmail) => {
    if (!transporter || participants.length === 0) {
        console.warn('⚠️ No se pueden enviar emails: transporter no disponible o sin participantes');
        return;
    }

    try {
        const htmlTemplate = await loadTemplate('datesModified.html');
        const frontendUrl = process.env.FRONTEND_URL || 'https://app-viajes.netlify.app';
        const tripDetailsUrl = `${frontendUrl}/trips/${updatedTrip.id_trip}`;

        // Filtrar participantes (excluir al creador)
        const recipientsToNotify = participants.filter(p => p.email !== creatorEmail);

        if (recipientsToNotify.length === 0) {
            console.log('ℹ️ No hay participantes a notificar (solo el creador)');
            return;
        }

        // Crear promesas de envío
        const emailPromises = recipientsToNotify.map(participant => {
            let html = htmlTemplate
                .replace(/{{participantName}}/g, participant.name)
                .replace(/{{tripTitle}}/g, updatedTrip.title)
                .replace(/{{newStartDate}}/g, formatDate(updatedTrip.start_date))
                .replace(/{{newEndDate}}/g, formatDate(updatedTrip.end_date))
                .replace(/{{oldStartDate}}/g, formatDate(oldTrip.start_date))
                .replace(/{{oldEndDate}}/g, formatDate(oldTrip.end_date))
                .replace(/{{tripDetailsUrl}}/g, tripDetailsUrl);

            return transporter.sendMail({
                from: `Viajes Compartidos <${process.env.GMAIL_USER}>`,
                to: participant.email,
                subject: `⚠️ Cambio de fechas: ${updatedTrip.title}`,
                html: html,
            });
        });

        // Esperar todos los envíos
        const results = await Promise.allSettled(emailPromises);

        // Analizar resultados
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected');

        if (failed.length > 0) {
            console.error(`❌ ${failed.length} emails fallaron:`, 
                failed.map(f => f.reason?.message || 'Error desconocido')
            );
        }

        console.log(`✅ Emails de notificación: ${successful}/${results.length} enviados correctamente`);

        // Retornar estadísticas
        return {
            sent: successful,
            failed: failed.length,
            total: results.length
        };

    } catch (error) {
        console.error('❌ Error crítico en sendTripUpdateNotification:', error.message);
        console.error('Stack:', error.stack);
        // No lanzamos el error para no romper el flujo del controlador
    }
};

// 3. Solicitud Pendiente (Aceptar/Rechazar)
const sendPendingRequestEmail = async (newParticipation) => {
    if (!transporter) return;

    try {
        const { id_participation, id_trip, id_user, message } = newParticipation;

        const participant = await UsersModel.selectById(id_user);
        const trip = await TripsModel.tripsById(id_trip);

        if (!participant || !trip) {
            console.error('Missing data for email');
            return;
        }

        const creator = await UsersModel.selectById(trip.id_creator);
        if (!creator) return;

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

        return transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: creator.email,
            subject: `📨 ${participant.name} solicita unirse a tu viaje`,
            html: html,
        });
    } catch (error) {
        console.error('❌ Error sending pending request email:', error.message);
        throw error;
    }
};

module.exports = { sendTripUpdateNotification, sendVerifyEmailTo, sendPendingRequestEmail };