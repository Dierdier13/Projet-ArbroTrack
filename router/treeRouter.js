const { PrismaClient } = require('@prisma/client');
const authguard = require('../services/authguard');
const upload = require('../services/uploadConfig');

const treeRouter = require('express').Router();
const prisma = new PrismaClient({ log: ['error'] });

///////////////////////////////////////////////// Ajouter Arbre //////////////////////////////////////////////////////

treeRouter.post('/property/:propertyId/addTree', authguard, upload.array('images', 2), async (req, res) => {
    const { specy, height, diameter, healthStatut, sectorId, initialSectorId, returnUrl } = req.body;
    const propertyId = parseInt(req.params.propertyId);
    const finalSectorId = sectorId || initialSectorId;
    try {
        const tree = await prisma.tree.create({
            data: {
                specy,
                height: parseInt(height),
                diameter: parseInt(diameter),
                healthStatut,
                sectorId: finalSectorId ? parseInt(finalSectorId) : null,
                propertyId: propertyId
            }
        });
        if (req.files && req.files.length > 0) {
            const imageCreationPromises = req.files.map(file => {
                return prisma.image.create({
                    data: {
                        url: file.path,
                        treeId: tree.id,
                    }
                });
            });
            await Promise.all(imageCreationPromises);
        } 
        req.flash('success', 'Arbre ajouté avec succès !');
        res.redirect(returnUrl);
        
    } catch (error) {
        const flash = { error: "Erreur lors de l'ajout de l'arbre." };
        res.render('pages/dashboard.html.twig', {
            isMainPage: true,
            title: "Dashboard",
            error,
            flash
        });
    }
})

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

///////////////////////////////////////// Ajouter arbre au secteur //////////////////////////////////////////////////

treeRouter.post('/property/:propertyId/addSectorTree/:treeId', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId)
    const treeId = parseInt(req.params.treeId)
    try {
        const sector = await prisma.findUnique({
            where: { id: propertyId }
        });
        const tree = await prisma.tree.update({
            where: {
                id: treeId
            },
            data: {
                sectorId: parseInt(req.body.sectorId)
            }
        });
        req.flash('success', 'Arbre ajouté au secteur avec succès')
        res.redirect("/property/" + propertyId)
    } catch (error) {
        const flash = { error: "Erreur lors de l'ajout de l'arbre au secteur'." };
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



module.exports = treeRouter;