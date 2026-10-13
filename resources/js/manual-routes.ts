import * as autoRoutes from './routes';
import company from './routes/company';
import admin from './routes/admin';
import pos from './routes/pos';
import roles from './routes/roles';
import permissions from './routes/permissions';

const routes = {
    ...autoRoutes,
    company,
    admin,
    pos,
    roles,
    permissions
};

export default routes;
