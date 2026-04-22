import './config/config';
import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import appRouter from './app/app';
import { CorsConfig } from './app/types/config.types';

const app: Application = express();

const corsConfig: CorsConfig = {
    origin: process.env.NODE_ENV === 'production' ? [
        process.env.FRONTEND_URL!,
    ] : '*',
    methods: 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
    credentials: true,
    maxAge: 86400
};

app.use(cors(corsConfig));
app.use(helmet());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', appRouter);

export default app;
