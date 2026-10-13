import * as autoRoutes from './routes';
import admin from './routes/admin';
import api from './routes/api';
import appearance from './routes/appearance';
import company from './routes/company';
import cookie from './routes/cookie';
import email from './routes/email';
import login from './routes/login';
import media from './routes/media';
import password from './routes/password';
import permissions from './routes/permissions';
import profile from './routes/profile';
import register from './routes/register';
import roles from './routes/roles';
import sections from './routes/sections';
import settings from './routes/settings';
import storage from './routes/storage';
import twoFactor from './routes/two-factor';
import userPassword from './routes/user-password';
import users from './routes/users';
import verification from './routes/verification';

const routes = {
    ...autoRoutes,
    admin,
    api,
    appearance,
    company,
    cookie,
    email,
    login,
    media,
    password,
    permissions,
    profile,
    register,
    roles,
    sections,
    settings,
    storage,
    'two-factor': twoFactor,
    twoFactor,
    'user-password': userPassword,
    userPassword,
    users,
    verification,
};

export default routes;
