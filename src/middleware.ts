import { verifyToken } from "./auth";
import { Request, Response, NextFunction } from "express";

export function verifyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    let token =
        req.method === "POST" ? req.headers.Authorization : req.query.token;

    verifyToken(token)
        // @ts-ignore
        .then((decodedToken: { data: any }) => {
            req.user = decodedToken.data;
            next();
        })
        .catch((err: Error) => {
            res.status(400);
            res.json({ message: "Invalid auth token." });
        });
}
