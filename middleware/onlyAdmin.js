module.exports = function onlyAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admins only' });
    }
    next();
  };