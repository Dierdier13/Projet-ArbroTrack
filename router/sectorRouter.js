const { PrismaClient } = require('@prisma/client');
const authguard = require('../services/authguard');

const sectorRouter = require('express').Router();
const prisma = new PrismaClient({ log: ['error'] });

///////////////////////////////////////////////// Ajouter Secteur //////////////////////////////////////////////////////

sectorRouter.post('/property/:propertyId/addSector', authguard, async (req, res) => {
    const { name, comment } = req.body;
    const propertyId = parseInt(req.params.propertyId);
    try {
        const sector = await prisma.sector.create({
            data: {
                name,
                comment,
                propertyId: propertyId
            }
        });
        req.flash('success', 'Secteur ajouté avec succès !');
        res.redirect('/property/' + propertyId);
    } catch (error) {
        req.flash('error', "Erreur lors de l'ajout du secteur");
        res.redirect('/property/' + propertyId);
    }
})

///////////////////////////////////////////////// Supprimer Secteur //////////////////////////////////////////////////////

sectorRouter.get('/deleteSector/:sectorId', authguard, async (req, res) => {
    const sectorId = parseInt(req.params.sectorId);
    try {
        const sector = await prisma.sector.findUnique({
            where: {
                id: sectorId
            }
        });
        const propertyId = sector.propertyId;
        const deleteSector = await prisma.sector.delete({
            where: {
                id: sectorId
            }
        });
        req.flash('success', 'Secteur supprimé avec succès !');
        res.redirect('/property/' + propertyId);
    } catch (error) {
        const flash = { error: "Erreur lors de la suppression du secteur." };
        res.render('pages/dashboard.html.twig', {
            isMainPage: true,
            title: "Dashboard",
            error,
            flash
        });
    }
})

////////////////////////////////////////// Modifier Secteur ////////////////////////////////////

sectorRouter.get('/editSector/:id', authguard, async (req, res) => {
    try {
        const sectorId = parseInt(req.params.id, 10);
        const sector = await prisma.sector.findUnique({
            where: {
                id: sectorId
            }
        });
        res.json(sector);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

sectorRouter.post('/editSector/:id', authguard, async (req, res) => {
    const sectorId = parseInt(req.params.id, 10);
    const { name, comment } = req.body;
    try {
        const sector = await prisma.sector.update({
            where: {
                id: sectorId
            },
            data: {
                name,
                comment
            }
        });
        const propertyId = sector.propertyId
        req.flash('success', 'Secteur modifié avec succés !');
        res.redirect('/property/' + propertyId)
    } catch (error) {
        res.render("pages/dashboard.html.twig", {error: error})
    }
})

////////////////////////////////////////// Drag and Drop ////////////////////////////////////

// sectorRouter.post('/update-order', authguard, async (req, res) => {
//     const { sectors } = req.body;

//     for (let i = 0; i < sectors.length; i++) {
//         await prisma.sector.update({
//             where: {
//                 id: sectors[i].id
//             },
//             data: {
//                 order:i
//             }
//         })       
//     }
//     res.json({ success: true });
// })

module.exports = sectorRouter;