const router = require('express').Router();
const request = require('request');
const uuidv1 = require('uuid/v1');
const util = require('util');
const propertiesReader = require('properties-reader');
const properties = propertiesReader('./config/properties.conf');

var db = [];

const ACCESS_TOKEN = properties.get('access_token'),
    USER_ID = properties.get('user_id'),
    POS_ID = properties.get('pos_id'),
    STORE_ID = properties.get('store_id'),
    /**Agregar el resto de la API de publicacion de ordenes en los espacios de XXX con variables declaradas previamente o con sentencias de la API */
    MP_ORDER_URL = properties.get('mp_order_basepath') + USER_ID + '/stores/' + STORE_ID + '/pos/' + POS_ID + '/orders' + '?access_token=' + ACCESS_TOKEN,
    /**Corregir la variable debajo por la API que corresponda, y reemplazar las variables XXX */
    MP_ORDERDELETE_URL = properties.get('mp_order_basepath') + USER_ID  + '/pos/' + POS_ID + '/orders' + '?access_token=' + ACCESS_TOKEN,
    MP_MERCHANT_URL = properties.get('mp_merchant_basepath') + '%d?access_token=' + ACCESS_TOKEN;


/**Creación de una orden */
router.post('/order', (req, res) => {

    /** Usar las siguientes constantes para el JSON de la orden */
    const externalReference = POS_ID + '-' + uuidv1();
    const basePath = req.protocol + '://' + req.get('host');
    const title = req.body.title;
    const description = "Prueba en Workshop";
    const unit_price = req.body.unit_price;
    const quantity = parseInt(req.body.quantity);
    const notification_url = basePath + '/api/notification';
    const expiration_date = "2023-08-22T16:34:56.559-04:00";

    let options = {
        /** Agregar en XXX la variable(url) de publicacion de orden (pista: es una variable declarada previamente) */
        uri: MP_ORDER_URL,
        /** Agregar en XXX el metodo de publicacion de orden */
        method: "PUT",
        json: true,
        body: {
            "external_reference": externalReference,
            "title": title,
            "description": description,
            "notification_url": notification_url,
            "expiration_date": expiration_date,
            "total_amount": 100.0,
            "items": [
                {
                    "sku_number": "KS955RUR",
                    "category": "FOOD",
                    "title": "Item1",
                    "description": "Item1 Mercado Pago",
                    "unit_price": unit_price,
                    "quantity": quantity,
                    "unit_measure": "unit",
                    "total_amount": 100
                }
            ],
            "sponsor": {
                "id": 446566691
            }
        }
    }
    console.log(options);

    request(options, function(err, response, body) {

        if (err || (response.statusCode !== 200 && response.statusCode !== 204)) {
            console.log(err);
            console.log(response.body);
            return res.sendStatus(500);

        } else {
            db[externalReference] = 'unknown';

            return res.status(201).json({
                "external_reference": externalReference
            });
        }
    });
});


/** Eliminación de una orden */

router.delete('/order', (req, res) => {
    /**Ingresar en el XXX la variable(url) para eliminar una orden (pista: ya la declaramos previamente) */
    request.delete(MP_ORDERDELETE_URL, function(err, response, body) {

        if (err || (response.statusCode !== 204 && response.statusCode !== 200)) {
            console.log(err);
            console.log(response.body);
            return res.sendStatus(500);

        } else {
            return res.sendStatus(204);
        }
    });
});

/**
 * Notificaciones
 */
router.post('/notification', (req, res) => {
    if (req.query.topic === 'merchant_order') {
        const id = req.query.id;

        let options = {
            /** Ingresar en XXX la variable(url) para buscar una merchant_order (pista: ya la declaramos antes) */
            uri: util.format(MP_MERCHANT_URL, id),
            /** Ingresar en XXX el metodo para buscar una merchant_order */
            method: "GET"
        }

        request(options, function(err, response, body) {

            if (err || response.statusCode !== 200) {
                console.log(err);
                console.log(response.body);

            } else {
                const order = JSON.parse(response.body);
                db[order.external_reference] = order.status;
            }
        });
    }
    /** Ingresar en XXX la respuesta que debe darse al recibir una notificacion */
    return res.sendStatus(200);
});

/**
 * Obtención del status de la orden
 */
router.get('/status', (req, res) => {
    const externalReference = req.query.external_reference;

    return res.status(200).json({
        "status": externalReference in db ? db[externalReference] : 'unknown'
    })
});

module.exports = router;