const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');
let router = express.Router();


//Return invoice info
router.get('/', async function(req, res, next){
    try{

        const result = await db.query(`SELECT id, comp_code FROM invoices ORDER BY id`);
        return res.json({"invoices": result.rows});

    }catch(err){
       return next(err);
    }
});

//Return object on specific invoice, 404 if doesnt exist, returns json
router.get('/:id', async function(req, res, next){
    try{
        let id = req.params.id;
        const result = await db.query(`SELECT inv.id, inv.comp_code, inv.amt, inv.paid, inv.add_date, inc.paid_date, comp.name, comp. description 
            FROM invoices AS inv INNER JOIN companies AS comp on (inv.comp_code = comp.code) WHERE id=$1`, [id]);

        //Invoice doesnt exist
        if(result.rows.length === 0){
            throw new ExpressError(`Invoice does not exist: ${id}`, 404);
        }
        return res.json({"invoice": result.rows});
    }catch(err){
       return next(err);
    }
});

//Adds an invoice returns json
router.post('/', async function(req, res, next){
    try{
        let {comp_code, amt} = req.body;
        const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.json({"invoice": result.rows[0]});

    }catch(err){
       return next(err);
    }
});

//Update invoice returns json. 404 if not found
router.put('/:id', async function(req, res, next){
    try{
        let {amt, paid} = req.body;
        let id = req.params.id;
        let paidDate = null;

        const result = await db.query(`SELECT paid FROM invoices WHERE id=$1`, [id]);
        
        //Invoice doesnt exist
        if(result.rows.length === 0){
            throw new ExpressError(`Invoice does not exist: ${id}`, 404);
        }

        const currInvoice = result.rows[0].paid_date;
        if(!currInvoice && paid){
            //If no paid date and invoice paid - set as date
            paidDate = new Date();
        }else if(!paid){
            //If not paid
            paidDate = null;
        }else{
            //Set paid date to current paid date
            paidDate = currInvoice;
        }
        const updateInvoice = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 
            WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [amt, paid, paidDate, id]);

        return res.json({'invoice': updateInvoice.rows[0]});

    }catch(err){
       return next(err);
    }
});

//Delete invoice. 404 if not found
router.delete('/', async function(req, res, next){
    try{
        let id = req.params.id;
        const result = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [id]);
        
        //Invoice doesnt exist
        if(result.rows.length === 0){
            throw new ExpressError(`Invoice does not exist: ${id}`, 404);
        }

        return res.json({"status": "Invoice Delete"});

    }catch(err){
       return next(err);
    }
});

module.exports = router;