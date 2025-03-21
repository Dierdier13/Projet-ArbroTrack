const { PrismaClient } = require('@prisma/client');
const hashPasswordExtension = require('../services/extensions/hashPasswordExtension');
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const sharp = require('sharp');
const authguard = require('../services/authguard');
const upload = require('../services/uploadConfig');

const userRouter = require('express').Router();

const prisma = new PrismaClient({ log: ['error'] }).$extends(hashPasswordExtension);

///////////////////////////////////////////////// Afficher page Connexion //////////////////////////////////////////////////////

userRouter.get('/login', async (req, res) => {
    try {
        const user = await prisma.user.findMany();
        res.render('pages/login.html.twig', { title: "Connexion - ArboTrack", isMainPage: false });
    } catch (error) {
        console.error('Erreur lors du chargement de la page de connexion:', error);
        res.status(500).send('Une erreur est survenue. Veuillez réessayer plus tard.');
    }
})

///////////////////////////////////////////////// Afficher page Inscription //////////////////////////////////////////////////////

userRouter.get('/register', (req, res) => {
    res.render('pages/register.html.twig', { title: "Inscription - ArboTrack", isMainPage: false });
})

///////////////////////////////////////////////// S'Enregistrer //////////////////////////////////////////////////////

userRouter.post('/register', upload.single('avatar'), async (req, res) => {

    const { name, firstname, mail, password, confirmpassword } = req.body;
    let avatarPath = null;

    try {
        if (!name || !firstname || !mail || !password || !confirmpassword) {
            throw ({ fields: "Tous les champs doivent être remplis" });
        }
        if (password != confirmpassword) {
            throw ({ confirmPassword: "Le mot de passe ne corresponde pas" });
        }
        const existingUser = await prisma.user.findUnique({
            where: { mail }
        });
        if (existingUser) {
            throw ({ mail: "Ce mail est déjà utilisé" });
        }
        if (req.file) {
            const outputFilename = `optimized-${path.basename(req.file.path, path.extname(req.file.path))}.webp`;
            const outputPath = path.join('uploads', outputFilename);

            await sharp(req.file.path)
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 80 })
                .toFile(outputPath);

            fs.unlinkSync(req.file.path);
            avatarPath = outputPath;
        }
        console.log(avatarPath);
        const user = await prisma.user.create({
            data: {
                name,
                firstname,
                mail,
                password,
                avatar: avatarPath
            }
        });

        req.flash('success', 'Compte créé avec succès !');
        res.redirect('/login');

    } catch (error) {
        console.error("Erreur lors de la création du compte :", error);
        if (avatarPath && fs.existsSync(avatarPath)) {
            fs.unlinkSync(avatarPath);
        }
        const flash = { error: "Erreur lors de la création du compte." };
        res.render('pages/register.html.twig', {
            title: "Inscription - ArboTrack",
            error,
            flash,
            name,
            firstname,
            mail,
            avatar: avatarPath
        });
    }

})

///////////////////////////////////////////////// Supprimer User //////////////////////////////////////////////////////

userRouter.get('/deleteUser/:id', authguard, async (req, res) => {
    try {
        const deleteUser = await prisma.user.delete({
            where: {
                id: parseInt(req.session.user.id)
            }
        });
        if (deleteUser && deleteUser.avatar) {
            const oldAvatarPath = path.join(process.cwd(), deleteUser.avatar);
            fs.unlink(oldAvatarPath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error("Erreur lors de la suppression de l'ancien avatar :", err);
                }
            });
        }
        req.flash('success', 'Compte supprimé avec succès !');
        res.redirect('/login');
    } catch (error) {
        res.render('pages/profil.html.twig', {
            error: error,
            messages: req.flash('error'),
            isMainPage: true
        });
    }
})

///////////////////////////////////////////////// Se Connecter //////////////////////////////////////////////////////

userRouter.post('/login', async (req, res) => {
    const { mail, password } = req.body;
    try {
        if (!mail || !password) {
            throw { fields: "Tous les champs doivent être remplis" };
        }
        const user = await prisma.user.findUnique({
            where: { mail }
        });
        if (user) {
            if (await bcrypt.compare(req.body.password, user.password)) {
                req.session.user = user;
                req.flash('success', 'Connecté avec succès !');
                res.redirect('/');
            } else throw ({ password: "Mot de passe incorrect" });
        } else throw ({ mail: "Mail inconnue" });
    } catch (error) {
        const flash = { error: "Erreur lors de la connexion au compte." };
        res.render('pages/login.html.twig', {
            title: "Connexion - ArboTrack",
            error,
            flash,
            mail
        });
    }
})

