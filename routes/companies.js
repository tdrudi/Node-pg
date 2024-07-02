const express = require('express');
const ExpressError = require('../expressError');
const slugify = require('slugify');
const db = require('../db');
let router = express.Router();


//Get list of companies, return JSON
router.get('/', async function(req, res, next){
    try{
        const result = await db.query(`SELECT code, name FROM companies ORDER BY name`);
        return res.json({"companies": result.rows});
    }catch(err){
       return next(err);
    }
});

//JSON return company obj if exists, else 404 err
router.get('/:code', async function(req, res, next){
    try{
        let code = req.params.code;
        const codeSearch = await db.query(`SELECT code, name, description FROM companies WHERE code = $1`, [code]);
        
        //if company code doesnt exist
        if(codeSearch.rows.length === 0){
            throw new ExpressError(`Company does not exist: ${code}`, 404);
        }

        const invoiceSearch = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [code]);

        const company = codeSearch.rows[0];
        const invoices = invoiceSearch.rows;

        //Add invoices property by invoice id
        company.invoices = invoices.map(invoice => invoice.id);

        return res.json({"company": company});   
        
    }catch(err){
        return next(err);
    }
});

//Add new company
router.post('/', async function(req, res, next){
    try{
        let {name, description} = req.body;

        //company code -> lowercase name
        let code = slugify(name, {lower: true});

        const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING name, description`, [code, name, description]);
        return res.status(201).json({"company": result.rows[0]});

    }catch(err){
        return next(err);
    }
});

//Edit existing company, return 404 if company not found
router.put('/:code', async function(req, res, next){
    try{
        let {name, description} = req.body;
        let code = req.params.code;

        const result = await db.query(`UPDATE comapones SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code]);
        //if company code doesnt exist
        if(result.rows.length === 0){
            throw new ExpressError(`Company does not exist: ${code}`, 404);
        }else{
            return res.json({"company": result.rows[0]});   
        }
    }catch(err){
        return next(err);
    }
});

//Delete company, return 404 if company not found
router.delete('/:code', async function(req, res, next){
    try{
        let code = req.params.code;
        const result = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING code`, [code]);
        if(result.rows.length === 0){
            throw new ExpressError(`Company does not exist: ${code}`, 404);
        }else{
            return res.json({"stauts": "Company deleted."});   
        }
    }catch(err){
        return next(err);
    }
});

module.exports = router;