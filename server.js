const express = require('express');
const emailjs = require('@emailjs/nodejs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = express();
app.use(express.json());

// Configure CORS pour autoriser uniquement ton front-end
const allowedOrigins = ['https://ecobank-virement.onrender.com'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

const pdfStorage = new Map();

emailjs.init({
    publicKey: '7X5RVEsOkGdM2ChRh',
    privateKey: 'TA_CLÉ_PRIVÉE' // Vérifie que ta clé privée est correcte
});

app.post('/send-email', async (req, res) => {
    const { to_email, amount, frais, beneficiary, reason, date, account_num, pdf_base64 } = req.body;

    const downloadId = uuidv4();
    pdfStorage.set(downloadId, pdf_base64);

    const downloadLink = `https://server-xyz.onrender.com/download/${downloadId}`;

    const params = {
        to_email,
        amount,
        frais,
        beneficiary,
        reason,
        date,
        account_num,
        download_link: downloadLink,
        attachment: {
            name: `bordereau_${date}.pdf`,
            data: pdf_base64,
            contentType: 'application/pdf'
        }
    };

    try {
        await emailjs.send('service_p2stdvp', 'template_boyklk8', params);
        res.status(200).json({ message: 'E-mail envoyé avec succès' });
    } catch (error) {
        console.error('Erreur EmailJS:', error);
        res.status(500).json({ error: 'Erreur lors de l’envoi de l’e-mail' });
    }
});

app.get('/download/:id', (req, res) => {
    const { id } = req.params;
    const pdfBase64 = pdfStorage.get(id);
    if (pdfBase64) {
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bordereau.pdf`);
        res.send(pdfBuffer);
        pdfStorage.delete(id);
    } else {
        res.status(404).send('Bordereau non trouvé');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
