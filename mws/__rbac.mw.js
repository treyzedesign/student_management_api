module.exports = ({ meta, config, managers }) => {
    return ({ req, res, next }) => {
        // Check for token in both 'token' header and 'authorization' header
        let token = req.headers.token;
        
        // If no token header, check authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            // Handle various authorization header formats
            if (authHeader.startsWith('Bearer bearer ')) {
                token = authHeader.substring(13); // Remove "Bearer bearer " prefix
            } else if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove "Bearer " prefix
            } else if (authHeader.startsWith('bearer ')) {
                token = authHeader.substring(7); // Remove "bearer " prefix
            } else {
                token = authHeader; // Use the whole header if no Bearer prefix
            }
        }

        if (!token) {
            console.log('token required but not found');
            return managers.responseDispatcher.dispatch(res, { ok: false, code: 401, errors: 'Unauthorized: Token required' });
        }

        let decoded = null;
        try {
            decoded = managers.token.verifyShortToken({ token: token });
            if (!decoded) {
                console.log('failed to decode token');
                return managers.responseDispatcher.dispatch(res, { ok: false, code: 401, errors: 'Unauthorized: Invalid token' });
            }
        } catch (err) {
            console.log('error decoding token:', err.message);
            return managers.responseDispatcher.dispatch(res, { ok: false, code: 401, errors: 'Unauthorized: Token verification failed' });
        }

        // Add user info to request for use in managers
        req.__longToken = decoded;

        // Pass the decoded token to the manager
        next(decoded);
    };
};
