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



        // ===== Core Middleware =====
        app.use(cors({origin: '*'}));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true}));
        app.use('/static', express.static('public'));

  

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