import { verifyToken } from './auth';

export function verifyMiddleware(req, res, next) {
    let token = req.method === 'POST' ? req.headers.Authorization : req.query.token;

    verifyToken(token)
        .then((decodedToken) => {
            req.user = decodedToken.data;
            next();
        })
        .catch((err) => {
            res.status(400);
            res.json({ message: 'Invalid auth token.' });
        });
}
