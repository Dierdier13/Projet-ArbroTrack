const { PrismaClient } = require('@prisma/client');
const authguard = require('../services/authguard');

const commentRouter = require('express').Router();
const prisma = new PrismaClient({ log: ['error'] });

/////////////////////////////// Ajouter Commentaire ///////////////////////////////////////

commentRouter.post('/addComment/:treeId', authguard, async (req, res) => {
    const treeId = parseInt(req.params.treeId);
    try {
        const comment = await prisma.comment.create({
            data: {
                comment: req.body.comment,
                treeId: treeId
            }
        });
        req.flash('success', 'Commentaire ajouté avec succès !');
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

commentRouter.get('/deleteComment/:commentId', authguard, async (req, res)=>{
    const commentId = parseInt(req.params.commentId);
    try {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId
            }
        });
        const treeId = comment.treeId;
        const deleteComment = await prisma.comment.delete({
            where: {
                id: commentId
            }
        });
        req.flash('success', 'Commentaire supprimé avec succès !');
        res.redirect('/tree/' + treeId);
    } catch (error) {
        const flash = { error: "Erreur lors de la suppression du commentaire." };
        res.render('pages/treeDetail.html.twig', {
            isMainPage: true,
            title: "Détail de l'arbre",
            flash
        });
    }
})

module.exports = commentRouter;