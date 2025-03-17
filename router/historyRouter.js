const { PrismaClient } = require('@prisma/client');
const authguard = require('../services/authguard');

const historyRouter = require('express').Router();
const prisma = new PrismaClient({ log: ['error'] });

/////////////////////////////// Ajouter Historique ///////////////////////////////////////

historyRouter.post('/addHistory/:treeId', authguard, async (req, res) => {
    const { date, action } = req.body;
    const treeId = parseInt(req.params.treeId);
    try {
        const history = await prisma.history.create({
            data: {
                date: new Date(date),
                action,
                treeId: treeId
            }
        });
        req.flash('success', 'Historique ajouté avec succès !');
        res.redirect('/tree/' + treeId)
    } catch (error) {
        res.render('pages/treeDetail.html.twig', {
            isMainPage: true,
            title: "Détail de l'arbre",
            error
        });
    }
})

////////////////////////////// Supprimer Historique /////////////////////////////

historyRouter.get('/deleteHistory/:historyId', authguard, async (req, res)=>{
    const historyId = parseInt(req.params.historyId);
    try {
        const history = await prisma.history.findUnique({
            where: {
                id: historyId
            }
        });
        const treeId = history.treeId;
        const deleteHistory = await prisma.history.delete({
            where: {
                id: historyId
            }
        });
        req.flash('success', 'Historique supprimé avec succès !');
        res.redirect('/tree/' + treeId);
    } catch (error) {
        const flash = { error: "Erreur lors de la suppression de l'historique." };
        res.render('pages/treeDetail.html.twig', {
            isMainPage: true,
            title: "Détail de l'arbre",
            flash
        });
    }
})

module.exports = historyRouter;