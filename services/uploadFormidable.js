const formidable = require('formidable');
const path = require('path');

function uploadMiddleware(options = {}) {
    return (req, res, next) => {
        const form = new formidable.IncomingForm({
            multiples: true,
            keepExtensions: true,
            uploadDir: options.uploadDir || path.join(__dirname, '..', 'uploads'),
            maxTotalFileSize: 25 * 1024 * 1024,
            maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
            filter: (part) => {
                const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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
                    req.body[key] = fields[key][0];
                } else {
                    req.body[key] = fields[key];
                }
            }
            req.files = files;
            if (files.avatar && Array.isArray(files.avatar)) {
                req.files.avatar = files.avatar[0];
            }
            next();
        });
    };
};

module.exports = uploadMiddleware;