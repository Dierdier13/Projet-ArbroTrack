const { PrismaClient } = require('@prisma/client');
const authguard = require('../services/authguard');

const propertyRouter = require('express').Router();
const prisma = new PrismaClient({ log: ['error'] });
const fetch = require('node-fetch');

///////////////////////////////////////////////// Ajouter Propriété //////////////////////////////////////////////////////

propertyRouter.post('/addProperty', authguard, async (req, res) => {
    const { propertyName, adress, codePostal, city } = req.body;
    const isApi = req.query.api === 'true';

    try {
        let geodata = {};
        try {
            const searchQuery = `${adress}, ${codePostal} ${city}`;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&polygon_geojson=1&limit=1`);

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    const result = data[0];
                    geodata = {
                        latitude: parseFloat(result.lat),
                        longitude: parseFloat(result.lon),
                        polygon: JSON.stringify(result.geojson)
                    };
                }
            }
        } catch (geocodeError) {
            console.error('Erreur de géocodage:', geocodeError);
        }

        const property = await prisma.property.create({
            data: {
                propertyName,
                adress,
                codePostal: parseInt(codePostal),
                city,
                ...geodata,
                ownerId: req.session.user.id
            }
        });

        if (isApi) {
            const responseData = {
                ...property,
                coordinates: geodata.latitude ? { lat: geodata.latitude, lon: geodata.longitude } : null,
                polygon: geodata.polygon ? JSON.parse(geodata.polygon) : null
            };
            return res.status(201).json(responseData);
        }

        req.flash('success', 'Propriété créée avec succès !');
        res.redirect('/');

    } catch (error) {
        if (isApi) {
            res.status(500).json({
                error: error.message || 'Erreur lors de la création',
                ...(error.response && { details: error.response.data })
            });
        } else {
            req.flash('error', error.message || 'Erreur lors de la création');
            res.redirect('/');
        }
    }
});

///////////////////////////////////////////////// Supprimer Propriété //////////////////////////////////////////////////////

propertyRouter.get('/deleteProperty/:id', authguard, async (req, res) => {
    try {
        const deleteProperty = await prisma.property.delete({
            where: {
                id: parseInt(req.params.id),
                ownerId: req.session.user.id
            }
        });
        req.flash('success', 'Propriété supprimée avec succès !');
        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Erreur lors de la suppression de la propriété.');
        res.redirect('/');
    }
})


///////////////////////////////////////////////// Modifier Propriété //////////////////////////////////////////////////////

propertyRouter.get('/editProperty/:id', authguard, async (req, res) => {
    try {
        const propertyId = parseInt(req.params.id, 10);
        const property = await prisma.property.findUnique({
            where: {
                id: propertyId
            }
        });
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

propertyRouter.post('/editProperty/:id', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.id, 10);
    const { propertyName, adress, codePostal, city } = req.body;
    try {
        const property = await prisma.property.update({
            where: {
                id: propertyId
            },
            data: {
                propertyName,
                adress,
                codePostal: parseInt(codePostal),
                city
            }
        });
        req.flash('success', 'Propriété modifiée avec succés !');
        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Erreur lors de la modification de la propriété.');
        res.redirect('/');
    }
})

///////////////////////////////////////////////// Afficher Propriété //////////////////////////////////////////////////////

propertyRouter.get('/property/:id', authguard, async (req, res) => {
    const userId = req.session.user.id;
    const propertyId = parseInt(req.params.id);
    try {
        const [propertyCount, property] = await Promise.all([
            prisma.property.count({ where: { ownerId: userId } }),
            prisma.property.findUnique({
                where: { id: propertyId },
                include: {
                    sectors: {
                        include: {
                            _count: { select: { trees: true } }
                        }
                    },
                    trees: {
                        include: { sector: true }
                    },
                    _count: {
                        select: {
                            sectors: true,
                            trees: true
                        }
                    }
                }
            })
        ]);
        if (!property) {
            return res.status(404).send('Property not found');
        }
        const sectorTreeCountsMap = Object.fromEntries(
            property.sectors.map(sector => [sector.id, sector._count.trees])
        );
        res.render('pages/dashboard.html.twig', {
            isMainPage: true,
            title: "Dashboard",
            user: req.session.user,
            property,
            propertyId: property.id,
            sectors: property.sectors,
            trees: property.trees,
            previousUrl: req.session.previousUrl || '/',
            propertyCount,
            sectorCount: property._count.sectors,
            treeCount: property._count.trees,
            sectorTreeCountsMap
        });
    } catch (error) {
        console.error('Erreur lors du chargement de la page propriété:', error);
        res.status(500).json({ 
            error: 'Erreur lors du chargement de la propriété',
            details: error.message 
          });
    }
});

///////////////////////////////////////////////// Recherche dans la Propriété ////////////////////////////////////////////////

propertyRouter.get('/property/:propertyId/search', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    const searchTerm = req.query.search;
    if (!searchTerm || searchTerm.trim() === '') {
        return res.redirect('/property/' + propertyId);
    }
    try {
        const [trees, sectors] = await Promise.all([
            prisma.tree.findMany({
                where: {
                    propertyId: propertyId,
                    OR: [
                        { specy: { contains: searchTerm } },
                        { sector: { sectorName: { contains: searchTerm } } }
                    ]
                },
                include: { sector: true }
            }),
            prisma.sector.findMany({
                where: {
                    propertyId: propertyId,
                    OR: [
                        { sectorName: { contains: searchTerm } },
                        { comment: { contains: searchTerm } }
                    ],
                },
            })
        ])
        res.render('pages/dashboard.html.twig', {
            isMainPage: true,
            title: "Dashboard",
            user: req.session.user,
            propertyId: propertyId,
            trees: trees,
            sectors: sectors,
            searchTerm: searchTerm || ''
        });
    } catch (error) {
        req.flash('error', "Erreur lors de la recherche d'arbres et de secteurs.")
        res.redirect('/property/' + propertyId)
    }
})

///////////////////////////////////////////////// Afficher liste Arbre //////////////////////////////////////////////////////

propertyRouter.get('/property/:propertyId/treeList', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    try {
        const [trees, user, property] = await Promise.all([
            prisma.tree.findMany({
                where: {
                    propertyId: propertyId
                },
                include: {
                    sector: true,
                    property: true,
                    images: true,
                    comments: true,
                    histories: true
                }
            }),
            prisma.user.findUnique({
                where: {
                    id: req.session.user.id
                }, include: {
                    properties: true
                }
            }),
            prisma.property.findUnique({
                where: { id: propertyId },
                include: { sectors: true }
            })
        ])

        // const formattedHistories = trees.histories.map(history => ({
        //     ...history,
        //     formattedDate: new Date(history.date).toLocaleDateString('fr-FR', {
        //         day: '2-digit',
        //         month: '2-digit',
        //         year: 'numeric'
        //     })
        // }));

        res.render('pages/treeList.html.twig', {
            isMainPage: true,
            title: "Arbotrack - Liste des arbres",
            user,
            property,
            propertyId: property.id,
            sectors: property.sectors,
            trees: trees,
            previousUrl: req.session.previousUrl || '/',
            images: trees.images,
            comments: trees.comments,
            // histories: formattedHistories
        });
    } catch (error) {
        console.error("Erreur lors de la page Liste des arbres:", error);
        res.status(500).send("Erreur lors de la page Liste des arbres.");
    }
})

///////////////////////////////////////////////// Recherche dans treeList ///////////////////////////////////////////////////////////////

propertyRouter.get('/property/:propertyId/treeList/search', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    const searchTerm = req.query.search;
    if (!searchTerm || searchTerm.trim() === '') {
        return res.redirect('/property/' + propertyId + '/treeList');
    }
    try {
        const [trees, user, property] = await Promise.all([
            prisma.tree.findMany({
                where: {
                    propertyId: propertyId,
                    OR: [
                        { specy: { contains: searchTerm } },
                        { sector: { sectorName: { contains: searchTerm } } },
                        { comments: { some: { comment: { contains: searchTerm } } } },
                        { histories: { some: { action: { contains: searchTerm } } } }
                    ]
                },
                include: {
                    sector: true,
                    property: true,
                    images: true,
                    comments: true,
                    histories: true
                }
            }),
            prisma.user.findUnique({
                where: {
                    id: req.session.user.id
                }, include: {
                    properties: true
                }
            }),
            prisma.property.findUnique({
                where: { id: propertyId },
                include: { sectors: true }
            })
        ])
        if (!user || !property) {
            throw new Error("User or Property not found");
        }
        res.render('pages/treeList.html.twig', {
            isMainPage: true,
            title: "Liste des arbres",
            user,
            property,
            propertyId: property.id,
            sectors: property.sectors,
            trees: trees,
            previousUrl: req.session.previousUrl || '/',
            images: trees.images,
            comments: trees.comments,
            searchTerm: searchTerm || ''
        });
    } catch (error) {
        console.error("Erreur lors de la recherche d'arbres et de secteurs:", error);
        res.status(500).send("Erreur lors de la recherche d'arbres et de secteurs");
    }
})

///////////////////////////////////////////////// Afficher liste Arbre d'un secteur //////////////////////////////////////////////////////

propertyRouter.get('/property/:propertyId/sector/:sectorId', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    const sectorId = parseInt(req.params.sectorId);
    try {
        const [user, property, sectors, sector, trees] = await Promise.all([
            prisma.user.findUnique({
                where: {
                    id: req.session.user.id
                }, include: {
                    properties: true
                }
            }),
            prisma.property.findUnique({
                where: {id: propertyId}
            }),
            prisma.sector.findMany({
                where: { propertyId: propertyId }
            }),
            prisma.sector.findUnique({
                where: { id: sectorId }
            }),
            prisma.tree.findMany({
                where: {
                    propertyId: propertyId,
                    sectorId: sectorId
                },
                include: {
                    sector: true,
                    property: true,
                    images: true,
                    comments: true,
                    histories: true
                }
            })
        ])
        res.render('pages/sectorDetail.html.twig', {
            isMainPage: true,
            title: "Arbotrack - Détail secteur",
            user,
            property,
            sector,
            sectors,
            trees: trees,
            previousUrl: req.session.previousUrl || '/',
            images: trees.images,
            comments: trees.comments,
        });
    } catch (error) {
        console.error("Erreur lors de la page détail du secteur:", error);
        res.status(500).send("Erreur lors de la page détail du secteur.");
    }
})

///////////////////////////////////////////////// Recherche dans Secteur ///////////////////////////////////////////////////////////////

propertyRouter.get('/property/:propertyId/sector/:sectorId/search', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    const sectorId = parseInt(req.params.sectorId);
    const searchTerm = req.query.search;
    if (!searchTerm || searchTerm.trim() === '') {
        return res.redirect('/property/' + propertyId + '/sector/' + sectorId);
    }
    try {
        const [trees, user, property, sector, sectors] = await Promise.all([
            prisma.tree.findMany({
                where: {
                    sectorId: sectorId,
                    OR: [
                        { specy: { contains: searchTerm } },
                        { sector: { sectorName: { contains: searchTerm } } },
                        { comments: { some: { comment: { contains: searchTerm } } } },
                        { histories: { some: { action: { contains: searchTerm } } } }
                    ]
                },
                include: {
                    sector: true,
                    property: true,
                    images: true,
                    comments: true,
                    histories: true
                }
            }),
            prisma.user.findUnique({
                where: {
                    id: req.session.user.id
                }, include: {
                    properties: true
                }
            }),
            prisma.property.findUnique({
                where: { id: propertyId },
                include: { sectors: true }
            }),
            prisma.sector.findUnique({
                where: { id: sectorId },
            }),
            prisma.sector.findMany({
                where: { propertyId: propertyId }
            })
        ])
        if (!user || !property) {
            throw new Error("User or Property not found");
        }
        res.render('pages/sectorDetail.html.twig', {
            isMainPage: true,
            title: "Arbotrack - Détail secteur",
            user,
            sector,
            sectorId: sectorId,
            sectors,
            property,
            propertyId: propertyId,
            trees: trees,
            previousUrl: req.session.previousUrl || '/',
            images: trees.images,
            comments: trees.comments,
            searchTerm: searchTerm || ''
        });
    } catch (error) {
        console.error("Erreur lors de la recherche d'arbres:", error);
        res.status(500).send("Erreur lors de la recherche d'arbres");
    }
})

/////////////////////////////////// Afficher arbre dans Map2 //////////////////////////////

propertyRouter.get('/property/:propertyId/trees', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);

    const trees = await prisma.tree.findMany({
        where: {
            propertyId: propertyId,
            latitude: {
                not: null
            },
            longitude: {
                not: null
            }
        },
        select: {
            id: true,
            specy: true,
            latitude: true,
            longitude: true
        }
    });

    res.json(trees);
});

/////////////////////////////////// Afficher arbre dans Map3 //////////////////////////////

propertyRouter.get('/property/:propertyId/sector/:sectorId/trees', authguard, async (req, res) => {
    const propertyId = parseInt(req.params.propertyId);
    const sectorId = parseInt(req.params.sectorId)

    const trees = await prisma.tree.findMany({
        where: {
            propertyId: propertyId,
            sectorId: sectorId,
            latitude: {
                not: null
            },
            longitude: {
                not: null
            }
        },
        select: {
            id: true,
            specy: true,
            latitude: true,
            longitude: true
        }
    });

    res.json(trees);
});

module.exports = propertyRouter;