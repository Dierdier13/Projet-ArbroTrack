const { PrismaClient } = require('@prisma/client');
const authguard = require('../services/authguard');
const path = require("path");
const fs = require('fs/promises');
const sharp = require('sharp');
const uploadMiddleware = require('../services/uploadFormidable');

const treeRouter = require('express').Router();
const prisma = new PrismaClient({ log: ['error'] });

///////////////////////////////////////////////// Ajouter Arbre //////////////////////////////////////////////////////

treeRouter.post('/property/:propertyId/addTree', authguard, uploadMiddleware(), async (req, res) => {
    const { specy, height, diameter, latitude, longitude, healthStatut, sectorId, initialSectorId, returnUrl } = req.body;
    const propertyId = parseInt(req.params.propertyId, 10);
    const finalSectorId = sectorId || initialSectorId;

    try {
        if (!specy || !height || !diameter || !healthStatut) {
            throw new Error("Tous les champs obligatoires doivent être remplis.");
        }

        const tree = await prisma.tree.create({
            data: {
                specy,
                height: parseInt(height, 10),
                diameter: parseInt(diameter, 10),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                healthStatut,
                sectorId: finalSectorId ? parseInt(finalSectorId, 10) : null,
                propertyId: propertyId
            }
        });

        if (req.files && req.files.images) {
            const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            const imageCreationPromises = images.map(async (file) => {
                const filePath = file.filepath || file.path;

                try {
                    await fs.access(filePath);
                } catch (error) {
                    console.error("Erreur : le fichier n'existe pas !");
                    return;
                }

                try {
                    const buffer = await fs.readFile(filePath);
                    const fileName = `tree-${tree.id}-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
                    const outputPath = path.join(__dirname, '..', 'uploads', fileName);

                    await sharp(buffer)
                        .rotate()
                        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                        .webp({ quality: 90 })
                        .toFile(outputPath);

                    await fs.unlink(filePath);

                    await prisma.image.create({
                        data: {
                            url: `uploads/${fileName}`,
                            treeId: tree.id,
                        }
                    });
                } catch (error) {
                    console.error("Erreur lors du traitement de l'image :", error);
                }
            });
            await Promise.all(imageCreationPromises);
        }

        req.flash('success', 'Arbre ajouté avec succès !');
        res.redirect(returnUrl);
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'arbre :", error);
        req.flash('error', "Erreur lors de l'ajout de l'arbre.");
        res.redirect(returnUrl);
    }
});

///////////////////////////////////////////////// Supprimer Arbre //////////////////////////////////////////////////////

treeRouter.get('/deleteTree/:treeId', authguard, async (req, res) => {
    const treeId = parseInt(req.params.treeId);
    try {
        const tree = await prisma.tree.findUnique({
            where: {
                id: treeId
            }
        });
        const propertyId = tree.propertyId;
        const deleteTree = await prisma.tree.delete({
            where: {
                id: treeId
            }
        });
        req.flash('success', 'Arbre supprimé avec succès !');
        res.redirect('/property/' + propertyId);
    } catch (error) {
        const flash = { error: "Erreur lors de la suppression de l'arbre." };
        res.render('pages/dashboard.html.twig', {
            isMainPage: true,
            title: "Dashboard",
            error,
            flash
        });
    }
})

///////////////////////////////////////////////// Modifier Arbre //////////////////////////////////////////////////////

treeRouter.get('/property/:propertyId/editTree/:treeId', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    const treeId = parseInt(req.params.treeId, 10);
    try {
        const tree = await prisma.tree.findUnique({
            where: { id: treeId }
        });
        res.json(tree);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

treeRouter.post('/property/:propertyId/editTree/:treeId', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const treeId = parseInt(req.params.treeId);
    const { specy, height, diameter, healthStatut, sectorId } = req.body;
    try {
        const tree = await prisma.tree.update({
            where: {
                id: treeId
            },
            data: {
                specy,
                height: parseInt(height),
                diameter: parseInt(diameter),
                healthStatut,
                sectorId: parseInt(sectorId)
            }
        });
        req.flash('success', 'Secteur modifié avec succés !');
        res.redirect('/property/' + propertyId + '/tree/' + treeId)
    } catch (error) {
        res.render("pages/dashboard.html.twig", { error: error })
    }
})

///////////////////////////////////////// Ajouter secteur a l'arbre //////////////////////////////////////////////////

treeRouter.post('/property/:propertyId/addSectorTree/:treeId', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId)
    const treeId = parseInt(req.params.treeId)
    try {
        const tree = await prisma.tree.update({
            where: {
                id: treeId
            },
            data: {
                sectorId: parseInt(req.body.sectorId)
            }
        });
        req.flash('success', "Secteur ajouté à l'arbre avec succès !")
        res.redirect('/property/' + propertyId + '/tree/' + treeId)
    } catch (error) {
        const flash = { error: "Erreur lors de l'ajout de secteur à l'arbre." };
        res.render("pages/dasboard.html.twig", {
            isMainPage: true,
            title: "Dashboard",
            property: await prisma.property.findUnique({ where: { id: parseInt(req.params.propertyId) } }),
            flash,
            error
        }
        )
    }
})

///////////////////////////////////////////////// Supprimer secteur a l'arbre ////////////////////////////////////////////////

treeRouter.get('/property/:propertyId/deleteSectorTree/:treeId', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    const treeId = parseInt(req.params.treeId);
    try {
        const tree = await prisma.tree.update({
            where: {
                id: treeId
            },
            data: {
                sectorId: null
            }
        });
        req.flash('success', "Secteur supprimer de l'arbre avec succé !");
        res.redirect('/property/' + propertyId + '/tree/' + treeId);
    } catch (error) {
        req.flash('error', "Erreur lors de la suppression du secteur à l'arbre.")
        res.redirect('/property/' + propertyId + '/tree/' + treeId);
    }
})

///////////////////////////////////////////////// Afficher détail Arbre //////////////////////////////////////////////////////

treeRouter.get('/property/:propertyId/tree/:treeId', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    try {
        const property = await prisma.property.findUnique({
            where: { id: propertyId }
        });
        const sectors = await prisma.sector.findMany({
            where: { propertyId: propertyId }
        })
        const tree = await prisma.tree.findUnique({
            where: {
                id: parseInt(req.params.treeId)
            },
            include: {
                sector: true,
                property: true,
                images: true,
                comments: true,
                histories: true
            }
        });
        const formattedHistories = tree.histories.map(history => ({
            ...history,
            formattedDate: new Date(history.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        }));
        res.render('pages/treeDetail.html.twig', {
            isMainPage: true,
            title: "Détail de l'arbre",
            user: req.session.user,
            property,
            sectors,
            tree,
            previousUrl: req.session.previousUrl || '/',
            images: tree.images,
            comments: tree.comments,
            histories: formattedHistories
        });
    } catch (error) {
        res.status(500).send("Une erreur est survenue lors de la récupération des détails de l'arbre");
    }
});

//////////////////////////////////// Modifier images arbre ///////////////////////

treeRouter.post('/property/:propertyId/tree/:treeId/editImages', authguard, uploadMiddleware(), async (req, res) => {

    const propertyId = parseInt(req.params.propertyId);
    const treeId = parseInt(req.params.treeId);

    try {
        const images = await prisma.image.findMany({ where: { treeId: treeId } });

        if (images.length > 0) {
            await Promise.all(images.map(async (image) => {
                const filePath = path.resolve(__dirname, '..', image.url);
                try {
                    await fs.unlink(filePath);
                } catch (err) {
                    console.error(`❌ Erreur lors de la suppression du fichier ${image.url}:`, err);
                }
            }));
            await prisma.image.deleteMany({ where: { treeId: treeId } });
        }

        if (!req.files || !req.files.images) {
            req.flash('error', "Aucune image envoyée.");
            return res.redirect(`/property/${propertyId}/tree/${treeId}`);
        }

        const imagesArray = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        const imageCreationPromises = imagesArray.map(async (file) => {
            const filePath = file.filepath || file.newFilename;
            try {
                await fs.access(filePath, fs.constants.F_OK);
            } catch {
                console.error("❌ Erreur : le fichier n'existe pas !");
                return;
            }

            try {
                const buffer = await fs.readFile(filePath);
                const fileName = `tree-${treeId}-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
                const outputPath = path.resolve(__dirname, '..', 'uploads', fileName);

                await sharp(buffer)
                    .rotate()
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 90 })
                    .toFile(outputPath);

                await fs.unlink(filePath);

                await prisma.image.create({
                    data: {
                        url: `uploads/${fileName}`,
                        treeId: treeId,
                    }
                });

            } catch (error) {
                console.error("❌ Erreur lors du traitement de l'image :", error);
            }
        });

        await Promise.all(imageCreationPromises);

        req.flash('success', "Succès lors de la modification des images.");
        res.redirect(`/property/${propertyId}/tree/${treeId}`);

    } catch (error) {
        console.error('❌ Erreur lors de la modification des images :', error);
        req.flash('error', "Erreur lors de la modification des images.");
        res.redirect(`/property/${propertyId}/tree/${treeId}`);
    }
});

module.exports = treeRouter;