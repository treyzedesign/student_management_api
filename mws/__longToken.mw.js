module.exports = ({ meta, config, managers }) =>{
    return ({req, res, next})=>{
        console.log('=== LONG TOKEN MIDDLEWARE DEBUG ===');
        console.log('Headers:', req.headers);
        
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
        
        console.log('Token provided:', token ? 'YES' : 'NO');
        console.log('Token source:', req.headers.token ? 'token header' : (req.headers.authorization ? 'authorization header' : 'none'));
        
        if(!token){
            console.log('token required but not found')
            return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
        }
        let decoded = null;
        try {
            console.log('Attempting to verify long token...');
            decoded = managers.token.verifyLongToken({token: token});
            console.log('Token verification result:', decoded ? 'SUCCESS' : 'FAILED');
            console.log('Decoded token data:', decoded);
            if(!decoded){
                console.log('failed to decode-1')
                return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
            };
        } catch(err){
            console.log('failed to decode-2 with error:', err.message);
            console.log('Error stack:', err.stack);
            return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
        }
        console.log('=== END LONG TOKEN DEBUG ===');
        next(decoded);
    }
}