const express = require('express');
const router = express.Router();
const { Like, Polls, Comment } = require('../models');

const checkPollExists = async (req, res, next) => {
    try {
        const { pollId } = req.params;
        const poll = await Polls.findByPk(pollId);
        if (!poll) {
            return res.status(404).json({ error: 'Poll not found.' });
        }
        req.poll = poll; 
        next();
    } catch (error) {
        console.error('Error checking poll existence:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const checkCommentExists = async (req, res, next) => {
    try {
        const { commentId } = req.params; // Comment ID comes from params for comment-specific routes
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }
        req.comment = comment;
        next();
    } catch (error) {
        console.error('Error checking comment existence:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

router.post('/:pollId', checkPollExists, async (req, res) => {
    const { pollId } = req.params;
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        const existingLike = await Like.findOne({
            where: {
                userId: userId,
                pollId: pollId,
                commentId: null
            }
        });

        if (existingLike) {
            if (existingLike.isLiked === false) {
                await existingLike.update({ isLiked: true });
                return res.status(200).json({ message: 'Poll liked successfully.', liked: true });
            } else {
                await existingLike.update({ isLiked: false });
                return res.status(200).json({ message: 'Poll unliked successfully.', liked: false });
            }
        } else {
            const newLike = await Like.create({
                userId: userId,
                pollId: pollId,
                commentId: null,
                isLiked: true 
            });
            return res.status(201).json({ message: 'Poll liked successfully.', liked: true, like: newLike });
        }
    } catch (error) {
        console.error('Error toggling poll like:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ error: 'Conflict: User already liked this poll (or unliked it too fast).' });
        }
        res.status(500).json({ error: 'Failed to toggle poll like.' });
    }
});

router.get('/:pollId/status', checkPollExists, async (req, res) => {
    const { pollId } = req.params;
    const userId = req.user.id;

    try {
        const like = await Like.findOne({
            where: {
                userId: userId,
                pollId: pollId,
                commentId: null,
                isLiked: true 
            }
        });

        if (like) {
            return res.status(200).json({ liked: true });
        } else {
            return res.status(200).json({ liked: false });
        }
    } catch (error) {
        console.error('Error fetching poll like status:', error);
        res.status(500).json({ error: 'Failed to fetch poll like status.' });
    }
});

router.get('/:pollId/count', checkPollExists, async (req, res) => {
    const { pollId } = req.params;

    try {
        const likeCount = await Like.count({
            where: {
                pollId: pollId,
                commentId: null,
                isLiked: true 
            }
        });
        return res.status(200).json({ pollId: pollId, likes: likeCount });
    } catch (error) {
        console.error('Error fetching poll like count:', error);
        res.status(500).json({ error: 'Failed to fetch poll like count.' });
    }
});

router.post('/comment/:commentId', checkCommentExists, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        let existingLike = await Like.findOne({
            where: {
                userId: userId,
                commentId: commentId,
                pollId: null
            }
        });

        if (existingLike) {
            if (existingLike.isLiked === false) {
                await existingLike.update({ isLiked: true });
                return res.status(200).json({ message: 'Poll liked successfully.', liked: true });
            } else {
                await existingLike.update({ isLiked: false });
                return res.status(200).json({ message: 'Poll unliked successfully.', liked: false });
            }
        } else {
            const newLike = await Like.create({
                userId: userId,
                commentId: commentId,
                pollId: null,
                isLiked: true
            });
            return res.status(201).json({ message: 'Comment liked successfully.', liked: true, like: newLike });
        }
    } catch (error) {
        console.error('Error toggling comment like:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ error: 'Conflict: An active like record already exists for this user and comment.' });
        }
        if (error.name === 'SequelizeValidationError' && error.errors && error.errors.some(e => e.message.includes('either a comment or a poll, but not both'))) {
            return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Failed to toggle comment like.' });
    }
});

router.get('/comment/:commentId/status', checkCommentExists, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    try {
        const like = await Like.findOne({
            where: { userId: userId, commentId: commentId, pollId: null, isLiked: true }
        });
        res.status(200).json({ liked: !!like });
    } catch (error) {
        console.error('Error fetching comment like status:', error);
        res.status(500).json({ error: 'Failed to fetch comment like status.' });
    }
});

router.get('/comment/:commentId/count', checkCommentExists, async (req, res) => {
    const { commentId } = req.params;
    try {
        const likeCount = await Like.count({
            where: { commentId: commentId, pollId: null, isLiked: true }
        });
        res.status(200).json({ commentId: commentId, likes: likeCount });
    } catch (error) {
        console.error('Error fetching comment like count:', error);
        res.status(500).json({ error: 'Failed to fetch comment like count.' });
    }
});

module.exports = router;