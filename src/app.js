require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');

const siteRoutes = require('./routes/site.routes');
const adminRoutes = require('./routes/admin.routes');
const apiRoutes = require('./routes/api.routes');
const { paginaNaoEncontrada, tratarErro } = require('./middlewares/error-handler');

const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// O padrao do helmet e' mantido de proposito — inclusive script-src 'self', que
// e' o que impede script de terceiro na pagina. A unica abertura e' img-src para
// os ladrilhos do OpenStreetMap, que o mapa de /servicos busca no dominio deles
// (RF29). O Leaflet em si e' servido por nos, de src/public/vendor.
const diretivasCsp = {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    'img-src': ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
};

app.use(helmet({ contentSecurityPolicy: { directives: diretivasCsp } }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 2,
        },
    })
);

app.use('/', siteRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

app.use(paginaNaoEncontrada);
app.use(tratarErro);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

module.exports = app;
