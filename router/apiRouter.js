const authguard = require('../services/authguard');
const path = require("path");
const fs = require('fs/promises');
const sharp = require('sharp');
const uploadMiddleware = require('../services/uploadFormidable');
const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));

const apiRouter = require('express').Router();
const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify/all';

//////////////////////////////////////////// PlantNet ////////////////////////////////////////////////

apiRouter.get('/apiPlantNet', authguard, async (req, res) => {
    try {
        res.render('pages/plantNet.html.twig', {
            title: "Identification des arbres - PlantNet",
            isMainPage: true,
            isPropertyPage: true
        });
    } catch (error) {
        req.flash('error', "Erreur d'affichage page API PlantNet");
        res.redirect('/')
    }

})

apiRouter.post('/apiPlantNet', authguard, uploadMiddleware(), async (req, res) => {
    if (!req.files || !req.files.images) {
        return res.status(400).json({ error: 'Aucune image fournie.' });
    }

    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    let processedImages = [];

    try {
        for (const file of images) {
            const filePath = file.filepath || file.path;
            const webpFileName = `converted-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const outputPath = path.join(__dirname, '..', 'uploads', webpFileName);

            await sharp(filePath)
                .rotate()
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 90 })
                .toFile(outputPath);

            processedImages.push(outputPath);
            await fs.unlink(filePath);
        }

        const formData = new FormData();
        processedImages.forEach((imagePath) => {
            formData.append('images', fs.createReadStream(imagePath));
        });
        formData.append('organs', 'leaf');
        formData.append('api-key', process.env.PLANTNET_API_KEY);

        const response = await fetch(PLANTNET_API_URL, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const responseData = await response.json();

        await Promise.all(processedImages.map(img => fs.unlink(img)));

        res.json(responseData);
    } catch (error) {
        console.error('Erreur lors de l’identification de l’espèce :', error);
        res.status(500).json({ error: 'Erreur lors de l’identification de l’espèce.' });
    }
});

module.exports = apiRouter