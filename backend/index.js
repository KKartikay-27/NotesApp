const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());

app.use(
    cors({
        origin: '*',
    })
);

app.get('/', (req,res) =>{
    res.json({data : "Hello" });
});

app.listen(8000);

module.exports = app;