process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jewellery_erp_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
