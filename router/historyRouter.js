const { PrismaClient } = require('@prisma/client');
const authguard = require('../services/authguard');

const historyRouter = require('express').Router();
const prisma = new PrismaClient({ log: ['error'] });

/////////////////////////////// Ajouter Historique ///////////////////////////////////////

historyRouter.post('/property/:propertyId/tree/:treeId/addHistory', authguard, async (req, res) => {
    const { date, action } = req.body;
    const propertyId = parseInt(req.params.propertyId);
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
        res.redirect('/property/' + propertyId + '/tree/' + treeId);
    } catch (error) {
        req.flash('error', "Erreur lors de l'ajout de l'historique!");
        res.redirect('/property/' + propertyId + '/tree/' + treeId);
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
        const deleteHistory = await prisma.history.delete({
            where: {
                id: historyId
            }
        });
        const tree = await prisma.tree.findUnique({
            where: { id: history.treeId }
        });
        req.flash('success', 'Historique supprimé avec succès !');
        res.redirect('/property/' + tree.propertyId + '/tree/' + history.treeId);
    } catch (error) {
        req.flash('error', "Erreur lors de la suppression de l'historique.");
        res.redirect('/');
    }
})

module.exports = historyRouter;