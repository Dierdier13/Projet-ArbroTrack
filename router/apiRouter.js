const authguard = require('../services/authguard');
const path = require("path");
const fs = require('fs/promises');
const sharp = require('sharp');
const uploadMiddleware = require('../services/uploadFormidable');
const fetch = require('node-fetch');
const FormData = require('form-data');

const apiRouter = require('express').Router();
const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify/all?include-related-images=true&no-reject=true&nb-results=2&lang=fr&api-key=';
const PERENUAL_API_URL = 'https://perenual.com/api/v2/species/details/[ID]?key='

//////////////////////////////////////////// PlantNet ////////////////////////////////////////////////

apiRouter.get('/apiPlantNet', authguard, async (req, res) => {
    try {
        res.render('pages/plantNet.html.twig', {
            title: "Identification des arbres - PlantNet",
            user: req.session.user,
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

    try {
        const imageBuffers = await Promise.all(images.map(async (file) => {
            const filePath = file.filepath || file.path;
            try {
                const buffer = await fs.readFile(filePath);
                const jpegBuffer = await sharp(buffer)
                    .rotate()
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toBuffer();
                await fs.unlink(filePath);
                return jpegBuffer;
            } catch (error) {
                console.error("Erreur lors du traitement de l'image :", error);
                return null;
            }
        }));

        const validImages = imageBuffers.filter(buffer => buffer !== null);
        if (validImages.length === 0) {
            return res.status(500).json({ error: 'Erreur lors du traitement des images.' });
        }

        const apiUrlWithKey = PLANTNET_API_URL + process.env.PLANTNET_API_KEY;

        const organs = req.body.organs;
        const organsArray = Array.isArray(organs) ? organs : [organs];

        const formData = new FormData();
        validImages.forEach((buffer, index) => {
            formData.append(`images`, buffer, `image-${index}.jpeg`);
        });
        formData.append('organs', organsArray.join(','));

        const response = await fetch(apiUrlWithKey, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const responseData = await response.json();

        if (response.ok) {
            res.render('pages/plantNet.html.twig', {
                title: "Identification des arbres - PlantNet",
                isMainPage: true,
                isPropertyPage: true,
                data: responseData
            });
        } else {
            res.status(response.status).json(responseData);
        }
    } catch (error) {
        console.error('Erreur lors de l’identification de l’espèce :', error);
        res.status(500).json({ message: 'Erreur lors de l’identification de l’espèce.', error: error.message });
    }
});

///////////////////////////////////////////// Encyclopédie ///////////////////////////////////////

apiRouter.get('/apiPerenual', authguard, async (req, res) => {
    try {
        res.render('pages/perenual.html.twig', {
            title: "Données botaniques sur les arbres - Perenual",
            user: req.session.user,
            isMainPage: true,
            isPropertyPage: true
        });
    } catch (error) {
        req.flash('error', "Erreur d'affichage page API Perenual");
        res.redirect('/');
    }
})

///////////////////////////////////////////// Expertise ///////////////////////////////////////////

apiRouter.get('/expertise', authguard, async (req, res) => {
    try {
        res.render('pages/expertise.html.twig', {
            title: "Données botaniques sur les arbres - Perenual",
            user: req.session.user,
            isMainPage: true,
            isPropertyPage: true
        });
    } catch (error) {
        req.flash('error', "Erreur d'affichage page API Perenual");
        res.redirect('/');
    }
})

module.exports = apiRouter