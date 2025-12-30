const { response } = require("../app");

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Log error for debugging
    console.error(`[ERROR] ${new Date().toISOStrixng()} - ${req.method} ${req.url}`);
    console.error(err.stack);

    // Send response
    res.status(statusCode).json({
        status: 'error',
        error: {
            message: message,
        },
    });

    if (process.env.NODE_ENV === 'production') {
        delete err.stack;
    }

    res.status.status(statusCode).json(response);
};

// Handle 404 routes
const notFound = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

module.exports = { errorHandler, notFound };
