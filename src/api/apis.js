const express = require('express');
const router = express.Router();
const { authCheck } = require('./auth');
const { 
    aliexpressFullProducts, 
    aliexpressFullHistory, 
    aliexpressFullSingleProduct, 
    aliexpressStockProducts, 
    aliexpressStockHistory, 
    aliexpressStockSingleProduct
} = require('./aliexpress');
const {
    banggoodFullProducts,
    banggoodFullHistory,
    banggoodFullSingleProduct,
    banggoodStockProducts,
    banggoodStockHistory,
    banggoodStockSingleProduct
} = require('./banggood');
const {
    gearbestFullProducts,
    gearbestFullHistory,
    gearbestFullSingleProduct,
    gearbestStockProducts,
    gearbestStockHistory,
    gearbestStockSingleProduct
} = require('./gearbest');
const {
    emmaFullProducts,
    emmaFullHistory,
    emmaFullSingleProduct
} = require('./emma');
const {
    sheinFullProducts,
    sheinFullHistory,
    sheinFullSingleProduct,
    sheinStockProducts,
    sheinStockHistory,
    sheinStockSingleProduct
} = require('./shein');

require('dotenv').config();

// Aliexpress
router.post("/aliexpress/full-products", authCheck, aliexpressFullProducts);

router.post("/aliexpress/full-history", authCheck, aliexpressFullHistory);

router.get("/aliexpress/full-product/:productCode", authCheck, aliexpressFullSingleProduct);

router.post("/aliexpress/stock-products", authCheck, aliexpressStockProducts);

router.post("/aliexpress/stock-history", authCheck, aliexpressStockHistory);

router.get("/aliexpress/stock-product/:productCode", authCheck, aliexpressStockSingleProduct);

// Banggood
router.post("/banggood/stock-products", authCheck, banggoodStockProducts);

router.post("/banggood/stock-history", authCheck, banggoodStockHistory);

router.get("/banggood/stock-product/:productId", authCheck, banggoodStockSingleProduct);

router.post("/banggood/full-products", authCheck, banggoodFullProducts);

router.post("/banggood/full-history", authCheck, banggoodFullHistory);

router.get("/banggood/full-product/:productId", authCheck, banggoodFullSingleProduct);

// Gearbest
router.post("/gearbest/full-products", authCheck, gearbestFullProducts);

router.post("/gearbest/full-history", authCheck, gearbestFullHistory);

router.get("/gearbest/full-product/:productId", authCheck, gearbestFullSingleProduct);

router.post("/gearbest/stock-products", authCheck, gearbestStockProducts);

router.post("/gearbest/stock-history", authCheck, gearbestStockHistory);

router.get("/gearbest/stock-product/:productId", authCheck, gearbestStockSingleProduct);

// Emma
router.post("/emma/full-products", authCheck, emmaFullProducts);

router.post("/emma/full-history", authCheck, emmaFullHistory);

router.get("/emma/full-product/:productId", authCheck, emmaFullSingleProduct);

// Shein
router.post("/shein/stock-products", authCheck, sheinStockProducts);

router.post("/shein/stock-history", authCheck, sheinStockHistory);

router.get("/shein/stock-product/:productId", authCheck, sheinStockSingleProduct);

router.post("/shein/full-products", authCheck, sheinFullProducts);

router.post("/shein/full-history", authCheck, sheinFullHistory);

router.get("/shein/full-product/:productId", authCheck, sheinFullSingleProduct);

module.exports = { router };
