module.exports = (defaultLimit = 10, maxLimit = 100) => {
    return (req, res, next) => {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || defaultLimit, maxLimit);
        const offset = (page - 1) * limit;

        req.pagination = { page, limit, offset };
        next();
    };
};