///////////////////////////////////////////////// Afficher page Accueil //////////////////////////////////////////////////////

userRouter.get('/', authguard, async (req, res) => {
    const searchTerm = req.query.search;
    const isJson = req.query.format === 'json';

    try {
        let properties = [];
        let isSearch = false;

        if (searchTerm) {
            isSearch = true;
            properties = await prisma.property.findMany({
                where: {
                    ownerId: req.session.user.id,
                    OR: [
                        { name: { contains: searchTerm } },
                        { adress: { contains: searchTerm } },
                        { city: { contains: searchTerm } }
                    ],
                },
            });
        } else {
            const user = await prisma.user.findUnique({
                where: { id: req.session.user.id },
                include: { properties: true }
            });
            properties = user.properties;
        }

        const propertiesWithGeo = properties.map(p => ({
            ...p,
            polygon: p.polygon ? JSON.parse(p.polygon) : null,
            coordinates: { lat: p.latitude, lng: p.longitude }
        }));

        if (isJson) {
            res.json({
                count: properties.length,
                isSearch,
                searchTerm: searchTerm || '',
                properties: propertiesWithGeo
            });
        } else {
            res.render('pages/index.html.twig', {
                isMainPage: true,
                isPropertyPage: true,
                title: "Property choice",
                user: req.session.user,
                properties: properties,
                isSearch: isSearch,
                searchTerm: searchTerm || ''
            });
        }

    } catch (error) {
        if (isJson) {
            res.status(500).json({
                error: "Erreur lors de la récupération",
                details: error.message
            });
        } else {
            console.error('Erreur:', error);
            res.status(500).send("Erreur lors de la récupération des propriétés");
        }
    }
});


///////////////////////////////////////////////// Se Déconnecter //////////////////////////////////////////////////////

userRouter.get('/logout', authguard, async (req, res) => {
    try {
        req.session.destroy();
    } catch (error) {
        res.render('pages/index.html.twig', {
            title: "Property choise",
            user: req.session.user,
            properties: user.properties
        });
    }
    res.redirect('/login');
})

///////////////////////////////////////////////// Afficher Profil User //////////////////////////////////////////////////////

userRouter.get('/profil/:id', authguard, async (req, res) => {
    const propertyCount = await prisma.property.count();
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.session.user.id
            },
            include: {
                properties: true
            }
        });
        res.render('pages/profil.html.twig', {
            title: "Profil utilisateur - ArboTrack",
            user,
            properties: user.properties,
            isMainPage: true,
            isPropertyPage: true,
            propertyCount: propertyCount
        });

    } catch (error) {
        req.flash('error', "Erreur lors de l'affichage du profil.")
        res.redirect('/');
    }
})
///////////////////////////////////////////////// Modifier Profil User //////////////////////////////////////////////////////

userRouter.post('/editUser/:id', authguard, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { name, firstname, mail } = req.body;
    try {
        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                name,
                firstname,
                mail,
            }
        })
        req.flash('success', 'Profil modifié avec succés !')
        res.redirect('/profil/' + userId);
    } catch (error) {
        req.flash('error', 'Erreur lors de la modification du profil.')
        res.redirect('/profil/' + userId);
    }
})

///////////////////////////////////////////////// Modifier Avatar User //////////////////////////////////////////////////////

userRouter.post('/editAvatarUser/:id', authguard, upload.single('avatar'), async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    let avatarPath = null;

    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatar: true }
        });

        if (currentUser?.avatar) {
            const oldAvatarPath = path.resolve(__dirname, '..', currentUser.avatar);
            
            try {
              await fs.promises.access(oldAvatarPath, fs.constants.F_OK);
              await fs.promises.unlink(oldAvatarPath);
            } catch (err) {
              if (err.code !== 'ENOENT') { // Ignore si fichier non trouvé
                console.error("Erreur suppression avatar :", err);
              }
            }
          }

        if (req.file) {
            const outputFilename = `avatar-${userId}-${Date.now()}.webp`;
            const uploadsDir = path.join(__dirname, '..', 'uploads');
            avatarPath = path.join('uploads', outputFilename);
            const outputPath = path.join(uploadsDir, outputFilename);

            await sharp(req.file.path)
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 80 })
                .toFile(outputPath);

            fs.unlinkSync(req.file.path);
        }
        await prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarPath }
        });
        req.flash('success', 'Avatar modifié avec succès !');
        res.redirect(`/profil/${userId}`);
    } catch (error) {
        console.error("Erreur complète :", error);
        req.flash('error', `Échec de la modification : ${error.message}`);
        res.redirect(`/profil/${userId}`);
    }
});

module.exports = userRouter