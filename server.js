const express = require('express');
const emailjs = require('@emailjs/nodejs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // Autorise les requêtes cross-origin

const pdfStorage = new Map();

emailjs.init({
    publicKey: '7X5RVEsOkGdM2ChRh',
    privateKey: 'ioQpE6T1POreOlcIt0l-D'
});

app.post('/send-email', async (req, res) => {
    const { to_email, amount, frais, beneficiary, reason, date, account_num, pdf_base64 } = req.body;

    if (!to_email || !pdf_base64) {
        console.error('Données manquantes:', { to_email, pdf_base64 });
        return res.status(400).json({ error: 'Données manquantes: to_email ou pdf_base64 requis' });
    }

    const downloadId = uuidv4();
    pdfStorage.set(downloadId, pdf_base64);

    // Supprimer le PDF après 10 minutes
    setTimeout(() => pdfStorage.delete(downloadId), 10 * 60 * 1000);

    const downloadLink = `https://server-3e7c.onrender.com/download/${downloadId}`;

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

    console.log('Envoi EmailJS avec params:', params);

    try {
        const response = await emailjs.send('service_p2stdvp', 'template_boyklk8', params);
        console.log('Réponse EmailJS:', response);
        res.status(200).json({ message: 'E-mail envoyé avec succès' });
    } catch (error) {
        console.error('Erreur EmailJS:', error.message, error.stack);
        res.status(500).json({ error: `Erreur lors de l’envoi de l’e-mail: ${error.message}` });
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
