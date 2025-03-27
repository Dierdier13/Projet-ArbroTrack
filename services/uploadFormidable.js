const formidable = require('formidable');
const path = require('path');

function uploadMiddleware(options = {}) {
    return (req, res, next) => {
        const form = new formidable.IncomingForm({
            multiples: true,
            keepExtensions: true,
            uploadDir: options.uploadDir || path.join(__dirname, '..', 'uploads'),
            maxFileSize:  options.maxFileSize || 5 * 1024 * 1024,
            filter: (part) => {
                const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(part.mimetype)) {
                    console.error(`Type MIME non autorisé : ${part.mimetype}`);
                    return false;
                }
                return true;
            },
            ...options
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error("Erreur lors du traitement du formulaire :", err);
                return res.status(400).json({ error: "Erreur lors du traitement du formulaire." });
            }

            for (const key in fields) {
                if (Array.isArray(fields[key])) {
                    // Si le champ est un tableau, on prend le premier élément
                    req.body[key] = fields[key][0];
                } else {
                    // Sinon, on assigne la valeur directement
                    req.body[key] = fields[key];
                }
            }
            req.files = files;
            if (files.avatar && Array.isArray(files.avatar)) {
                req.files.avatar = files.avatar[0]; // Prend le premier fichier si c'est un tableau
            }
            next();
        });
    };
};

module.exports = uploadMiddleware;