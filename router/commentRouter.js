const { PrismaClient } = require('@prisma/client');
const authguard = require('../services/authguard');

const commentRouter = require('express').Router();
const prisma = new PrismaClient({ log: ['error'] });

/////////////////////////////// Ajouter Commentaire ///////////////////////////////////////

commentRouter.post('/property/:propertyId/tree/:treeId/addComment', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    const treeId = parseInt(req.params.treeId);
    try {
        const comment = await prisma.comment.create({
            data: {
                comment: req.body.comment,
                treeId: treeId
            }
        });
        req.flash('success', 'Commentaire ajouté avec succès !');
        res.redirect('/property/' + propertyId + '/tree/' + treeId);
    } catch (error) {
        req.flash('error', "Erreur lors de l'ajout du commentaire!");
        res.redirect('/property/' + propertyId + '/tree/' + treeId);
    }
})

////////////////////////////// Supprimer Historique /////////////////////////////

commentRouter.get('/deleteComment/:commentId', authguard, async (req, res)=>{
    const commentId = parseInt(req.params.commentId);
    try {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId
            }
        });
        const deleteComment = await prisma.comment.delete({
            where: {
                id: commentId
            }
        });
        const tree = await prisma.tree.findUnique({
            where: { id: comment.treeId }
        });
        req.flash('success', 'Commentaire supprimé avec succès !');
        res.redirect('/property/' + tree.propertyId + '/tree/' + comment.treeId);
    } catch (error) {
        req.flash('error', 'Erreur lors de la suppression du commentaire.');
        res.redirect('/');
    }
})

module.exports = commentRouter;