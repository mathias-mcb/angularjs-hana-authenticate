module.exports = {
    entry: './index.js',
    output: {
        path: './build/',
        filename: 'index.js',
        publicPath: '/',
    },
    devServer: {
        contentBase: './',
        port: 9010,
        proxy: {
            "/sap/*": {
                target: "http://hanaone.sablono.com:8000/",
                secure: false,
                changeOrigin: true
            }
        }
    }
};