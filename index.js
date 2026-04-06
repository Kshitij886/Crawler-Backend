import express, { json } from 'express';
import cors from 'cors';
import routs from './src/routes/findings.route.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(json());

app.use('/api/', routs)

app.listen(PORT, () => {
    console.log(`Server is listining to the port ${PORT}`)
})