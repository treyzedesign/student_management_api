const http              = require('http');
const express           = require('express');
const cors              = require('cors');
const helmet            = require('helmet');
const rateLimit         = require('express-rate-limit');
const swaggerUi         = require('swagger-ui-express');
const swaggerSpecs      = require('../../swagger/swagger.config.js');
const app               = express();

module.exports = class UserServer {
    constructor({config, managers}){
        this.config        = config;
        this.userApi       = managers.userApi;
    }
    
    /** for injecting middlewares */
    use(args){
        app.use(args);
    }

    /** server configs */
    run(){
        // ===== Security Headers with Helmet =====
        app.use(helmet());

        // ===== Rate Limiting Configuration =====
        // General API rate limiter: 100 requests per 15 minutes
        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: 'Too many requests from this IP, please try again after 15 minutes',
            standardHeaders: true,
            legacyHeaders: false,
        });

        // Strict rate limiter for auth endpoints: 5 requests per 15 minutes
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 5,
            message: 'Too many login attempts, please try again after 15 minutes',
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: false,
        });

        // Very strict rate limiter for password change: 3 requests per 1 hour
        const passwordLimiter = rateLimit({
            windowMs: 60 * 60 * 1000,
            max: 3,
            message: 'Too many password change attempts, please try again after 1 hour',
            standardHeaders: true,
            legacyHeaders: false,
        });

        // ===== Core Middleware =====
        app.use(cors({origin: '*'}));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true}));
        app.use('/static', express.static('public'));

        // Apply general API rate limiter to all API routes
        app.use('/api/', apiLimiter);

        // ===== Specific Rate Limiters for Auth Routes =====
        // Stricter rate limiting for authentication endpoints
        app.post('/api/auth/login', authLimiter);
        app.post('/api/auth/registerSuperAdmin', authLimiter);
        app.post('/api/auth/registerSchoolAdmin', authLimiter);
        app.post('/api/auth/registerStudentUser', authLimiter);
        
        // Very strict rate limiting for sensitive operations
        app.post('/api/auth/changePassword', passwordLimiter);

        // Swagger UI Setup
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
            swaggerOptions: {
                urls: [
                    {
                        url: '/api-specs.json',
                        name: 'Swagger Spec'
                    }
                ],
                persistAuthorization: true
            }
        }));

        // API Specs endpoint
        app.get('/api-specs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpecs);
        });

        /** an error handler */
        app.use((err, req, res, next) => {
            console.error(err.stack)
            res.status(500).send('Something broke!')
        });
        
        /** a single middleware to handle all */
        app.all('/api/:moduleName/:fnName', this.userApi.mw);

        let server = http.createServer(app);
        server.listen(this.config.dotEnv.USER_PORT, () => {
            console.log(`${(this.config.dotEnv.SERVICE_NAME).toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`);
        });
    }
}